import { useCallback, useEffect, useState } from "react";
import { getPrescriptionQueue, flagPrescriptionIssue } from "../../services/api.js";
import { findClientInteractions } from "../../utils/prescriptionSafety.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { printHtml } from "../../utils/printUtils.js";
import { formatDoctorName } from "../../utils/doctorName.js";

const STATUS_META = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  verification_required: { label: "Needs Verification", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  on_hold: { label: "On Hold", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  ready: { label: "Ready for Pickup", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  dispensed: { label: "Dispensed", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const printMedicationLabel = (rx) => {
  const rxNum = `RX-${String(rx._id).slice(-6).toUpperCase()}`;
  const medsList = rx.medicines || rx.medications || [];
  const medsHtml = medsList
    .map(
      (m, idx) => `
      <div style="padding: 4px 0; border-bottom: 1px dashed #cbd5e1; font-size: 11px;">
        <strong style="color: #0f172a;">${idx + 1}. ${m.name || "Medicine"}</strong>
        <div style="color: #475569; font-size: 10px;">Dosage: ${m.dosage || "1 dose"} · ${m.frequency || "Once daily"} · ${m.duration || "5 days"}</div>
        ${m.instructions ? `<div style="color: #0284c7; font-size: 9px; font-style: italic;">Note: ${m.instructions}</div>` : ""}
      </div>
    `
    )
    .join("");

  const labelHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Medication Label - ${rxNum}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: 90mm 130mm; margin: 5mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 8px; }
          .hdr { border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-bottom: 6px; text-align: center; }
          .h-title { font-size: 13px; font-weight: 800; color: #0369a1; }
          .h-sub { font-size: 8px; color: #64748b; text-transform: uppercase; }
          .rx-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 10px; }
          .caution { margin-top: 8px; padding: 5px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; font-size: 8px; color: #92400e; text-align: center; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div class="h-title">NIVORA CARE HOSPITAL</div>
          <div class="h-sub">Clinical Pharmacy Dispensary • Official Label</div>
        </div>
        <div class="rx-info">
          <div><strong>Rx:</strong> ${rxNum} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</div>
          <div><strong>Patient:</strong> ${rx.patient?.name || "Patient"}</div>
          <div><strong>Prescriber:</strong> ${formatDoctorName(rx.doctor?.name, "Consultant")}</div>
        </div>
        <div style="font-weight: bold; font-size: 10px; color: #0369a1; text-transform: uppercase; margin-bottom: 4px;">
          Dispensed Medications:
        </div>
        <div>${medsHtml || '<div style="font-size: 10px; color: #64748b;">No medication items</div>'}</div>
        <div class="caution">
          ⚠ Keep out of reach of children. Store in a cool, dry place away from sunlight.
        </div>
      </body>
    </html>
  `;

  printHtml(labelHtml, { title: `Medication Label - ${rxNum}` });
};

const PharmacistVerificationWorkbench = () => {
  const [queue, setQueue] = useState([]);
  const [activeRx, setActiveRx] = useState(null);
  const [verification, setVerification] = useState({ passed: [], failed: [], warnings: [] });
  const [isVerifying, setIsVerifying] = useState(false);
  const [filters, setFilters] = useState({ status: "verification_required", search: "" });
  const [autoVerifyEnabled, setAutoVerifyEnabled] = useState(true);

  const loadQueue = useCallback(async () => {
    try {
      const res = await getPrescriptionQueue();
      setQueue(res.prescriptions || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const runClinicalCheck = (rx) => {
    const meds = (rx.medicines || []).map(m => ({ name: m.name, dose: m.dose, frequency: m.frequency }));
    const interactions = findClientInteractions(meds);
    const checks = [];

    // 1. Drug interactions
    interactions.forEach(i => checks.push({ type: "interaction", severity: "major", message: `${i.medications.join(" + ")}: ${i.message}`, meds: i.medications }));

    // 2. Duplicate therapy (same class)
    const classes = {};
    meds.forEach(m => {
      const cls = inferDrugClass(m.name);
      if (cls && classes[cls]) {
        checks.push({ type: "duplicate_class", severity: "moderate", message: `Duplicate therapy: ${cls} (${classes[cls].name} + ${m.name})`, meds: [classes[cls].name, m.name] });
      } else if (cls) {
        classes[cls] = m;
      }
    });

    // 3. High dose alerts (simplified)
    meds.forEach(m => {
      const max = maxDailyDose(m.name, m.dose);
      if (max && m.dose && parseFloat(m.dose) > max) {
        checks.push({ type: "high_dose", severity: "major", message: `${m.name} dose ${m.dose} exceeds max daily ${max}`, meds: [m.name] });
      }
    });

    // 4. Renal/hepatic adjustments (placeholder - would need patient labs)
    checks.push({ type: "renal_check", severity: "info", message: "Verify renal function for renally cleared drugs", meds: [] });

    return { passed: checks.filter(c => c.severity === "info"), failed: checks.filter(c => c.severity === "major"), warnings: checks.filter(c => c.severity === "moderate") };
  };

  const handleSelect = (rx) => {
    setActiveRx(rx);
    const checks = runClinicalCheck(rx);
    setVerification(checks);
  };

  const handleVerify = async (decision) => {
    if (!activeRx) return;
    setIsVerifying(true);
    try {
      // In production, call API: await verifyPrescription(activeRx._id, { decision, pharmacistNotes: verification.pharmacistNotes });
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const updated = { ...activeRx, dispensingStatus: decision === "verified" ? "verified" : "on_hold", pharmacistNotes: verification.pharmacistNotes };
      setQueue(q => q.map(rx => rx._id === activeRx._id ? updated : rx));
      setActiveRx(null);
      setVerification({ passed: [], failed: [], warnings: [] });
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
    } finally { setIsVerifying(false); }
  };

  const inferDrugClass = (name) => {
    const n = name.toLowerCase();
    if (n.includes("pril") || n.includes("sartan")) return "ACE/ARB";
    if (n.includes("statin")) return "Statin";
    if (n.includes("azole") || n.includes("cillin") || n.includes("mycin")) return "Antibiotic";
    if (n.includes("dipine")) return "CCB";
    if (n.includes("olol")) return "Beta-blocker";
    return null;
  };

  const maxDailyDose = (name, dose) => {
    const limits = { "paracetamol": 4000, "ibuprofen": 3200, "aspirin": 4000, "metformin": 2550, "warfarin": 10 };
    for (const [drug, max] of Object.entries(limits)) if (name.toLowerCase().includes(drug)) return max;
    return null;
  };

  const filtered = queue.filter(rx => {
    if (filters.status && filters.status !== "all" && (rx.dispensingStatus || "pending") !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return rx.patient?.name?.toLowerCase().includes(q) || rx._id?.toLowerCase().includes(q) || rx.medicines?.some(m => m.name?.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pharmacist Verification Workbench</h1>
          <p className="text-sm text-slate-600">Clinical review: interactions, dosing, duplicate therapy, renal adjustments.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoVerifyEnabled} onChange={e => setAutoVerifyEnabled(e.target.checked)} className="rounded border-slate-300" />
          Auto-run clinical checks on select
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="verification_required">Needs Verification</option>
          <option value="pending">Pending</option>
          <option value="on_hold">On Hold</option>
          <option value="ready">Ready</option>
        </select>
        <input placeholder="Search patient, Rx ID, medicine..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={loadQueue} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">🔄 Refresh</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
              <p className="text-3xl">💊</p>
              <p className="mt-2 font-semibold text-slate-700">No prescriptions in this view</p>
            </div>
          ) : (
            filtered.map(rx => {
              const status = rx.dispensingStatus || "pending";
              const meta = STATUS_META[status] || STATUS_META.pending;
              const needsVerify = status === "verification_required" || status === "pending";
              return (
                <div key={rx._id} className={`rounded-xl border p-4 transition cursor-pointer ${activeRx?._id === rx._id ? "ring-2 ring-teal-500 bg-teal-50/30" : "hover:bg-slate-50/50"} ${needsVerify ? "border-rose-200 bg-rose-50/30" : "border-slate-200"}`} onClick={() => handleSelect(rx)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                        {rx.priority === "urgent" && <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">URGENT</span>}
                        {rx.priority === "stat" && <span className="rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold animate-pulse">STAT</span>}
                      </div>
                      <p className="mt-1 font-bold text-slate-900">{rx.patient?.name || "Patient"}</p>
                      <p className="text-xs text-slate-500">{formatDoctorName(rx.doctor?.name, "—")} · {rx.medicines?.length || 0} medicines</p>
                      <p className="text-[11px] text-slate-400 font-mono">RX-{String(rx._id).slice(-6).toUpperCase()}</p>
                    </div>
                    <ActionMenu
                      triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                      items={[
                        { label: "Open Verification", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true, onClick: () => handleSelect(rx) },
                        { label: "Flag Issue", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, danger: true, onClick: () => { /* flag modal */ } },
                        { label: "Print Label", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>, onClick: () => printMedicationLabel(rx) },
                      ]}
                      align="right"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Verification Panel */}
        <div className="lg:col-span-1 space-y-4">
          {!activeRx ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-semibold text-slate-700">Select a prescription</p>
              <p className="text-sm text-slate-500">Clinical checks will run automatically</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-bold text-slate-800">{activeRx.patient?.name}</p>
                  <p className="text-xs text-slate-500">RX-{String(activeRx._id).slice(-6).toUpperCase()} · {formatDoctorName(activeRx.doctor?.name)}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_META[activeRx.dispensingStatus || "pending"]?.cls || STATUS_META.pending.cls}`}>
                  {STATUS_META[activeRx.dispensingStatus || "pending"]?.label}
                </span>
              </div>

              {/* Medicines */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeRx.medicines?.map((m, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
                    <p className="font-bold text-slate-800">{m.name} {m.dose ? `(${m.dose})` : ""}</p>
                    <p className="text-slate-600">{m.frequency} × {m.duration || ""} · {m.route || "Oral"}</p>
                  </div>
                ))}
              </div>

              {/* Clinical Checks */}
              <div className="space-y-3">
                {verification.failed.length > 0 && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="font-bold text-rose-700 flex items-center gap-1">🚨 Blocking Issues ({verification.failed.length})</p>
                    <ul className="mt-1 space-y-1 text-xs text-rose-600">
                      {verification.failed.map((c, i) => <li key={i} className="flex items-start gap-1">• {c.message}</li>)}
                    </ul>
                  </div>
                )}
                {verification.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="font-bold text-amber-700 flex items-center gap-1">⚠ Warnings ({verification.warnings.length})</p>
                    <ul className="mt-1 space-y-1 text-xs text-amber-600">
                      {verification.warnings.map((c, i) => <li key={i} className="flex items-start gap-1">• {c.message}</li>)}
                    </ul>
                  </div>
                )}
                {verification.passed.length > 0 && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="font-bold text-emerald-700 flex items-center gap-1">✓ Info ({verification.passed.length})</p>
                    <ul className="mt-1 space-y-1 text-xs text-emerald-600">
                      {verification.passed.map((c, i) => <li key={i} className="flex items-start gap-1">• {c.message}</li>)}
                    </ul>
                  </div>
                )}
                {verification.failed.length === 0 && verification.warnings.length === 0 && verification.passed.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No clinical checks run yet</p>
                )}
              </div>

              {/* Pharmacist Notes */}
              <textarea placeholder="Pharmacist notes (dose adjustment, counseling points...)" className="rounded-lg border border-slate-300 p-3 text-xs min-h-[80px] resize-none" onChange={e => setVerification(v => ({...v, pharmacistNotes: e.target.value}))} defaultValue={verification.pharmacistNotes} />

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <button disabled={isVerifying || verification.failed.length > 0} onClick={() => handleVerify("verified")} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isVerifying ? "Verifying..." : "✓ Verify & Release"}
                </button>
                <button disabled={isVerifying} onClick={() => handleVerify("on_hold")} className="flex-1 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                  ⏸ Hold / Flag
                </button>
                <button onClick={() => { setActiveRx(null); setVerification({passed: [], failed: [], warnings: []}); }} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  ✕ Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PharmacistVerificationWorkbench;
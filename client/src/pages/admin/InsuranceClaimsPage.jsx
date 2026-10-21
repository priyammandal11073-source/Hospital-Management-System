import { useCallback, useEffect, useState } from "react";
import {
  decideInsuranceClaim,
  getAdminInsuranceClaims,
} from "../../services/api.js";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const CLAIM_STATUS_META = {
  pending_verification: { label: "Pending Verification", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const InsuranceClaimsPage = () => {
  const { openPrintPreview } = usePrintModal();
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState({ counts: { pending_verification: 0, approved: 0, rejected: 0 }, pendingAmount: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState("");

  const handlePrintClaim = (claim) => {
    const ins = claim.insuranceDetails || {};
    const html = generateGeneralHospitalReportHtml({
      title: "Institutional Insurance Pre-Auth & Claim Docket",
      subtitle: `Third-Party Administrator (TPA) & Mediclaim Settlement Docket • Invoice #${String(claim._id).slice(-6).toUpperCase()}`,
      metrics: [
        { label: "Claimed Amount", value: `₹${Number(claim.totalAmount || 0).toLocaleString("en-IN")}`, color: "#0f766e" },
        { label: "Claim Status", value: (ins.status || "PENDING").replace(/_/g, " ").toUpperCase(), color: ins.status === "approved" ? "#16a34a" : "#d97706" },
        { label: "Insurance Provider", value: ins.providerName || "Corporate / TPA", color: "#1e3a8a" },
        { label: "Policy Number", value: ins.policyNumber || "N/A", color: "#475569" },
      ],
      tables: [
        {
          title: "Policyholder & Claim Authorization Details",
          headers: ["Verification Field", "Authenticated Value"],
          rows: [
            ["Beneficiary / Patient Name", claim.patient?.name || "Patient"],
            ["Insured Member Name", ins.insuredMemberName || claim.patient?.name || "Primary Insured"],
            ["Policy / Group Number", ins.policyNumber || "N/A"],
            ["Claim Reference Number", ins.claimId || `CLM-${String(claim._id).slice(-6).toUpperCase()}`],
            ["Hospital Bill Total", `₹${Number(claim.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
            ["Payment Settlement Mode", claim.paymentStatus?.replace(/_/g, " ").toUpperCase() || "PENDING"],
            ["TPA Adjudication Remarks", ins.notes || "Standard corporate hospitalization cashless claim."],
          ],
        },
      ],
      notes: "Official cashless mediclaim authorization certified under NABH/NABL hospital empanelment norms. Subject to final TPA auditor concurrence.",
    });

    openPrintPreview({
      title: `Insurance Claim - ${ins.claimId || "Claim"}`,
      htmlContent: html,
      refNumber: `INS-${String(claim._id).slice(-6).toUpperCase()}`,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminInsuranceClaims(statusFilter);
      setClaims(data.claims || []);
      setSummary(data.summary || { counts: { pending_verification: 0, approved: 0, rejected: 0 }, pendingAmount: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load insurance claims.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = async (claim, decision) => {
    if (!window.confirm(`Confirm ${decision.toUpperCase()} of ${claim.insuranceDetails?.policyNumber || "this"} claim?`)) return;
    setBusyId(claim._id);
    setError("");
    try {
      await decideInsuranceClaim(claim._id, { decision, notes: note.trim() });
      setNote("");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to process claim decision.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Insurance Claims Desk</h1>
          <p className="mt-1 text-sm text-slate-600">
            Verify patient-submitted TPA / insurance claims and settle invoices on approval.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 font-semibold text-amber-700">
            Pending: {summary.counts.pending_verification}
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-700">
            Approved: {summary.counts.approved}
          </span>
          <span className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 font-semibold text-rose-700">
            Rejected: {summary.counts.rejected}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {["", "pending_verification", "approved", "rejected"].map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
              statusFilter === value
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {value === "" ? "All" : CLAIM_STATUS_META[value].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <p className="text-3xl">🛡️</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">No insurance claims in this view</p>
          <p className="mt-1 text-xs text-slate-500">
            Insurance claims submitted by patients at billing or the patient portal appear here for TPA verification.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-2 flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Verification note (optional)</label>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Policy verified with TPA"
              className="flex-1 max-w-md rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          {claims.map((claim) => {
            const status = claim.insuranceDetails?.status;
            const statusMeta = CLAIM_STATUS_META[status] || CLAIM_STATUS_META.pending_verification;
            return (
              <div
                key={claim._id}
                className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-2xs flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{claim.patient?.name || "Patient"}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta.cls}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                    <span><span className="text-slate-400">Invoice:</span> {String(claim._id).slice(-6).toUpperCase()}</span>
                    <span><span className="text-slate-400">Amount:</span> <span className="font-bold text-slate-800">₹{Number(claim.totalAmount || 0).toFixed(2)}</span></span>
                    <span><span className="text-slate-400">Provider:</span> {claim.insuranceDetails?.providerName || "—"}</span>
                    <span><span className="text-slate-400">Policy:</span> <span className="font-mono">{claim.insuranceDetails?.policyNumber || "—"}</span></span>
                    <span><span className="text-slate-400">Claim ID:</span> <span className="font-mono">{claim.insuranceDetails?.claimId || "—"}</span></span>
                    <span><span className="text-slate-400">Insured:</span> {claim.insuranceDetails?.insuredMemberName || "—"}</span>
                  </div>
{claim.insuranceDetails?.notes && (
                    <p className="text-slate-500 truncate">📝 {claim.insuranceDetails.notes}</p>
                  )}
                  {claim.paymentStatus && (
                    <p className="text-slate-500">
                      <span className="text-slate-400">Bill status:</span> {claim.paymentStatus.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                {(() => {
                  const baseItems = [
                    {
                      label: "Print Claim",
                      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
                      onClick: () => handlePrintClaim(claim),
                    },
                    {
                      label: "Export to CSV",
                      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                      onClick: () => exportToCsv({
                        filename: `insurance-claim-${claim._id}.csv`,
                        headers: ["Field", "Value"],
                        rows: [
                          ["Patient", claim.patient?.name || ""],
                          ["Invoice #", String(claim._id).slice(-6).toUpperCase()],
                          ["Amount", Number(claim.totalAmount || 0).toFixed(2)],
                          ["Provider", claim.insuranceDetails?.providerName || ""],
                          ["Policy #", claim.insuranceDetails?.policyNumber || ""],
                          ["Claim ID", claim.insuranceDetails?.claimId || ""],
                          ["Insured", claim.insuranceDetails?.insuredMemberName || ""],
                          ["Status", claim.insuranceDetails?.status || ""],
                          ["Notes", claim.insuranceDetails?.notes || ""],
                        ],
                      }),
                    },
                    { divider: true },
                  ];
                  const actionItems = status === "pending_verification" ? [
                    {
                      label: "✓ Approve & Settle",
                      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
                      primary: true,
                      disabled: busyId === claim._id,
                      onClick: () => handleDecision(claim, "approved"),
                    },
                    {
                      label: "✕ Reject Claim",
                      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
                      danger: true,
                      disabled: busyId === claim._id,
                      onClick: () => handleDecision(claim, "rejected"),
                    },
                  ] : [
                    {
                      label: status === "approved" ? "Approved & Settled" : "Rejected",
                      icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      disabled: true,
                    },
                  ];
                  const menuItems = [...baseItems, ...actionItems];
                  return (
                    <ActionMenu
                      triggerLabel="Actions"
                      triggerIcon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      }
                      items={menuItems}
                      align="right"
                    />
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default InsuranceClaimsPage;
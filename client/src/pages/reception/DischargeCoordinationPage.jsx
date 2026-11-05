import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDischargeQueue, dischargeBed } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateDischargeSummaryHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
  Modal,
  ConfirmDialog,
} from "../../components/ui/index.js";

export default function DischargeCoordinationPage() {
  const [discharges, setDischarges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [gatePassModal, setGatePassModal] = useState(null);
  const [dischargingId, setDischargingId] = useState(null);
  const { openPrintPreview } = usePrintModal();

  const handlePrintGatePass = () => {
    if (!gatePassModal) return;
    openPrintPreview({
      title: `Discharge Clearance & Gate Pass — ${gatePassModal.patient?.name || "Patient"}`,
      htmlContent: generateDischargeSummaryHtml({
        patient: gatePassModal.patient,
        patientName: gatePassModal.patient?.name,
        uhid: gatePassModal.patient?.patientId,
        ward: `${gatePassModal.ward} — Bed ${gatePassModal.bedNumber}`,
        consultant: gatePassModal.doctor?.name ? formatDoctorName(gatePassModal.doctor.name) : "Attending Consultant",
        admissionDate: gatePassModal.admittedAt,
        dischargeDate: new Date(),
        finalDiagnosis: "Inpatient Episode Cleared — Authorized for Departure",
        instructions: "Billing, clinical clearance, and nursing discharge protocols completed. Gate pass verified by Nivora Care Hospital Central Front Desk.",
      }),
      refNumber: `GATE-${gatePassModal.bedNumber || Date.now().toString().slice(-4)}`,
    });
  };

  const loadDischarges = async () => {
    setIsLoading(true);
    try {
      const data = await getDischargeQueue();
      setDischarges(data.discharges || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load discharge queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDischarges();
  }, []);

  const handleCompleteDischarge = async (item) => {
    if (!item.isBillingCleared) {
      const confirmed = window.confirm("Billing clearance required! Patient still has unsettled invoices. Please collect outstanding charges before clearing discharge. Proceed anyway?");
      if (!confirmed) return;
    }

    const confirmed = window.confirm(`Confirm administrative clearance and vacate bed ${item.bedNumber} for ${item.patient?.name}?`);
    if (!confirmed) return;

    setDischargingId(item.bedId);
    try {
      await dischargeBed(item.bedId, {
        dischargeSummary: "Administrative front-desk billing and documentation clearance completed.",
      });
      setGatePassModal(item);
      loadDischarges();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      document.body.insertAdjacentHTML("beforeend", `<div class="fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl">Failed to complete discharge: ${msg}</div>`);
      setTimeout(() => document.querySelector(".fixed.top-6.right-6")?.remove(), 4000);
    } finally {
      setDischargingId(null);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="Discharge Administration & Clearance Desk"
        subtitle="Coordinate inpatient departures, verify cashier billing settlement, issue gate passes, and release beds for housekeeping."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span><span className="text-xs font-bold uppercase tracking-wider text-teal-600">Inpatient Coordination</span></span>}
        actions={[
          <Link
            to="/billing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <span>🧾</span>
            <span>Cashier Counter</span>
          </Link>,
        ]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading discharge clearance queue…
          </div>
        ) : discharges.length === 0 ? (
          <EmptyStateCard
            icon="🏥"
            title="No inpatients currently pending discharge"
            description="All admitted patients are continuing clinical care or have been vacated."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Bed / Ward</th>
                  <th className="py-3.5 px-4">Patient Details</th>
                  <th className="py-3.5 px-4">Attending Doctor</th>
                  <th className="py-3.5 px-4">Admission Period</th>
                  <th className="py-3.5 px-4">Billing Clearance</th>
                  <th className="py-3.5 px-4 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discharges.map((item) => (
                  <tr key={item.bedId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-black text-slate-800 text-sm">{item.bedNumber}</div>
                      <div className="text-[11px] text-slate-400">{item.ward}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm">{item.patient?.name || "Patient"}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.patient?.age}y • {item.patient?.gender} • 📞 {item.patient?.contactNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{formatDoctorName(item.doctor?.name)}</div>
                      <div className="text-[11px] text-slate-500">{item.doctor?.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">
                        Admitted: {new Date(item.admittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reason: {item.admissionReason || "Inpatient Care"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isBillingCleared ? (
                        <Badge status="paid">
                          ✓ All Dues Settled
                        </Badge>
                      ) : (
                        <div>
                          <Badge status="pending">
                            ⚠️ {item.unpaidInvoicesCount} Pending Bill(s)
                          </Badge>
                          <Link to="/billing" className="block text-[11px] text-teal-600 hover:underline mt-0.5">
                            Settle at Cashier →
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button                         variant="outline"
                        size="sm"
                        disabled={dischargingId === item.bedId || !item.isBillingCleared}
                        onClick={() => handleCompleteDischarge(item)}
                        className={!item.isBillingCleared ? "border-slate-200 text-slate-400 cursor-not-allowed" : ""}
                      >
                        {dischargingId === item.bedId ? "Clearing…" : "Issue Gate Pass"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {gatePassModal && (
        <Modal
          isOpen={Boolean(gatePassModal)}
          onClose={() => setGatePassModal(null)}
          title="Official Discharge Gate Pass"
          className="max-w-md"
        >
          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-6">
            <h3 className="text-base font-black text-slate-800">NIVORA CARE HOSPITAL</h3>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Care • Trust • Healing</p>
            <div className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-300">
              OFFICIAL DISCHARGE GATE PASS
            </div>
          </div>

          <div className="space-y-2.5 my-5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <span className="font-bold text-slate-800">{gatePassModal.patient?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ward & Bed:</span>
              <span className="font-bold text-slate-800">{gatePassModal.ward} — {gatePassModal.bedNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Attending Doctor:</span>
              <span className="font-bold text-slate-800">{formatDoctorName(gatePassModal.doctor?.name)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Admission Date:</span>
              <span className="font-medium text-slate-700">{new Date(gatePassModal.admittedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Discharge Cleared At:</span>
              <span className="font-medium text-slate-700">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-400">Billing Clearance:</span>
              <span className="font-extrabold text-emerald-700">PAID & VERIFIED</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 leading-tight border-t border-dashed border-slate-200 pt-3">
            This gate pass confirms all administrative, billing, and pharmacy dues have been settled. Security personnel may allow hospital departure.
          </p>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setGatePassModal(null)}>
              Close
            </Button>
            <Button size="sm" onClick={handlePrintGatePass}>
              Print Gate Pass
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

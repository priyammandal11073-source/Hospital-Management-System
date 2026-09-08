import { useState, useEffect } from "react";
import { getInpatientsWithCare, getBeds, getPatientTransfers, createPatientTransfer, updatePatientTransferStatus } from "../../services/api.js";

export default function PatientTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [inpatients, setInpatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    patient: "",
    fromBed: "",
    fromWard: "",
    fromBedNumber: "",
    toBed: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    let isCurrent = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [transfersData, inpatientsData, bedsData] = await Promise.all([
          getPatientTransfers(),
          getInpatientsWithCare(),
          getBeds(),
        ]);
        if (isCurrent) {
          setTransfers(transfersData.transfers || []);
          const inList = inpatientsData.inpatients || [];
          setInpatients(inList);
          setBeds(bedsData.beds || []);
          if (inList.length > 0) {
            setForm((f) => ({
              ...f,
              patient: inList[0].patient._id,
              fromBed: inList[0].bedId,
              fromWard: inList[0].ward,
              fromBedNumber: inList[0].bedNumber,
            }));
          }
        }
      } catch (err) {
        if (isCurrent) setError("Failed to fetch transfer data");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchData();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const handlePatientChange = (patientId) => {
    const selected = inpatients.find((item) => item.patient._id === patientId);
    if (selected) {
      setForm((f) => ({
        ...f,
        patient: patientId,
        fromBed: selected.bedId,
        fromWard: selected.ward,
        fromBedNumber: selected.bedNumber,
      }));
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.toBed || !form.reason.trim()) {
      alert("Please select a patient, destination bed, and transfer reason.");
      return;
    }

    const destBed = beds.find((b) => b._id === form.toBed);
    try {
      await createPatientTransfer({
        patient: form.patient,
        fromBed: form.fromBed,
        fromWard: form.fromWard,
        fromBedNumber: form.fromBedNumber,
        toBed: form.toBed,
        toWard: destBed?.ward || "General Ward",
        toBedNumber: destBed?.bedNumber || "BED",
        reason: form.reason,
        notes: form.notes,
      });

      setIsModalOpen(false);
      setForm((f) => ({ ...f, toBed: "", reason: "", notes: "" }));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to submit transfer request: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updatePatientTransferStatus(id, { status });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const availableBeds = beds.filter((b) => b.status === "available");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Patient Bed & Ward Transfer Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage inter-ward patient transitions, ICU-to-stepdown transfers, room upgrades, and transfer history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 text-xs transition shadow-2xs"
        >
          + Request Patient Transfer
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading transfers...</div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">{error}</div>
      ) : transfers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">⇄</span>
          <h3 className="text-sm font-bold text-slate-800">No transfer requests active</h3>
          <p className="mt-1 text-xs text-slate-500">All admitted patients are in their designated ward beds.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((tr) => (
            <div
              key={tr._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{tr.patient?.name || "Patient"}</span>
                  <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-0.5 text-xs font-bold">
                    {tr.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    From: {tr.fromWard} ({tr.fromBedNumber})
                  </span>
                  <span>→</span>
                  <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                    To: {tr.toWard} ({tr.toBedNumber})
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Reason:</span> {tr.reason}
                </p>

                <div className="text-[11px] text-slate-400 font-mono">
                  Requested by {tr.requestedByName} on {new Date(tr.createdAt).toLocaleString("en-IN")}
                  {tr.approvedByName && ` • Approved by ${tr.approvedByName}`}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                {tr.status === "Requested" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(tr._id, "Approved")}
                    className="rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3 py-1.5 text-xs transition"
                  >
                    ✓ Approve Transfer
                  </button>
                )}
                {tr.status === "Approved" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(tr._id, "Completed")}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-1.5 text-xs transition shadow-2xs"
                  >
                    Complete Bed Move
                  </button>
                )}
                {tr.status === "Completed" && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
                    ✓ Transferred
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Request Modal */}
      {isModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Request Patient Bed Transfer</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Inpatient to Transfer</label>
                <select
                  value={form.patient}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {inpatients.map((item) => (
                    <option key={item.patient._id} value={item.patient._id}>
                      {item.patient.name} — Current Bed: {item.bedNumber} ({item.ward})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Target Destination Bed (Available Beds)</label>
                <select
                  value={form.toBed}
                  required
                  onChange={(e) => setForm({ ...form, toBed: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select an available hospital bed...</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bedNumber} — {b.ward} ({b.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU step-down to general ward, room upgrade, isolation requirement..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Clinical Handover Notes</label>
                <textarea
                  rows="2"
                  placeholder="Oxygen requirements, mobility status during transfer..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold shadow-2xs"
                >
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

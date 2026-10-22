import { useState } from "react";
import { transferBed } from "../services/api.js";
import { getDoctorDisplayName } from "../utils/doctorName.js";

const TRANSFER_REASONS = [
  "Condition stabilized — step-down to General Ward",
  "Clinical deterioration — urgent transfer to ICU",
  "Patient request for Private Deluxe Room",
  "Shifted to isolation protocol",
  "Post-operative observation in recovery",
];

function TransferBedModal({ sourceBed, allBeds, onClose, onSuccess }) {
  const [selectedTargetBedId, setSelectedTargetBedId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const patient = sourceBed.currentAdmission?.patient || {};
  const doctor = sourceBed.currentAdmission?.attendingDoctor || {};

  // Available candidate beds
  const availableBeds = allBeds.filter(
    (b) => b._id !== sourceBed._id && b.status === "available"
  );

  const selectedTargetBed = availableBeds.find((b) => b._id === selectedTargetBedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedTargetBedId) {
      setErrorMsg("Please select a destination bed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await transferBed(sourceBed._id, {
        targetBedId: selectedTargetBedId,
        transferReason: transferReason.trim(),
      });
      onSuccess?.(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to transfer patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 overflow-y-auto animate-backdrop-fade">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold text-lg border border-purple-200">
              ⇄
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Transfer patient from {sourceBed.bedNumber}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Shift patient to a different bed or ward
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all active:scale-90 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Current Patient Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Currently admitted patient
            </p>
            <p className="text-base font-extrabold text-slate-900">
              {patient.name || "Patient"} ({patient.age || "—"}y / {patient.gender || "—"})
            </p>
            <p className="text-xs text-slate-700 font-medium mt-1">
              Current bed: <span className="font-bold text-teal-700">{sourceBed.bedNumber}</span> ({sourceBed.ward}) • Rate: ₹{sourceBed.dailyRate}/day
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Attending physician: {getDoctorDisplayName(doctor, "Consultant")} ({doctor.specialization || "Medicine"})
            </p>
          </div>

          {/* Destination Bed Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Select destination bed * ({availableBeds.length} available)
            </label>
            {availableBeds.length === 0 ? (
              <p className="p-3 text-xs font-bold text-rose-800 bg-rose-50 rounded-xl border border-rose-200">
                No available beds currently in the hospital. Please discharge or mark beds ready first.
              </p>
            ) : (
              <select
                value={selectedTargetBedId}
                onChange={(e) => setSelectedTargetBedId(e.target.value)}
                required
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-purple-600 focus:outline-hidden"
              >
                <option value="">Choose an available bed</option>
                {availableBeds.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bedNumber} — {b.ward} ({b.floor}) [₹{b.dailyRate}/day]
                    {b.features?.hasVentilator ? " • Ventilator" : ""}
                    {b.features?.hasOxygen ? " • Oxygen" : ""}
                  </option>
                ))}
              </select>
            )}

            {selectedTargetBed && (
              <div className="mt-2 p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-950 font-semibold">
                New location: <strong className="font-extrabold">{selectedTargetBed.bedNumber}</strong> ({selectedTargetBed.ward}, {selectedTargetBed.floor}) • Daily rate: ₹{selectedTargetBed.dailyRate}/day
              </div>
            )}
          </div>

          {/* Transfer Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Clinical reason for transfer
            </label>
            <input
              type="text"
              placeholder="e.g. Condition stabilized, shifting to General Ward"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:outline-hidden"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TRANSFER_REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTransferReason(r)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200 transition-colors"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-500">
            Note: Once transferred, bed {sourceBed.bedNumber} will automatically be transitioned to housekeeping / cleaning status.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableBeds.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Transferring...</span>
                </>
              ) : (
                <span>Confirm transfer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransferBedModal;

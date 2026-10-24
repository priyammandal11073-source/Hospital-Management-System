import { useState } from "react";
import { dischargeBed } from "../services/api.js";
import { getDoctorDisplayName } from "../utils/doctorName.js";

const DISCHARGE_SUMMARIES = [
  "Patient recovered well; discharged with oral medications & home rest",
  "Vitals stabilized; scheduled for outpatient follow-up in 7 days",
  "Transferred to home care with nebulization instructions",
  "Post-operative recovery uneventful; wound healing well",
];

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function DischargeBedModal({ bed, onClose, onSuccess }) {
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [generateBill, setGenerateBill] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const admission = bed.currentAdmission || {};
  const patient = admission.patient || {};
  const doctor = admission.attendingDoctor || {};

  const admittedDate = admission.admittedAt ? new Date(admission.admittedAt) : new Date();
  const now = new Date();
  const diffDays = Math.max(1, Math.ceil((now.getTime() - admittedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const dailyRate = bed.dailyRate || 1000;
  const totalCost = diffDays * dailyRate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    setIsSubmitting(true);
    try {
      const res = await dischargeBed(bed._id, {
        dischargeSummary: dischargeSummary.trim(),
        generateBill,
      });
      onSuccess?.(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to discharge patient.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Discharge patient from {bed.bedNumber}
              </h2>
              <p className="text-xs text-slate-500">
                {bed.ward} • Final room stay calculation & housekeeping handoff
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

          {/* Patient Details */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Admitted patient
              </p>
              <p className="text-base font-extrabold text-slate-900">
                {patient.name || "Patient"} ({patient.age || "—"}y / {patient.gender || "—"})
              </p>
              {patient.abhaId && (
                <p className="text-xs font-mono text-sky-800 font-bold">
                  ABHA: {patient.abhaId}
                </p>
              )}
              <p className="text-xs text-slate-600 font-medium mt-1">
                Attending physician: {getDoctorDisplayName(doctor, "Consultant")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {bed.bedNumber}
              </span>
              <p className="text-[11px] text-slate-600 font-medium mt-1">
                Admitted on {formatDate(admission.admittedAt)}
              </p>
            </div>
          </div>

          {/* Stay & Room Tariff Calculation */}
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
              <span>Bed stay tariff calculation</span>
              <span>Rate: ₹{dailyRate}/day</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Admission date</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{formatDate(admission.admittedAt)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total billable duration</span>
                <span className="font-extrabold text-teal-800 mt-0.5 block">{diffDays} {diffDays === 1 ? "day" : "days"}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-teal-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total bed tariff</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">₹{totalCost.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Discharge Summary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Discharge summary & doctor advice
              </label>
              <span className="text-[11px] font-medium text-slate-500">Click presets below</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Patient recovered well; discharged with oral medications"
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-600 focus:outline-hidden"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DISCHARGE_SUMMARIES.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDischargeSummary(s)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Generate Bill Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="generateBillCheckbox"
              checked={generateBill}
              onChange={(e) => setGenerateBill(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="generateBillCheckbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Automatically create invoice of <strong>₹{totalCost.toLocaleString("en-IN")}</strong> in billing desk
            </label>
          </div>

          <p className="text-[11px] font-medium text-slate-500">
            Discharging will archive the stay history and automatically transition bed {bed.bedNumber} to housekeeping / cleaning status.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Processing discharge...</span>
                </>
              ) : (
                <span>Confirm discharge & free bed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DischargeBedModal;

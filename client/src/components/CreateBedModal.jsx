import { useState } from "react";
import { createBed } from "../services/api.js";

const WARDS = [
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

function CreateBedModal({ onClose, onSuccess }) {
  const [bedNumber, setBedNumber] = useState("");
  const [ward, setWard] = useState(WARDS[0]);
  const [floor, setFloor] = useState("Ground floor");
  const [dailyRate, setDailyRate] = useState(1000);
  const [hasOxygen, setHasOxygen] = useState(true);
  const [hasVentilator, setHasVentilator] = useState(false);
  const [hasMonitor, setHasMonitor] = useState(true);
  const [isIsolation, setIsIsolation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!bedNumber.trim()) {
      setErrorMsg("Please enter a bed number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBed({
        bedNumber: bedNumber.trim().toUpperCase(),
        ward,
        floor: floor.trim(),
        dailyRate: Number(dailyRate),
        features: {
          hasOxygen,
          hasVentilator,
          hasMonitor,
          isIsolation,
        },
      });
      onSuccess?.(res.bed);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create bed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 overflow-y-auto animate-backdrop-fade">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Add new hospital bed
              </h2>
              <p className="text-xs text-slate-500">
                Register a new bed in a hospital ward
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bed Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Bed Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GW-105 or ICU-04"
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                className="w-full text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden transition"
              />
            </div>

            {/* Daily Rate */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Daily Rate (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="50"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ward */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital Ward *
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden transition cursor-pointer"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Floor / Location
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd Floor, West Wing"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Features Checkboxes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Bed Equipment & Features
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 font-medium cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={hasOxygen}
                  onChange={(e) => setHasOxygen(e.target.checked)}
                  className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                />
                <span>Piped Oxygen</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 font-medium cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={hasVentilator}
                  onChange={(e) => setHasVentilator(e.target.checked)}
                  className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                />
                <span>Ventilator Ready</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 font-medium cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={hasMonitor}
                  onChange={(e) => setHasMonitor(e.target.checked)}
                  className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                />
                <span>Telemetry Monitor</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 font-medium cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={isIsolation}
                  onChange={(e) => setIsIsolation(e.target.checked)}
                  className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                />
                <span>Isolation Unit</span>
              </label>
            </div>
          </div>

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
                  <span>Adding bed...</span>
                </>
              ) : (
                <span>Add Bed</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBedModal;

import { useState } from "react";
import { reprintDiagnosticReport } from "../../services/api.js";
import { printClinicalReport } from "../../utils/printReport.js";

const PRESET_REASONS = [
  "Patient requested another copy",
  "Original hardcopy damaged or lost",
  "Printer paper jam / device malfunction",
  "Ordering Doctor requested duplicate",
  "Insurance / Administrative claim requirement",
  "Legal or Medical Board compliance copy",
];

export default function ReprintModal({ isOpen, onClose, report, onReprintSuccess }) {
  if (!isOpen || !report) return null;

  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [copies, setCopies] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      setError("Please specify a reason for reprinting this diagnostic document.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await reprintDiagnosticReport(report._id, {
        reason: finalReason,
        copies: parseInt(copies) || 1,
      });

      if (res.success) {
        if (onReprintSuccess) {
          onReprintSuccess(res.data);
        }
        onClose();
        printClinicalReport(res.data || report);
      }
    } catch (err) {
      console.error("Reprint error:", err);
      setError(err.response?.data?.message || "Failed to process reprint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-lg">
              🖨️
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Authorized Document Reprint
              </h2>
              <p className="text-xs text-slate-500">
                Report #{report.reportNumber} • Patient: {report.patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Reason for Reprint (ISO 15189 Audit Requirement) *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other reason (specify below)...</option>
            </select>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specify Custom Reason *
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter clinical or administrative reason for reprint..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Number of Copies
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
            <span className="font-bold">⚠️ Compliance Note:</span> This action will be permanently recorded in the <strong>Diagnostic Print History</strong> with your user credentials, timestamp, and audit reason.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Authorizing..." : "Authorize & Print"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

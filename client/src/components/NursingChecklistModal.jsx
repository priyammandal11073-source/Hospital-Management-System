import { useState } from "react";
import { updateAppointmentChecklist, updateAppointmentStatus } from "../services/api.js";

const DEFAULT_CHECKLIST_ITEMS = [
  "Pre-consultation vital signs recorded & verified",
  "Known drug allergies & medical history cross-checked",
  "Fasting / pre-examination preparation confirmed",
  "Patient ready in waiting / consultation area",
];

export default function NursingChecklistModal({
  appointment,
  onClose,
  onUpdated,
  onOpenVitals,
}) {
  const [checklist, setChecklist] = useState(() => {
    if (appointment?.prepChecklist && appointment.prepChecklist.length > 0) {
      return appointment.prepChecklist;
    }
    return DEFAULT_CHECKLIST_ITEMS.map((label) => ({
      label,
      isDone: false,
    }));
  });

  const [newItemText, setNewItemText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!appointment) return null;

  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};

  const handleToggle = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, isDone: !item.isDone, checkedAt: !item.isDone ? new Date() : undefined }
          : item
      )
    );
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setChecklist((prev) => [...prev, { label: newItemText.trim(), isDone: false }]);
    setNewItemText("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await updateAppointmentChecklist(appointment._id, checklist);
      setSuccessMsg("Checklist saved successfully.");
      if (onUpdated) onUpdated(res.appointment);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCallInPatient = async () => {
    setIsSaving(true);
    setError("");
    try {
      // Save checklist first
      await updateAppointmentChecklist(appointment._id, checklist);
      // Then mark status in_consultation
      const res = await updateAppointmentStatus(appointment._id, "in_consultation");
      setSuccessMsg("Patient called in and marked 'In consultation'!");
      if (onUpdated) onUpdated(res.appointment);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update patient queue status.");
    } finally {
      setIsSaving(false);
    }
  };

  const allCompleted = checklist.length > 0 && checklist.every((item) => item.isDone);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-xl font-bold">
              📋
            </div>
            <div>
              <span className="rounded bg-blue-400/20 text-blue-200 px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide">
                Nursing Intake & Triage
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Pre-Procedure Clinical Checklist
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Patient & Appointment Banner */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500">Patient: </span>
            <span className="font-bold text-slate-900 text-sm">{patient.name || "Patient"}</span>
            <span className="text-slate-500 ml-2">
              ({patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"})
            </span>
          </div>
          <div>
            <span className="text-slate-500">Doctor: </span>
            <span className="font-semibold text-slate-700">Dr. {doctor.name || "Physician"}</span>
          </div>
          <div>
            <span className="text-slate-500">Time: </span>
            <span className="font-semibold text-blue-700">{appointment.timeSlot}</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {successMsg}
            </div>
          )}

          {/* Reason for visit */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-xs text-slate-700 flex items-start gap-2">
            <span className="text-base">🩺</span>
            <div>
              <strong className="text-blue-900">Chief Complaint / Reason for visit:</strong>
              <p className="mt-0.5 text-slate-600">{appointment.reasonForVisit || "General Consultation"}</p>
            </div>
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Readiness Items ({checklist.filter((i) => i.isDone).length}/{checklist.length})
              </h3>
              {onOpenVitals && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVitals(patient);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition shadow-2xs"
                >
                  <span>📊 Record Vitals First</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {checklist.map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    item.isDone
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={() => handleToggle(idx)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={`text-xs font-medium flex-1 ${item.isDone ? "line-through opacity-80" : ""}`}>
                    {item.label}
                  </span>
                  {item.isDone && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      ✓ Cleared
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Add custom checklist item */}
            <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Add custom pre-check (e.g. ECG done, fasting sugar measured)..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                + Add Item
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Checklist"}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleCallInPatient}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white transition shadow-xs disabled:opacity-50 ${
                allCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {allCompleted ? "✓ Call In Patient (All Cleared)" : "Call In to Doctor →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

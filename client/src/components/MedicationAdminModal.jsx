import { useState } from "react";
import { administerMedication } from "../services/api.js";
import { getDoctorDisplayName } from "../utils/doctorName.js";

export default function MedicationAdminModal({ prescription, onClose, onUpdated }) {
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [status, setStatus] = useState("given");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!prescription) return null;

  const medications = prescription.medications || [];
  const administrations = prescription.administrations || [];
  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};

  const handleAdminister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await administerMedication(prescription._id, {
        medicationIndex: selectedMedIndex,
        status,
        notes,
      });
      setSuccessMsg(res.message || "Dose administration recorded.");
      setNotes("");
      if (onUpdated) {
        onUpdated(res.prescription || prescription);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to record dose administration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (st) => {
    switch (st) {
      case "given":
        return "bg-emerald-50 text-emerald-700 ring-emerald-500/20";
      case "held":
        return "bg-amber-50 text-amber-700 ring-amber-500/20";
      case "refused":
        return "bg-rose-50 text-rose-700 ring-rose-500/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-500/20";
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-xl font-bold">
              💊
            </div>
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="rounded bg-teal-400/20 text-teal-200 px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide">
                  eMAR Dose Tracker
                </span>
                <span className="text-xs text-teal-100/75">
                  Rx #{prescription.prescriptionNumber}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Medication Administration Record
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

        {/* Patient & Doctor Banner */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-500">Patient: </span>
            <span className="font-bold text-slate-800 text-sm">{patient.name || "Patient"}</span>
            <span className="text-slate-500 ml-2">
              ({patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"})
            </span>
          </div>
          <div>
            <span className="text-slate-500">Prescribing Physician: </span>
            <span className="font-semibold text-slate-700">{getDoctorDisplayName(doctor, "Specialist")}</span>
          </div>
          <div>
            <span className="text-slate-500">Diagnosis: </span>
            <span className="font-semibold text-teal-700">{prescription.diagnosis || "Under Care"}</span>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
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

          {/* Form to Administer Selected Dose */}
          <div className="rounded-xl border border-teal-200/70 bg-teal-50/30 p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-teal-600"></span>
              Log Dose Given / Clinical Administration
            </h3>

            <form onSubmit={handleAdminister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Medication
                  </label>
                  <select
                    value={selectedMedIndex}
                    onChange={(e) => setSelectedMedIndex(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    {medications.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {m.name} — {m.dosage} ({m.frequency}, {m.timing})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administration Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("given")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        status === "given"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ✓ Given
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("held")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        status === "held"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ⏸ Held
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("refused")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        status === "refused"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ✕ Refused
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Medication Details Card */}
              {medications[selectedMedIndex] && (
                <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{medications[selectedMedIndex].name}</span>
                    <span className="text-slate-500 ml-2">Dosage: {medications[selectedMedIndex].dosage}</span>
                  </div>
                  <div className="text-slate-600">
                    Timing: <span className="font-semibold text-teal-700">{medications[selectedMedIndex].timing}</span> ({medications[selectedMedIndex].frequency})
                  </div>
                  {medications[selectedMedIndex].instructions && (
                    <div className="w-full text-slate-500 italic text-[11px]">
                      Instructions: {medications[selectedMedIndex].instructions}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nurse Clinical Remarks / Observations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patient tolerated oral dose well with water, vitals stable."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Logging Dose..." : "✓ Confirm & Log Dose Administration"}
                </button>
              </div>
            </form>
          </div>

          {/* Administration Timeline / History */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>eMAR Administration Timeline ({administrations.length})</span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">Latest doses first</span>
            </h3>

            {administrations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No doses administered yet for this prescription.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                {administrations.map((adm, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{adm.medicationName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${getStatusBadgeClass(adm.status)} capitalize`}>
                          {adm.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Administered by <strong className="text-slate-700">{adm.administeredByName || "Staff Nurse"}</strong>
                        {" • "}
                        {adm.doseTime ? new Date(adm.doseTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        {" on "}
                        {adm.doseTime ? new Date(adm.doseTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </p>
                      {adm.notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{adm.notes}"
                        </p>
                      )}
                    </div>
                    <div className="text-slate-400 text-lg">
                      {adm.status === "given" ? "💉" : adm.status === "held" ? "⏸" : "✕"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
          >
            Close eMAR
          </button>
        </div>
      </div>
    </div>
  );
}

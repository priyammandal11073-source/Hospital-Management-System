import { useState, useEffect } from "react";
import { getNurseDashboardMetrics, administerMedication } from "../../services/api.js";

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMed, setSelectedMed] = useState(null);
  const [actionType, setActionType] = useState("given"); // "given" | "held" | "refused"
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const fetchMeds = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getNurseDashboardMetrics();
        if (isCurrent) setMedications(data.medicationsDue || []);
      } catch (err) {
        if (isCurrent) setError("Failed to load medication administration record");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchMeds();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const handleOpenActionModal = (med, type) => {
    setSelectedMed(med);
    setActionType(type);
    setReason("");
    setNotes("");
  };

  const handleConfirmAdministration = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;

    if ((actionType === "held" || actionType === "refused") && !reason.trim()) {
      alert("Please provide a clinical reason for withholding or patient refusal.");
      return;
    }

    setSubmitting(true);
    try {
      await administerMedication(selectedMed.prescriptionId, {
        medicationIndex: selectedMed.medicationIndex,
        status: actionType,
        notes: reason ? `${reason}${notes ? ` | ${notes}` : ""}` : notes,
      });

      setSelectedMed(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Medication administration failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Electronic Medication Administration Record (eMAR)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Verify prescribed drug orders, administer bedside doses, and document withheld or refused medications with reasons.
        </p>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading medication schedule...</div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">{error}</div>
      ) : medications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">💊</span>
          <h3 className="text-sm font-bold text-slate-800">No medications currently scheduled</h3>
          <p className="mt-1 text-xs text-slate-500">All inpatient doses for the current shift are administered.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Patient</th>
                  <th className="px-4 py-3.5">Medication & Dosage</th>
                  <th className="px-4 py-3.5">Route & Timing</th>
                  <th className="px-4 py-3.5">Prescribed By</th>
                  <th className="px-4 py-3.5">eMAR Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medications.map((m, idx) => (
                  <tr key={`${m.prescriptionId}-${m.medicationIndex}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {m.scheduledTime}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{m.patientName}</div>
                      <span className="font-mono text-[10px] text-slate-400">{m.prescriptionNumber}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{m.medication}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{m.dosage} ({m.frequency})</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {m.route}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-medium">{m.prescribingDoctor}</td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                        m.status === "given"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.status === "held"
                          ? "bg-amber-100 text-amber-800"
                          : m.status === "refused"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-teal-100 text-teal-800 animate-pulse"
                      }`}>
                        ● {m.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {m.status === "Due" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(m, "given")}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-2xs"
                          >
                            ✓ Administer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(m, "held")}
                            className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-bold transition"
                          >
                            Hold
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenActionModal(m, "refused")}
                            className="rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 px-2.5 py-1 text-xs font-bold transition"
                          >
                            Refused
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Signed at {new Date(m.administeredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* eMAR Action Confirmation Modal */}
      {selectedMed && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === "given"
                  ? "Confirm Medication Administration"
                  : actionType === "held"
                  ? "Record Withheld Medication"
                  : "Record Patient Medication Refusal"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMed(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdministration} className="space-y-4">
              {/* Medication Verification Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <strong className="text-slate-900">{selectedMed.patientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Medication:</span>
                  <strong className="text-teal-800">{selectedMed.medication}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dosage & Route:</span>
                  <strong className="text-slate-800">{selectedMed.dosage} ({selectedMed.route})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scheduled Time:</span>
                  <strong className="text-slate-800">{selectedMed.scheduledTime}</strong>
                </div>
              </div>

              {/* Reason input (Mandatory for Held or Refused) */}
              {(actionType === "held" || actionType === "refused") && (
                <div>
                  <label className="text-xs font-bold text-rose-700 block mb-1">
                    * Clinical Reason for {actionType === "held" ? "Withholding" : "Refusal"} (Required)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      actionType === "held"
                        ? "e.g. Low BP, NPO for surgery, patient sleeping..."
                        : "e.g. Patient feels nauseous, refused injection..."
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-rose-300 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nurse Observation Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Bedside observation, water taken, vitals before dose..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMed(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-2xs ${
                    actionType === "given"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionType === "held"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "Signing eMAR..." : "Sign & Record Dose"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

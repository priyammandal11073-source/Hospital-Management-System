import { useState, useEffect } from "react";
import { getHandovers, createHandover, acknowledgeHandover, getInpatientsWithCare } from "../../services/api.js";

export default function NurseHandoverPage() {
  const [handovers, setHandovers] = useState([]);
  const [inpatients, setInpatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history"); // "history" | "new"
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [shiftType, setShiftType] = useState("Morning");
  const [ward, setWard] = useState("General Ward");
  const [generalNotes, setGeneralNotes] = useState("");
  const [patientSummaries, setPatientSummaries] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [handoverData, inpatientData] = await Promise.all([
        getHandovers(),
        getInpatientsWithCare(),
      ]);
      setHandovers(handoverData.handovers || []);
      const patients = inpatientData.inpatients || [];
      setInpatients(patients);

      // Prepopulate form summaries from inpatients
      setPatientSummaries(
        patients.map((p) => ({
          patient: p.patientId,
          patientName: p.patientName,
          bedNumber: p.bedNumber,
          conditionSummary: `${p.severityLevel} severity. Admitted for ${p.admissionReason || "medical care"}.`,
          pendingIssues: p.pendingTasksCount > 0 ? `${p.pendingTasksCount} tasks pending.` : "Stable for shift transition.",
        }))
      );
    } catch (err) {
      setErrorMsg("Failed to load handover records and inpatients.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePatientSummary = (idx, field, value) => {
    setPatientSummaries((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      await createHandover({
        shiftType,
        ward,
        generalNotes,
        patientsSummary: patientSummaries,
      });

      setSuccessMsg("Shift handover report submitted successfully.");
      setActiveTab("history");
      setGeneralNotes("");
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to submit shift handover.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeHandover(id);
      setSuccessMsg("Handover acknowledged and accepted into duty station.");
      fetchData();
    } catch (err) {
      setErrorMsg("Failed to acknowledge handover.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">🔄</span>
            Clinical Shift Handover & Continuity of Care
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Structured SBAR shift transitions, pending critical actions, and incoming nurse digital sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-colors ${
              activeTab === "new"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            + Draft Shift Handover
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-colors ${
              activeTab === "history"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Handover Log ({handovers.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="font-bold">×</button>
        </div>
      )}

      {/* DRAFT NEW HANDOVER */}
      {activeTab === "new" && (
        <form onSubmit={handleSubmitHandover} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Outgoing Shift Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Shift Cycle
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800"
                >
                  <option value="Morning">Morning Shift (07:00 AM – 03:00 PM)</option>
                  <option value="Afternoon">Afternoon Shift (03:00 PM – 11:00 PM)</option>
                  <option value="Night">Night Shift (11:00 PM – 07:00 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Duty Ward / Station
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. General Ward & ICU"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Ward-Wide SBAR Summary & Station Notes
              </label>
              <textarea
                rows={3}
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="Overall ward situation, staffing, admissions, pending transfers, equipment alerts..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800"
              />
            </div>
          </div>

          {/* Inpatient Summaries */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                2. Inpatient Clinical Transition Notes ({patientSummaries.length})
              </h2>
              <span className="text-xs text-slate-500">Auto-populated from currently admitted patients</span>
            </div>

            {patientSummaries.length === 0 ? (
              <p className="text-slate-500 text-sm">No inpatients currently admitted.</p>
            ) : (
              <div className="space-y-4">
                {patientSummaries.map((p, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Bed {p.bedNumber} • {p.patientName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Condition / Progress Summary
                        </label>
                        <input
                          type="text"
                          value={p.conditionSummary}
                          onChange={(e) => handleUpdatePatientSummary(idx, "conditionSummary", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Pending Tasks / Critical Follow-ups
                        </label>
                        <input
                          type="text"
                          value={p.pendingIssues}
                          onChange={(e) => handleUpdatePatientSummary(idx, "pendingIssues", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Shift Handover"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* HANDOVER HISTORY & ACKNOWLEDGEMENT */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              Loading handover reports...
            </div>
          ) : handovers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              No shift handover reports recorded yet. Click "+ Draft Shift Handover" to create one.
            </div>
          ) : (
            handovers.map((h) => {
              const isAcknowledged = h.status === "Acknowledged";
              return (
                <div
                  key={h._id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {h.shiftType} Shift Handover • {h.ward}
                        </div>
                        <div className="text-xs text-slate-500">
                          Handed over by Nurse <strong>{h.outgoingNurseName || h.outgoingNurse?.name || "Staff"}</strong> on{" "}
                          {new Date(h.createdAt).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isAcknowledged
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isAcknowledged ? "✓ Acknowledged" : "Pending Incoming Sign-Off"}
                      </span>

                      {!isAcknowledged && (
                        <button
                          onClick={() => handleAcknowledge(h._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                        >
                          Acknowledge & Accept Handover
                        </button>
                      )}
                    </div>
                  </div>

                  {h.generalNotes && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                      <strong>General Ward Notes:</strong> {h.generalNotes}
                    </div>
                  )}

                  {/* Patient Summaries */}
                  {h.patientsSummary && h.patientsSummary.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Patient Rosters Handed Over ({h.patientsSummary.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {h.patientsSummary.map((ps, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1"
                          >
                            <div className="font-bold text-slate-800">
                              Bed {ps.bedNumber} • {ps.patientName}
                            </div>
                            <div className="text-slate-600">
                              <strong>Status:</strong> {ps.conditionSummary}
                            </div>
                            <div className="text-amber-700">
                              <strong>Follow-up:</strong> {ps.pendingIssues}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acknowledgement Footer */}
                  {isAcknowledged && (
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>
                        Digitally signed & accepted by:{" "}
                        <strong className="text-slate-800">
                          {h.incomingNurseName || h.incomingNurse?.name || "Incoming Nurse"}
                        </strong>
                      </span>
                      <span>
                        Acknowledged At: {new Date(h.acknowledgedAt || h.updatedAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

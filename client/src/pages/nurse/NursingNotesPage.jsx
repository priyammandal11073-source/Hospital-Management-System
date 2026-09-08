import { useState, useEffect } from "react";
import { getInpatientsWithCare, getNursingNotes, createNursingNote } from "../../services/api.js";

const CATEGORIES = [
  "General Condition",
  "Clinical Intervention",
  "Wound Care & Dressing",
  "Mobility & Physical",
  "Dietary & Fluid",
  "Sleep & Rest",
  "Doctor Instructions",
  "Critical Alert",
  "Other",
];

export default function NursingNotesPage() {
  const [inpatients, setInpatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    patient: "",
    shift: "Morning",
    category: "General Condition",
    note: "",
    symptomsObserved: "",
    patientComplaints: "",
    patientResponse: "",
    isCritical: false,
  });

  useEffect(() => {
    const fetchInpatients = async () => {
      try {
        const data = await getInpatientsWithCare();
        const list = data.inpatients || [];
        setInpatients(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, patient: list[0].patient._id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInpatients();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const fetchNotes = async () => {
      setLoading(true);
      setError("");
      try {
        const filters = selectedPatientId ? { patientId: selectedPatientId } : {};
        const data = await getNursingNotes(filters);
        if (isCurrent) setNotes(data.notes || []);
      } catch (err) {
        if (isCurrent) setError("Failed to fetch nursing notes");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchNotes();
    return () => { isCurrent = false; };
  }, [selectedPatientId, refreshKey]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.note.trim()) {
      setError("Please select a patient and write the note content.");
      return;
    }

    setError("");
    setSuccess("");
    try {
      await createNursingNote(form);
      setSuccess("Nursing note recorded into clinical chart.");
      setForm((f) => ({
        ...f,
        note: "",
        symptomsObserved: "",
        patientComplaints: "",
        patientResponse: "",
        isCritical: false,
      }));
      setRefreshKey((k) => k + 1);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record nursing note");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Clinical Nursing Notes & Observations Flowsheet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Document patient condition, subjective complaints, nursing interventions, wound observations, and clinical responses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to Document New Note */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <span>📝</span> Document Nursing Note
          </h2>

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateNote} className="space-y-4">
            {/* Patient Select */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Inpatient</label>
              <select
                value={form.patient}
                onChange={(e) => setForm({ ...form, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {inpatients.map((item) => (
                  <option key={item.patient._id} value={item.patient._id}>
                    {item.patient.name} — Bed {item.bedNumber} ({item.ward})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Clinical Shift</label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Complaints */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Subjective Complaints</label>
              <input
                type="text"
                placeholder="e.g. Sharp pain at surgical site, nausea..."
                value={form.patientComplaints}
                onChange={(e) => setForm({ ...form, patientComplaints: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Symptoms Observed */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Objective Symptoms Observed</label>
              <input
                type="text"
                placeholder="e.g. Diaphoresis, shallow breathing, erythema..."
                value={form.symptomsObserved}
                onChange={(e) => setForm({ ...form, symptomsObserved: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Nursing Note Narrative */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Nursing Assessment & Intervention</label>
              <textarea
                rows="4"
                required
                placeholder="Detailed clinical observation, nursing care provided, vitals checked, doctor notified..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              ></textarea>
            </div>

            {/* Patient Response */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Patient Response to Care</label>
              <input
                type="text"
                placeholder="e.g. Pain decreased from 7 to 3, sleeping comfortably..."
                value={form.patientResponse}
                onChange={(e) => setForm({ ...form, patientResponse: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Critical Alert Checkbox */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50/50">
              <input
                type="checkbox"
                id="isCritical"
                checked={form.isCritical}
                onChange={(e) => setForm({ ...form, isCritical: e.target.checked })}
                className="h-4 w-4 rounded accent-rose-600 cursor-pointer"
              />
              <label htmlFor="isCritical" className="text-xs font-bold text-rose-800 cursor-pointer">
                Flag as Critical Nursing Observation
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 text-xs transition shadow-2xs"
            >
              Sign & Save Nursing Note
            </button>
          </form>
        </div>

        {/* Chronological Notes Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filter by Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Inpatients (Hospital-wide)</option>
                {inpatients.map((item) => (
                  <option key={item.patient._id} value={item.patient._id}>
                    {item.patient.name} ({item.bedNumber})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{notes.length} notes logged</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading nursing notes flowsheet...</div>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-xs">
              No nursing notes recorded for the selected criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n._id}
                  className={`rounded-2xl border p-5 shadow-2xs space-y-2.5 transition ${
                    n.isCritical ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{n.patient?.name || "Patient"}</span>
                      <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-xs font-bold">
                        {n.category}
                      </span>
                      <span className="text-xs text-slate-500">{n.shift} Shift</span>
                      {n.isCritical && (
                        <span className="rounded-md bg-rose-100 text-rose-700 font-bold px-2 py-0.5 text-xs">
                          🚨 Critical Alert
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(n.recordedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed">{n.note}</p>

                  {(n.symptomsObserved || n.patientComplaints || n.patientResponse) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60">
                      {n.patientComplaints && (
                        <div>
                          <span className="font-semibold text-slate-700">Complaints:</span> {n.patientComplaints}
                        </div>
                      )}
                      {n.symptomsObserved && (
                        <div>
                          <span className="font-semibold text-slate-700">Symptoms:</span> {n.symptomsObserved}
                        </div>
                      )}
                      {n.patientResponse && (
                        <div>
                          <span className="font-semibold text-slate-700">Response:</span> {n.patientResponse}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Signed by: <strong className="text-slate-600">{n.nurseName}</strong>
                    </span>
                    <span className="font-mono text-[10px]">Audit ID: {n._id.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyConsultations, getMyConsultationSummary } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

function MyConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyConsultations();
        if (active) {
          setConsultations(res.consultations || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load consultations");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const openSummary = async (id) => {
    setLoadingSummary(true);
    try {
      const res = await getMyConsultationSummary(id);
      setSelectedSummary(res);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to load consultation summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Consultation History</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Completed Visits
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review diagnoses, doctor clinical summaries, and advice from all your past hospital visits.
          </p>
        </div>

        <Link
          to="/patient/appointments/book"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs transition"
        >
          ➕ Book New Consultation
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading consultation records...</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            🩺
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No past consultations found</h3>
          <p className="mt-1 text-sm text-slate-500">
            When you complete a specialist appointment or doctor visit, your consultation summary and diagnosis will appear here.
          </p>
          <div className="mt-5">
            <Link
              to="/patient/appointments/book"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Book Specialist Visit
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {consultations.map((c) => {
            const dateStr = new Date(c.appointmentDate).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={c._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-extrabold text-base ring-1 ring-blue-500/20 flex-shrink-0">
                    🩺
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {dateStr} • {c.timeSlot}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 uppercase">
                        {c.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        {c.appointmentType || "In-person"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {formatDoctorName(c.doctor?.name, "Attending Specialist")}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700">
                      {c.doctor?.specialization || "General Medicine"}
                      {c.doctor?.department && ` • ${c.doctor.department}`}
                    </p>

                    {c.reasonForVisit && (
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Reason / Chief Complaint:</span>{" "}
                        {c.reasonForVisit}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-center">
                  <button
                    onClick={() => openSummary(c._id)}
                    disabled={loadingSummary}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs transition"
                  >
                    📄 View Visit Summary
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Consultation Summary Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Nivora Care Hospital • Outpatient Clinical Note
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Consultation Summary
                </h3>
              </div>
              <button
                onClick={() => setSelectedSummary(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Doctor</p>
                  <p className="font-bold text-slate-800">
                    {formatDoctorName(selectedSummary.appointment?.doctor?.name)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedSummary.appointment?.doctor?.specialization}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Visit Date & Slot</p>
                  <p className="font-bold text-slate-800">
                    {new Date(selectedSummary.appointment?.appointmentDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-500">{selectedSummary.appointment?.timeSlot}</p>
                </div>
              </div>

              {/* Chief Complaint / Symptoms */}
              {selectedSummary.appointment?.reasonForVisit && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chief Complaint / Reason for Visit
                  </h4>
                  <p className="mt-1 text-xs sm:text-sm text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                    {selectedSummary.appointment.reasonForVisit}
                  </p>
                </div>
              )}

              {/* Doctor Clinical Notes (non-confidential) */}
              {selectedSummary.clinicalNotes && selectedSummary.clinicalNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clinical Impression & Findings
                  </h4>
                  <div className="mt-1 space-y-2">
                    {selectedSummary.clinicalNotes.map((note) => (
                      <div key={note._id} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs sm:text-sm text-slate-800">
                        {note.diagnosis && (
                          <p className="font-bold text-blue-950 mb-1">Diagnosis: {note.diagnosis}</p>
                        )}
                        <p>{note.note || note.plan || note.assessment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions from this visit */}
              {selectedSummary.prescriptions && selectedSummary.prescriptions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Prescribed Medicines
                  </h4>
                  <div className="mt-1 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {selectedSummary.prescriptions.map((rx) => (
                      <div key={rx._id} className="p-3 bg-white">
                        {rx.medicines?.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs py-1">
                            <div>
                              <strong className="text-slate-800">{m.name}</strong> ({m.dosage})
                              <span className="text-slate-500 ml-2">Freq: {m.frequency}</span>
                            </div>
                            <span className="text-slate-500">{m.duration}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Reports from this visit */}
              {selectedSummary.labReports && selectedSummary.labReports.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Diagnostic Tests Ordered
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedSummary.labReports.map((lab) => (
                      <span
                        key={lab._id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200"
                      >
                        🔬 {lab.testName} ({lab.status})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedSummary(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyConsultations;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyConsultations, getMyConsultationSummary } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

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
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Care Visits", to: "/patient/appointments" },
          { label: "Consultation History", active: true },
        ]}
        title="My Consultation History"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Completed Visits
          </span>
        }
        subtitle="Review diagnoses, doctor clinical summaries, and advice from all your past hospital visits."
        actions={
          <Link
            to="/patient/appointments/book"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95"
          >
            <span>➕ Book New Consultation</span>
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading consultation records...</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
            🩺
          </div>
          <h3 className="text-sm font-bold text-slate-800">No past consultations found</h3>
          <p className="mt-1 text-xs text-slate-500">
            When you complete a specialist appointment or doctor visit, your consultation summary and diagnosis will appear here.
          </p>
          <div className="mt-4">
            <Link
              to="/patient/appointments/book"
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 inline-block"
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
                className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-black text-sm shadow-2xs flex-shrink-0">
                    🩺
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {dateStr} • {c.timeSlot}
                      </span>
                      <span className="rounded-full liquid-glass-pill bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {c.status}
                      </span>
                      <span className="rounded-full liquid-glass-pill bg-slate-50 text-slate-700 border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {c.appointmentType || "In-person"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {formatDoctorName(c.doctor?.name, "Attending Specialist")}
                    </h3>
                    <p className="text-xs font-semibold text-teal-800">
                      {c.doctor?.specialization || "General Medicine"}
                      {c.doctor?.department && ` • ${c.doctor.department}`}
                    </p>

                    {c.reasonForVisit && (
                      <p className="mt-1 text-xs text-slate-600">
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
                    className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 shadow-2xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl liquid-glass-card border border-slate-200/80 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Nivora Care Hospital • Outpatient Clinical Note
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Consultation Summary
                </h3>
              </div>
              <button
                onClick={() => setSelectedSummary(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50/70 p-4 border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctor</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {formatDoctorName(selectedSummary.appointment?.doctor?.name)}
                  </p>
                  <p className="text-xs text-teal-800 font-semibold">
                    {selectedSummary.appointment?.doctor?.specialization}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visit Date & Slot</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {new Date(selectedSummary.appointment?.appointmentDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{selectedSummary.appointment?.timeSlot}</p>
                </div>
              </div>

              {/* Chief Complaint / Symptoms */}
              {selectedSummary.appointment?.reasonForVisit && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Chief Complaint / Reason for Visit
                  </h4>
                  <p className="mt-1 text-xs text-slate-800 bg-white/90 p-3 rounded-xl border border-slate-200/80">
                    {selectedSummary.appointment.reasonForVisit}
                  </p>
                </div>
              )}

              {/* Doctor Clinical Notes (non-confidential) */}
              {selectedSummary.clinicalNotes && selectedSummary.clinicalNotes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Clinical Impression & Findings
                  </h4>
                  <div className="mt-1 space-y-2">
                    {selectedSummary.clinicalNotes.map((note) => (
                      <div key={note._id} className="p-3 bg-teal-50/40 rounded-xl border border-teal-100 text-xs text-slate-800">
                        {note.diagnosis && (
                          <p className="font-bold text-teal-950 mb-1">Diagnosis: {note.diagnosis}</p>
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
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Prescribed Medicines
                  </h4>
                  <div className="mt-1 divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                    {selectedSummary.prescriptions.map((rx) => (
                      <div key={rx._id} className="p-3">
                        {rx.medicines?.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs py-1">
                            <div>
                              <strong className="text-slate-900">{m.name}</strong> ({m.dosage})
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
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Diagnostic Tests Ordered
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedSummary.labReports.map((lab) => (
                      <span
                        key={lab._id}
                        className="inline-flex items-center gap-1.5 rounded-lg liquid-glass-pill bg-purple-50 text-purple-800 border border-purple-200/70 px-2.5 py-1 text-xs font-semibold"
                      >
                        🔬 {lab.testName} ({lab.status})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedSummary(null)}
                className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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

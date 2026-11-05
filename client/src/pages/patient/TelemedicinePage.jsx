import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyTelemedicine } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-800 border-amber-200/70",
  confirmed: "bg-teal-50 text-teal-800 border-teal-200/70",
  checked_in: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
  waiting: "bg-violet-50 text-violet-700 border-violet-200/70",
  in_consultation: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
};

const TelemedicinePage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyTelemedicine();
      setAppointments(data.appointments || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load teleconsultation schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Telemedicine", active: true },
        ]}
        title="Telemedicine & Remote Care"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Virtual Visits
          </span>
        }
        subtitle="Secure encrypted video consultations with hospital specialists from the comfort of your home."
        actions={
          <Link
            to="/patient/appointments/book"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95"
          >
            <span>➕ Book Video Consult</span>
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
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading virtual consults...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
            🎥
          </div>
          <h3 className="text-sm font-bold text-slate-800">No scheduled virtual visits</h3>
          <p className="mt-1 text-xs text-slate-500">
            Book an appointment with teleconsult selected to connect directly with your doctor online.
          </p>
          <div className="mt-4">
            <Link
              to="/patient/appointments/book"
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 inline-block"
            >
              Book Specialist Consult
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((a) => {
            const dateStr = a.appointmentDate
              ? new Date(a.appointmentDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <div
                key={a._id}
                className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-teal-800 border border-slate-200/80 font-bold text-lg shadow-2xs flex-shrink-0">
                    🎥
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {dateStr} • {a.timeSlot}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider liquid-glass-pill border ${
                          STATUS_STYLES[a.status] || "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {getDoctorDisplayName(a.doctor, "Specialist")}
                    </h3>
                    <p className="text-xs font-semibold text-teal-800">
                      {a.doctor?.specialization || "General Medicine"} • {a.doctor?.department || "Virtual OPD"}
                    </p>

                    {a.reasonForVisit && (
                      <p className="text-xs text-slate-600 mt-1">
                        Reason: {a.reasonForVisit}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95"
                  >
                    <span>Join Video Room</span>
                    <span className="text-teal-200">🎥</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TelemedicinePage;

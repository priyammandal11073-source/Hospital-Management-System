import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyTelemedicine } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  checked_in: "bg-indigo-50 text-indigo-700 border-indigo-200",
  waiting: "bg-violet-50 text-violet-700 border-violet-200",
  in_consultation: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      setError(requestError.response?.data?.message || "Unable to load your video consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isLive = (appointment) => appointment?.telemedicine?.status === "live";

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Video Consultations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Doctor consultations from home — join the secure video room when your doctor calls you in.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <p className="text-3xl">🩺</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">No upcoming video consultations</p>
          <p className="mt-1 text-xs text-slate-500">
            Book a teleconsultation with a specialist below.
          </p>
          <Link
            to="/patient/appointments/book"
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
          >
            Book a Video Consult
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const live = isLive(appointment);
            const roomLink = appointment?.telemedicine?.meetLink || `/teleconsult/${appointment?.telemedicine?.joinCode || ""}`;
            return (
              <div
                key={appointment._id}
                className={`rounded-2xl bg-white p-4 ring-1 ${live ? "ring-emerald-300" : "ring-slate-200"} shadow-2xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-800">{getDoctorDisplayName(appointment.doctor, "Consultant")}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {appointment.doctor?.specialization || "Specialist"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        live
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : STATUS_STYLES[appointment.status] || "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {live ? "● Live now" : appointment.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {appointment.timeSlot}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2">{appointment.reasonForVisit || "Video consultation"}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  {live ? (
                    <a
                      href={roomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      ▶ Join Video Now
                    </a>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                      You will get a notification when your doctor starts the session
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default TelemedicinePage;
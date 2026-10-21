import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  endTeleconsult,
  getDoctorTeleconsults,
  startTeleconsult,
} from "../../services/api.js";

const TelemedicineDoctorPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDoctorTeleconsults();
      setAppointments(data.appointments || []);
      setLiveCount(data.liveCount || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load teleconsultation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async (appointment) => {
    setBusyId(appointment._id);
    setError("");
    try {
      const data = await startTeleconsult(appointment._id);
      await load();
      if (data?.meetLink) {
        window.open(data.meetLink, "_blank");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to start session.");
    } finally {
      setBusyId("");
    }
  };

  const handleEnd = async (appointment) => {
    setBusyId(appointment._id);
    setError("");
    try {
      await endTeleconsult(appointment._id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to end session.");
    } finally {
      setBusyId("");
    }
  };

  const isLive = (appointment) => appointment?.telemedicine?.status === "live";

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Telemedicine Queue</h1>
          <p className="mt-1 text-sm text-slate-600">
            Upcoming video consultations. Start a session to notify the patient and open the room.
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 ring-1 ring-slate-200 text-sm">
          <span className="font-bold text-slate-800">{liveCount}</span>{" "}
          <span className="text-slate-500 text-xs">live now</span>
        </div>
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
          <p className="text-3xl">📹</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">No teleconsultations scheduled</p>
          <p className="mt-1 text-xs text-slate-500">
            Patients can book video consults from the patient portal. You'll see them here.
          </p>
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
                    <p className="font-bold text-slate-800">{appointment.patient?.name || "Patient"}</p>
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                      {appointment.patient?.bloodGroup || "—"}
                    </span>
                    {appointment.patient?.allergies?.length > 0 && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        ⚠ {appointment.patient.allergies.join(", ")}
                      </span>
                    )}
                    {live && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {appointment.timeSlot}
                  </p>
                  <p className="text-xs text-slate-600">{appointment.reasonForVisit || "Video consultation"}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  {live ? (
                    <>
                      <a
                        href={roomLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        ▶ Join Session
                      </a>
                      <button
                        type="button"
                        disabled={busyId === appointment._id}
                        onClick={() => handleEnd(appointment)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
                      >
                        End Session
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === appointment._id}
                      onClick={() => handleStart(appointment)}
                      className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition disabled:opacity-50 cursor-pointer"
                    >
                      Start Session
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-sky-50 border border-sky-200 p-4 text-xs text-slate-600">
        <p className="font-bold text-sky-800 mb-1">How it works</p>
        <p>
          <strong>Start Session</strong> notifies the patient with a link and opens the secure video room in a new
          tab. The same room works on the patient portal's <Link to="/patient/telemedicine" className="text-sky-700 font-semibold">Video Consultations</Link> page.
          Video is hosted on Jitsi Meet (no API key or setup needed).
        </p>
      </div>
    </section>
  );
};

export default TelemedicineDoctorPage;
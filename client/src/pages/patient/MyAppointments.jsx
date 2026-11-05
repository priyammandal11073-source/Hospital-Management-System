import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  cancelMyAppointment,
  getMyAppointments,
  rescheduleMyAppointment,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { ActionDropdown, PageHeader } from "../../components/ui/index.js";

const statusClasses = {
  pending: "bg-amber-50 text-amber-800 border-amber-200/70",
  confirmed: "bg-teal-50 text-teal-800 border-teal-200/70",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200/70",
  no_show: "bg-slate-100 text-slate-700 border-slate-200/70",
};

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM"
];

function MyAppointments() {
  const location = useLocation();
  const [successToast, setSuccessToast] = useState(location.state?.successMsg || "");
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  // Reschedule Modal State
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you wish to cancel this appointment?")) return;
    setCancelling(id);
    setError("");
    try {
      await cancelMyAppointment(id);
      setSuccessToast("Appointment cancelled successfully.");
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel appointment");
    } finally {
      setCancelling(null);
    }
  };

  const openRescheduleModal = (appt) => {
    setRescheduleAppt(appt);
    setNewDate(appt.appointmentDate ? appt.appointmentDate.split("T")[0] : "");
    setNewTimeSlot(appt.timeSlot || "10:00 AM");
    setRescheduleReason("");
    setRescheduleError("");
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTimeSlot) {
      setRescheduleError("Please select both a date and a time slot.");
      return;
    }

    setRescheduling(true);
    setRescheduleError("");
    try {
      await rescheduleMyAppointment(rescheduleAppt._id, {
        appointmentDate: newDate,
        timeSlot: newTimeSlot,
        reasonForVisit: rescheduleReason || rescheduleAppt.reasonForVisit,
      });
      setSuccessToast("Appointment rescheduled successfully!");
      setRescheduleAppt(null);
      await fetchAppointments();
    } catch (err) {
      setRescheduleError(err.response?.data?.message || "Failed to reschedule appointment.");
    } finally {
      setRescheduling(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return ["pending", "confirmed"].includes(a.status);
    if (activeTab === "completed") return a.status === "completed";
    if (activeTab === "cancelled") return a.status === "cancelled";
    return true;
  });

  return (
    <section className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Care Visits", active: true },
        ]}
        title="My Scheduled Visits"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            OPD Consultations
          </span>
        }
        subtitle="View upcoming visits, manage appointment schedules, or book a consultation with specialist physicians."
        actions={
          <Link
            to="/patient/appointments/book"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 self-start sm:self-auto"
          >
            <span>➕ Book Specialist Visit</span>
          </Link>
        }
      />

      {/* Preparation & Clinic Protocol Banner */}
      <div className="rounded-2xl liquid-glass-card border border-teal-200/80 bg-teal-50/50 p-4 sm:p-5 shadow-2xs flex items-start gap-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass-subtle text-teal-900 text-base font-bold flex-shrink-0">
          ℹ️
        </div>
        <div className="text-xs sm:text-sm text-teal-950 leading-relaxed">
          <p className="font-bold text-teal-950">Patient Visit Guidelines:</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-teal-900 text-xs">
            <li>Please arrive at the clinic reception 15 minutes prior to your time slot for mandatory vitals check.</li>
            <li>Carry past prescriptions, previous lab test reports, and your government photo ID / ABHA card.</li>
          </ul>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `All Visits (${appointments.length})` },
          { key: "upcoming", label: `Upcoming (${appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length})` },
          { key: "completed", label: `Completed (${appointments.filter((a) => a.status === "completed").length})` },
          { key: "cancelled", label: `Cancelled (${appointments.filter((a) => a.status === "cancelled").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all flex items-center justify-center min-h-[38px] ${
              activeTab === tab.key
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {successToast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-4 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs">
          <span>✅ {successToast}</span>
          <button onClick={() => setSuccessToast("")} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-rose-800 text-xs font-bold shadow-2xs">
          {error}
        </div>
      )}

      {/* Appointments List / Empty State */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading scheduled visits...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-700 text-xl mb-3">
              📅
            </div>
            <p className="text-sm font-bold text-slate-900">No visits scheduled</p>
            <p className="mt-1 text-xs text-slate-500">
              There are no visits matching the "{activeTab}" filter.
            </p>
            <div className="mt-4">
              <Link
                to="/patient/appointments/book"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 inline-block"
              >
                Book An Appointment
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((a) => {
              const apptDate = new Date(a.appointmentDate);
              const formattedDate = apptDate.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={a._id}
                  className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors"
                >
                  {/* Left: Doctor & Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-900 font-extrabold text-sm border border-slate-200/80 shadow-2xs flex-shrink-0">
                      {a.doctor?.name ? a.doctor.name.charAt(0).toUpperCase() : "D"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {formattedDate} • {a.timeSlot}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider liquid-glass-pill border ${
                            statusClasses[a.status] || "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {a.status}
                        </span>
                        <span className="inline-flex items-center rounded-full liquid-glass-pill bg-slate-50 text-slate-700 border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase">
                          {a.appointmentType || "In-person"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {formatDoctorName(a.doctor?.name, "Specialist")}
                      </h3>
                      <p className="text-xs font-semibold text-teal-800">
                        {a.doctor?.specialization || "General Medicine"}
                        {a.doctor?.department && ` • ${a.doctor.department}`}
                      </p>

                      {a.reasonForVisit && (
                        <p className="text-xs text-slate-500 mt-1">
                          Reason: <span className="text-slate-700 font-medium">{a.reasonForVisit}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                    {a.appointmentType === "teleconsult" && ["pending", "confirmed"].includes(a.status) ? (
                      <a
                        href={`https://meet.google.com/new`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-[0.97] min-h-[38px] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-950/10 transition"
                      >
                        <span>Join Call</span>
                        <span className="text-teal-200">🎥</span>
                      </a>
                    ) : a.status === "completed" ? (
                      <Link
                        to="/patient/consultations"
                        className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 hover:bg-slate-50 active:scale-[0.97] min-h-[38px] px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition"
                      >
                        <span>View Summary</span>
                        <span className="text-slate-400">→</span>
                      </Link>
                    ) : ["pending", "confirmed"].includes(a.status) ? (
                      <button
                        type="button"
                        onClick={() => openRescheduleModal(a)}
                        className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 hover:bg-slate-50 active:scale-[0.97] min-h-[38px] px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
                      >
                        <span>Reschedule</span>
                        <span className="text-slate-400">🔄</span>
                      </button>
                    ) : null}

                    {["pending", "confirmed"].includes(a.status) && (
                      <ActionDropdown
                        align="right"
                        items={[
                          {
                            label: "Reschedule Appointment",
                            icon: "🔄",
                            onClick: () => openRescheduleModal(a),
                          },
                          {
                            label: "Copy Token ID",
                            icon: "📋",
                            onClick: () => {
                              navigator.clipboard?.writeText(a.tokenNumber || a._id);
                            },
                          },
                          { divider: true },
                          {
                            label: cancelling === a._id ? "Cancelling..." : "Cancel Appointment",
                            icon: "✕",
                            danger: true,
                            disabled: cancelling === a._id,
                            onClick: () => handleCancel(a._id),
                          },
                        ]}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= RESCHEDULE MODAL ================= */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl liquid-glass-card border border-slate-200/80 bg-white p-6 shadow-xl modal-viewport overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Reschedule Doctor Visit
              </h3>
              <button
                onClick={() => setRescheduleAppt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">
                  Doctor: {formatDoctorName(rescheduleAppt.doctor?.name)}
                </p>
                <p className="text-slate-500">{rescheduleAppt.doctor?.specialization}</p>
                <p className="mt-1 text-slate-400">
                  Current: {new Date(rescheduleAppt.appointmentDate).toLocaleDateString("en-IN")} at {rescheduleAppt.timeSlot}
                </p>
              </div>

              {rescheduleError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200/80">
                  {rescheduleError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select New Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Preferred Slot
                </label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Reason for Rescheduling (Optional)
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Work schedule conflict"
                  className="mt-1 w-full min-h-[40px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleAppt(null)}
                  className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2 text-xs shadow-sm shadow-teal-950/10 transition disabled:opacity-50 active:scale-95"
                >
                  {rescheduling ? "Updating..." : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyAppointments;

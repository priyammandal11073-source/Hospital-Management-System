import { useState } from "react";
import { updateDoctorSchedule, addDoctorLeave, removeDoctorLeave } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctorDisplayName } from "../utils/doctorName.js";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DoctorScheduleModal({ doctor, onClose, onUpdated }) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("weekly"); // 'weekly' | 'leaves'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize schedule with doctor's current weekly schedule or default
  const [schedule, setSchedule] = useState(() => {
    if (doctor.weeklySchedule && doctor.weeklySchedule.length > 0) {
      return doctor.weeklySchedule;
    }
    return DAYS_OF_WEEK.map((day) => ({
      day,
      isAvailable: day !== "Sunday",
      shifts: [
        {
          startTime: "09:00 AM",
          endTime: day === "Saturday" ? "01:00 PM" : "05:00 PM",
          slotDurationMinutes: 30,
          maxPatientsPerSlot: 1,
        },
      ],
    }));
  });

  const [leaves, setLeaves] = useState(doctor.leaves || []);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  if (user?.role === "nurse") return null;

  const handleToggleDay = (dayIndex) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        isAvailable: !next[dayIndex].isAvailable,
      };
      return next;
    });
  };

  const handleShiftChange = (dayIndex, field, value) => {
    setSchedule((prev) => {
      const next = [...prev];
      const shifts = [...(next[dayIndex].shifts || [{ startTime: "09:00 AM", endTime: "05:00 PM" }])];
      shifts[0] = { ...shifts[0], [field]: value };
      next[dayIndex] = { ...next[dayIndex], shifts };
      return next;
    });
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const availableDays = schedule.filter((s) => s.isAvailable).map((s) => s.day);
      await updateDoctorSchedule(doctor._id, {
        weeklySchedule: schedule,
        availableDays,
      });
      setSuccess("Weekly schedule saved successfully!");
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update doctor schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setError("Start date and end date are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await addDoctorLeave(doctor._id, leaveForm);
      setLeaves(res.leaves || []);
      setLeaveForm({ startDate: "", endDate: "", reason: "" });
      setSuccess("Leave added to doctor schedule calendar!");
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add leave.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeave = async (index) => {
    if (!window.confirm("Remove this planned leave?")) return;
    try {
      const res = await removeDoctorLeave(doctor._id, index);
      setLeaves(res.leaves || []);
      if (onUpdated) onUpdated();
    } catch (err) {
      setError("Failed to remove leave.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-backdrop-fade">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Doctor Schedule & Availability — {getDoctorDisplayName(doctor)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {doctor.specialization} · {doctor.department}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-all active:scale-90 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("weekly")}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === "weekly"
                ? "border-teal-700 text-teal-800 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📅 Weekly Working Hours & Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaves")}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "leaves"
                ? "border-teal-700 text-teal-800 font-black"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🏖️ Planned Leaves & Off Days</span>
            {leaves.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {leaves.length}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            {success}
          </div>
        )}

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === "weekly" ? (
            <div className="space-y-3">
              <p className="text-slate-500">
                Configure doctor's OPD hours and shift schedule for each day of the week.
              </p>

              <div className="space-y-2">
                {schedule.map((dayItem, idx) => {
                  const shift = dayItem.shifts?.[0] || {
                    startTime: "09:00 AM",
                    endTime: "05:00 PM",
                    slotDurationMinutes: 30,
                  };
                  return (
                    <div
                      key={dayItem.day}
                      className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        dayItem.isAvailable
                          ? "bg-white border-slate-200 shadow-2xs"
                          : "bg-slate-50/60 border-slate-200/60 opacity-60"
                      }`}
                    >
                      {/* Day & Toggle */}
                      <div className="flex items-center gap-3 min-w-[130px]">
                        <input
                          type="checkbox"
                          checked={dayItem.isAvailable}
                          onChange={() => handleToggleDay(idx)}
                          className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{dayItem.day}</p>
                          <span
                            className={`text-[10px] font-semibold ${
                              dayItem.isAvailable ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {dayItem.isAvailable ? "Available" : "Off Duty"}
                          </span>
                        </div>
                      </div>

                      {/* Shift Hours */}
                      {dayItem.isAvailable ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Start:</span>
                            <input
                              type="text"
                              value={shift.startTime}
                              onChange={(e) =>
                                handleShiftChange(idx, "startTime", e.target.value)
                              }
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">End:</span>
                            <input
                              type="text"
                              value={shift.endTime}
                              onChange={(e) =>
                                handleShiftChange(idx, "endTime", e.target.value)
                              }
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Slot:</span>
                            <select
                              value={shift.slotDurationMinutes || 30}
                              onChange={(e) =>
                                handleShiftChange(
                                  idx,
                                  "slotDurationMinutes",
                                  Number(e.target.value)
                                )
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold bg-white"
                            >
                              <option value={15}>15 mins</option>
                              <option value={20}>20 mins</option>
                              <option value={30}>30 mins</option>
                              <option value={45}>45 mins</option>
                              <option value={60}>60 mins</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          No appointments scheduled on this day
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveSchedule}
                  className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2.5 shadow-md transition disabled:opacity-50"
                >
                  {saving ? "Saving Schedule..." : "Save Weekly Schedule"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Leave Form */}
              <form
                onSubmit={handleAddLeave}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <h4 className="font-bold text-slate-900">Schedule Planned Leave / Vacation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">From Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) =>
                        setLeaveForm((f) => ({ ...f, startDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">To Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) =>
                        setLeaveForm((f) => ({ ...f, endDate: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    Reason / Conference Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Medical Conference / Personal Leave"
                    value={leaveForm.reason}
                    onChange={(e) =>
                      setLeaveForm((f) => ({ ...f, reason: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2 text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  + Add Doctor Leave
                </button>
              </form>

              {/* Existing Leaves */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Scheduled Off-Duty Leaves</h4>
                {leaves.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">
                    No leaves currently scheduled for {getDoctorDisplayName(doctor)}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaves.map((leave, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {new Date(leave.startDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {new Date(leave.endDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{leave.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLeave(idx)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

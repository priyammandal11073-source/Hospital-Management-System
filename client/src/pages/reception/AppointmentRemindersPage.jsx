import { useState, useEffect } from "react";
import {
  getAppointmentReminders,
  sendAppointmentReminder,
  updateAppointmentStatus,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function AppointmentRemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const res = await getAppointmentReminders();
      setReminders(res.reminders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reminders queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleSendReminder = async (app) => {
    setActioningId(app._id);
    try {
      const res = await sendAppointmentReminder(app._id);
      alert(`${res.message}`);
      loadReminders();
    } catch (err) {
      alert("Failed to send reminder: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkConfirmed = async (appId) => {
    setActioningId(appId);
    try {
      await updateAppointmentStatus(appId, "confirmed");
      loadReminders();
    } catch (err) {
      alert("Failed to confirm: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Patient Outreach</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Appointment Confirmation & Reminders Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pre-visit appointment verification for tomorrow's scheduled clinics. Reduces no-shows and confirms patient attendance.
          </p>
        </div>

        <button
          onClick={loadReminders}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Reminders Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading upcoming clinics requiring reminder outreach...
          </div>
        ) : reminders.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">📬</span>
            <p className="mt-2 text-sm font-bold text-slate-700">No pending reminders for tomorrow</p>
            <p className="text-xs text-slate-400 mt-1">All scheduled patients have been confirmed or notified.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Scheduled Doctor</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Outreach Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminders.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{app.patient?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">📞 {app.patient?.contactNumber}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{formatDoctorName(app.doctor?.name)}</div>
                      <div className="text-[11px] text-slate-500">{app.doctor?.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold font-mono text-slate-800">{app.timeSlot}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                      {app.reasonForVisit}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          app.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.reminderSent ? (
                          <span className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold">
                            ✓ Reminder Sent
                          </span>
                        ) : (
                          <button
                            disabled={actioningId === app._id}
                            onClick={() => handleSendReminder(app)}
                            className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            📩 Send Reminder
                          </button>
                        )}
                        {app.status !== "confirmed" && (
                          <button
                            disabled={actioningId === app._id}
                            onClick={() => handleMarkConfirmed(app._id)}
                            className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            ✓ Confirmed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

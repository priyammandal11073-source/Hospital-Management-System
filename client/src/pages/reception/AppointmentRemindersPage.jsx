import { useState, useEffect } from "react";
import {
  getAppointmentReminders,
  sendAppointmentReminder,
  updateAppointmentStatus,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
  ConfirmDialog,
} from "../../components/ui/index.js";

export default function AppointmentRemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

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
      toastSuccess(res.message);
      loadReminders();
    } catch (err) {
      toastError("Failed to send reminder: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkConfirmed = (appId) => {
    setConfirmModal(appId);
  };

  const doMarkConfirmed = async (appId) => {
    setActioningId(appId);
    try {
      await updateAppointmentStatus(appId, "confirmed");
      loadReminders();
    } catch (err) {
      toastError("Failed to confirm: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
      setConfirmModal(null);
    }
  };

  const toastSuccess = (msg) => {
    const d = document.createElement("div");
    d.className = "fixed top-6 right-6 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-xl";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  };

  const toastError = (msg) => {
    const d = document.createElement("div");
    d.className = "fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl";
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  };

  return (
    <div className="space-y-6" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="Appointment Confirmation & Reminders Desk"
        subtitle="Pre-visit appointment verification for tomorrow's scheduled clinics. Reduces no-shows and confirms patient attendance."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span><span className="text-xs font-bold uppercase tracking-wider text-blue-600">Patient Outreach</span></span>}
        actions={[
          <Button             variant="outline"
            size="sm"
            onClick={loadReminders}
            leftIcon={<span>🔄</span>}
          >
            Refresh List
          </Button>,
        ]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading upcoming clinics requiring reminder outreach…
          </div>
        ) : reminders.length === 0 ? (
          <EmptyStateCard
            icon="📬"
            title="No pending reminders for tomorrow"
            description="All scheduled patients have been confirmed or notified."
          />
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
                      <Badge status={app.status === "confirmed" ? "completed" : "pending"}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.reminderSent ? (
                          <span className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold">
                            ✓ Reminder Sent
                          </span>
                        ) : (
                          <Button                             variant="outline"
                            size="sm"
                            disabled={actioningId === app._id}
                            onClick={() => handleSendReminder(app)}
                            leftIcon={<span>📩</span>}
                          >
                            {actioningId === app._id ? "Sending…" : "Send Reminder"}
                          </Button>
                        )}
                        {app.status !== "confirmed" && (
                          <Button                             variant="outline"
                            size="sm"
                            disabled={actioningId === app._id}
                            onClick={() => handleMarkConfirmed(app._id)}
                            leftIcon={<span>✓</span>}
                          >
                            {actioningId === app._id ? "Confirming…" : "Confirm"}
                          </Button>
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

      {confirmModal && (
        <ConfirmDialog
          isOpen={Boolean(confirmModal)}
          onCancel={() => setConfirmModal(null)}
          title="Confirm Appointment"
          message="Mark this appointment as confirmed and notify the patient?"
          confirmText={actioningId === confirmModal ? "Confirming…" : "Confirm Appointment"}
          cancelText="Cancel"
          variant="primary"
          loading={actioningId === confirmModal}
          onConfirm={() => doMarkConfirmed(confirmModal)}
        />
      )}
    </div>
  );
}

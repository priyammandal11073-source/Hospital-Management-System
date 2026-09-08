import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/api.js";

const TYPE_ICONS = {
  appointment_booked: "📅",
  appointment_confirmed: "✅",
  appointment_cancelled: "❌",
  payment_received: "💳",
  lab_report_ready: "🧪",
  vitals_alert: "🚨",
  doctor_leave: "🏖️",
  general: "🔔",
};

function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkOne = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const filteredNotifs = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications.filter((n) => n.isRead);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time updates regarding your upcoming consultations, verified test results, and billing receipts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition flex-shrink-0"
          >
            ✓ Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: `All (${notifications.length})` },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "read", label: `Read (${notifications.length - unreadCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading your alerts...</p>
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            🔔
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No notifications</h3>
          <p className="mt-1 text-sm text-slate-500">
            You do not have any notifications under this filter.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {filteredNotifs.map((n) => (
            <div
              key={n._id}
              className={`p-4 sm:p-5 transition hover:bg-slate-50/80 flex items-start justify-between gap-4 ${
                !n.isRead ? "bg-blue-50/40" : ""
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg flex-shrink-0 shadow-2xs">
                  {TYPE_ICONS[n.type] || "🔔"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold ${!n.isRead ? "text-slate-900 font-extrabold" : "text-slate-800"}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{n.message}</p>
                  <p className="mt-2 text-[11px] font-mono text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-center sm:self-auto">
                {n.actionUrl && (
                  <Link
                    to={n.actionUrl}
                    className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                  >
                    View →
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n._id)}
                    className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientNotificationsPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

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

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Notifications", active: true },
        ]}
        title="Notifications & Health Alerts"
        badge={
          unreadCount > 0 ? (
            <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
              {unreadCount} New
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/70">
              All caught up
            </span>
          )
        }
        subtitle="Stay informed on appointment confirmations, test report releases, and clinical updates."
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              ✓ Mark all as read
            </button>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `All (${notifications.length})` },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "read", label: `Read (${notifications.length - unreadCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === tab.key
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
            🔔
          </div>
          <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
          <p className="mt-1 text-xs text-slate-500">
            {filter === "unread" ? "You have read all notifications." : "No notifications to show."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map((item) => {
            const icon = TYPE_ICONS[item.type] || "🔔";
            return (
              <div
                key={item._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50/60 ${
                  !item.isRead ? "bg-teal-50/20" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-lg border border-slate-200/80 shadow-2xs flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-teal-700 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.link && (
                    <Link
                      to={item.link}
                      className="rounded-xl liquid-glass-pill border border-teal-200/70 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                    >
                      View →
                    </Link>
                  )}
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkOne(item._id)}
                      className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PatientNotificationsPage;

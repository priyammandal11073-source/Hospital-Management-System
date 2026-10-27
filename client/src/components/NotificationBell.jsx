import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api.js";

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

export default function NotificationBell({ isPatient = false }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const data = await getNotifications();
      if (data) {
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          data.unreadCount > unreadCount &&
          data.notifications?.length > 0
        ) {
          const newest = data.notifications[0];
          if (!newest.isRead) {
            new Notification(newest.title, {
              body: newest.message,
              icon: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
            });
          }
        }

        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // silently handle when not logged in
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof Notification !== "undefined") {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        new Notification("Nivora Care Alerts Enabled", {
          body: "You will receive real-time appointment and hospital updates!",
        });
      }
    }
  };

  const handleMarkRead = async (id, link) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white hover:text-sky-700 shadow-sm transition active:scale-[0.97] liquid-glass-button"
        title="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-white/60 z-50 overflow-hidden animate-dropdown-in animate-action-menu">
          {/* Header */}
          <div className="p-4 bg-white/50 border-b border-white/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Notifications</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread update(s)` : "All caught up"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-sky-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Browser Push Permission Prompt */}
          {permission !== "granted" && (
            <div className="p-3 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs">
              <span className="text-sky-900 font-medium">Get instant desktop alerts</span>
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="bg-sky-700 hover:bg-sky-800 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition active:scale-[0.97]"
              >
                Enable Push
              </button>
            </div>
          )}

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <span className="text-3xl block mb-2">📭</span>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                const icon = TYPE_ICONS[notif.type] || "🔔";
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkRead(notif._id, notif.link)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition duration-150 ${
                      !notif.isRead ? "bg-sky-50/40 font-semibold" : ""
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        ·{" "}
                        {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

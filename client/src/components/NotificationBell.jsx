import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/index.js";

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markRead,
    markAllRead,
  } = useNotifications();

  // Close dropdown on outside click or tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id, link) => {
    markRead(id);
    if (link) {
      setIsOpen(false);
      navigate(link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-8.5 w-8.5 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer"
        aria-label="View notifications"
        title="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="h-4.5 w-4.5 text-slate-600 group-hover:text-teal-700 transition-colors duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs animate-pop-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-sm ml-auto rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl border border-slate-200/50 z-50 overflow-hidden animate-dropdown-in animate-action-menu">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
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
                  onClick={markAllRead}
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
                onClick={requestPermission}
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
                    onClick={() => handleNotificationClick(notif._id, notif.link)}
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

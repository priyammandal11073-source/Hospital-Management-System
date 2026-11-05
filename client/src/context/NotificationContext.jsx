import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api.js";

const NotificationContext = createContext(null);

export function NotificationProvider({ children, isPatient = false }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
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
      // Silently handle when unauthenticated
    }
  }, [unreadCount]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const requestPermission = async () => {
    if (typeof Notification !== "undefined") {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        new Notification("Nivora Care Alerts Enabled", {
          body: "You will receive real-time appointment and hospital updates!",
        });
      }
      return res;
    }
    return "denied";
  };

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    permission,
    isLoading,
    fetchNotifications,
    requestPermission,
    markRead,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return ctx;
}

export default NotificationContext;


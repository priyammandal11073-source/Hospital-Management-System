import { useContext } from "react";
import NotificationContext from "../context/NotificationContext.jsx";

/**
 * useNotifications hook
 * Provides access to the centralized notification store.
 * Falls back safely to a stub if rendered outside NotificationProvider (e.g., in unit tests).
 */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      permission: "default",
      isLoading: false,
      fetchNotifications: async () => {},
      requestPermission: async () => "denied",
      markRead: async () => {},
      markAllRead: async () => {},
    };
  }
  return ctx;
}

export default useNotifications;

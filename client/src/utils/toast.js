/**
 * Sonner-inspired Zero-Dependency Toast State Manager
 * Pub/sub store for non-blocking clinical toasts.
 */

let subscribers = new Set();
let toastCount = 0;
let activeToasts = [];

function notify() {
  subscribers.forEach((callback) => callback([...activeToasts]));
}

export function subscribeToasts(callback) {
  subscribers.add(callback);
  callback([...activeToasts]);
  return () => subscribers.delete(callback);
}

export function dismissToast(id) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  notify();
}

export function createToast(type, message, options = {}) {
  const id = options.id || `toast-${++toastCount}-${Date.now()}`;
  const newToast = {
    id,
    type, // 'success' | 'error' | 'warning' | 'info' | 'default'
    message: typeof message === "string" ? message : String(message || ""),
    description: options.description || null,
    duration: options.duration !== undefined ? options.duration : 4200,
    action: options.action || null, // { label, onClick }
    createdAt: Date.now(),
  };

  // Keep max 5 active toasts to prevent viewport cluttering
  activeToasts = [newToast, ...activeToasts.filter((t) => t.id !== id)].slice(0, 5);
  notify();
  return id;
}

export const toast = (message, options) => createToast("default", message, options);
toast.success = (message, options) => createToast("success", message, options);
toast.error = (message, options) => createToast("error", message, options);
toast.warning = (message, options) => createToast("warning", message, options);
toast.info = (message, options) => createToast("info", message, options);
toast.dismiss = dismissToast;

export default toast;

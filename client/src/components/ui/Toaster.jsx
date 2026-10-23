import React, { useEffect, useState, useRef } from "react";
import { subscribeToasts, dismissToast } from "../../utils/toast.js";

function CheckCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth={3} />
    </svg>
  );
}

function AlertTriangleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function InfoIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" strokeWidth={3} />
    </svg>
  );
}

function CloseIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const ICONS = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
  default: InfoIcon,
};

const STYLES = {
  success: {
    bg: "bg-white/95 dark:bg-slate-900/95",
    border: "border-emerald-200 dark:border-emerald-800/60",
    text: "text-slate-900 dark:text-white",
    desc: "text-slate-600 dark:text-slate-300",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ring: "focus-visible:ring-emerald-500",
  },
  error: {
    bg: "bg-white/95 dark:bg-slate-900/95",
    border: "border-rose-200 dark:border-rose-800/60",
    text: "text-slate-900 dark:text-white",
    desc: "text-slate-600 dark:text-slate-300",
    iconColor: "text-rose-600 dark:text-rose-400",
    ring: "focus-visible:ring-rose-500",
  },
  warning: {
    bg: "bg-white/95 dark:bg-slate-900/95",
    border: "border-amber-200 dark:border-amber-800/60",
    text: "text-slate-900 dark:text-white",
    desc: "text-slate-600 dark:text-slate-300",
    iconColor: "text-amber-600 dark:text-amber-400",
    ring: "focus-visible:ring-amber-500",
  },
  info: {
    bg: "bg-white/95 dark:bg-slate-900/95",
    border: "border-sky-200 dark:border-sky-800/60",
    text: "text-slate-900 dark:text-white",
    desc: "text-slate-600 dark:text-slate-300",
    iconColor: "text-sky-600 dark:text-sky-400",
    ring: "focus-visible:ring-sky-500",
  },
  default: {
    bg: "bg-white/95 dark:bg-slate-900/95",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-900 dark:text-white",
    desc: "text-slate-600 dark:text-slate-300",
    iconColor: "text-slate-600 dark:text-slate-400",
    ring: "focus-visible:ring-slate-500",
  },
};

function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTimer = () => {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id);
      }, remainingTimeRef.current);
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, toast.id, toast.duration, onDismiss]);

  // Tab visibility management: pause toast timeouts when user leaves tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const style = STYLES[toast.type] || STYLES.default;
  const Icon = ICONS[toast.type] || ICONS.default;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`group pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl p-3.5 shadow-lg backdrop-blur-md border ${style.bg} ${style.border} animate-toast-in transition-all duration-150`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
        <Icon className="w-5 h-5 stroke-[2]" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-sm font-semibold leading-snug break-words ${style.text}`}>
          {toast.message}
        </p>
        {toast.description && (
          <p className={`mt-0.5 text-xs leading-relaxed ${style.desc}`}>
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              if (toast.action.onClick) toast.action.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 inline-flex items-center text-xs font-semibold underline underline-offset-2 hover:opacity-80 active:opacity-60 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2"
        aria-label="Close notification"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed z-[99999] top-4 right-4 left-4 sm:left-auto sm:right-6 pointer-events-none flex flex-col items-end gap-2.5 max-w-sm w-full"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={dismissToast} />
      ))}
    </aside>
  );
}

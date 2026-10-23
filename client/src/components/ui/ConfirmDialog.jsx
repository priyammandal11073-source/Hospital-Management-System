import React, { useEffect, useId } from "react";

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

/**
 * Reusable Confirmation Dialog for Nivora Care HMS.
 * Replaces browser window.confirm() with a sleek, accessible modal.
 */
export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen && !loading && onCancel) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, loading, onCancel]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-2xs",
      iconBg: "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400",
      icon: AlertCircleIcon,
    },
    warning: {
      button: "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-2xs",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
      icon: AlertTriangleIcon,
    },
    primary: {
      button: "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-2xs",
      iconBg: "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400",
      icon: InfoIcon,
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;
  const IconComponent = style.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && onCancel) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md animate-backdrop-fade"
    >
      <div
        className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl p-6 text-slate-800 animate-pop-in"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${style.iconBg}`}
          >
            <IconComponent className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-[background-color,border-color,transform] duration-150 active:scale-95 shadow-2xs disabled:opacity-50 touch-target"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-[background-color,transform,opacity] duration-150 flex items-center gap-2 disabled:opacity-50 active:scale-95 touch-target ${style.button}`}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin text-white shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog };

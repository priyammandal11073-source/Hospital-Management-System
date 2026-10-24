import React, { useEffect, useId } from "react";

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  className = "max-w-md",
  hideCancel = false,
  cancelText = "Cancel",
}) => {
  const titleId = useId();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      style={{ touchAction: "none" }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-md animate-backdrop-fade"
    >
      <div
        style={{ touchAction: "auto" }}
        className={`
          liquid-glass-elevated bg-white w-full mx-auto
          rounded-t-[28px] md:rounded-3xl
          max-h-[90dvh] md:max-h-[calc(100dvh-2.5rem)] flex flex-col
          overflow-hidden shadow-2xl transition-all duration-300
          ${className}
        `}
      >
        {/* Apple HIG Drag Handle — mobile only */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0 bg-white/40">
          <div className="h-1.5 w-10 rounded-full bg-slate-300/80" />
        </div>

        {title && (
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 sm:px-7 py-3.5 sm:py-4 bg-white/40 flex-shrink-0">
            <h3 id={titleId} className="font-semibold text-base sm:text-lg text-slate-900 truncate pr-2 tracking-tight">
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl liquid-glass-subtle hover:bg-white transition duration-150 touch-target flex items-center justify-center cursor-pointer active:scale-[0.95]"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-5 sm:p-7 overflow-y-auto overscroll-contain flex-1">{children}</div>
        {!hideCancel && onClose && (
          <div
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
            className="border-t border-slate-100/80 px-5 sm:px-7 pt-3.5 bg-slate-50/60 flex justify-end flex-shrink-0"
          >
            <button
              type="button"
              onClick={onClose}
              className="liquid-glass-pill px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition duration-150 touch-target cursor-pointer active:scale-[0.97] shadow-xs"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
export { Modal };

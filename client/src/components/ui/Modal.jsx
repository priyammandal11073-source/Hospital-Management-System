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
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/35 backdrop-blur-md animate-backdrop-fade"
    >
      <div
        className={`
          liquid-glass-elevated rounded-3xl w-full mx-auto
          max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col
          overflow-hidden animate-pop-in
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 sm:px-7 py-4 bg-white/40 flex-shrink-0">
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
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">{children}</div>
        {!hideCancel && onClose && (
          <div className="border-t border-slate-100/80 px-5 sm:px-7 py-3.5 bg-slate-50/40 flex justify-end flex-shrink-0">
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

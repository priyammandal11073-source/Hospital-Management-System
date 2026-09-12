import React, { useEffect } from "react";

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  className = "max-w-md",
  hideCancel = false,
  cancelText = "Cancel",
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/45 backdrop-blur-sm animate-fadeIn">
      <div
        className={`
          bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full mx-auto border border-white/70
          max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col
          overflow-hidden transform transition-all
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/60 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/40 backdrop-blur-md flex-shrink-0">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate pr-2">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors touch-target flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
        {!hideCancel && onClose && (
          <div className="border-t border-white/60 px-4 sm:px-6 py-3 bg-white/40 backdrop-blur-md flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300/80 bg-white/70 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors touch-target cursor-pointer"
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

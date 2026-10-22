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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/35 backdrop-blur-md animate-backdrop-fade">
      <div
        className={`
          bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl w-full mx-auto border border-slate-200/80
          max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col
          overflow-hidden animate-pop-in
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/70 backdrop-blur-md flex-shrink-0">
            <h3 className="font-semibold text-base sm:text-lg text-slate-900 truncate pr-2">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all touch-target flex items-center justify-center cursor-pointer active:scale-90"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
        {!hideCancel && onClose && (
          <div className="border-t border-slate-100 px-4 sm:px-6 py-3 bg-slate-50/60 backdrop-blur-md flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all touch-target cursor-pointer active:scale-95 shadow-2xs"
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

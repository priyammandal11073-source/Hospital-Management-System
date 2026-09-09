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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`
          bg-white rounded-xl shadow-2xl w-full mx-auto border border-slate-200
          overflow-hidden transform transition-all 
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
        {!hideCancel && onClose && (
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
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

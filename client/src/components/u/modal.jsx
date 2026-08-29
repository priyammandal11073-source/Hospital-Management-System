import React, { useState } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-md",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        className={`
          bg-white rounded-md shadow-lg w-full max-w-md mx-4 
          transform scale-100 transition-transform 
          ${className}
        `}
      >
        <div className="border-b p-6">
          <h3 className="font-medium text-lg text-neutral-900">
            {title}
          </h3>
        </div>
        <div className="p-6">
          {children}
          <div className="mt-4">
            <button
              onClick={onClose}
              className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.defaultProps = {
  isOpen: false,
};

export default Modal;
export { Modal };
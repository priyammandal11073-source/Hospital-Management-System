import React from "react";

const Card = ({ title, children, className = "", headerAction, ...props }) => {
  return (
    <div
      className={`
        bg-white rounded-xl p-6 shadow-sm border border-slate-200
        ${className}
      `}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
export { Card };

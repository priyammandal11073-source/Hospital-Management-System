import React from "react";

const Card = ({ title, subtitle, children, className = "", headerAction, ...props }) => {
  return (
    <div
      className={`
        glass-card rounded-2xl shadow-lg shadow-slate-300/40 p-4 sm:p-5
        ${className}
      `}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between mb-4 border-b border-white/60 pb-3">
          <div>
            {title && <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
export { Card };


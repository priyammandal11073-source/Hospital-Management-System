import React from "react";

const Card = ({ title, subtitle, children, className = "", headerAction, ...props }) => {
  return (
    <div
      className={`
        liquid-glass-card rounded-2xl p-4 sm:p-6
        ${className}
      `}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100/80 pb-3">
          <div>
            {title && (
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
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

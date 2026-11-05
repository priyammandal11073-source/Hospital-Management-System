import React from "react";

const Card = ({ title, subtitle, children, className = "", headerAction, isClickable = false, onClick, ...props }) => {
  return (
    <div
      className={`
        liquid-glass-card rounded-2xl p-4 sm:p-6 border-0 shadow-sm tile-popout tile-wobble
        ${isClickable ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/50 focus-visible:ring-offset-2 active:scale-[0.99]" : ""}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable && onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }} : undefined}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between mb-4 pb-2">
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

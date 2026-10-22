import React from "react";

/**
 * Standardized PageHeader component for Nivora Care HMS.
 * Provides unified title, breadcrumbs/meta, badges, and action button container.
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  breadcrumbs,
  actions,
  className = "",
}) {
  return (
    <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {breadcrumbs && (
            <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
              {breadcrumbs}
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export { PageHeader };

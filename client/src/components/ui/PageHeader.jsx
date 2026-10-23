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
          <div className="w-10 h-10 rounded-xl bg-teal-50/80 border border-teal-200/70 flex items-center justify-center text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-400 shrink-0 shadow-2xs mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {breadcrumbs && (
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              {breadcrumbs}
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
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

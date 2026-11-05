import React from "react";
import { Link } from "react-router-dom";

/**
 * Standardized PageHeader component for Nivora Care HMS.
 * Provides unified title, breadcrumbs/meta, badges, and action button container.
 * 
 * Supports breadcrumbs as:
 * - An array of objects: [{ label: "Home", to: "/" }, { label: "Current", active: true }]
 * - An array of React nodes or strings
 * - A single React node or string
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  breadcrumbs,
  actions,
  action,
  className = "",
}) {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs) return null;

    if (React.isValidElement(breadcrumbs)) {
      return breadcrumbs;
    }

    const list = Array.isArray(breadcrumbs) ? breadcrumbs : [breadcrumbs];

    return list.map((crumb, idx) => {
      const isLast = idx === list.length - 1;

      if (React.isValidElement(crumb)) {
        return <React.Fragment key={idx}>{crumb}</React.Fragment>;
      }

      if (typeof crumb === "object" && crumb !== null) {
        const label = crumb.label || crumb.title || crumb.name || (crumb.to ? String(crumb.to) : "");
        if (!label) return null;

        return (
          <React.Fragment key={crumb.to || label || idx}>
            {crumb.to && !crumb.active ? (
              <Link
                to={crumb.to}
                className="hover:text-teal-800 transition-colors"
              >
                {label}
              </Link>
            ) : (
              <span className={crumb.active ? "text-slate-900 font-bold" : "text-slate-500"}>
                {label}
              </span>
            )}
            {!isLast && <span className="text-slate-300 select-none">/</span>}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={idx}>
          <span>{String(crumb)}</span>
          {!isLast && <span className="text-slate-300 select-none">/</span>}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="w-10 h-10 rounded-xl liquid-glass-subtle flex items-center justify-center text-teal-800 shrink-0 shadow-2xs mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {breadcrumbs && (
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 flex-wrap">
              {renderBreadcrumbs()}
            </div>
          )}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-semibold font-display text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      {(actions || action) && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions || action}
        </div>
      )}
    </div>
  );
}

export { PageHeader };

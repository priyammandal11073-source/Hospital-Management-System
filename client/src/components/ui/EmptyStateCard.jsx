import React from "react";
import { Link } from "react-router-dom";

export default function EmptyStateCard({
  icon = "📋",
  subtitle,
  title = "No records found",
  description = "There are no items to display matching your current filters or search query.",
  actionText,
  actionTo,
  onActionClick,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl bg-white shadow-sm px-6 py-14 text-center border-0 ${className}`}
      role="status"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-2xs text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{subtitle || description}</p>

      {(actionText && (actionTo || onActionClick)) && (
        <div className="mt-5">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-teal-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"
            >
              <span>+</span>
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-teal-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"
            >
              <span>+</span>
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

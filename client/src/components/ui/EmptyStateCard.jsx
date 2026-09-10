import React from "react";
import { Link } from "react-router-dom";

export default function EmptyStateCard({
  icon = "📋",
  title = "No records found",
  description = "There are no items to display matching your current filters or search query.",
  actionText,
  actionTo,
  onActionClick,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50 px-6 py-14 text-center ${className}`}
      role="status"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>

      {(actionText && (actionTo || onActionClick)) && (
        <div className="mt-5">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
            >
              <span>+</span>
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
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

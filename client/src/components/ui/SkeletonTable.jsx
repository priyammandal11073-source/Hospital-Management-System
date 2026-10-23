import React from "react";

export default function SkeletonTable({ rows = 5, cols = 5, columns, className = "" }) {
  const colCount = columns !== undefined ? columns : cols;

  return (
    <div className={`overflow-hidden rounded-2xl glass-card shadow-lg shadow-slate-300/30 ${className}`}>
      {/* Skeleton Table Header */}
      <div className="border-b border-white/60 bg-white/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="h-4 w-40 rounded-md bg-slate-200 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-7 w-24 rounded-lg bg-slate-200 animate-pulse"></div>
          <div className="h-7 w-16 rounded-lg bg-slate-200 animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-6 py-4 flex items-center gap-6 animate-pulse">
            {Array.from({ length: colCount }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 rounded bg-slate-200"
                style={{
                  width: cIdx === 0 ? "28%" : cIdx === colCount - 1 ? "12%" : "18%",
                  opacity: Math.max(0.4, 1 - cIdx * 0.12),
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import React from "react";

export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="h-16 w-16 rounded-full border-4 border-indigo-100 animate-ping opacity-60"></div>
        {/* Inner spinning hospital cross / ring */}
        <div className="absolute h-12 w-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        {/* Center hospital icon */}
        <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white text-indigo-600 font-bold text-xs shadow-xs">
          ✚
        </div>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
        Loading Nivora Care Workspace...
      </p>
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

import React from "react";

export default function PageLoader({ message = "Loading Nivora Care Workspace..." }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 animate-pop-in"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        {/* Sleek track ring */}
        <div className="h-12 w-12 rounded-full border-2 border-slate-200/80 dark:border-slate-800"></div>
        {/* Spinning indicator ring */}
        <div className="absolute h-12 w-12 rounded-full border-2 border-transparent border-t-teal-600 border-r-teal-600 dark:border-t-teal-400 dark:border-r-teal-400 animate-spin"></div>
        {/* Subtle center brand pulse */}
        <div className="absolute h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 opacity-80"></div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
        {message}
      </p>
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

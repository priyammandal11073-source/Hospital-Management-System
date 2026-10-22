import React from "react";
import { Link } from "react-router-dom";
import nivoraLogo from "../assets/nivora-logo.png";

function HospitalLogo({
  variant = "full",
  className = "",
  isDark = false,
  to,
  href,
  onClick,
}) {
  const isClickable = Boolean(to || href || onClick);

  const innerContent = (
    <div
      className={`flex items-center gap-3 select-none transition-all duration-150 ${
        isClickable ? "hover:opacity-90 cursor-pointer active:scale-[0.99]" : ""
      } ${className}`}
    >
      {/* Official Nivora Care Hospital Logo Image */}
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs overflow-hidden">
          <img
            src={nivoraLogo}
            alt="Nivora Care Hospital"
            className="h-full w-full object-contain"
            onError={(e) => {
              // Graceful SVG fallback if image path ever fails
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = "flex";
              }
            }}
          />
          <div
            style={{ display: "none" }}
            className="h-full w-full items-center justify-center bg-teal-700 text-white font-black text-sm rounded-lg"
          >
            NC
          </div>
        </div>
      </div>

      {/* Hospital Name Wordmark */}
      {variant !== "icon" && (
        <span
          className={`font-serif text-lg sm:text-xl font-bold tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Nivora Care Hospital
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
        title="Nivora Care Hospital Home"
        aria-label="Nivora Care Hospital Home"
      >
        {innerContent}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className="inline-flex items-center no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
        title="Nivora Care Hospital Home"
        aria-label="Nivora Care Hospital Home"
      >
        {innerContent}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center p-0 bg-transparent border-0 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
        title="Nivora Care Hospital Home"
        aria-label="Nivora Care Hospital Home"
      >
        {innerContent}
      </button>
    );
  }

  return innerContent;
}

export default HospitalLogo;

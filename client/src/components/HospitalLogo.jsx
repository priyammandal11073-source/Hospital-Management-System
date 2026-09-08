function HospitalLogo({ variant = "full", className = "", isDark = false }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Animated Medical Cross Emblem */}
      <div className="relative flex-shrink-0">
        {/* Soft background pulse aura */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-40 blur-sm animate-pulse" />

        {/* Main Badge */}
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md ring-2 ring-white/20 animate-heartbeat">
          {/* Medical Cross SVG with integrated EKG wave */}
          <svg className="h-7 w-7 text-white" viewBox="0 0 48 48" fill="none" stroke="currentColor">
            {/* Medical Cross Shape */}
            <path
              d="M19 6h10a2 2 0 0 1 2 2v10h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H31v10a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V32H7a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2h10V8a2 2 0 0 1 2-2z"
              fill="rgba(255, 255, 255, 0.22)"
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Glowing EKG Heartbeat Pulse Wave */}
            <path
              d="M8 24h9l3-7 5 14 4-9 3 4h8"
              stroke="#67e8f9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ekg-glow"
            />
          </svg>

          {/* Active Live Beacon Dot on corner */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white"></span>
          </span>
        </div>
      </div>

      {/* Hospital Name & Tagline */}
      {variant !== "icon" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`text-base font-extrabold tracking-tight leading-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              CITY GENERAL
            </span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 ring-1 ring-blue-400/30">
              HOSPITAL
            </span>
          </div>

          {variant === "full" && (
            <p className={`text-[11px] font-medium tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Multi-Specialty & Research Institute
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default HospitalLogo;

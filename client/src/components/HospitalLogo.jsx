import nivoraLogo from "../assets/nivora-logo.png";

function HospitalLogo({ variant = "full", className = "", isDark = false }) {
  return (
    <div className={`flex items-center gap-3 select-none cursor-pointer ${className}`}>
      {/* Official Nivora Care Hospital Logo Image */}
      <div className="relative flex-shrink-0">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white p-0.5 shadow-md ring-1 ring-slate-200/90 overflow-hidden transition-transform duration-200 hover:scale-105">
          <img
            src={nivoraLogo}
            alt="Nivora Care Hospital"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Active Live Beacon Dot on corner */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 ring-2 ring-white"></span>
        </span>
      </div>

      {/* Hospital Name & Tagline */}
      {variant !== "icon" && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-base font-black tracking-tight leading-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Nivora Care
            </span>
            <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 ring-1 ring-teal-500/30">
              Hospital
            </span>
          </div>

          {variant === "full" && (
            <p className={`text-[10px] font-semibold tracking-wider uppercase ${isDark ? "text-teal-300" : "text-teal-700"}`}>
              Care • trust • healing
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default HospitalLogo;

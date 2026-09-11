import nivoraLogo from "../assets/nivora-logo.png";

function HospitalLogo({ variant = "full", className = "", isDark = false }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Nivora Care Hospital Logo Image */}
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-0.5 border border-slate-200 overflow-hidden">
          <img
            src={nivoraLogo}
            alt="Nivora Care Hospital"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Hospital Name */}
      {variant !== "icon" && (
        <span
          className={`text-base sm:text-lg font-bold tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Nivora Care Hospital
        </span>
      )}
    </div>
  );
}

export default HospitalLogo;

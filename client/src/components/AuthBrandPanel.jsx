import HospitalLogo from "./HospitalLogo.jsx";

const THEMES = {
  rose: {
    gradient: "from-slate-900 via-rose-950 to-rose-800",
    orbA: "bg-rose-400/25",
    orbB: "bg-fuchsia-400/15",
    highlight: "text-rose-200",
    chip: "bg-white/5 ring-white/10 text-rose-100",
    pulse: "stroke-rose-200",
    statBg: "bg-white/10 ring-white/10",
  },
  blue: {
    gradient: "from-blue-950 via-indigo-900 to-blue-700",
    orbA: "bg-sky-400/25",
    orbB: "bg-indigo-400/15",
    highlight: "text-sky-200",
    chip: "bg-white/5 ring-white/10 text-sky-100",
    pulse: "stroke-sky-200",
    statBg: "bg-white/10 ring-white/10",
  },
};

function AuthBrandPanel({
  accent = "blue",
  badge = "Secure Access",
  title = "",
  subtitle = "",
  features = [],
  stats = [],
}) {
  const theme = THEMES[accent] || THEMES.blue;

  return (
    <aside
      className={`relative hidden lg:flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-10 text-white shadow-2xl shadow-slate-400/40 min-h-[560px]`}
    >
      {/* Decorative blurred orbs */}
      <div className={`pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full ${theme.orbA} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full ${theme.orbB} blur-3xl`} />

      {/* Fine dotted grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Floating decorative pill */}
      <div className="pointer-events-none absolute top-10 right-10 hidden xl:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-beacon" />
        Live hospital network
      </div>

      {/* Top: brand + badge */}
      <div className="relative">
        <HospitalLogo variant="full" isDark to="/" />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full ring-1 ring-white/20 bg-white/5 px-3 py-1 text-xs font-semibold">
          <svg className={`h-3.5 w-3.5 ${theme.highlight}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {badge}
        </div>

        <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300/90">
          {subtitle}
        </p>

        {features.length > 0 && (
          <ul className="mt-7 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-200">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${theme.chip}`}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: heartbeat visual + stats */}
      <div className="relative">
        <div className="flex items-end gap-2">
          <svg viewBox="0 0 320 64" className="w-full max-w-sm" fill="none" aria-hidden="true">
            <path
              d="M0 32 H56 L70 12 L88 52 L104 32 H140 L154 20 L172 44 L188 32 L320 32"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={theme.pulse}
              opacity="0.9"
            />
            <circle cx="104" cy="32" r="3" className={`fill-white ${theme.highlight}`} opacity="0.9" />
          </svg>
          <span className={`pb-1 text-[11px] font-medium ${theme.highlight}`}>⌁ Monitoring</span>
        </div>

        {stats.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl px-3 py-2.5 ring-1 backdrop-blur ${theme.statBg}`}
              >
                <p className="font-display text-lg font-semibold leading-tight">{stat.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default AuthBrandPanel;
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "../components/HospitalLogo.jsx";

const PORTAL_TYPES = [
  {
    id: "admin",
    role: "admin",
    authType: "staff",
    title: "Hospital Administrator",
    subtitle: "Executive command, clinical analytics, staff roster & hospital revenue",
    badge: "Full Admin Access",
    badgeColor: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
    activeRing: "ring-purple-500 border-purple-500/80 bg-purple-950/40",
    iconBg: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    glowColor: "from-purple-600/20 to-indigo-600/20",
    defaultEmail: "admin@hospital.com",
    defaultPass: "admin123",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "doctor",
    role: "doctor",
    authType: "staff",
    title: "Medical Doctor",
    subtitle: "Doctor consultation queue, clinical schedules & patient treatment notes",
    badge: "Clinical Specialist",
    badgeColor: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
    activeRing: "ring-emerald-500 border-emerald-500/80 bg-emerald-950/40",
    iconBg: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    glowColor: "from-emerald-600/20 to-teal-600/20",
    defaultEmail: "doctor@hospital.com",
    defaultPass: "doctor123",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "receptionist",
    role: "receptionist",
    authType: "staff",
    title: "Front Desk & Reception",
    subtitle: "Patient check-in, OPD appointments desk & instant billing cashier",
    badge: "Admissions Desk",
    badgeColor: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
    activeRing: "ring-amber-500 border-amber-500/80 bg-amber-950/40",
    iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    glowColor: "from-amber-600/20 to-orange-600/20",
    defaultEmail: "receptionist@hospital.com",
    defaultPass: "receptionist123",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "patient",
    role: "patient",
    authType: "patient",
    title: "Patient Care Portal",
    subtitle: "Self-service specialist booking, medical history & printable invoice receipts",
    badge: "Patient Services",
    badgeColor: "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30",
    activeRing: "ring-cyan-500 border-cyan-500/80 bg-cyan-950/40",
    iconBg: "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
    glowColor: "from-cyan-600/20 to-blue-600/20",
    defaultEmail: "john@example.com",
    defaultPass: "patient123",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState(PORTAL_TYPES[0]);
  const [email, setEmail] = useState(PORTAL_TYPES[0].defaultEmail);
  const [password, setPassword] = useState(PORTAL_TYPES[0].defaultPass);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handlePortalSelect = (portal) => {
    setSelectedPortal(portal);
    setEmail(portal.defaultEmail);
    setPassword(portal.defaultPass);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password, selectedPortal.authType);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDemoLogin = async (portal) => {
    setError("");
    setIsSubmitting(true);
    setSelectedPortal(portal);
    setEmail(portal.defaultEmail);
    setPassword(portal.defaultPass);

    try {
      await login(portal.defaultEmail, portal.defaultPass, portal.authType);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center overflow-x-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Top Header & Branding */}
        <div className="text-center mb-8">
          <HospitalLogo variant="full" isDark={true} className="justify-center" />
          <h1 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
            Unified Healthcare Access Gateway
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Please select your portal type below to enter your dedicated clinical, administrative, or patient workspace under this system.
          </p>
        </div>

        {/* ================= 4 PORTAL TILES SELECTION ================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 1: Select Your Portal Type
            </span>
            <span className="text-xs text-blue-400 font-semibold">
              4 Specialized Portals Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PORTAL_TYPES.map((portal) => {
              const isSelected = selectedPortal.id === portal.id;
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => handlePortalSelect(portal)}
                  className={`group relative flex flex-col text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `${portal.activeRing} ring-2 shadow-xl shadow-black/40 scale-[1.02]`
                      : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  {/* Top Status & Radio Pill */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${portal.iconBg} transition-transform group-hover:scale-105`}>
                      {portal.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${portal.badgeColor}`}>
                        {portal.badge}
                      </span>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-white bg-blue-600" : "border-slate-600"
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed flex-1">
                    {portal.subtitle}
                  </p>

                  {/* Quick 1-click button inside tile */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between w-full">
                    <span className="text-[11px] font-mono text-slate-400">
                      {isSelected ? "● Selected Portal" : "Click to select"}
                    </span>
                    <span className="text-xs font-bold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                      {isSelected ? "Ready →" : "Choose"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= STEP 2: CREDENTIALS & LOGIN CARD ================= */}
        <div className="max-w-xl mx-auto">
          <section className="rounded-2xl border border-slate-800/90 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            {/* Active Portal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${selectedPortal.iconBg}`}>
                  {selectedPortal.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Sign in as {selectedPortal.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Entering dedicated {selectedPortal.role.toUpperCase()} workspace
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${selectedPortal.badgeColor}`}>
                {selectedPortal.badge}
              </span>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="email">
                  {selectedPortal.role === "patient" ? "Patient Email Address" : "Staff Email Address"}
                </label>
                <input
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300" htmlFor="password">
                  Password
                </label>
                <input
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-800/50 bg-rose-950/60 p-3 text-xs font-medium text-rose-300" role="alert">
                  <svg className="h-4 w-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {/* Regular Sign In Button */}
                <button
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Authenticating...
                    </span>
                  ) : (
                    `Enter ${selectedPortal.title} →`
                  )}
                </button>

                {/* 1-Click Instant Demo Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleInstantDemoLogin(selectedPortal)}
                  className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500/50 hover:bg-slate-700 hover:text-white transition"
                >
                  ⚡ 1-Click Demo
                </button>
              </div>
            </form>

            {/* Quick Registration for Patients */}
            {selectedPortal.role === "patient" && (
              <div className="mt-5 border-t border-slate-800 pt-4 text-center">
                <p className="text-xs text-slate-400">
                  New to City General Hospital?{" "}
                  <Link to="/patient/register" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                    Register as New Patient →
                  </Link>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;

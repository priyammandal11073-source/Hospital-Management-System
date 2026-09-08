import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "../components/HospitalLogo.jsx";

const PORTAL_TYPES = [
  {
    id: "admin",
    role: "admin",
    authType: "staff",
    title: "Hospital administrator",
    badge: "Full admin access",
    badgeColor: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
    iconBg: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    defaultEmail: "admin@hospital.com",
    defaultPass: "admin123",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "doctor",
    role: "doctor",
    authType: "staff",
    title: "Medical doctor",
    badge: "Clinical specialist",
    badgeColor: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
    iconBg: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    defaultEmail: "doctor@hospital.com",
    defaultPass: "doctor123",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "receptionist",
    role: "receptionist",
    authType: "staff",
    title: "Front desk & reception",
    badge: "Admissions desk",
    badgeColor: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
    iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    defaultEmail: "receptionist@hospital.com",
    defaultPass: "receptionist123",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "patient",
    role: "patient",
    authType: "patient",
    title: "Patient care portal",
    badge: "Patient services",
    badgeColor: "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30",
    iconBg: "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
    defaultEmail: "john@example.com",
    defaultPass: "patient123",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();
  const [step, setStep] = useState(1);
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
    setStep(2);
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
        {/* ================= STEP 1: SELECT PORTAL TILE ================= */}
        {step === 1 && (
          <div className="w-full max-w-4xl mx-auto">
            {/* Top Header & Branding */}
            <div className="text-center mb-10">
              <Link to="/" onClick={() => setStep(1)} className="inline-flex transition hover:opacity-95 cursor-pointer" title="Home page">
                <HospitalLogo variant="full" isDark={true} className="justify-center" />
              </Link>
              <h1 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
                Unified healthcare access gateway
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                Select your portal type to continue to sign in
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {PORTAL_TYPES.map((portal) => (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => handlePortalSelect(portal)}
                  className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1.5 transition-all duration-200 cursor-pointer text-center"
                >
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${portal.iconBg} mb-5 transition-transform duration-200 group-hover:scale-110 shadow-lg shadow-black/30`}>
                    {portal.icon}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {portal.title}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 2: CREDENTIALS & LOGIN CARD ================= */}
        {step === 2 && (
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
              <Link to="/" onClick={() => setStep(1)} className="inline-flex transition hover:opacity-95 cursor-pointer" title="Home page">
                <HospitalLogo variant="full" isDark={true} className="justify-center" />
              </Link>
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 group-hover:bg-slate-700 transition">
                  ←
                </span>
                <span>Back to portal selection</span>
              </button>
            </div>

            <section className="rounded-2xl border border-slate-800/90 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
              {/* Active Portal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${selectedPortal.iconBg}`}>
                    {selectedPortal.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Sign in as {selectedPortal.title}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Enter your credentials to continue
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg bg-slate-800/80 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="email">
                    {selectedPortal.role === "patient" ? "Patient email address" : "Staff email address"}
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
                  <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="password">
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
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                    className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500/50 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    ⚡ 1-click demo
                  </button>
                </div>
              </form>

              {/* Quick Registration for Patients */}
              {selectedPortal.role === "patient" && (
                <div className="mt-5 border-t border-slate-800 pt-4 text-center">
                  <p className="text-xs text-slate-400">
                    New to Nivora Care Hospital?{" "}
                    <Link to="/patient/register" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                      Register as new patient →
                    </Link>
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default Login;

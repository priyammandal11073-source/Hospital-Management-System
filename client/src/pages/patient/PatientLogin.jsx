import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext.jsx";
import HospitalLogo from "../../components/HospitalLogo.jsx";

function PatientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = usePatientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400">Verifying patient session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

      {/* Patient Login Card */}
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Animated Hospital Branding Top Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" className="transition hover:opacity-95 cursor-pointer" title="Home page">
            <HospitalLogo variant="full" isDark={true} className="justify-center" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Patient care portal
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="p-email">
              Patient email address
            </label>
            <input
              id="p-email"
              type="email"
              required
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300" htmlFor="p-password">
              Password
            </label>
            <input
              id="p-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              autoComplete="current-password"
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

          <button
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Signing in...
              </span>
            ) : (
              "Sign in to patient portal"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-[11px] font-semibold text-slate-400">
            Quick fill demo patient:
          </p>
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => {
                setEmail("john@example.com");
                setPassword("patient123");
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/50 hover:bg-slate-700 hover:text-white text-center"
            >
              👤 Rahul Sharma (john@example.com)
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
          <span>Don&apos;t have an account?</span>
          <Link to="/patient/register" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
            Register as new patient →
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Hospital Staff?{" "}
          <Link to="/login" className="font-medium text-slate-400 hover:text-white hover:underline">
            Staff Portal Login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default PatientLogin;

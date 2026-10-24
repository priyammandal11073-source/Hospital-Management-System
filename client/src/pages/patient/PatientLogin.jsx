import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext.jsx";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import AuthBrandPanel from "../../components/AuthBrandPanel.jsx";
import Footer from "../../components/Footer.jsx";


function PatientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login } = usePatientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying patient session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (successMessage) setSuccessMessage("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (successMessage) setSuccessMessage("");
    setIsSubmitting(true);
    try {
      await login(email, password, rememberMe);
      navigate("/patient/dashboard");
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg === "Protected by Vercel Authentication" || err.response?.data?.protection) {
        setError("Deployment is protected by Vercel Authentication. Please disable Deployment Protection in your Vercel Project Settings.");
      } else {
        setError(serverMsg || "Unable to log in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className="relative min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans overflow-hidden">
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid gap-8 items-center lg:grid-cols-[0.9fr_1.1fr]">
          {/* Decorative brand panel */}
          <AuthBrandPanel
            accent="slate"
            badge="Patient Portal"
            title="Your Health, One Login Away"
            subtitle="Access prescriptions, lab reports, appointments, and bills securely — anywhere, anytime."
            features={[
              "View reports, vitals & prescriptions instantly",
              "Book, reschedule & track appointments",
              "Manage your medical timeline securely",
            ]}
            stats={[
              { value: "24/7", label: "Health access" },
              { value: "100K+", label: "Records secured" },
              { value: "4.9", label: "Patient rating" },
            ]}
          />

          {/* Interactive panel */}
          <div className="w-full">
            <div className="mb-6 flex items-center justify-center lg:hidden">
              <Link to="/" className="transition hover:opacity-95 cursor-pointer" title="Home page">
                <HospitalLogo variant="full" />
              </Link>
            </div>

            <section className="w-full liquid-glass-elevated rounded-3xl p-6 sm:p-8 shadow-xl">
              {/* Portal header */}
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl liquid-glass-subtle flex items-center justify-center text-slate-800 flex-shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Patient Portal</h2>
                    <p className="text-xs text-slate-500">Personal health portal</p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="liquid-glass-pill px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Home
                </Link>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {successMessage && (
                  <div className="flex items-center gap-2 rounded-xl liquid-glass-card border-emerald-200/80 p-3 text-xs font-medium text-emerald-800" role="status">
                    <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="flex-1">{successMessage}</span>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="p-email">
                    Patient Email Address
                  </label>
                  <input
                    className="w-full rounded-xl liquid-glass-subtle px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    id="p-email"
                    type="email"
                    placeholder="patient@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700" htmlFor="p-password">
                      Password
                    </label>
                    <Link
                      to="/patient/forgot-password"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    className="w-full rounded-xl liquid-glass-subtle px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    id="p-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  Remember me on this device
                </label>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl liquid-glass-card border-rose-200/80 p-3 text-xs font-medium text-rose-800" role="alert">
                    <svg className="h-4 w-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In →"
                    )}
                  </button>
                </div>
              </form>

              {/* Patient Registration Link */}
              <div className="mt-5 border-t border-slate-200/50 pt-4 text-center">
                <p className="text-xs text-slate-600">
                  First time patient?{" "}
                  <Link to="/patient/register" className="font-semibold text-slate-900 hover:underline">
                    Register as New Patient →
                  </Link>
                </p>
              </div>
            </section>

            <p className="mt-4 text-center text-xs text-slate-500">
              Hospital Staff?{" "}
              <Link to="/login" className="font-medium text-slate-700 hover:underline">
                Staff Portal Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto mt-12">
        <Footer className="rounded-3xl border border-white/80 shadow-lg" />
      </div>
    </main>
  );
}

export default PatientLogin;
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext.jsx";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import AuthBrandPanel from "../../components/AuthBrandPanel.jsx";

const DEMO_PATIENT = { email: "john@example.com", password: "patient123" };

function PatientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login } = usePatientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await login(email, password);
      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    if (successMessage) setSuccessMessage("");
    setEmail(DEMO_PATIENT.email);
    setPassword(DEMO_PATIENT.password);
    setIsSubmitting(true);
    try {
      await login(DEMO_PATIENT.email, DEMO_PATIENT.password);
      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#faf7f4] py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans overflow-hidden">
      {/* Decorative soft background shapes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-fuchsia-200/40 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-rose-100/60 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid gap-8 items-center lg:grid-cols-[0.9fr_1.1fr]">
          {/* Decorative brand panel */}
          <AuthBrandPanel
            accent="rose"
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

            <section className="w-full bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-300/40">
              {/* Portal header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
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
                  className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Home
                </Link>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {successMessage && (
                  <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800" role="status">
                    <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="flex-1">{successMessage}</span>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="p-email">
                    Patient Email Address
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
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
                  <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="p-password">
                    Password
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    id="p-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800" role="alert">
                    <svg className="h-4 w-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
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

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDemoLogin}
                    className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    title="Direct sign-in with demo patient credentials"
                  >
                    Demo Entry
                  </button>
                </div>
              </form>

              {/* Patient Registration Link */}
              <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                <p className="text-xs text-slate-600">
                  First time patient?{" "}
                  <Link to="/patient/register" className="font-medium text-rose-600 hover:underline">
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
    </main>
  );
}

export default PatientLogin;
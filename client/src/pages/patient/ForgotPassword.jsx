import { useState } from "react";
import { Link } from "react-router-dom";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import AuthBrandPanel from "../../components/AuthBrandPanel.jsx";
import Footer from "../../components/Footer.jsx";
import {
  resetPatientPassword,
  sendForgotPasswordOtp,
} from "../../services/api.js";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsSubmitting(true);
    try {
      await sendForgotPasswordOtp(email);
      setInfo("If a patient account exists for this email, a 6-digit reset OTP has been sent.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send the reset OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPatientPassword({ email, otp, newPassword });
      setInfo("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/patient/login";
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset the password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600";

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
          <AuthBrandPanel
            accent="rose"
            badge="Patient Portal"
            title="Reset Your Password"
            subtitle="Verify your identity with a one-time code, then choose a new password to get back into your health portal."
            features={[
              "Secure one-time verification code",
              "Recovery via registered mobile number",
              "Instant re-entry to your portal",
            ]}
            stats={[
              { value: "5:00", label: "OTP validity" },
              { value: "100%", label: "Private" },
              { value: "24/7", label: "Support" },
            ]}
          />

          <div className="w-full">
            <div className="mb-6 flex items-center justify-center lg:hidden">
              <Link to="/" className="transition hover:opacity-95 cursor-pointer" title="Home page">
                <HospitalLogo variant="full" />
              </Link>
            </div>

            <section className="w-full bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-300/40">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Forgot Password</h2>
                    <p className="text-xs text-slate-500">Patient self-service recovery</p>
                  </div>
                </div>
                <Link
                  to="/patient/login"
                  className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Back to Login
                </Link>
              </div>

              {/* Step indicator */}
              <div className="mb-5 flex items-center gap-2">
                {[1, 2].map((s) => (
                  <span
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      step >= s ? "w-8 bg-rose-600" : "w-4 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {info && (
                <div
                  className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800"
                  role="status"
                >
                  <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1">{info}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800" role="alert">
                  <svg className="h-4 w-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                <form className="space-y-4" onSubmit={handleSendOtp}>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="fp-email">
                      Registered Email Address
                    </label>
                    <input
                      className={inputClass}
                      id="fp-email"
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Sending OTP...
                        </span>
                      ) : (
                        "Send Reset OTP →"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleReset}>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="fp-otp">
                      6-Digit OTP
                    </label>
                    <input
                      className={inputClass}
                      id="fp-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength="6"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="fp-new-password">
                      New Password
                    </label>
                    <input
                      className={inputClass}
                      id="fp-new-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="fp-confirm-password">
                      Confirm New Password
                    </label>
                    <input
                      className={inputClass}
                      id="fp-confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Resetting...
                        </span>
                      ) : (
                        "Reset Password →"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <p className="mt-4 text-center text-xs text-slate-500">
              Remembered your password?{" "}
              <Link to="/patient/login" className="font-medium text-rose-600 hover:underline">
                Sign In →
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

export default ForgotPassword;
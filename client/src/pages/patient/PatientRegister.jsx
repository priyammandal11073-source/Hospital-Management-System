import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPatient, sendRegistrationOtp } from "../../services/api.js";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import AuthBrandPanel from "../../components/AuthBrandPanel.jsx";
import Footer from "../../components/Footer.jsx";

const RESEND_COOLDOWN_SECONDS = 30;

function PatientRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    contactNumber: "",
    abhaId: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    },
    []
  );

  const startResendCooldown = () => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const maskNumber = (num) => {
    const digits = String(num || "").replace(/\D/g, "");
    if (digits.length !== 10) return num;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handleChange = (e) =>
    setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const requireFields = () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.age ||
      !formData.gender ||
      !formData.contactNumber.trim()
    ) {
      setError("Please fill out all required fields.");
      return false;
    }
    return true;
  };

  const buildRegistrationPayload = () => ({
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    age: Number(formData.age),
    gender: formData.gender,
    contactNumber: formData.contactNumber.trim(),
    abhaId: formData.abhaId.trim() || undefined,
    otp: otp.trim(),
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!requireFields()) return;
    setIsSubmitting(true);
    try {
      await sendRegistrationOtp({
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
      });
      setStep(2);
      setOtp("");
      setInfoMessage(
        `A 6-digit OTP has been sent to ${maskNumber(formData.contactNumber)}.`
      );
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setIsSubmitting(true);
    try {
      await sendRegistrationOtp({
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
      });
      setInfoMessage(`A new OTP has been sent to ${maskNumber(formData.contactNumber)}.`);
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit OTP sent to your mobile number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPatient(buildRegistrationPayload());
      navigate("/patient/login", {
        state: { message: "Registration successful! Please log in with your email and password." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mt-5 mb-1">
      {[1, 2].map((s) => (
        <span
          key={s}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            step >= s ? "bg-rose-600" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );

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
            title="Create Your Health Account"
            subtitle="Register once with a verified mobile number and step into a secure digital care journey."
            features={[
              "OTP-verified registration for security",
              "Portable health & prescription history",
              "Doctor-approved care records",
            ]}
            stats={[
              { value: "2", label: "Easy steps" },
              { value: "60s", label: "To get verified" },
              { value: "100%", label: "Private & secure" },
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
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {step === 1 ? "New Patient Registration" : "Verify Mobile Number"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {step === 1 ? "Create your personal health portal account" : "Enter the OTP sent via SMS"}
                    </p>
                  </div>
                </div>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  Step {step} of 2
                </span>
              </div>

              {step === 1 ? (
                <form className="space-y-4" onSubmit={handleSendOtp}>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Full legal name *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Email address *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="rahul.sharma@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Password *
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Age *
                      </label>
                      <input
                        name="age"
                        type="number"
                        min="0"
                        required
                        placeholder="32"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Contact number (10-digit mobile) *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-xs text-slate-500 font-mono">
                        +91
                      </span>
                      <input
                        name="contactNumber"
                        required
                        placeholder="98765 43210"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className="w-full rounded-r-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600 font-mono"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      ABHA number (Ayushman Bharat, optional)
                    </label>
                    <input
                      name="abhaId"
                      placeholder="e.g. 14-8891-2345-6789 or username@abdm"
                      value={formData.abhaId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600 font-mono text-xs"
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
                      "Send OTP & Continue →"
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-500">
                    We&apos;ll send a verification code to your mobile number to confirm the registration.
                  </p>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleVerifyAndRegister}>
                  {infoMessage && (
                    <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-2.5 text-xs font-medium text-blue-800" role="status">
                      <svg className="h-4 w-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="flex-1">{infoMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="otp-code">
                      6-digit OTP *
                    </label>
                    <input
                      id="otp-code"
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-lg tracking-[0.5em] text-slate-900 placeholder-slate-300 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600 font-mono"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Enter the 6-digit code from the SMS sent to {maskNumber(formData.contactNumber)}.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-800" role="alert">
                      <svg className="h-4 w-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    className="w-full rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Verifying & registering...
                      </span>
                    ) : (
                      "Verify OTP & Complete Registration"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer"
                  >
                    ← Edit registration details
                  </button>

                  <div className="text-center text-xs text-slate-600">
                    Didn&apos;t receive the code?{" "}
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={handleResendOtp}
                      className="font-medium text-rose-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </form>
              )}

              {renderStepIndicator()}
            </section>

            <p className="mt-4 text-center text-xs text-slate-500">
              Already registered?{" "}
              <Link to="/patient/login" className="font-medium text-slate-700 hover:underline">
                Sign in to patient portal →
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

export default PatientRegister;
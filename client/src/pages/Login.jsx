import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "../components/HospitalLogo.jsx";

const PORTAL_TYPES = [
  {
    id: "admin",
    name: "Admin",
    role: "admin",
    authType: "staff",
    tagline: "Governance & Operations",
    badgeBg: "bg-indigo-50/90 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
    accentColor: "bg-indigo-600",
    defaultEmail: "admin@hospital.com",
    defaultPass: "admin123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "doctor",
    name: "Doctor",
    role: "doctor",
    authType: "staff",
    tagline: "Clinical & OPD Consults",
    badgeBg: "bg-teal-50/90 text-teal-600 border-teal-100 group-hover:bg-teal-600 group-hover:text-white",
    accentColor: "bg-teal-600",
    defaultEmail: "doctor@hospital.com",
    defaultPass: "doctor123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "nurse",
    name: "Nursing",
    role: "nurse",
    authType: "staff",
    tagline: "Inpatient Vitals & Wards",
    badgeBg: "bg-emerald-50/90 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
    accentColor: "bg-emerald-600",
    defaultEmail: "nurse@hospital.com",
    defaultPass: "nurse123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: "receptionist",
    name: "Reception",
    role: "receptionist",
    authType: "staff",
    tagline: "Front Desk & Triage",
    badgeBg: "bg-sky-50/90 text-sky-600 border-sky-100 group-hover:bg-sky-600 group-hover:text-white",
    accentColor: "bg-sky-600",
    defaultEmail: "receptionist@hospital.com",
    defaultPass: "receptionist123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "patient",
    name: "Patient",
    role: "patient",
    authType: "patient",
    tagline: "Personal Health Portal",
    badgeBg: "bg-rose-50/90 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white",
    accentColor: "bg-rose-600",
    defaultEmail: "john@example.com",
    defaultPass: "patient123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "pharmacist",
    name: "Pharmacy",
    role: "pharmacist",
    authType: "staff",
    tagline: "Dispensing & Stock",
    badgeBg: "bg-purple-50/90 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white",
    accentColor: "bg-purple-600",
    defaultEmail: "pharmacist@hospital.com",
    defaultPass: "pharmacist123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "diagnostic",
    name: "Diagnostics",
    role: "diagnostic_admin",
    authType: "staff",
    tagline: "Pathology & Imaging RIS",
    badgeBg: "bg-cyan-50/90 text-cyan-600 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white",
    accentColor: "bg-cyan-600",
    defaultEmail: "diagnostics@hospital.com",
    defaultPass: "diagnostic123",
    subRoles: [
      { name: "Administrator", email: "diagnostics@hospital.com", pass: "diagnostic123", role: "diagnostic_admin" },
      { name: "Pathologist", email: "pathologist@hospital.com", pass: "pathologist123", role: "pathologist" },
      { name: "Radiologist", email: "radiologist@hospital.com", pass: "radiologist123", role: "radiologist" },
      { name: "Lab Tech", email: "labtech@hospital.com", pass: "labtech123", role: "lab_technician" },
      { name: "Rad Tech", email: "radtech@hospital.com", pass: "radtech123", role: "radiology_technician" },
    ],
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
          <p className="text-xs text-slate-500 font-medium">Loading...</p>
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
    <main className="min-h-screen bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-4xl mx-auto">
        {/* ================= STEP 1: SELECT PORTAL ================= */}
        {step === 1 && (
          <div className="w-full">
            {/* Header: Exact Hospital Name & Clean Logo */}
            <div className="mb-8 flex items-center justify-center">
              <HospitalLogo variant="full" />
            </div>

            {/* 7-Portal Matrix: 3 cols desktop, 2 cols tablet, 1 col mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PORTAL_TYPES.map((portal) => {
                const isDiagnostics = portal.id === "diagnostic";
                return (
                  <button
                    type="button"
                    key={portal.id}
                    onClick={() => handlePortalSelect(portal)}
                    className={`group relative bg-white border border-slate-200 rounded-md p-5 flex flex-col items-center justify-center text-center gap-3 h-32 hover:border-slate-400 hover:bg-slate-50/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                      isDiagnostics
                        ? "sm:col-span-2 sm:w-full sm:max-w-[calc(50%-0.5rem)] sm:mx-auto lg:col-span-1 lg:col-start-2 lg:max-w-none"
                        : ""
                    }`}
                  >
                    <div className="h-8 w-8 flex items-center justify-center">
                      {portal.icon}
                    </div>

                    <span className="text-base font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                      {portal.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: CREDENTIALS & LOGIN CARD ================= */}
        {step === 2 && (
          <div className="w-full max-w-md mx-auto">
            {/* Header: Clean Logo & Brand */}
            <div className="mb-6 flex items-center justify-center">
              <HospitalLogo variant="full" />
            </div>

            <div className="mb-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span>← Back to portal selection</span>
              </button>
            </div>

            <section className="bg-white rounded-md border border-slate-200 p-6 sm:p-7 shadow-xs">
              {/* Active Portal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                    {selectedPortal.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {selectedPortal.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {selectedPortal.subRoles && (
                  <div className="rounded border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Specialization:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPortal.subRoles.map((sr) => {
                        const isCurrent = email === sr.email;
                        return (
                          <button
                            key={sr.role}
                            type="button"
                            onClick={() => {
                              setEmail(sr.email);
                              setPassword(sr.pass);
                              setError("");
                            }}
                            className={`rounded px-2 py-1 text-xs font-medium transition cursor-pointer ${
                              isCurrent
                                ? "bg-blue-700 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {sr.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="email">
                    {selectedPortal.role === "patient" ? "Patient Email Address" : "Staff Email"}
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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
                    className="flex-1 rounded bg-blue-700 hover:bg-blue-800 px-4 py-2 text-sm font-medium text-white shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Authenticating...
                      </span>
                    ) : (
                      "Sign In →"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleInstantDemoLogin(selectedPortal)}
                    className="rounded border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    title="Direct sign-in with demo credentials"
                  >
                    Demo Entry
                  </button>
                </div>
              </form>

              {/* Patient Registration Link */}
              {selectedPortal.role === "patient" && (
                <div className="mt-5 border-t border-slate-100 pt-4 text-center">
                  <p className="text-xs text-slate-600">
                    First time patient?{" "}
                    <Link to="/patient/register" className="font-medium text-blue-700 hover:underline">
                      Register as New Patient →
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

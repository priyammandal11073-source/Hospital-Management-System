import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "../components/HospitalLogo.jsx";
import Footer from "../components/Footer.jsx";

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
      {
        name: "Administrator",
        email: "diagnostics@hospital.com",
        pass: "diagnostic123",
        role: "diagnostic_admin",
        tagline: "Ops & Approvals",
        accentColor: "bg-cyan-600",
        icon: (
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6.5-1.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
      {
        name: "Pathologist",
        email: "pathologist@hospital.com",
        pass: "pathologist123",
        role: "pathologist",
        tagline: "Report Review",
        accentColor: "bg-teal-600",
        icon: (
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        name: "Radiologist",
        email: "radiologist@hospital.com",
        pass: "radiologist123",
        role: "radiologist",
        tagline: "PACS Reading",
        accentColor: "bg-sky-600",
        icon: (
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        ),
      },
      {
        name: "Lab Tech",
        email: "labtech@hospital.com",
        pass: "labtech123",
        role: "lab_technician",
        tagline: "Workbench",
        accentColor: "bg-indigo-600",
        icon: (
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        name: "Rad Tech",
        email: "radtech@hospital.com",
        pass: "radtech123",
        role: "radiology_technician",
        tagline: "Scan Worklist",
        accentColor: "bg-violet-600",
        icon: (
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h1.5l.86-1.72A2 2 0 019.34 4h5.32a2 2 0 011.79 1.1L17.32 7H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm8.5 1.5a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        ),
      },
    ],
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    id: "emergency",
    name: "Emergency",
    role: "emergency",
    authType: "staff",
    tagline: "ER Triage & Resuscitation",
    badgeBg: "bg-rose-50/90 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white",
    accentColor: "bg-rose-600",
    defaultEmail: "emergency@hospital.com",
    defaultPass: "emergency123",
    icon: (
      <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, login } = useAuth();
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
    if (user?.role === "emergency") {
      return <Navigate to="/emergency/dashboard" replace />;
    }
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
      const loggedUser = await login(email, password, selectedPortal.authType);
      if (loggedUser?.role === "emergency" || selectedPortal?.id === "emergency") {
        navigate("/emergency/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (requestError) {
      const serverMsg = requestError.response?.data?.message;
      if (serverMsg === "Protected by Vercel Authentication" || requestError.response?.data?.protection) {
        setError("Deployment is protected by Vercel Authentication. Please disable Deployment Protection in your Vercel Project Settings.");
      } else {
        setError(serverMsg || "Authentication failed. Please verify credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const containerMaxWidth =
    step === 1
      ? "max-w-4xl"
      : step === 2 && selectedPortal.subRoles
      ? "max-w-2xl"
      : "max-w-md";

  return (
    <main className="relative min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center font-sans overflow-hidden">
      <div className={`relative z-10 w-full ${containerMaxWidth} mx-auto transition-all duration-300`}>
        {/* Centered Brand Header */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <HospitalLogo variant="full" to="/" />
          <p className="mt-2 text-xs uppercase tracking-widest font-semibold text-slate-400">
            Enterprise Clinical Gateway
          </p>
        </div>

        {/* ================= STEP 1: SELECT PORTAL ================= */}
        {step === 1 && (
          <section className="w-full liquid-glass-elevated rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="font-display text-[1.65rem] font-semibold text-slate-900 tracking-tight">Choose Your Portal</h1>
              <p className="mt-1 text-sm text-slate-500">
                Select the department you&apos;d like to access
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {PORTAL_TYPES.map((portal) => (
                <button
                  type="button"
                  key={portal.id}
                  onClick={() => handlePortalSelect(portal)}
                  className="group relative liquid-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[7.5rem] transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl liquid-glass-subtle text-slate-700 flex items-center justify-center transition-all duration-150">
                    {portal.icon}
                  </div>

                  <span className="text-sm font-semibold text-slate-900 tracking-tight">
                    {portal.name}
                  </span>

                  <span className="text-[11px] text-slate-400 font-normal line-clamp-1">
                    {portal.tagline}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ================= STEP 2: SUB-ROLE TILES ONLY (DIAGNOSTICS) ================= */}
        {step === 2 && selectedPortal.subRoles && (
          <section className="w-full liquid-glass-elevated rounded-3xl p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 liquid-glass-pill px-3 py-1.5 transition-colors cursor-pointer mb-6"
            >
              <span>← Back to portal selection</span>
            </button>

            <div className="mb-6 text-center">
              <h1 className="font-display text-[1.5rem] font-semibold text-slate-900 tracking-tight">Select Specialization</h1>
              <p className="mt-1 text-sm text-slate-500">
                Choose your role in the Diagnostics department to continue
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {selectedPortal.subRoles.map((sr) => (
                <button
                  key={sr.role}
                  type="button"
                  onClick={() => {
                    setEmail(sr.email);
                    setPassword(sr.pass);
                    setError("");
                    setStep(3);
                  }}
                  className="group relative liquid-glass-card rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[7.5rem] transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl liquid-glass-subtle text-slate-700 flex items-center justify-center transition-all duration-150">
                    {sr.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 tracking-tight">
                    {sr.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal line-clamp-1">
                    {sr.tagline}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ================= STEP 2 (NO SUB-ROLES) / STEP 3: CREDENTIALS & LOGIN CARD ================= */}
        {((step === 2 && !selectedPortal.subRoles) || step === 3) && (
          <section className="w-full liquid-glass-elevated rounded-3xl p-6 sm:p-8 shadow-xl">
            <button
              type="button"
              onClick={() => (step === 3 ? setStep(2) : setStep(1))}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 liquid-glass-pill px-3 py-1.5 transition-colors cursor-pointer mb-5"
            >
              <span>{step === 3 ? "← Back to specialization selection" : "← Back to portal selection"}</span>
            </button>

            {/* Active Portal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl liquid-glass-subtle text-slate-800 flex items-center justify-center flex-shrink-0">
                  {selectedPortal.icon}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {selectedPortal.name}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedPortal.tagline}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="liquid-glass-pill px-3 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="email">
                  {selectedPortal.role === "patient" ? "Patient Email Address" : "Staff Email"}
                </label>
                <input
                  className="w-full rounded-xl liquid-glass-subtle px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  className="w-full rounded-xl liquid-glass-subtle px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

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
                      Authenticating...
                    </span>
                  ) : (
                    "Sign In →"
                  )}
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
        )}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto mt-12">
        <Footer className="rounded-3xl border border-white/80 shadow-lg" />
      </div>
    </main>
  );
}

export default Login;
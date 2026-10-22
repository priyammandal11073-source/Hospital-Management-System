import React from "react";
import { Link, useNavigate } from "react-router-dom";
import HospitalLogo from "../components/HospitalLogo.jsx";
import Footer from "../components/Footer.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

const NotFoundPage = () => {
  const navigate = useNavigate();
  usePageTitle("404 — Page Not Found");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f8f7f4] via-[#f4f4f1] to-[#eef1f6] font-sans overflow-x-hidden">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <HospitalLogo to="/" variant="full" />
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            Staff Login
          </Link>
          <Link
            to="/patient/login"
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-2xs"
          >
            Patient Portal
          </Link>
        </div>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-xl p-6 sm:p-10 text-center">
          {/* Subtle Pulse Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-300/50 mb-3">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
            Error Code: 404 / HTTP_RESOURCE_NOT_FOUND
          </div>

          <p className="font-display text-6xl sm:text-7xl font-black text-slate-800 tracking-tight">
            404
          </p>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Clinical Page or Medical Resource Not Found
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            The page you're trying to reach doesn't exist, was relocated, or your current session role lacks authorization to access this clinical module.
          </p>

          {/* 4 Quick Navigation Action Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              to="/dashboard"
              className="group p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  🏥
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                    Staff Clinical Dashboard
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Return to patient consultations, queues & ward management.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/patient/dashboard"
              className="group p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50/60 hover:border-rose-300 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  👤
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-700 transition">
                    Patient Self-Service Hub
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    View upcoming visits, Rx prescriptions & lab reports.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/login"
              className="group p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/60 hover:border-teal-300 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  ⇄
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
                    Switch Hospital Portal
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Access Doctor, Nurse, Admin, Pharmacy or Diagnostics.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/patient/support"
              className="group p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-300 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  🧭
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition">
                    Wayfinding & Helplines
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hospital floor directory, 24/7 emergency hotlines & FAQs.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Action Button Row */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer touch-target"
            >
              ← Go Back to Previous Screen
            </button>
            <Link
              to="/"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs cursor-pointer touch-target"
            >
              Go to Hospital Home
            </Link>
          </div>

          {/* Emergency Contact Banner */}
          <div className="mt-8 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <span>Need immediate medical assistance?</span>
            <span className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-600"></span>
              Emergency Ambulance:{" "}
              <a href="tel:108" className="hover:underline font-mono">108</a> /{" "}
              <a href="tel:112" className="hover:underline font-mono">112</a>
            </span>
          </div>
        </div>
      </main>

      {/* Structured Footer */}
      <Footer />
    </div>
  );
};

export default NotFoundPage;
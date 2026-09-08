import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "./HospitalLogo.jsx";
import NotificationBell from "./NotificationBell.jsx";

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40"
      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
  }`;

const PORTAL_CONFIG = {
  admin: {
    label: "Admin portal",
    title: "Executive hospital administration",
    badge: "👑 Administrator portal",
    badgeClass: "bg-purple-50 text-purple-700 ring-purple-500/30",
    avatarGrad: "from-purple-600 to-indigo-600",
    tagColor: "text-purple-600",
    roleDesc: "Level 3 executive access",
  },
  doctor: {
    label: "Doctor portal",
    title: "Doctor clinical workspace",
    badge: "🩺 Doctor consultation desk",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-500/30",
    avatarGrad: "from-emerald-600 to-teal-600",
    tagColor: "text-emerald-600",
    roleDesc: "Medical specialist",
  },
  receptionist: {
    label: "Front desk portal",
    title: "Front desk admissions & cashier",
    badge: "📋 Front office & check-in",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-500/30",
    avatarGrad: "from-amber-600 to-orange-600",
    tagColor: "text-amber-600",
    roleDesc: "Admissions executive",
  },
  nurse: {
    label: "Nursing station",
    title: "Nursing & inpatient care station",
    badge: "👩‍⚕️ Clinical nursing station",
    badgeClass: "bg-teal-50 text-teal-700 ring-teal-500/30",
    avatarGrad: "from-teal-600 to-cyan-600",
    tagColor: "text-teal-600",
    roleDesc: "Clinical care & ward nurse",
  },
  patient: {
    label: "Patient care portal",
    title: "Personal patient health portal",
    badge: "🏥 Patient care portal",
    badgeClass: "bg-cyan-50 text-cyan-700 ring-cyan-500/30",
    avatarGrad: "from-cyan-600 to-blue-600",
    tagColor: "text-cyan-600",
    roleDesc: "Self-service health hub",
  },
};

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || "admin";
  const config = PORTAL_CONFIG[role] || PORTAL_CONFIG.admin;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* ================= MODERN TOP HEADER BAR ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Active Workspace Badge */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="transition hover:opacity-95 cursor-pointer" title="Home page">
              <HospitalLogo variant="full" />
            </Link>

            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${config.badgeClass}`}>
                {role === "doctor" && user?.name
                  ? `🩺 Dr. ${user.name.replace(/^Dr\.\s*/i, "")} consultation desk`
                  : config.badge}
              </span>
            </div>
          </div>

          {/* Center/Right Status & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Switch Portal Button */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Switch to another portal"
            >
              <span>⇄</span>
              <span>Switch portal</span>
            </Link>

            {/* Emergency Hotline Pill */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200/80 px-3 py-1 text-xs font-semibold text-rose-700">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-bold">24/7 Emergency:</span>
              <span className="font-mono text-rose-800 font-bold">108 / 112</span>
            </div>

            {/* Current Date Badge */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{todayStr}</span>
            </div>

            {/* Real-time Notification Bell */}
            <NotificationBell isPatient={false} />

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 shadow-2xs">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr ${config.avatarGrad} text-xs font-bold text-white uppercase shadow-sm`}>
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || "User"}</p>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className={`text-[10px] font-semibold ${config.tagColor}`}>
                    {config.roleDesc}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-150 hover:bg-red-600 hover:text-white ring-1 ring-red-200 hover:ring-red-600 shadow-xs"
              type="button"
              title="Sign Out"
            >
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE (SIDEBAR + CONTENT) ================= */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Modern Dark Sidebar with Role-Specific Navigation */}
        <aside className="w-full border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-white md:min-h-[calc(100vh-65px)] md:w-64 flex flex-col justify-between">
          <div>
            {/* Sidebar Section Title */}
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                {config.label}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 capitalize">
                {role}
              </span>
            </div>

            {/* Dynamic Navigation Links based on Role */}
            <nav className="space-y-1" aria-label="Portal navigation">
              {role === "nurse" ? (
                <>
                  {/* Category 1: Nursing Station */}
                  <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nursing Station
                  </div>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </NavLink>

                  {/* Category 2: Inpatients & Care */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Inpatients & Care
                  </div>
                  <NavLink className={navLinkClass} to="/nurse/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>My Patients</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/monitoring">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Patient Monitoring</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/vitals">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Vital Signs</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/notes">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Nursing Notes</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/tasks">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Nursing Tasks</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/medications">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Medications</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/intake-output">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Intake & Output</span>
                  </NavLink>

                  {/* Category 3: Clinical Coordination */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Clinical Coordination
                  </div>
                  <NavLink className={navLinkClass} to="/nurse/doctor-orders">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Doctor Orders</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/lab-reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Lab & Diagnostics</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/transfers">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Patient Transfers</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Specialist Doctors</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Consultations Schedule</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Prescriptions Directory</span>
                  </NavLink>

                  {/* Category 4: Ward Management */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ward Management
                  </div>
                  <NavLink className={navLinkClass} to="/beds">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Beds & Wards</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/admission-discharge">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Admission / Discharge</span>
                  </NavLink>

                  {/* Category 5: Shift Management */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Shift Management
                  </div>
                  <NavLink className={navLinkClass} to="/nurse/shift">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>My Shift</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/nurse/handover">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Handover</span>
                  </NavLink>

                  {/* Category 6: Administration */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Administration
                  </div>
                  <NavLink className={navLinkClass} to="/billing">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Billing Records (View)</span>
                  </NavLink>
                </>
              ) : role === "patient" ? (
                <>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>My health hub</span>
                  </NavLink>

                  <NavLink className={navLinkClass} to="/patient/appointments/book">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Book specialist visit</span>
                  </NavLink>

                  <NavLink className={navLinkClass} to="/patient/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>My scheduled visits</span>
                  </NavLink>

                  <NavLink className={navLinkClass} to="/patient/billings">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>My invoices & receipts</span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>
                      {role === "doctor"
                        ? "Clinical dashboard"
                        : role === "receptionist"
                        ? "Reception desk"
                        : "Executive dashboard"}
                    </span>
                  </NavLink>

                  {/* Staff Navigation: Patients */}
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      {role === "doctor" ? "My patients" : role === "receptionist" ? "Patient admissions" : "Patients directory"}
                    </span>
                  </NavLink>

                  {/* Doctors / Schedule: Admin views all, Doctor views own schedule */}
                  {(role === "admin" || role === "doctor") && (
                    <NavLink className={navLinkClass} to="/doctors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {role === "doctor" ? "My schedule & availability" : "Specialist doctors"}
                      </span>
                    </NavLink>
                  )}

                  {/* Appointments */}
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>
                      {role === "doctor"
                        ? "My consultations"
                        : role === "receptionist"
                        ? "OPD scheduling"
                        : "Appointments"}
                    </span>
                  </NavLink>

                  {/* Billing: Admin & Receptionist */}
                  {(role === "admin" || role === "receptionist") && (
                    <NavLink className={navLinkClass} to="/billing">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>
                        {role === "receptionist" ? "Cashier & billing" : "Billing & invoices"}
                      </span>
                    </NavLink>
                  )}

                  {/* Digital Prescriptions (Rx) */}
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>
                      {role === "doctor" ? "Prescriptions (Rx)" : "Prescriptions directory"}
                    </span>
                  </NavLink>

                  {/* Beds & Ward Management: Receptionist & Admin */}
                  {(role === "receptionist" || role === "admin") && (
                    <NavLink className={navLinkClass} to="/beds">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Beds & wards</span>
                    </NavLink>
                  )}

                  {/* Lab Reports & Pathology */}
                  <NavLink className={navLinkClass} to="/lab-reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Lab & diagnostics</span>
                  </NavLink>

                  {/* Reports: Admin Only */}
                  {role === "admin" && (
                    <NavLink className={navLinkClass} to="/reports">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Reports & analytics</span>
                    </NavLink>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Sidebar Footer Badge */}
          <div className="mt-8 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-400">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>NABH accredited</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-tight">
              Ayushman Bharat (ABDM) connected
            </p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

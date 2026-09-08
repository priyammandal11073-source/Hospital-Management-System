import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "./HospitalLogo.jsx";

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
                {config.badge}
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
            <nav className="space-y-1.5" aria-label="Portal navigation">
              {/* Dashboard for all roles */}
              <NavLink className={navLinkClass} to="/dashboard">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>
                  {role === "doctor"
                    ? "Clinical dashboard"
                    : role === "receptionist"
                    ? "Reception desk"
                    : role === "patient"
                    ? "My health hub"
                    : "Executive dashboard"}
                </span>
              </NavLink>

              {/* Patient portal specific navigation */}
              {role === "patient" ? (
                <>
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
                  {/* Staff Navigation: Patients */}
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      {role === "receptionist" ? "Patient admissions" : "Patients directory"}
                    </span>
                  </NavLink>

                  {/* Doctors: Admin and Doctor can view specialist directory */}
                  {(role === "admin" || role === "doctor") && (
                    <NavLink className={navLinkClass} to="/doctors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Specialist doctors</span>
                    </NavLink>
                  )}

                  {/* Appointments */}
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {role === "doctor"
                        ? "Clinical consultations"
                        : role === "receptionist"
                        ? "OPD scheduling"
                        : "Appointments"}
                    </span>
                  </NavLink>

                  {/* Billing: Admin and Receptionist */}
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

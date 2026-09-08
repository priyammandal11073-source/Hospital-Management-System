import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "./HospitalLogo.jsx";

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/40"
      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
  }`;

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ================= TOP HOSPITAL BRANDING HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Hospital Logo & Brand Title */}
          <div className="flex items-center gap-4">
            <HospitalLogo variant="full" />
            <span className="hidden h-7 w-px bg-slate-200 md:inline-block" />
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/30 md:inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Portal
            </span>
          </div>

          {/* Right Section: 24/7 Emergency, Date, User Info, Logout */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Emergency Hotline Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-300/60 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-bold">24/7 Emergency:</span>
              <span className="font-mono text-rose-800">108</span>
              <span className="text-rose-300">|</span>
              <span className="font-mono text-rose-800">+91 98765 43210</span>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
                {user?.name ? user.name.charAt(0) : "S"}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || "Staff Member"}</p>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    {user?.role || "Staff"}
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
        {/* Modern Dark Sidebar */}
        <aside className="w-full border-r border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 text-white md:min-h-[calc(100vh-65px)] md:w-64 flex flex-col justify-between">
          <div>
            {/* Sidebar Section Title */}
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Staff Navigation
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                v2.4
              </span>
            </div>

            {/* Navigation Links with Medical Icons */}
            <nav className="space-y-1.5" aria-label="Main navigation">
              {/* Dashboard */}
              <NavLink className={navLinkClass} to="/dashboard">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Dashboard</span>
              </NavLink>

              {/* Patients */}
              <NavLink className={navLinkClass} to="/patients">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Patients</span>
              </NavLink>

              {/* Doctors (Admin Only) */}
              {isAdmin && (
                <NavLink className={navLinkClass} to="/doctors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Doctors</span>
                </NavLink>
              )}

              {/* Appointments */}
              <NavLink className={navLinkClass} to="/appointments">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Appointments</span>
              </NavLink>

              {/* Billing */}
              <NavLink className={navLinkClass} to="/billing">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Billing & Invoices</span>
              </NavLink>

              {/* Reports (Admin Only) */}
              {isAdmin && (
                <NavLink className={navLinkClass} to="/reports">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Reports & Analytics</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Sidebar Footer Badge */}
          <div className="mt-8 rounded-xl bg-slate-900/90 border border-slate-800/80 p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-400">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>NABH Accredited</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-tight">
              ISO 9001:2015 Certified Hospital
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

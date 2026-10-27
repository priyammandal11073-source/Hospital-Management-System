import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import HospitalLogo from "./HospitalLogo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Footer from "./Footer.jsx";
import MobileBottomNav from "./mobile/MobileBottomNav.jsx";
import MobileMenuSheet from "./mobile/MobileMenuSheet.jsx";
import { SidebarCollapseButton } from "./ui/index.js";
import { MobileIcon } from "./mobile/MobileNavIcons.jsx";
import { getNavigationForRole } from "../config/navigationConfig.jsx";
import { formatDoctorName } from "../utils/doctorName.js";

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-120 ease-out active:scale-[0.97] select-none ${
    isActive
      ? "bg-slate-900 text-white font-semibold shadow-2xs"
      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
  }`;

function BaseLayout({
  role = "admin",
  user = null,
  patient = null,
  isPatientPortal = false,
  authContext = "useAuth",
  logoutHandler,
  navigateToLogin = "/login",
  getUserName,
  getUserInitial,
  getRoleConfig,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = getRoleConfig(role, user, patient);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("nivora_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Sync collapsed state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("nivora_sidebar_collapsed", String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

  // Universal keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // Auto-populate data-tooltip for sleek origin-anchored CSS tooltips in collapsed mode
  useEffect(() => {
    const timer = setTimeout(() => {
      const links = document.querySelectorAll("aside nav a");
      links.forEach((a) => {
        const span = a.querySelector("span");
        if (span && span.textContent && !a.getAttribute("data-tooltip")) {
          a.setAttribute("data-tooltip", span.textContent.trim());
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [role, location.pathname]);

  // Auto-close sliding drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // Direct-manipulation edge swipe gesture to open drawer from left edge on touch devices
  useEffect(() => {
    let startX = null;
    let startY = null;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch.clientX > 28) return;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (e) => {
      if (startX === null) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dx > 60 && dy < 80) setMobileOpen(true);
      startX = null;
      startY = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const displayName = getUserName();
  const displayInitial = getUserInitial();

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleLogout = () => {
    logoutHandler();
    navigate(navigateToLogin);
  };

  // Build navigation items based on role
  const navConfig = getNavigationForRole(role, user);

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f7f6f3] flex flex-col font-sans">
      {/* ================= TOP HEADER BAR ================= */}
      <header
        style={{ paddingTop: "max(0px, env(safe-area-inset-top, 0px))" }}
        className="sticky top-0 flex-shrink-0 z-20 liquid-glass-nav transition-[background-color,border-color,box-shadow] duration-200 ease-out"
      >
        <div className="flex items-center justify-between gap-2 max-w-full px-3 sm:px-5 lg:px-7 py-2.5">
          {/* Left: Brand & Role Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
            {/* Mobile Hamburger Drawer Toggle — hidden at md+ (sidebar takes over on iPad) */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 transition active:scale-95 cursor-pointer touch-target flex-shrink-0"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to={isPatientPortal ? "/patient/dashboard" : "/dashboard"} className="transition hover:opacity-95 cursor-pointer flex-shrink-0" title="Home page">
              <HospitalLogo variant="full" className="hidden sm:flex" />
              <HospitalLogo variant="icon" className="sm:hidden" />
            </Link>

            {/* Role badge */}
            <span className={`inline-flex xl:hidden items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-800 truncate max-w-[120px]`}>
              {role === "doctor" && displayName ? formatDoctorName(displayName) : config.badge?.split(" ")[0] || role}
            </span>

            <div className="hidden xl:flex items-center gap-2 border-l border-slate-200/80 pl-3">
              <span className={`inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold truncate max-w-[240px]`}>
                {role === "doctor" && displayName ? formatDoctorName(displayName) : config.badge || role}
              </span>
            </div>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ml-auto">
            {/* Quick Switch Portal Button */}
            <Link
              to="/login"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition flex-shrink-0 active:scale-[0.97]"
              title="Switch to another portal"
            >
              <span>⇄</span>
              <span>Switch Portal</span>
            </Link>

            {/* Emergency Hotline (Desktop) */}
            <div className="hidden 2xl:flex items-center gap-2 rounded-xl liquid-glass-subtle px-3 py-1 text-xs font-medium text-slate-700 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-slate-500">Emergency:</span>
              <span className="font-mono text-rose-700 font-bold">
                <a href="tel:108" className="hover:underline" title="Call Emergency Ambulance">108</a> / <a href="tel:112" className="hover:underline" title="Call National Emergency">112</a>
              </span>
            </div>

            {/* Emergency Quick Dial (Mobile) */}
            <a
              href="tel:108"
              className="flex 2xl:hidden items-center justify-center h-8 w-8 rounded-xl liquid-glass-subtle text-rose-600 active:scale-95 transition"
              title="Call 108 Emergency"
            >
              <span className="h-2 w-2 rounded-full bg-rose-600" />
            </a>

            {/* Current Date Badge */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-slate-500 liquid-glass-subtle px-3 py-1 rounded-xl flex-shrink-0">
              <span className="font-mono text-[11px]">{todayStr}</span>
            </div>

            {/* Real-time Notification Bell */}
            <div className="flex-shrink-0">
              <NotificationBell isPatient={isPatientPortal} />
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-2 rounded-xl liquid-glass-subtle px-2.5 py-1 flex-shrink-0">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${config.avatarBg || "bg-slate-900 text-white"} text-xs font-bold uppercase shadow-2xs flex-shrink-0`}>
                {displayInitial}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">{displayName || "User"}</p>
                <span className={`text-[10px] font-medium block ${config.tagColor}`}>
                  {config.roleDesc}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex-shrink-0 group flex items-center gap-1.5 rounded-xl liquid-glass-pill hover:bg-rose-50 hover:border-rose-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 transition cursor-pointer active:scale-95"
              type="button"
              title="Sign Out"
            >
              <svg className="h-3.5 w-3.5 text-slate-500 group-hover:text-rose-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE (SIDEBAR + CONTENT) ================= */}
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden min-h-0">
        {/* Sidebar: hidden on phones, visible from md (iPad portrait) upward */}
        <aside
          data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
          className={`hidden md:flex ${
            isSidebarCollapsed ? "md:w-16 lg:w-20" : "md:w-56 lg:w-64"
          } md:flex-shrink-0 md:h-full liquid-glass-sidebar p-3 text-slate-800 flex-col justify-between overflow-y-auto transition-sidebar`}
          aria-label="Portal navigation sidebar"
        >
          <div>
            {/* Sidebar Section Title & Clean Collapse Button */}
            <div className={`mb-3 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-1 py-1`}>
              <div className="flex items-center gap-2 min-w-0">
                <SidebarCollapseButton
                  collapsed={isSidebarCollapsed}
                  onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
                  size="sm"
                />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-semibold text-slate-800 tracking-tight truncate">
                    {config.label}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 capitalize flex-shrink-0">
                  {config.department}
                </span>
              )}
            </div>

            {/* Dynamic Navigation Links based on Role */}
            <nav className="space-y-0.5" aria-label="Portal navigation">
              {navConfig.categories?.map((category) => (
                <React.Fragment key={category.id}>
                  <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                    {category.name}
                  </div>
                  {category.items.map((item) => {
                    const isActive = item.to === (isPatientPortal ? "/patient/dashboard" : "/dashboard")
                      ? location.pathname === item.to
                      : item.to === location.pathname || location.pathname.startsWith(item.to + "/");
                    return (
                      <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        className={({ isActive: navActive }) =>
                          `group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-120 ease-out active:scale-[0.97] select-none ${
                            navActive || isActive
                              ? "bg-slate-900 text-white font-semibold shadow-2xs"
                              : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                          }`}
                        onClick={() => {
                          if (mobileOpen) setMobileOpen(false);
                        }}
                      >
                        <span className="h-4 w-4">
                          <MobileIcon name={item.iconName} />
                        </span>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto rounded-full liquid-glass-pill text-slate-700 px-1.5 py-0.2 text-[9px] font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer Controls */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 space-y-2 mt-auto">
            {/* Emergency Assistance Box (Hidden when collapsed) */}
            <div className="sidebar-hide-collapsed rounded-xl bg-rose-50/50 border border-rose-100/80 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Emergency Helplines</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                Ambulance: <a href="tel:108" className="text-rose-600 font-semibold hover:underline">108</a> · Helpline: <a href="tel:112" className="text-rose-600 font-semibold hover:underline">112</a>
              </p>
            </div>

            {/* Footer Bottom Bar */}
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-700 tracking-tight flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    NABH Accredited
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">ABDM Compliant</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors duration-120 cursor-pointer active:scale-[0.96]"
                  title="Sign out"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  data-tooltip="Sign Out"
                  className="relative p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors duration-120 cursor-pointer active:scale-[0.96]"
                  aria-label="Sign Out"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Pane - INDEPENDENT SCROLL */}
        <main className="flex-1 min-w-0 bg-transparent flex flex-col justify-between md:h-full md:overflow-y-auto overflow-x-hidden overscroll-contain" data-main-content>
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))] md:pb-6 lg:pb-8 flex-1">
            <Outlet />
          </div>
          {/* Global Enterprise Portal Footer inside scrollable main container */}
          <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))] md:pb-6 pt-2 flex-shrink-0" data-main-footer>
            <Footer />
          </div>
        </main>
      </div>

      {/* ================= NATIVE MOBILE BOTTOM NAVIGATION ================= */}
      <MobileBottomNav
        role={role}
        user={user}
        mobileOpen={mobileOpen}
        onToggleMenu={() => setMobileOpen((prev) => !prev)}
      />

      {/* ================= HIGHLY OPTIMIZED MOBILE MENU SHEET ================= */}
      <MobileMenuSheet
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={role}
        user={user}
        onLogout={handleLogout}
        isPatient={isPatientPortal}
      />
    </div>
  );
}

export default BaseLayout;
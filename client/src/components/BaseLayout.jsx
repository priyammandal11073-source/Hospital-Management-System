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
  `group flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] select-none ${
    isActive
      ? "bg-teal-700 text-white font-semibold shadow-sm shadow-teal-950/10"
      : "text-slate-600 hover:bg-teal-50/80 hover:text-teal-800"
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("nivora_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Watch for active full-screen modals to smoothly fade out the mobile bottom nav
  useEffect(() => {
    const checkModal = () => {
      const hasModal = Boolean(document.querySelector('[role="dialog"]:not([data-mobile-sheet="true"])'));
      setIsModalOpen(hasModal);
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["role", "aria-modal"] });
    return () => observer.disconnect();
  }, []);

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

  // Rail tooltip: delayed on first hover so sweeping the rail stays quiet,
  // instant afterwards (a delay on every tooltip would feel broken).
  const [sidebarTooltip, setSidebarTooltip] = useState(null);
  const asideRef = useRef(null);
  const tooltipTimerRef = useRef(null);
  const tooltipSeenRef = useRef(false);

  const showSidebarTooltip = useCallback(
    (label, element) => {
      if (!isSidebarCollapsed || !element) return;
      const rect = element.getBoundingClientRect();
      const paint = () => {
        const instant = tooltipSeenRef.current;
        tooltipSeenRef.current = true;
        const railRight = asideRef.current?.getBoundingClientRect().right ?? rect.right;
        setSidebarTooltip({ label, instant, top: rect.top + rect.height / 2, left: railRight + 10 });
      };
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (tooltipSeenRef.current) {
        paint();
      } else {
        tooltipTimerRef.current = setTimeout(paint, 220);
      }
    },
    [isSidebarCollapsed]
  );

  const hideSidebarTooltip = useCallback(() => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setSidebarTooltip(null);
  }, []);

  // A rail tooltip never survives a expand/collapse or a route change
  useEffect(() => {
    hideSidebarTooltip();
  }, [isSidebarCollapsed, location.pathname, hideSidebarTooltip]);

  useEffect(() => () => clearTimeout(tooltipTimerRef.current), []);

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
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f7f6f3] flex flex-col font-sans" data-portal-role={role}>
      {/* ================= TOP HEADER BAR ================= */}
      <header
        style={{ paddingTop: "max(0px, env(safe-area-inset-top, 0px))" }}
        className="sticky top-0 flex-shrink-0 z-30 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-b border-slate-200/50 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-[background-color,border-color] duration-150 ease-out"
      >
        <div className="h-14 flex items-center justify-between gap-3 max-w-full px-3 sm:px-5 lg:px-6">
          {/* Left: Mobile Toggle, Brand & Portal Identifier */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-shrink">
            {/* Mobile Hamburger Drawer Toggle — hidden at md+ (sidebar takes over on tablet/desktop) */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex md:hidden items-center justify-center h-8.5 w-8.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer touch-target flex-shrink-0"
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

            <Link
              to={isPatientPortal ? "/patient/dashboard" : "/dashboard"}
              className="flex items-center transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.98] flex-shrink-0"
              title="Nivora Care Hospital Homepage"
            >
              <HospitalLogo variant="full" className="hidden sm:flex" />
              <HospitalLogo variant="icon" className="sm:hidden" />
            </Link>

            <div className="hidden sm:block h-5 w-px bg-slate-200/60 flex-shrink-0" />

            {/* Portal Context: Restrained Typography & Department Identity */}
            <div className="flex items-center gap-2 min-w-0">
              {role === "emergency" && (
                <span className="relative flex h-2 w-2 flex-shrink-0" title="Emergency Portal Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              )}
              <div className="flex flex-col justify-center min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-slate-900 truncate max-w-[110px] sm:max-w-none">
                    {role === "doctor" && displayName
                      ? formatDoctorName(displayName)
                      : config.badge || config.label || (role ? role.toUpperCase() : "Portal")}
                  </span>
                  {role !== "admin" && (
                    <span className="hidden xl:inline-flex items-center rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 tracking-tight select-none">
                      {role.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate hidden md:block">
                  {config.department ? `${config.department} Department` : config.roleDesc || "Hospital Operations"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Utilities & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 flex-shrink-0 ml-auto">
            {/* Emergency Hotline (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50/90 text-rose-900 text-xs shadow-2xs select-none flex-shrink-0 transition-colors duration-150">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="font-semibold text-rose-800 text-[10px] uppercase tracking-wider hidden xl:inline">Emergency</span>
              <span className="font-mono text-xs font-bold text-rose-700 flex items-center gap-1">
                <a href="tel:108" className="hover:text-rose-950 hover:underline transition-colors" title="Call Emergency Ambulance (108)">108</a>
                <span className="text-rose-300 font-normal">/</span>
                <a href="tel:112" className="hover:text-rose-950 hover:underline transition-colors" title="Call National Emergency (112)">112</a>
              </span>
            </div>

            {/* Emergency Quick Dial (Mobile < sm) */}
            <a
              href="tel:108"
              className="flex sm:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs active:scale-[0.97] transition-transform duration-150 ease-out flex-shrink-0"
              title="Call 108 Emergency Helpline"
              aria-label="Call 108 Emergency Helpline"
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="font-mono text-xs font-bold">108</span>
            </a>

            {/* Switch Portal Button */}
            <Link
              to="/login"
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg px-2 sm:px-2.5 py-1.5 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] select-none flex-shrink-0"
              title="Switch to another portal"
              aria-label="Switch portal"
            >
              <svg className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-700 transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden md:inline">Switch Portal</span>
            </Link>

            {/* Current Date (Institutional Metadata) */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono select-none flex-shrink-0 bg-slate-100/60 rounded-md px-2 py-1">
              <svg className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{todayStr}</span>
            </div>

            <div className="hidden sm:block h-4 w-px bg-slate-200/60 flex-shrink-0" />

            {/* Real-time Notification Bell */}
            <div className="flex-shrink-0">
              <NotificationBell isPatient={isPatientPortal} />
            </div>

            <div className="h-4 w-px bg-slate-200/60 flex-shrink-0" />

            {/* User Profile Info Capsule */}
            <div
              className="group flex items-center gap-2 select-none flex-shrink-0 py-0.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-100/70 transition-colors duration-150 cursor-default"
              title={`${displayName || "User"} (${config.roleDesc || role})`}
            >
              <div className={`relative flex h-7.5 w-7.5 items-center justify-center rounded-full ${config.avatarBg || "bg-slate-900 text-white"} text-[11px] font-bold uppercase shadow-2xs flex-shrink-0 ring-1 ring-slate-900/10 transition-transform duration-150 group-hover:scale-105`}>
                {displayInitial}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white" title="Active Session" />
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{displayName || "User"}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px] capitalize font-medium">{config.roleDesc || role}</span>
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200/60 flex-shrink-0" />

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg px-2 sm:px-2.5 py-1.5 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer flex-shrink-0"
              type="button"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <svg className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 transition-colors duration-150 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          ref={asideRef}
          data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
          className="hidden portal-sidebar md:flex md:flex-shrink-0 md:h-full liquid-glass-sidebar p-2.5 text-slate-800 flex-col justify-between overflow-y-auto overscroll-contain"
          onScroll={hideSidebarTooltip}
          aria-label="Portal navigation sidebar"
        >
          <div>
            {/* Sidebar Section Title & Clean Collapse Button */}
            <div className="sidebar-header mb-2 flex items-center gap-2 overflow-hidden whitespace-nowrap px-2 py-1.5">
              <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                <SidebarCollapseButton
                  collapsed={isSidebarCollapsed}
                  onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
                  size="sm"
                  onMouseEnter={(e) => showSidebarTooltip(isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)", e.currentTarget)}
                  onFocus={(e) => showSidebarTooltip(isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)", e.currentTarget)}
                  onMouseLeave={hideSidebarTooltip}
                  onBlur={hideSidebarTooltip}
                />
              </div>
              <span className="sidebar-label min-w-0 truncate text-xs font-bold text-slate-900 tracking-tight">
                {config.label}
              </span>
              <span className="sidebar-badge ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 capitalize flex-shrink-0">
                {config.department}
              </span>
            </div>

            {/* Dynamic Navigation Links based on Role */}
            <nav className="space-y-0.5" aria-label="Portal navigation">
              {navConfig.categories?.map((category) => (
                <React.Fragment key={category.id}>
                  <div className="sidebar-category-header px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    <span className="sidebar-category-text">{category.name}</span>
                  </div>
                  {category.items.map((item) => {
                    const isActive = item.to === (isPatientPortal ? "/patient/dashboard" : "/dashboard")
                      ? location.pathname === item.to
                      : item.to === location.pathname || location.pathname.startsWith(item.to + "/");
                    return (
                      <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        className={({ isActive: navActive }) => {
                          const active = navActive || isActive;
                          return `sidebar-link group relative flex min-h-9.5 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 ${
                            active
                              ? "bg-teal-700 text-white font-semibold shadow-sm shadow-teal-950/10"
                              : "text-slate-600 hover:bg-teal-50/80 hover:text-teal-800"
                          }`;
                        }}
                        onClick={() => {
                          if (mobileOpen) setMobileOpen(false);
                        }}
                        onMouseEnter={(e) => showSidebarTooltip(item.label, e.currentTarget)}
                        onFocus={(e) => showSidebarTooltip(item.label, e.currentTarget)}
                        onMouseLeave={hideSidebarTooltip}
                        onBlur={hideSidebarTooltip}
                      >
                        {({ isActive: navActive }) => {
                          const active = navActive || isActive;
                          return (
                            <>
                              <span
                                className={`h-5 w-5 flex-shrink-0 flex items-center justify-center transition-colors ${
                                  active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                                }`}
                              >
                                <MobileIcon name={item.iconName} className="h-4 w-4" />
                              </span>
                              <span className={`sidebar-label truncate ${active ? "text-white font-semibold" : "text-slate-700"}`}>
                                {item.label}
                              </span>
                              {item.badge && (
                                <span
                                  className={`sidebar-badge ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums flex-shrink-0 transition-colors ${
                                    item.badge.toLowerCase().includes("urgent")
                                      ? "bg-rose-500 text-white font-bold"
                                      : active
                                      ? "bg-white/20 text-white font-semibold"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          );
                        }}
                      </NavLink>
                    );
                  })}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer Controls */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 mt-auto">
            {/* Emergency Assistance Box (Hidden when collapsed) */}
            <div className="sidebar-hide-collapsed rounded-xl bg-rose-50/70 p-2.5 shadow-2xs border-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
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
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors duration-fast cursor-pointer active:scale-[0.96]"
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
                  onMouseEnter={(e) => showSidebarTooltip("Sign Out", e.currentTarget)}
                  onFocus={(e) => showSidebarTooltip("Sign Out", e.currentTarget)}
                  onMouseLeave={hideSidebarTooltip}
                  onBlur={hideSidebarTooltip}
                  className="relative h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors duration-fast cursor-pointer active:scale-[0.96]"
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
        <main
          className="flex-1 min-w-0 bg-transparent flex flex-col justify-between md:h-full md:overflow-y-auto overflow-x-hidden overscroll-contain"
          data-main-content
          data-doctor-portal={role === "doctor" ? "true" : undefined}
          data-nurse-portal={role === "nurse" ? "true" : undefined}
          data-emergency-portal={role === "emergency" || location.pathname.startsWith("/emergency") ? "true" : undefined}
          data-patient-portal={role === "patient" || isPatientPortal || location.pathname.startsWith("/patient") ? "true" : undefined}
          data-reception-portal={role === "receptionist" || location.pathname.startsWith("/reception") ? "true" : undefined}
          data-pharmacy-portal={role === "pharmacist" || location.pathname.startsWith("/pharmacy") ? "true" : undefined}
          data-diagnostic-portal={role === "technician" || role === "pathologist" || role === "radiologist" || location.pathname.startsWith("/diagnostic") || location.pathname.startsWith("/radiology") ? "true" : undefined}
        >
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 pb-4 md:pb-6 lg:pb-8 flex-1">
            <Outlet />
          </div>
          {/* Global Enterprise Portal Footer inside scrollable main container */}
          <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 pb-[calc(4.5rem+max(env(safe-area-inset-bottom,0px),8px))] md:pb-6 pt-2 flex-shrink-0" data-main-footer>
            <Footer />
          </div>
        </main>
      </div>

      {/* Collapsed-rail tooltip: fixed so the sidebar's own scroll clipping can't cut it off */}
      <div
        role="tooltip"
        aria-hidden={sidebarTooltip ? "false" : "true"}
        data-visible={sidebarTooltip ? "true" : "false"}
        data-instant={sidebarTooltip?.instant ? "true" : "false"}
        style={{ top: sidebarTooltip?.top ?? 0, left: sidebarTooltip?.left ?? 0 }}
        className="sidebar-tooltip pointer-events-none fixed z-[70] rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg shadow-slate-900/25"
      >
        {sidebarTooltip?.label ?? ""}
      </div>

      {/* ================= NATIVE MOBILE BOTTOM NAVIGATION ================= */}
      <MobileBottomNav
        role={role}
        user={user}
        mobileOpen={mobileOpen}
        onToggleMenu={() => setMobileOpen((prev) => !prev)}
        isModalOpen={isModalOpen}
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
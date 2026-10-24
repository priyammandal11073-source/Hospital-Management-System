import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import HospitalLogo from "./HospitalLogo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Footer from "./Footer.jsx";
import MobileBottomNav from "./mobile/MobileBottomNav.jsx";
import MobileMenuSheet from "./mobile/MobileMenuSheet.jsx";
import { SidebarCollapseButton } from "./ui/index.js";


const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-120 ease-out active:scale-[0.97] select-none ${
    isActive
      ? "bg-slate-900 text-white font-semibold shadow-2xs"
      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
  }`;

function PatientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patient: patientAuthPatient, logout: patientLogout } = usePatientAuth();
  const { user: unifiedUser, logout: unifiedLogout } = useAuth();
  const patient = patientAuthPatient || (unifiedUser?.role === "patient" ? unifiedUser : null);
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
  }, [location.pathname]);

  // Auto-close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  // Lock body scroll and listen for Escape key when mobile drawer is open
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Real-time observer to detect any open modal across patient portal pages
  useEffect(() => {
    const checkModal = () => {
      const overlays = document.querySelectorAll(".fixed.inset-0, [role='dialog']");
      let found = false;
      for (const el of overlays) {
        // Exclude mobile navigation drawers and navigation elements
        if (el.closest("[data-mobile-sheet]") || el.hasAttribute("data-mobile-sheet")) continue;
        if (el.closest("nav") || el.tagName.toLowerCase() === "nav") continue;
        if (el.getAttribute("aria-hidden") === "true") continue;
        if (el.classList.contains("pointer-events-none")) continue;
        if (el.classList.contains("-z-10")) continue;
        if (el.classList.contains("animate-backdrop-fade") && !el.classList.contains("z-50")) continue;
        found = true;
        break;
      }
      setIsModalOpen(found);
      if (found) setMobileOpen(false);
    };

    checkModal();

    const observer = new MutationObserver(() => {
      checkModal();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });

    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    patientLogout();
    unifiedLogout();
    navigate("/login");
  };

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f7f6f3] flex flex-col font-sans">
      {/* ================= TOP HOSPITAL BRANDING HEADER ================= */}
      <header
        style={{ paddingTop: "max(0px, env(safe-area-inset-top, 0px))" }}
        className={`sticky top-0 md:static flex-shrink-0 px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5 transition-[opacity,background-color,border-color] duration-150 ease-out ${
          isModalOpen
            ? "z-0 opacity-20 pointer-events-none select-none blur-[1px] bg-slate-100/40 border-b border-slate-300/40"
            : "z-20 liquid-glass-nav"
        }`}
        aria-hidden={isModalOpen}
      >
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Hospital Logo & Brand Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
            {/* Mobile Hamburger Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-xl text-slate-700 hover:text-slate-900 liquid-glass-pill transition active:scale-95 cursor-pointer touch-target flex-shrink-0"
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

            <Link to="/patient/dashboard" className="transition hover:opacity-95 cursor-pointer flex-shrink-0" title="Home page">
              <HospitalLogo variant="full" className="hidden sm:flex" />
              <HospitalLogo variant="icon" className="sm:hidden" />
            </Link>

            {/* Mobile role pill */}
            <span className="inline-flex xl:hidden items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-800">
              Patient
            </span>

            <span className="hidden h-5 w-px bg-slate-200/80 xl:inline-block" />
            <span className="hidden liquid-glass-pill px-3 py-1 text-xs font-semibold text-slate-800 xl:inline-flex items-center gap-1.5 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Patient care portal
            </span>
          </div>

          {/* Right Section: 24/7 Emergency, Date, Notifications, Patient Profile, Logout - ALWAYS IN VIEW */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Emergency Hotline Pill (Desktop) */}
            <div className="hidden 2xl:flex items-center gap-2 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-rose-700 shadow-2xs flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-bold">24/7 Emergency:</span>
              <span className="font-mono text-rose-800 font-bold">
                <a href="tel:108" className="hover:underline">108</a> / <a href="tel:112" className="hover:underline">112</a>
              </span>
            </div>

            {/* Emergency Quick Dial (Mobile) */}
            <a
              href="tel:108"
              className="flex 2xl:hidden items-center justify-center h-8 w-8 rounded-lg liquid-glass-pill text-rose-600 active:scale-95 transition"
              title="Call 108 Emergency"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
              </span>
            </a>

            {/* Current Date Badge */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-slate-600 liquid-glass-pill px-3 py-1 rounded-full flex-shrink-0">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{todayStr}</span>
            </div>

            {/* Notification Bell */}
            <div className="flex-shrink-0">
              <NotificationBell isPatient={true} />
            </div>

            {/* Patient Profile Card */}
            <div className="flex items-center gap-2 rounded-xl liquid-glass-pill p-1 sm:px-2.5 sm:py-1 flex-shrink-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white uppercase flex-shrink-0">
                {patient?.name ? patient.name.charAt(0) : "P"}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[110px]">{patient?.name || "Patient"}</p>
                <span className="text-[10px] text-slate-500 block">
                  Patient
                </span>
              </div>
            </div>

            {/* Logout Button - FIXED & GUARANTEED VISIBLE */}
            <button
              onClick={handleLogout}
              className="flex-shrink-0 group flex items-center gap-1 rounded-xl liquid-glass-pill px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 active:scale-[0.97] transition touch-target cursor-pointer"
              type="button"
              title="Sign Out"
            >
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE (SIDEBAR + CONTENT) ================= */}
      <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden min-h-0">
        {/* Desktop Docked Navigation Sidebar - FIXED IN PLACE */}
        <aside
          data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
          className={`hidden md:flex ${
            isSidebarCollapsed ? "md:w-16 lg:w-20" : "md:w-56 lg:w-64"
          } md:flex-shrink-0 md:h-full liquid-glass-sidebar p-3 text-slate-800 flex-col justify-between overflow-y-auto transition-sidebar`}
          aria-label="Patient portal navigation"
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
                    Patient Services
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 capitalize flex-shrink-0">
                  Active
                </span>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="space-y-0.5" aria-label="Patient navigation">
              {/* My Health Hub */}
              <NavLink className={navLinkClass} to="/patient/dashboard">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>My Health Hub</span>
              </NavLink>

              {/* Category 1: Appointments */}
              <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                Appointments
              </div>
              <NavLink className={navLinkClass} to="/patient/appointments/book">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Book Specialist Visit</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/appointments">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>My Scheduled Visits</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/consultations">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Consultation History</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/telemedicine">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Video Consultations</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/health-timeline">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Health Timeline</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/doctors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Find a Doctor</span>
              </NavLink>

              {/* Category 2: Health Records */}
              <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                Health Records
              </div>
              <NavLink className={navLinkClass} to="/patient/records">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Medical Records</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/prescriptions">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>My Prescriptions</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/lab-reports">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span>My Lab Reports</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/vitals">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>My Vitals</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/medicines">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span>My Medicines</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/documents">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>My Documents</span>
              </NavLink>

              {/* Category 3: Care */}
              <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                Care
              </div>
              <NavLink className={navLinkClass} to="/patient/referrals">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>My Referrals</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/follow-ups">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Follow-ups</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/admissions">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>My Admissions</span>
              </NavLink>

              {/* Category 4: Payments */}
              <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                Payments
              </div>
              <NavLink className={navLinkClass} to="/patient/billings">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>My Invoices & Receipts</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/payments">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Payment History</span>
              </NavLink>

              {/* Category 5: Account */}
              <div className="sidebar-category-header px-2.5 pt-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                Account
              </div>
              <NavLink className={navLinkClass} to="/patient/profile">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>My Profile</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/notifications">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Notifications</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/support">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Help & Support</span>
              </NavLink>
              <NavLink className={navLinkClass} to="/patient/feedback">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>Hospital Feedback</span>
              </NavLink>
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
                  title="Sign out of patient portal"
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
        <main className="flex-1 min-w-0 bg-transparent flex flex-col justify-between md:h-full md:overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))] md:pb-6 lg:pb-8 flex-1">
            <Outlet />
          </div>
          {/* Global Enterprise Portal Footer inside scrollable main container */}
          <div className="w-full px-3 sm:px-5 md:px-6 lg:px-8 pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))] md:pb-6 pt-2 flex-shrink-0">
            <Footer />
          </div>
        </main>
      </div>

      {/* ================= NATIVE MOBILE BOTTOM NAVIGATION ================= */}
      <MobileBottomNav
        role="patient"
        user={patient}
        mobileOpen={mobileOpen}
        onToggleMenu={() => setMobileOpen((prev) => !prev)}
        isModalOpen={isModalOpen}
      />

      {/* ================= HIGHLY OPTIMIZED MOBILE MENU SHEET ================= */}
      <MobileMenuSheet
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role="patient"
        user={patient}
        onLogout={handleLogout}
        isPatient={true}
      />
    </div>
  );
}

export default PatientLayout;

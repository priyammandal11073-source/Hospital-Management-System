import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HospitalLogo from "./HospitalLogo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import Footer from "./Footer.jsx";
import { formatDoctorName } from "../utils/doctorName.js";
import MobileBottomNav from "./mobile/MobileBottomNav.jsx";
import MobileMenuSheet from "./mobile/MobileMenuSheet.jsx";

const navLinkClass = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
    isActive
      ? "bg-slate-900 text-white font-semibold shadow-xs"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
  }`;

const PORTAL_CONFIG = {
  admin: {
    label: "Admin Portal",
    title: "Hospital Administration",
    badge: "Hospital Administration",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "System Administrator",
  },
  doctor: {
    label: "Doctor Portal",
    title: "Physician Clinical Workspace",
    badge: "Clinical Workspace",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Consultant Physician",
  },
  receptionist: {
    label: "Front Desk Portal",
    title: "Front Desk & Admissions",
    badge: "Admissions Desk",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Admissions & Cashier",
  },
  nurse: {
    label: "Nursing Station",
    title: "Inpatient Nursing Station",
    badge: "Nursing Station",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Clinical Care Nurse",
  },
  patient: {
    label: "Patient Portal",
    title: "Patient Health Portal",
    badge: "Patient Portal",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Patient Record",
  },
  pharmacist: {
    label: "Pharmacy Portal",
    title: "Hospital Pharmacy Operations",
    badge: "Pharmacy Operations",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Chief Pharmacist",
  },
  diagnostic_admin: {
    label: "Diagnostic Services",
    title: "Diagnostic & Imaging Services",
    badge: "Diagnostic Center",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Diagnostic Administrator",
  },
  pathologist: {
    label: "Pathology Desk",
    title: "Pathology & Laboratory Medicine",
    badge: "Pathology Department",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Consultant Pathologist",
  },
  radiologist: {
    label: "Radiology Desk",
    title: "Medical Imaging & Radiology",
    badge: "Radiology Department",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Consultant Radiologist",
  },
  lab_technician: {
    label: "Laboratory Bench",
    title: "Phlebotomy & Clinical Laboratory",
    badge: "Clinical Laboratory",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Laboratory Technologist",
  },
  radiology_technician: {
    label: "Radiology Station",
    title: "Imaging Modality Station",
    badge: "Imaging Station",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Radiology Technologist",
  },
  emergency: {
    label: "Emergency Portal",
    title: "Emergency & Trauma Center",
    badge: "Emergency Department",
    badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
    avatarBg: "bg-slate-900 text-white shadow-xs",
    tagColor: "text-slate-500",
    roleDesc: "Emergency Physician / Triage",
  },
};

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || "admin";
  const config = PORTAL_CONFIG[role] || PORTAL_CONFIG.admin;
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

  // Real-time observer to detect any open modal across any portal page
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
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col font-sans">
      {/* ================= MODERN TOP HEADER BAR ================= */}
      <header
        className={`sticky top-0 px-3 sm:px-5 lg:px-7 py-2.5 transition-all duration-200 ${
          isModalOpen
            ? "z-0 opacity-20 pointer-events-none select-none blur-[1px]"
            : "z-20 liquid-glass-nav"
        }`}
        aria-hidden={isModalOpen}
      >
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Brand Logo & Active Workspace Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
            {/* Mobile Hamburger Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex lg:hidden items-center justify-center h-9 w-9 rounded-xl text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-slate-100 border border-slate-200/80 transition active:scale-90 cursor-pointer touch-target flex-shrink-0"
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

            <Link to="/dashboard" className="transition hover:opacity-95 cursor-pointer flex-shrink-0" title="Home page">
              <HospitalLogo variant="full" className="hidden sm:flex" />
              <HospitalLogo variant="icon" className="sm:hidden" />
            </Link>

            {/* Desktop Sidebar Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-xl text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/80 transition active:scale-95 cursor-pointer shadow-2xs flex-shrink-0"
              title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
            </button>

            {/* Mobile role indicator pill */}
            <span className={`inline-flex xl:hidden items-center rounded px-2 py-0.5 text-[10px] font-bold truncate max-w-[120px] ${config.badgeClass}`}>
              {role === "doctor" && user?.name
                ? formatDoctorName(user.name)
                : config.badge.split(" ")[0]}
            </span>

            <div className="hidden xl:flex items-center gap-2 border-l border-slate-200/80 pl-3">
              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold truncate max-w-[240px] ${config.badgeClass}`}>
                {role === "doctor" && user?.name
                  ? formatDoctorName(user.name)
                  : config.badge}
              </span>
            </div>
          </div>

          {/* Center/Right Status & User Profile - ALWAYS STAYS IN VIEW */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ml-auto">
            {/* Quick Switch Portal Button */}
            <Link
              to="/login"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition flex-shrink-0"
              title="Switch to another portal"
            >
              <span>⇄</span>
              <span>Switch Portal</span>
            </Link>

            {/* Emergency Hotline (Desktop) */}
            <div className="hidden 2xl:flex items-center gap-2 rounded-xl liquid-glass-subtle px-3 py-1 text-xs font-medium text-slate-700 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
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
              <NotificationBell isPatient={false} />
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-2 rounded-xl liquid-glass-subtle px-2.5 py-1 flex-shrink-0">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${config.avatarBg || "bg-slate-900 text-white"} text-xs font-bold uppercase shadow-2xs flex-shrink-0`}>
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">{user?.name || "User"}</p>
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
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Desktop Docked Navigation Sidebar */}
        <aside
          data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
          className={`hidden lg:flex ${
            isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
          } lg:flex-shrink-0 lg:h-[calc(100vh-65px)] lg:sticky lg:top-[65px] liquid-glass-sidebar p-3.5 text-slate-800 flex-col justify-between overflow-y-auto transition-sidebar`}
          aria-label="Portal navigation sidebar"
        >
          <div>
            {/* Sidebar Section Title */}
            <div className={`mb-4 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} px-2 pt-1`}>
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {config.label}
                </span>
              )}
              <span className={`rounded bg-white/80 border border-slate-200/80 px-1.5 py-0.5 text-[9px] font-mono text-slate-600 capitalize ${isSidebarCollapsed ? "text-[8px]" : ""}`}>
                {isSidebarCollapsed ? role.slice(0, 3) : role}
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
              ) : role === "doctor" ? (
                <>
                  {/* Category 1: Clinical Practice */}
                  <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Clinical Practice
                  </div>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Clinical Dashboard</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>My Consultations</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>My Patients</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Prescriptions (Rx)</span>
                  </NavLink>

                  {/* Category 2: Clinical Directives */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Clinical Directives
                  </div>
                  <NavLink className={navLinkClass} to="/doctor/orders">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Doctor Orders</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctor/referrals">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Specialist Referrals</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctor/critical-labs">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Critical Lab Reviews</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctor/follow-ups">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Follow-ups Due</span>
                  </NavLink>

                  {/* Category 3: Hospital & Diagnostics */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Hospital Resources
                  </div>
                  <NavLink className={navLinkClass} to="/lab-reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Lab & Diagnostics</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>My Schedule & Availability</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/specialist-directory">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Specialist Directory</span>
                  </NavLink>
                </>
              ) : role === "patient" ? (
                <>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>My Health Hub</span>
                  </NavLink>

                  {/* Category 1: Appointments */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                  <NavLink className={navLinkClass} to="/patient/doctors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Find a Doctor</span>
                  </NavLink>

                  {/* Category 2: Health Records */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                  <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                </>
              ) : role === "admin" || role === "super_admin" ? (
                <>
                  {/* Category 1: Operations & Command */}
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Command & Governance
                  </div>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Executive dashboard</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/departments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Departments</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/calendar">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Master calendar</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/settings">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Hospital settings</span>
                  </NavLink>

                  {/* Category 2: Clinical & Inpatients */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Clinical Operations
                  </div>
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Patients directory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/admissions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Inpatient census</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/doctors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Specialist doctors</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Appointments</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/operating-theatre">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242L10.758 4.88a3 3 0 014.242 4.242L12.12 12z" />
                    </svg>
                    <span>Operating theatre (OT)</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/emergency">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Emergency & trauma</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/beds">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Beds & wards map</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Prescriptions directory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/lab-reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Lab & diagnostics</span>
                  </NavLink>

                  {/* Category 3: Workforce & HR */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Human Resources
                  </div>
                  <NavLink className={navLinkClass} to="/admin/staff">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Staff directory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/attendance">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Attendance & shifts</span>
                  </NavLink>

                  {/* Category 4: Finance & Logistics */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Finance & Logistics
                  </div>
                  <NavLink className={navLinkClass} to="/billing">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Billing & invoices</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/revenue">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Revenue analytics</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/inventory">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Pharmacy inventory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/equipment">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>Biomedical equipment</span>
                  </NavLink>

                  {/* Category 5: Governance & Security */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Governance & Logs
                  </div>
                  <NavLink className={navLinkClass} to="/reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Reports & analytics</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/audit-logs">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>System audit logs</span>
                  </NavLink>
                </>
              ) : role === "receptionist" ? (
                <>
                  {/* Category 1: Front Desk Core */}
                  <div className="pt-2 pb-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Front Desk Core
                    </p>
                  </div>
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Reception desk</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/work-queue">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Front desk work queue</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/waiting-room">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Waiting room & tokens</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/calendar">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>OPD calendar & slots</span>
                  </NavLink>

                  {/* Category 2: Patient Administration */}
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Patient Administration
                    </p>
                  </div>
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Patient registration</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/beds">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Beds & ward admissions</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/discharges">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Discharge clearance</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/emergency">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Emergency front desk</span>
                  </NavLink>

                  {/* Category 3: Appointments & Bookings */}
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Appointments & Bookings
                    </p>
                  </div>
                  <NavLink className={navLinkClass} to="/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>OPD scheduling</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/online-bookings">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Online booking queue</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/reminders">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Appointment reminders</span>
                  </NavLink>

                  {/* Category 4: Cashier & Settlement */}
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Cashier & Settlement
                    </p>
                  </div>
                  <NavLink className={navLinkClass} to="/billing">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Cashier & billing</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/refunds">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Refunds & settlements</span>
                  </NavLink>

                  {/* Category 5: Desk Operations & Reports */}
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Desk Operations
                    </p>
                  </div>
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Prescriptions directory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/lab-reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Lab & diagnostics</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/handover">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Shift handover notes</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/reception/reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Daily desk reports</span>
                  </NavLink>
                </>
              ) : role === "pharmacist" ? (
                <>
                  {/* Category 1: Main Dashboard */}
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Pharmacy Dashboard</span>
                  </NavLink>

                  {/* Category 2: Prescriptions */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Prescriptions
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/queue">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Prescription Queue</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/dispense">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Dispensing</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/history">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Prescription History</span>
                  </NavLink>

                  {/* Category 3: Inventory */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Inventory
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/inventory">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Medicine Inventory</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/stock">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Stock Management</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/batches">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span>Batch Management</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/expiry">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Expiry Management</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/alerts">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Low Stock Alerts</span>
                  </NavLink>

                  {/* Category 4: Purchasing */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Purchasing
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/suppliers">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Suppliers</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/purchase-orders">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Purchase Orders</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/stock">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Stock Receiving (GRN)</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/returns">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Returns & Quarantine</span>
                  </NavLink>

                  {/* Category 5: Patients */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Patients
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Patient Search & Rx History</span>
                  </NavLink>

                  {/* Category 6: Finance */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Finance
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/billing">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Pharmacy Billing & Receipts</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/returns">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                    <span>Refunds & Adjustments</span>
                  </NavLink>

                  {/* Category 7: Reports */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Reports
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/analytics">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Pharmacy Analytics & Reports</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/pharmacy/batches">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Stock Ledger & Valuation</span>
                  </NavLink>

                  {/* Category 8: Staff */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Staff & Duty
                  </div>
                  <NavLink className={navLinkClass} to="/pharmacy/staff">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Pharmacy Staff & Shifts</span>
                  </NavLink>
                </>
              ) : ["diagnostic_admin", "pathologist", "radiologist", "lab_technician", "radiology_technician"].includes(role) ? (
                <>
                  {/* Category 1: Overview & Analytics */}
                  <NavLink className={navLinkClass} to="/dashboard">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Diagnostic Command Hub</span>
                  </NavLink>

                  {/* Category 2: Requests & Scheduling */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Requests & Scheduling
                  </div>
                  <NavLink className={navLinkClass} to="/diagnostic/requests">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Test Requests</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/appointments">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Appointment Bookings</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/samples">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Sample Collection (Phlebotomy)</span>
                  </NavLink>

                  {/* Category 3: Laboratory / Pathology */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Laboratory & Pathology
                  </div>
                  <NavLink className={navLinkClass} to="/diagnostic/workbench">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Technician Workbench</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/catalog?department=Pathology">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Pathology Test Directory</span>
                  </NavLink>

                  {/* Category 4: Radiology & Medical Imaging */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Radiology & Imaging
                  </div>
                  <NavLink className={navLinkClass} to="/diagnostic/radiology">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>Imaging Worklist & Viewer</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/catalog?department=Radiology">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Radiology Modality Catalog</span>
                  </NavLink>

                  {/* Category 5: Reports & Verification */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Reports & Verification
                  </div>
                  <NavLink className={navLinkClass} to="/diagnostic/review">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Specialist Review & Sign-Off</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/reports">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Finalized Diagnostic Reports</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/print-center">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Center & Film Bureau</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/critical">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Critical Alert Desk</span>
                  </NavLink>

                  {/* Category 6: Operations & Governance */}
                  <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Operations & Governance
                  </div>
                  <NavLink className={navLinkClass} to="/diagnostic/catalog">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span>Master Test Catalog</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/equipment">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span>Biomedical Equipment</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/inventory">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Reagents & Supplies</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/billing">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Diagnostic Billing</span>
                  </NavLink>
                  <NavLink className={navLinkClass} to="/diagnostic/audit">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>NABH Quality Logs</span>
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
                        : "Nursing station"}
                    </span>
                  </NavLink>

                  {/* Staff Navigation: Patients */}
                  <NavLink className={navLinkClass} to="/patients">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      {role === "doctor" ? "My patients" : "Inpatient care records"}
                    </span>
                  </NavLink>

                  {/* Doctors / Schedule: Doctor views own schedule */}
                  {role === "doctor" && (
                    <NavLink className={navLinkClass} to="/doctors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>My schedule & availability</span>
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
                        : "OPD scheduling"}
                    </span>
                  </NavLink>

                  {/* Digital Prescriptions (Rx) */}
                  <NavLink className={navLinkClass} to="/prescriptions">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>
                      {role === "doctor" ? "Prescriptions (Rx)" : "Prescriptions directory"}
                    </span>
                  </NavLink>

                  {/* Beds & Ward Management: Nurse */}
                  {role === "nurse" && (
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
                </>
              )}
            </nav>
          </div>

          {/* Sidebar Footer Controls & Collapse Toggle */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-2">
            {/* Bottom Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-1" : "justify-between px-2.5"
              } py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white border border-slate-200/80 active:scale-[0.97] transition cursor-pointer shadow-2xs`}
              title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {!isSidebarCollapsed && (
                <span className="flex items-center gap-1.5 truncate">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span>Collapse panel</span>
                </span>
              )}
              {!isSidebarCollapsed && (
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                  Ctrl+B
                </kbd>
              )}
              {isSidebarCollapsed && (
                <svg className="h-4 w-4 text-slate-600 rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>

            {/* Sidebar Footer Badge */}
            <div className="sidebar-hide-collapsed rounded-md bg-white/70 border border-slate-200/70 p-2.5 text-center backdrop-blur-md">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>NABH Accredited</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                ABDM Connected (HFR/HIP)
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-white/70 border border-slate-200 hover:bg-rose-50 hover:border-rose-300 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 transition cursor-pointer touch-target"
                >
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 bg-transparent p-3 sm:p-5 lg:p-7 pb-24 lg:pb-7 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Enterprise Portal Footer (Positioned below the side panel & main workspace) */}
      <div className="w-full px-4 sm:px-6 lg:px-7 pb-24 lg:pb-6 pt-2">
        <Footer />
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
        isPatient={false}
      />
    </div>
  );
}

export default DashboardLayout;

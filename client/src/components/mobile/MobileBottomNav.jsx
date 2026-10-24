import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getNavigationForRole } from "../../config/navigationConfig.jsx";
import { MobileIcon } from "./MobileNavIcons.jsx";

export default function MobileBottomNav({
  role = "admin",
  user = null,
  mobileOpen = false,
  onToggleMenu = () => {},
  isModalOpen = false,
}) {
  const location = useLocation();
  const normalizedRole = (role || "admin").toLowerCase().trim();
  const navConfig = getNavigationForRole(normalizedRole, user);
  const bottomTabs = navConfig.bottomTabs || [];

  // Active link check
  const isTabActive = (tabPath) => {
    if (tabPath === "/dashboard" || tabPath === "/patient/dashboard" || tabPath === "/emergency/dashboard") {
      return location.pathname === tabPath;
    }
    return location.pathname === tabPath || location.pathname.startsWith(tabPath + "/");
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation Bar"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 liquid-glass-nav transition-all duration-200 ${
        isModalOpen
          ? "opacity-0 pointer-events-none translate-y-full"
          : "opacity-100 pointer-events-auto translate-y-0"
      }`}
    >
      <div className="flex items-center justify-around h-16 min-h-[56px] max-w-lg mx-auto px-1.5 sm:px-3">
        {/* Render 4 Primary Role-Based Tabs */}
        {bottomTabs.slice(0, 4).map((tab) => {
          const active = isTabActive(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => {
                if (mobileOpen) onToggleMenu();
              }}
              className={`group flex-1 min-w-[48px] min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-150 touch-manipulation select-none cursor-pointer ${
                active
                  ? "text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900 active:text-slate-900 font-medium"
              }`}
            >
              <div
                className={`relative flex items-center justify-center h-8 w-11 rounded-full transition-all duration-150 group-active:scale-95 ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 group-hover:bg-slate-100/60 group-active:bg-slate-100"
                }`}
              >
                <MobileIcon name={tab.iconName} className="h-5 w-5" />
                {active && (
                  <span className="absolute -top-0.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-900 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-[64px] leading-tight mt-0.5 font-medium">
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        {/* 5th Tab: Menu Drawer Toggle with Active Indicator */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMenu();
          }}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open all navigation menu"}
          className={`group flex-1 min-w-[48px] min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-150 touch-manipulation select-none cursor-pointer ${
            mobileOpen
              ? "text-slate-900 font-semibold"
              : "text-slate-500 hover:text-slate-900 active:text-slate-900 font-medium"
          }`}
        >
          <div
            className={`relative flex items-center justify-center h-8 w-11 rounded-full transition-all duration-150 group-active:scale-95 ${
              mobileOpen
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 group-hover:bg-slate-100/60 group-active:bg-slate-100"
            }`}
          >
            <MobileIcon name={mobileOpen ? "close" : "menu"} className="h-5 w-5" />
            {!mobileOpen && (
              <span className="absolute -top-0.5 right-1 h-2 w-2 rounded-full bg-slate-900 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight truncate max-w-[64px] leading-tight mt-0.5 font-medium">
            {mobileOpen ? "Close" : "Menu"}
          </span>
        </button>
      </div>
    </nav>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import HospitalLogo from "../HospitalLogo.jsx";
import { getNavigationForRole } from "../../config/navigationConfig.jsx";
import { MobileIcon } from "./MobileNavIcons.jsx";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function MobileMenuSheet({
  isOpen = false,
  onClose = () => {},
  role = "admin",
  user = null,
  onLogout = () => {},
  isPatient = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const navConfig = useMemo(() => getNavigationForRole(role, user), [role, user]);

  // Reset search when menu opens/closes or route changes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedCategory("all");
    }
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Filter categories and items based on search and category tab
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const categories = navConfig.categories || [];

    return categories
      .map((cat) => {
        // If a specific category tab is selected and doesn't match
        if (selectedCategory !== "all" && cat.id !== selectedCategory) {
          return null;
        }

        // If search query is present, filter items
        if (!query) {
          return cat;
        }

        const matchingItems = cat.items.filter((item) => {
          return (
            item.label.toLowerCase().includes(query) ||
            item.desc?.toLowerCase().includes(query) ||
            cat.name.toLowerCase().includes(query)
          );
        });

        if (matchingItems.length === 0) return null;

        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter(Boolean);
  }, [navConfig, searchQuery, selectedCategory]);

  const totalResults = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  if (!isOpen) return null;

  const displayName =
    role === "doctor" && user?.name
      ? formatDoctorName(user.name)
      : user?.name || (isPatient ? "Patient" : "Hospital Staff");

  return (
    <div data-mobile-sheet="true" className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      {/* Blurred Backdrop */}
      <div
        data-mobile-sheet="true"
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md animate-backdrop-fade transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Up Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        data-mobile-sheet="true"
        aria-label="Portal Navigation Menu"
        className="relative z-10 w-full max-h-[92vh] flex flex-col rounded-t-[32px] bg-[#fbfbfa] border-t border-white/90 shadow-2xl animate-sheet-up overflow-hidden"
      >
        {/* Drag Handle Bar */}
        <div className="pt-3 pb-1 flex-shrink-0 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Sheet Top Header */}
        <div className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 bg-white/70 backdrop-blur-md">
          <Link to={isPatient ? "/patient/dashboard" : "/dashboard"} onClick={onClose}>
            <HospitalLogo variant="full" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-90 touch-target cursor-pointer"
            aria-label="Close navigation menu"
          >
            <MobileIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
          {/* User Profile Banner */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {displayName}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 flex-shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {navConfig.department}
                </p>
              </div>
            </div>

            {/* Quick Profile Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition active:scale-95"
              >
                <MobileIcon name="switch" className="h-3.5 w-3.5 text-slate-500" />
                <span>Switch Portal</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2 text-xs font-semibold text-rose-700 transition active:scale-95 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Emergency SOS Banner (Always 1-Tap Reachable) */}
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/80 p-3 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
              </span>
              <div>
                <p className="text-xs font-bold text-rose-900 leading-tight">24/7 Hospital Emergency</p>
                <p className="text-[10px] text-rose-700 font-medium">Stat Trauma, Ambulance & Code Blue</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href="tel:108"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
              >
                <MobileIcon name="phone" className="h-3.5 w-3.5" />
                <span>Call 108</span>
              </a>
              <a
                href="tel:112"
                className="inline-flex items-center px-2 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 font-bold text-xs shadow-2xs active:scale-95 transition"
              >
                112
              </a>
            </div>
          </div>

          {/* Quick Actions Shortcuts (If provided) */}
          {navConfig.quickActions?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Quick Shortcuts
              </div>
              <div className="grid grid-cols-3 gap-2">
                {navConfig.quickActions.map((qa) => {
                  const isExternal = qa.to?.startsWith("tel:") || qa.to?.startsWith("http");
                  const content = (
                    <>
                      <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center mb-1 transition">
                        <MobileIcon name={qa.iconName} className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                        {qa.label}
                      </span>
                    </>
                  );

                  if (isExternal) {
                    return (
                      <a
                        key={qa.label}
                        href={qa.to}
                        onClick={onClose}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition active:scale-95 text-center shadow-2xs group cursor-pointer touch-target"
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={qa.label}
                      to={qa.to}
                      onClick={onClose}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition active:scale-95 text-center shadow-2xs group cursor-pointer touch-target"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-Time Search & Jump Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MobileIcon name="search" className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, wards, reports, navigation..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <MobileIcon name="close" className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Interactive Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-blue-50 text-blue-700 border border-blue-200/90 font-bold shadow-2xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Sections
            </button>
            {navConfig.categories?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200/90 font-bold shadow-2xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filtered Navigation Groups */}
          {totalResults === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                <MobileIcon name="search" className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No matching tools found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try another keyword or reset filters</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-3 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between px-1 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {cat.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cat.items.length} {cat.items.length === 1 ? "tool" : "tools"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {cat.items.map((item) => {
                    const isExternal = item.to?.startsWith("tel:") || item.to?.startsWith("http");
                    const isActive =
                      item.to === "/dashboard" ||
                      item.to === "/patient/dashboard" ||
                      item.to === "/emergency/dashboard"
                        ? location.pathname === item.to
                        : item.to === location.pathname || location.pathname.startsWith(item.to + "/");

                    const itemClass = `group rounded-xl p-3 flex items-center justify-between gap-3 border transition-all duration-150 active:scale-[0.98] cursor-pointer touch-target ${
                      isActive
                        ? "bg-blue-50/80 border-blue-300 shadow-xs ring-1 ring-blue-500/20"
                        : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs"
                    }`;

                    const itemBody = (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive
                                ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            <MobileIcon name={item.iconName} className="h-4.5 w-4.5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isActive ? "text-blue-900" : "text-slate-800"
                                }`}
                              >
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="rounded bg-rose-50 border border-rose-200 text-rose-700 px-1 py-0.2 text-[9px] font-bold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.desc && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.desc}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              Active
                            </span>
                          ) : (
                            <svg className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </>
                    );

                    if (isExternal) {
                      return (
                        <a
                          key={item.to + item.label}
                          href={item.to}
                          onClick={onClose}
                          className={itemClass}
                        >
                          {itemBody}
                        </a>
                      );
                    }

                    return (
                      <NavLink
                        key={item.to + item.label}
                        to={item.to}
                        onClick={onClose}
                        className={itemClass}
                      >
                        {itemBody}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Hospital Standards & ABDM Compliance Footer */}
          <div className="pt-4 pb-12 text-center border-t border-slate-200/70">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>NABH Accredited • ABDM Connected</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Nivora Care Enterprise Hospital OS • v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

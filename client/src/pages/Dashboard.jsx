import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DoctorScheduleModal from "../components/DoctorScheduleModal.jsx";
import PrescriptionForm from "../components/PrescriptionForm.jsx";
import VitalsTracker from "../components/VitalsTracker.jsx";
import NursingChecklistModal from "../components/NursingChecklistModal.jsx";
import PatientClinicalProfileModal from "../components/nurse/PatientClinicalProfileModal.jsx";
import DoctorPatientProfileModal from "../components/doctor/DoctorPatientProfileModal.jsx";
import {
  cancelMyAppointment,
  getAppointments,
  getBillings,
  getDoctors,
  getMyProfile,
  getMyAppointments,
  getMyBillings,
  getPatients,
  getMyDoctorProfile,
  getPatientVitals,
  updateAppointmentStatus,
  updatePaymentStatus,
  getBeds,
  dischargeBed,
  getRecentVitalsAlerts,
  getNurseDashboardMetrics,
  administerMedication,
  updateNursingTaskStatus,
  updateDoctorOrderStatus,
  getDoctorDashboardData,
  getAdminTelemetry,
  getGlobalAdminSearch,
} from "../services/api.js";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function MetricCard({ label, value, icon, gradient, badge, badgeColor, to, onClick }) {
  const cardContent = (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        to || onClick ? "cursor-pointer hover:ring-2 hover:ring-slate-300" : ""
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      {badge && (
        <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
            {badge}
          </span>
          {to && (
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-800 transition flex items-center gap-0.5">
              Open →
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left p-0 border-0 bg-transparent block no-underline">
        {cardContent}
      </button>
    );
  }

  return cardContent;
}

/* =========================================================================
   1. ADMIN EXECUTIVE PORTAL DASHBOARD
   ========================================================================= */
function AdminDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Global Search Modal State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAdminData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getAdminTelemetry();
        if (active) {
          setTelemetry(data);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load admin telemetry.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchAdminData();
    return () => { active = false; };
  }, [refreshKey]);

  // Global search shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await getGlobalAdminSearch(searchQuery.trim(), searchType);
      setSearchResults(res.results || {});
    } catch (err) {
      console.error("Global search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const bedCensus = telemetry?.bedCensus || {
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    cleaningBeds: 0,
    maintenanceBeds: 0,
    occupancyPercentage: 0,
    icuOccupancy: 0,
    icuOccupied: 0,
    icuTotal: 0,
    emergencyOccupied: 0,
    emergencyTotal: 0,
    generalOccupied: 0,
    generalTotal: 0,
  };

  const recentAppointments = telemetry?.recentAppointments || [];
  const todayAppointments = telemetry?.todayAppointments || [];
  const recentActivity = telemetry?.recentActivity || [];

  if (isLoading) return <LoadingSpinner label="Loading Executive Operations..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* ================= 1. EXECUTIVE HERO BANNER ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Administrator Executive Command Center</span>
              <span className="opacity-60">•</span>
              <span>Hospital Clearance Level 3</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Nivora Care Operations & Governance
            </h1>
            <p className="mt-2 text-sm text-purple-100/90 leading-relaxed">
              Institutional oversight for {user?.name || "Administrator"}. Monitor live inpatient bed census, emergency department triage, surgical suites, workforce shifts, and revenue settlements.
            </p>
          </div>

          {/* Quick Search Trigger & Shortcuts */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="group flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition shadow-sm"
              title="Global Hospital Search"
            >
              <svg className="h-4 w-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search hospital records...</span>
              <kbd className="hidden sm:inline-block rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono text-white/80">
                Ctrl K
              </kbd>
            </button>

            <Link
              to="/admin/calendar"
              className="flex items-center gap-1.5 rounded-xl bg-purple-500/30 border border-purple-400/40 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-purple-500/40 transition"
            >
              <span>📅</span>
              <span>Central Calendar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 2. 12-METRIC EXECUTIVE KPI GRID ================= */}
      <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Registered Patients"
          value={telemetry?.totalPatients || 0}
          gradient="from-blue-600 to-cyan-600"
          badge="Permanent Registry"
          badgeColor="bg-blue-50 text-blue-700"
          to="/patients"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <MetricCard
          label="Specialist Doctors"
          value={telemetry?.activeDoctors || 0}
          gradient="from-indigo-600 to-purple-600"
          badge="Consultants"
          badgeColor="bg-indigo-50 text-indigo-700"
          to="/doctors"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <MetricCard
          label="Nursing Workforce"
          value={telemetry?.activeNurses || 0}
          gradient="from-teal-600 to-cyan-600"
          badge="Active on Duty"
          badgeColor="bg-teal-50 text-teal-700"
          to="/admin/staff"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <MetricCard
          label="Today Consultations"
          value={telemetry?.todayConsultations || 0}
          gradient="from-emerald-500 to-teal-600"
          badge="Scheduled OPD"
          badgeColor="bg-emerald-50 text-emerald-700"
          to="/appointments"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <MetricCard
          label="Inpatient Bed Census"
          value={`${bedCensus.occupancyPercentage}%`}
          gradient="from-purple-600 to-pink-600"
          badge={`${bedCensus.occupiedBeds}/${bedCensus.totalBeds} Beds Occupied`}
          badgeColor="bg-purple-50 text-purple-700"
          to="/admin/admissions"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
        />
        <MetricCard
          label="ICU Bed Load"
          value={`${bedCensus.icuOccupancy}%`}
          gradient="from-rose-600 to-red-600"
          badge={`${bedCensus.icuOccupied}/${bedCensus.icuTotal} ICU Occupied`}
          badgeColor={bedCensus.icuOccupancy > 80 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}
          to="/beds"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        />
        <MetricCard
          label="Emergency Trauma Bay"
          value={`${bedCensus.emergencyOccupied}/${bedCensus.emergencyTotal}`}
          gradient="from-rose-500 to-amber-600"
          badge="Active ER Cases"
          badgeColor="bg-rose-50 text-rose-700"
          to="/admin/emergency"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <MetricCard
          label="Today OT Surgeries"
          value={telemetry?.todaySurgeriesCount || 0}
          gradient="from-indigo-600 to-blue-700"
          badge="Surgical Suites"
          badgeColor="bg-blue-50 text-blue-700"
          to="/admin/operating-theatre"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242L10.758 4.88a3 3 0 014.242 4.242L12.12 12z" /></svg>}
        />
        <MetricCard
          label="Pending Invoices"
          value={telemetry?.pendingBills || 0}
          gradient="from-amber-500 to-orange-600"
          badge="Awaiting Settlement"
          badgeColor="bg-amber-50 text-amber-700"
          to="/billing"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <MetricCard
          label="Today Revenue Collected"
          value={`₹${(telemetry?.todayRevenue || 0).toLocaleString("en-IN")}`}
          gradient="from-emerald-600 to-green-700"
          badge="Cashier Receipts"
          badgeColor="bg-emerald-50 text-emerald-700"
          to="/admin/revenue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          label="Pending Lab Reports"
          value={telemetry?.pendingLabs || 0}
          gradient="from-blue-500 to-indigo-600"
          badge={telemetry?.criticalLabs > 0 ? `${telemetry.criticalLabs} Urgent` : "Diagnostics"}
          badgeColor={telemetry?.criticalLabs > 0 ? "bg-rose-100 text-rose-800 font-bold" : "bg-blue-50 text-blue-700"}
          to="/lab-reports"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
        />
        <MetricCard
          label="Review Queue"
          value={telemetry?.pendingPatientBookings || 0}
          gradient="from-purple-500 to-violet-600"
          badge="Self-Booked Visits"
          badgeColor="bg-purple-50 text-purple-700"
          to="/appointments"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
      </div>

      {/* ================= 3. BED OCCUPANCY & WARD CENSUS METERS ================= */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-600"></span>
              Real-Time Inpatient Census & Ward Utilization
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live hospital bed tracking across ICU, Emergency, and Inpatient units</p>
          </div>
          <Link to="/admin/admissions" className="text-xs font-bold text-purple-600 hover:underline">
            Manage Inpatient Admissions →
          </Link>
        </div>

        {/* Total Bed Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Hospital Bed Utilization: {bedCensus.occupancyPercentage}% Occupied</span>
            <span className="text-slate-500 font-mono">
              {bedCensus.occupiedBeds} occupied / {bedCensus.availableBeds} available / {bedCensus.totalBeds} total
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="bg-purple-600 h-full transition-all duration-500"
              style={{ width: `${bedCensus.occupancyPercentage}%` }}
              title={`Occupied: ${bedCensus.occupiedBeds}`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${bedCensus.totalBeds > 0 ? (bedCensus.cleaningBeds / bedCensus.totalBeds) * 100 : 0}%` }}
              title={`Cleaning: ${bedCensus.cleaningBeds}`}
            />
            <div
              className="bg-slate-300 h-full transition-all duration-500"
              style={{ width: `${bedCensus.totalBeds > 0 ? (bedCensus.maintenanceBeds / bedCensus.totalBeds) * 100 : 0}%` }}
              title={`Maintenance: ${bedCensus.maintenanceBeds}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Occupied ({bedCensus.occupiedBeds})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Vacant & Ready ({bedCensus.availableBeds})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400"></span> Housekeeping ({bedCensus.cleaningBeds})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400"></span> Maintenance ({bedCensus.maintenanceBeds})</span>
          </div>
        </div>

        {/* Ward Breakdown Meters */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 pt-4 border-t border-slate-100">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>ICU & Critical Care</span>
              <span className={bedCensus.icuOccupancy > 80 ? "text-rose-600 font-extrabold animate-pulse" : "text-purple-700"}>
                {bedCensus.icuOccupancy}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${bedCensus.icuOccupancy > 80 ? "bg-rose-600" : "bg-purple-600"}`}
                style={{ width: `${bedCensus.icuOccupancy}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {bedCensus.icuOccupied} beds in use out of {bedCensus.icuTotal}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Emergency Bay</span>
              <span className="text-rose-700 font-extrabold">
                {bedCensus.emergencyTotal > 0 ? Math.round((bedCensus.emergencyOccupied / bedCensus.emergencyTotal) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600"
                style={{ width: `${bedCensus.emergencyTotal > 0 ? (bedCensus.emergencyOccupied / bedCensus.emergencyTotal) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {bedCensus.emergencyOccupied} beds in use out of {bedCensus.emergencyTotal}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>General & Specialty Wards</span>
              <span className="text-blue-700 font-extrabold">
                {bedCensus.generalTotal > 0 ? Math.round((bedCensus.generalOccupied / bedCensus.generalTotal) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${bedCensus.generalTotal > 0 ? (bedCensus.generalOccupied / bedCensus.generalTotal) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {bedCensus.generalOccupied} beds in use out of {bedCensus.generalTotal}
            </p>
          </div>
        </div>
      </section>

      {/* ================= 4. 12-CARD OPERATIONS HUB ================= */}
      <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500"></span>
              Hospital Executive Operations Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">1-click direct management across all medical & operational facilities</p>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-500/20">
            Full Clearance
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <Link to="/patients" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">👥</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Patients</span>
            <span className="text-[10px] text-slate-500">Master registry</span>
          </Link>
          <Link to="/admin/admissions" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-purple-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🛏️</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Admissions</span>
            <span className="text-[10px] text-slate-500">Inpatient census</span>
          </Link>
          <Link to="/doctors" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🩺</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Specialists</span>
            <span className="text-[10px] text-slate-500">Doctor directory</span>
          </Link>
          <Link to="/appointments" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">📅</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Appointments</span>
            <span className="text-[10px] text-slate-500">OPD queue</span>
          </Link>
          <Link to="/admin/operating-theatre" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-pink-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🏥</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Operating Theatre</span>
            <span className="text-[10px] text-slate-500">Surgeries & OT</span>
          </Link>
          <Link to="/admin/emergency" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🚨</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Emergency & ER</span>
            <span className="text-[10px] text-slate-500">24/7 Trauma desk</span>
          </Link>
          <Link to="/billing" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">💳</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Billing & Cash</span>
            <span className="text-[10px] text-slate-500">Settlements</span>
          </Link>
          <Link to="/admin/revenue" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-teal-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">📈</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Revenue</span>
            <span className="text-[10px] text-slate-500">Financial telemetry</span>
          </Link>
          <Link to="/admin/departments" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-purple-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🏢</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Departments</span>
            <span className="text-[10px] text-slate-500">Clinical divisions</span>
          </Link>
          <Link to="/admin/staff" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🧑‍💼</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Staff & HR</span>
            <span className="text-[10px] text-slate-500">Workforce roster</span>
          </Link>
          <Link to="/admin/attendance" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🕒</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Attendance</span>
            <span className="text-[10px] text-slate-500">Shifts & leaves</span>
          </Link>
          <Link to="/admin/inventory" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">💊</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Pharmacy</span>
            <span className="text-[10px] text-slate-500">Medications SKU</span>
          </Link>
        </div>
      </section>

      {/* ================= 5. DUAL STREAM WIDGETS ================= */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left Stream: Consultations / Outpatients */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Hospital Consultations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Today&apos;s active and recent consultation records</p>
            </div>
            <Link to="/appointments" className="text-xs font-bold text-purple-600 hover:underline">
              View All ({todayAppointments.length} Today) →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {todayAppointments.length === 0 && recentAppointments.length === 0 ? (
              <li className="py-8 text-center text-xs text-slate-400">No recent consultations recorded.</li>
            ) : (
              (todayAppointments.length > 0 ? todayAppointments : recentAppointments).map((a) => (
                <li key={a._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-bold text-xs ring-1 ring-purple-500/20">
                      {a.patient?.name ? a.patient.name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{a.patient?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Dr. {a.doctor?.name} • <span className="capitalize">{a.doctor?.specialization || "Consultant"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {a.timeSlot || formatDate(a.appointmentDate)}
                    </span>
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-blue-500/20">
                      {a.status}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Right Stream: Live System Audit Activity */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">System Activity Stream</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time immutable audit trail events</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-purple-600 hover:underline">
              Full Audit Ledger →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <li className="py-8 text-center text-xs text-slate-400">No recorded audit activities.</li>
            ) : (
              recentActivity.map((log) => (
                <li key={log._id} className="py-3 px-2 hover:bg-slate-50/60 rounded-xl transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{log.action}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{log.details}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="font-semibold text-purple-700">{log.userName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="uppercase text-slate-400">{log.module}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {/* ================= 6. GLOBAL ADMIN SEARCH MODAL ================= */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4 pt-16 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden">
            {/* Search Input Bar */}
            <form onSubmit={handleGlobalSearch} className="flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <svg className="h-5 w-5 text-slate-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search patients, doctors, staff, invoices, beds across hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                ✕
              </button>
            </form>

            {/* Entity Filters */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 text-xs bg-white">
              <span className="text-slate-400 font-semibold">Scope:</span>
              {["all", "patients", "doctors", "staff", "invoices", "appointments", "beds"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSearchType(st)}
                  className={`rounded-md px-2 py-0.5 capitalize font-semibold transition ${
                    searchType === st ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Results Body */}
            <div className="p-4 max-h-[420px] overflow-y-auto space-y-4">
              {isSearching ? (
                <div className="py-12 text-center text-xs text-slate-400">Searching hospital records...</div>
              ) : !searchResults ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Type a patient name, UHID, doctor, or invoice number and press Enter.
                </div>
              ) : (
                <>
                  {/* Patients */}
                  {searchResults.patients?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                        Patients ({searchResults.patients.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.patients.map((p) => (
                          <Link
                            key={p._id}
                            to="/patients"
                            onClick={() => setShowSearchModal(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50/60 transition text-xs"
                          >
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-slate-400 font-mono">{p.contactNumber || p.email}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctors */}
                  {searchResults.doctors?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                        Doctors ({searchResults.doctors.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.doctors.map((d) => (
                          <Link
                            key={d._id}
                            to="/doctors"
                            onClick={() => setShowSearchModal(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/60 transition text-xs"
                          >
                            <span className="font-bold text-slate-800">Dr. {d.name}</span>
                            <span className="text-slate-400">{d.specialization} • {d.department}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff */}
                  {searchResults.staff?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
                        Workforce ({searchResults.staff.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.staff.map((s) => (
                          <Link
                            key={s._id}
                            to="/admin/staff"
                            onClick={() => setShowSearchModal(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-teal-50/60 transition text-xs"
                          >
                            <span className="font-bold text-slate-800">{s.name}</span>
                            <span className="capitalize text-slate-400">{s.role} • {s.department}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {searchResults.invoices?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                        Invoices ({searchResults.invoices.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.invoices.map((inv) => (
                          <Link
                            key={inv._id}
                            to="/billing"
                            onClick={() => setShowSearchModal(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/60 transition text-xs"
                          >
                            <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber || inv._id}</span>
                            <span className="text-emerald-700 font-bold font-mono">₹{inv.totalAmount}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beds */}
                  {searchResults.beds?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                        Beds ({searchResults.beds.length})
                      </h3>
                      <div className="space-y-1">
                        {searchResults.beds.map((b) => (
                          <Link
                            key={b._id}
                            to="/beds"
                            onClick={() => setShowSearchModal(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/60 transition text-xs"
                          >
                            <span className="font-bold text-slate-800">Bed {b.bedNumber} ({b.wardType})</span>
                            <span className="capitalize text-slate-400">{b.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Press <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">ESC</kbd> to close</span>
              <span>Hospital Global Registry</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. DOCTOR CLINICAL WORKSPACE PORTAL DASHBOARD
   ========================================================================= */
function DoctorDashboard({ user, refreshKey, onTriggerRefresh }) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Modals for clinical workflow
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [rxAppointment, setRxAppointment] = useState(null);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [patientVitalsList, setPatientVitalsList] = useState([]);
  const [selectedChartPatientId, setSelectedChartPatientId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadDoctorData = async () => {
      setLoading(true);
      setError("");
      try {
        const [meData, aData, pData, wsData] = await Promise.all([
          getMyDoctorProfile(),
          getAppointments(),
          getPatients("", 1, 20),
          getDoctorDashboardData().catch(() => ({ success: false })),
        ]);
        if (active) {
          setProfileData(meData);
          setAppointments(aData.appointments || []);
          setPatients(pData.patients || []);
          if (wsData?.success && wsData.data) {
            setWorkspaceData(wsData.data);
          }
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load doctor clinical workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDoctorData();
    return () => { active = false; };
  }, [refreshKey]);

  const doctor = profileData?.doctor;
  const metrics = workspaceData?.metrics || {
    todayConsultations: appointments.length,
    waitingQueue: appointments.filter((a) => a.status === "waiting" || a.status === "pending").length,
    inProgressConsultations: appointments.filter((a) => a.status === "in_progress" || a.status === "in_consultation").length,
    completedToday: appointments.filter((a) => a.status === "completed").length,
    assignedPatients: patients.length,
    pendingLabReviews: 0,
    criticalLabReports: 0,
    activeOrders: 0,
    inboundReferrals: 0,
    upcomingFollowUps: 0,
  };
  const urgentAlerts = workspaceData?.urgentAlerts || [];
  const consultationQueue = workspaceData?.consultationQueue?.length
    ? workspaceData.consultationQueue
    : appointments;

  const todaySchedule = workspaceData?.doctorProfile?.todaySchedule || profileData?.todaySchedule;

  const handleMarkComplete = async (id) => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, "completed");
      onTriggerRefresh();
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenVitals = async (patient) => {
    setVitalsPatient(patient);
    try {
      const res = await getPatientVitals(patient._id);
      setPatientVitalsList(res.vitals || []);
    } catch {
      setPatientVitalsList([]);
    }
  };

  if (loading) return <LoadingSpinner label="Opening Doctor Clinical Workspace..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Doctor Hero & Identity Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl ring-1 ring-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Doctor clinical workspace</span>
              <span className="opacity-60">•</span>
              <span className="text-emerald-300 font-mono">ID: {doctor?._id?.slice(-6).toUpperCase()}</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, Dr. {doctor?.name || user?.name?.replace(/^Dr\.\s*/i, "")}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-emerald-100/90">
              <span className="font-semibold text-emerald-200">
                {doctor?.specialization || "Specialist"}
              </span>
              <span>•</span>
              <span>Department of {doctor?.department || "Medicine"}</span>
              <span>•</span>
              <span className="rounded-md bg-emerald-800/80 px-2 py-0.5 text-xs font-medium">
                {doctor?.yearsOfExperience ?? 5} yrs experience
              </span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">
                Fee: ₹{doctor?.consultationFee ?? 500} / visit
              </span>
            </div>
          </div>

          {/* Quick Actions in Hero */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setScheduleDoctor(doctor)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-md transition hover:bg-emerald-50"
              type="button"
            >
              <span>📅</span>
              <span>Schedule</span>
            </button>
            <Link
              to="/doctor/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-md transition border border-slate-700"
            >
              <span>📋</span>
              <span>Doctor Orders</span>
            </Link>
            <Link
              to="/doctor/referrals"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-700/80 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition border border-purple-500/40"
            >
              <span>⇄</span>
              <span>Referrals</span>
            </Link>
            <Link
              to="/doctor/critical-labs"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-700/90 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-md transition border border-rose-500/40"
            >
              <span>🧪</span>
              <span>Critical Labs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Urgent Clinical Alerts Banner */}
      {urgentAlerts.length > 0 && (
        <div className="space-y-2">
          {urgentAlerts.map((alt, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                alt.level === "danger"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : alt.level === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">{alt.title}</h4>
                  <p className="text-xs opacity-90">{alt.message}</p>
                </div>
              </div>
              {alt.actionLink && (
                <Link
                  to={alt.actionLink}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap self-start sm:self-auto ${
                    alt.level === "danger"
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  Action Required →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 10 Clinical KPI Metrics Row */}
      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Today's Consults"
          value={metrics.todayConsultations}
          gradient="from-emerald-600 to-teal-600"
          badge="Scheduled for today"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-xl">🩺</span>}
          to="/appointments"
        />
        <MetricCard
          label="Waiting Queue"
          value={metrics.waitingQueue}
          gradient="from-amber-500 to-orange-600"
          badge="Waiting at station"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-xl">⏳</span>}
          to="/appointments?status=waiting"
        />
        <MetricCard
          label="In Progress"
          value={metrics.inProgressConsultations || 0}
          gradient="from-blue-600 to-indigo-600"
          badge="Active consultation"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-xl">🔄</span>}
          to="/appointments?status=in_consultation"
        />
        <MetricCard
          label="Completed Today"
          value={metrics.completedToday}
          gradient="from-teal-600 to-cyan-600"
          badge="Concluded visits"
          badgeColor="bg-teal-50 text-teal-700"
          icon={<span className="text-xl">✓</span>}
          to="/appointments?status=completed"
        />
        <MetricCard
          label="Assigned Patients"
          value={metrics.assignedPatients}
          gradient="from-purple-600 to-pink-600"
          badge="Total patient cohort"
          badgeColor="bg-purple-50 text-purple-700"
          icon={<span className="text-xl">👥</span>}
          to="/patients"
        />
        <MetricCard
          label="Pending Lab Reviews"
          value={metrics.pendingLabReviews}
          gradient="from-cyan-600 to-blue-600"
          badge="Awaiting doctor sign-off"
          badgeColor="bg-cyan-50 text-cyan-700"
          icon={<span className="text-xl">🧪</span>}
          to="/lab-reports"
        />
        <MetricCard
          label="Critical Lab Results"
          value={metrics.criticalLabReports}
          gradient="from-rose-600 to-red-600"
          badge={metrics.criticalLabReports > 0 ? "URGENT ATTENTION" : "None pending"}
          badgeColor={metrics.criticalLabReports > 0 ? "bg-rose-100 text-rose-800 font-bold" : "bg-slate-100 text-slate-600"}
          icon={<span className="text-xl">⚠️</span>}
          to="/doctor/critical-labs"
        />
        <MetricCard
          label="Active Doctor Orders"
          value={metrics.activeOrders}
          gradient="from-indigo-600 to-purple-600"
          badge="Ward instructions"
          badgeColor="bg-indigo-50 text-indigo-700"
          icon={<span className="text-xl">📋</span>}
          to="/doctor/orders"
        />
        <MetricCard
          label="Inbound Referrals"
          value={metrics.inboundReferrals}
          gradient="from-violet-600 to-indigo-700"
          badge="Cross-department opinions"
          badgeColor="bg-violet-50 text-violet-700"
          icon={<span className="text-xl">⇄</span>}
          to="/doctor/referrals"
        />
        <MetricCard
          label="Follow-ups Due"
          value={metrics.upcomingFollowUps}
          gradient="from-emerald-700 to-teal-800"
          badge="Next 7 days"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-xl">📅</span>}
          to="/doctor/follow-ups"
        />
      </div>

      {/* Today's Shift & Availability Strip */}
      <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-xl ring-1 ring-teal-500/20">
            ⏰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Today's Roster ({new Date().toLocaleDateString("en-IN", { weekday: "long" })})
              </h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                todaySchedule?.isAvailable !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {todaySchedule?.isAvailable !== false ? "● Active consulting shift" : "Off Duty"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {todaySchedule?.shifts?.length
                ? todaySchedule.shifts.map((s) => `${s.startTime} - ${s.endTime} (${s.slotDurationMinutes || 30}m slots)`).join(", ")
                : "Standard hospital shift: 09:00 AM - 05:00 PM"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {doctor?.leaves?.length > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-medium">
              🏖️ {doctor.leaves.length} approved leave scheduled
            </span>
          )}
          <button
            onClick={() => setScheduleDoctor(doctor)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            type="button"
          >
            ⚙ Edit weekly slots
          </button>
        </div>
      </div>

      {/* Main Consultation Queue with Live Triage & Abnormal Vitals Warning */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">My Consultation Queue & Live Triage</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients queued exclusively for Dr. {doctor?.name || user?.name} with automated vital signs alerts
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
            {consultationQueue.length} queued consultations
          </span>
        </div>

        {consultationQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <span className="text-4xl">🎉</span>
            <p className="mt-3 text-sm font-semibold text-slate-700">No appointments scheduled for you right now.</p>
            <p className="text-xs text-slate-400 mt-1">New patient bookings assigned to your schedule will appear here immediately.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {consultationQueue.map((a, idx) => (
              <li key={a._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 hover:bg-slate-50/70 rounded-xl px-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20 flex-shrink-0">
                    {a.queuePosition ? `#${a.queuePosition}` : a.timeSlot ? a.timeSlot.slice(0, 5) : `#${idx + 1}`}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{a.patient?.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        {a.patient?.age ? `${a.patient.age}y` : ""} {a.patient?.gender}
                      </span>
                      {a.patient?.bloodGroup && (
                        <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold border border-rose-100">
                          {a.patient.bloodGroup}
                        </span>
                      )}
                      {a.isVitalsAbnormal && (
                        <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-extrabold border border-rose-300 animate-pulse">
                          ⚠️ Abnormal: {a.abnormalDetails}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">Reason:</span> {a.reasonForVisit || "Routine consultation"} • {formatDate(a.appointmentDate)} • <span className="font-mono text-slate-600">{a.patient?.phone || a.patient?.contactNumber || ""}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                    {a.timeSlot}
                  </span>

                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
                    a.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
                      : a.status === "in_progress" || a.status === "in_consultation"
                      ? "bg-purple-50 text-purple-700 ring-purple-500/20"
                      : a.status === "waiting"
                      ? "bg-rose-50 text-rose-700 ring-rose-500/20"
                      : a.status === "confirmed"
                      ? "bg-blue-50 text-blue-700 ring-blue-500/20"
                      : "bg-amber-50 text-amber-700 ring-amber-500/20"
                  }`}>
                    {a.status}
                  </span>

                  {/* Primary Action: Start Consultation Workspace */}
                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/consultation/${a._id}`)}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition flex items-center gap-1"
                  >
                    <span>🩺</span>
                    <span>Start Consult</span>
                  </button>

                  {/* 360° Chart Button */}
                  {a.patient && (
                    <button
                      onClick={() => setSelectedChartPatientId(a.patient._id)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      title="View 360° patient clinical history chart"
                      type="button"
                    >
                      📋 Chart
                    </button>
                  )}

                  {/* Vitals Button */}
                  {a.patient && (
                    <button
                      onClick={() => handleOpenVitals(a.patient)}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                      title="View or record vitals"
                      type="button"
                    >
                      📊 Vitals
                    </button>
                  )}

                  {/* Prescribe Rx Button */}
                  <button
                    onClick={() => setRxAppointment(a)}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                    title="Generate prescription for this patient"
                    type="button"
                  >
                    ℞ Rx
                  </button>

                  {/* Complete Visit Button */}
                  {a.status !== "completed" && (
                    <button
                      disabled={updatingId === a._id}
                      onClick={() => handleMarkComplete(a._id)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
                      type="button"
                    >
                      {updatingId === a._id ? "..." : "✓ Conclude"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Weekly Schedule Overview Widget */}
      {doctor?.weeklySchedule && (
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">My weekly availability timetable</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your recurring shift schedule configured in hospital registry</p>
            </div>
            <button
              onClick={() => setScheduleDoctor(doctor)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              type="button"
            >
              Modify schedule →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {doctor.weeklySchedule.map((dayPlan) => (
              <div
                key={dayPlan.day}
                className={`p-3 rounded-xl border text-center transition-all ${
                  dayPlan.isAvailable
                    ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                    : "border-slate-200 bg-slate-50 opacity-60"
                }`}
              >
                <p className="text-xs font-bold text-slate-800">{dayPlan.day.slice(0, 3)}</p>
                <div className="mt-1.5">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dayPlan.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {dayPlan.isAvailable ? "Available" : "Off"}
                  </span>
                </div>
                {dayPlan.isAvailable && dayPlan.shifts?.[0] && (
                  <p className="mt-1.5 text-[11px] font-mono text-slate-600">
                    {dayPlan.shifts[0].startTime.replace(" ", "")} - {dayPlan.shifts[0].endTime.replace(" ", "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 360° Clinical Patient Profile Modal */}
      {selectedChartPatientId && (
        <DoctorPatientProfileModal
          patientId={selectedChartPatientId}
          onClose={() => setSelectedChartPatientId(null)}
          onStartConsultation={(id) => {
            // If an appointment exists for this patient, find it
            const matchingApt = consultationQueue.find((c) => c.patient?._id === id);
            if (matchingApt) {
              navigate(`/doctor/consultation/${matchingApt._id}`);
            } else {
              navigate("/appointments");
            }
          }}
        />
      )}

      {/* Doctor Schedule Modal */}
      {scheduleDoctor && (
        <DoctorScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setScheduleDoctor(null)}
          onUpdated={() => {
            setScheduleDoctor(null);
            onTriggerRefresh();
          }}
        />
      )}

      {/* Prescription Form Modal directly from Dashboard */}
      {rxAppointment && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <PrescriptionForm
              initialAppointment={rxAppointment}
              initialPatient={rxAppointment.patient}
              initialDoctor={doctor}
              onCancel={() => setRxAppointment(null)}
              onSuccess={() => {
                setRxAppointment(null);
                onTriggerRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {vitalsPatient && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Health Vitals Tracker — {vitalsPatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {vitalsPatient.age ? `${vitalsPatient.age}y / ` : ""}{vitalsPatient.gender} • Blood Group: {vitalsPatient.bloodGroup || "—"}
                </p>
              </div>
              <button
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setVitalsPatient(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <VitalsTracker
              patientId={vitalsPatient._id}
              initialVitals={patientVitalsList}
              onVitalsRecorded={(newV) => {
                setPatientVitalsList((prev) => [newV, ...prev]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. RECEPTIONIST & FRONT DESK ADMISSIONS PORTAL DASHBOARD
   ========================================================================= */
function ReceptionistDashboard({ user, refreshKey, onTriggerRefresh }) {
  const isNurse = user?.role === "nurse";
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadFrontDeskData = async () => {
      setLoading(true);
      try {
        const [pData, aData, bData] = await Promise.all([
          getPatients("", 1, 20),
          getAppointments(),
          getBillings({ paymentStatus: "pending" }),
        ]);
        if (active) {
          setPatients(pData.patients || []);
          setAppointments(aData.appointments || []);
          setBillings(bData.billings || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load front desk data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFrontDeskData();
    return () => { active = false; };
  }, [refreshKey]);

  const handleQuickCashSettlement = async (billingId) => {
    setSettlingId(billingId);
    try {
      await updatePaymentStatus(billingId, { paymentStatus: "paid", paymentMethod: "cash" });
      onTriggerRefresh();
    } catch (err) {
      alert("Payment settlement failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSettlingId(null);
    }
  };

  const handleConfirmAppointment = async (appId) => {
    try {
      await updateAppointmentStatus(appId, "confirmed");
      onTriggerRefresh();
    } catch (err) {
      alert("Failed to confirm: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <LoadingSpinner label={isNurse ? "Opening nursing station & inpatient care records..." : "Opening front desk & admissions counter..."} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Reception / Nurse Hero */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${isNurse ? "from-teal-800 via-cyan-900 to-slate-950" : "from-amber-700 via-orange-700 to-slate-950"} p-6 sm:p-8 text-white shadow-lg`}>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className={`h-2 w-2 rounded-full ${isNurse ? "bg-teal-400" : "bg-amber-400"} animate-pulse`}></span>
            <span>{isNurse ? "Clinical care & inpatient nursing station" : "Hospital admissions & cashier counter"}</span>
            <span className="opacity-60">•</span>
            <span>{isNurse ? "Ward care desk" : "Front office desk"}</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isNurse ? "Nursing station & inpatient care" : "Hospital front desk & admissions"}
          </h1>
          <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
            {isNurse
              ? `Welcome, ${user?.name}. Monitor admitted inpatients, record vital signs, coordinate ward bed allocations, and review diagnostic lab results.`
              : `Welcome, ${user?.name}. Process walk-in admissions, register patient check-ins, manage appointment schedules, and collect counter payments.`}
          </p>
        </div>
      </div>

      {/* Front Desk / Nurse Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={isNurse ? "Inpatients & records" : "Admitted patients"}
          value={patients.length}
          gradient="from-blue-600 to-cyan-600"
          badge="In system"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-2xl">👥</span>}
        />
        <MetricCard
          label="Scheduled consultations"
          value={appointments.length}
          gradient="from-emerald-600 to-teal-600"
          badge="OPD calendar"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">📅</span>}
        />
        <MetricCard
          label={isNurse ? "Unpaid hospital invoices" : "Pending cashier bills"}
          value={billings.length}
          gradient={isNurse ? "from-slate-600 to-slate-700" : "from-amber-500 to-orange-600"}
          badge={isNurse ? "View-only" : "Unsettled invoices"}
          badgeColor={isNurse ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}
          icon={<span className="text-2xl">💳</span>}
        />
        <MetricCard
          label="Online portal bookings"
          value={appointments.filter((a) => a.bookedBy === "patient" && a.status === "pending").length}
          gradient="from-rose-500 to-red-600"
          badge="Need desk confirmation"
          badgeColor="bg-rose-50 text-rose-700"
          icon={<span className="text-2xl">🔔</span>}
        />
      </div>

      {/* Operations Quick Action Hub */}
      <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isNurse ? "bg-teal-500" : "bg-amber-500"}`}></span>
              {isNurse ? "Nursing care quick actions" : "Front office quick operations"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{isNurse ? "Ward admissions, appointments & bed management" : "Admissions, OPD booking, and cashier desks"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/patients" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition">
            <span className="text-2xl">➕</span>
            <div>
              <p className="text-xs font-bold text-slate-800">{isNurse ? "Patient care directory" : "New patient admission"}</p>
              <p className="text-[11px] text-slate-500">{isNurse ? "View patients & record vitals" : "Register new hospital walk-in"}</p>
            </div>
          </Link>
          <Link to="/appointments" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 hover:shadow-md transition">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs font-bold text-slate-800">OPD appointments</p>
              <p className="text-[11px] text-slate-500">View & coordinate visits</p>
            </div>
          </Link>
          {isNurse ? (
            <Link to="/beds" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-400 hover:shadow-md transition">
              <span className="text-2xl">🛏️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Beds & wards</p>
                <p className="text-[11px] text-slate-500">Allocate beds & manage occupancy</p>
              </div>
            </Link>
          ) : (
            <Link to="/billing" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-amber-400 hover:shadow-md transition">
              <span className="text-2xl">🧾</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Cashier & invoicing</p>
                <p className="text-[11px] text-slate-500">Generate bill & collect payment</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Pending Cashier Queue / Billing Monitor */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {isNurse ? "Unpaid billing records (view-only)" : "Pending billing settlements"}
            </h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">{billings.length} unpaid</span>
          </div>
          {billings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">All bills are settled!</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {billings.slice(0, 5).map((b) => (
                <li key={b._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{b.patient?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500">Inv #{b._id.slice(-6).toUpperCase()} • ₹{b.totalAmount.toFixed(2)}</p>
                  </div>
                  {isNurse ? (
                    <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Unsettled
                    </span>
                  ) : (
                    <button
                      disabled={settlingId === b._id}
                      onClick={() => handleQuickCashSettlement(b._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {settlingId === b._id ? "Saving..." : "Collect cash"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Online Bookings Review Queue */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Online patient booking queue</h2>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/20">Needs confirmation</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.filter((a) => a.status === "pending").slice(0, 5).map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">Dr. {a.doctor?.name} • {a.timeSlot}</p>
                </div>
                <button
                  onClick={() => handleConfirmAppointment(a._id)}
                  className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  ✓ Confirm slot
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================
   4. PATIENT CARE PORTAL DASHBOARD (Integrated under /dashboard)
   ========================================================================= */
function PatientPortalDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadPatient = async () => {
      setLoading(true);
      try {
        const [p, a, b] = await Promise.all([
          getMyProfile(),
          getMyAppointments(),
          getMyBillings(),
        ]);
        if (active) {
          setProfile(p.patient);
          setAppointments(a.appointments || []);
          setBillings(b.billings || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load patient health records.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPatient();
    return () => { active = false; };
  }, [refreshKey]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await cancelMyAppointment(id);
      onTriggerRefresh();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your personal health records..." />;
  if (error) return <ErrorMessage message={error} />;

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Patient Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 via-blue-700 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Personal health portal</span>
            <span className="opacity-60">•</span>
            <span>Patient self-service</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, {profile?.name || user?.name}
          </h1>
          <p className="mt-2 text-sm text-cyan-100/90 leading-relaxed">
            Manage your medical consultations, schedule visits with hospital specialists, and view or print verified clinical invoices.
          </p>
        </div>
      </div>

      {/* Patient Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Upcoming consultations"
          value={upcoming}
          gradient="from-cyan-600 to-blue-600"
          badge="Scheduled visits"
          badgeColor="bg-cyan-50 text-cyan-700"
          icon={<span className="text-2xl">📅</span>}
        />
        <MetricCard
          label="Completed consultations"
          value={completed}
          gradient="from-emerald-500 to-teal-600"
          badge="Past records"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">✓</span>}
        />
        <MetricCard
          label="Medical receipts"
          value={billings.length}
          gradient="from-amber-500 to-orange-600"
          badge="Invoices generated"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-2xl">🧾</span>}
        />
      </div>

      {/* Health Profile Card */}
      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-800">My health identification</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            Blood group: {profile?.bloodGroup || "O+"}
          </span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-4 text-sm">
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3">
            <dt className="text-xs text-blue-700 font-semibold">ABHA number (Ayushman)</dt>
            <dd className="font-bold text-blue-900 mt-1 font-mono text-xs">{profile?.abhaId || "14-8891-2345-6789"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Registered email</dt>
            <dd className="font-semibold text-slate-800 mt-1 truncate">{profile?.email || user?.email}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Contact number</dt>
            <dd className="font-semibold text-slate-800 mt-1">+91 {profile?.contactNumber || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Age / gender</dt>
            <dd className="font-semibold text-slate-800 mt-1">{profile?.age || "—"} yrs / {profile?.gender || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Scheduled Appointments List */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">My scheduled consultations</h2>
          <Link
            to="/patient/appointments/book"
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            + Book new appointment
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">You have no upcoming consultations scheduled.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 font-bold text-xs ring-1 ring-cyan-500/20">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Dr. {a.doctor?.name}</p>
                    <p className="text-xs text-slate-500">Consultation with {a.doctor?.specialization} • {formatDate(a.appointmentDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">{a.timeSlot}</span>
                  <span className="rounded-full bg-cyan-50 text-cyan-700 px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-cyan-500/20">{a.status}</span>
                  {["pending", "confirmed"].includes(a.status) && (
                    <button
                      disabled={cancellingId === a._id}
                      onClick={() => handleCancel(a._id)}
                      className="rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                    >
                      {cancellingId === a._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   5. NURSE & INPATIENT CLINICAL STATION DASHBOARD
   ========================================================================= */
function NurseDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [selectedPatientIdForModal, setSelectedPatientIdForModal] = useState(null);

  // Quick Medication Administration Modal State
  const [medModal, setMedModal] = useState({
    isOpen: false,
    med: null,
    status: "given",
    reason: "",
    notes: "",
    submitting: false,
  });

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        const metricsRes = await getNurseDashboardMetrics();
        if (active) {
          setData(metricsRes);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load clinical nursing station data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { active = false; };
  }, [refreshKey]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleOpenMedModal = (med, status) => {
    setMedModal({
      isOpen: true,
      med,
      status,
      reason: "",
      notes: "",
      submitting: false,
    });
  };

  const handleConfirmMedAdministration = async (e) => {
    e.preventDefault();
    const { med, status, reason, notes } = medModal;
    if (!med) return;

    if ((status === "held" || status === "refused") && !reason.trim()) {
      alert("A clinical justification is required when withholding or recording patient refusal.");
      return;
    }

    setMedModal((prev) => ({ ...prev, submitting: true }));
    try {
      await administerMedication(med.prescriptionId, {
        medicationIndex: med.medicationIndex,
        status,
        notes: reason ? `${reason}${notes ? ` | ${notes}` : ""}` : notes,
      });

      setMedModal({ isOpen: false, med: null, status: "given", reason: "", notes: "", submitting: false });
      showToast(`Medication ${med.medication} marked as ${status.toUpperCase()} for ${med.patientName}.`);
      onTriggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update medication administration record.");
      setMedModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleQuickCompleteTask = async (taskId, taskTitle) => {
    try {
      await updateNursingTaskStatus(taskId, { status: "Completed" });
      showToast(`Task "${taskTitle}" marked as Completed.`);
      onTriggerRefresh();
    } catch (err) {
      alert("Failed to complete task: " + (err.response?.data?.message || err.message));
    }
  };

  const handleQuickAcknowledgeOrder = async (orderId) => {
    try {
      await updateDoctorOrderStatus(orderId, { status: "Acknowledged" });
      showToast("Doctor order acknowledged and noted in station queue.");
      onTriggerRefresh();
    } catch (err) {
      alert("Failed to acknowledge doctor order: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Opening Clinical Nursing Station & telemetry data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const metrics = data?.metrics || {
    myPatients: 0,
    criticalPatients: 0,
    medicationsDue: 0,
    pendingTasks: 0,
    doctorOrders: 0,
    dischargePending: 0,
  };

  const criticalPatients = data?.criticalPatients || [];
  const medicationsDue = data?.medicationsDue || [];
  const pendingTasks = data?.pendingTasks || [];
  const recentDoctorOrders = data?.recentDoctorOrders || [];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <span>✅</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-slate-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {/* Station Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Clinical Nursing Station</span>
              <span className="opacity-40">•</span>
              <span>24/7 Ward Telemetry Active</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Inpatient Floor Care & Clinical Station
            </h1>
            <p className="mt-1 text-sm text-slate-300 leading-relaxed">
              Nurse Station Duty: <strong className="text-white">{user?.name}</strong>. Real-time telemetry, acute severity alerts, eMAR medication rounds, and doctor directives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/nurse/vitals"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>📊</span> Record Vitals
            </Link>
            <Link
              to="/nurse/handover"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>🔄</span> Shift Handover
            </Link>
            <Link
              to="/nurse/admission-discharge"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>📋</span> Admit / Discharge
            </Link>
            <button
              onClick={onTriggerRefresh}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-colors"
              title="Refresh telemetry"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="My Patients"
          value={metrics.myPatients}
          gradient="from-blue-600 to-indigo-600"
          badge="Admitted Inpatients"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-xl">🛏️</span>}
          to="/nurse/patients"
        />
        <MetricCard
          label="Critical Patients"
          value={metrics.criticalPatients}
          gradient={metrics.criticalPatients > 0 ? "from-rose-600 to-red-600" : "from-emerald-600 to-teal-600"}
          badge={metrics.criticalPatients > 0 ? "Immediate Attention" : "All Stable"}
          badgeColor={metrics.criticalPatients > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}
          icon={<span className="text-xl">🚨</span>}
          to="/nurse/monitoring?risk=Critical"
        />
        <MetricCard
          label="Medications Due"
          value={metrics.medicationsDue}
          gradient="from-amber-500 to-orange-600"
          badge="eMAR Scheduled"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-xl">💊</span>}
          to="/nurse/medications"
        />
        <MetricCard
          label="Pending Tasks"
          value={metrics.pendingTasks}
          gradient="from-violet-600 to-purple-600"
          badge="Care Routines"
          badgeColor="bg-violet-50 text-violet-700"
          icon={<span className="text-xl">📋</span>}
          to="/nurse/tasks?status=Active"
        />
        <MetricCard
          label="Doctor Orders"
          value={metrics.doctorOrders}
          gradient="from-cyan-600 to-blue-600"
          badge="Physician Directives"
          badgeColor="bg-cyan-50 text-cyan-700"
          icon={<span className="text-xl">🩺</span>}
          to="/nurse/doctor-orders"
        />
        <MetricCard
          label="Discharge Pending"
          value={metrics.dischargePending}
          gradient="from-teal-600 to-emerald-600"
          badge="Ready for Clearance"
          badgeColor="bg-teal-50 text-teal-700"
          icon={<span className="text-xl">📤</span>}
          to="/nurse/admission-discharge?tab=discharge"
        />
      </div>

      {/* SECTION 1: CRITICAL PATIENT MONITORING */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Critical & High-Risk Inpatient Telemetry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients exhibiting acute physiological deterioration, desaturation, hypertension, or high-dependency ward assignment.
            </p>
          </div>
          <Link
            to="/nurse/monitoring"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors self-start sm:self-auto"
          >
            Full Telemetry Monitor →
          </Link>
        </div>

        {criticalPatients.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-800">
            <span className="text-2xl block mb-1">💚</span>
            <strong>All admitted inpatients are clinically stable.</strong>
            <p className="text-emerald-600 mt-0.5">No critical or high-risk vital deteriorations detected at this station.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Patient & Location</th>
                  <th className="py-3 px-3">Risk Severity</th>
                  <th className="py-3 px-3">Admitting Reason</th>
                  <th className="py-3 px-3">Latest Recorded Vitals</th>
                  <th className="py-3 px-3">Attending Physician</th>
                  <th className="py-3 px-3 text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalPatients.map((p) => {
                  const v = p.latestVital;
                  return (
                    <tr key={p.patientId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedPatientIdForModal(p.patientId)}
                          className="font-bold text-indigo-700 hover:underline text-left text-sm block"
                        >
                          {p.name}
                        </button>
                        <div className="text-[11px] text-slate-500">
                          {p.gender}, {p.age} yrs • <span className="font-semibold text-slate-700">Bed {p.roomBed}</span> ({p.ward})
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.severity === "Critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current animate-ping"></span>
                          {p.severity} Risk
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{p.riskReason}</div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800 max-w-xs">
                        <div className="truncate">{p.diagnosis}</div>
                      </td>

                      <td className="py-3 px-3">
                        {v ? (
                          <div className="flex flex-wrap gap-1.5">
                            {v.bloodPressureSys && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                v.bloodPressureSys >= 150 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                BP: {v.bloodPressureSys}/{v.bloodPressureDia || "—"}
                              </span>
                            )}
                            {v.spo2 && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                v.spo2 <= 92 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                SpO2: {v.spo2}%
                              </span>
                            )}
                            {v.heartRate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                                HR: {v.heartRate} bpm
                              </span>
                            )}
                            {v.painScore !== undefined && v.painScore > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
                                Pain: {v.painScore}/10
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No vitals logged today</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {p.attendingDoctor}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientIdForModal(p.patientId)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition"
                        >
                          View Patient
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 2: MEDICATIONS DUE (eMAR) & SECTION 3: PENDING TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MEDICATIONS DUE QUEUE */}
        <section className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>💊</span> Medications Due Today (eMAR)
              </h2>
              <p className="text-xs text-slate-500">Scheduled doses requiring bedside administration verification</p>
            </div>
            <Link to="/nurse/medications" className="text-xs font-bold text-indigo-600 hover:underline">
              View All →
            </Link>
          </div>

          {medicationsDue.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No pending medication doses due for administration at this hour.
            </div>
          ) : (
            <div className="space-y-3">
              {medicationsDue.slice(0, 6).map((med, idx) => {
                const isDue = med.status === "Due";
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPatientIdForModal(med.patientId)}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600"
                        >
                          {med.patientName}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {med.scheduledTime}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-indigo-700 mt-1">
                        {med.medication} • <span className="font-normal text-slate-600">{med.dosage} ({med.route})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {med.frequency} • Prescribed by {med.prescribingDoctor}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isDue ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenMedModal(med, "given")}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                          >
                            ✓ Administer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMedModal(med, "held")}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
                          >
                            Hold
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMedModal(med, "refused")}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg transition"
                          >
                            Refuse
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                          {med.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PENDING NURSING TASKS */}
        <section className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span> Pending Nursing Tasks
              </h2>
              <p className="text-xs text-slate-500">Scheduled clinical duties, line maintenance, and rounds</p>
            </div>
            <Link to="/nurse/tasks" className="text-xs font-bold text-indigo-600 hover:underline">
              Task Board →
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No pending nursing tasks scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.slice(0, 6).map((task) => (
                <div
                  key={task._id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    task.isOverdue
                      ? "border-rose-300 bg-rose-50/40"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                      <span
                        className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                          task.priority === "Stat"
                            ? "bg-rose-600 text-white"
                            : task.priority === "Urgent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.isOverdue && (
                        <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Patient: <strong className="text-slate-700">{task.patient?.name || "Assigned"}</strong> • Due:{" "}
                      {new Date(task.dueTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickCompleteTask(task._id, task.title)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition"
                  >
                    ✓ Complete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* SECTION 4: RECENT DOCTOR ORDERS */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🩺</span> Recent Doctor Orders & Clinical Directives
            </h2>
            <p className="text-xs text-slate-500">Directives from physicians requiring station review and nursing acknowledgment</p>
          </div>
          <Link to="/nurse/doctor-orders" className="text-xs font-bold text-indigo-600 hover:underline">
            All Doctor Orders →
          </Link>
        </div>

        {recentDoctorOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recent doctor directives entered into the station.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Order Instruction</th>
                  <th className="py-2.5 px-3">Prescribing Physician</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDoctorOrders.slice(0, 5).map((ord) => {
                  const isNew = ord.status === "New";
                  return (
                    <tr key={ord._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {ord.orderType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {ord.patient?.name || "Patient"}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 max-w-sm">
                        <div className="truncate">{ord.description}</div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {ord.orderedByName || "Physician"} ({ord.doctorDepartment || "Clinical"})
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          ord.priority === "Stat" ? "bg-rose-100 text-rose-800 font-extrabold" : "bg-slate-100 text-slate-700"
                        }`}>
                          {ord.priority}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "Acknowledged"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {ord.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {isNew ? (
                          <button
                            type="button"
                            onClick={() => handleQuickAcknowledgeOrder(ord._id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">✓ Accepted</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QUICK MEDICATION ADMINISTRATION MODAL */}
      {medModal.isOpen && medModal.med && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  eMAR: Record Administration
                </h3>
                <p className="text-xs text-slate-500">
                  {medModal.med.medication} ({medModal.med.dosage}) for {medModal.med.patientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMedModal({ isOpen: false, med: null, status: "given", reason: "", notes: "", submitting: false })}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmMedAdministration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Action Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMedModal((prev) => ({ ...prev, status: "given" }))}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      medModal.status === "given"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Given / Administered
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedModal((prev) => ({ ...prev, status: "held" }))}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      medModal.status === "held"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Held (Withheld)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedModal((prev) => ({ ...prev, status: "refused" }))}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      medModal.status === "refused"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Patient Refused
                  </button>
                </div>
              </div>

              {(medModal.status === "held" || medModal.status === "refused") && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-rose-600 mb-1">
                    Mandatory Clinical Reason / Rationale *
                  </label>
                  <input
                    type="text"
                    required
                    value={medModal.reason}
                    onChange={(e) => setMedModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Hypotension < 90/60, patient nauseous, patient refused morning dose..."
                    className="w-full bg-rose-50/50 border border-rose-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Bedside Observations & Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={medModal.notes}
                  onChange={(e) => setMedModal((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Given with water, vitals monitored post dose..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMedModal({ isOpen: false, med: null, status: "given", reason: "", notes: "", submitting: false })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={medModal.submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {medModal.submitting ? "Confirming..." : "Confirm Administration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9-TAB CLINICAL PATIENT PROFILE MODAL */}
      {selectedPatientIdForModal && (
        <PatientClinicalProfileModal
          patientId={selectedPatientIdForModal}
          onClose={() => setSelectedPatientIdForModal(null)}
          onRefresh={onTriggerRefresh}
        />
      )}
    </div>
  );
}

/* =========================================================================
   MAIN DASHBOARD ROUTER: Renders based on role
   ========================================================================= */
function Dashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTriggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const role = user?.role || "admin";

  if (role === "doctor") {
    return <DoctorDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "nurse") {
    return <NurseDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "receptionist") {
    return <ReceptionistDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "patient") {
    return <PatientPortalDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  // Default to Admin Executive Portal
  return <AdminDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
}

function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{label}</p>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
      <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default Dashboard;

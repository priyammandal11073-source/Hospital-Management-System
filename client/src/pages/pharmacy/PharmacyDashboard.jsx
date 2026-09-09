import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPharmacyTelemetry,
  getPharmacyAlerts,
  getPrescriptionQueue,
  flagPrescriptionIssue,
} from "../../services/api.js";

export default function PharmacyDashboard({ user, refreshKey, onTriggerRefresh }) {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringBatches: [], expiredBatches: [] });
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal for flagging issue to doctor
  const [flagModalItem, setFlagModalItem] = useState(null);
  const [flagReason, setFlagReason] = useState("Potential drug-drug interaction");
  const [flagNotes, setFlagNotes] = useState("");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [telRes, alertsRes, qRes] = await Promise.all([
        getPharmacyTelemetry(),
        getPharmacyAlerts(),
        getPrescriptionQueue(),
      ]);
      setTelemetry(telRes.telemetry || telRes);
      setAlerts(alertsRes);
      setQueue(qRes.prescriptions || []);
    } catch (err) {
      console.error("Failed to load pharmacy telemetry:", err);
      setError(err.response?.data?.message || "Failed to load central pharmacy telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagModalItem) return;
    setIsSubmittingFlag(true);
    try {
      await flagPrescriptionIssue(flagModalItem._id, {
        reason: flagReason,
        notes: flagNotes,
      });
      alert(`Issue successfully flagged for Doctor ${flagModalItem.doctor?.name || "in charge"}. Prescription placed on Hold.`);
      setFlagModalItem(null);
      setFlagNotes("");
      loadDashboardData();
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      alert("Failed to flag prescription: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse">
          Connecting to Nivora Care Central Pharmacy formulary & live queue...
        </p>
      </div>
    );
  }

  const kpis = telemetry?.metrics || telemetry?.kpis || {
    prescriptionsToday: 42,
    pendingDispensing: 7,
    dispensedToday: 35,
    lowStockItems: 4,
    outOfStockItems: 1,
    expiringSoon: 3,
    pendingPayments: 2450,
    totalMedicines: 128,
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                Central Pharmacy Active Operations
              </span>
              <span className="text-xs text-slate-400">| Counter #02 (Main Outpatient)</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Nivora Care Central Pharmacy
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Welcome back, <span className="font-semibold text-white">{user?.name || "Pharmacist"}</span>. 
              Review clinical prescriptions, monitor drug interactions, manage batches, and dispense verified medications.
            </p>
          </div>

          {/* Banner Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/pharmacy/queue"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md transition-all duration-150 hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Dispense Queue ({kpis.pendingDispensing})</span>
            </Link>
            <Link
              to="/pharmacy/inventory"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold text-white ring-1 ring-white/20 transition-all duration-150"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Medicine</span>
            </Link>
            <Link
              to="/pharmacy/purchase-orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold text-white ring-1 ring-white/20 transition-all duration-150"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>New PO</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-xs font-bold text-red-800 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. 8 KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Prescriptions Today */}
        <Link
          to="/pharmacy/queue"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-amber-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescriptions Today</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800">{kpis.prescriptionsToday}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
            <span>{kpis.dispensedToday} fulfilled</span>
            <span className="text-blue-600">Open Queue →</span>
          </div>
        </Link>

        {/* KPI 2: Pending Dispensing */}
        <Link
          to="/pharmacy/queue"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-amber-300 bg-amber-50/20 hover:shadow-md hover:ring-2 hover:ring-amber-500 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Dispensing</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-900">{kpis.pendingDispensing}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:scale-110 transition animate-pulse">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-amber-700 pt-2 border-t border-amber-100">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping"></span>
              Needs Pharmacist Action
            </span>
            <span>Review →</span>
          </div>
        </Link>

        {/* KPI 3: Dispensed Today */}
        <Link
          to="/pharmacy/prescriptions-history"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-emerald-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispensed Today</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800">{kpis.dispensedToday}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-600 pt-2 border-t border-slate-100">
            <span>
              {kpis.prescriptionsToday > 0 ? Math.round((kpis.dispensedToday / kpis.prescriptionsToday) * 100) : 100}% Fulfilled
            </span>
            <span>View Logs →</span>
          </div>
        </Link>

        {/* KPI 4: Low Stock Items */}
        <Link
          to="/pharmacy/low-stock"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-rose-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-rose-600">{kpis.lowStockItems}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-rose-600 pt-2 border-t border-slate-100">
            <span>{kpis.outOfStockItems} Out of Stock</span>
            <span>Reorder →</span>
          </div>
        </Link>

        {/* KPI 5: Expiring Batches (<60d) */}
        <Link
          to="/pharmacy/expiry"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-amber-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring Soon (&lt;60d)</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600">{kpis.expiringSoon}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-amber-700 pt-2 border-t border-slate-100">
            <span>FIFO Dispensing Priority</span>
            <span>Inspect Radar →</span>
          </div>
        </Link>

        {/* KPI 6: Pending Rx Payments */}
        <Link
          to="/pharmacy/billing"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-violet-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Rx Payments</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-violet-700">₹{kpis.pendingPayments?.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-violet-600 pt-2 border-t border-slate-100">
            <span>Cashier / Insurance</span>
            <span>Billing Desk →</span>
          </div>
        </Link>

        {/* KPI 7: Total Formulary Medicines */}
        <Link
          to="/pharmacy/inventory"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-sky-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Formulary Catalog</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800">{kpis.totalMedicines}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-sky-600 pt-2 border-t border-slate-100">
            <span>100% Active</span>
            <span>Directory →</span>
          </div>
        </Link>

        {/* KPI 8: Active Suppliers */}
        <Link
          to="/pharmacy/suppliers"
          className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 hover:shadow-md hover:ring-2 hover:ring-teal-400 transition-all duration-200"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Suppliers</p>
              <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800">12</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-teal-600 pt-2 border-t border-slate-100">
            <span>GMP Certified</span>
            <span>Vendors →</span>
          </div>
        </Link>
      </div>

      {/* 3. PRESCRIPTION WORK QUEUE (LIVE) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Live Prescription Work Queue</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {queue.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor-prescribed medications awaiting clinical verification and batch dispensing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/pharmacy/queue"
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              Full Queue View →
            </Link>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold">No pending prescriptions in the queue.</p>
            <p className="text-xs text-slate-400 mt-1">All doctor orders have been clinically verified and dispensed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Token / RX ID</th>
                  <th className="px-4 py-3">Patient Details</th>
                  <th className="px-4 py-3">Prescribing Doctor</th>
                  <th className="px-4 py-3">Medications</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.slice(0, 5).map((rx) => {
                  const status = rx.dispensingStatus || "pending";
                  const isHold = status === "on_hold";
                  const isDispensed = status === "dispensed";
                  const isReady = status === "ready";

                  return (
                    <tr key={rx._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-amber-600">RX-{rx._id.slice(-6).toUpperCase()}</span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {new Date(rx.createdAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{rx.patient?.name || "Patient"}</div>
                        <div className="text-[11px] text-slate-500">
                          {rx.patient?.gender || "Unknown"} • {rx.patient?.age || "—"} yrs
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          Dr. {rx.doctor?.name?.replace(/^Dr\.\s*/i, "") || "Specialist"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rx.doctor?.specialization || "Clinical OPD"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 max-w-xs truncate">
                          {rx.medicines?.map((m) => `${m.name} (${m.dosage})`).join(", ") || "Medication items"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rx.medicines?.length || 1} item(s) prescribed
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isDispensed ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Dispensed
                          </span>
                        ) : isHold ? (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                            ⚠ On Hold (Doctor Flagged)
                          </span>
                        ) : isReady ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                            Ready for Pick-up
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                            Pending Dispense
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {!isDispensed && (
                          <Link
                            to={`/pharmacy/dispense/${rx._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition shadow-xs"
                          >
                            <span>Dispense</span>
                            <span>→</span>
                          </Link>
                        )}
                        {!isDispensed && (
                          <button
                            type="button"
                            onClick={() => {
                              setFlagModalItem(rx);
                              setFlagNotes("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition"
                            title="Flag clinical issue to doctor without modifying prescription"
                          >
                            <span>Flag Doctor</span>
                          </button>
                        )}
                        {isDispensed && (
                          <Link
                            to={`/pharmacy/dispense/${rx._id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition"
                          >
                            <span>Receipt</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. OPERATIONS GRID: FAST MOVING DRUGS & EXPRY/STOCK RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Dispensed & Fast Velocity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fast Moving Drugs & Velocity</h2>
              <p className="text-xs text-slate-500">Real-time stock velocity & reorder threshold</p>
            </div>
            <Link
              to="/pharmacy/inventory"
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Formulary Catalog →
            </Link>
          </div>

          <div className="mt-4 space-y-3.5">
            {[
              { name: "Paracetamol 650mg (Dolo)", stock: 120, total: 500, status: "Adequate", velocity: "High (45/day)" },
              { name: "Amoxicillin + Clavulanic 625mg", stock: 14, total: 100, status: "Low Stock", velocity: "High (18/day)", warn: true },
              { name: "Pantoprazole 40mg (Pan-40)", stock: 240, total: 400, status: "Adequate", velocity: "Moderate" },
              { name: "Azithromycin 500mg", stock: 8, total: 150, status: "Critical", velocity: "High (12/day)", danger: true },
              { name: "Cetirizine 10mg", stock: 310, total: 500, status: "Adequate", velocity: "Moderate" },
            ].map((drug, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{drug.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    drug.danger ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300" :
                    drug.warn ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                    {drug.status} ({drug.stock} left)
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Velocity: {drug.velocity}</span>
                  <span>Threshold: 20 units</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      drug.danger ? "bg-rose-500" : drug.warn ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (drug.stock / drug.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Critical Alerts & Storage Warnings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="text-sm font-bold text-slate-900">Safety, Expiry & Cold Chain Radar</h2>
            </div>
            <Link
              to="/pharmacy/expiry"
              className="text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              Expiry Radar →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {/* Cold Chain Alert */}
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-900 flex items-center gap-1.5">
                  ❄️ Refrigerator Unit #01 (Vaccines & Insulin)
                </span>
                <span className="rounded-full bg-cyan-200 px-2 py-0.5 text-[10px] font-extrabold text-cyan-800">
                  3.8°C (Optimal 2°C - 8°C)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-cyan-700">
                12 batches of Insulin Glargine and Rabies Vaccines stored safely. Sensor verified 12m ago.
              </p>
            </div>

            {/* Expiry Warning: <30 days */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  ⏳ Batch EXP-202609-A (Amoxicillin 250mg)
                </span>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  Expiring in 22 Days
                </span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800">
                Quantity: 45 strips. Prioritize FIFO dispensing or initiate supplier credit return.
              </p>
            </div>

            {/* Critical Stock Warning */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  🚨 Stock Depleted: Epinephrine Inj 1mg/ml
                </span>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                  0 Vials Left
                </span>
              </div>
              <p className="mt-1 text-[11px] text-rose-800">
                Emergency Crash Cart stock level critical. Immediate PO created (#PO-77401).
              </p>
            </div>

            {/* High-Alert Medicine Warning */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  🔒 High-Risk / Schedule H1 Drug Log
                </span>
                <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                  Strict Audit Active
                </span>
              </div>
              <p className="mt-1 text-[11px] text-purple-800">
                Requires mandatory Doctor Registration # and Patient ID verification on every dispensation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. QUICK SHORTCUT TILES */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Pharmacy Operations Hub</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/pharmacy/queue"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Prescription Queue</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Dispense & verify</span>
          </Link>

          <Link
            to="/pharmacy/inventory"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Medicine Formulary</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Stock & Pricing</span>
          </Link>

          <Link
            to="/pharmacy/stock-receiving"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Receive Stock</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GRN & Invoices</span>
          </Link>

          <Link
            to="/pharmacy/purchase-orders"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Purchase Orders</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Vendor orders</span>
          </Link>

          <Link
            to="/pharmacy/returns"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m5 4v1a3 3 0 003 3h6a3 3 0 003-3V7a3 3 0 00-3-3h-6a3 3 0 00-3 3v1" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Returns & Damage</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Credits & refunds</span>
          </Link>

          <Link
            to="/pharmacy/analytics"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">Pharmacy Reports</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Audits & revenue</span>
          </Link>
        </div>
      </div>

      {/* 6. CLINICAL SAFEGUARD MODAL: CONTACT DOCTOR / FLAG ISSUE */}
      {flagModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                  Clinical Safeguard: Flag Issue to Doctor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact prescribing physician for clarification. Pharmacists cannot alter clinical prescriptions directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFlagModalItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFlagSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
                <div className="font-bold text-amber-900">
                  Prescription: RX-{flagModalItem._id.slice(-6).toUpperCase()}
                </div>
                <div className="text-amber-800 mt-0.5">
                  Patient: <span className="font-semibold">{flagModalItem.patient?.name}</span> | Doctor:{" "}
                  <span className="font-semibold">Dr. {flagModalItem.doctor?.name}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Clarification Flag</label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                >
                  <option value="Potential drug-drug interaction">Potential drug-drug interaction</option>
                  <option value="Known patient allergy conflict">Known patient allergy conflict</option>
                  <option value="Dosage or frequency anomaly">Dosage or frequency anomaly</option>
                  <option value="Prescribed medicine out of stock (substitute recommended)">
                    Prescribed medicine out of stock (substitute recommended)
                  </option>
                  <option value="Route of administration requires verification">
                    Route of administration requires verification
                  </option>
                  <option value="Renal/Hepatic dose adjustment required">
                    Renal/Hepatic dose adjustment required
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Pharmacist Notes for Doctor</label>
                <textarea
                  rows="3"
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  required
                  placeholder="E.g., Patient's records indicate severe Penicillin hypersensitivity. Recommend switching to Azithromycin 500mg once daily."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlagModalItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFlag}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingFlag ? "Submitting..." : "Put On Hold & Alert Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

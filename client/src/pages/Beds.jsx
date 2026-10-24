import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AllocateBedModal from "../components/AllocateBedModal.jsx";
import TransferBedModal from "../components/TransferBedModal.jsx";
import DischargeBedModal from "../components/DischargeBedModal.jsx";
import CreateBedModal from "../components/CreateBedModal.jsx";
import { getBeds, getBedSummary, updateBedStatus, deleteBed } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctorDisplayName } from "../utils/doctorName.js";
import { PageHeader, ConfirmDialog, ActionDropdown } from "../components/ui/index.js";
import { usePrintModal } from "../context/PrintModalContext.jsx";
import { generateWardBedMapHtml } from "../utils/printTemplates.js";
import { exportToCsv } from "../utils/csvExport.js";

const WARDS = [
  "All wards",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "General Ward",
  "Pediatric Ward",
  "Private Deluxe Room",
];

const WARD_ORDER = [
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

const STATUS_FILTERS = [
  { id: "", label: "All statuses" },
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "cleaning", label: "Cleaning" },
  { id: "maintenance", label: "Maintenance" },
];

const STATUS_META = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    pill: "liquid-glass-pill text-emerald-800 border-emerald-200/70",
    text: "text-emerald-700",
  },
  occupied: {
    label: "Occupied",
    dot: "bg-amber-500",
    pill: "liquid-glass-pill text-amber-800 border-amber-200/70",
    text: "text-amber-700",
  },
  cleaning: {
    label: "Cleaning",
    dot: "bg-yellow-500",
    pill: "liquid-glass-pill text-yellow-800 border-yellow-200/70",
    text: "text-yellow-700",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-slate-400",
    pill: "liquid-glass-pill text-slate-700 border-slate-200/70",
    text: "text-slate-600",
  },
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Beds() {
  const { user } = useAuth();
  const { openPrintPreview } = usePrintModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageBeds = ["receptionist", "nurse", "admin", "super_admin", "doctor", "emergency"].includes(user?.role);

  const [viewMode, setViewMode] = useState(() => (searchParams.get("view") === "map" ? "map" : "matrix"));
  const [beds, setBeds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedWard, setSelectedWard] = useState("All wards");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const handleModeChange = (mode) => {
    setViewMode(mode);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "map") next.set("view", "map");
        else next.delete("view");
        return next;
      },
      { replace: true }
    );
  };


  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [allocatingBed, setAllocatingBed] = useState(null);
  const [transferringBed, setTransferringBed] = useState(null);
  const [dischargingBed, setDischargingBed] = useState(null);
  const [updatingBedId, setUpdatingBedId] = useState(null);
  const [bedToDelete, setBedToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected bed for quick inspection in Map View
  const [inspectingBed, setInspectingBed] = useState(null);

  const fetchBedsData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters = {};
      if (selectedWard !== "All wards") filters.ward = selectedWard;
      if (selectedStatus) filters.status = selectedStatus;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const [bedsRes, summaryRes] = await Promise.all([
        getBeds(filters),
        getBedSummary(),
      ]);

      setBeds(bedsRes.beds || []);
      setSummary(summaryRes.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load beds data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchBedsData();
  }, [fetchBedsData]);

  const handleStatusChange = async (bedId, newStatus) => {
    setUpdatingBedId(bedId);
    try {
      await updateBedStatus(bedId, newStatus);
      fetchBedsData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update bed status");
    } finally {
      setUpdatingBedId(null);
    }
  };

  const handleDeleteBed = (bed) => {
    setBedToDelete(bed);
  };

  const confirmDeleteBed = async () => {
    if (!bedToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBed(bedToDelete._id);
      setBedToDelete(null);
      fetchBedsData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete bed");
    } finally {
      setIsDeleting(false);
    }
  };

  const wardCounts = useMemo(() => {
    if (!summary?.wards) return {};
    const map = {};
    summary.wards.forEach((w) => {
      map[w.ward] = `${w.occupied}/${w.total}`;
    });
    return map;
  }, [summary]);

  // Group beds by ward for the floor plan map view
  const wardGroups = useMemo(() => {
    const map = new Map();
    for (const ward of WARD_ORDER) map.set(ward, []);
    for (const b of beds) {
      const key = WARD_ORDER.includes(b.ward) ? b.ward : "General Ward";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    return Array.from(map.entries())
      .map(([ward, items]) => {
        const total = items.length;
        const occupied = items.filter((b) => b.status === "occupied").length;
        const available = items.filter((b) => b.status === "available").length;
        const cleaning = items.filter((b) => b.status === "cleaning").length;
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        return { ward, items, total, occupied, available, cleaning, rate };
      })
      .filter((w) => (selectedWard !== "All wards" ? w.ward === selectedWard : w.total > 0));
  }, [beds, selectedWard]);

  // Official Inpatient Ward & Bed Occupancy Report
  const handlePrintCensus = () => {
    const wardsData = WARD_ORDER.map((wardName) => ({
      name: wardName,
      beds: beds
        .filter((b) => b.ward === wardName)
        .map((b) => ({
          bedNumber: b.bedNumber,
          bedType: b.ward,
          status: (b.status || "available").toUpperCase(),
          patient: b.currentAdmission?.patient,
          doctor: b.currentAdmission?.attendingDoctor,
        })),
    })).filter((w) => w.beds.length > 0);

    const html = generateWardBedMapHtml({
      wards: wardsData,
      stats: {
        total: summary?.total || beds.length,
        occupied: summary?.occupied || beds.filter((b) => b.status === "occupied").length,
        available: summary?.available || beds.filter((b) => b.status === "available").length,
      },
      selectedWard,
    });

    openPrintPreview({
      title: "Inpatient Bed Census & Ward Distribution Map",
      htmlContent: html,
      refNumber: `WARD-CENSUS-${Date.now().toString().slice(-6)}`,
    });
  };

  // Export full bed registry to CSV
  const handleExportCsv = () => {
    exportToCsv({
      filename: `inpatient-bed-census-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: [
        "Bed Number",
        "Ward",
        "Floor",
        "Status",
        "Daily Rate (₹)",
        "Patient Name",
        "Age",
        "Gender",
        "ABHA ID",
        "Attending Doctor",
        "Admission Date",
        "Reason for Stay",
        "Equipment & Features",
      ],
      rows: beds.map((b) => [
        b.bedNumber || "",
        b.ward || "",
        b.floor || "",
        (b.status || "").toUpperCase(),
        Number(b.dailyRate || 0).toFixed(2),
        b.currentAdmission?.patient?.name || "",
        b.currentAdmission?.patient?.age || "",
        b.currentAdmission?.patient?.gender || "",
        b.currentAdmission?.patient?.abhaId || "",
        b.currentAdmission?.attendingDoctor
          ? getDoctorDisplayName(b.currentAdmission.attendingDoctor, "Dr.")
          : "",
        b.currentAdmission?.admittedAt
          ? new Date(b.currentAdmission.admittedAt).toLocaleDateString("en-IN")
          : "",
        b.currentAdmission?.admissionReason || "",
        [
          b.features?.hasOxygen ? "Oxygen (O₂)" : "",
          b.features?.hasVentilator ? "Ventilator" : "",
          b.features?.hasMonitor ? "Telemetry Monitor" : "",
          b.features?.isIsolation ? "Isolation Unit" : "",
        ]
          .filter(Boolean)
          .join("; "),
      ]),
    });
  };

  if (!canManageBeds) {
    return (
      <div className="p-8 text-center liquid-glass-card max-w-xl mx-auto mt-12 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">
          Ward and bed allocation management is restricted to authorized healthcare staff (Receptionists, Nurses, Doctors, and Administrators).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Ward & bed allocation manager"
        subtitle="Real-time visual inpatient bed occupancy, ward transfers, and clinical admissions"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/60 border border-slate-300/60 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => handleModeChange("matrix")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-[0.97] cursor-pointer ${
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Detailed bed cards matrix"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Bed Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-[0.97] cursor-pointer ${
                  viewMode === "map"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Spatial ward floor plan map"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Ward Map</span>
              </button>
            </div>

            {/* Print Census Button */}
            <button
              type="button"
              onClick={handlePrintCensus}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs transition active:scale-[0.97] cursor-pointer"
              title="Print certified inpatient ward census"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print Census</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs transition active:scale-[0.97] cursor-pointer"
              title="Download CSV census"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Add Bed Primary CTA */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-[0.97] cursor-pointer"
            >
              <span>+ Add new bed</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchBedsData}
              className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Refresh live occupancy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Occupancy Analytics Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total hospital beds</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{summary.total}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-medium">Across 6 hospital wards</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Occupied beds</p>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/60 tabular-nums">
                  {summary.occupancyRate}%
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1 tabular-nums">{summary.occupied}</p>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${summary.occupancyRate}%` }}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available beds</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">{summary.available}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Ready for admission
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">In cleaning</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-yellow-700 mt-1 tabular-nums">{summary.cleaning}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
              <span className="text-[11px] text-yellow-700 font-medium">Housekeeping active</span>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl liquid-glass-card flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Maintenance</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1 tabular-nums">{summary.maintenance}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
              <span className="text-[11px] text-slate-500 font-medium">Bio-med servicing</span>
            </div>
          </div>
        </div>
      )}

      {/* Ward Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60">
        {WARDS.map((ward) => {
          const isSelected = selectedWard === ward;
          const countInfo = wardCounts[ward];
          return (
            <button
              key={ward}
              type="button"
              onClick={() => setSelectedWard(ward)}
              className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all active:scale-[0.97] flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "liquid-glass-pill text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{ward}</span>
              {countInfo && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {countInfo}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all active:scale-[0.97] whitespace-nowrap cursor-pointer ${
                selectedStatus === f.id
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "liquid-glass-pill text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search bed, patient, ABHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-300/80 bg-white/80 pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-hidden transition"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-semibold">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-r-transparent mr-2" />
          Updating live ward beds...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs font-semibold text-rose-700 bg-rose-50/70 rounded-2xl border border-rose-200">
          {error}
        </div>
      ) : beds.length === 0 ? (
        <div className="p-12 text-center liquid-glass-card rounded-2xl">
          <p className="text-sm font-bold text-slate-900">No beds found matching filter</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your ward or status filter to see other inpatient units.
          </p>
        </div>
      ) : viewMode === "matrix" ? (
        /* ================= 1. BED MATRIX VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {beds.map((bed) => {
            const isOccupied = bed.status === "occupied";
            const isAvailable = bed.status === "available";
            const isCleaning = bed.status === "cleaning";
            const statusConfig = STATUS_META[bed.status] || STATUS_META.available;

            const admission = bed.currentAdmission || {};
            const patient = admission.patient || {};
            const doctor = admission.attendingDoctor || {};

            return (
              <div
                key={bed._id}
                className="rounded-2xl liquid-glass-card p-5 flex flex-col justify-between hover:shadow-xs transition-[transform,box-shadow] duration-150 active:scale-[0.99]"
              >
                <div>
                  {/* Top Bar: Bed Number + Ward + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 tracking-tight">
                          {bed.bedNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusConfig.pill}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {bed.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {bed.ward} • {bed.floor}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        ₹{bed.dailyRate?.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/day</span>
                    </div>
                  </div>

                  {/* Bed Features Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {bed.features?.hasOxygen && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                        O₂ Oxygen
                      </span>
                    )}
                    {bed.features?.hasVentilator && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                        Ventilator
                      </span>
                    )}
                    {bed.features?.hasMonitor && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60">
                        Telemetry
                      </span>
                    )}
                    {bed.features?.isIsolation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200/60">
                        Isolation
                      </span>
                    )}
                  </div>

                  {/* Middle Content Based on Status */}
                  {isOccupied ? (
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {patient.name || "Admitted patient"}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                          {patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"}
                        </span>
                      </div>

                      {patient.abhaId && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                          <span className="font-bold uppercase text-[9px] bg-slate-200/80 text-slate-800 px-1 py-0.2 rounded">ABHA</span>
                          <span className="font-semibold">{patient.abhaId}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-1">
                        <span className="font-semibold text-slate-700">Reason:</span> {admission.admissionReason}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span className="font-medium text-slate-700">{getDoctorDisplayName(doctor, "Physician")}</span>
                        <span>Admitted {formatDate(admission.admittedAt)}</span>
                      </div>
                    </div>
                  ) : isAvailable ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      <p className="font-semibold text-emerald-700 mb-0.5">Ready for immediate admission</p>
                      <p className="text-[11px] text-slate-400">Sanitized & equipment verified</p>
                    </div>
                  ) : isCleaning ? (
                    <div className="py-6 text-center text-xs text-yellow-800">
                      <p className="font-semibold mb-0.5">Housekeeping in progress</p>
                      <p className="text-[11px] text-slate-400">Terminal disinfection and bedding refresh</p>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      <p className="font-semibold text-slate-700 mb-0.5">Under technical maintenance</p>
                      <p className="text-[11px] text-slate-400">Bio-med calibration and equipment servicing</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  {isOccupied ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDischargingBed(bed)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                      >
                        <span>Discharge & Bill</span>
                        <span className="text-slate-400">→</span>
                      </button>

                      <ActionDropdown
                        align="right"
                        items={[
                          {
                            label: "Transfer Patient to Bed",
                            icon: "⇄",
                            onClick: () => setTransferringBed(bed),
                          },
                          ...(patient._id
                            ? [
                                {
                                  label: "View Master Patients",
                                  icon: "📋",
                                  onClick: () => window.location.assign("/patients"),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </>
                  ) : isAvailable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAllocatingBed(bed)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                      >
                        <span>+ Admit Patient</span>
                      </button>

                      <ActionDropdown
                        align="right"
                        items={[
                          {
                            label: "Mark for Maintenance",
                            icon: "🛠️",
                            onClick: () => handleStatusChange(bed._id, "maintenance"),
                          },
                          {
                            label: "Mark for Housekeeping",
                            icon: "🧹",
                            onClick: () => handleStatusChange(bed._id, "cleaning"),
                          },
                          { divider: true },
                          {
                            label: "Remove Bed from Registry",
                            icon: "🗑",
                            danger: true,
                            onClick: () => handleDeleteBed(bed),
                          },
                        ]}
                      />
                    </>
                  ) : isCleaning ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(bed._id, "available")}
                        disabled={updatingBedId === bed._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <span>{updatingBedId === bed._id ? "Updating..." : "✓ Ready for Admission"}</span>
                      </button>

                      <ActionDropdown
                        align="right"
                        items={[
                          {
                            label: "Shift to Maintenance",
                            icon: "🛠️",
                            onClick: () => handleStatusChange(bed._id, "maintenance"),
                          },
                          { divider: true },
                          {
                            label: "Remove Bed",
                            icon: "🗑",
                            danger: true,
                            onClick: () => handleDeleteBed(bed),
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(bed._id, "available")}
                        disabled={updatingBedId === bed._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <span>{updatingBedId === bed._id ? "Updating..." : "✓ Return to Service"}</span>
                      </button>

                      <ActionDropdown
                        align="right"
                        items={[
                          {
                            label: "Mark for Sanitization",
                            icon: "🧹",
                            onClick: () => handleStatusChange(bed._id, "cleaning"),
                          },
                          { divider: true },
                          {
                            label: "Remove Bed",
                            icon: "🗑",
                            danger: true,
                            onClick: () => handleDeleteBed(bed),
                          },
                        ]}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 2. SPATIAL WARD FLOOR PLAN MAP VIEW ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {wardGroups.map(({ ward, items, total, occupied, available, rate }) => (
              <div key={ward} className="rounded-2xl liquid-glass-card p-5 space-y-4">
                {/* Ward Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ward}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {occupied} of {total} beds occupied ({rate}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="liquid-glass-pill px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {available} free
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rate > 85 ? "bg-rose-500" : rate > 60 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>

                {/* Spatial Grid of Bed Tiles */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                  {items.map((b) => {
                    const statusConfig = STATUS_META[b.status] || STATUS_META.available;
                    const isOccupied = b.status === "occupied";
                    const isAvailable = b.status === "available";
                    const patient = b.currentAdmission?.patient;

                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => {
                          if (isAvailable) setAllocatingBed(b);
                          else if (isOccupied) setInspectingBed(b);
                          else setInspectingBed(b);
                        }}
                        className="p-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs text-left transition-all duration-120 active:scale-[0.96] cursor-pointer group flex flex-col justify-between h-20"
                        title={`Bed ${b.bedNumber} • ${b.status}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.bedNumber}
                          </span>
                          <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                        </div>
                        <div className="truncate">
                          {isOccupied ? (
                            <p className="text-[10px] font-semibold text-slate-700 truncate">
                              {patient?.name || "Occupied"}
                            </p>
                          ) : (
                            <p className="text-[10px] text-emerald-700 font-medium">
                              Ready
                            </p>
                          )}
                          <p className="text-[9px] text-slate-400 capitalize">
                            {b.status}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspecting Bed Sheet / Modal (In Map View) */}
      {inspectingBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-backdrop-fade">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 animate-pop-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-slate-900">Bed {inspectingBed.bedNumber}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_META[inspectingBed.status]?.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[inspectingBed.status]?.dot}`} />
                    {inspectingBed.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{inspectingBed.ward} • {inspectingBed.floor}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBed(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inspectingBed.status === "occupied" ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inspectingBed.currentAdmission?.patient?.name}</span>
                  <span className="text-slate-500 font-mono">
                    {inspectingBed.currentAdmission?.patient?.age}y / {inspectingBed.currentAdmission?.patient?.gender}
                  </span>
                </div>
                {inspectingBed.currentAdmission?.patient?.abhaId && (
                  <p className="text-slate-600 font-mono text-[11px]">ABHA: {inspectingBed.currentAdmission.patient.abhaId}</p>
                )}
                <p className="text-slate-600"><span className="font-semibold">Reason:</span> {inspectingBed.currentAdmission?.admissionReason}</p>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                  <span>Doctor: {getDoctorDisplayName(inspectingBed.currentAdmission?.attendingDoctor, "Dr.")}</span>
                  <span>Admitted: {formatDate(inspectingBed.currentAdmission?.admittedAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                This bed is currently marked as <strong className="capitalize">{inspectingBed.status}</strong> with a daily rate of ₹{inspectingBed.dailyRate?.toLocaleString("en-IN")}.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {inspectingBed.status === "occupied" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const target = inspectingBed;
                      setInspectingBed(null);
                      setTransferringBed(target);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = inspectingBed;
                      setInspectingBed(null);
                      setDischargingBed(target);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Discharge & Bill →
                  </button>
                </>
              )}
              {inspectingBed.status === "available" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectingBed;
                    setInspectingBed(null);
                    setAllocatingBed(target);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  + Admit Patient
                </button>
              )}
              {inspectingBed.status !== "available" && inspectingBed.status !== "occupied" && (
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(inspectingBed._id, "available");
                    setInspectingBed(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  ✓ Ready for Admission
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Bed Modal */}
      {isCreateOpen && (
        <CreateBedModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchBedsData();
          }}
        />
      )}

      {/* Allocate Modal */}
      {allocatingBed && (
        <AllocateBedModal
          bed={allocatingBed}
          onClose={() => setAllocatingBed(null)}
          onSuccess={() => {
            setAllocatingBed(null);
            fetchBedsData();
          }}
        />
      )}

      {/* Transfer Modal */}
      {transferringBed && (
        <TransferBedModal
          sourceBed={transferringBed}
          allBeds={beds}
          onClose={() => setTransferringBed(null)}
          onSuccess={() => {
            setTransferringBed(null);
            fetchBedsData();
          }}
        />
      )}

      {/* Discharge Modal */}
      {dischargingBed && (
        <DischargeBedModal
          bed={dischargingBed}
          onClose={() => setDischargingBed(null)}
          onSuccess={() => {
            setDischargingBed(null);
            fetchBedsData();
          }}
        />
      )}

      {/* Modern Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bedToDelete)}
        title="Remove Bed"
        message={
          bedToDelete
            ? `Are you sure you want to remove bed ${bedToDelete.bedNumber} from ${bedToDelete.ward}? This action cannot be undone.`
            : ""
        }
        confirmText="Remove Bed"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDeleteBed}
        onCancel={() => setBedToDelete(null)}
      />
    </div>
  );
}

export default Beds;

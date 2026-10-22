import { useEffect, useState, useMemo } from "react";
import AllocateBedModal from "../components/AllocateBedModal.jsx";
import TransferBedModal from "../components/TransferBedModal.jsx";
import DischargeBedModal from "../components/DischargeBedModal.jsx";
import CreateBedModal from "../components/CreateBedModal.jsx";
import { getBeds, getBedSummary, updateBedStatus, deleteBed } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoctorDisplayName } from "../utils/doctorName.js";
import { PageHeader, ConfirmDialog } from "../components/ui/index.js";

const WARDS = [
  "All wards",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "General Ward",
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
  const canManageBeds = ["receptionist", "nurse", "admin", "doctor", "emergency"].includes(user?.role);

  const [beds, setBeds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedWard, setSelectedWard] = useState("All wards");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [allocatingBed, setAllocatingBed] = useState(null);
  const [transferringBed, setTransferringBed] = useState(null);
  const [dischargingBed, setDischargingBed] = useState(null);
  const [updatingBedId, setUpdatingBedId] = useState(null);
  const [bedToDelete, setBedToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBedsData = async () => {
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
  };

  useEffect(() => {
    fetchBedsData();
  }, [selectedWard, selectedStatus, searchQuery]);

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

  if (!canManageBeds) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto mt-12">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
        <p className="text-sm font-medium text-slate-600">
          Ward and bed allocation management is restricted to authorized healthcare staff (Receptionists, Nurses, and Administrators).
        </p>
        <p className="text-xs text-slate-500">
          If you require bed assignment or patient transfer, please contact the nursing station or reception desk.
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
            >
              <span>+ Add new bed</span>
            </button>
            <button
              type="button"
              onClick={fetchBedsData}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh occupancy</span>
            </button>
          </div>
        }
      />

      {/* Occupancy Analytics & Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total hospital beds</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{summary.total}</p>
            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-600">Across 6 hospital wards</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Occupied beds</p>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {summary.occupancyRate}%
              </span>
            </div>
            <p className="text-3xl font-extrabold text-amber-700 mt-1.5">{summary.occupied}</p>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200/60">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.occupancyRate}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Available beds</p>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1.5">{summary.available}</p>
            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Ready for admission
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">In cleaning</p>
            <p className="text-3xl font-extrabold text-yellow-700 mt-1.5">{summary.cleaning}</p>
            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                Housekeeping active
              </span>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Maintenance</p>
            <p className="text-3xl font-extrabold text-slate-700 mt-1.5">{summary.maintenance}</p>
            <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Bio-med service
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ward Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {WARDS.map((ward) => {
          const isSelected = selectedWard === ward;
          const countInfo = wardCounts[ward];
          return (
            <button
              key={ward}
              type="button"
              onClick={() => setSelectedWard(ward)}
              className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-teal-700 text-white shadow-sm ring-1 ring-teal-800"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{ward}</span>
              {countInfo && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
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
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedStatus === f.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search bed, patient, ABHA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
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

      {/* Main Ward Beds Visual Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-semibold">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-r-transparent mr-2" />
          Loading hospital ward beds...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
          {error}
        </div>
      ) : beds.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="text-3xl mb-2">🛏️</div>
          <h3 className="text-sm font-bold text-slate-900">No beds found matching filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your ward or status filter to see other beds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {beds.map((bed) => {
            const isOccupied = bed.status === "occupied";
            const isAvailable = bed.status === "available";
            const isCleaning = bed.status === "cleaning";
            const isMaintenance = bed.status === "maintenance";

            const admission = bed.currentAdmission || {};
            const patient = admission.patient || {};
            const doctor = admission.attendingDoctor || {};

            return (
              <div
                key={bed._id}
                className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-150 shadow-xs ${
                  isOccupied
                    ? "bg-white border-amber-300 ring-1 ring-amber-400/20"
                    : isAvailable
                    ? "bg-white border-emerald-300 ring-1 ring-emerald-400/20 hover:border-emerald-500"
                    : isCleaning
                    ? "bg-amber-50/40 border-yellow-300"
                    : "bg-slate-50 border-slate-300"
                }`}
              >
                <div>
                  {/* Top Bar: Bed Number + Ward + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-slate-900">
                          {bed.bedNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isOccupied
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : isAvailable
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : isCleaning
                              ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                              : "bg-slate-200 text-slate-800 border border-slate-300"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                          {bed.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-semibold">
                        {bed.ward} • {bed.floor}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{bed.dailyRate?.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 block">per day</span>

                      {!isOccupied && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBed(bed)}
                          className="mt-1 text-[11px] text-rose-500 hover:text-rose-700 font-bold"
                          title="Remove bed"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bed Amenities Icons */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {bed.features?.hasOxygen && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                        🫁 Oxygen
                      </span>
                    )}
                    {bed.features?.hasVentilator && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                        ⚡ Ventilator
                      </span>
                    )}
                    {bed.features?.hasMonitor && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                        📟 Monitor
                      </span>
                    )}
                    {bed.features?.isIsolation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        🚪 Isolation
                      </span>
                    )}
                  </div>

                  {/* Middle Content Based on Status */}
                  {isOccupied ? (
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900">
                          {patient.name || "Admitted patient"}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {patient.age}y / {patient.gender}
                        </span>
                      </div>

                      {patient.abhaId && (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-sky-800">
                          <span className="font-bold uppercase tracking-wider text-[10px] bg-sky-100 text-sky-900 px-1.5 py-0.2 rounded">ABHA</span>
                          <span className="font-bold">{patient.abhaId}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 line-clamp-1">
                        <span className="font-bold text-slate-800">Reason:</span> {admission.admissionReason}
                      </p>

                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-800">{getDoctorDisplayName(doctor, "Physician")}</span>
                        <span>Admitted {formatDate(admission.admittedAt)}</span>
                      </div>
                    </div>
                  ) : isAvailable ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      <p className="font-bold text-emerald-700 text-sm mb-1">✓ Ready for immediate admission</p>
                      <p className="text-[11px] text-slate-600">Cleaned, sanitized, and equipment verified</p>
                    </div>
                  ) : isCleaning ? (
                    <div className="py-6 text-center text-xs text-yellow-800">
                      <p className="font-bold text-sm mb-1">🧹 Housekeeping & sanitization in progress</p>
                      <p className="text-[11px] text-slate-600">Discharge completed; bed being sanitized</p>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-600">
                      <p className="font-bold text-sm mb-1">🛠️ Under technical maintenance</p>
                      <p className="text-[11px]">Bio-med calibration and equipment servicing</p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  {isOccupied ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setTransferringBed(bed)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors"
                      >
                        <span>⇄ Transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDischargingBed(bed)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs"
                      >
                        <span>🚪 Discharge & bill</span>
                      </button>
                    </>
                  ) : isAvailable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(bed._id, "maintenance")}
                        disabled={updatingBedId === bed._id}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        Mark maintenance
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocatingBed(bed)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                      >
                        <span>+ Admit patient</span>
                      </button>
                    </>
                  ) : isCleaning ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(bed._id, "available")}
                      disabled={updatingBedId === bed._id}
                      className="w-full py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                    >
                      {updatingBedId === bed._id ? "Updating..." : "✓ Mark as ready for admission"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(bed._id, "available")}
                      disabled={updatingBedId === bed._id}
                      className="w-full py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-2xs"
                    >
                      {updatingBedId === bed._id ? "Updating..." : "✓ Return to service"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

      {/* Modern Accessible Confirmation Dialog */}
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

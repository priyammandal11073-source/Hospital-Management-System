import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getEmergencyQueue, getDoctors, assignEmergencyDoctor } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { ActionDropdown, PageHeader } from "../../components/ui/index.js";

const priorityOptions = ["all", "critical", "urgent", "less_urgent", "non_urgent"];
const statusOptions = [
  "all",
  "arrived",
  "registered",
  "awaiting_triage",
  "triaged",
  "awaiting_doctor",
  "under_assessment",
  "under_treatment",
  "awaiting_diagnostics",
  "under_observation",
  "admitted",
  "discharged",
  "transferred",
];

const PriorityBadge = ({ priority }) => {
  const map = {
    critical: {
      badge: "bg-rose-50 text-rose-700 border-rose-200/80 font-bold",
      dot: "bg-rose-600 animate-pulse",
      label: "Critical (STAT)",
    },
    urgent: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 font-bold",
      dot: "bg-amber-500",
      label: "Urgent",
    },
    less_urgent: {
      badge: "bg-sky-50 text-sky-800 border-sky-200/80 font-semibold",
      dot: "bg-sky-500",
      label: "Less Urgent",
    },
    non_urgent: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold",
      dot: "bg-emerald-500",
      label: "Non-Urgent",
    },
  };
  const config = map[priority] || {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    label: priority || "Routine",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] border shadow-2xs ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default function EmergencyQueuePage() {
  const [encounters, setEncounters] = useState([]);
  const [filters, setFilters] = useState({
    priority: "all",
    status: "all",
    doctor: "all",
    location: "",
    search: "",
    triageStatus: "all",
    date: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const timerRef = useRef(null);

  const load = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const res = await getEmergencyQueue({
          priority: filters.priority,
          status: filters.status,
          doctor: filters.doctor === "all" ? undefined : filters.doctor,
          location: filters.location || undefined,
          search: filters.search || undefined,
          triageStatus: filters.triageStatus,
          date: filters.date || undefined,
          limit: 100,
        });
        setEncounters(res.encounters || []);
        setTotal(res.pagination?.total || res.encounters?.length || 0);
        setLastRefreshed(new Date());
      } catch (e) {
        console.error("Queue fetch error", e);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    getDoctors()
      .then((r) => setDoctors(r.doctors || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!autoRefresh) return;
    timerRef.current = setInterval(() => {
      load(true);
    }, 15000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, load]);

  const handleQuickAssign = async (encounterId, docId) => {
    if (!docId) return;
    try {
      await assignEmergencyDoctor(encounterId, docId);
      load(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign doctor");
    }
  };

  const criticalCount = encounters.filter((e) => e.priority === "critical").length;
  const untriagedCount = encounters.filter((e) => e.triageStatus === "awaiting_triage").length;
  const underCareCount = encounters.filter(
    (e) => e.status === "under_treatment" || e.status === "under_assessment"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header aligned with Admin Portal */}
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <Link to="/emergency/dashboard" className="hover:underline">Emergency Command</Link>
            <span>/</span>
            <span>Triage Queue</span>
          </div>
        }
        title="Emergency Triage & Patient Queue"
        subtitle="Live clinical census, red-amber triage prioritization, attending physician assignments, and rapid intake tracking."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            LIVE • {total} Active Patients
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs ${
                autoRefresh
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                  : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {autoRefresh ? "Auto-Refresh (15s)" : "Paused"}
            </button>
            <Link
              to="/emergency/register"
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-teal-950/10 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+ Register Patient</span>
            </Link>
            <Link
              to="/emergency/dashboard"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Command Center
            </Link>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Refresh queue"
            >
              ↻ Refresh
            </button>
          </>
        }
      />

      {/* 4 Summary Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Active Queue</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{encounters.length}</p>
          <span className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100/80">Intake & admitted</span>
        </div>
        <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between bg-rose-50/20">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Critical / Level 1 STAT</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-rose-600 tracking-tight tabular-nums">{criticalCount}</p>
          <span className="text-[10px] text-rose-600 font-medium mt-2 pt-2 border-t border-rose-100/80">Immediate Resuscitation</span>
        </div>
        <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between bg-amber-50/20">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Awaiting Triage</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight tabular-nums">{untriagedCount}</p>
          <span className="text-[10px] text-amber-600 font-medium mt-2 pt-2 border-t border-amber-100/80">Pending nurse evaluation</span>
        </div>
        <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 shadow-2xs flex flex-col justify-between bg-blue-50/20">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Under Active Care</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight tabular-nums">{underCareCount}</p>
          <span className="text-[10px] text-blue-600 font-medium mt-2 pt-2 border-t border-blue-100/80">Assessment & Treatment</span>
        </div>
      </div>

      {/* Filter Tabs & Telemetry Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, priority: "all", triageStatus: "all", status: "all" }))}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 ${
              filters.priority === "all" && filters.triageStatus === "all" && filters.status === "all"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-950/10"
                : "liquid-glass-pill text-slate-700 border-slate-200/80 hover:bg-slate-100/80"
            }`}
          >
            All Encounters ({encounters.length})
          </button>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, priority: "critical", triageStatus: "all", status: "all" }))}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              filters.priority === "critical"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            Critical / STAT ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, triageStatus: "awaiting_triage", priority: "all", status: "all" }))}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition shadow-2xs cursor-pointer active:scale-95 ${
              filters.triageStatus === "awaiting_triage"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80"
            }`}
          >
            Awaiting Triage ({untriagedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, status: "under_treatment", priority: "all", triageStatus: "all" }))}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 ${
              filters.status === "under_treatment"
                ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                : "liquid-glass-pill text-slate-700 border-slate-200/80 hover:bg-slate-100/80"
            }`}
          >
            Under Treatment
          </button>
        </div>

        <span className="text-[11px] text-slate-400 self-center">
          Telemetry Synced: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
              placeholder="Search by patient name, MRN, Emergency ID, Token, or phone..."
              className="w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm shadow-teal-950/10 transition active:scale-95 cursor-pointer shrink-0"
          >
            Search Queue
          </button>
        </div>

        {/* Detailed Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs pt-2 border-t border-slate-100/80">
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white font-medium text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none"
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === "all" ? "All Priorities" : p.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white font-medium text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <select
            value={filters.triageStatus}
            onChange={(e) => setFilters((f) => ({ ...f, triageStatus: e.target.value }))}
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white font-medium text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none"
          >
            <option value="all">All Triage States</option>
            <option value="awaiting_triage">Awaiting Triage</option>
            <option value="triaged">Triaged</option>
          </select>

          <select
            value={filters.doctor}
            onChange={(e) => setFilters((f) => ({ ...f, doctor: e.target.value }))}
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white font-medium text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none max-w-[200px] truncate"
          >
            <option value="all">All Attending Physicians</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {getDoctorDisplayName(d)} ({d.specialization || "Emergency"})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none"
          />

          <input
            type="text"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            placeholder="Bay / Location"
            className="rounded-xl border border-slate-200/80 px-3 py-1.5 bg-white w-32 text-slate-700 shadow-2xs focus:border-teal-700 focus:outline-none"
          />

          {(filters.priority !== "all" ||
            filters.status !== "all" ||
            filters.doctor !== "all" ||
            filters.search ||
            filters.date ||
            filters.location) && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  priority: "all",
                  status: "all",
                  doctor: "all",
                  location: "",
                  search: "",
                  triageStatus: "all",
                  date: "",
                })
              }
              className="text-xs font-semibold text-rose-700 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="overflow-hidden rounded-2xl liquid-glass-card shadow-2xs">
        <div className="table-responsive-container">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Token & ID</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Age / Sex</th>
                <th className="px-4 py-3">Arrival Time</th>
                <th className="px-4 py-3">Chief Complaint</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Triage</th>
                <th className="px-4 py-3">Attending Physician</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Loading emergency queue telemetry...
                  </td>
                </tr>
              ) : encounters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">📋</span>
                      <p className="font-semibold text-slate-600">No emergency patients match current criteria</p>
                      <p className="text-xs text-slate-400">Try adjusting your priority or status filters above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                encounters.map((e) => {
                  const isCrit = e.priority === "critical";
                  return (
                    <tr
                      key={e._id}
                      className={`hover:bg-teal-50/30 transition ${
                        isCrit ? "bg-rose-50/50 border-l-4 border-l-rose-600" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5">
                          {isCrit && <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />}
                          <span className="text-slate-900">{e.tokenNumber || "—"}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">{e.emergencyId || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{e.patient?.name || "Unknown Patient"}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                          {e.patient?.patientId || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 tabular-nums">
                          {e.patient?.age ? `${e.patient.age}y` : "—"}
                        </span>
                        <div className="text-[10px] text-slate-500">{e.patient?.gender || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                        <div className="font-medium">
                          {new Date(e.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(e.arrivalTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate text-slate-700" title={e.chiefComplaint}>
                        {e.chiefComplaint || "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={e.priority} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                            e.triageStatus === "triaged"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : "bg-amber-50 text-amber-800 border-amber-200/80"
                          }`}
                        >
                          {(e.triageStatus || "awaiting_triage").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {e.assignedDoctor ? (
                          <span className="font-semibold text-slate-800">{getDoctorDisplayName(e.assignedDoctor)}</span>
                        ) : e.assignedDoctorName ? (
                          <span className="text-slate-700">{e.assignedDoctorName}</span>
                        ) : (
                          <select
                            onChange={(ev) => handleQuickAssign(e._id, ev.target.value)}
                            defaultValue=""
                            className="rounded-xl border border-dashed border-slate-300 px-2 py-1 text-[11px] bg-white text-slate-600 shadow-2xs hover:border-slate-400 focus:outline-none"
                          >
                            <option value="" disabled>+ Assign Doctor</option>
                            {doctors.map((d) => (
                              <option key={d._id} value={d._id}>
                                {getDoctorDisplayName(d)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200/80 px-2.5 py-0.5">
                          {(e.status || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/emergency/patients/${e._id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition"
                          >
                            <span>Open Profile</span>
                            <span className="text-slate-400">→</span>
                          </Link>

                          <ActionDropdown
                            align="right"
                            items={[
                              {
                                label: "Copy Encounter ID",
                                icon: "📋",
                                onClick: () => {
                                  navigator.clipboard?.writeText(e.emergencyId || e._id);
                                },
                              },
                              ...(e.patient?.phone
                                ? [
                                    {
                                      label: `Call: ${e.patient.phone}`,
                                      icon: "📞",
                                      onClick: () => {
                                        window.open(`tel:${e.patient.phone}`);
                                      },
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

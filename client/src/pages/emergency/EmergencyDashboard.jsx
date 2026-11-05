import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getEmergencyDashboard, getEmergencyQueue, getEmergencyReports } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateEmergencyCensusHtml } from "../../utils/printTemplates.js";
import { PageHeader } from "../../components/ui/index.js";

function MetricCard({ label, value, sub, badge, icon, valueColor = "text-slate-900" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl liquid-glass-card p-4 sm:p-5 transition active:scale-[0.98] flex flex-col justify-between h-full min-h-[136px]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={label}>
            {label}
          </p>
          <p className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight truncate tabular-nums ${valueColor}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl liquid-glass-subtle text-slate-700 shadow-2xs">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100/80 text-[11px] text-slate-500">
        <span className="truncate">{sub || "Operational status"}</span>
        {badge && (
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2 py-0.5 text-[9px] font-semibold text-slate-700 shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

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

const StatusBadge = ({ status }) => {
  const map = {
    arrived: "bg-slate-100 text-slate-700 border-slate-200",
    registered: "bg-blue-50 text-blue-700 border-blue-200/80",
    awaiting_triage: "bg-amber-50 text-amber-800 border-amber-200/80",
    triaged: "bg-sky-50 text-sky-800 border-sky-200/80",
    awaiting_doctor: "bg-violet-50 text-violet-800 border-violet-200/80",
    under_assessment: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    under_treatment: "bg-teal-50 text-teal-800 border-teal-200/80",
    awaiting_diagnostics: "bg-orange-50 text-orange-800 border-orange-200/80",
    under_observation: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    admitted: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    discharged: "bg-slate-100 text-slate-600 border-slate-200",
    transferred: "bg-purple-50 text-purple-800 border-purple-200/80",
  };
  const formatted = (status || "").replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${map[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {formatted}
    </span>
  );
};

export default function EmergencyDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [beds, setBeds] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queuePreview, setQueuePreview] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef(null);
  const { openPrintPreview } = usePrintModal();

  const handlePrintCensus = () => {
    openPrintPreview({
      title: "Emergency Department Census & Live Bed Board",
      htmlContent: generateEmergencyCensusHtml({ stats, beds, recent }),
      refNumber: `CENSUS-${Date.now().toString().slice(-6)}`,
    });
  };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [dash, rep, q] = await Promise.all([
        getEmergencyDashboard(),
        getEmergencyReports().catch(() => ({ reports: {} })),
        getEmergencyQueue({ limit: 8 }).catch(() => ({ encounters: [] })),
      ]);
      setStats(dash.stats);
      setRecent(dash.recent || []);
      setBeds(dash.beds || []);
      setReports(rep.reports || {});
      setQueuePreview(q.encounters || []);
    } catch (e) {
      console.error("Emergency dashboard load error:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    timerRef.current = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, load]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white/70 rounded-2xl liquid-glass-card" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/70 rounded-2xl liquid-glass-card" />
          ))}
        </div>
        <div className="h-96 bg-white/70 rounded-2xl liquid-glass-card" />
      </div>
    );
  }

  const activePatientsList = queuePreview.length ? queuePreview : recent;

  return (
    <div className="space-y-6">
      {/* Header aligned with Admin Portal PageHeader */}
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Emergency Command</span>
          </div>
        }
        title="Emergency Department & Trauma Command"
        subtitle="Real-time triage census, critical resuscitation bays, trauma queue, and institutional emergency response status."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            LIVE • 24/7 Level-1 Trauma
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
              {autoRefresh ? "Live Auto-Refresh (30s)" : "Auto-Refresh Paused"}
            </button>
            <Link
              to="/emergency/register"
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-teal-950/10 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>+ Emergency Registration</span>
            </Link>
            <Link
              to="/emergency/queue"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              View Full Queue
            </Link>
            <button
              type="button"
              onClick={() => load()}
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Refresh telemetry"
            >
              ↻ Refresh
            </button>
          </>
        }
      />

      {/* Row 1 Stats: Primary Clinical Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          label="Critical (STAT)"
          value={stats?.critical ?? 0}
          valueColor="text-rose-600 font-black"
          sub="Immediate resuscitation"
          badge="Level 1"
          icon={<span className="text-base">🚨</span>}
        />
        <MetricCard
          label="Under Care"
          value={stats?.under_care ?? 0}
          valueColor="text-blue-700"
          sub="Assessment & care"
          badge="Active"
          icon={<span className="text-base">🩺</span>}
        />
        <MetricCard
          label="Waiting Queue"
          value={stats?.waiting ?? 0}
          valueColor="text-amber-700"
          sub="Triage / Doctor pending"
          badge="Queue"
          icon={<span className="text-base">⏳</span>}
        />
        <MetricCard
          label="Under Observation"
          value={stats?.observation ?? 0}
          valueColor="text-cyan-700"
          sub="Monitoring bay"
          badge="Step-down"
          icon={<span className="text-base">🛏️</span>}
        />
        <MetricCard
          label="Available Beds"
          value={stats?.availableBeds ?? 5}
          valueColor="text-emerald-700"
          sub={`${beds.length || 0} Total ER bays`}
          badge="Capacity"
          icon={<span className="text-base">🏥</span>}
        />
        <MetricCard
          label="Awaiting Triage"
          value={stats?.awaiting_triage ?? 0}
          valueColor="text-orange-700"
          sub="Door-to-triage queue"
          badge="Intake"
          icon={<span className="text-base">📋</span>}
        />
      </div>

      {/* Row 2 Stats: Operational Response Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          label="Waiting for Doctor"
          value={stats?.awaiting_doctor ?? 0}
          valueColor="text-violet-700"
          sub="Triaged, awaiting physician"
          badge="Staffing"
          icon={<span className="text-base">👨‍⚕️</span>}
        />
        <MetricCard
          label="Pending Diagnostics"
          value={stats?.pending_diagnostics ?? 0}
          valueColor="text-sky-700"
          sub="STAT LIS / Radiology orders"
          badge="Diagnostics"
          icon={<span className="text-base">🔬</span>}
        />
        <MetricCard
          label="Pending STAT Meds"
          value={stats?.pending_meds ?? 0}
          valueColor="text-indigo-700"
          sub="Emergency pharmacy dispensations"
          badge="Pharmacy"
          icon={<span className="text-base">💊</span>}
        />
        <MetricCard
          label="Avg Triage Wait Time"
          value={`${reports?.waitTime?.averageMinutes ?? 0}m`}
          valueColor="text-slate-900"
          sub="Door-to-provider time today"
          badge="NABH < 15m"
          icon={<span className="text-base">⏱️</span>}
        />
      </div>

      {/* Current Emergency Patients Table - Admin Portal styling */}
      <div className="overflow-hidden rounded-2xl liquid-glass-card shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Current Emergency Patients
            </h2>
            <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
              Active Queue ({activePatientsList.length})
            </span>
          </div>
          <Link
            to="/emergency/queue"
            className="text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Queue & Triage Desk</span>
            <span>→</span>
          </Link>
        </div>

        <div className="table-responsive-container">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient Information</th>
                <th className="px-4 py-3">Priority Level</th>
                <th className="px-4 py-3">Arrival Timestamp</th>
                <th className="px-4 py-3">Attending Physician</th>
                <th className="px-4 py-3">Clinical Status</th>
                <th className="px-4 py-3">Bay / Location</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {activePatientsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🛡️</span>
                      <p className="font-semibold text-slate-600">No active emergency patients in queue</p>
                      <p className="text-xs text-slate-400">All emergency bays are cleared and operational.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activePatientsList.slice(0, 8).map((e) => {
                  const isCrit = e.priority === "critical";
                  const doctorDisplay = e.assignedDoctor
                    ? getDoctorDisplayName(e.assignedDoctor)
                    : e.assignedDoctorName || "Unassigned";

                  return (
                    <tr
                      key={e._id}
                      className={`hover:bg-teal-50/30 transition ${
                        isCrit ? "bg-rose-50/40 hover:bg-rose-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{e.patient?.name || "Unknown Patient"}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {e.tokenNumber || "—"} • {e.emergencyId || "—"} • {e.patient?.age || "—"}y/{e.patient?.gender || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={e.priority} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        <div className="font-medium">
                          {new Date(e.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(e.arrivalTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                        {doctorDisplay}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {e.location || "Triage Area"}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/emergency/patients/${e._id}`}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95 inline-flex items-center gap-1"
                        >
                          <span>Open Record</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beds & Reports Row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Live ER Bed Board */}
        <div className="lg:col-span-2 rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100/80">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Emergency Bed Capacity</h3>
                <span className="rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                  Resuscitation & Observation Bays
                </span>
              </div>
              <Link to="/emergency/beds" className="text-xs font-semibold text-teal-800 hover:underline">
                Manage Bays →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {beds.length === 0 ? (
                <div className="col-span-full text-center text-slate-400 py-8 text-xs">
                  No dedicated emergency bays configured. Showing general hospital allocation.
                </div>
              ) : (
                beds.map((b) => {
                  const isAvailable = b.status === "available";
                  const isOccupied = b.status === "occupied";
                  return (
                    <div
                      key={b._id || b.bedNumber}
                      className={`rounded-xl p-3.5 border transition shadow-2xs flex flex-col justify-between ${
                        isAvailable
                          ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-900"
                          : isOccupied
                          ? "bg-rose-50/50 border-rose-200/80 text-rose-900"
                          : "bg-amber-50/50 border-amber-200/80 text-amber-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{b.bedNumber}</span>
                          <span
                            className={`rounded-full px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              isAvailable
                                ? "bg-emerald-600 text-white"
                                : isOccupied
                                ? "bg-rose-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">
                          {b.ward || "Trauma Center"}
                        </div>
                      </div>
                      {b.currentAdmission?.patient && (
                        <div className="mt-2 pt-2 border-t border-rose-200/60 text-[11px] font-bold text-rose-800 truncate">
                          👤 {b.currentAdmission.patient?.name}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Emergency Telemetry & Shift Outcomes */}
        <div className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100/80">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Shift Outcomes & Census</h3>
              <span className="rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                Today
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl liquid-glass-subtle px-3.5 py-2.5">
                <span className="text-slate-600 font-medium">Today Total Registrations</span>
                <span className="font-bold text-slate-900">{reports?.register?.todayTotal ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl liquid-glass-subtle px-3.5 py-2.5">
                <span className="text-slate-600 font-medium">7-Day Rolling Volume</span>
                <span className="font-bold text-slate-900">{reports?.register?.weekTotal ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-rose-50/70 border border-rose-200/80 px-3.5 py-2.5">
                <span className="text-rose-800 font-medium">Critical (Level 1 STAT)</span>
                <span className="font-bold text-rose-700">{reports?.critical?.today ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2.5">
                <span className="text-emerald-800 font-medium">Admitted to Inpatient</span>
                <span className="font-bold text-emerald-700">{reports?.flow?.admittedFromER ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl liquid-glass-subtle px-3.5 py-2.5">
                <span className="text-slate-600 font-medium">Discharged Home</span>
                <span className="font-bold text-slate-900">{reports?.flow?.dischargedFromER ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-sky-50/70 border border-sky-200/80 px-3.5 py-2.5">
                <span className="text-sky-800 font-medium">Pending STAT Diagnostics</span>
                <span className="font-bold text-sky-800">{reports?.diagnostics?.pending ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100/80 flex gap-2.5">
            <Link
              to="/emergency/queue"
              className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-center py-2 text-xs font-semibold shadow-2xs transition active:scale-95"
            >
              Open Queue
            </Link>
            <button
              type="button"
              onClick={handlePrintCensus}
              className="flex-1 rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 text-center py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              🖨 Print Census
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Quick Actions Hub */}
      <div className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-3.5">
          Emergency Clinical Actions Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <Link
            to="/emergency/register"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white p-3 text-center font-semibold shadow-sm shadow-teal-950/10 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>+ Fast Registration</span>
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white p-3 text-center font-semibold shadow-2xs transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Start Triage</span>
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Assign Doctor
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Log Emergency Vitals
          </Link>
          <Link
            to="/emergency/beds"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Bed Allocation
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs mt-2.5">
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Clinical Progress Note
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            STAT Diagnostic Order
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Emergency Prescription
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Inpatient Admission
          </Link>
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 border border-slate-200/80 p-3 text-center font-medium shadow-2xs transition active:scale-95"
          >
            Discharge & Follow-up
          </Link>
        </div>
      </div>
    </div>
  );
}

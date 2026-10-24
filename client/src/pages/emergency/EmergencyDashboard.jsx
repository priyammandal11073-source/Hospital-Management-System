import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getEmergencyDashboard, getEmergencyQueue, getEmergencyReports } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateEmergencyCensusHtml } from "../../utils/printTemplates.js";

const StatCard = ({ label, value, sub, color }) => (
  <div className="rounded-2xl liquid-glass-card p-4 transition active:scale-[0.98]">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const PriorityBadge = ({ priority }) => {
  const map = {
    critical: "bg-red-600 text-white border-red-700 animate-pulse",
    urgent: "bg-amber-500 text-white border-amber-600",
    less_urgent: "bg-sky-600 text-white border-sky-700",
    non_urgent: "bg-emerald-600 text-white border-emerald-700",
  };
  const label = { critical: "Critical", urgent: "Urgent", less_urgent: "Less Urgent", non_urgent: "Non-Urgent" }[priority] || priority;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${map[priority] || "bg-slate-200 text-slate-700"}`}>{label}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    arrived: "bg-slate-100 text-slate-700 border-slate-300",
    registered: "bg-blue-50 text-blue-700 border-blue-200",
    awaiting_triage: "bg-amber-50 text-amber-700 border-amber-200",
    triaged: "bg-sky-50 text-sky-700 border-sky-200",
    awaiting_doctor: "bg-violet-50 text-violet-700 border-violet-200",
    under_assessment: "bg-indigo-50 text-indigo-700 border-indigo-200",
    under_treatment: "bg-blue-50 text-blue-700 border-blue-200",
    awaiting_diagnostics: "bg-orange-50 text-orange-700 border-orange-200",
    under_observation: "bg-teal-50 text-teal-700 border-teal-200",
    admitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    discharged: "bg-slate-100 text-slate-600 border-slate-200",
    transferred: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${map[status] || "bg-slate-50 text-slate-700"}`}>{(status || "").replace(/_/g, " ")}</span>;
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
        getEmergencyQueue({ limit: 6 }).catch(() => ({ encounters: [] })),
      ]);
      setStats(dash.stats);
      setRecent(dash.recent || []);
      setBeds(dash.beds || []);
      setReports(rep.reports || {});
      setQueuePreview(q.encounters || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    timerRef.current = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, load]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Emergency Department...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">⚡</span>
            Emergency Department
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time triage, resuscitation and observation command center</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(v => !v)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer touch-target active:scale-95 ${autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
            {autoRefresh ? "Auto-Refresh (30s)" : "Paused"}
          </button>
          <Link to="/emergency/register" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer touch-target">+ Emergency Registration</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition active:scale-95 cursor-pointer touch-target">View Queue</Link>
          <button type="button" onClick={() => load()} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 transition active:scale-95 cursor-pointer touch-target">Refresh</button>
        </div>
      </div>

      {/* Stats - compact operational */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Critical" value={stats?.critical ?? 0} color="text-red-600" sub="Immediate" />
        <StatCard label="Under Care" value={stats?.under_care ?? 0} color="text-blue-600" sub="Assessment/Treatment" />
        <StatCard label="Waiting" value={stats?.waiting ?? 0} color="text-amber-600" sub="Triage/Doctor" />
        <StatCard label="Observation" value={stats?.observation ?? 0} color="text-teal-600" sub="Monitoring" />
        <StatCard label="Available Beds" value={stats?.availableBeds ?? 5} color="text-emerald-600" sub={`${beds.length || 0} ER beds`} />
        <StatCard label="Waiting Triage" value={stats?.awaiting_triage ?? 0} color="text-orange-600" sub="Untriaged" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Waiting Doctor" value={stats?.awaiting_doctor ?? 0} color="text-violet-600" />
        <StatCard label="Pending Diagnostics" value={stats?.pending_diagnostics ?? 0} color="text-sky-600" />
        <StatCard label="Pending Meds" value={stats?.pending_meds ?? 0} color="text-indigo-600" />
        <StatCard label="Avg Wait Triage" value={`${reports?.waitTime?.averageMinutes ?? 0}m`} color="text-slate-800" sub="Today" />
      </div>

      {/* Current Emergency Patients */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Current Emergency Patients</h2>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Active Queue</span>
          </div>
          <Link to="/emergency/queue" className="text-xs font-semibold text-rose-600 hover:underline">View All Queue →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Patient</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Arrival</th>
                <th className="px-3 py-2.5">Doctor</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Location</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(queuePreview.length ? queuePreview : recent).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No active emergency patients</td></tr>
              ) : (
                (queuePreview.length ? queuePreview : recent).slice(0,8).map((e) => {
                  const isCrit = e.priority === "critical";
                  const doctorDisplay = e.assignedDoctor ? getDoctorDisplayName(e.assignedDoctor) : (e.assignedDoctorName || "—");
                  return (
                    <tr key={e._id} className={`hover:bg-slate-50/70 transition ${isCrit ? "bg-rose-50/40" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{e.patient?.name || "Unknown Patient"}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{e.tokenNumber} • {e.emergencyId} • {e.patient?.age || "-"}y/{e.patient?.gender || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5"><PriorityBadge priority={e.priority} /></td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-600">
                        {new Date(e.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        <div className="text-[10px] text-slate-400">{new Date(e.arrivalTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{doctorDisplay}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={e.status} /></td>
                      <td className="px-3 py-2.5 text-slate-600">{e.location}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Link to={`/emergency/patients/${e._id}`} className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-bold transition shadow-xs active:scale-95 inline-block">Open</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beds + Reports row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Emergency Beds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {beds.length === 0 ? <div className="col-span-full text-center text-slate-400 py-6 text-xs">No ER beds configured. Showing general availability.</div> : beds.map((b) => (
              <div key={b._id || b.bedNumber} className={`rounded-xl p-3 border text-xs ${b.status === "available" ? "bg-emerald-50 border-emerald-200" : b.status === "occupied" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="font-bold text-slate-900">{b.bedNumber}</div>
                <div className="text-[10px] text-slate-600">{b.ward}</div>
                <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${b.status === "available" ? "bg-emerald-600 text-white" : b.status === "occupied" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>{b.status}</div>
                {b.currentAdmission?.patient && <div className="truncate text-[11px] mt-1 font-medium text-slate-700">{b.currentAdmission.patient?.name}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Emergency Reports</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between bg-slate-50 rounded-lg p-2.5"><span className="text-slate-600">Today Visits</span><span className="font-bold">{reports?.register?.todayTotal ?? "-"}</span></div>
            <div className="flex justify-between bg-slate-50 rounded-lg p-2.5"><span className="text-slate-600">This Week</span><span className="font-bold">{reports?.register?.weekTotal ?? "-"}</span></div>
            <div className="flex justify-between bg-red-50 rounded-lg p-2.5"><span className="text-red-700">Critical Today</span><span className="font-bold text-red-700">{reports?.critical?.today ?? "-"}</span></div>
            <div className="flex justify-between bg-emerald-50 rounded-lg p-2.5"><span className="text-emerald-700">Admitted Today</span><span className="font-bold">{reports?.flow?.admittedFromER ?? "-"}</span></div>
            <div className="flex justify-between bg-slate-50 rounded-lg p-2.5"><span className="text-slate-600">Discharged Today</span><span className="font-bold">{reports?.flow?.dischargedFromER ?? "-"}</span></div>
            <div className="flex justify-between bg-blue-50 rounded-lg p-2.5"><span className="text-blue-700">Pending Diagnostics</span><span className="font-bold">{reports?.diagnostics?.pending ?? "-"}</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/emergency/queue" className="flex-1 rounded-lg bg-slate-900 text-white text-center py-2 text-xs font-bold">Queue</Link>
            <button onClick={handlePrintCensus} className="flex-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-2 text-xs font-bold cursor-pointer shadow-xs">Print Census</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <Link to="/emergency/register" className="rounded-xl bg-rose-600 text-white p-3 text-center font-bold">+ Registration</Link>
          <Link to="/emergency/queue" className="rounded-xl bg-slate-900 text-white p-3 text-center font-bold">Start Triage</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Assign Doctor</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Add Vitals</Link>
          <Link to="/emergency/beds" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Bed Management</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mt-2">
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">New Clinical Note</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Order Diagnostic</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Prescribe Medication</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Request Admission</Link>
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 p-3 text-center font-semibold">Discharge</Link>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getEmergencyQueue, getDoctors, assignEmergencyDoctor } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";

const priorityOptions = ["all", "critical", "urgent", "less_urgent", "non_urgent"];
const statusOptions = ["all", "arrived", "registered", "awaiting_triage", "triaged", "awaiting_doctor", "under_assessment", "under_treatment", "awaiting_diagnostics", "under_observation", "admitted", "discharged", "transferred"];

export default function EmergencyQueuePage() {
  const [encounters, setEncounters] = useState([]);
  const [filters, setFilters] = useState({ priority: "all", status: "all", doctor: "all", location: "", search: "", triageStatus: "all", date: "" });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const timerRef = useRef(null);

  const load = useCallback(async (isSilent = false) => {
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
  }, [filters]);

  useEffect(() => {
    getDoctors().then(r => setDoctors(r.doctors || [])).catch(() => {});
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

  const criticalCount = encounters.filter(e => e.priority === "critical").length;
  const untriagedCount = encounters.filter(e => e.triageStatus === "awaiting_triage").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">Emergency Queue</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
              LIVE • {total} active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time triage, resuscitation and observation queue</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5 transition ${autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
            {autoRefresh ? "Auto-Refresh ON (15s)" : "Auto-Refresh Paused"}
          </button>
          <Link to="/emergency/register" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition">+ Register</Link>
          <Link to="/emergency/dashboard" className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold">Dashboard</Link>
          <button onClick={() => load()} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold">Refresh</button>
        </div>
      </div>

      {/* Quick Filter Pill Badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setFilters(f => ({ ...f, priority: "all", triageStatus: "all", status: "all" }))}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filters.priority === "all" && filters.triageStatus === "all" && filters.status === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          All Encounters ({encounters.length})
        </button>
        <button
          onClick={() => setFilters(f => ({ ...f, priority: "critical", triageStatus: "all", status: "all" }))}
          className={`px-3 py-1.5 rounded-full font-bold border transition flex items-center gap-1.5 ${filters.priority === "critical" ? "bg-rose-600 text-white border-rose-700" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
          Critical / STAT ({criticalCount})
        </button>
        <button
          onClick={() => setFilters(f => ({ ...f, triageStatus: "awaiting_triage", priority: "all", status: "all" }))}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filters.triageStatus === "awaiting_triage" ? "bg-amber-500 text-white border-amber-600" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}`}
        >
          Awaiting Triage ({untriagedCount})
        </button>
        <button
          onClick={() => setFilters(f => ({ ...f, status: "under_treatment", priority: "all", triageStatus: "all" }))}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filters.status === "under_treatment" ? "bg-blue-600 text-white border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
        >
          Under Treatment
        </button>
        <span className="ml-auto text-[11px] text-slate-400 self-center">
          Updated: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            placeholder="Search: patient name, MRN, Emergency ID, Token, phone..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
        </div>
        <button onClick={() => load()} className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] cursor-pointer touch-target">Search</button>
      </div>

      {/* Detailed Filters Bar */}
      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white font-medium text-slate-700">
          {priorityOptions.map(p => <option key={p} value={p}>{p === "all" ? "All Priorities" : p.replace(/_/g, " ")}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white font-medium text-slate-700">
          {statusOptions.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={filters.triageStatus} onChange={e => setFilters(f => ({ ...f, triageStatus: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white font-medium text-slate-700">
          <option value="all">All Triage</option>
          <option value="awaiting_triage">Awaiting Triage</option>
          <option value="triaged">Triaged</option>
        </select>
        <select value={filters.doctor} onChange={e => setFilters(f => ({ ...f, doctor: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white font-medium text-slate-700">
          <option value="all">All Doctors</option>
          {doctors.map(d => <option key={d._id} value={d._id}>{getDoctorDisplayName(d)} ({d.specialization || "ER"})</option>)}
        </select>
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-700" />
        <input value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="rounded-lg border border-slate-200 px-2 py-1.5 bg-white w-28 text-slate-700" />
        {(filters.priority !== "all" || filters.status !== "all" || filters.doctor !== "all" || filters.search || filters.date || filters.location) && (
          <button onClick={() => setFilters({ priority: "all", status: "all", doctor: "all", location: "", search: "", triageStatus: "all", date: "" })} className="text-rose-600 hover:underline font-semibold ml-2">
            Reset
          </button>
        )}
      </div>

      {/* Patient Queue Table */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Token / ID</th>
                <th className="px-3 py-2.5">Patient</th>
                <th className="px-3 py-2.5">Age / Sex</th>
                <th className="px-3 py-2.5">Arrival</th>
                <th className="px-3 py-2.5">Chief Complaint</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Triage</th>
                <th className="px-3 py-2.5">Doctor</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">Loading emergency queue...</td></tr>
              ) : encounters.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No emergency patients matching current filters</td></tr>
              ) : (
                encounters.map(e => {
                  const isCrit = e.priority === "critical";
                  return (
                    <tr key={e._id} className={`hover:bg-slate-50/80 transition ${isCrit ? "bg-rose-50/50 border-l-4 border-l-rose-600" : ""}`}>
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5">
                          {isCrit && <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>}
                          <span>{e.tokenNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">{e.emergencyId}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{e.patient?.name || "Unknown Patient"}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">{e.patient?.patientId || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 tabular-nums">{e.patient?.age ? `${e.patient.age}y` : "-"}</span>
                        <div className="text-[10px] text-slate-500">{e.patient?.gender || "-"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                        {new Date(e.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        <div className="text-[10px] text-slate-400">{new Date(e.arrivalTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate text-slate-700" title={e.chiefComplaint}>
                        {e.chiefComplaint}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {e.priority === "critical" ? (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-700 shadow-xs">Critical</span>
                        ) : e.priority === "urgent" ? (
                          <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-600">Urgent</span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{e.priority.replace(/_/g, " ")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${e.triageStatus === "triaged" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {(e.triageStatus || "awaiting_triage").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {e.assignedDoctor ? (
                          <span className="font-semibold text-slate-800">{getDoctorDisplayName(e.assignedDoctor)}</span>
                        ) : e.assignedDoctorName ? (
                          <span className="text-slate-700">{e.assignedDoctorName}</span>
                        ) : (
                          <select
                            onChange={ev => handleQuickAssign(e._id, ev.target.value)}
                            defaultValue=""
                            className="rounded-md border border-dashed border-slate-300 px-1.5 py-1 text-[11px] bg-white text-slate-500"
                          >
                            <option value="" disabled>+ Assign</option>
                            {doctors.map(d => <option key={d._id} value={d._id}>{getDoctorDisplayName(d)}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border">
                          {(e.status || "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <Link
                          to={`/emergency/patients/${e._id}`}
                          className="inline-flex items-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-[11px] font-bold transition shadow-xs"
                        >
                          Open Profile →
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
    </div>
  );
}

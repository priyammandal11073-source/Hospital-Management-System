import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminEmergencyOperations } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

const TRIAGE_BADGES = {
  Immediate: "bg-rose-600 text-white font-black animate-pulse",
  Urgent: "bg-amber-500 text-white font-bold",
  Delayed: "bg-blue-600 text-white font-medium",
  Minor: "bg-emerald-600 text-white font-medium",
};

export default function EmergencyOperationsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminEmergencyOperations();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load ER operations data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000); // 30s live telemetry refresh
    return () => clearInterval(timer);
  }, []);

  const metrics = data?.metrics || {
    emergencyBedsAvailable: 0,
    emergencyBedsTotal: 0,
    emergencyOccupancyPct: 0,
    icuBedsAvailable: 0,
    icuBedsTotal: 0,
    activeEmergencyAdmissionsCount: 0,
  };

  const activeAdmissions = data?.activeAdmissions || [];
  const ambulanceFleet = data?.ambulanceFleet || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>24/7 Critical Care</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Emergency Department & Trauma Command</span>
            <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ER triage, critical care bed reserves, fleet dispatch, and institutional emergency response status.
          </p>
        </div>

        {/* Emergency Hotline Box */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs text-rose-900 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-extrabold text-[11px] uppercase tracking-wider text-rose-700">Hospital Emergency Hotline</p>
            <p className="font-mono text-sm font-black text-rose-900">108 / 112 • Trauma Desk Ext: 911</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Critical Telemetry Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <p className="text-xs font-semibold text-slate-500">Emergency Beds Free</p>
          <p className="mt-2 text-3xl font-black text-rose-600 tracking-tight">
            {metrics.emergencyBedsAvailable} <span className="text-base text-slate-400 font-normal">/ {metrics.emergencyBedsTotal}</span>
          </p>
          <div className="mt-2 text-[11px] font-semibold text-slate-600">
            {metrics.emergencyOccupancyPct}% ER occupancy
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <p className="text-xs font-semibold text-slate-500">ICU Reserve Beds</p>
          <p className="mt-2 text-3xl font-black text-purple-700 tracking-tight">
            {metrics.icuBedsAvailable} <span className="text-base text-slate-400 font-normal">/ {metrics.icuBedsTotal}</span>
          </p>
          <div className="mt-2 text-[11px] font-semibold text-purple-600">
            Critical life-support units
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <p className="text-xs font-semibold text-slate-500">Active ER Cases</p>
          <p className="mt-2 text-3xl font-black text-amber-600 tracking-tight">
            {metrics.activeEmergencyAdmissionsCount}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-amber-600">
            Patients currently in resuscitation / triage
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <p className="text-xs font-semibold text-slate-500">Ambulance Readiness</p>
          <p className="mt-2 text-3xl font-black text-emerald-600 tracking-tight">
            {ambulanceFleet.filter((a) => a.status === "available").length} <span className="text-base text-slate-400 font-normal">/ {ambulanceFleet.length}</span>
          </p>
          <div className="mt-2 text-[11px] font-semibold text-emerald-600">
            Vehicles stationed at base
          </div>
        </div>
      </div>

      {/* Grid: Active ER Cases & Fleet Dispatch */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Emergency Admissions */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Trauma & ER Patients</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live emergency intake telemetry</p>
            </div>
            <Link to="/beds" className="text-xs font-bold text-rose-600 hover:underline">
              Bed Layout Map →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5">Patient / Bed</th>
                  <th className="py-2.5">Triage Level</th>
                  <th className="py-2.5">Chief Complaint</th>
                  <th className="py-2.5">Admitted Time</th>
                  <th className="py-2.5">Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No active emergency trauma cases currently under treatment.
                    </td>
                  </tr>
                ) : (
                  activeAdmissions.map((adm) => (
                    <tr key={adm._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{adm.patient?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Bed: {adm.bedNumber || "ER Bay"}
                        </p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${TRIAGE_BADGES[adm.triageLevel || "Urgent"] || "bg-slate-100 text-slate-700"}`}>
                          {adm.triageLevel || "Urgent"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {adm.chiefComplaint || "Acute trauma / chest pain"}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-500">
                        {adm.admissionDate ? new Date(adm.admissionDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                      </td>
                      <td className="py-3 text-slate-700 font-semibold">
                        {adm.doctor?.name ? formatDoctorName(adm.doctor.name) : "ER Specialist on Duty"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ambulance Fleet Tracker */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <h2 className="text-sm font-bold text-slate-900">Hospital Ambulance Fleet</h2>
          <p className="text-xs text-slate-400 mt-0.5">Emergency mobile units status</p>

          <div className="mt-4 space-y-3">
            {ambulanceFleet.map((amb) => (
              <div
                key={amb.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{amb.regNumber}</span>
                    <span className="text-[10px] font-semibold text-slate-500 capitalize">({amb.type})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Driver: {amb.driver} • <span className="font-mono">{amb.contact}</span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${
                    amb.status === "available"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
                      : amb.status === "on_call"
                      ? "bg-rose-50 text-rose-700 ring-rose-500/20 animate-pulse"
                      : "bg-slate-100 text-slate-600 ring-slate-400/20"
                  }`}
                >
                  {amb.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white text-xs space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-rose-400">
              <span>⚠️</span> Code Protocols Active
            </p>
            <p className="text-[11px] text-slate-300">
              <strong>Code Blue:</strong> Cardiac arrest resuscitation team ready.
            </p>
            <p className="text-[11px] text-slate-300">
              <strong>Code Red:</strong> Fire evacuation plan in compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

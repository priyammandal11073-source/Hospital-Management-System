import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getBeds, dischargeBed } from "../../services/api.js";

const WARD_BADGES = {
  icu: "bg-purple-100 text-purple-800 font-extrabold",
  emergency: "bg-rose-100 text-rose-800 font-bold",
  general: "bg-blue-100 text-blue-800 font-medium",
  pediatric: "bg-teal-100 text-teal-800 font-medium",
  maternity: "bg-pink-100 text-pink-800 font-medium",
};

export default function AdmissionsManagementPage() {
  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [wardFilter, setWardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("occupied"); // 'occupied' | 'available' | 'All'

  const loadBeds = async () => {
    setIsLoading(true);
    try {
      const res = await getBeds();
      setBeds(res.beds || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inpatient admissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const handleDischarge = async (bedId, patientName) => {
    if (!window.confirm(`Initiate clinical discharge for ${patientName}?`)) return;
    try {
      await dischargeBed(bedId);
      setSuccessMsg(`Patient ${patientName} discharged and bed queued for housekeeping.`);
      loadBeds();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process discharge.");
    }
  };

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchWard = wardFilter === "All" || b.wardType?.toLowerCase() === wardFilter.toLowerCase();
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      return matchWard && matchStatus;
    });
  }, [beds, wardFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.status === "occupied").length;
    const available = beds.filter((b) => b.status === "available").length;
    const icuOccupied = beds.filter((b) => b.wardType?.toLowerCase() === "icu" && b.status === "occupied").length;
    const icuTotal = beds.filter((b) => b.wardType?.toLowerCase() === "icu").length;
    return { total, occupied, available, icuOccupied, icuTotal };
  }, [beds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Inpatient Care</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Inpatient Admissions & Ward Census</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {stats.occupied} Inpatients
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inpatient tracking, bed allocation, department ward transfers, and clinical discharge governance.
          </p>
        </div>

        <Link
          to="/beds"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <span>🛏️</span>
          <span>Open Interactive Bed Map</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold">✕</button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">Active Inpatients</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.occupied}</p>
          <span className="text-[10px] text-purple-600 font-medium">Beds occupied</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Available Beds</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.available}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Ready for admission</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">ICU Bed Census</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.icuOccupied} / {stats.icuTotal}</p>
          <span className="text-[10px] text-rose-600 font-medium">Critical care units</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Facility Beds</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500">Across all wings</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Ward:</span>
          {["All", "general", "icu", "emergency", "pediatric", "maternity"].map((w) => (
            <button
              key={w}
              onClick={() => setWardFilter(w)}
              className={`rounded-lg px-2.5 py-1 capitalize font-semibold transition ${
                wardFilter === w ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs focus:outline-none"
          >
            <option value="occupied">Occupied (Admitted Patients)</option>
            <option value="available">Vacant & Ready</option>
            <option value="All">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Bed & Room</th>
                <th className="px-4 py-3">Ward Type</th>
                <th className="px-4 py-3">Patient Admitted</th>
                <th className="px-4 py-3">Admission Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    Loading inpatient census...
                  </td>
                </tr>
              ) : filteredBeds.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No beds matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBeds.map((bed) => (
                  <tr key={bed._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">Bed {bed.bedNumber}</p>
                      <p className="text-[11px] text-slate-400">Room {bed.roomNumber || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${WARD_BADGES[bed.wardType?.toLowerCase()] || "bg-slate-100 text-slate-700"}`}>
                        {bed.wardType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {bed.currentPatient ? (
                        <div>
                          <p className="font-bold text-slate-800">{bed.currentPatient.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {bed.currentPatient.contactNumber || bed.currentPatient.email || "Reg. Patient"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Patient Assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {bed.admissionDate
                        ? new Date(bed.admissionDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${
                          bed.status === "occupied"
                            ? "bg-purple-50 text-purple-700 ring-purple-500/20"
                            : bed.status === "available"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
                            : "bg-amber-50 text-amber-700 ring-amber-500/20"
                        }`}
                      >
                        {bed.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bed.status === "occupied" && bed.currentPatient && (
                        <button
                          onClick={() => handleDischarge(bed._id, bed.currentPatient.name)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition"
                        >
                          Discharge
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

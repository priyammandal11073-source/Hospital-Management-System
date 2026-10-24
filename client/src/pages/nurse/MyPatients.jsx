import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getInpatientsWithCare } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import PatientClinicalProfileModal from "../../components/nurse/PatientClinicalProfileModal.jsx";

const WARDS = [
  "All Wards",
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

export default function MyPatients() {
  const [searchParams] = useSearchParams();
  const [inpatients, setInpatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState(() => searchParams.get("ward") || "All Wards");
  const [riskFilter, setRiskFilter] = useState(() => searchParams.get("risk") || "All");
  const [sortBy, setSortBy] = useState("bedNumber");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const risk = searchParams.get("risk");
    if (risk) setRiskFilter(risk);
    const ward = searchParams.get("ward");
    if (ward) setWardFilter(ward);
  }, [searchParams]);

  useEffect(() => {
    let isCurrent = true;
    const fetchInpatients = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getInpatientsWithCare();
        if (isCurrent) setInpatients(data.inpatients || []);
      } catch (err) {
        if (isCurrent) setError(err.response?.data?.message || "Failed to fetch inpatients");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchInpatients();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const filteredPatients = useMemo(() => {
    return inpatients
      .filter((item) => {
        if (wardFilter !== "All Wards" && item.ward !== wardFilter) return false;
        if (riskFilter !== "All" && item.riskLevel !== riskFilter) return false;
        if (search.trim()) {
          const s = search.toLowerCase();
          const pName = item.patient?.name?.toLowerCase() || "";
          const pAbha = item.patient?.abhaId?.toLowerCase() || "";
          const bed = item.bedNumber?.toLowerCase() || "";
          const diag = item.admissionReason?.toLowerCase() || "";
          const doc = item.attendingDoctor?.name?.toLowerCase() || "";
          return pName.includes(s) || pAbha.includes(s) || bed.includes(s) || diag.includes(s) || doc.includes(s);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "risk") {
          const score = { Critical: 4, High: 3, Moderate: 2, Stable: 1 };
          return (score[b.riskLevel] || 0) - (score[a.riskLevel] || 0);
        }
        if (sortBy === "name") {
          return (a.patient?.name || "").localeCompare(b.patient?.name || "");
        }
        if (sortBy === "admission") {
          return new Date(b.admittedAt) - new Date(a.admittedAt);
        }
        return (a.bedNumber || "").localeCompare(b.bedNumber || "");
      });
  }, [inpatients, search, wardFilter, riskFilter, sortBy]);

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case "Moderate":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Inpatients & Clinical Care Roster
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Admitted patients across all hospital wards under clinical nursing management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            ↻ Refresh Roster
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Search Patient / Bed / Doctor
            </label>
            <input
              type="text"
              placeholder="Search by name, ABHA ID, bed #, diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Ward Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Hospital Ward
            </label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {WARDS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Clinical Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Severity Levels</option>
              <option value="Critical">🚨 Critical Only</option>
              <option value="High">⚠️ High Risk</option>
              <option value="Moderate">Moderate</option>
              <option value="Stable">Stable</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="bedNumber">Bed Number</option>
              <option value="risk">Clinical Risk (Highest)</option>
              <option value="name">Patient Name (A-Z)</option>
              <option value="admission">Admission Date (Recent)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
          <p className="mt-4 text-xs font-medium text-slate-500 animate-pulse">Loading inpatient roster...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filteredPatients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">🛏️</span>
          <h3 className="text-sm font-bold text-slate-800">No inpatients match your search filters</h3>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your ward or severity filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Ward & Bed</th>
                  <th className="px-4 py-3.5">Admission Reason</th>
                  <th className="px-4 py-3.5">Attending Doctor</th>
                  <th className="px-4 py-3.5">Latest Vitals</th>
                  <th className="px-4 py-3.5">Clinical Risk</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((item) => (
                  <tr
                    key={item.bedId}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setSelectedPatientId(item.patient?._id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{item.patient?.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.patient?.age}y / {item.patient?.gender}
                        {" • "}
                        <span className="font-bold text-rose-700">{item.patient?.bloodGroup || "—"}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">{item.patient?.abhaId || "ABDM-TEMP"}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-teal-700 text-xs">{item.bedNumber}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{item.ward}</div>
                      <div className="text-[10px] text-slate-400">{item.floor}</div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="truncate font-medium text-slate-800">{item.admissionReason}</p>
                      <span className="text-[10px] text-slate-400">
                        Admitted {new Date(item.admittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {item.attendingDoctor?.name ? formatDoctorName(item.attendingDoctor.name) : "On-Call"}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.attendingDoctor?.specialization || "General"}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {item.latestVitals ? (
                        <div className="text-[11px] space-y-0.5">
                          <div>
                            BP: <span className="font-semibold">{item.latestVitals.bloodPressureSys}/{item.latestVitals.bloodPressureDia || "—"}</span>
                          </div>
                          <div>
                            SpO2:{" "}
                            <span className={item.latestVitals.spo2 <= 92 ? "text-rose-600 font-bold" : "font-semibold"}>
                              {item.latestVitals.spo2}%
                            </span>
                            {" • "}
                            Pulse: <span className="font-semibold">{item.latestVitals.heartRate}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No vitals yet</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${getRiskBadge(item.riskLevel)}`}>
                        ● {item.riskLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatientId(item.patient?._id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition duration-120 cursor-pointer"
                      >
                        <span>Clinical Chart</span>
                        <span className="opacity-70">→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Clinical Patient Profile Modal */}
      {selectedPatientId && (
        <PatientClinicalProfileModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

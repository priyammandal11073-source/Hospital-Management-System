import { useState, useEffect } from "react";
import { getInpatientsWithCare, getBeds } from "../../services/api.js";
import VitalsTracker from "../../components/VitalsTracker.jsx";
import PatientClinicalProfileModal from "../../components/nurse/PatientClinicalProfileModal.jsx";

export default function PatientMonitoring() {
  const [inpatients, setInpatients] = useState([]);
  const [allBeds, setAllBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeWard, setActiveWard] = useState("All");

  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [inpatientData, bedData] = await Promise.all([
          getInpatientsWithCare(),
          getBeds(),
        ]);
        if (isCurrent) {
          setInpatients(inpatientData.inpatients || []);
          setAllBeds(bedData.beds || []);
        }
      } catch (err) {
        if (isCurrent) setError(err.response?.data?.message || "Failed to load monitoring data");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchData();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const wards = ["All", "ICU (Intensive Care Unit)", "CCU (Critical Care Unit)", "Emergency & Trauma", "General Ward", "Pediatric Ward", "Private Deluxe Room"];

  const filteredInpatients = activeWard === "All"
    ? inpatients
    : inpatients.filter((item) => item.ward === activeWard);

  const getRiskBorder = (risk) => {
    switch (risk) {
      case "Critical":
        return "border-rose-400 bg-rose-50/40 ring-1 ring-rose-400";
      case "High":
        return "border-amber-300 bg-amber-50/30";
      case "Moderate":
        return "border-blue-200 bg-blue-50/20";
      default:
        return "border-slate-200 bg-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bedside Patient Monitoring & Ward Telemetry
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time floor rounds, active bed telemetry, critical vitals flags, and rapid nurse interventions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
        >
          ↻ Refresh Floor
        </button>
      </div>

      {/* Ward Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {wards.map((w) => (
          <button
            key={w}
            onClick={() => setActiveWard(w)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeWard === w
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Grid of Monitored Inpatients */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
          <p className="mt-4 text-xs font-medium text-slate-500 animate-pulse">Scanning inpatient ward telemetry...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : filteredInpatients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">💚</span>
          <h3 className="text-sm font-bold text-slate-800">No inpatients currently admitted in this section</h3>
          <p className="mt-1 text-xs text-slate-500">All beds in this ward are sanitized and available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInpatients.map((item) => (
            <div
              key={item.bedId}
              className={`rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition hover:shadow-md ${getRiskBorder(item.riskLevel)}`}
            >
              <div>
                {/* Bed & Ward Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-teal-800 bg-teal-100/80 border border-teal-300 px-2 py-0.5 rounded-lg">
                      {item.bedNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{item.ward}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.riskLevel === "Critical" ? "bg-rose-100 text-rose-800 animate-pulse" : item.riskLevel === "High" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    ● {item.riskLevel}
                  </span>
                </div>

                {/* Patient Information */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.patient?.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.patient?.age}y / {item.patient?.gender}
                      {" • "}
                      Blood: <span className="font-bold text-rose-700">{item.patient?.bloodGroup}</span>
                    </p>
                  </div>
                  {item.features?.hasVentilator && (
                    <span className="rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5" title="On Ventilator Support">
                      Ventilator
                    </span>
                  )}
                </div>

                {/* Diagnosis */}
                <div className="mt-3 rounded-lg bg-white/80 border border-slate-200/80 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admission Diagnosis</span>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                    {item.admissionReason || "Under Evaluation"}
                  </p>
                </div>

                {/* Vitals Telemetry Box */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <span className="font-bold text-slate-900">
                      {item.latestVitals ? `${item.latestVitals.bloodPressureSys}/${item.latestVitals.bloodPressureDia || ""}` : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <span className={`font-bold ${item.latestVitals?.spo2 <= 92 ? "text-rose-600" : "text-emerald-700"}`}>
                      {item.latestVitals?.spo2 ? `${item.latestVitals.spo2}%` : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <span className="text-[10px] text-slate-400 block">Pulse</span>
                    <span className="font-bold text-slate-900">
                      {item.latestVitals?.heartRate ? `${item.latestVitals.heartRate} bpm` : "—"}
                    </span>
                  </div>
                </div>

                {item.riskReason && item.riskLevel !== "Stable" && (
                  <p className="text-[11px] text-rose-700 font-semibold mt-2 flex items-center gap-1">
                    <span>⚠️</span> {item.riskReason}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setVitalsPatient(item.patient)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 py-1.5 text-xs font-bold text-slate-700 transition"
                >
                  📊 Log Vitals
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId(item.patient?._id)}
                  className="flex-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-1.5 text-xs font-bold transition shadow-2xs"
                >
                  Clinical Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bedside Vitals Logger Modal */}
      {vitalsPatient && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Bedside Vitals: {vitalsPatient.name}
                </h3>
                <p className="text-xs text-slate-500">Record BP, Pulse, SpO2, Temperature & Blood Glucose</p>
              </div>
              <button
                type="button"
                onClick={() => setVitalsPatient(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>
            <VitalsTracker
              vitals={[]}
              patientId={vitalsPatient._id}
              onVitalsUpdated={() => {
                setVitalsPatient(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          </div>
        </div>
      )}

      {/* Patient Clinical Profile Modal */}
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

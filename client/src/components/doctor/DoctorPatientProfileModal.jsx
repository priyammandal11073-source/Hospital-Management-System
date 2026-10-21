import React, { useState, useEffect } from "react";
import { getDoctorPatientProfile } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";

export default function DoctorPatientProfileModal({ patientId, onClose, onStartConsultation }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDoctorPatientProfile(patientId);
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        setError("Unable to load patient clinical data.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient chart.");
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) return null;

  const patient = profileData?.patient || {};
  const allergies = Array.isArray(patient.allergies) ? patient.allergies : (patient.allergies ? [patient.allergies] : []);
  const timeline = profileData?.timeline || [];
  const vitalsHistory = profileData?.vitalsHistory || [];
  const prescriptions = profileData?.prescriptions || [];
  const labReports = profileData?.labReports || [];
  const clinicalNotes = profileData?.clinicalNotes || [];
  const doctorOrders = profileData?.doctorOrders || [];
  const referrals = profileData?.referrals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm text-base">
              {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{patient.name || "Patient Record"}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {patient.patientId || "PID"}
                </span>
                {patient.bloodGroup && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {patient.gender ? `${patient.gender}, ` : ""}{patient.age ? `${patient.age} yrs • ` : ""}Phone: {patient.phone || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStartConsultation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartConsultation(patient._id);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <span>🩺</span>
                <span>Open Consultation</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Allergy Warning Strip */}
        {allergies.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 flex items-center gap-2 text-xs font-bold text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>CRITICAL ALLERGY ALERT:</span>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((alg, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-semibold text-[11px]">
                  {alg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: "overview", label: "Overview & Vitals", icon: "📊" },
            { id: "timeline", label: `Timeline (${timeline.length})`, icon: "⏳" },
            { id: "vitals", label: `Vitals History (${vitalsHistory.length})`, icon: "💓" },
            { id: "prescriptions", label: `Prescriptions (${prescriptions.length})`, icon: "💊" },
            { id: "labs", label: `Lab Reports (${labReports.length})`, icon: "🧪" },
            { id: "notes", label: `Clinical Notes (${clinicalNotes.length})`, icon: "📝" },
            { id: "orders", label: `Orders (${doctorOrders.length})`, icon: "📋" },
            { id: "referrals", label: `Referrals (${referrals.length})`, icon: "⇄" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Loading comprehensive clinical record...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Grid 1: Demographics & Medical History */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Demographics</h3>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <p><span className="font-semibold text-slate-500">Full Name:</span> {patient.name}</p>
                        <p><span className="font-semibold text-slate-500">Age / Gender:</span> {patient.age || "-"} yrs / {patient.gender || "-"}</p>
                        <p><span className="font-semibold text-slate-500">Blood Group:</span> {patient.bloodGroup || "Not specified"}</p>
                        <p><span className="font-semibold text-slate-500">Phone:</span> {patient.phone || "-"}</p>
                        <p><span className="font-semibold text-slate-500">Address:</span> {patient.address || "-"}</p>
                        <p><span className="font-semibold text-slate-500">Emergency Contact:</span> {patient.emergencyContact?.name || "-"} ({patient.emergencyContact?.phone || "-"})</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs md:col-span-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Past Medical History & Chronic Conditions</h3>
                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed min-h-[60px]">
                        {patient.medicalHistory || "No documented past chronic illnesses or surgeries on record."}
                      </div>

                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4 mb-1.5">Known Allergies</h4>
                      {allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {allergies.map((a, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                              ⚠️ {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 font-medium">✓ No known drug or environmental allergies documented.</p>
                      )}
                    </div>
                  </div>

                  {/* Latest Vitals Snapshot */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Latest Recorded Vital Signs</h3>
                      {vitalsHistory[0] && (
                        <span className="text-[11px] text-slate-400">
                          Recorded: {new Date(vitalsHistory[0].recordedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {vitalsHistory[0] ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Blood Pressure</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {vitalsHistory[0].bloodPressureSys || "-"}/{vitalsHistory[0].bloodPressureDia || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">mmHg</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Heart Rate</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {vitalsHistory[0].heartRate || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">bpm</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">SpO2 Oxygen</span>
                          <p className={`text-sm font-bold mt-1 ${vitalsHistory[0].spo2 && vitalsHistory[0].spo2 < 95 ? "text-rose-600" : "text-slate-800"}`}>
                            {vitalsHistory[0].spo2 || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">%</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Temperature</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {vitalsHistory[0].temperature || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">°F</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Blood Sugar</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {vitalsHistory[0].bloodSugar || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">mg/dL</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Weight</span>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {vitalsHistory[0].weight || "-"}
                            <span className="text-[10px] font-normal text-slate-500 ml-1">kg</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No vital signs recorded yet for this patient.</p>
                    )}
                  </div>

                  {/* Active Prescriptions Snapshot */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Active Medications</h3>
                    {prescriptions.length > 0 ? (
                      <div className="space-y-2">
                        {prescriptions.slice(0, 2).map((rx) => (
                          <div key={rx._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800">Rx #{rx.prescriptionNumber} • {rx.diagnosis}</span>
                              <span className="text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {rx.medications?.map((m, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                                  💊 {m.name} ({m.strength || m.dosage}) • {m.frequency} • {m.duration}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No active prescriptions recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TIMELINE */}
              {activeTab === "timeline" && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Longitudinal Clinical History</h3>
                  {timeline.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No clinical history recorded.</p>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                      {timeline.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white ${
                            item.type === "lab" && item.isCritical ? "bg-rose-500 ring-4 ring-rose-100" :
                            item.type === "lab" ? "bg-cyan-500" :
                            item.type === "prescription" ? "bg-indigo-500" :
                            item.type === "vitals" ? "bg-emerald-500" :
                            item.type === "order" ? "bg-amber-500" : "bg-blue-500"
                          }`} />
                          <div className="flex items-baseline justify-between">
                            <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.date ? new Date(item.date).toLocaleString() : ""}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{item.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VITALS FLOWSHEET */}
              {activeTab === "vitals" && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Longitudinal Vitals Flowsheet</h3>
                    <span className="text-xs text-slate-500">{vitalsHistory.length} total entries</span>
                  </div>
                  {vitalsHistory.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No vitals entries recorded.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/75 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Date & Time</th>
                            <th className="px-3 py-2.5">BP (mmHg)</th>
                            <th className="px-3 py-2.5">Pulse (bpm)</th>
                            <th className="px-3 py-2.5">SpO2 (%)</th>
                            <th className="px-3 py-2.5">Temp (°F)</th>
                            <th className="px-3 py-2.5">Sugar (mg/dL)</th>
                            <th className="px-3 py-2.5">Weight (kg)</th>
                            <th className="px-4 py-2.5">Recorded By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {vitalsHistory.map((v) => {
                            const isBpHigh = v.bloodPressureSys >= 140 || v.bloodPressureDia >= 90;
                            const isSpo2Low = v.spo2 && v.spo2 < 95;
                            return (
                              <tr key={v._id} className="hover:bg-slate-50 transition">
                                <td className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">
                                  {new Date(v.recordedAt).toLocaleString()}
                                </td>
                                <td className={`px-3 py-2 font-semibold ${isBpHigh ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                                  {v.bloodPressureSys || "-"}/{v.bloodPressureDia || "-"}
                                </td>
                                <td className="px-3 py-2 text-slate-700">{v.heartRate || "-"}</td>
                                <td className={`px-3 py-2 font-semibold ${isSpo2Low ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                                  {v.spo2 ? `${v.spo2}%` : "-"}
                                </td>
                                <td className="px-3 py-2 text-slate-700">{v.temperature ? `${v.temperature}°F` : "-"}</td>
                                <td className="px-3 py-2 text-slate-700">{v.bloodSugar || "-"}</td>
                                <td className="px-3 py-2 text-slate-700">{v.weight || "-"}</td>
                                <td className="px-4 py-2 text-slate-500 capitalize">{v.recordedBy || "Staff"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PRESCRIPTIONS */}
              {activeTab === "prescriptions" && (
                <div className="space-y-4">
                  {prescriptions.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
                      No prescriptions on record.
                    </div>
                  ) : (
                    prescriptions.map((rx) => (
                      <div key={rx._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {rx.prescriptionNumber}
                            </span>
                            <span className="ml-2 font-semibold text-slate-800 text-xs">Diagnosis: {rx.diagnosis}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Prescribed: {new Date(rx.createdAt).toLocaleDateString()} by {rx.doctor?.name || "Doctor"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {rx.medications?.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                              <div>
                                <p className="font-bold text-slate-800">💊 {m.name} {m.strength && `(${m.strength})`}</p>
                                <p className="text-slate-500 text-[11px]">
                                  Dosage: {m.dosage} • Route: {m.route || "Oral"} • Timing: {m.timing || "After food"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-slate-700">{m.frequency}</span>
                                <p className="text-slate-400 text-[11px]">Duration: {m.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {rx.advice && (
                          <p className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
                            <span className="font-semibold text-amber-900">Advice: </span>{rx.advice}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: LAB REPORTS */}
              {activeTab === "labs" && (
                <div className="space-y-4">
                  {labReports.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
                      No lab investigations found.
                    </div>
                  ) : (
                    labReports.map((report) => (
                      <div key={report._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-800">{report.testName}</h4>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {report.reportNumber}
                            </span>
                            {report.isCritical && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                CRITICAL RESULT
                              </span>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            report.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                            report.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {report.status}
                          </span>
                        </div>

                        {report.testResults && report.testResults.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                                <tr>
                                  <th className="px-3 py-1.5">Parameter</th>
                                  <th className="px-3 py-1.5">Result</th>
                                  <th className="px-3 py-1.5">Unit</th>
                                  <th className="px-3 py-1.5">Reference Range</th>
                                  <th className="px-3 py-1.5">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {report.testResults.map((t, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-1.5 font-medium text-slate-700">{t.parameter}</td>
                                    <td className={`px-3 py-1.5 font-bold ${t.status === "critical" || t.status === "high" ? "text-rose-600" : "text-slate-800"}`}>
                                      {t.result}
                                    </td>
                                    <td className="px-3 py-1.5 text-slate-500">{t.unit}</td>
                                    <td className="px-3 py-1.5 text-slate-500">{t.referenceRange}</td>
                                    <td className="px-3 py-1.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        t.status === "normal" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                                      }`}>
                                        {t.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {report.summaryConclusion && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-700">Conclusion: </span>{report.summaryConclusion}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: CLINICAL NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  {clinicalNotes.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
                      No clinical notes documented yet.
                    </div>
                  ) : (
                    clinicalNotes.map((note) => (
                      <div key={note._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-xs">
                            {note.noteType} Note • {getDoctorDisplayName({ name: note.doctorName })}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {note.chiefComplaint && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">Chief Complaint</span>
                              <p className="text-slate-800 mt-1">{note.chiefComplaint}</p>
                            </div>
                          )}
                          {note.diagnosis && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">Assessment / Diagnosis</span>
                              <p className="text-slate-800 font-semibold mt-1">{note.diagnosis}</p>
                            </div>
                          )}
                          {note.examination && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">Examination</span>
                              <p className="text-slate-800 mt-1">{note.examination}</p>
                            </div>
                          )}
                          {note.treatmentPlan && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">Treatment Plan</span>
                              <p className="text-slate-800 mt-1">{note.treatmentPlan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 7: DOCTOR ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {doctorOrders.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
                      No clinical orders placed for this patient.
                    </div>
                  ) : (
                    doctorOrders.map((ord) => (
                      <div key={ord._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{ord.orderType}: {ord.description}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.priority === "STAT" ? "bg-rose-100 text-rose-800" :
                              ord.priority === "Urgent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              {ord.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ordered by {getDoctorDisplayName({ name: ord.doctorName })} on {new Date(ord.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {ord.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 8: REFERRALS */}
              {activeTab === "referrals" && (
                <div className="space-y-3">
                  {referrals.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
                      No specialist referrals documented for this patient.
                    </div>
                  ) : (
                    referrals.map((ref) => (
                      <div key={ref._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            To: {getDoctorDisplayName({ name: ref.specialistDoctorName })} ({ref.department})
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {ref.status}
                          </span>
                        </div>
                        <p className="text-slate-600"><span className="font-semibold">Reason:</span> {ref.reason}</p>
                        {ref.clinicalSummary && (
                          <p className="text-slate-500 text-[11px] bg-slate-50 p-2 rounded">
                            {ref.clinicalSummary}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Referred by {getDoctorDisplayName({ name: ref.referringDoctorName })} on {new Date(ref.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Nivora Care Hospital Clinical Chart System</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
}

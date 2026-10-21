import { useState, useEffect } from "react";
import { getClinicalPatientProfile } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function PatientClinicalProfileModal({ patientId, onClose, onRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let isCurrent = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getClinicalPatientProfile(patientId);
        if (isCurrent) setProfile(data);
      } catch (err) {
        if (isCurrent) setError(err.response?.data?.message || "Failed to load clinical profile.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    if (patientId) fetchProfile();
    return () => { isCurrent = false; };
  }, [patientId]);

  if (!patientId) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "vitals", label: "Vitals History", icon: "📊" },
    { id: "medications", label: "Medications & eMAR", icon: "💊" },
    { id: "notes", label: "Nursing Notes", icon: "📝" },
    { id: "orders", label: "Doctor Orders", icon: "🩺" },
    { id: "lab", label: "Investigations", icon: "🧪" },
    { id: "intakeOutput", label: "Intake & Output", icon: "💧" },
    { id: "tasks", label: "Care Tasks", icon: "✅" },
    { id: "transfers", label: "Transfers", icon: "⇄" },
  ];

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Moderate":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-lg shadow-2xs">
              {profile?.patient?.name ? profile.patient.name.charAt(0) : "P"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {profile?.patient?.name || "Patient Clinical Profile"}
                </h2>
                {profile?.clinicalSummary?.riskLevel && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getRiskBadge(profile.clinicalSummary.riskLevel)}`}>
                    ● {profile.clinicalSummary.riskLevel} Risk
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ABHA ID: <span className="font-mono font-medium text-slate-700">{profile?.patient?.abhaId || "ABDM-NOT-LINKED"}</span>
                {" • "}
                Age/Gender: <span className="font-medium text-slate-700">{profile?.patient?.age}y / {profile?.patient?.gender}</span>
                {" • "}
                Blood Group: <span className="font-bold text-rose-700">{profile?.patient?.bloodGroup || "—"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            title="Close Profile"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "border-teal-600 text-teal-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
              <p className="mt-4 text-xs font-medium text-slate-500 animate-pulse">Loading clinical patient record...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : profile ? (
            <div>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Critical Allergy Alert Banner */}
                  {profile.patient.allergies && profile.patient.allergies.length > 0 && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                          Known Drug & Food Allergies:
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {profile.patient.allergies.map((allergy, i) => (
                            <span key={i} className="rounded-md bg-rose-200 px-2 py-0.5 text-xs font-bold text-rose-900">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bed & Admission Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ward & Location</span>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {profile.activeBed?.ward || "Outpatient / Unassigned"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bed: <span className="font-mono font-bold text-teal-700">{profile.activeBed?.bedNumber || "—"}</span>
                        {" • "}
                        Floor: {profile.activeBed?.floor || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attending Doctor</span>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {profile.activeBed?.currentAdmission?.attendingDoctor?.name
                          ? formatDoctorName(profile.activeBed.currentAdmission.attendingDoctor.name)
                          : "Primary Physician"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {profile.activeBed?.currentAdmission?.attendingDoctor?.specialization || "General Medicine"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admission Date</span>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {profile.activeBed?.currentAdmission?.admittedAt
                          ? new Date(profile.activeBed.currentAdmission.admittedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Outpatient"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Diagnosis: {profile.activeBed?.currentAdmission?.admissionReason || "Under Evaluation"}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Baseline & Vitals Glance */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Latest Bedside Vital Signs
                    </h3>
                    {profile.vitals && profile.vitals.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Blood Pressure</span>
                          <span className="text-base font-bold text-slate-900">
                            {profile.vitals[0].bloodPressureSys}/{profile.vitals[0].bloodPressureDia || "—"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">mmHg</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Pulse / Heart Rate</span>
                          <span className="text-base font-bold text-slate-900">{profile.vitals[0].heartRate || "—"}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">bpm</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Oxygen (SpO2)</span>
                          <span className={`text-base font-bold ${profile.vitals[0].spo2 <= 92 ? "text-rose-600" : "text-emerald-700"}`}>
                            {profile.vitals[0].spo2 ? `${profile.vitals[0].spo2}%` : "—"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Room air</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Temperature</span>
                          <span className="text-base font-bold text-slate-900">{profile.vitals[0].temperature || "—"}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">°F</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Blood Sugar</span>
                          <span className="text-base font-bold text-slate-900">{profile.vitals[0].bloodSugar || "—"}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">mg/dL</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">Pain Score (0-10)</span>
                          <span className="text-base font-bold text-indigo-700">{profile.vitals[0].painScore ?? "—"}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">NRS Scale</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No vitals logged yet.</p>
                    )}
                  </div>

                  {/* Medical History */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Chronic Conditions & Medical History
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.patient.medicalHistory && profile.patient.medicalHistory.length > 0 ? (
                        profile.patient.medicalHistory.map((h, i) => (
                          <span key={i} className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No recorded chronic conditions.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VITALS HISTORY */}
              {activeTab === "vitals" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Bedside Vitals Longitudinal Flowsheet</h3>
                    <span className="text-xs text-slate-500">{profile.vitals.length} records logged</span>
                  </div>

                  {profile.vitals.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No vitals recorded for this patient.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Time Recorded</th>
                            <th className="px-4 py-3">BP (Sys/Dia)</th>
                            <th className="px-4 py-3">Pulse</th>
                            <th className="px-4 py-3">SpO2</th>
                            <th className="px-4 py-3">Temp</th>
                            <th className="px-4 py-3">Sugar</th>
                            <th className="px-4 py-3">Resp Rate</th>
                            <th className="px-4 py-3">Pain (0-10)</th>
                            <th className="px-4 py-3">Staff</th>
                            <th className="px-4 py-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.vitals.map((v) => (
                            <tr key={v._id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                                {new Date(v.recordedAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 py-3 font-semibold">
                                {v.bloodPressureSys ? `${v.bloodPressureSys}/${v.bloodPressureDia || "—"} mmHg` : "—"}
                              </td>
                              <td className="px-4 py-3 font-semibold">{v.heartRate ? `${v.heartRate} bpm` : "—"}</td>
                              <td className="px-4 py-3 font-semibold">
                                <span className={v.spo2 && v.spo2 <= 92 ? "text-rose-600 font-bold" : ""}>
                                  {v.spo2 ? `${v.spo2}%` : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">{v.temperature ? `${v.temperature} °F` : "—"}</td>
                              <td className="px-4 py-3">{v.bloodSugar ? `${v.bloodSugar} mg/dL` : "—"}</td>
                              <td className="px-4 py-3">{v.respiratoryRate ? `${v.respiratoryRate}/min` : "—"}</td>
                              <td className="px-4 py-3 font-bold text-indigo-700">{v.painScore ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-500">{v.recorderName || v.recordedBy}</td>
                              <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{v.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MEDICATIONS & eMAR */}
              {activeTab === "medications" && (
                <div className="space-y-6">
                  {profile.prescriptions.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No prescriptions active for this patient.
                    </div>
                  ) : (
                    profile.prescriptions.map((rx) => (
                      <div key={rx._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-teal-700">{rx.prescriptionNumber}</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              Diagnosis: {rx.diagnosis}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Prescribed by {rx.doctor?.name ? formatDoctorName(rx.doctor.name) : "Doctor"} on{" "}
                              {new Date(rx.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-bold">
                            Active Rx
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Prescribed Medicines:
                          </h5>
                          <div className="space-y-2">
                            {rx.medications.map((med, idx) => (
                              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div>
                                  <span className="text-sm font-bold text-slate-900">{med.name}</span>
                                  <div className="flex gap-2 text-xs text-slate-600 mt-0.5">
                                    <span>Dosage: {med.dosage}</span>
                                    <span>•</span>
                                    <span>Frequency: {med.frequency}</span>
                                    <span>•</span>
                                    <span>Timing: {med.timing}</span>
                                  </div>
                                </div>
                                <span className="rounded bg-teal-100 text-teal-800 px-2 py-0.5 text-xs font-semibold">
                                  {med.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dose Administration Log */}
                        {rx.administrations && rx.administrations.length > 0 && (
                          <div className="pt-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                              eMAR Administration Timeline:
                            </h5>
                            <div className="space-y-1.5">
                              {rx.administrations.map((adm, aIdx) => (
                                <div key={aIdx} className="text-xs p-2 rounded-md bg-white border border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${adm.status === "given" ? "bg-emerald-500" : adm.status === "held" ? "bg-amber-500" : "bg-rose-500"}`}></span>
                                    <span className="font-semibold text-slate-800">{adm.medicationName}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="capitalize font-medium text-slate-600">{adm.status}</span>
                                    {adm.notes && <span className="text-slate-500 italic">({adm.notes})</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {new Date(adm.doseTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    {" by "}
                                    {adm.administeredByName}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: NURSING NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  {profile.nursingNotes.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No nursing notes recorded for this patient.
                    </div>
                  ) : (
                    profile.nursingNotes.map((note) => (
                      <div key={note._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-teal-100 text-teal-800 px-2 py-0.5 text-xs font-bold">
                              {note.category}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Shift: {note.shift}</span>
                            {note.isCritical && (
                              <span className="rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-bold">
                                🚨 Critical Note
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(note.recordedAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">{note.note}</p>
                        {(note.symptomsObserved || note.patientResponse) && (
                          <div className="pt-1 text-xs text-slate-500 space-y-0.5">
                            {note.symptomsObserved && <div>Symptoms: {note.symptomsObserved}</div>}
                            {note.patientResponse && <div>Response: {note.patientResponse}</div>}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 pt-1">
                          Documented by <span className="font-semibold text-slate-600">{note.nurseName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: DOCTOR ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {profile.doctorOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No doctor orders found for this patient.
                    </div>
                  ) : (
                    profile.doctorOrders.map((order) => (
                      <div key={order._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-bold">
                              {order.orderType}
                            </span>
                            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              order.priority === "STAT" ? "bg-rose-100 text-rose-800" : order.priority === "Urgent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              {order.priority}
                            </span>
                            <span className="text-xs text-slate-500">Ordered by {order.doctorName}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{order.description}</p>
                          <div className="text-xs text-slate-400">
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                            {order.acknowledgedByName && ` • Acknowledged by ${order.acknowledgedByName}`}
                          </div>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          order.status === "Completed" ? "bg-emerald-100 text-emerald-800" : order.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: INVESTIGATIONS / LAB */}
              {activeTab === "lab" && (
                <div className="space-y-3">
                  {profile.labReports.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No lab investigations ordered.
                    </div>
                  ) : (
                    profile.labReports.map((lab) => (
                      <div key={lab._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-700">{lab.reportNumber}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">{lab.category}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{lab.testName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Test Date: {new Date(lab.testDate).toLocaleDateString("en-IN")}
                            {lab.notes && ` • ${lab.notes}`}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          lab.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {lab.status.replace("_", " ")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 7: INTAKE & OUTPUT */}
              {activeTab === "intakeOutput" && (
                <div className="space-y-4">
                  {profile.intakeOutput.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No fluid intake/output records logged.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Date & Time</th>
                            <th className="px-4 py-3">Intake Type</th>
                            <th className="px-4 py-3">Intake (ml)</th>
                            <th className="px-4 py-3">Output Type</th>
                            <th className="px-4 py-3">Output (ml)</th>
                            <th className="px-4 py-3">Recorded By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profile.intakeOutput.map((io) => (
                            <tr key={io._id}>
                              <td className="px-4 py-3 font-mono">{io.date} {io.time}</td>
                              <td className="px-4 py-3">{io.intakeType}</td>
                              <td className="px-4 py-3 font-bold text-blue-600">+{io.intakeAmountMl} ml</td>
                              <td className="px-4 py-3">{io.outputType}</td>
                              <td className="px-4 py-3 font-bold text-amber-600">-{io.outputAmountMl} ml</td>
                              <td className="px-4 py-3 text-slate-500">{io.recorderName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: TASKS */}
              {activeTab === "tasks" && (
                <div className="space-y-3">
                  {profile.tasks.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No care tasks assigned.
                    </div>
                  ) : (
                    profile.tasks.map((task) => (
                      <div key={task._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-teal-50 text-teal-700 px-2 py-0.5 text-xs font-bold">
                              {task.taskType}
                            </span>
                            <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                              task.priority === "Critical" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{task.title}</h4>
                          <p className="text-xs text-slate-500">{task.description}</p>
                          <span className="text-[11px] text-slate-400">
                            Due: {new Date(task.dueTime).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          task.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 9: TRANSFERS */}
              {activeTab === "transfers" && (
                <div className="space-y-3">
                  {profile.transfers.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No transfer history for this patient.
                    </div>
                  ) : (
                    profile.transfers.map((tr) => (
                      <div key={tr._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                            <span>{tr.fromWard} ({tr.fromBedNumber})</span>
                            <span>→</span>
                            <span className="text-teal-700">{tr.toWard} ({tr.toBedNumber})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Reason: {tr.reason}</p>
                          <span className="text-[11px] text-slate-400">
                            Requested by {tr.requestedByName} on {new Date(tr.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
                          {tr.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

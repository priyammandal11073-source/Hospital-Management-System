import { useState, useEffect } from "react";
import { getInpatientsWithCare, recordPatientVitals, getPatientVitals } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function VitalSignsPage() {
  const [inpatients, setInpatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    bloodPressureSys: "",
    bloodPressureDia: "",
    heartRate: "",
    spo2: "",
    temperature: "",
    bloodSugar: "",
    sugarType: "random",
    respiratoryRate: "",
    weight: "",
    painScore: "0",
    notes: "",
  });

  useEffect(() => {
    const fetchInpatients = async () => {
      setLoading(true);
      try {
        const data = await getInpatientsWithCare();
        const list = data.inpatients || [];
        setInpatients(list);
        if (list.length > 0) {
          setSelectedPatientId(list[0].patient._id);
        }
      } catch (err) {
        setError("Failed to load patients for vitals recording");
      } finally {
        setLoading(false);
      }
    };

    fetchInpatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await getPatientVitals(selectedPatientId);
        setVitalsHistory(res.vitals || []);
      } catch (err) {
        setVitalsHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedPatientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setError("");
    setSuccess("");

    try {
      const payload = {
        patientId: selectedPatientId,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        ...(formData.bloodPressureSys && { bloodPressureSys: Number(formData.bloodPressureSys) }),
        ...(formData.bloodPressureDia && { bloodPressureDia: Number(formData.bloodPressureDia) }),
        ...(formData.heartRate && { heartRate: Number(formData.heartRate) }),
        ...(formData.spo2 && { spo2: Number(formData.spo2) }),
        ...(formData.temperature && { temperature: Number(formData.temperature) }),
        ...(formData.bloodSugar && { bloodSugar: Number(formData.bloodSugar) }),
        sugarType: formData.sugarType,
        ...(formData.respiratoryRate && { respiratoryRate: Number(formData.respiratoryRate) }),
        ...(formData.weight && { weight: Number(formData.weight) }),
        painScore: Number(formData.painScore),
        notes: formData.notes,
      };

      await recordPatientVitals(payload);
      setSuccess("Vital signs recorded into patient medical record.");
      setFormData({
        bloodPressureSys: "",
        bloodPressureDia: "",
        heartRate: "",
        spo2: "",
        temperature: "",
        bloodSugar: "",
        sugarType: "random",
        respiratoryRate: "",
        weight: "",
        painScore: "0",
        notes: "",
      });

      // Reload history
      const res = await getPatientVitals(selectedPatientId);
      setVitalsHistory(res.vitals || []);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vital signs.");
    }
  };

  const selectedInpatient = inpatients.find((item) => item.patient._id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Bedside Vital Signs Documentation & Trend Analysis
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Record clinical vitals, pain score, oxygenation, and monitor physiological trends.
        </p>
      </div>

      {/* Patient Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Select Admitted Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {inpatients.map((item) => (
              <option key={item.patient._id} value={item.patient._id}>
                {item.patient.name} — Bed {item.bedNumber} ({item.ward})
              </option>
            ))}
          </select>
        </div>

        {selectedInpatient && (
          <div className="flex items-center gap-3 text-xs bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block">Location</span>
              <span className="font-bold text-slate-800">{selectedInpatient.ward} / {selectedInpatient.bedNumber}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 text-[10px] block">Attending Doctor</span>
              <span className="font-bold text-slate-800">
                {selectedInpatient.attendingDoctor?.name ? formatDoctorName(selectedInpatient.attendingDoctor.name) : "Attending"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form + Trends Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vitals Form Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <span>📝</span> Record Bedside Measurement
          </h2>

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* BP Systolic & Diastolic */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">BP Systolic (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={formData.bloodPressureSys}
                  onChange={(e) => setFormData({ ...formData, bloodPressureSys: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">BP Diastolic (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={formData.bloodPressureDia}
                  onChange={(e) => setFormData({ ...formData, bloodPressureDia: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Pulse & SpO2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pulse / Heart Rate (bpm)</label>
                <input
                  type="number"
                  placeholder="e.g. 74"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Oxygen (SpO2 %)</label>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={formData.spo2}
                  onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Temp & Respiratory Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Resp Rate (/min)</label>
                <input
                  type="number"
                  placeholder="e.g. 16"
                  value={formData.respiratoryRate}
                  onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Blood Sugar (mg/dL)</label>
                <input
                  type="number"
                  placeholder="e.g. 110"
                  value={formData.bloodSugar}
                  onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Sugar Test Timing</label>
                <select
                  value={formData.sugarType}
                  onChange={(e) => setFormData({ ...formData, sugarType: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="random">Random</option>
                  <option value="fasting">Fasting</option>
                  <option value="postprandial">Postprandial</option>
                </select>
              </div>
            </div>

            {/* Pain Score (0-10) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600">Pain Score (0 - 10 NRS)</label>
                <span className="text-xs font-bold text-teal-700">{formData.painScore} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.painScore}
                onChange={(e) => setFormData({ ...formData, painScore: e.target.value })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (No pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Worst pain)</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Clinical Observation Notes</label>
              <textarea
                rows="2"
                placeholder="Patient response, oxygen titration, pain location..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 text-xs transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] shadow-xs cursor-pointer touch-target"
            >
              Save Vital Signs
            </button>
          </form>
        </div>

        {/* History & Longitudinal Flowsheet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Latest BP</span>
              <span className="text-lg font-black text-slate-900 mt-1 block tabular-nums">
                {vitalsHistory[0]?.bloodPressureSys ? `${vitalsHistory[0].bloodPressureSys}/${vitalsHistory[0].bloodPressureDia}` : "—"}
              </span>
              <span className="text-[10px] text-slate-500">mmHg</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Heart Rate</span>
              <span className="text-lg font-black text-slate-900 mt-1 block tabular-nums">
                {vitalsHistory[0]?.heartRate ? `${vitalsHistory[0].heartRate} bpm` : "—"}
              </span>
              <span className="text-[10px] text-slate-500">Pulse</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">SpO2 Oxygen</span>
              <span className={`text-lg font-black mt-1 block tabular-nums ${vitalsHistory[0]?.spo2 <= 92 ? "text-rose-600 font-bold" : "text-emerald-700"}`}>
                {vitalsHistory[0]?.spo2 ? `${vitalsHistory[0].spo2}%` : "—"}
              </span>
              <span className="text-[10px] text-slate-500">Target &gt; 94%</span>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Temperature</span>
              <span className="text-lg font-black text-slate-900 mt-1 block tabular-nums">
                {vitalsHistory[0]?.temperature ? `${vitalsHistory[0].temperature} °F` : "—"}
              </span>
              <span className="text-[10px] text-slate-500">Oral/Axillary</span>
            </div>
          </div>

          {/* Longitudinal Flowsheet Table / Mobile Cards */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Longitudinal Bedside Flowsheet</h3>

            {loadingHistory ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading vitals flowsheet...</div>
            ) : vitalsHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No vital readings logged for this patient yet. Use the form on the left to record the first measurement.
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Vitals Cards */}
                <div className="block md:hidden space-y-3">
                  {vitalsHistory.map((v) => (
                    <div key={v._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {new Date(v.recordedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {v.recorderName || v.recordedBy}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 text-[10px] block">BP</span>
                          <span className="font-semibold text-slate-800">
                            {v.bloodPressureSys ? `${v.bloodPressureSys}/${v.bloodPressureDia || ""}` : "—"} mmHg
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Pulse</span>
                          <span className="font-semibold text-slate-800">
                            {v.heartRate ? `${v.heartRate} bpm` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">SpO2</span>
                          <span className={`font-bold ${v.spo2 && v.spo2 <= 92 ? "text-rose-600" : "text-emerald-700"}`}>
                            {v.spo2 ? `${v.spo2}%` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Temperature</span>
                          <span className="font-semibold text-slate-800">
                            {v.temperature ? `${v.temperature} °F` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Blood Sugar</span>
                          <span className="font-semibold text-slate-800">
                            {v.bloodSugar ? `${v.bloodSugar} mg/dL` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Pain Score</span>
                          <span className="font-bold text-indigo-700">
                            {v.painScore ?? "—"} / 10
                          </span>
                        </div>
                      </div>
                      {v.notes && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                          <span className="font-semibold text-slate-700">Note:</span> {v.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Flowsheet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Date & Time</th>
                        <th className="px-3 py-2.5">BP</th>
                        <th className="px-3 py-2.5">Pulse</th>
                        <th className="px-3 py-2.5">SpO2</th>
                        <th className="px-3 py-2.5">Temp</th>
                        <th className="px-3 py-2.5">Sugar</th>
                        <th className="px-3 py-2.5">Resp</th>
                        <th className="px-3 py-2.5">Pain</th>
                        <th className="px-3 py-2.5">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vitalsHistory.map((v) => (
                        <tr key={v._id} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                            {new Date(v.recordedAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">
                            {v.bloodPressureSys ? `${v.bloodPressureSys}/${v.bloodPressureDia || ""}` : "—"}
                          </td>
                          <td className="px-3 py-2.5">{v.heartRate ? `${v.heartRate} bpm` : "—"}</td>
                          <td className={`px-3 py-2.5 font-bold ${v.spo2 && v.spo2 <= 92 ? "text-rose-600" : "text-emerald-700"}`}>
                            {v.spo2 ? `${v.spo2}%` : "—"}
                          </td>
                          <td className="px-3 py-2.5">{v.temperature ? `${v.temperature} °F` : "—"}</td>
                          <td className="px-3 py-2.5">{v.bloodSugar ? `${v.bloodSugar} mg/dL` : "—"}</td>
                          <td className="px-3 py-2.5">{v.respiratoryRate ? `${v.respiratoryRate}/min` : "—"}</td>
                          <td className="px-3 py-2.5 font-bold text-indigo-700">{v.painScore ?? "—"}</td>
                          <td className="px-3 py-2.5 text-slate-500">{v.recorderName || v.recordedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

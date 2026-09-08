import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { recordVitals, recordMyVitals, deleteVitals } from "../services/api.js";

export default function VitalsTracker({
  vitals = [],
  patientId,
  isPatient = false,
  onVitalsUpdated,
}) {
  const [activeTab, setActiveTab] = useState("bp"); // 'bp' | 'sugar' | 'weight' | 'pulse'
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    bloodPressureSys: "",
    bloodPressureDia: "",
    bloodSugar: "",
    sugarType: "random",
    weight: "",
    height: "",
    heartRate: "",
    temperature: "",
    spo2: "",
    notes: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isPatient) {
        await recordMyVitals(form);
      } else {
        await recordVitals({ ...form, patient: patientId });
      }
      setShowModal(false);
      setForm({
        bloodPressureSys: "",
        bloodPressureDia: "",
        bloodSugar: "",
        sugarType: "random",
        weight: "",
        height: "",
        heartRate: "",
        temperature: "",
        spo2: "",
        notes: "",
      });
      if (onVitalsUpdated) onVitalsUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vitals.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vital record?")) return;
    try {
      await deleteVitals(id);
      if (onVitalsUpdated) onVitalsUpdated();
    } catch (err) {
      alert("Unable to delete vital record.");
    }
  };

  // Format data chronological for chart (oldest to newest)
  const chartData = [...vitals]
    .reverse()
    .map((v) => ({
      date: new Date(v.recordedAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      time: new Date(v.recordedAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sys: v.bloodPressureSys || null,
      dia: v.bloodPressureDia || null,
      sugar: v.bloodSugar || null,
      weight: v.weight || null,
      heartRate: v.heartRate || null,
      spo2: v.spo2 || null,
      temp: v.temperature || null,
      raw: v,
    }));

  const latest = vitals[0] || {};

  return (
    <div className="space-y-6">
      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* BP */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Blood Pressure</span>
            <span className="text-lg">🩸</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900">
              {latest.bloodPressureSys && latest.bloodPressureDia
                ? `${latest.bloodPressureSys}/${latest.bloodPressureDia}`
                : "—"}
              <span className="text-[11px] font-normal text-slate-400 ml-1">mmHg</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-700 mt-0.5">
              {latest.bloodPressureSys >= 140
                ? "⚠️ Stage 1/2 High"
                : latest.bloodPressureSys
                ? "✅ Normal Range"
                : "No data"}
            </p>
          </div>
        </div>

        {/* Sugar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Blood Sugar</span>
            <span className="text-lg">🍬</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900">
              {latest.bloodSugar ? latest.bloodSugar : "—"}
              <span className="text-[11px] font-normal text-slate-400 ml-1">mg/dL</span>
            </p>
            <p className="text-[10px] font-semibold text-teal-700 mt-0.5 capitalize">
              {latest.sugarType ? `${latest.sugarType}` : "Normal"}
            </p>
          </div>
        </div>

        {/* Weight */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Weight / BMI</span>
            <span className="text-lg">⚖️</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900">
              {latest.weight ? `${latest.weight}` : "—"}
              <span className="text-[11px] font-normal text-slate-400 ml-1">kg</span>
            </p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {latest.height
                ? `Height: ${latest.height} cm`
                : "Track body weight"}
            </p>
          </div>
        </div>

        {/* SpO2 & Pulse */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pulse & SpO2</span>
            <span className="text-lg">🫀</span>
          </div>
          <div className="mt-2">
            <p className="text-xl font-black text-slate-900">
              {latest.heartRate ? `${latest.heartRate}` : "—"}{" "}
              <span className="text-[11px] font-normal text-slate-400">bpm</span>
              <span className="mx-1 text-slate-300">|</span>
              {latest.spo2 ? `${latest.spo2}%` : "—"}
            </p>
            <p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
              {latest.spo2 >= 95 ? "✅ Oxygen Optimal" : latest.spo2 ? "⚠️ Low SpO2" : "Pulse monitor"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Chart Section ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Vitals History & Trends</h3>
            <p className="text-xs text-slate-500">Visual trend charts over recorded timeline</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switches */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("bp")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "bp" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Blood Pressure
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sugar")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "sugar" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Blood Sugar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("weight")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "weight" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Weight
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pulse")}
                className={`px-3 py-1 rounded-lg transition ${
                  activeTab === "pulse" ? "bg-white text-teal-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pulse / SpO2
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm transition"
            >
              + Log Vitals
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <span className="text-4xl block mb-2">📊</span>
            No vitals recorded yet. Click <strong>+ Log Vitals</strong> to add your first reading!
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "bp" ? (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[50, 190]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <ReferenceLine y={120} label="Normal Sys (120)" stroke="#10b981" strokeDasharray="4 4" />
                  <ReferenceLine y={80} label="Normal Dia (80)" stroke="#10b981" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="sys"
                    name="Systolic BP (mmHg)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dia"
                    name="Diastolic BP (mmHg)"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : activeTab === "sugar" ? (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[50, 250]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <ReferenceLine y={140} label="Target Post-Meal (140)" stroke="#10b981" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="sugar"
                    name="Blood Sugar (mg/dL)"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : activeTab === "weight" ? (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis domain={[40, 160]} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (bpm)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO2 (%)"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Vitals History Table ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900">Recorded Readings</h4>
          <span className="text-xs text-slate-500">{vitals.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5">Blood Pressure</th>
                <th className="px-4 py-2.5">Blood Sugar</th>
                <th className="px-4 py-2.5">Weight</th>
                <th className="px-4 py-2.5">Heart Rate / SpO2</th>
                <th className="px-4 py-2.5">Logged By</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vitals.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {new Date(v.recordedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {new Date(v.recordedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                    {v.bloodPressureSys && v.bloodPressureDia
                      ? `${v.bloodPressureSys}/${v.bloodPressureDia} mmHg`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {v.bloodSugar ? (
                      <span className="font-bold">
                        {v.bloodSugar} mg/dL{" "}
                        <span className="text-[10px] text-slate-400 capitalize">({v.sugarType})</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {v.weight ? `${v.weight} kg` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {v.heartRate ? `${v.heartRate} bpm` : "—"} ·{" "}
                    {v.spo2 ? `${v.spo2}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 capitalize whitespace-nowrap">
                    {v.recorderName || v.recordedBy}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!isPatient && (
                      <button
                        type="button"
                        onClick={() => handleDelete(v._id)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: LOG VITALS ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Record Patient Vitals</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the health metrics and vital readings below.
            </p>

            {error && (
              <p className="mb-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-800">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Blood Pressure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    name="bloodPressureSys"
                    placeholder="e.g. 120"
                    value={form.bloodPressureSys}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    name="bloodPressureDia"
                    placeholder="e.g. 80"
                    value={form.bloodPressureDia}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Blood Sugar (mg/dL)
                  </label>
                  <input
                    type="number"
                    name="bloodSugar"
                    placeholder="e.g. 110"
                    value={form.bloodSugar}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sugar Type</label>
                  <select
                    name="sugarType"
                    value={form.sugarType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none bg-white"
                  >
                    <option value="fasting">Fasting</option>
                    <option value="postprandial">Postprandial (After Meal)</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    placeholder="e.g. 70.5"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="e.g. 175"
                    value={form.height}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Heart Rate, Temperature, SpO2 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    name="heartRate"
                    placeholder="e.g. 72"
                    value={form.heartRate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="e.g. 98.6"
                    value={form.temperature}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    name="spo2"
                    placeholder="e.g. 98"
                    value={form.spo2}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional observation or symptoms..."
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                disabled={submitting}
                type="submit"
                className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold py-2.5 text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Vitals Reading"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

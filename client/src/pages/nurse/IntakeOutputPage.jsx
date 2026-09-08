import { useState, useEffect } from "react";
import { getInpatientsWithCare, getIntakeOutputRecords, createIntakeOutputRecord } from "../../services/api.js";

const INTAKE_TYPES = ["Oral Fluids", "IV Fluids", "Feeding Tube", "Blood Products", "Total Parenteral Nutrition", "Other", "None"];
const OUTPUT_TYPES = ["Urine", "Vomit", "Drainage", "Bowel / Stool", "Aspiration", "Other", "None"];

export default function IntakeOutputPage() {
  const [inpatients, setInpatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [records, setRecords] = useState([]);
  const [totals, setTotals] = useState({ totalIntakeMl: 0, totalOutputMl: 0, fluidBalanceMl: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [dateFilter, setDateFilter] = useState("today"); // "today" | "all"

  const [form, setForm] = useState({
    time: "",
    intakeType: "Oral Fluids",
    intakeAmountMl: "",
    intakeNotes: "",
    outputType: "Urine",
    outputAmountMl: "",
    outputNotes: "",
  });

  useEffect(() => {
    const fetchInpatients = async () => {
      try {
        const data = await getInpatientsWithCare();
        const list = data.inpatients || [];
        setInpatients(list);
        if (list.length > 0) {
          setSelectedPatientId(list[0].patient._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInpatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;

    let isCurrent = true;
    const fetchRecords = async () => {
      setLoading(true);
      setError("");
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const params = { patientId: selectedPatientId };
        if (dateFilter === "today") params.date = todayStr;

        const data = await getIntakeOutputRecords(params);
        if (isCurrent) {
          setRecords(data.records || []);
          setTotals(data.totals || { totalIntakeMl: 0, totalOutputMl: 0, fluidBalanceMl: 0 });
        }
      } catch (err) {
        if (isCurrent) setError("Failed to load fluid intake/output records");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchRecords();
    return () => { isCurrent = false; };
  }, [selectedPatientId, dateFilter, refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setError("");
    setSuccess("");
    try {
      await createIntakeOutputRecord({
        patient: selectedPatientId,
        date: new Date().toISOString().split("T")[0],
        time: form.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        intakeType: form.intakeType,
        intakeAmountMl: Number(form.intakeAmountMl) || 0,
        intakeNotes: form.intakeNotes,
        outputType: form.outputType,
        outputAmountMl: Number(form.outputAmountMl) || 0,
        outputNotes: form.outputNotes,
      });

      setSuccess("Fluid intake & output logged.");
      setForm({
        time: "",
        intakeType: "Oral Fluids",
        intakeAmountMl: "",
        intakeNotes: "",
        outputType: "Urine",
        outputAmountMl: "",
        outputNotes: "",
      });
      setRefreshKey((k) => k + 1);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log intake/output record");
    }
  };

  const selectedInpatient = inpatients.find((item) => item.patient._id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Fluid Intake & Output Balance Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track parenteral and enteral fluid administration, urine and drainage excretion, and net 24-hour hydration balance.
        </p>
      </div>

      {/* Patient Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Select Inpatient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {inpatients.map((item) => (
              <option key={item.patient._id} value={item.patient._id}>
                {item.patient.name} — Bed {item.bedNumber} ({item.ward})
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDateFilter("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "today"
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Today's 24H Shift
          </button>
          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              dateFilter === "all"
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Dates
          </button>
        </div>
      </div>

      {/* 3 Calculated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Intake (Fluid In)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-900">+{totals.totalIntakeMl}</span>
            <span className="text-xs font-bold text-blue-700">ml</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-600">IV infusions, oral drinks, feeding tube</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Output (Fluid Out)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900">-{totals.totalOutputMl}</span>
            <span className="text-xs font-bold text-amber-700">ml</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600">Urine catheter, vomit, surgical drain</p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-2xs ${
          totals.fluidBalanceMl >= 0 ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            totals.fluidBalanceMl >= 0 ? "text-emerald-700" : "text-rose-700"
          }`}>
            Net Fluid Balance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${
              totals.fluidBalanceMl >= 0 ? "text-emerald-900" : "text-rose-900"
            }`}>
              {totals.fluidBalanceMl > 0 ? `+${totals.fluidBalanceMl}` : totals.fluidBalanceMl}
            </span>
            <span className="text-xs font-bold">ml</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {totals.fluidBalanceMl >= 0 ? "Positive hydration retention" : "Negative fluid deficit"}
          </p>
        </div>
      </div>

      {/* Main Grid: Form + Flowsheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <span>💧</span> Log Intake / Output
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
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Time of Log</label>
              <input
                type="text"
                placeholder="e.g. 10:30 AM"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Intake Box */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
              <span className="text-xs font-bold text-blue-900 block">Intake (Fluid Given)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-blue-700 block mb-0.5">Type</label>
                  <select
                    value={form.intakeType}
                    onChange={(e) => setForm({ ...form, intakeType: e.target.value })}
                    className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {INTAKE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-blue-700 block mb-0.5">Amount (ml)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={form.intakeAmountMl}
                    onChange={(e) => setForm({ ...form, intakeAmountMl: e.target.value })}
                    className="w-full rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Notes: e.g. Normal Saline, coconut water..."
                value={form.intakeNotes}
                onChange={(e) => setForm({ ...form, intakeNotes: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs"
              />
            </div>

            {/* Output Box */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5">
              <span className="text-xs font-bold text-amber-900 block">Output (Fluid Excreted)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-amber-700 block mb-0.5">Type</label>
                  <select
                    value={form.outputType}
                    onChange={(e) => setForm({ ...form, outputType: e.target.value })}
                    className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {OUTPUT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-amber-700 block mb-0.5">Amount (ml)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 400"
                    value={form.outputAmountMl}
                    onChange={(e) => setForm({ ...form, outputAmountMl: e.target.value })}
                    className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Notes: e.g. Foley amber clear, drain serosanguinous..."
                value={form.outputNotes}
                onChange={(e) => setForm({ ...form, outputNotes: e.target.value })}
                className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 text-xs transition shadow-2xs"
            >
              Add to Fluid Chart
            </button>
          </form>
        </div>

        {/* Flowsheet Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Fluid Balance Longitudinal Log</h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading fluid balance flowsheet...</div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No fluid intake or output logged for this time window.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Date & Time</th>
                      <th className="px-3 py-2.5">Intake Type</th>
                      <th className="px-3 py-2.5">Intake (ml)</th>
                      <th className="px-3 py-2.5">Output Type</th>
                      <th className="px-3 py-2.5">Output (ml)</th>
                      <th className="px-3 py-2.5">Net (ml)</th>
                      <th className="px-3 py-2.5">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r) => {
                      const net = (r.intakeAmountMl || 0) - (r.outputAmountMl || 0);
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                            {r.date} {r.time}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.intakeType !== "None" ? r.intakeType : "—"}
                            {r.intakeNotes && <span className="block text-[10px] text-slate-400">{r.intakeNotes}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-blue-600">
                            {r.intakeAmountMl ? `+${r.intakeAmountMl} ml` : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.outputType !== "None" ? r.outputType : "—"}
                            {r.outputNotes && <span className="block text-[10px] text-slate-400">{r.outputNotes}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-amber-600">
                            {r.outputAmountMl ? `-${r.outputAmountMl} ml` : "—"}
                          </td>
                          <td className={`px-3 py-2.5 font-black ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {net > 0 ? `+${net}` : net} ml
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 text-[11px]">{r.recorderName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

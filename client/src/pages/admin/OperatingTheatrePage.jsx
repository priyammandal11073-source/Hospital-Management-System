import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAdminOperatingTheatreSchedule,
  createAdminProcedureSchedule,
  getDoctors,
  getPatients,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

const STATUS_BADGES = {
  scheduled: "bg-blue-50 text-blue-700 ring-blue-500/20",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-500/20 animate-pulse",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  postponed: "bg-slate-100 text-slate-700 ring-slate-400/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-500/20",
};

export default function OperatingTheatrePage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [theatres, setTheatres] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    procedureName: "",
    theatreRoom: "OT 1 (Major - Cardiac/Neuro)",
    leadSurgeon: "",
    patient: "",
    scheduledDate: todayStr,
    startTime: "09:00 AM",
    estimatedDurationMinutes: 120,
    preOpNotes: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [otRes, docRes, patRes] = await Promise.all([
        getAdminOperatingTheatreSchedule({ date: selectedDate }),
        getDoctors(),
        getPatients("", 1, 50),
      ]);
      setTheatres(otRes.theatres || []);
      setProcedures(otRes.procedures || []);
      setDoctors(docRes.doctors || []);
      setPatients(patRes.patients || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load OT schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createAdminProcedureSchedule(formData);
      setSuccessMsg(`Surgery schedule booked for ${formData.procedureName}.`);
      setShowAddModal(false);
      setFormData({
        procedureName: "",
        theatreRoom: "OT 1 (Major - Cardiac/Neuro)",
        leadSurgeon: "",
        patient: "",
        scheduledDate: todayStr,
        startTime: "09:00 AM",
        estimatedDurationMinutes: 120,
        preOpNotes: "",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule procedure.");
    }
  };

  const stats = useMemo(() => {
    const totalToday = procedures.length;
    const inProgress = procedures.filter((p) => p.status === "in_progress").length;
    const completed = procedures.filter((p) => p.status === "completed").length;
    return { totalToday, inProgress, completed };
  }, [procedures]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Surgical Suites</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Operating Theatre (OT) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Surgical suite allocations, lead surgeons, sterilization cycles, and scheduled major/minor operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <span>+</span>
            <span>Book OT Slot</span>
          </button>
        </div>
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

      {/* 4 OT Highlight Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Procedures Today</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalToday}</p>
          <span className="text-[10px] text-slate-500">Scheduled on {selectedDate}</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Live in Theatre</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.inProgress}</p>
          <span className="text-[10px] text-amber-600 font-medium">Currently operating</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Procedures Done</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.completed}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Moved to PACU / Recovery</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">OT Suites Available</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{theatres.length}</p>
          <span className="text-[10px] text-purple-600 font-medium">Laminar airflow suites</span>
        </div>
      </div>

      {/* OT Suites Status Strip */}
      <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Theatre Rooms Status</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {theatres.map((th) => (
            <div
              key={th.room}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{th.room}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      th.status === "available" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{th.type}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Status:</span>
                <span className="capitalize font-bold text-slate-700">{th.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Surgeries Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Surgical Roster for {selectedDate}</h2>
          <span className="text-xs text-slate-400 font-mono">{procedures.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Time & Suite</th>
                <th className="px-4 py-3">Procedure</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Lead Surgeon</th>
                <th className="px-4 py-3">Est. Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    Loading surgical procedures list...
                  </td>
                </tr>
              ) : procedures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No surgeries scheduled for this date.
                  </td>
                </tr>
              ) : (
                procedures.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-purple-700">{p.startTime}</div>
                      <div className="text-[10px] text-slate-500">{p.theatreRoom}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {p.procedureName}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {p.patient?.name || "Patient"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {p.leadSurgeon?.name ? formatDoctorName(p.leadSurgeon.name) : "Lead Surgeon"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {p.estimatedDurationMinutes} mins
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${STATUS_BADGES[p.status] || STATUS_BADGES.scheduled}`}>
                        {p.status?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book OT Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Book OT Procedure Schedule</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Procedure Name *</label>
                <input
                  type="text"
                  required
                  value={formData.procedureName}
                  onChange={(e) => setFormData({ ...formData, procedureName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Coronary Artery Bypass Graft (CABG)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
                  <select
                    required
                    value={formData.patient}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((pat) => (
                      <option key={pat._id} value={pat._id}>{pat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Surgeon *</label>
                  <select
                    required
                    value={formData.leadSurgeon}
                    onChange={(e) => setFormData({ ...formData, leadSurgeon: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Assign Surgeon --</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>{formatDoctorName(doc.name)} ({doc.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Theatre Suite</label>
                  <select
                    value={formData.theatreRoom}
                    onChange={(e) => setFormData({ ...formData, theatreRoom: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="OT 1 (Major - Cardiac/Neuro)">OT 1 (Cardiac/Neuro)</option>
                    <option value="OT 2 (Orthopedics & Trauma)">OT 2 (Orthopedics & Trauma)</option>
                    <option value="OT 3 (General Surgery)">OT 3 (General Surgery)</option>
                    <option value="OT 4 (Laparoscopy / Day Care)">OT 4 (Laparoscopy / Day Care)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="09:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Duration (mins)</label>
                  <input
                    type="number"
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Book Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyShiftInfo } from "../../services/api.js";

export default function MyShiftPage() {
  const [shiftData, setShiftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Local shift workflow checklist
  const [tasksChecklist, setTasksChecklist] = useState([
    { id: 1, text: "Attend Shift Handover & Receive Patient Rosters", done: true },
    { id: 2, text: "Perform 08:00 AM Comprehensive Vitals & Baseline Check", done: true },
    { id: 3, text: "Conduct Morning Medication Administration Pass (eMAR)", done: true },
    { id: 4, text: "Accompany Attending Physicians on Inpatient Ward Rounds", done: false },
    { id: 5, text: "Review Doctor Orders & Complete Pending Diagnostic Requisitions", done: false },
    { id: 6, text: "Log Mid-day Intake & Output Fluid Balance Measurements", done: false },
    { id: 7, text: "Afternoon Medication Pass & Wound Dressing Protocols", done: false },
    { id: 8, text: "Draft Shift Handover Summary for Incoming Nursing Team", done: false },
  ]);

  useEffect(() => {
    fetchShift();
  }, []);

  const fetchShift = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyShiftInfo();
      setShiftData(data.shift || null);
    } catch (err) {
      setError("Failed to load shift schedule and assignment data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (id) => {
    setTasksChecklist((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = tasksChecklist.filter((t) => t.done).length;
  const progressPct = Math.round((completedCount / tasksChecklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">⏰</span>
            Nursing Shift Schedule & Duty Station
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time shift telemetry, assigned bed workload, workflow routine, and clinical handover coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/nurse/handover"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <span>📝</span> Shift Handover Report
          </Link>
          <button
            onClick={fetchShift}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          Loading active shift details...
        </div>
      ) : shiftData ? (
        <>
          {/* Shift Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
              <div className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
                Current Shift
              </div>
              <div className="text-xl font-bold mt-1">{shiftData.currentShiftName}</div>
              <div className="text-xs text-slate-300 mt-1">{shiftData.shiftTime}</div>
              <div className="mt-3 text-xs bg-indigo-500/30 border border-indigo-400/30 px-2 py-1 rounded-md inline-block text-indigo-200">
                Active On-Duty
              </div>
            </div>

            <Link
              to="/nurse/patients"
              className="block group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Assigned Inpatients
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition">Open →</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {shiftData.totalAssignedPatients} Patients
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Across {shiftData.assignedWard}
              </div>
              <div className="mt-3">
                <span className="text-xs text-indigo-600 font-semibold group-hover:underline">
                  View patient roster →
                </span>
              </div>
            </Link>

            <Link
              to="/nurse/tasks"
              className="block group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Pending Care Tasks
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition">Open →</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {shiftData.pendingTasksCount} Tasks
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Scheduled during current shift
              </div>
              <div className="mt-3">
                <span className="text-xs text-indigo-600 font-semibold group-hover:underline">
                  View tasks board →
                </span>
              </div>
            </Link>

            <Link
              to="/nurse/handover"
              className="block group bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Shift Schedule Chain
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition">Open →</span>
              </div>
              <div className="text-xs text-slate-700 mt-2">
                <strong>Prev:</strong> {shiftData.prevShift}
              </div>
              <div className="text-xs text-slate-700 mt-1.5">
                <strong>Next:</strong> {shiftData.nextShift}
              </div>
              <div className="mt-3">
                <span className="text-xs text-indigo-600 font-semibold group-hover:underline">
                  Go to Handover Desk →
                </span>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shift Routine Checklist */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📋</span> Shift Workflow Checklist
                </h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  {completedCount}/{tasksChecklist.length} Done
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="space-y-2.5 pt-2">
                {tasksChecklist.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                      task.done
                        ? "bg-slate-50 border-slate-200 text-slate-500 line-through"
                        : "bg-white border-slate-200 text-slate-800 hover:border-indigo-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleCheck(task.id)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="leading-snug">{task.text}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-500 text-center">
                Check off items as completed throughout your shift.
              </div>
            </div>

            {/* Assigned Patients Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>👥</span> Assigned Inpatients Workload ({shiftData.patients?.length || 0})
                </h2>
                <span className="text-xs text-slate-500">Current Station Duty</span>
              </div>

              {shiftData.patients && shiftData.patients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3">Bed & Location</th>
                        <th className="pb-3">Patient</th>
                        <th className="pb-3">Age / Sex</th>
                        <th className="pb-3">Admitting Diagnosis</th>
                        <th className="pb-3 text-right">Quick Care</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shiftData.patients.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3">
                            <span className="font-bold text-slate-900">Bed {p.bedNumber}</span>
                            <div className="text-xs text-slate-500">{p.ward} • Floor {p.floor}</div>
                          </td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800">{p.patientName}</span>
                          </td>
                          <td className="py-3 text-slate-600 text-xs">
                            {p.ageGender}
                          </td>
                          <td className="py-3 text-slate-600 text-xs max-w-xs truncate">
                            {p.diagnosis || "Medical Observation"}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to="/nurse/vitals"
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-md"
                              >
                                Vitals
                              </Link>
                              <Link
                                to="/nurse/medications"
                                className="px-2 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold rounded-md"
                              >
                                eMAR
                              </Link>
                              <Link
                                to="/nurse/notes"
                                className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-md"
                              >
                                Note
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No inpatients assigned to this station at present.
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

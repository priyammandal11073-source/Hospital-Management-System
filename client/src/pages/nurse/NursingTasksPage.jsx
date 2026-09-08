import { useState, useEffect } from "react";
import { getInpatientsWithCare, getNursingTasks, createNursingTask, updateNursingTaskStatus } from "../../services/api.js";

const TASK_TYPES = [
  "Record Vitals",
  "Dressing Change",
  "Sample Collection",
  "IV Monitoring",
  "Patient Repositioning",
  "Patient Preparation",
  "Discharge Preparation",
  "Medication Due",
  "Catheter Care",
  "Other",
];

export default function NursingTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [inpatients, setInpatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newTask, setNewTask] = useState({
    patient: "",
    taskType: "Record Vitals",
    title: "",
    description: "",
    priority: "Routine",
    dueTime: "",
  });

  useEffect(() => {
    const fetchInpatients = async () => {
      try {
        const data = await getInpatientsWithCare();
        const list = data.inpatients || [];
        setInpatients(list);
        if (list.length > 0) {
          setNewTask((t) => ({ ...t, patient: list[0].patient._id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInpatients();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const fetchTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getNursingTasks();
        if (isCurrent) setTasks(data.tasks || []);
      } catch (err) {
        if (isCurrent) setError("Failed to fetch nursing tasks");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchTasks();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.patient || !newTask.title.trim() || !newTask.dueTime) {
      alert("Please select a patient, specify a task title and due time.");
      return;
    }

    try {
      await createNursingTask(newTask);
      setIsModalOpen(false);
      setNewTask({
        patient: inpatients[0]?.patient?._id || "",
        taskType: "Record Vitals",
        title: "",
        description: "",
        priority: "Routine",
        dueTime: "",
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to create task: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateNursingTaskStatus(taskId, { status: newStatus });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "Active") return t.status === "Pending" || t.status === "In Progress";
    if (statusFilter === "Completed") return t.status === "Completed";
    if (statusFilter === "Overdue") return t.isOverdue;
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border border-rose-300 font-bold";
      case "High":
        return "bg-amber-100 text-amber-800 border border-amber-300 font-bold";
      case "Moderate":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bedside Nursing Task Management & Care Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track pending nursing interventions, medication times, IV checks, wound dressings, and overdue tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 text-xs transition shadow-2xs"
          >
            + New Care Task
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {["Active", "Overdue", "Completed", "All"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === f
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f} Tasks
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading care tasks...</div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">✅</span>
          <h3 className="text-sm font-bold text-slate-800">No tasks under this view</h3>
          <p className="mt-1 text-xs text-slate-500">All scheduled nursing care interventions are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t._id}
              className={`rounded-2xl border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                t.isOverdue ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{t.patient?.name || "Patient"}</span>
                  <span className="rounded-md bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 text-xs font-bold">
                    {t.taskType}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs ${getPriorityBadge(t.priority)}`}>
                    {t.priority} Priority
                  </span>
                  {t.isOverdue && (
                    <span className="rounded-md bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 animate-pulse">
                      OVERDUE
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>
                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                  <span>Due: {new Date(t.dueTime).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                  {t.completedByName && <span>• Completed by {t.completedByName}</span>}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {t.status === "Pending" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t._id, "In Progress")}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                  >
                    Start Task
                  </button>
                )}
                {t.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(t._id, "Completed")}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-2xs"
                  >
                    ✓ Complete
                  </button>
                )}
                {t.status === "Completed" && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
                    ✓ Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create Bedside Nursing Task</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Inpatient</label>
                <select
                  value={newTask.patient}
                  onChange={(e) => setNewTask({ ...newTask, patient: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {inpatients.map((item) => (
                    <option key={item.patient._id} value={item.patient._id}>
                      {item.patient.name} — Bed {item.bedNumber} ({item.ward})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Task Category</label>
                  <select
                    value={newTask.taskType}
                    onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-hourly IV site check and flush..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newTask.dueTime}
                  onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description / Clinical Instructions</label>
                <textarea
                  rows="2"
                  placeholder="Special instructions, titration parameters..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold shadow-2xs"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

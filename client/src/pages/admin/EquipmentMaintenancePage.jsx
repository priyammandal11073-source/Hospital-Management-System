import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAdminEquipment,
  getAdminMaintenanceOrders,
  createAdminMaintenanceOrder,
  updateAdminMaintenanceOrderStatus,
  logPreventiveMaintenance,
} from "../../services/api.js";

const STATUS_BADGES = {
  operational: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  under_maintenance: "bg-amber-50 text-amber-700 ring-amber-500/20",
  out_of_order: "bg-rose-50 text-rose-700 ring-rose-500/20",
  out_of_service: "bg-rose-50 text-rose-700 ring-rose-500/20",
  calibration_due: "bg-blue-50 text-blue-700 ring-blue-500/20",
};

const PM_BADGES = {
  overdue: "bg-rose-100 text-rose-800 ring-rose-300",
  due_soon: "bg-amber-100 text-amber-800 ring-amber-300",
  on_schedule: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
};

const PRIORITY_BADGES = {
  emergency: "bg-rose-100 text-rose-800 font-extrabold",
  urgent: "bg-amber-100 text-amber-800 font-bold",
  routine: "bg-slate-100 text-slate-700",
};

export default function EquipmentMaintenancePage() {
  const [equipment, setEquipment] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("equipment"); // 'equipment' | 'orders'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [pm, setPm] = useState({ portfolio: 0, overdueCount: 0, dueSoonCount: 0 });
  const [newOrder, setNewOrder] = useState({
    equipmentId: "",
    department: "Emergency & Trauma",
    issueDescription: "",
    priority: "urgent",
    technicianName: "Biomedical Team 1",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eqRes, ordRes] = await Promise.all([
        getAdminEquipment(),
        getAdminMaintenanceOrders(),
      ]);
      setEquipment(eqRes.equipment || []);
      setOrders(ordRes.orders || []);
      setPm(eqRes.pm || { portfolio: equipment.length, overdueCount: 0, dueSoonCount: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load biomedical data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogPm = async (eq) => {
    const technician = window.prompt(
      `Logging preventive maintenance for "${eq.name}"\nAssign technician:`,
      "Biomedical Team 1"
    );
    if (technician === null) return;
    try {
      const res = await logPreventiveMaintenance(eq._id, {
        technicianName: technician.trim() || "Biomedical Team 1",
        notes: `Routine preventive maintenance serviced by ${technician.trim() || "Biomedical Team 1"}`,
      });
      setSuccessMsg(res.message || "Preventive maintenance logged.");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log preventive maintenance.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createAdminMaintenanceOrder(newOrder);
      setSuccessMsg("Maintenance work order created.");
      setShowCreateOrderModal(false);
      setNewOrder({
        equipmentId: "",
        department: "Emergency & Trauma",
        issueDescription: "",
        priority: "urgent",
        technicianName: "Biomedical Team 1",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not dispatch maintenance order.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateAdminMaintenanceOrderStatus(orderId, { status });
      setSuccessMsg(`Work order status changed to ${status}.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update order status.");
    }
  };

  const stats = useMemo(() => {
    const totalEq = equipment.length;
    const operational = equipment.filter((e) => e.status === "operational").length;
    const pendingTickets = orders.filter((o) => o.status === "open" || o.status === "in_progress").length;
    const operationalRate = totalEq > 0 ? Math.round((operational / totalEq) * 100) : 100;
    return { totalEq, operational, pendingTickets, operationalRate };
  }, [equipment, orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Biomedical Infrastructure</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Hospital Equipment & Maintenance</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {stats.totalEq} Assets
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Biomedical machinery, routine calibration logs, critical ventilator monitoring, and engineering tickets.
          </p>
        </div>
        <button
          onClick={() => setShowCreateOrderModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <span>+</span>
          <span>Open Maintenance Order</span>
        </button>
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

      {/* 4 Stat Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Tracked Assets</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{pm.portfolio || equipment.length}</p>
          <span className="text-[10px] text-slate-500">Biomedical inventory</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Operational Uptime</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.operationalRate}%</p>
          <span className="text-[10px] text-emerald-600 font-medium">{stats.operational} units active</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Due For Service</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pm.dueSoonCount || 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">Within the next 7 days</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Overdue PM</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{pm.overdueCount || 0}</p>
          <span className="text-[10px] text-rose-600 font-medium">Need service attention</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("equipment")}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${
            activeTab === "equipment" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Biomedical Equipment Registry ({equipment.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${
            activeTab === "orders" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Maintenance Work Orders ({orders.length})
        </button>
      </div>

      {/* Equipment View */}
      {activeTab === "equipment" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Equipment / Model</th>
                  <th className="px-4 py-3">Serial & Code</th>
                  <th className="px-4 py-3">Location & Dept</th>
                  <th className="px-4 py-3">Last Maintenance</th>
                  <th className="px-4 py-3">Next Calibration</th>
                  <th className="px-4 py-3">PM Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Loading biomedical equipment database...
                    </td>
                  </tr>
                ) : equipment.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      No biomedical machinery recorded.
                    </td>
                  </tr>
                ) : (
                  equipment.map((eq) => (
                    <tr key={eq._id} className={`hover:bg-slate-50/70 transition ${eq.pmStatus === "overdue" ? "bg-rose-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{eq.name}</p>
                        <p className="text-[11px] text-slate-400">{eq.modelNumber || "Hospital Standard"}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div>{eq.equipmentId}</div>
                        <div className="text-[10px] text-slate-400">MFG: {eq.manufacturer || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <div>{eq.department}</div>
                        <div className="text-[10px] text-slate-400">{eq.location}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {eq.lastServiceDate ? new Date(eq.lastServiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {eq.dueForServiceOn ? new Date(eq.dueForServiceOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${PM_BADGES[eq.pmStatus] || PM_BADGES.on_schedule}`}>
                          {eq.pmStatus === "overdue"
                            ? "⚠ Overdue"
                            : eq.pmStatus === "due_soon"
                            ? "Due soon"
                            : eq.pmStatus === "on_schedule"
                            ? "On schedule"
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${STATUS_BADGES[eq.status] || STATUS_BADGES.operational}`}>
                          {eq.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleLogPm(eq)}
                          disabled={eq.status === "under_maintenance"}
                          className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {eq.pmStatus === "overdue" ? "Service Now" : "Log PM"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Work Orders View */}
      {activeTab === "orders" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Issue Description</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assigned Tech</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No maintenance work orders active.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-purple-700">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {ord.equipment?.name || "Biomedical Unit"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <p className="truncate">{ord.issueDescription}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${PRIORITY_BADGES[ord.priority] || "bg-slate-100"}`}>
                          {ord.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {ord.technicianName || "Engineering Duty"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-bold text-[11px] text-slate-700">
                          {ord.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        {ord.status === "open" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord._id, "in_progress")}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-50 transition"
                          >
                            Start Work
                          </button>
                        )}
                        {ord.status === "in_progress" && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord._id, "completed")}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            Resolve Ticket
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Dispatch Maintenance Work Order</h2>
              <button onClick={() => setShowCreateOrderModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Equipment *</label>
                <select
                  required
                  value={newOrder.equipmentId}
                  onChange={(e) => setNewOrder({ ...newOrder, equipmentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value="">-- Choose Equipment --</option>
                  {equipment.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.equipmentCode}) - {eq.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="routine">Routine Inspection</option>
                    <option value="urgent">Urgent Repair</option>
                    <option value="emergency">Emergency Breakdown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Technician</label>
                  <input
                    type="text"
                    value={newOrder.technicianName}
                    onChange={(e) => setNewOrder({ ...newOrder, technicianName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fault Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newOrder.issueDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, issueDescription: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  placeholder="Detail observed issue, error codes, power fluctuations, or physical damage..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

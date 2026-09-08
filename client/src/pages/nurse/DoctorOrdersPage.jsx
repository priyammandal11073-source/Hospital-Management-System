import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getDoctorOrders, updateDoctorOrderStatus } from "../../services/api.js";

const ORDER_TYPES = ["All Types", "Medication", "Lab Test", "Imaging", "Procedure", "Diet", "Monitoring", "Other"];

export default function DoctorOrdersPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") || "All Types");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "Active");
  const [actionOrder, setActionOrder] = useState(null);
  const [actionStatus, setActionStatus] = useState("");
  const [nurseNotes, setNurseNotes] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setStatusFilter(s);
    const t = searchParams.get("type");
    if (t) setTypeFilter(t);
  }, [searchParams]);

  useEffect(() => {
    let isCurrent = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDoctorOrders();
        if (isCurrent) setOrders(data.orders || []);
      } catch (err) {
        if (isCurrent) setError("Failed to fetch doctor orders");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isCurrent = false; };
  }, [refreshKey]);

  const handleOpenAction = (order, targetStatus) => {
    setActionOrder(order);
    setActionStatus(targetStatus);
    setNurseNotes("");
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionOrder) return;

    try {
      await updateDoctorOrderStatus(actionOrder._id, {
        status: actionStatus,
        nurseNotes,
      });

      setActionOrder(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to update order status: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== "All Types" && o.orderType !== typeFilter) return false;
    if (statusFilter === "Active") return o.status === "New" || o.status === "Acknowledged" || o.status === "In Progress";
    if (statusFilter === "Completed") return o.status === "Completed";
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "STAT":
        return "bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse";
      case "Urgent":
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Physician Clinical Orders & Nurse Execution Desk
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review written doctor orders, acknowledge STAT directives, initiate procedures, and complete clinical tasks.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-500">Order Category:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {ORDER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {["Active", "Completed", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === f
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f} Orders
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading doctor orders...</div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">🩺</span>
          <h3 className="text-sm font-bold text-slate-800">No clinical orders under this filter</h3>
          <p className="mt-1 text-xs text-slate-500">All physician orders have been executed or completed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <div
              key={o._id}
              className={`rounded-2xl border p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                o.priority === "STAT" && o.status === "New" ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{o.patient?.name || "Patient"}</span>
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-0.5 text-xs font-bold">
                    {o.orderType}
                  </span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs ${getPriorityBadge(o.priority)}`}>
                    {o.priority} Priority
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Ordered by {o.doctorName}</span>
                </div>

                <p className="text-sm font-semibold text-slate-800 leading-snug">{o.description}</p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span>Ordered: {new Date(o.createdAt).toLocaleString("en-IN")}</span>
                  {o.acknowledgedByName && <span>• Acknowledged by {o.acknowledgedByName}</span>}
                  {o.completedByName && <span>• Completed by {o.completedByName}</span>}
                </div>
                {o.nurseNotes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                    <span className="font-semibold text-slate-700">Nurse Observation:</span> {o.nurseNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                {o.status === "New" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAction(o, "Acknowledged")}
                    className="rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-3 py-1.5 text-xs transition"
                  >
                    ✓ Acknowledge Order
                  </button>
                )}
                {o.status === "Acknowledged" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAction(o, "In Progress")}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 text-xs transition"
                  >
                    Start Execution
                  </button>
                )}
                {o.status !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => handleOpenAction(o, "Completed")}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-1.5 text-xs transition shadow-2xs"
                  >
                    Mark Completed
                  </button>
                )}
                {o.status === "Completed" && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-3 py-1 text-xs">
                    ✓ Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionOrder && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Update Order Status: {actionStatus}
              </h3>
              <button
                type="button"
                onClick={() => setActionOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500">Patient: <strong className="text-slate-900">{actionOrder.patient?.name}</strong></div>
                <div className="text-slate-500">Order: <strong className="text-slate-900">{actionOrder.description}</strong></div>
                <div className="text-slate-500">Doctor: <strong className="text-slate-900">{actionOrder.doctorName}</strong></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nursing Action Notes (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Sample collected and sent to central lab, catheter flushed..."
                  value={nurseNotes}
                  onChange={(e) => setNurseNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionOrder(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-bold shadow-2xs"
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

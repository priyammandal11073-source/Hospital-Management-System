import React, { useState, useEffect } from "react";
import {
  getDoctorWorkspaceOrders,
  createDoctorWorkspaceOrder,
  getPatients,
} from "../../services/api.js";

export default function DoctorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    patientId: "",
    orderType: "Medication",
    description: "",
    priority: "Routine",
  });

  useEffect(() => {
    loadOrders();
    loadPatients();
  }, [statusFilter, priorityFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await getDoctorWorkspaceOrders(params);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load clinical orders.");
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      const patientList = res.patients || res.data || (Array.isArray(res) ? res : []);
      setPatients(patientList);
    } catch (e) {
      console.error("Failed to load patients for orders", e);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.patientId || !newOrder.description.trim()) {
      alert("Please select a patient and provide an order description.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createDoctorWorkspaceOrder(newOrder);
      if (res.success) {
        setIsModalOpen(false);
        setNewOrder({
          patientId: "",
          orderType: "Medication",
          description: "",
          priority: "Routine",
        });
        loadOrders();
      } else {
        alert(res.message || "Failed to submit order.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting clinical order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-lg">📋</span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Doctor Orders</h1>
              <p className="text-xs text-slate-500">
                Directives issued to ward nursing stations and clinical teams
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <span>+ Place New Clinical Order</span>
        </button>
      </div>

      {/* Filters & Statistics Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 uppercase text-[10px]">Filter Status:</span>
          {["", "New", "Acknowledged", "In Progress", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === st
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "" ? "All Statuses" : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase text-[10px]">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 bg-slate-50 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="Routine">Routine</option>
            <option value="Urgent">Urgent</option>
            <option value="STAT">STAT</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading clinical orders...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No clinical orders match the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order Details</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-3 py-3">Order Type</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3">Nursing Execution</th>
                  <th className="px-4 py-3">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{ord.description}</p>
                      <p className="text-[11px] text-slate-400">Prescribing: Dr. {ord.doctorName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{ord.patient?.name || "Patient"}</p>
                      <span className="text-[10px] text-slate-400">{ord.patient?.patientId}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.priority === "STAT" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                        ord.priority === "Urgent" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {ord.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        ord.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                        ord.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                        ord.status === "Acknowledged" ? "bg-purple-100 text-purple-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ord.acknowledgedByName ? (
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700">Ack by {ord.acknowledgedByName}</p>
                          {ord.completedByName && (
                            <p className="text-[10px] text-emerald-600">Done by {ord.completedByName}</p>
                          )}
                          {ord.nurseNotes && (
                            <p className="text-[10px] text-slate-400 italic">"{ord.nurseNotes}"</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Pending nurse pickup</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString()} <br />
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Place New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Issue Clinical Doctor Order</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Inpatient / Patient</label>
                <select
                  required
                  value={newOrder.patientId}
                  onChange={(e) => setNewOrder({ ...newOrder, patientId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || "No PID"}) - {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Category</label>
                  <select
                    value={newOrder.orderType}
                    onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="Medication">Medication</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Imaging">Imaging (X-Ray/CT/USG)</option>
                    <option value="Procedure">Procedure / Dressing</option>
                    <option value="Diet">Dietary Directive</option>
                    <option value="Monitoring">Vital Monitoring (q2h/q4h)</option>
                    <option value="Other">Other Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clinical Order Instructions & Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  placeholder="e.g. Infuse 500ml Normal Saline over 4 hours. Record blood pressure every 2 hours."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Send Directive to Ward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

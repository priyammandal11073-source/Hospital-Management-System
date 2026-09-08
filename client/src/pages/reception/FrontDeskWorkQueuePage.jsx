import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getFrontDeskWorkQueue,
  confirmOnlineBooking,
  updatePaymentStatus,
} from "../../services/api.js";

export default function FrontDeskWorkQueuePage() {
  const [workQueue, setWorkQueue] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getFrontDeskWorkQueue(activeCategory);
      setWorkQueue(data.queue || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load front desk queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeCategory]);

  const handleConfirm = async (appointmentId) => {
    setActioningId(appointmentId);
    try {
      await confirmOnlineBooking(appointmentId, { action: "confirm" });
      fetchQueue();
    } catch (err) {
      alert("Failed to confirm: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleQuickCash = async (billingId) => {
    setActioningId(billingId);
    try {
      await updatePaymentStatus(billingId, { paymentStatus: "paid", paymentMethod: "cash" });
      fetchQueue();
    } catch (err) {
      alert("Payment settlement failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const filteredQueue = workQueue.filter((item) => {
    const matchesSearch =
      item.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.task?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Front Desk Dispatch</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Central Front Desk Work Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated queue of all items requiring front-desk action: online booking verifications, arrival check-ins, cashier settlements, and patient inquiries.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "all", label: "All Tasks" },
              { id: "online_booking", label: "Online Bookings" },
              { id: "waiting_checkin", label: "Arrival Check-In" },
              { id: "awaiting_doctor", label: "Awaiting Doctor" },
              { id: "payment", label: "Pending Cashier" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  activeCategory === tab.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by patient name or keyword..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Compiling front desk actionable queue...
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">✨</span>
            <p className="mt-2 text-sm font-bold text-slate-700">No tasks in this queue</p>
            <p className="text-xs text-slate-400 mt-1">All front desk tasks have been addressed!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Task Details</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{item.patient}</div>
                        {item.contactNumber && (
                          <div className="text-[11px] text-slate-400 font-normal">📞 {item.contactNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {item.task}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.timeSlot || new Date(item.dateTime).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.priority === "Emergency"
                            ? "bg-red-100 text-red-800 ring-1 ring-red-300"
                            : item.priority === "Urgent"
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <span className={`h-1.5 w-1.5 rounded-full ${item.status === "In Progress" ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.actionType === "confirm_booking" ? (
                        <button
                          disabled={actioningId === item.originalId}
                          onClick={() => handleConfirm(item.originalId)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {actioningId === item.originalId ? "Saving..." : "Confirm Slot"}
                        </button>
                      ) : item.actionType === "collect_payment" ? (
                        <button
                          disabled={actioningId === item.originalId}
                          onClick={() => handleQuickCash(item.originalId)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {actioningId === item.originalId ? "Settling..." : "Collect Cash"}
                        </button>
                      ) : (
                        <Link
                          to={item.actionLink || "/reception/waiting-room"}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
                        >
                          Open Desk →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

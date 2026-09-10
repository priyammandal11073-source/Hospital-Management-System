import { useEffect, useState } from "react";
import {
  getDiagnosticRequests,
  createDiagnosticRequest,
  updateDiagnosticRequestStatus,
  getDiagnosticTests,
  getPatients,
} from "../../services/api.js";

export default function TestRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [search, setSearch] = useState("");

  // New Request Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [priority, setPriority] = useState("Routine");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getDiagnosticRequests(params);
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, priorityFilter, departmentFilter]);

  const handleOpenModal = async () => {
    setModalOpen(true);
    try {
      const [patRes, catRes] = await Promise.all([
        getPatients("", 1, 20),
        getDiagnosticTests({ limit: 100 }),
      ]);
      if (patRes.patients) setPatients(patRes.patients);
      if (catRes.data) setCatalog(catRes.data);
    } catch (e) {
      console.error("Error loading modal dependencies", e);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedTest) {
      alert("Please select both a patient and an investigation test.");
      return;
    }
    try {
      setCreating(true);
      const payload = {
        patientId: selectedPatient._id,
        testId: selectedTest._id,
        priority,
        clinicalIndications: clinicalNotes,
      };
      await createDiagnosticRequest(payload);
      setModalOpen(false);
      setSelectedPatient(null);
      setSelectedTest(null);
      setClinicalNotes("");
      fetchRequests();
    } catch (err) {
      alert("Failed to create order: " + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDiagnosticRequestStatus(orderId, { status: newStatus });
      fetchRequests();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Diagnostic Investigation Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage incoming test requests from OPD consultations, IPD wards, and Emergency triage
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
        >
          <span>+ Create Test Order</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by order #, patient name, test..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Departments</option>
          <option value="Pathology">Pathology / Laboratory</option>
          <option value="Radiology">Radiology / Imaging</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="Routine">Routine</option>
          <option value="Urgent">Urgent</option>
          <option value="STAT">STAT (Emergency)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Requested">Requested</option>
          <option value="Accepted">Accepted</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Sample Collected">Sample Collected</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Approved">Approved</option>
          <option value="Finalized">Finalized</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          onClick={fetchRequests}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-white transition cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Requests Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Loading investigation requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No diagnostic requests matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Order #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Investigation Test</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Billing</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                      {r.orderNumber}
                      {r.isCritical && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{r.patientName}</p>
                      <p className="text-[11px] text-slate-400">ABHA: {r.patientAbhaId || "N/A"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-indigo-900">{r.testName}</p>
                      <p className="text-[11px] text-slate-400">{r.testCode} • {r.category}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        r.department === "Pathology"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {r.department}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.priority === "STAT"
                          ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                          : r.priority === "Urgent"
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">₹{r.price || 0}</p>
                      <span className={`text-[10px] font-semibold ${
                        r.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {r.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        r.status === "Finalized" || r.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "In Progress"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : r.status === "Sample Collected"
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : r.status === "Accepted"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : r.status === "Cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1.5">
                      {r.status === "Requested" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r._id, "Accepted")}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Accept
                        </button>
                      )}
                      {r.status === "Accepted" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r._id, "Scheduled")}
                          className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Schedule
                        </button>
                      )}
                      {r.status === "Scheduled" && r.department === "Radiology" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r._id, "In Progress")}
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Start Scan
                        </button>
                      )}
                      {r.status !== "Finalized" && r.status !== "Cancelled" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r._id, "Cancelled")}
                          className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 px-2 py-1 text-[11px] font-semibold cursor-pointer transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= NEW TEST ORDER MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-slate-900/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Initiate Diagnostic Investigation</h3>
                <p className="text-xs text-slate-500">Order from the Central 369+ Test Catalog</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Patient *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {patients.map((p) => {
                    const isSelected = selectedPatient?._id === p._id;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => setSelectedPatient(p)}
                        className={`text-left p-2 rounded-lg text-xs transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs font-bold"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          {p.gender}, {p.age} yrs • {p.abhaId || "No ABHA"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Catalog Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    2. Select Diagnostic Test *
                  </label>
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {catalog
                    .filter((t) =>
                      catalogSearch.trim()
                        ? t.testName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          t.testCode.toLowerCase().includes(catalogSearch.toLowerCase())
                        : true
                    )
                    .slice(0, 30)
                    .map((t) => {
                      const isSelected = selectedTest?._id === t._id;
                      return (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => setSelectedTest(t)}
                          className={`text-left p-2 rounded-lg text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs font-bold"
                              : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate max-w-[150px]">{t.testName}</span>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-200" : "text-indigo-600"}`}>
                              ₹{t.price}
                            </span>
                          </div>
                          <p className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            {t.department} • {t.category} ({t.turnaroundTime || "2h"})
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Priority & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Routine">Routine (Standard Turnaround)</option>
                    <option value="Urgent">Urgent (4-hour TAT)</option>
                    <option value="STAT">STAT (Immediate Emergency &lt; 1hr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical Indications / Provisional Diagnosis
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rule out pneumonia, severe fever"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Summary Card */}
              {selectedTest && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900">{selectedTest.testName}</span>
                    <span className="text-slate-500 ml-2">({selectedTest.sampleType || "Imaging"})</span>
                  </div>
                  <span className="font-black text-indigo-800 text-sm">Fee: ₹{selectedTest.price}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !selectedPatient || !selectedTest}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {creating ? "Submitting Order..." : "Confirm & Dispatch Order →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

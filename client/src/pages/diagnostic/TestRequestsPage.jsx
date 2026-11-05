import { useEffect, useState } from "react";
import {
  getDiagnosticRequests,
  createDiagnosticRequest,
  updateDiagnosticRequestStatus,
  getDiagnosticTests,
  getPatients,
} from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  DataTable,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

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
      toastError("Please select both a patient and an investigation test.");
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
      toastError("Failed to create order: " + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDiagnosticRequestStatus(orderId, { status: newStatus });
      fetchRequests();
    } catch (err) {
      toastError("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const toastError = (msg) => {
    const el = document.createElement("div");
    el.className = "fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  const priorityColors = {
    STAT: "bg-rose-100 text-rose-800 animate-pulse",
    Urgent: "bg-amber-100 text-amber-800",
    Routine: "bg-slate-100 text-slate-700",
  };

  const statusColors = {
    Finalized: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
    "Sample Collected": "bg-teal-50 text-teal-700 border border-teal-200",
    Accepted: "bg-sky-50 text-sky-700 border border-sky-200",
    Cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
    Requested: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  const departmentColors = {
    Pathology: "bg-purple-50 text-purple-700 border border-purple-200",
    Radiology: "bg-blue-50 text-blue-700 border border-blue-200",
  };

  if (loading) {
    return <PageLoader message="Accessing Radiology PACS servers…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Investigation Requests"
        subtitle="Manage incoming test requests from OPD consultations, IPD wards, and Emergency triage"
        actions={[
          <Button key="create-order" size="sm" onClick={handleOpenModal} leftIcon={<span>+</span>}>
            Create Test Order
          </Button>,
        ]}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by order #, patient name, test…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="test-requests-search"
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

        <Button variant="outline" size="sm" onClick={fetchRequests}>
          Filter
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {requests.length === 0 ? (
          <EmptyStateCard
            icon="📋"
            title="No diagnostic requests matched your criteria."
            description="Try switching tabs or adjusting search query."
          />
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
                  <th className="p-4 py-3">Status</th>
                  <th className="p-4 py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 whitespace-nowrap">
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
                      <div className="font-bold text-indigo-900">{r.testName}</div>
                      <p className="text-[11px] text-slate-400">{r.testCode} • {r.category}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] ${departmentColors[r.department]}`}>
                        {r.department}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${priorityColors[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">₹{r.price || 0}</p>
                      <span className={`text-[10px] font-semibold ${r.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>
                        {r.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="p-4 py-3">
                      <Badge status={r.status}>{r.status}</Badge>
                    </td>
                    <td className="p-4 py-3 pr-5 text-right space-x-1.5">
                      {r.status === "Requested" && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(r._id, "Accepted")}>
                          Accept
                        </Button>
                      )}
                      {r.status === "Accepted" && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(r._id, "Scheduled")}>
                          Schedule
                        </Button>
                      )}
                      {r.status === "Scheduled" && r.department === "Radiology" && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(r._id, "In Progress")}>
                          Start Scan
                        </Button>
                      )}
                      {r.status !== "Finalized" && r.status !== "Cancelled" && (
                        <Button variant="danger" size="sm" onClick={() => handleStatusChange(r._id, "Cancelled")}>
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Initiate Diagnostic Investigation"
          subtitle="Order from the Central 369+ Test Catalog"
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4">
            {/* Patient Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Select Patient *</label>
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
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">2. Select Diagnostic Test *</label>
                  <Input
                    placeholder="Search tests…"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    id="test-catalog-search"
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
            </div>

            {/* Priority & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Tier</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indications / Provisional Diagnosis</label>
                <Input
                  placeholder="e.g. Rule out pneumonia, severe fever"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  id="clinical-notes"
                />
              </div>
            </div>

            {/* Summary Card */}
            {selectedTest && (
              <Card title="Selected Test" subtitle={selectedTest.department} className="border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900">{selectedTest.testName}</span>
                    <span className="text-slate-500 ml-2">({selectedTest.sampleType || "Imaging"})</span>
                  </div>
                  <span className="font-black text-indigo-800 text-sm">Fee: ₹{selectedTest.price}</span>
                </div>
              </Card>
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
                {creating ? "Submitting Order…" : "Confirm & Dispatch Order →"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

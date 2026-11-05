import { useState, useEffect } from "react";
import { getDiagnosticReports, reviewAndApproveDiagnosticReport } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function SpecialistReviewPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReport, setActiveReport] = useState(null);
  const [reviewFields, setReviewFields] = useState({ specialistNotes: "", summaryConclusion: "", isCritical: false, criticalFindings: "" });
  const [reviewingId, setReviewingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticReports({ status: "Report Pending" });
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load specialist reports", err);
      setError(err.response?.data?.message || err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSelectReport = (report) => {
    setActiveReport(report);
    setReviewFields({ specialistNotes: "", summaryConclusion: "", isCritical: false, criticalFindings: "" });
  };

  const handleReviewSubmit = async (action) => {
    if (!activeReport) return;
    try {
      setReviewingId(activeReport._id);
      await reviewAndApproveDiagnosticReport(activeReport._id, {
        action,
        specialistReviewNotes: reviewFields.specialistNotes,
        summaryConclusion: reviewFields.summaryConclusion,
        isCritical: reviewFields.isCritical,
        criticalFindings: reviewFields.criticalFindings,
      });
      setSuccessMessage(`Report ${action === "approve" ? "approved" : "held"} successfully!`);
      setActiveReport(null);
      setReviewFields({ specialistNotes: "", summaryConclusion: "", isCritical: false, criticalFindings: "" });
      fetchReports();
    } catch (err) {
      toastError(`Failed to ${action} report: ${err.response?.data?.message || err.message}`);
    } finally {
      setReviewingId(null);
    }
  };

  const toastError = (msg) => {
    const el = document.createElement("div");
    el.className = "fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  const toastSuccess = (msg) => {
    const el = document.createElement("div");
    el.className = "fixed top-6 right-6 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  if (loading) {
    return <PageLoader message="Loading specialist review queue…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Specialist Review & Finalization Desk"
        subtitle="Review finalized reports, add specialist notes, critical findings, and confirm sign-off for patient and doctor portals"
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs ring-1 ring-slate-200/80 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input placeholder="Search report #, patient name, test…" value={search} onChange={(e) => setSearch(e.target.value)} id="specialist-search" />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          <option value="Pathology">Pathology</option>
          <option value="Radiology">Radiology</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchReports}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">Loading specialist review queue…</div>
        ) : reports.length === 0 ? (
          <EmptyStateCard icon="👨‍⚕️" title="No reports awaiting specialist review." description="All reports have been reviewed and signed off." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 pl-5">Report #</th>
                  <th className="px-3.5">Patient Details</th>
                  <th className="px-3.5">Investigation</th>
                  <th className="px-3.5">Department</th>
                  <th className="px-3.5">Submitted By</th>
                  <th className="px-3.5">Priority</th>
                  <th className="px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3.5 pl-5 font-mono font-bold text-slate-800 whitespace-nowrap">{r.reportNumber}</td>
                    <td className="px-3.5">
                      <div className="font-bold text-slate-800">{r.patientName}</div>
                      <p className="text-[11px] text-slate-400">ABHA: {r.patientAbhaId || "N/A"}</p>
                    </td>
                    <td className="px-3.5">
                      <div className="font-bold text-slate-800">{r.testName}</div>
                      <p className="text-[11px] text-slate-400">{r.category}</p>
                    </td>
                    <td className="px-3.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] ${r.department === "Pathology" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>{r.department}</span></td>
                    <td className="px-3.5"><div className="font-bold text-slate-800">{r.submittedBy || "Unknown"}</div></td>
                    <td className="px-3.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.priority === "STAT" ? "bg-rose-100 text-rose-800 animate-pulse" : r.priority === "Urgent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{r.priority}</span></td>
                    <td className="px-3.5 pr-5 text-right whitespace-nowrap space-x-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleSelectReport(r)}>Review Report</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeReport && (
        <Modal isOpen={Boolean(activeReport)} onClose={() => setActiveReport(null)} title={`Specialist Review: ${activeReport.testName}`} className="max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <p className="font-bold text-slate-800">{activeReport.patientName}</p>
              <p className="text-xs text-slate-500">ID: {activeReport.patientAbhaId || "N/A"} • {activeReport.category}</p>
            </div>
            <Badge status={activeReport.priority === "STAT" ? "urgent" : "normal"}>{activeReport.priority}</Badge>
          </div>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialist Notes</label>
                <textarea rows={3} value={reviewFields.specialistNotes} onChange={(e) => setReviewFields((f) => ({ ...f, specialistNotes: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Summary Conclusion</label>
                <Input value={reviewFields.summaryConclusion} onChange={(e) => setReviewFields((f) => ({ ...f, summaryConclusion: e.target.value }))} id="summary-conclusion" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Critical Findings (if any)</label>
                <Input value={reviewFields.criticalFindings} onChange={(e) => setReviewFields((f) => ({ ...f, criticalFindings: e.target.value }))} id="critical-findings" />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setActiveReport(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <Button variant="outline" size="sm" disabled={reviewingId === activeReport._id} onClick={() => handleReviewSubmit("reject")}>Hold / Flag</Button>
              <Button size="sm" disabled={reviewingId === activeReport._id} onClick={() => handleReviewSubmit("approve")}>Approve & Sign Off</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

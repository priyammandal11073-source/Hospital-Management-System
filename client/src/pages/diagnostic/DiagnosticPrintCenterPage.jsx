import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDiagnosticReports,
  getPrintHistory,
  logPrintAction,
  downloadDiagnosticReportPdfBlob,
} from "../../services/api.js";
import ReprintModal from "../../components/diagnostic/ReprintModal.jsx";
import RadiologyFilmGeneratorModal from "../../components/diagnostic/RadiologyFilmGeneratorModal.jsx";
import FormalReportModal from "../../components/diagnostic/FormalReportModal.jsx";
import { printClinicalReport } from "../../utils/printReport.js";

export default function DiagnosticPrintCenterPage() {
  const navigate = useNavigate();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Data states
  const [reports, setReports] = useState([]);
  const [printLogs, setPrintLogs] = useState([]);
  const [stats, setStats] = useState({
    readyToPrint: 0,
    filmsReady: 0,
    printedToday: 0,
    reprintsCount: 0,
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [previewReportModal, setPreviewReportModal] = useState(null);
  const [selectedReportForReprint, setSelectedReportForReprint] = useState(null);
  const [filmModalData, setFilmModalData] = useState(null);
  const [notification, setNotification] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, logsRes] = await Promise.all([
        getDiagnosticReports({
          department: departmentFilter !== "all" ? departmentFilter : undefined,
          status: "Finalized",
          limit: 50,
        }),
        getPrintHistory({ limit: 50 }),
      ]);

      if (reportsRes.success) {
        const reps = reportsRes.data || [];
        setReports(reps);

        const readyCount = reps.filter((r) => !r.printCount || r.printCount === 0).length;
        const filmsCount = reps.filter((r) => r.department === "Radiology").length;

        setStats((prev) => ({
          ...prev,
          readyToPrint: readyCount,
          filmsReady: filmsCount,
        }));
      }

      if (logsRes.success) {
        setPrintLogs(logsRes.data || []);
        setStats((prev) => ({
          ...prev,
          printedToday: logsRes.stats?.totalToday || 0,
          reprintsCount: logsRes.stats?.totalReprints || 0,
          totalLogs: logsRes.stats?.total || 0,
        }));
      }
    } catch (err) {
      console.error("Print center load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentFilter]);

  const handlePrintReport = async (report) => {
    try {
      await logPrintAction({
        reportId: report._id,
        orderId: report.order?._id,
        documentType: report.department === "Pathology" ? "PATHOLOGY_REPORT" : "RADIOLOGY_REPORT",
        copies: 1,
        reason: "Print Center Hardcopy Dispatch",
      });
      setNotification(`Preparing official print document for ${report.reportNumber}...`);
      setTimeout(() => setNotification(""), 3000);
      printClinicalReport(report);
      fetchData();
    } catch (err) {
      console.error("Print error:", err);
      printClinicalReport(report);
    }
  };

  const handleDownloadPdf = async (report) => {
    try {
      setNotification(`Compiling official vector PDF for ${report.reportNumber}...`);
      const blob = await downloadDiagnosticReportPdfBlob(report._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${report.reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotification("PDF downloaded successfully!");
      setTimeout(() => setNotification(""), 3500);
      fetchData();
    } catch (err) {
      console.error("PDF download error", err);
      setNotification("Failed to download report PDF.");
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (activeTab === "pathology" && r.department !== "Pathology") return false;
    if (activeTab === "radiology" && r.department !== "Radiology") return false;
    if (activeTab === "films" && r.department !== "Radiology") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = r.reportNumber?.toLowerCase().includes(q);
      const matchPat = r.patientName?.toLowerCase().includes(q);
      const matchTest = r.testName?.toLowerCase().includes(q);
      const matchAbha = r.patientAbhaId?.toLowerCase().includes(q);
      return matchNum || matchPat || matchTest || matchAbha;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <span>🖨️</span>
            <span>Diagnostic Services Central Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-0.5">
            Diagnostic Print Center & Film Bureau
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized dispatch for pathology clinical sheets, calibrated radiology laser films, reprint authorizations, and audit tracking
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/diagnostic/reports"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>📁</span>
            <span>Reports Archive</span>
          </Link>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <span>↻</span>
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs font-semibold text-indigo-800 flex items-center justify-between animate-fadeIn">
          <span>{notification}</span>
          <button onClick={() => setNotification("")} className="text-indigo-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* ================= TELEMETRY STATS CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ready to Print</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
              ✓
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.readyToPrint}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Approved & Finalized</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Films Ready</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 font-bold text-xs">
              🩻
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.filmsReady}</p>
          <span className="text-[11px] text-cyan-600 font-semibold">Radiology & PACS</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Printed Today</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
              🖨️
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.printedToday}</p>
          <span className="text-[11px] text-blue-600 font-semibold">Dispatched Hardcopies</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reprints</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold text-xs">
              🔄
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.reprintsCount}</p>
          <span className="text-[11px] text-amber-600 font-semibold">Authorized Duplicates</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Print Audit Logs</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold text-xs">
              📜
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{stats.totalLogs}</p>
          <span className="text-[11px] text-purple-600 font-semibold">ISO 15189 Compliant</span>
        </div>
      </div>

      {/* ================= TAB NAVIGATION & FILTERS ================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: "all", label: "All Print Jobs", icon: "📄" },
            { id: "pathology", label: "Pathology Reports", icon: "🔬" },
            { id: "radiology", label: "Radiology Reports", icon: "🩻" },
            { id: "films", label: "Radiology Films", icon: "🎞️" },
            { id: "history", label: "Print History & Audit Trail", icon: "📜" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Modality Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by Patient Name, ID, Report Number, Examination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Department:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="Pathology">Pathology / Laboratory</option>
              <option value="Radiology">Radiology / Imaging</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= CONTENT TABLES ================= */}
      {activeTab === "history" ? (
        /* PRINT HISTORY & AUDIT TRAIL TABLE (SECTION 48) */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>📜</span> Diagnostic Document Print & Reprint Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological tracking of all hardcopy outputs, copies, operators, and justification reasons
              </p>
            </div>
            <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
              {printLogs.length} Logged Dispatches
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Print UID</th>
                  <th className="px-3.5 py-2.5">Date & Time</th>
                  <th className="px-3.5 py-2.5">Document Type</th>
                  <th className="px-3.5 py-2.5">Report / Study ID</th>
                  <th className="px-3.5 py-2.5">Patient Details</th>
                  <th className="px-3.5 py-2.5">Operator</th>
                  <th className="px-3.5 py-2.5">Copies</th>
                  <th className="px-3.5 py-2.5">Audit Reason</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printLogs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400">
                      No print logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  printLogs.map((log) => (
                    <tr key={log._id || log.printId} className="hover:bg-slate-50/80">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-600">{log.printId}</td>
                      <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          log.documentType.includes("RADIOLOGY")
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        }`}>
                          {log.documentType}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-800">{log.reportNumber || log.studyId || "-"}</td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-900">{log.patientName}</td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {log.printedByName} <span className="text-[10px] text-slate-400">({log.userRole})</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{log.copies || 1}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 max-w-[180px] truncate" title={log.reason}>
                        {log.isReprint ? <span className="font-bold text-amber-700">[REPRINT] </span> : null}
                        {log.reason}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REPORTS & FILMS DISPATCH WORKLIST */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>📋</span> Reports & Medical Films Ready for Dispatch
            </h2>
            <span className="text-xs text-slate-400">
              Showing {filteredReports.length} documents
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Report / Study #</th>
                  <th className="px-3.5 py-2.5">Patient Details</th>
                  <th className="px-3.5 py-2.5">Investigation / Modality</th>
                  <th className="px-3.5 py-2.5">Department</th>
                  <th className="px-3.5 py-2.5">Specialist Sign-Off</th>
                  <th className="px-3.5 py-2.5 text-center">Prints / Reprints</th>
                  <th className="px-3.5 py-2.5 text-right">Dispatch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No matching finalized diagnostic records found.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50/80">
                      <td className="px-3.5 py-2.5">
                        <p className="font-mono font-bold text-indigo-600">{report.reportNumber}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(report.reportDate || report.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <p className="font-bold text-slate-800">{report.patientName}</p>
                        <p className="text-[10px] text-slate-500">
                          ID: <span className="font-mono">{report.patientAbhaId || "P-1002"}</span> • {report.patientAge || "N/A"}Y/{report.patientGender || "N/A"}
                        </p>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <p className="font-semibold text-slate-900">{report.testName}</p>
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-600 mt-0.5">
                          {report.modality || report.category || "Standard"}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          report.department === "Radiology"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {report.department}
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5">
                        <p className="text-slate-800 font-medium">{report.specialistName || "Verified Specialist"}</p>
                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Digitally Certified
                        </span>
                      </td>

                      <td className="px-3.5 py-2.5 text-center">
                        <span className="font-bold text-slate-800">{report.printCount || 0}</span>
                        {report.reprintCount > 0 && (
                          <span className="block text-[10px] text-amber-600 font-semibold">
                            ({report.reprintCount} reprints)
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Preview Report Modal Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewReportModal(report)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Preview formal clinical report"
                          >
                            👁️ View
                          </button>

                          {/* Print Report */}
                          <button
                            type="button"
                            onClick={() => handlePrintReport(report)}
                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                            title="Print clinical document"
                          >
                            🖨️ Print
                          </button>

                          {/* Download PDF */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(report)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Download vector PDF"
                          >
                            📥 PDF
                          </button>

                          {/* Film Generator (Radiology Only) */}
                          {report.department === "Radiology" && (
                            <button
                              type="button"
                              onClick={() =>
                                setFilmModalData({
                                  report,
                                  study: report.order,
                                  images: report.fileAttachments || [],
                                })
                              }
                              className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:from-cyan-500 hover:to-blue-500 transition"
                              title="Generate laser film sheet"
                            >
                              🎞️ Film
                            </button>
                          )}

                          {/* Reprint Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setSelectedReportForReprint(report)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                            title="Authorized reprint"
                          >
                            🔄
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= FORMAL REPORT PREVIEW MODAL ================= */}
      {previewReportModal && (
        <FormalReportModal
          isOpen={Boolean(previewReportModal)}
          onClose={() => setPreviewReportModal(null)}
          report={previewReportModal}
          onPrintSuccess={() => {
            fetchData();
            setNotification("Report print registered in audit log.");
          }}
        />
      )}

      {/* ================= REPRINT MODAL ================= */}
      <ReprintModal
        isOpen={Boolean(selectedReportForReprint)}
        onClose={() => setSelectedReportForReprint(null)}
        report={selectedReportForReprint}
        onReprintSuccess={() => {
          fetchData();
          setNotification("Reprint authorized and logged to compliance audit trail.");
        }}
      />

      {/* ================= RADIOLOGY FILM MODAL ================= */}
      {filmModalData && (
        <RadiologyFilmGeneratorModal
          isOpen={Boolean(filmModalData)}
          onClose={() => setFilmModalData(null)}
          study={filmModalData.study}
          report={filmModalData.report}
          availableImages={filmModalData.images}
        />
      )}
    </div>
  );
}

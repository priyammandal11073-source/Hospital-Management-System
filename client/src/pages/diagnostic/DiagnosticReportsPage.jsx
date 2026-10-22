import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDiagnosticReports,
  downloadDiagnosticReportPdfBlob,
  logPrintAction,
} from "../../services/api.js";
import ReprintModal from "../../components/diagnostic/ReprintModal.jsx";
import { printClinicalReport, generateReportHtml } from "../../utils/printReport.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";

export default function DiagnosticReportsPage() {
  const { openPrintPreview } = usePrintModal();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Formal Printable Modal
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reprintModalReport, setReprintModalReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticReports({
        department: departmentFilter !== "all" ? departmentFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 100,
      });
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load diagnostic reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [departmentFilter]);

  const handlePrint = async () => {
    if (activeReportModal?._id) {
      try {
        await logPrintAction({
          reportId: activeReportModal._id,
          orderId: activeReportModal.order?._id,
          documentType: activeReportModal.department === "Pathology" ? "PATHOLOGY_REPORT" : "RADIOLOGY_REPORT",
          copies: 1,
          reason: "Formal Report Modal Print",
        });
      } catch {}

      try {
        const html = generateReportHtml(activeReportModal);
        openPrintPreview({
          title: `Diagnostic Report - ${activeReportModal.reportNumber || "Report"}`,
          htmlContent: html,
          refNumber: activeReportModal.reportNumber,
        });
      } catch {
        printClinicalReport(activeReportModal);
      }
    }
  };

  const handleDownloadPdf = async (report) => {
    try {
      setIsDownloadingPdf(true);
      const blob = await downloadDiagnosticReportPdfBlob(report._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${report.reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Finalized Diagnostic Reports Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Electronically verified, digitally signed medical investigations for patients and clinicians
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Search report #, patient name, ABHA ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchReports()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Departments</option>
          <option value="Pathology">Pathology & Laboratory</option>
          <option value="Radiology">Radiology & Imaging</option>
        </select>

        <button
          type="button"
          onClick={fetchReports}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Loading finalized medical reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No diagnostic reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Report #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Investigation</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Signing Specialist</th>
                  <th className="p-3.5">Report Date</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-indigo-700">
                      {r.reportNumber}
                      {r.isCritical && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{r.patientName}</p>
                      <p className="text-[11px] text-slate-400">ABHA: {r.patientAbhaId || "Verified"}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{r.testName}</p>
                      <p className="text-[11px] text-slate-400">{r.category}</p>
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
                      <p className="font-semibold text-slate-800">
                        {r.digitalSignature?.signedBy || r.specialistName || "Consultant"}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">Digitally Signed ✓</p>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(r.reportDate || r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={
                            r.department === "Pathology"
                              ? `/diagnostic/pathology/${r._id}`
                              : `/diagnostic/radiology/${r._id}`
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          title="Open full investigation workspace"
                        >
                          👁️ View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(r)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                          title="Download official PDF"
                        >
                          📥 PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            logPrintAction({
                              reportId: r._id,
                              orderId: r.order?._id,
                              documentType: r.department === "Pathology" ? "PATHOLOGY_REPORT" : "RADIOLOGY_REPORT",
                              copies: 1,
                              reason: "Direct Archive Print",
                            }).catch(() => {});
                            printClinicalReport(r);
                          }}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition flex items-center gap-1 cursor-pointer"
                          title="Direct Hardcopy Print"
                        >
                          🖨️ Print
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveReportModal(r)}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition"
                          title="View clinical formal sheet"
                        >
                          📄 Sheet
                        </button>
                        <button
                          type="button"
                          onClick={() => setReprintModalReport(r)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          title="Authorized Reprint"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= FORMAL PRINTABLE REPORT MODAL ================= */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-2xl ring-1 ring-slate-900/10 my-8">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600">{activeReportModal.reportNumber}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Digitally Authenticated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeReportModal)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 text-xs font-bold transition"
                >
                  📥 Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-sm cursor-pointer"
                >
                  🖨️ Print Report
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportModal(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* FORMAL CLINICAL REPORT DOCUMENT */}
            <div className="text-slate-900 font-sans space-y-6">
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <HospitalLogo variant="full" />
                  <p className="text-xs font-black tracking-wider text-slate-700 uppercase mt-1">
                    Central Diagnostic Services • Pathology & Radiology Division
                  </p>
                  <p className="text-[11px] text-slate-500">
                    NABH & NABL Accredited Laboratory • ISO 15189:2022 Certified
                  </p>
                  <p className="text-[10px] text-slate-400">
                    24x7 Helpline: 1800-NIVORA | diagnostic.lab@hospital.com | Sector 44, Medical Enclave
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="border border-indigo-200 bg-indigo-50/50 p-2 rounded-lg inline-block">
                    <p className="font-mono font-bold text-indigo-900">REP: {activeReportModal.reportNumber}</p>
                    <p className="text-[10px] text-slate-500">Date: {new Date(activeReportModal.reportDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Patient Demographics Table */}
              <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{activeReportModal.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Age / Gender</span>
                  <span className="font-semibold text-slate-800">{activeReportModal.patientAge || "Adult"} / {activeReportModal.patientGender || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ABHA Health ID</span>
                  <span className="font-mono font-bold text-indigo-800">{activeReportModal.patientAbhaId || "VERIFIED"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Referring Consultant</span>
                  <span className="font-semibold text-slate-800">{activeReportModal.doctorName || "OPD Consultant"}</span>
                </div>
              </div>

              {/* Investigation Title */}
              <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {activeReportModal.testName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Category: {activeReportModal.category} • Specimen: {activeReportModal.modality || "Clinical Specimen"}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {activeReportModal.department}
                </span>
              </div>

              {/* PATHOLOGY: PARAMETERS & REFERENCE RANGES */}
              {activeReportModal.department === "Pathology" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b-2 border-slate-300 text-[11px] font-bold uppercase text-slate-700">
                          <th className="py-2">Investigation Analyte</th>
                          <th className="py-2">Observed Value</th>
                          <th className="py-2">Units</th>
                          <th className="py-2">Biological Reference Range</th>
                          <th className="py-2 text-right">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {(activeReportModal.testResults || []).map((t, idx) => (
                          <tr key={idx}>
                            <td className="py-2 font-bold text-slate-900">{t.parameter}</td>
                            <td className="py-2 font-black text-slate-950 text-sm">{t.result}</td>
                            <td className="py-2 text-slate-600">{t.unit}</td>
                            <td className="py-2 text-slate-600">{t.referenceRange}</td>
                            <td className="py-2 text-right">
                              {t.status === "critical" ? (
                                <span className="font-black text-rose-600 animate-pulse">*** CRITICAL ***</span>
                              ) : t.status === "high" ? (
                                <span className="font-bold text-amber-700">HIGH (H)</span>
                              ) : t.status === "low" ? (
                                <span className="font-bold text-blue-700">LOW (L)</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Normal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RADIOLOGY: STUDY OBSERVATIONS & IMPRESSION */}
              {activeReportModal.department === "Radiology" && activeReportModal.radiologyStudy && (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <h3 className="font-bold uppercase text-slate-800 text-[11px]">Examination Technique</h3>
                    <p className="text-slate-700 mt-0.5">{activeReportModal.radiologyStudy.technique}</p>
                  </div>
                  <div>
                    <h3 className="font-bold uppercase text-slate-800 text-[11px]">Observations / Findings</h3>
                    <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {activeReportModal.radiologyStudy.findings}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold uppercase text-slate-800 text-[11px]">Impression</h3>
                    <p className="text-slate-900 font-bold mt-0.5 bg-indigo-50/60 p-3 rounded-lg border border-indigo-200">
                      {activeReportModal.radiologyStudy.impression}
                    </p>
                  </div>
                  <div className="flex gap-6 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Radiation Dose: <strong>{activeReportModal.radiologyStudy.radiationDose}</strong></span>
                    <span>Contrast: <strong>{activeReportModal.radiologyStudy.contrastUsed}</strong></span>
                  </div>
                </div>
              )}

              {/* Clinical Conclusion */}
              {activeReportModal.summaryConclusion && (
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Diagnostic Conclusion
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {activeReportModal.summaryConclusion}
                  </p>
                </div>
              )}

              {/* Attached Files List */}
              {activeReportModal.attachedFiles?.length > 0 && (
                <div className="text-xs pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Medical Object Attachments
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeReportModal.attachedFiles.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-indigo-700 hover:underline"
                      >
                        <span>📎 {file.originalName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialist Digital Signature & QR Verification Footer */}
              <div className="pt-6 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-3 items-end gap-4">
                <div>
                  {/* Simulated QR Code */}
                  <div className="inline-block p-1.5 border border-slate-300 rounded bg-white">
                    <div className="h-16 w-16 bg-slate-900 flex items-center justify-center text-white text-[9px] text-center font-mono p-1">
                      [ABDM QR VALIDATED]
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">Scan to verify report authenticity</p>
                </div>

                <div className="text-[10px] text-slate-400 hidden sm:block">
                  <p className="font-semibold text-slate-600">Lab Technician:</p>
                  <p>{activeReportModal.technicianName || "Certified Lab Technologist"}</p>
                  <p className="mt-2 text-[9px] text-slate-400">
                    This document contains confidential health information protected under ABDM regulations.
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block text-left p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/50">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <span>✓</span>
                      <span>Digitally Authenticated</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {activeReportModal.digitalSignature?.signedBy || activeReportModal.specialistName || "Consultant"}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {activeReportModal.digitalSignature?.specialistRole || "Consultant Specialist"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Reg: {activeReportModal.digitalSignature?.licenseNumber || "MCI-48921"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REPRINT MODAL ================= */}
      <ReprintModal
        isOpen={Boolean(reprintModalReport)}
        onClose={() => setReprintModalReport(null)}
        report={reprintModalReport}
        onReprintSuccess={() => {
          fetchReports();
        }}
      />
    </div>
  );
}

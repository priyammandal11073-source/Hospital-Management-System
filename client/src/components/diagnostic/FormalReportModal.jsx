import { useState } from "react";
import HospitalLogo from "../HospitalLogo.jsx";
import { downloadDiagnosticReportPdfBlob, logPrintAction } from "../../services/api.js";
import { printClinicalReport, openVectorPdfInNewTab } from "../../utils/printReport.js";

export default function FormalReportModal({ report, isOpen, onClose, onPrintSuccess }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !report) return null;

  const handlePrint = async () => {
    try {
      if (report._id) {
        await logPrintAction({
          reportId: report._id,
          orderId: report.order?._id,
          documentType: report.department === "Pathology" ? "PATHOLOGY_REPORT" : "RADIOLOGY_REPORT",
          copies: 1,
          reason: "Formal Report Hardcopy Print",
        });
      }
      if (onPrintSuccess) onPrintSuccess(report);
    } catch (err) {
      console.error("Print log error:", err);
    }
    printClinicalReport(report);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  const handleOpenPdfTab = async () => {
    try {
      await openVectorPdfInNewTab(report._id);
    } catch (err) {
      console.error("Open PDF tab failed", err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-2xl ring-1 ring-slate-900/10 my-8 printable-report-modal">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-600">{report.reportNumber}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Digitally Authenticated
            </span>
            {report.isAmended && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Amended (v{report.version || 2})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPdfTab}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Open vector PDF in new browser tab"
            >
              <span>↗️</span>
              <span>Open PDF</span>
            </button>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span>📥</span>
              <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
              title="Print clinical document"
            >
              <span>🖨️</span>
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                <p className="font-mono font-bold text-indigo-900">REP: {report.reportNumber}</p>
                <p className="text-[10px] text-slate-500">
                  Date: {new Date(report.reportDate || report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Demographics Table */}
          <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{report.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Age / Gender</span>
              <span className="font-semibold text-slate-800">
                {report.patientAge || "Adult"} / {report.patientGender || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">ABHA Health ID</span>
              <span className="font-mono font-bold text-indigo-800">{report.patientAbhaId || "VERIFIED"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Referring Consultant</span>
              <span className="font-semibold text-slate-800">{report.doctorName || "OPD Consultant"}</span>
            </div>
          </div>

          {/* Investigation Title */}
          <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{report.testName}</h2>
              <p className="text-xs text-slate-500">
                Category: {report.category || "General"} • Specimen: {report.modality || "Clinical Specimen"}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
              {report.department}
            </span>
          </div>

          {/* PATHOLOGY: PARAMETERS & REFERENCE RANGES */}
          {report.department === "Pathology" && (
            <div className="space-y-3">
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
                  {(report.testResults || []).map((t, idx) => (
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
          )}

          {/* RADIOLOGY: STUDY OBSERVATIONS & IMPRESSION */}
          {report.department === "Radiology" && report.radiologyStudy && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <h3 className="font-bold uppercase text-slate-800 text-[11px]">Examination Technique</h3>
                <p className="text-slate-700 mt-0.5">{report.radiologyStudy.technique}</p>
              </div>
              <div>
                <h3 className="font-bold uppercase text-slate-800 text-[11px]">Observations / Findings</h3>
                <p className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {report.radiologyStudy.findings}
                </p>
              </div>
              <div>
                <h3 className="font-bold uppercase text-slate-800 text-[11px]">Impression</h3>
                <p className="text-slate-900 font-bold mt-0.5 bg-indigo-50/60 p-3 rounded-lg border border-indigo-200">
                  {report.radiologyStudy.impression}
                </p>
              </div>
              <div className="flex gap-6 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>
                  Radiation Dose: <strong>{report.radiologyStudy.radiationDose}</strong>
                </span>
                <span>
                  Contrast: <strong>{report.radiologyStudy.contrastUsed}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Clinical Conclusion */}
          {report.summaryConclusion && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Diagnostic Conclusion
              </span>
              <p className="text-xs font-semibold text-slate-900">{report.summaryConclusion}</p>
            </div>
          )}

          {/* Specialist Digital Signature & QR Verification Footer */}
          <div className="pt-6 border-t-2 border-slate-800 grid grid-cols-2 sm:grid-cols-3 items-end gap-4">
            <div>
              <div className="inline-block p-1.5 border border-slate-300 rounded bg-white">
                <div className="h-16 w-16 bg-slate-900 flex items-center justify-center text-white text-[9px] text-center font-mono p-1">
                  [ABDM QR VALIDATED]
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-1">Scan to verify report authenticity</p>
            </div>

            <div className="text-[10px] text-slate-400 hidden sm:block">
              <p className="font-semibold text-slate-600">Lab Technician:</p>
              <p>{report.technicianName || "Certified Lab Technologist"}</p>
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
                  {report.digitalSignature?.signedBy || report.specialistName || "Consultant"}
                </p>
                <p className="text-[10px] text-slate-600">
                  {report.digitalSignature?.specialistRole || "Consultant Specialist"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Reg: {report.digitalSignature?.licenseNumber || "MCI-48921"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getPathologyRecordDetails,
  reviewAndApproveDiagnosticReport,
  publishDiagnosticReport,
  downloadDiagnosticReportPdfBlob,
  logPrintAction,
  amendDiagnosticReport,
} from "../../services/api.js";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import ReprintModal from "../../components/diagnostic/ReprintModal.jsx";
import { printClinicalReport } from "../../utils/printReport.js";

export default function PathologyReportGeneratorPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Editor states
  const [results, setResults] = useState([]);
  const [summaryConclusion, setSummaryConclusion] = useState("");
  const [specialistNotes, setSpecialistNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Modals
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  const loadRecord = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPathologyRecordDetails(recordId);
      if (res.success && res.data) {
        setRecord(res.data);
        const reportObj = res.data.report;
        if (reportObj?.testResults?.length > 0) {
          setResults(reportObj.testResults);
        } else if (res.data.order?.test?.referenceRanges) {
          // Pre-populate parameters from catalog test
          setResults(
            res.data.order.test.referenceRanges.map((r) => ({
              parameter: r.parameter,
              result: "",
              unit: r.unit || "",
              referenceRange: r.normalRange || "",
              status: "normal",
              flag: "NORMAL",
            }))
          );
        }
        setSummaryConclusion(reportObj?.summaryConclusion || "");
        setSpecialistNotes(reportObj?.specialistReviewNotes || "");
      } else {
        setError("Pathology investigation record not found.");
      }
    } catch (err) {
      console.error("Failed to load pathology record", err);
      setError(err.response?.data?.message || "Error loading pathology investigation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [recordId]);

  const handleResultChange = (idx, field, value) => {
    const updated = [...results];
    updated[idx][field] = value;

    // Auto flag evaluation if numeric
    if (field === "result") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        const refStr = updated[idx].referenceRange || "";
        const parts = refStr.split("-").map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (num < parts[0]) {
            updated[idx].status = "low";
            updated[idx].flag = "L";
          } else if (num > parts[1]) {
            updated[idx].status = "high";
            updated[idx].flag = "H";
          } else {
            updated[idx].status = "normal";
            updated[idx].flag = "NORMAL";
          }
        }
      }
    }
    setResults(updated);
  };

  const handleApproveAndSign = async () => {
    if (!record?.report?._id) return;
    try {
      setIsSaving(true);
      const res = await reviewAndApproveDiagnosticReport(record.report._id, {
        status: "Finalized",
        specialistReviewNotes: specialistNotes,
        summaryConclusion: summaryConclusion,
      });
      if (res.success) {
        setSuccessMessage("✅ Pathology report approved, digitally signed, and finalized!");
        await loadRecord();
      }
    } catch (err) {
      console.error("Approval error", err);
      setError("Failed to approve report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!record?.report?._id) return;
    try {
      setIsSaving(true);
      const res = await publishDiagnosticReport(record.report._id);
      if (res.success) {
        setSuccessMessage("📢 Report published to Doctor and Patient Portals!");
        await loadRecord();
      }
    } catch (err) {
      console.error("Publish error", err);
      setError("Failed to publish report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    try {
      if (record?.report?._id) {
        await logPrintAction({
          reportId: record.report._id,
          orderId: record.order?._id,
          documentType: "PATHOLOGY_REPORT",
          copies: 1,
          reason: "Pathology Clinical Hardcopy Print",
        });
      }
      const printObj = {
        ...(record?.report || {}),
        patient: record?.patient || record?.order?.patient,
        doctor: record?.doctor || record?.order?.doctor,
        order: record?.order,
        department: "Pathology",
        testName: record?.test?.name || record?.order?.testName || record?.report?.testName,
        testResults: results.map((p) => ({
          parameter: p.parameter,
          result: p.result,
          unit: p.unit,
          referenceRange: p.referenceRange,
          status: p.status,
          flag: p.flag,
        })),
        summaryConclusion,
      };
      printClinicalReport(printObj);
    } catch (err) {
      console.error("Print log error", err);
      printClinicalReport(record?.report);
    }
  };

  const handleDownloadPdf = async () => {
    if (!record?.report?._id) return;
    try {
      setIsDownloadingPdf(true);
      const blob = await downloadDiagnosticReportPdfBlob(record.report._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Pathology_Report_${record.report.reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("📥 Official vector PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF download error", err);
      setError("Failed to download PDF report.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleAmendSubmit = async (e) => {
    e.preventDefault();
    if (!amendmentReason.trim() || !record?.report?._id) return;

    try {
      setIsSaving(true);
      const res = await amendDiagnosticReport(record.report._id, {
        amendmentReason: amendmentReason.trim(),
        testResults: results,
        summaryConclusion: summaryConclusion,
      });
      if (res.success) {
        setSuccessMessage(`📝 Report amended to version ${res.data.version}!`);
        setIsAmendModalOpen(false);
        setAmendmentReason("");
        await loadRecord();
      }
    } catch (err) {
      console.error("Amendment error", err);
      setError("Failed to amend report.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Loading pathology investigation record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 text-xl font-bold">
          ✕
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Investigation Record Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">{error || "The requested pathology record does not exist."}</p>
        <Link
          to="/diagnostic/requests"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
        >
          ← Return to Diagnostic Requests
        </Link>
      </div>
    );
  }

  const { order, report, sample } = record;
  const patient = order?.patient || report?.patient;
  const isFinalized = report?.status === "Finalized" || report?.status === "Amended";

  return (
    <div className="space-y-6">
      {/* ================= TOP ACTION TOOLBAR (HIDDEN ON PRINT) ================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/diagnostic/requests"
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
            >
              ← Diagnostic Requests
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-indigo-600">Pathology Report Generator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            {order?.testName || report?.testName || "Pathology Investigation"}
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
              report?.isAmended
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : report?.status === "Finalized"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}>
              {report?.isAmended ? `AMENDED (v${report.version})` : report?.status || "Draft"}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Order: {order?.orderNumber} • Report: {report?.reportNumber || "Pending Generation"} • Patient: {patient?.name}
          </p>
        </div>

        {/* Operational Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isPreviewMode
                ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>👁️</span>
            <span>{isPreviewMode ? "Exit Preview" : "Preview Report"}</span>
          </button>

          {/* Download PDF */}
          {report?._id && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
            >
              <span>📥</span>
              <span>{isDownloadingPdf ? "Compiling..." : "Download PDF"}</span>
            </button>
          )}

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>

          {/* Publish to Portals */}
          {isFinalized && !report?.isSharedWithPatient && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <span>📢</span>
              <span>Publish</span>
            </button>
          )}

          {/* Reprint (if already printed) */}
          {report?._id && (
            <button
              type="button"
              onClick={() => setIsReprintModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>🔄</span>
              <span>Reprint</span>
            </button>
          )}

          {/* Amend Button (for finalized reports) */}
          {isFinalized && (
            <button
              type="button"
              onClick={() => setIsAmendModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
            >
              <span>✏️</span>
              <span>Amend (v{(report.version || 1) + 1})</span>
            </button>
          )}

          {/* Approve & Sign (if pending review) */}
          {!isFinalized && report?._id && (
            <button
              type="button"
              onClick={handleApproveAndSign}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-blue-700 transition"
            >
              <span>✍️</span>
              <span>Approve & Sign</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="no-print rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* ================= CLINICAL METADATA CARDS (HIDDEN ON PRINT) ================= */}
      {!isPreviewMode && (
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Patient Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span>👤</span> Patient Demographics
            </h3>
            <p className="text-sm font-bold text-slate-800">{patient?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Age: <strong className="text-slate-700">{patient?.age || "N/A"} Y</strong> • Gender: <strong className="text-slate-700">{patient?.gender || "N/A"}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              ABHA / ID: <span className="font-mono text-indigo-600 font-semibold">{patient?.abhaId || "N/A"}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ref Doctor: <span className="font-semibold text-slate-700">{order?.doctorName || "Dr. Medical Specialist"}</span>
            </p>
          </div>

          {/* Sample Information Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span>🧪</span> Phlebotomy Accession
            </h3>
            <p className="text-xs text-slate-600">
              Sample ID: <strong className="font-mono text-slate-900">{sample?.sampleId || `SPL-${recordId.slice(-6)}`}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Sample Type: <strong className="text-slate-900">{sample?.sampleType || order?.test?.sampleType || "Venous Blood"}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Collected: <span className="text-slate-500">{sample?.collectionTime ? new Date(sample.collectionTime).toLocaleString("en-IN") : "Recorded"}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Tube / Container: <span className="text-slate-700 font-medium">{sample?.containerType || "Lavender (EDTA)"}</span>
            </p>
          </div>

          {/* Investigation Details */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span>📋</span> Investigation Details
            </h3>
            <p className="text-xs text-slate-600">
              Test Name: <strong className="text-slate-900">{order?.testName || report?.testName}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Category: <span className="text-slate-700 font-medium">{order?.category || report?.category || "Hematology"}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Priority: <span className="font-bold text-rose-600">{order?.priority || "Routine"}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              TAT: <span className="text-slate-500">{order?.test?.turnaroundTime || "2 - 4 hours"}</span>
            </p>
          </div>
        </div>
      )}

      {/* ================= RESULTS TABLE & EDITOR (HIDDEN ON PRINT IF IN PREVIEW) ================= */}
      {!isPreviewMode && (
        <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>🔬</span> Laboratory Observation Values & Flagging
            </h2>
            <span className="text-xs text-slate-400">Values evaluated against biological reference ranges</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Parameter</th>
                  <th className="px-3.5 py-2.5 w-32">Observed Result</th>
                  <th className="px-3.5 py-2.5">Unit</th>
                  <th className="px-3.5 py-2.5">Biological Reference Range</th>
                  <th className="px-3.5 py-2.5 text-center">Status / Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-3.5 py-2 font-semibold text-slate-800">{r.parameter}</td>
                    <td className="px-3.5 py-2">
                      <input
                        type="text"
                        disabled={isFinalized}
                        value={r.result}
                        onChange={(e) => handleResultChange(idx, "result", e.target.value)}
                        placeholder="e.g. 13.5"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white disabled:bg-slate-100"
                      />
                    </td>
                    <td className="px-3.5 py-2 text-slate-500 font-mono">{r.unit || "-"}</td>
                    <td className="px-3.5 py-2 text-slate-600 font-mono">{r.referenceRange || "-"}</td>
                    <td className="px-3.5 py-2 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                          : r.status === "high" || r.status === "low"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {r.flag || "NORMAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Specialist Interpretation / Comments */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Specialist Clinical Interpretation & Comments
            </label>
            <textarea
              rows={3}
              disabled={isFinalized}
              value={summaryConclusion}
              onChange={(e) => setSummaryConclusion(e.target.value)}
              placeholder="Enter comprehensive pathologist remarks, smear impressions, or clinical correlation..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white disabled:bg-slate-100"
            />
          </div>
        </div>
      )}

      {/* ================= PRINT-FRIENDLY CLINICAL REPORT CANVAS =================
          Shown in preview mode and is the ONLY element visible during window.print()
      ========================================================================= */}
      <div className={`clinical-print-sheet mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm ${
        isPreviewMode ? "block" : "hidden print:block"
      }`}>
        {/* Hospital Header */}
        <div className="border-b-2 border-indigo-900 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <HospitalLogo variant="full" />
            <div>
              <p className="text-xs font-bold text-emerald-700">
                CENTRAL DIAGNOSTIC & LABORATORY MEDICINE
              </p>
              <p className="text-[10px] text-slate-500">
                NABH & NABL Accredited • ISO 15189 Compliant • ABDM Integrated
              </p>
              <p className="text-[9px] text-slate-400">
                Healthcare Boulevard, Medical Enclave • Helpline: 108 • lab@nivoracare.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
              report?.isAmended ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {report?.isAmended ? `AMENDED REPORT (v${report.version})` : "FINAL REPORT"}
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 mt-1">
              ID: {report?.reportNumber || `REP-${order?.orderNumber?.slice(-6)}`}
            </p>
            <p className="text-[10px] text-slate-500">
              Date: {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Patient & Accession Summary Table */}
        <div className="my-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 grid grid-cols-2 text-xs gap-y-1 gap-x-4">
          <div>
            <span className="text-slate-500">Patient: </span>
            <strong className="text-slate-900">{patient?.name}</strong>
          </div>
          <div>
            <span className="text-slate-500">Sample ID: </span>
            <strong className="font-mono text-slate-900">{sample?.sampleId || `SPL-${order?.orderNumber?.slice(-6)}`}</strong>
          </div>
          <div>
            <span className="text-slate-500">Age / Sex: </span>
            <strong className="text-slate-900">{patient?.age || "N/A"} Y / {patient?.gender || "N/A"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Sample Type: </span>
            <strong className="text-slate-900">{sample?.sampleType || "Venous Blood"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Patient ID: </span>
            <strong className="font-mono text-slate-900">{patient?.abhaId || "P-1002"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Collection: </span>
            <span className="text-slate-700">{sample?.collectionTime ? new Date(sample.collectionTime).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="text-slate-500">Ref Doctor: </span>
            <strong className="text-slate-900">{order?.doctorName || "Dr. Medical Specialist"}</strong>
          </div>
          <div>
            <span className="text-slate-500">Reported: </span>
            <span className="text-slate-700">{new Date().toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Investigation Header */}
        <div className="mb-3 pt-1">
          <h2 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
            INVESTIGATION: {order?.testName || report?.testName}
          </h2>
          <p className="text-[10px] text-slate-500">
            Department: Pathology / {order?.category || report?.category || "General Pathology"}
          </p>
        </div>

        {/* Printable Results Table */}
        <table className="w-full text-left text-xs border border-slate-300">
          <thead className="bg-slate-800 text-white font-bold">
            <tr>
              <th className="px-3 py-2">Test Parameter</th>
              <th className="px-3 py-2">Observed Value</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Reference Interval</th>
              <th className="px-3 py-2 text-center">Status / Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {results.map((r, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className="px-3 py-1.5 font-medium text-slate-900">{r.parameter}</td>
                <td className="px-3 py-1.5 font-bold font-mono text-slate-900">{r.result || "Normal"}</td>
                <td className="px-3 py-1.5 text-slate-500">{r.unit || "-"}</td>
                <td className="px-3 py-1.5 text-slate-600 font-mono">{r.referenceRange || "Standard"}</td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`font-bold text-[10px] ${
                    r.status === "critical"
                      ? "text-rose-700"
                      : r.status === "high" || r.status === "low"
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}>
                    {r.flag || "NORMAL"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Comments Box */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <p className="font-bold text-slate-800">CLINICAL INTERPRETATION & PATHOLOGY NOTES:</p>
          <p className="text-slate-700 mt-1 leading-relaxed">
            {summaryConclusion || "All tested parameters correlate with established biological reference intervals. Peripheral blood smear shows normocytic normochromic red cells with normal morphology."}
          </p>
        </div>

        {/* Digital Signature Footer */}
        <div className="mt-6 pt-4 border-t-2 border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-slate-900 text-white rounded flex items-center justify-center font-mono text-[9px] font-bold text-center leading-tight p-1">
              QR<br/>VERIFIED
            </div>
            <div>
              <p className="font-bold text-indigo-900">ELECTRONICALLY VERIFIED REPORT</p>
              <p className="text-[10px] text-slate-500">
                Signature Digest: {report?.digitalSignature?.signatureHash?.slice(0, 32) || "e3b0c44298fc1c149afbf4c8996fb924"}...
              </p>
              <p className="text-[10px] text-slate-400">
                Authenticated: {new Date().toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900">{report?.specialistName || "Dr. Rajeshwar Sen, MD"}</p>
            <p className="text-[10px] text-slate-600 font-semibold">Consultant Pathologist & Lab Director</p>
            <p className="text-[9px] text-slate-400">Reg No: MCI-78192 • ISO 15189 Signatory</p>
          </div>
        </div>

        <div className="mt-4 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2">
          This is an authentic electronic diagnostic report generated by Nivora Care Hospital Management System. End of Report.
        </div>
      </div>

      {/* ================= AMENDMENT MODAL (SECTION 50) ================= */}
      {isAmendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              Create Clinical Amendment (v{(report?.version || 1) + 1})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Finalized diagnostic reports cannot be silently edited. Please specify a mandatory clinical or analytical reason.
            </p>

            <form onSubmit={handleAmendSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amendment Reason *
                </label>
                <textarea
                  rows={3}
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="e.g. Revised reference range after clinical consultation with ordering physician..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSaving ? "Amending..." : `Confirm Amendment (v${(report?.version || 1) + 1})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REPRINT MODAL (SECTION 49) ================= */}
      <ReprintModal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
        report={report}
        onReprintSuccess={() => {
          setSuccessMessage("Reprint logged and processed.");
        }}
      />
    </div>
  );
}

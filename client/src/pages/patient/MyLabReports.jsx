import { useEffect, useState } from "react";
import { getMyLabReports, downloadDiagnosticReportPdfBlob } from "../../services/api.js";
import { printClinicalReport } from "../../utils/printReport.js";

const STATUS_CLASSES = {
  ordered: "bg-amber-50 text-amber-800 border-amber-200",
  sample_collected: "bg-sky-50 text-sky-800 border-sky-200",
  in_progress: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200",
};

export default function MyLabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewReport, setPreviewReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getMyLabReports();
      setReports(data.reports || []);
    } catch (err) {
      setError("Unable to load lab reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>🧪 My Diagnostic & Lab Reports</span>
          <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
            Pathology & Scans
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access and download your official hospital pathology, blood tests, and scan results.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          Loading your test reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 text-xs space-y-2">
          <span className="text-4xl block">🧪</span>
          <p className="font-bold text-slate-700">No lab reports found</p>
          <p>Once tests are ordered or completed by the hospital laboratory, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {report.reportNumber}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      {report.testName}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      STATUS_CLASSES[report.status] || "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                    {report.category}
                  </span>
                  <span>
                    📅{" "}
                    {new Date(report.testDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {report.summaryConclusion && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    <strong>Findings:</strong> {report.summaryConclusion}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewReport(report)}
                  className="text-xs font-black text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>👁️ View Full Report</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const blob = await downloadDiagnosticReportPdfBlob(report._id);
                        const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", `${report.reportNumber || "Report"}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.parentNode.removeChild(link);
                      } catch (err) {
                        if (report.attachmentUrl) {
                          window.open(report.attachmentUrl, "_blank");
                        } else {
                          alert("PDF Report is currently being processed or unavailable.");
                        }
                      }
                    }}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                  >
                    <span>📄 Official PDF</span>
                  </button>

                  {report.attachmentUrl && (
                    <a
                      href={report.attachmentUrl}
                      download={report.attachmentName || "lab-report.pdf"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-slate-700 hover:text-teal-700 flex items-center gap-1"
                    >
                      <span>📎 File</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: PREVIEW / PRINT REPORT ── */}
      {previewReport && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="printable-report-modal w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="font-bold text-sm">Diagnostic Report Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printClinicalReport(previewReport)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs bg-white">
              {/* Header */}
              <div className="border-b-2 border-teal-800 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-teal-800">Nivora Care Hospital</h2>
                  <p className="text-slate-500 text-[11px]">Central Diagnostic & Pathology Department</p>
                  <p className="text-slate-500 text-[10px]">Outer Ring Road, AIIMS Metro, New Delhi</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-slate-900 text-sm">{previewReport.reportNumber}</p>
                  <p className="text-slate-500 text-[11px]">
                    Date: {new Date(previewReport.testDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Test Title */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Test Name</p>
                  <p className="font-bold text-slate-900 text-sm">{previewReport.testName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] uppercase">Category</p>
                  <p className="font-bold text-teal-800">{previewReport.category}</p>
                </div>
              </div>

              {/* Results Table */}
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3">Test Parameter</th>
                    <th className="py-2 px-3">Observed Result</th>
                    <th className="py-2 px-3">Units</th>
                    <th className="py-2 px-3">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewReport.testResults?.map((res, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{res.parameter}</td>
                      <td className="py-2 px-3 font-black text-teal-800">{res.result}</td>
                      <td className="py-2 px-3 text-slate-600">{res.unit}</td>
                      <td className="py-2 px-3 text-slate-500">{res.referenceRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Remarks */}
              {previewReport.summaryConclusion && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200">
                  <p className="font-bold text-teal-950 mb-0.5">Conclusion / Remarks:</p>
                  <p className="text-slate-700">{previewReport.summaryConclusion}</p>
                </div>
              )}

              {/* Attachment */}
              {previewReport.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={previewReport.attachmentUrl}
                    download={previewReport.attachmentName || "lab-report.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition"
                  >
                    <span>📎 Download Attached File ({previewReport.attachmentName || "Report"})</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

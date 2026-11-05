import { useEffect, useState } from "react";
import { getMyLabReports, downloadDiagnosticReportPdfBlob } from "../../services/api.js";
import { printClinicalReport } from "../../utils/printReport.js";
import { PageHeader } from "../../components/ui/index.js";

const STATUS_CLASSES = {
  ordered: "bg-amber-50 text-amber-800 border-amber-200/70",
  sample_collected: "bg-sky-50 text-sky-800 border-sky-200/70",
  in_progress: "bg-teal-50 text-teal-800 border-teal-200/70",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200/70",
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
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Diagnostics & Lab Reports", active: true },
        ]}
        title="My Diagnostic & Lab Reports"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Pathology & Scans
          </span>
        }
        subtitle="Access and download your official hospital pathology, blood tests, and scan results."
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-bold shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your test reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <span className="text-3xl block mb-2">🧪</span>
          <p className="font-bold text-slate-800 text-sm">No lab reports found</p>
          <p className="text-xs text-slate-500 mt-1">Once tests are ordered or completed by the hospital laboratory, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {report.reportNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {report.testName}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full liquid-glass-pill border ${
                      STATUS_CLASSES[report.status] || "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200/70">
                    {report.category}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    📅{" "}
                    {new Date(report.testDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {report.summaryConclusion && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    <strong className="text-slate-800">Findings:</strong> {report.summaryConclusion}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewReport(report)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>👁️ View Full Report</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printClinicalReport(report)}
                    className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <span>🖨️ Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const blob = await downloadDiagnosticReportPdfBlob(report._id);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${report.reportNumber || "Report"}.pdf`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        printClinicalReport(report);
                      }
                    }}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-3 py-1.5 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>⬇ PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden border border-slate-200/80">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="font-bold text-sm">Diagnostic Report Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printClinicalReport(previewReport)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs bg-white">
              {/* Header */}
              <div className="border-b-2 border-teal-800 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-teal-800">Nivora Care Hospital</h2>
                  <p className="text-slate-500 text-[11px]">Central Diagnostic & Pathology Department</p>
                  <p className="text-slate-400 text-[10px]">Outer Ring Road, AIIMS Metro, New Delhi</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900 text-sm">{previewReport.reportNumber}</p>
                  <p className="text-slate-500 text-[11px] font-mono">
                    Date: {new Date(previewReport.testDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Test Title */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 flex justify-between">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Test Name</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{previewReport.testName}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Category</p>
                  <p className="font-semibold text-teal-800 mt-0.5">{previewReport.category}</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left min-w-[420px]">
                  <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-3">Test Parameter</th>
                      <th className="py-2.5 px-3">Observed Result</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewReport.testResults?.map((res, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-semibold text-slate-800">{res.parameter}</td>
                        <td className="py-2 px-3 font-bold text-teal-800 font-mono">{res.result}</td>
                        <td className="py-2 px-3 text-slate-600">{res.unit}</td>
                        <td className="py-2 px-3 text-slate-500">{res.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              {previewReport.summaryConclusion && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/70">
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
                    className="inline-flex items-center gap-1.5 font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition text-xs shadow-2xs"
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

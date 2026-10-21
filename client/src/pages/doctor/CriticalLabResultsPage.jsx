import React, { useState, useEffect } from "react";
import {
  getCriticalLabResults,
  acknowledgeCriticalLabResult,
  downloadDiagnosticReportPdfBlob,
} from "../../services/api.js";
import { printClinicalReport } from "../../utils/printReport.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function CriticalLabResultsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCriticalLabResults();
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load critical lab reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      const res = await acknowledgeCriticalLabResult(selectedReport._id, { notes: reviewNotes });
      if (res.success) {
        setSelectedReport(null);
        setReviewNotes("");
        loadReports();
      } else {
        alert(res.message || "Failed to acknowledge lab report.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error acknowledging critical result.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xl animate-pulse">🧪</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Critical Lab Investigations Queue</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mandatory clinical sign-off for critical abnormal diagnostic parameters
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="h-8 w-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Scanning critical diagnostic results...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-2xl mb-2 block">✓</span>
            <p className="font-semibold text-slate-700">No Critical Unreviewed Lab Results</p>
            <p className="text-[11px] text-slate-400 mt-1">All abnormal parameters have been clinically reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((rep) => (
              <div
                key={rep._id}
                className="bg-white rounded-2xl border border-rose-200 p-5 shadow-2xs space-y-4 hover:border-rose-300 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                      ⚠️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{rep.testName}</h3>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {rep.reportNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {rep.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Patient: <strong className="text-slate-800">{rep.patient?.name}</strong> ({rep.patient?.gender}, {rep.patient?.age}y) • PID: {rep.patient?.patientId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      rep.doctorReviewStatus === "reviewed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                    }`}>
                      {rep.doctorReviewStatus === "reviewed" ? "✓ Clinically Reviewed" : "Needs Doctor Review"}
                    </span>
                    <button
                      type="button"
                      onClick={() => printClinicalReport(rep)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Direct hardcopy print"
                    >
                      🖨️ Print
                    </button>
                    {rep.doctorReviewStatus !== "reviewed" ? (
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        Acknowledge & Sign Review
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const blob = await downloadDiagnosticReportPdfBlob(rep._id);
                            const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute("download", `${rep.reportNumber || "Report"}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.parentNode.removeChild(link);
                          } catch (e) {
                            alert("Failed to download PDF report.");
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        📄 Download PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Parameters table */}
                {((rep.testResults && rep.testResults.length > 0) || rep.criticalDetails?.parameter) && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Test Parameter</th>
                          <th className="px-3 py-2">Observed Result</th>
                          <th className="px-3 py-2">Reference Biological Interval</th>
                          <th className="px-3 py-2">Flag Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rep.testResults && rep.testResults.length > 0 ? (
                          rep.testResults.map((param, i) => (
                            <tr
                              key={i}
                              className={param.status === "critical" ? "bg-rose-50/50 font-semibold" : ""}
                            >
                              <td className="px-3 py-2 text-slate-800">{param.parameter}</td>
                              <td className={`px-3 py-2 ${param.status === "critical" ? "text-rose-700 font-extrabold" : "text-slate-700"}`}>
                                {param.result} {param.unit}
                              </td>
                              <td className="px-3 py-2 text-slate-500">{param.referenceRange}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  param.status === "critical" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                                  param.status === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {param.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="bg-rose-50/60 font-semibold">
                            <td className="px-3 py-2 text-slate-900 font-bold">{rep.criticalDetails?.parameter}</td>
                            <td className="px-3 py-2 text-rose-700 font-extrabold text-sm">{rep.criticalDetails?.detectedValue}</td>
                            <td className="px-3 py-2 text-slate-600">{rep.criticalDetails?.normalRange}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                CRITICAL STAT
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {rep.summaryConclusion && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Laboratory Impression:</span>
                    <p>{rep.summaryConclusion}</p>
                  </div>
                )}

                {rep.doctorReviewStatus === "reviewed" && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Reviewed by {formatDoctorName(rep.doctor?.name, "Attending Physician")}</span>
                      {rep.doctorReviewNotes && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">Note: {rep.doctorReviewNotes}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600">
                      {rep.reviewedAt ? new Date(rep.reviewedAt).toLocaleString() : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Acknowledge Critical Result: {selectedReport.testName}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAcknowledge} className="p-6 space-y-4 text-xs">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800">
                <p className="font-bold">Patient: {selectedReport.patient?.name} ({selectedReport.patient?.patientId})</p>
                <p className="text-[11px] text-rose-700 mt-1">
                  By confirming, you attest that you have evaluated the critical parameters and initiated required clinical measures.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor Clinical Assessment / Follow-up Action Taken
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Patient called immediately. Commenced oral rehydration and repeat electrolyte panel in 12h."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Signing..." : "Sign & Acknowledge Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getDiagnosticReports,
  reviewAndApproveDiagnosticReport,
} from "../../services/api.js";

export default function SpecialistReviewPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewReport, setActiveReviewReport] = useState(null);

  // Review Form States
  const [specialistNotes, setSpecialistNotes] = useState("");
  const [summaryConclusion, setSummaryConclusion] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [criticalNotes, setCriticalNotes] = useState("");
  const [signing, setSigning] = useState(false);

  const fetchReportsToReview = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticReports({ status: "Report Pending" });
      if (res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load specialist review queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsToReview();
  }, []);

  const handleSelectReport = (rep) => {
    setActiveReviewReport(rep);
    setSpecialistNotes(rep.specialistReviewNotes || "Test findings clinically reviewed and verified.");
    setSummaryConclusion(rep.summaryConclusion || "Results consistent with clinical indications.");
    setIsCritical(rep.isCritical || false);
    setCriticalNotes(rep.criticalDetails?.criticalFindings || "");
  };

  const handleSignAndApprove = async (e) => {
    e.preventDefault();
    if (!activeReviewReport) return;

    try {
      setSigning(true);
      const payload = {
        action: "Approve",
        specialistReviewNotes: specialistNotes,
        summaryConclusion,
        isCritical,
        criticalFindings: criticalNotes,
      };

      await reviewAndApproveDiagnosticReport(activeReviewReport._id, payload);
      alert("Report successfully approved, digitally signed, and finalized!");
      setActiveReviewReport(null);
      fetchReportsToReview();
    } catch (err) {
      alert("Sign-off failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSigning(false);
    }
  };

  const handleRejectOrRetest = async () => {
    if (!activeReviewReport) return;
    const reason = prompt("Enter clinical reason for requesting re-test / recollection:");
    if (!reason) return;

    try {
      await reviewAndApproveDiagnosticReport(activeReviewReport._id, {
        action: "Request Retest",
        specialistReviewNotes: reason,
      });
      alert("Order flagged for re-testing.");
      setActiveReviewReport(null);
      fetchReportsToReview();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Specialist Review & Digital Signature Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Consultant Pathologists and Radiologists clinical verification, diagnostic conclusion, and cryptographic sign-off
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Review Queue */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Pending Verification ({reports.length})</h3>
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Specialist Action Required
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading queue...</p>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">✨</span>
              <p className="text-xs font-semibold text-slate-600">All reports have been reviewed!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No investigations pending specialist sign-off</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((r) => {
                const isSelected = activeReviewReport?._id === r._id;
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => handleSelectReport(r)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{r.reportNumber}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {r.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs mt-1 truncate">{r.testName}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{r.patientName}</span>
                      <span className="font-semibold text-indigo-600">{r.department}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Review Workspace & Sign-off Panel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          {!activeReviewReport ? (
            <div className="py-24 text-center text-slate-400">
              <span className="text-4xl block mb-2">🔬</span>
              <p className="text-sm font-semibold text-slate-600">Select an investigation to conduct clinical verification</p>
              <p className="text-xs text-slate-400 mt-1">Review findings, check flags, and affix your digital signature</p>
            </div>
          ) : (
            <form onSubmit={handleSignAndApprove} className="space-y-5">
              {/* Context Header */}
              <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-900 text-sm">{activeReviewReport.reportNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                      {activeReviewReport.department}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{activeReviewReport.testName}</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{activeReviewReport.patientName}</strong> • Age: {activeReviewReport.patientAge || "Adult"} • Gender: {activeReviewReport.patientGender || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Entered By:</span>
                  <span className="text-xs font-bold text-slate-700">
                    {activeReviewReport.technicianName || "Lab Technologist"}
                  </span>
                </div>
              </div>

              {/* PATHOLOGY RESULTS TABLE */}
              {activeReviewReport.department === "Pathology" && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Laboratory Results & Critical Parameter Verification
                  </h4>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                          <th className="p-2.5 pl-4">Analyte / Parameter</th>
                          <th className="p-2.5">Result</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Reference Range</th>
                          <th className="p-2.5 pr-4 text-right">Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {(activeReviewReport.testResults || []).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 pl-4 font-semibold">{t.parameter}</td>
                            <td className="p-2.5 font-bold">{t.result}</td>
                            <td className="p-2.5 text-slate-500">{t.unit}</td>
                            <td className="p-2.5 text-slate-500">{t.referenceRange}</td>
                            <td className="p-2.5 pr-4 text-right">
                              {t.status === "critical" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                  CRITICAL
                                </span>
                              ) : t.status === "high" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  HIGH
                                </span>
                              ) : t.status === "low" ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  LOW
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-700">NORMAL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RADIOLOGY STUDY REVIEW */}
              {activeReviewReport.department === "Radiology" && activeReviewReport.radiologyStudy && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Radiology Examination & Technique
                  </h4>
                  <p><strong>Technique:</strong> {activeReviewReport.radiologyStudy.technique}</p>
                  <p><strong>Observations:</strong> {activeReviewReport.radiologyStudy.findings}</p>
                  <p><strong>Impression:</strong> {activeReviewReport.radiologyStudy.impression}</p>
                  <p className="text-[11px] text-slate-400">
                    Radiation Dose: {activeReviewReport.radiologyStudy.radiationDose} • Contrast: {activeReviewReport.radiologyStudy.contrastUsed}
                  </p>
                </div>
              )}

              {/* Medical Scans / Files Attached */}
              {activeReviewReport.attachedFiles?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Attached Medical Objects ({activeReviewReport.attachedFiles.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeReviewReport.attachedFiles.map((file, i) => (
                      <a
                        key={i}
                        href={file.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 p-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 shadow-2xs"
                      >
                        <span>📎</span>
                        <span className="truncate max-w-[180px]">{file.originalName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialist Clinical Impression & Conclusion */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialist Review Notes & Clinical Impression
                  </label>
                  <textarea
                    rows={2}
                    value={specialistNotes}
                    onChange={(e) => setSpecialistNotes(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Summary Conclusion (Appears on Final Patient Report)
                  </label>
                  <input
                    type="text"
                    value={summaryConclusion}
                    onChange={(e) => setSummaryConclusion(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Critical Result Flagging */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="criticalCheck"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="criticalCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                    Flag as Critical Result (Trigger Hospital-Wide Emergency Alert)
                  </label>
                  {isCritical && (
                    <input
                      type="text"
                      placeholder="Specify critical details (e.g., Severe pancytopenia, massive pulmonary embolism)"
                      value={criticalNotes}
                      onChange={(e) => setCriticalNotes(e.target.value)}
                      required={isCritical}
                      className="mt-2 w-full rounded-lg border border-rose-300 bg-white p-2 text-xs text-rose-900 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Digital Signature Affirmation */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔏</span>
                  <div>
                    <span className="font-bold text-emerald-900 block">Digital Verification & Signature</span>
                    <span className="text-[10px] text-emerald-700">Cryptographic hash will be affixed with your Medical Registration ID</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 font-semibold">ISO 15189 Validated</span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRejectOrRetest}
                  className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 text-xs font-bold transition cursor-pointer"
                >
                  Request Recollection / Retest
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReviewReport(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={signing}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-purple-600/25 cursor-pointer"
                  >
                    {signing ? "Affixing Signature..." : "Approve & Finalize Report ✓"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

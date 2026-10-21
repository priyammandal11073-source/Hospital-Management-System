import { useCallback, useEffect, useState } from "react";
import { getAdminFeedback, reviewFeedback } from "../../services/api.js";
import { getDoctorDisplayName, formatDoctorName } from "../../utils/doctorName.js";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const StarRating = ({ value }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={`text-sm ${star <= value ? "text-amber-400" : "text-slate-200"}`}>★</span>
    ))}
  </span>
);

const FeedbackReviewPage = () => {
  const { openPrintPreview } = usePrintModal();
  const [feedback, setFeedback] = useState([]);
  const [summary, setSummary] = useState({ total: 0, averageRating: 0, new: 0, reviewed: 0, averageNewRating: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [responseDrafts, setResponseDrafts] = useState({});

  const handlePrintFeedback = (item) => {
    const html = generateGeneralHospitalReportHtml({
      title: "Patient Experience & Grievance Feedback Record",
      subtitle: `Quality Assurance & Patient Experience Governance • ID: FB-${String(item._id).slice(-6).toUpperCase()}`,
      metrics: [
        { label: "Experience Rating", value: `${item.rating || 5} / 5 Stars`, color: (item.rating || 5) >= 4 ? "#16a34a" : "#d97706" },
        { label: "Service Domain", value: (item.category || "General Care").toUpperCase(), color: "#1e3a8a" },
        { label: "Review Status", value: (item.status || "new").toUpperCase(), color: item.status === "reviewed" ? "#16a34a" : "#dc2626" },
        { label: "Attending Consultant", value: item.doctor?.name ? formatDoctorName(item.doctor.name) : "Clinical Care Team", color: "#0f766e" },
      ],
      tables: [
        {
          title: "Patient Feedback & Institutional Grievance Details",
          headers: ["Verification Parameter", "Audit Response"],
          rows: [
            ["Feedback Reference", `FB-${String(item._id).slice(-6).toUpperCase()}`],
            ["Patient Name", item.patient?.name || "Verified Patient"],
            ["Feedback Category", item.category || "General Clinical Experience"],
            ["Attending Doctor / Unit", item.doctor?.name ? formatDoctorName(item.doctor.name) : "General Services"],
            ["Patient Experience Remarks", item.comments || "No comments provided."],
            ["Institutional Resolution", item.response || "Pending administrative escalation."],
            ["Reviewer / Officer", item.respondedBy || "Quality Assurance Cell"],
            ["Resolution Timestamp", item.respondedAt ? new Date(item.respondedAt).toLocaleString("en-IN") : "Pending Resolution"],
          ],
        },
      ],
      notes: "Official record documented under Nivora Care Hospital Patient Relations & Quality Assurance Charter (NABH Patient Rights & Education Standards).",
    });

    openPrintPreview({
      title: `Patient Feedback - FB-${String(item._id).slice(-6).toUpperCase()}`,
      htmlContent: html,
      refNumber: `FB-${String(item._id).slice(-6).toUpperCase()}`,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminFeedback(statusFilter);
      setFeedback(data.feedback || []);
      setSummary(data.summary || { total: 0, averageRating: 0, new: 0, reviewed: 0, averageNewRating: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load patient feedback.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = async (item) => {
    setBusyId(item._id);
    setError("");
    try {
      const response = responseDrafts[item._id] || "";
      await reviewFeedback(item._id, { response });
      setResponseDrafts((prev) => ({ ...prev, [item._id]: "" }));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update feedback.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Feedback & Quality</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review patient satisfaction ratings and respond as the quality desk.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-lg bg-white ring-1 ring-slate-200 px-2.5 py-1 font-semibold text-slate-600">
            Avg: <span className="text-amber-500 font-bold">{summary.averageRating || "—"}/5</span>
          </span>
          <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 font-semibold text-amber-700">
            New: {summary.new}
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-700">
            Reviewed: {summary.reviewed}
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
            Total: {summary.total}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {["", "new", "reviewed"].map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
              statusFilter === value ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {value === "" ? "All" : value === "new" ? "New" : "Reviewed"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">No feedback in this view</p>
          <p className="mt-1 text-xs text-slate-500">
            Patient star-ratings and comments submitted via the patient portal appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => {
            const isNew = item.status === "new";
            return (
              <div key={item._id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={item.rating} />
                      <span className="text-xs font-bold text-slate-800">{item.rating}/5</span>
                      {isNew && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.patient?.name || "Patient"} · {item.category || "Doctor Consultation"}
                      {item.doctor && ` · ${getDoctorDisplayName(item.doctor)}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {(() => {
                    const menuItems = [
                      {
                        label: "Print Feedback",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
                        onClick: () => handlePrintFeedback(item),
                      },
                      {
                        label: "Export to CSV",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                        onClick: () => exportToCsv({
                          filename: `feedback-${item._id}.csv`,
                          headers: ["Field", "Value"],
                          rows: [
                            ["Patient", item.patient?.name || ""],
                            ["Category", item.category || ""],
                            ["Rating", `${item.rating}/5`],
                            ["Doctor", item.doctor?.name || ""],
                            ["Status", item.status || ""],
                            ["Comments", item.comments || ""],
                            ["Response", item.response || ""],
                            ["Responded By", item.respondedBy || ""],
                            ["Responded At", item.respondedAt ? new Date(item.respondedAt).toLocaleString() : ""],
                            ["Created At", new Date(item.createdAt).toLocaleString()],
                          ],
                        }),
                      },
                      { divider: true },
                      ...(isNew ? [{
                        label: "Mark Reviewed",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
                        primary: true,
                        disabled: busyId === item._id,
                        onClick: () => handleReview(item),
                      }] : [{
                        label: "Already Reviewed",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                        disabled: true,
                      }]),
                    ];
                    return (
                      <ActionMenu
                        triggerIcon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        }
                        items={menuItems}
                        align="right"
                      />
                    );
                  })()}
                </div>

                {item.comments && (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 italic">“{item.comments}”</p>
                )}

                {item.response && (
                  <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 text-xs text-teal-800">
                    <span className="font-bold">Hospital response:</span> {item.response}
                  </div>
                )}

                {isNew && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={responseDrafts[item._id] || ""}
                      onChange={(event) => setResponseDrafts((prev) => ({ ...prev, [item._id]: event.target.value }))}
                      placeholder="Write a response from the hospital quality desk (optional)"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                    <button
                      type="button"
                      disabled={busyId === item._id}
                      onClick={() => handleReview(item)}
                      className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition disabled:opacity-50 cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FeedbackReviewPage;
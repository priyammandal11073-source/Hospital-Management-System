import { useEffect, useState } from "react";
import { getMyFeedback, submitPatientFeedback } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

function PatientFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    rating: 5,
    doctorRating: 5,
    nursingRating: 5,
    cleanlinessRating: 5,
    waitingTimeRating: 5,
    category: "general",
    comments: "",
  });

  const loadFeedback = async () => {
    try {
      const res = await getMyFeedback();
      setFeedbackList(res.feedback || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await submitPatientFeedback({
        rating: Number(form.rating),
        doctorRating: Number(form.doctorRating),
        nursingRating: Number(form.nursingRating),
        cleanlinessRating: Number(form.cleanlinessRating),
        waitingTimeRating: Number(form.waitingTimeRating),
        category: form.category,
        comments: form.comments,
      });
      setMessage({ type: "success", text: "Thank you! Your feedback has been recorded." });
      setForm({
        rating: 5,
        doctorRating: 5,
        nursingRating: 5,
        cleanlinessRating: 5,
        waitingTimeRating: 5,
        category: "general",
        comments: "",
      });
      await loadFeedback();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit feedback" });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count, onSelect = null) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            disabled={!onSelect}
            onClick={() => onSelect && onSelect(star)}
            className={`text-lg transition-transform ${
              star <= count ? "text-amber-400" : "text-slate-200"
            } ${onSelect ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Experience & Feedback", active: true },
        ]}
        title="Hospital Experience & Feedback"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Patient Voice
          </span>
        }
        subtitle="Your honest ratings help us continually enhance clinical care, nursing attentiveness, and hospital comfort."
      />

      {message.text && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
              : "bg-rose-50 text-rose-800 border-rose-200/70"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Rate Your Recent Visit</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Overall Hospital Rating</p>
              <p className="text-[11px] text-slate-500">Your total satisfaction score</p>
            </div>
            {renderStars(form.rating, (r) => setForm({ ...form, rating: r }))}
          </div>

          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Doctor Consultation</p>
              <p className="text-[11px] text-slate-500">Listening & clinical explanation</p>
            </div>
            {renderStars(form.doctorRating, (r) => setForm({ ...form, doctorRating: r }))}
          </div>

          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Nursing & Support Staff</p>
              <p className="text-[11px] text-slate-500">Care, empathy, and responsiveness</p>
            </div>
            {renderStars(form.nursingRating, (r) => setForm({ ...form, nursingRating: r }))}
          </div>

          <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cleanliness & Sanitation</p>
              <p className="text-[11px] text-slate-500">Hospital hygiene & facilities</p>
            </div>
            {renderStars(form.cleanlinessRating, (r) => setForm({ ...form, cleanlinessRating: r }))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Care Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-hidden"
          >
            <option value="general">General Hospital Experience</option>
            <option value="opd">Outpatient Doctor Consultation (OPD)</option>
            <option value="ipd">Inpatient Ward Stay (IPD)</option>
            <option value="emergency">Emergency / Casualty Department</option>
            <option value="diagnostics">Laboratory & Radiology Diagnostics</option>
            <option value="pharmacy">Hospital Pharmacy & Billing</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Your Comments & Suggestions
          </label>
          <textarea
            rows={3}
            value={form.comments}
            onChange={(e) => setForm({ ...form, comments: e.target.value })}
            placeholder="Tell us what you liked or how we can improve our services..."
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-teal-700 focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-2.5 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit My Review"}
          </button>
        </div>
      </form>

      {/* Past Feedback History */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Submitted Feedback</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          History of reviews submitted to Nivora Care quality administration.
        </p>

        {loading ? (
          <p className="mt-4 text-xs text-slate-400">Loading reviews...</p>
        ) : feedbackList.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400 italic">You haven't submitted any feedback yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {feedbackList.map((fb, idx) => (
              <div key={fb._id || idx} className="py-3.5 first:pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {renderStars(fb.rating)}
                    <span className="rounded-full liquid-glass-pill bg-slate-50 border border-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      {fb.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(fb.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {fb.comments && <p className="mt-2 text-xs text-slate-700">{fb.comments}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientFeedbackPage;

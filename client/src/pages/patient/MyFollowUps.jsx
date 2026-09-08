import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyFollowUps } from "../../services/api.js";

function MyFollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyFollowUps();
        if (active) {
          setFollowUps(res.followUps || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load follow-ups");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recommended Follow-Ups</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Continuity of Care
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review suggested review dates, follow-up timelines, and recommendations given by your doctors.
          </p>
        </div>

        <Link
          to="/patient/appointments/book"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs transition"
        >
          ➕ Schedule Follow-Up Now
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Checking your follow-up schedule...</p>
        </div>
      ) : followUps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            📅
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No pending follow-ups</h3>
          <p className="mt-1 text-sm text-slate-500">
            You are completely up to date. When a physician suggests a review visit, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {followUps.map((f, idx) => {
            const dateStr = f.recommendedDate
              ? new Date(f.recommendedDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "As advised";

            return (
              <div
                key={f._id || idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-extrabold text-base ring-1 ring-teal-500/20 flex-shrink-0">
                    🩺
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-100 text-teal-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        Follow-Up Review
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Target Date: <strong className="text-slate-800 font-mono">{dateStr}</strong>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Dr. {f.doctor?.name || f.doctorName || "Consultant"}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700">
                      {f.doctor?.specialization || f.specialization || "General Medicine"}
                    </p>

                    {(f.reason || f.notes) && (
                      <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-800">Review Objective:</span>{" "}
                        {f.reason || f.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <Link
                    to={`/patient/appointments/book?doctor=${f.doctor?._id || ""}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs transition"
                  >
                    📅 Book This Follow-Up
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyFollowUps;

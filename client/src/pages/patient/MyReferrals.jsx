import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyReferrals } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

function MyReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyReferrals();
        if (active) {
          setReferrals(res.referrals || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load referrals");
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Clinical Referrals</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Inter-Department Care
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Specialist doctor referrals recommended by your attending physicians for focused care.
          </p>
        </div>

        <Link
          to="/patient/doctors"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          🔍 Browse Specialist Directory
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
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading your referral authorizations...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            🔄
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No active specialist referrals</h3>
          <p className="mt-1 text-sm text-slate-500">
            When a doctor refers you to a higher specialist or cross-consultation, the details will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {referrals.map((r) => {
            const isUrgent = (r.priority || "").toLowerCase() === "urgent" || (r.urgency || "").toLowerCase() === "urgent";

            return (
              <div
                key={r._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold text-base ring-1 ring-indigo-500/20 flex-shrink-0">
                    🔄
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                          isUrgent
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {r.priority || r.urgency || "Routine"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Referred on {new Date(r.createdAt || r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Referral to {r.toSpecialty || r.specialization || "Specialist"}
                      {r.toDoctor?.name && ` (${formatDoctorName(r.toDoctor.name)})`}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1">
                      Referred by: <strong className="text-slate-800">{formatDoctorName(r.fromDoctor?.name || r.referringDoctor, "Attending Physician")}</strong>
                      {r.department && ` (${r.department})`}
                    </p>

                    {(r.reason || r.clinicalNotes) && (
                      <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-800">Reason:</span> {r.reason || r.clinicalNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <Link
                    to={`/patient/appointments/book?specialization=${encodeURIComponent(r.toSpecialty || r.specialization || "")}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs transition"
                  >
                    📅 Book Specialist Visit
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

export default MyReferrals;

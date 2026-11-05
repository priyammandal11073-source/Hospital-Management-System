import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyReferrals } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

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
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Doctor Referrals", active: true },
        ]}
        title="Specialist Doctor Referrals"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Internal Consults
          </span>
        }
        subtitle="Referrals made by your primary care physician to specialized departments and consultants."
        actions={
          <Link
            to="/patient/doctors"
            className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <span>👨‍⚕️ View Doctor Directory</span>
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading specialist referrals...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
            🔄
          </div>
          <h3 className="text-sm font-bold text-slate-800">No active referrals</h3>
          <p className="mt-1 text-xs text-slate-500">
            When a doctor refers you to a higher specialist or different department, the referral details will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {referrals.map((r, idx) => {
            const dateStr = r.createdAt
              ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={r._id || idx}
                className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-teal-800 border border-slate-200/80 font-bold text-sm shadow-2xs flex-shrink-0">
                    🔄
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full liquid-glass-pill bg-teal-50 border border-teal-200/70 text-teal-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Referred to {r.referredToDepartment || "Specialist"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        Date: {dateStr}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Target Specialist: {r.referredToDoctor ? formatDoctorName(r.referredToDoctor.name, "Doctor") : "Department Consultant"}
                    </h3>
                    <p className="text-xs font-medium text-slate-600">
                      Referring Physician: <strong className="text-slate-800">{formatDoctorName(r.referringDoctor?.name, "Doctor")}</strong>
                    </p>

                    {r.clinicalSummary && (
                      <div className="mt-2 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-800">Clinical Indication:</span>{" "}
                        {r.clinicalSummary}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <Link
                    to={`/patient/appointments/book?doctor=${r.referredToDoctor?._id || ""}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95"
                  >
                    <span>Book Specialist Slot →</span>
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

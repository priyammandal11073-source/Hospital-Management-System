import { useEffect, useState } from "react";
import { getMyAdmissions } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

function MyAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [activeAdmission, setActiveAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyAdmissions();
        if (active) {
          setAdmissions(res.admissions || []);
          setActiveAdmission(res.activeAdmission || null);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load hospital admissions");
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
          { label: "Admissions & Stay", active: true },
        ]}
        title="Hospital Admissions & Inpatient Stay"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Ward & Bed Records
          </span>
        }
        subtitle="View your current ward accommodation, attending doctor, and past discharge records."
      />

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {/* Active Admission Banner */}
      {activeAdmission && (
        <div className="rounded-2xl liquid-glass-card border border-teal-200/80 bg-teal-50/60 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-white text-2xl font-bold shadow-2xs flex-shrink-0">
                🛏️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full liquid-glass-pill bg-teal-100 text-teal-900 border border-teal-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Current Active Inpatient Stay
                  </span>
                  <span className="rounded-full bg-white text-teal-900 border border-teal-200 px-3 py-0.5 text-xs font-bold font-mono">
                    Bed #{activeAdmission.bedNumber}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {activeAdmission.ward} • {activeAdmission.floor}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Reason for admission: <span className="font-semibold text-slate-800">{activeAdmission.admissionReason || "Medical Observation"}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/80 p-3.5 border border-teal-100 text-xs space-y-1 shadow-2xs">
              <p className="text-slate-600">
                Attending Physician: <strong className="text-slate-900">{formatDoctorName(activeAdmission.attendingDoctor?.name, "Consultant")}</strong>
              </p>
              <p className="text-slate-600">
                Admitted on:{" "}
                <strong className="text-slate-900 font-mono">
                  {new Date(activeAdmission.admittedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-teal-800 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active 24/7 Nurse Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History of Admissions */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Admission History</h2>
        {loading ? (
          <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Retrieving inpatient history...</p>
          </div>
        ) : admissions.length === 0 && !activeAdmission ? (
          <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
              🛏️
            </div>
            <h3 className="text-sm font-bold text-slate-800">No hospitalization records found</h3>
            <p className="mt-1 text-xs text-slate-500">
              You do not have any past or ongoing inpatient admissions recorded at Nivora Care Hospital.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {admissions.map((adm, idx) => {
              const admitDate = adm.admittedAt
                ? new Date(adm.admittedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const dischargeDate = adm.dischargedAt
                ? new Date(adm.dischargedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Active Stay";

              return (
                <div
                  key={adm._id || idx}
                  className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-bold text-lg shadow-2xs flex-shrink-0">
                        🏥
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider liquid-glass-pill ${
                              adm.dischargedAt ? "bg-slate-50 text-slate-700 border-slate-200" : "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                            }`}
                          >
                            {adm.dischargedAt ? "Discharged" : "Currently Admitted"}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {admitDate} → {dischargeDate}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          Ward: {adm.ward || "Inpatient Unit"} (Bed #{adm.bedNumber || "N/A"})
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Physician: <strong className="text-slate-800">{formatDoctorName(adm.attendingDoctor?.name, "Consultant")}</strong>
                        </p>
                        {adm.admissionReason && (
                          <p className="text-xs text-slate-500 mt-1">
                            Reason: {adm.admissionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-right self-end sm:self-center">
                      <span className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3 py-1.5 font-semibold text-slate-700 inline-block shadow-2xs">
                        Floor: {adm.floor || "General"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAdmissions;

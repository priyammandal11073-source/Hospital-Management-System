import { useEffect, useState } from "react";
import { getMyAdmissions } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Admissions & Inpatient Stay</h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/20">
              Ward & Bed Records
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View your current ward accommodation, attending doctor, and past discharge records.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Active Admission Banner */}
      {activeAdmission && (
        <div className="rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-800 p-6 text-white shadow-lg shadow-teal-900/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-xs flex-shrink-0">
                🛏️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    Current Active Inpatient Stay
                  </span>
                  <span className="rounded-full bg-white text-teal-900 px-3 py-0.5 text-xs font-black font-mono">
                    Bed #{activeAdmission.bedNumber}
                  </span>
                </div>
                <h2 className="text-xl font-black mt-1">
                  {activeAdmission.ward} • {activeAdmission.floor}
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 mt-1">
                  Reason for admission: <span className="font-semibold text-white">{activeAdmission.admissionReason || "Medical Observation"}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs text-xs space-y-1.5 border border-white/15">
              <p className="text-teal-200">
                Attending Physician: <strong className="text-white">{formatDoctorName(activeAdmission.attendingDoctor?.name, "Consultant")}</strong>
              </p>
              <p className="text-teal-200">
                Admitted on:{" "}
                <strong className="text-white">
                  {new Date(activeAdmission.admittedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-teal-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 24/7 Nurse Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History of Admissions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Admission History</h2>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-r-transparent"></div>
            <p className="mt-3 text-sm font-semibold text-slate-600">Retrieving inpatient history...</p>
          </div>
        ) : admissions.length === 0 && !activeAdmission ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              🛏️
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-800">No hospitalization records found</h3>
            <p className="mt-1 text-sm text-slate-500">
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
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex-shrink-0">
                        🏥
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              adm.dischargedAt ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
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
                      <span className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 inline-block">
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

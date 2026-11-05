import React from "react";
import Badge from "./Badge.jsx";

export default function PatientBanner({
  patient = {},
  actions = null,
  compact = false,
  className = "",
}) {
  const allergies = Array.isArray(patient?.allergies)
    ? patient.allergies
    : patient?.allergies
    ? [patient.allergies]
    : [];

  const mrn = patient?.patientId || patient?.mrn || patient?.uhid || (patient?._id ? `NCR-${patient._id.slice(-6).toUpperCase()}` : "NCR-000000");
  const isAdmitted = patient?.isAdmitted;

  return (
    <div className={`glass-card rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 sm:p-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Patient Identity Block */}
        <div className="flex min-w-0 items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-lg flex-shrink-0">
            {patient?.name ? patient.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-100 block sm:inline">
                PATIENT
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-tight break-words">
                {patient?.name || "Unassigned Patient"}
              </h2><span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 border border-slate-300/50 font-medium shadow-2xs break-all">
                MRN: {mrn}</span>
              <Badge status={isAdmitted ? "admitted" : "outpatient"}>
                {isAdmitted ? "Inpatient (Admitted)" : "OPD Walk-in"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5 [overflow-wrap:anywhere]">
              <span>
                <strong>Age:</strong> {patient?.age ? `${patient.age} Y` : "—"}
              </span>
              <span>
                <strong>Gender:</strong> {patient?.gender || "—"}
              </span>
              <span>
                <strong>Blood Group:</strong>{" "}
                <span className="font-bold text-rose-400">{patient?.bloodGroup || "—"}</span>
              </span>
              <span>
                <strong>Phone:</strong>{" "}<span className="font-mono text-slate-300">
                  {patient?.phone || patient?.contactNumber || "—"}</span>
              </span>
              {patient?.abhaId && (
                <span>
                  <strong>ABHA:</strong>{" "}
                  <span className="font-mono font-semibold text-slate-300 break-all">{patient.abhaId}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/20">
            {actions}
          </div>
        )}
      </div>

      {/* Critical Clinical Alerts Strip */}
      {allergies.length > 0 && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center gap-2 text-xs font-medium text-rose-900">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-800">
            Allergy Alert:
          </span>
          <span className="min-w-0 text-rose-950 font-medium [overflow-wrap:anywhere]">{allergies.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

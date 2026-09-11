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

  const mrn = patient?.patientId || patient?.mrn || (patient?._id ? `NCR-${patient._id.slice(-6).toUpperCase()}` : "NCR-000000");
  const isAdmitted = patient?.isAdmitted;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden ${className}`}>
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Patient Identity Block */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-lg flex-shrink-0">
            {patient?.name ? patient.name.charAt(0).toUpperCase() : "P"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block sm:inline">
                PATIENT
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {patient?.name || "Unassigned Patient"}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                MRN: {mrn}
              </span>
              <Badge status={isAdmitted ? "admitted" : "outpatient"}>
                {isAdmitted ? "Inpatient (Admitted)" : "OPD Walk-in"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
              <span>
                <strong>Age:</strong> {patient?.age ? `${patient.age} Y` : "—"}
              </span>
              <span>
                <strong>Gender:</strong> {patient?.gender || "—"}
              </span>
              <span>
                <strong>Blood Group:</strong>{" "}
                <span className="font-bold text-rose-700">{patient?.bloodGroup || "—"}</span>
              </span>
              <span>
                <strong>Phone:</strong>{" "}
                <span className="font-mono text-slate-800">
                  {patient?.phone || patient?.contactNumber || "—"}
                </span>
              </span>
              {patient?.abhaId && (
                <span>
                  <strong>ABHA:</strong>{" "}
                  <span className="font-mono text-sky-700">{patient.abhaId}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {actions}
          </div>
        )}
      </div>

      {/* Critical Clinical Alerts Strip */}
      {allergies.length > 0 && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center gap-2 text-xs font-semibold text-rose-800">
          <span className="h-2 w-2 rounded-full bg-rose-600 flex-shrink-0" />
          <span className="font-bold uppercase tracking-wider text-[11px] text-rose-900">
            Allergy Alert:
          </span>
          <span className="truncate">{allergies.join(", ")}</span>
        </div>
      )}
    </div>
  );
}

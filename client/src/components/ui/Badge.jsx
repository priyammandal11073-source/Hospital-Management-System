import React from "react";

const Badge = ({ status, className = "", children, ...props }) => {
  const statusColors = {
    pending: "bg-amber-50 text-amber-800 border-amber-300",
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-300",
    completed: "bg-emerald-50 text-emerald-800 border-emerald-300",
    finalized: "bg-emerald-50 text-emerald-800 border-emerald-300",
    cancelled: "bg-rose-50 text-rose-800 border-rose-300",
    critical: "bg-rose-100 text-rose-900 border-rose-400 font-bold",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-300",
    pending_paid: "bg-amber-50 text-amber-800 border-amber-300",
    partially_paid: "bg-amber-50 text-amber-800 border-amber-300",
    on_hold: "bg-slate-100 text-slate-800 border-slate-300",
    active: "bg-blue-50 text-blue-800 border-blue-300",
    quarantined: "bg-rose-50 text-rose-800 border-rose-300",
    urgent: "bg-rose-50 text-rose-800 border-rose-300 font-bold",
    normal: "bg-slate-50 text-slate-700 border-slate-300",
    in_progress: "bg-blue-50 text-blue-800 border-blue-300",
    sample_collected: "bg-sky-50 text-sky-800 border-sky-300",
    result_entered: "bg-indigo-50 text-indigo-800 border-indigo-300",
    under_review: "bg-purple-50 text-purple-800 border-purple-300",
    amended: "bg-amber-50 text-amber-900 border-amber-400",
    dispensed: "bg-emerald-50 text-emerald-800 border-emerald-300",
    admitted: "bg-indigo-50 text-indigo-800 border-indigo-300",
    discharged: "bg-slate-100 text-slate-700 border-slate-300",
    outpatient: "bg-slate-50 text-slate-700 border-slate-300",
    occupied: "bg-rose-50 text-rose-800 border-rose-300",
    available: "bg-emerald-50 text-emerald-800 border-emerald-300",
  };

  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    finalized: "Finalized",
    cancelled: "Cancelled",
    critical: "Critical Alert",
    paid: "Paid",
    pending_paid: "Pending Payment",
    partially_paid: "Partially Paid",
    on_hold: "On Hold",
    active: "Active",
    quarantined: "Quarantined",
    urgent: "Urgent",
    normal: "Normal",
    in_progress: "In Progress",
    sample_collected: "Sample Collected",
    result_entered: "Result Entered",
    under_review: "Under Review",
    amended: "Amended",
    dispensed: "Dispensed",
    admitted: "Inpatient",
    discharged: "Discharged",
    outpatient: "OPD",
    occupied: "Occupied",
    available: "Available",
  };

  const normalizedStatus = String(status || "").toLowerCase().trim().replace(/[\s-]/g, "_");

  return (
    <span
      className={`
        inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold border
        ${statusColors[normalizedStatus] || "bg-slate-50 text-slate-700 border-slate-300"}
        ${className}
      `}
      {...props}
    >
      {children || statusLabels[normalizedStatus] || status}
    </span>
  );
};

export default Badge;
export { Badge };


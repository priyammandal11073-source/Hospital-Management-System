import React from "react";

const Badge = ({ status, dot = true, className = "", children, ...props }) => {
  const statusStyles = {
    pending: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    confirmed: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    completed: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    finalized: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    cancelled: {
      badge: "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    critical: {
      badge: "bg-rose-100 text-rose-900 border-rose-300 font-bold dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700",
      dot: "bg-rose-600 animate-pulse",
    },
    paid: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    pending_paid: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    partially_paid: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    on_hold: {
      badge: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-500",
    },
    active: {
      badge: "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
      dot: "bg-sky-500",
    },
    quarantined: {
      badge: "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    urgent: {
      badge: "bg-rose-50 text-rose-800 border-rose-200/80 font-bold dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    normal: {
      badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    in_progress: {
      badge: "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
      dot: "bg-blue-500",
    },
    sample_collected: {
      badge: "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
      dot: "bg-sky-500",
    },
    result_entered: {
      badge: "bg-indigo-50 text-indigo-800 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
      dot: "bg-indigo-500",
    },
    under_review: {
      badge: "bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
      dot: "bg-purple-500",
    },
    amended: {
      badge: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      dot: "bg-amber-500",
    },
    dispensed: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
    admitted: {
      badge: "bg-indigo-50 text-indigo-800 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
      dot: "bg-indigo-500",
    },
    discharged: {
      badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    outpatient: {
      badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
    },
    occupied: {
      badge: "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    available: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
    },
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
  const currentConfig = statusStyles[normalizedStatus] || {
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium border shadow-2xs
        ${currentConfig.badge}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentConfig.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children || statusLabels[normalizedStatus] || status}</span>
    </span>
  );
};

export default Badge;
export { Badge };

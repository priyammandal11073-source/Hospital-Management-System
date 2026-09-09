import React from "react";

const Badge = ({ status, className = "", children, ...props }) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-800 border-rose-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending_paid: "bg-amber-100 text-amber-800 border-amber-200",
    partially_paid: "bg-yellow-100 text-yellow-800 border-yellow-200",
    on_hold: "bg-amber-100 text-amber-800 border-amber-200",
    active: "bg-blue-100 text-blue-800 border-blue-200",
    quarantined: "bg-rose-100 text-rose-800 border-rose-200",
    urgent: "bg-rose-100 text-rose-800 border-rose-200",
    normal: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    paid: "Paid",
    pending_paid: "Pending Payment",
    partially_paid: "Partially Paid",
    on_hold: "On Hold",
    active: "Active",
    quarantined: "Quarantined",
    urgent: "Urgent",
    normal: "Normal",
  };

  const normalizedStatus = String(status || "").toLowerCase().trim();

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
        ${statusColors[normalizedStatus] || "bg-slate-100 text-slate-800 border-slate-200"}
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

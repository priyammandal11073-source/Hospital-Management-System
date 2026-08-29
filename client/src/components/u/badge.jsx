import React from "react";

const Badge = ({ status, className, ...props }) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    paid: "bg-emerald-100 text-emerald-800",
    pending_paid: "bg-amber-100 text-amber-800",
    partially_paid: "bg-amber-100 text-amber-800",
  };

  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    paid: "Paid",
    pending_paid: "Pending Payment",
    partially_paid: "Partially Paid",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${statusColors[status] || statusColors.pending}
        ${className}
      `}
      {...props}
    >
      {statusLabels[status] || status}
    </span>
  );
};

export default Badge;
export { Badge };
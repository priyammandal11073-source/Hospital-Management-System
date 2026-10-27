import React from "react";
import { Link } from "react-router-dom";

export function HeroBanner({
  title,
  subtitle,
  badgeLabel,
  badgeIcon,
  badgeColor = "bg-slate-500",
  actions = [],
  children,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/85 backdrop-blur-xl border border-slate-200/80 p-6 sm:p-8 text-slate-900 shadow-xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-2xl">
          {badgeLabel && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100/90 text-slate-700 border border-slate-200/70 px-2.5 py-1 text-xs font-medium shadow-2xs">
              {badgeIcon && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badgeColor }} />}
              <span>{badgeLabel}</span>
            </div>
          )}
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {actions.map((action, idx) => (
            <React.Fragment key={idx}>
              {action.href ? (
                <a
                  href={action.href}
                  className={action.className || "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-120 active:scale-[0.97] cursor-pointer"}
                  target={action.target}
                  rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </a>
              ) : action.to ? (
                <Link
                  to={action.to}
                  className={action.className || "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-120 active:scale-[0.97]"}
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  className={action.className || "inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-120 active:scale-[0.97] cursor-pointer"}
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  gradient,
  badge,
  badgeColor,
  to,
  onClick,
  trend,
  trendUp = true,
}) {
  const cardContent = (
    <div
      className={`group relative overflow-hidden rounded-2xl liquid-glass-card p-5 transition active:scale-[0.98] flex flex-col justify-between h-full min-h-[144px] ${
        to || onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider line-clamp-2 min-h-[26px] leading-tight" title={label}>{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight truncate tabular-nums">{value}</p>
          {trend && (
            <p className={`mt-0.5 text-xs font-medium flex items-center gap-1 ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
              <span>{trendUp ? "↑" : "↓"}</span>
              <span>{trend}</span>
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl liquid-glass-subtle text-slate-700 group-hover:text-slate-900 transition shadow-2xs">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100/80 min-h-[28px]">
        {badge ? (
          <span className={`inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold truncate max-w-[150px] ${badgeColor}`}>
            {badge}
          </span>
        ) : (
          <span />
        )}
        {to && (
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-900 transition flex items-center gap-0.5 shrink-0 ml-auto">
            Open →
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full no-underline">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full h-full text-left p-0 border-0 bg-transparent block no-underline">
        {cardContent}
      </button>
    );
  }

  return cardContent;
}

export function ProgressMeter({
  label,
  value,
  max = 100,
  color = "purple",
  segments = [],
  showPercentage = true,
}) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colorMap = {
    purple: "bg-purple-600",
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    teal: "bg-teal-600",
    rose: "bg-rose-600",
    amber: "bg-amber-500",
    indigo: "bg-indigo-600",
    slate: "bg-slate-500",
  };
  const bgColor = colorMap[color] || colorMap.purple;
  const lightColorMap = {
    purple: "bg-purple-50 text-purple-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    teal: "bg-teal-50 text-teal-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-50 text-slate-700",
  };
  const badgeColor = lightColorMap[color] || lightColorMap.purple;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
        <span>{label}</span>
        {showPercentage && (
          <span className={badgeColor}>
            {percentage}%
          </span>
        )}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        {segments.length > 0 ? (
          segments.map((seg, idx) => (
            <div
              key={idx}
              className={`${seg.color || bgColor} h-full rounded-full`}
              style={{ width: `${seg.percentage || 0}%` }}
            />
          ))
        ) : (
          <div
            className={`${bgColor} h-full rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      {segments.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          {segments.map((seg, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${seg.color || bgColor}`}></span>
              {seg.label} ({seg.value || seg.percentage}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionHub({
  title,
  subtitle,
  icon,
  color,
  items,
  footer,
  fullWidth = false,
}) {
  const colorMap = {
    purple: { border: "hover:border-purple-400", bg: "hover:bg-purple-50", icon: "bg-purple-50 text-purple-700" },
    blue: { border: "hover:border-blue-400", bg: "hover:bg-blue-50", icon: "bg-blue-50 text-blue-700" },
    emerald: { border: "hover:border-emerald-400", bg: "hover:bg-emerald-50", icon: "bg-emerald-50 text-emerald-700" },
    teal: { border: "hover:border-teal-400", bg: "hover:bg-teal-50", icon: "bg-teal-50 text-teal-700" },
    rose: { border: "hover:border-rose-400", bg: "hover:bg-rose-50", icon: "bg-rose-50 text-rose-700" },
    amber: { border: "hover:border-amber-400", bg: "hover:bg-amber-50", icon: "bg-amber-50 text-amber-700" },
    indigo: { border: "hover:border-indigo-400", bg: "hover:bg-indigo-50", icon: "bg-indigo-50 text-indigo-700" },
    slate: { border: "hover:border-slate-400", bg: "hover:bg-slate-50", icon: "bg-slate-50 text-slate-700" },
    sky: { border: "hover:border-sky-400", bg: "hover:bg-sky-50", icon: "bg-sky-50 text-sky-700" },
    pink: { border: "hover:border-pink-400", bg: "hover:bg-pink-50", icon: "bg-pink-50 text-pink-700" },
    cyan: { border: "hover:border-cyan-400", bg: "hover:bg-cyan-50", icon: "bg-cyan-50 text-cyan-700" },
    orange: { border: "hover:border-orange-400", bg: "hover:bg-orange-50", icon: "bg-orange-50 text-orange-700" },
    red: { border: "hover:border-red-400", bg: "hover:bg-red-50", icon: "bg-red-50 text-red-700" },
    violet: { border: "hover:border-violet-400", bg: "hover:bg-violet-50", icon: "bg-violet-50 text-violet-700" },
    fuchsia: { border: "hover:border-fuchsia-400", bg: "hover:bg-fuchsia-50", icon: "bg-fuchsia-50 text-fuchsia-700" },
    lime: { border: "hover:border-lime-400", bg: "hover:bg-lime-50", icon: "bg-lime-50 text-lime-700" },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <section className={`rounded-2xl ${fullWidth ? "bg-white" : ""} p-5 shadow-xs ring-1 ring-slate-200/80 ${fullWidth ? "" : "bg-white"}`}>
      {!fullWidth && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${c.icon.replace("bg-", "bg-").replace("text-", "text-")}`}></span>
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {footer && (
            <Link to={footer.href} className="text-xs font-bold text-purple-600 hover:underline">
              {footer.label} →
            </Link>
          )}
        </div>
      )}

      <div className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${fullWidth ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" : ""}`}>
        {items.map((item, idx) => (
          <Link
            key={item.to || idx}
            to={item.to}
            className={`flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 ${c.border} ${c.bg} hover:shadow-md`}
            onClick={item.onClick}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">{item.label}</span>
            <span className="text-[10px] text-slate-500">{item.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StreamWidget({
  title,
  subtitle,
  icon,
  color,
  items,
  emptyMessage = "No items to display",
  linkTo,
  linkLabel,
  maxHeight = "360px",
}) {
  const colorMap = {
    purple: "text-purple-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    teal: "text-teal-700",
    rose: "text-rose-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
    sky: "text-sky-700",
  };
  const linkColor = colorMap[color] || colorMap.purple;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {icon && <span className="flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {linkTo && (
          <Link to={linkTo} className={`text-xs font-bold ${linkColor} hover:underline`}>
            {linkLabel || `View All (${items.length})`} →
          </Link>
        )}
      </div>
      <ul className="mt-4 divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1" style={{ maxHeight }}>
        {items.length === 0 ? (
          <li className="py-8 text-center text-xs text-slate-400">{emptyMessage}</li>
        ) : (
          items.map((item, idx) => (
            <li
              key={item.id || idx}
              className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
              onClick={item.onClick}
            >
              <div className="flex items-center gap-3">
                {item.avatar && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs ring-1 ring-slate-200/50">
                    {item.avatar}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800 text-xs">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.time && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                    {item.time}
                  </span>
                )}
                {item.status && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ${item.statusColor || "bg-blue-50 text-blue-700 ring-blue-500/20"}`}>
                    {item.status}
                  </span>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function AlertBanner({
  alerts = [],
  onDismiss,
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alt, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            alt.level === "danger"
              ? "bg-rose-50/70 border-rose-200/80 text-rose-950"
              : alt.level === "warning"
              ? "bg-amber-50/70 border-amber-200/80 text-amber-950"
              : "bg-blue-50/70 border-blue-200/80 text-blue-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
              alt.level === "danger"
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : alt.level === "warning"
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-blue-100 text-blue-700 border border-blue-200"
            }`}>
              {alt.icon || (alt.level === "danger" ? "🚨" : alt.level === "warning" ? "⚠️" : "ℹ️")}
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-tight">{alt.title}</h4>
              <p className="text-xs opacity-90">{alt.message}</p>
            </div>
          </div>
          {alt.action && (
            <button
              type="button"
              onClick={alt.action.onClick}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition active:scale-[0.97] ${
                alt.level === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : alt.level === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {alt.action.label}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(idx)}
              className="text-slate-400 hover:text-slate-700 p-1"
              aria-label="Dismiss alert"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
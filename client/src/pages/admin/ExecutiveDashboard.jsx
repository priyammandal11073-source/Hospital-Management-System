import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminRevenueAnalytics, getAdminTelemetry } from "../../services/api.js";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const ExecutiveDashboard = () => {
  const { openPrintPreview } = usePrintModal();
  const [range, setRange] = useState("month");
  const [revenue, setRevenue] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState({ revenue: [], occupancy: [], staffing: [] });

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [revRes, telRes] = await Promise.all([
        getAdminRevenueAnalytics(range),
        getAdminTelemetry(),
      ]);
      setRevenue(revRes);
      setTelemetry(telRes);
      // Generate forecast mock data
      setForecast({
        revenue: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(Date.now() + i * 30 * 86400000).toLocaleString("en-IN", { month: "short" }),
          actual: i < new Date().getMonth() ? Math.floor(1000000 + Math.random() * 500000) : null,
          forecast: Math.floor(1200000 + Math.random() * 400000),
          lower: Math.floor(1000000 + Math.random() * 300000),
          upper: Math.floor(1400000 + Math.random() * 500000),
        })),
        occupancy: Array.from({ length: 30 }, (_, i) => ({
          day: i + 1,
          actual: Math.floor(60 + Math.random() * 30),
          forecast: Math.floor(65 + Math.random() * 25),
        })),
        staffing: Array.from({ length: 7 }, (_, i) => ({
          day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
          required: Math.floor(80 + Math.random() * 20),
          scheduled: Math.floor(75 + Math.random() * 25),
          gap: Math.floor(-5 + Math.random() * 15),
        })),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load executive dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const formatCurrency = (amt) => amt ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt) : "—";

  const kpis = useMemo(() => {
    if (!revenue || !telemetry) return [];
    return [
      { label: "Revenue (Period)", value: formatCurrency(revenue.stats?.totalRevenue), trend: "+12.3%", trendCls: "text-emerald-600", icon: "💰", subtitle: "vs last period" },
      { label: "Outstanding", value: formatCurrency(revenue.stats?.outstandingRevenue), trend: "-4.1%", trendCls: "text-emerald-600", icon: "📋", subtitle: "AR aging >90d: 8%" },
      { label: "Bed Occupancy", value: `${telemetry.bedOccupancyRate || 0}%`, trend: telemetry.bedOccupancyRate > 85 ? "+2.1%" : "-1.2%", trendCls: telemetry.bedOccupancyRate > 85 ? "text-rose-600" : "text-emerald-600", icon: "🛏️", subtitle: "ICU: " + (telemetry.icuOccupancy || 0) + "%" },
      { label: "OR Utilization", value: `${telemetry.orUtilization || 0}%`, trend: "+3.5%", trendCls: "text-emerald-600", icon: "🏥", subtitle: `${telemetry.todaySurgeriesCount || 0} cases today` },
      { label: "Avg LOS", value: `${telemetry.avgLOS || 0} days`, trend: "-0.3", trendCls: "text-emerald-600", icon: "📊", subtitle: "Target: <4.5 days" },
      { label: "Readmission Rate", value: `${telemetry.readmissionRate || 0}%`, trend: "-0.2%", trendCls: "text-emerald-600", icon: "🔄", subtitle: "30-day all-cause" },
      { label: "Patient Satisfaction", value: `${telemetry.avgRating || 0}/5`, trend: "+0.1", trendCls: "text-emerald-600", icon: "⭐", subtitle: `${telemetry.totalFeedback || 0} responses` },
      { label: "Staff Efficiency", value: `${telemetry.staffEfficiency || 0}%`, trend: "+1.8%", trendCls: "text-emerald-600", icon: "👥", subtitle: "Overtime: " + (telemetry.overtimeHours || 0) + "h" },
    ];
  }, [revenue, telemetry]);

  const exportKPIs = () => exportToCsv({
    filename: "executive-kpis.csv",
    headers: ["KPI", "Value", "Trend", "Subtitle"],
    rows: kpis.map(k => [k.label, k.value, k.trend, k.subtitle]),
  });

  const handlePrintDashboard = () => {
    const html = generateGeneralHospitalReportHtml({
      title: "Executive Strategic Operations & Clinical KPI Audit",
      subtitle: `Hospital-Wide Governance Telemetry, Occupancy Velocity & Financial Solvency • Period: ${range.toUpperCase()}`,
      metrics: kpis.slice(0, 4).map(k => ({
        label: k.label,
        value: k.value,
        sub: `${k.subtitle} (${k.trend})`,
        color: "#0f172a",
      })),
      tables: [
        {
          title: "Hospital Operational & Strategic Performance Indicators",
          headers: ["Performance Metric Domain", "Current Metric Value", "Period Trend", "Operational Target / Subtitle"],
          rows: kpis.map(k => [
            k.label,
            k.value,
            k.trend,
            k.subtitle,
          ]),
        },
      ],
      notes: "Official institutional executive brief generated for Hospital Board of Directors and Clinical Governance Committee.",
    });

    openPrintPreview({
      title: "Executive Strategic Operations Report",
      htmlContent: html,
      refNumber: `EXEC-AUDIT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`,
    });
  };

  if (isLoading) return <div className="py-12 text-center text-slate-500 animate-pulse">Loading executive dashboard...</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Executive Dashboard</h1>
          <p className="text-sm text-slate-600">Hospital-wide KPIs, trends, forecasting & strategic insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={range} onChange={e => setRange(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <ActionMenu triggerLabel="Export" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
            items={[
              { label: "Export KPIs (CSV)", onClick: exportKPIs },
              { label: "Export Revenue Forecast", onClick: () => exportToCsv({ filename: "revenue-forecast.csv", headers: ["Month", "Actual", "Forecast", "Lower CI", "Upper CI"], rows: forecast.revenue.map(f => [f.month, f.actual || "", f.forecast, f.lower, f.upper]) }) },
              { label: "Print Dashboard", onClick: handlePrintDashboard },
            ]} align="right" />
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs hover:shadow-sm transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl">{kpi.icon}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
              </div>
              <div className="text-right">
                <p className={`${kpi.trendCls} text-xs font-bold`}>{kpi.trend}</p>
                <p className="text-[10px] text-slate-400">{kpi.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 mb-4">Revenue Forecast (12 Month)</h2>
          <div className="h-64 relative">
            <svg viewBox="0 0 400 256" className="w-full h-full" style={{ fontFamily: "system-ui" }}>
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid */}
              <g stroke="#e2e8f0" strokeWidth="0.5">
                {Array.from({length: 5}).map((_, i) => (
                  <line key={i} x1="40" y1={40 + i * 48} x2="360" y2={40 + i * 48} />
                ))}
                {Array.from({length: 12}).map((_, i) => (
                  <line key={i} x1={40 + i * 28} y1="40" x2={40 + i * 28} y2="232" />
                ))}
              </g>
              {/* Confidence band */}
              <path fill="url(#forecastArea)" stroke="none" d={forecast.revenue.map((f, i) => {
                const x = 40 + i * 28;
                const yUpper = 232 - ((f.upper / 2000000) * 192);
                return i === 0 ? `M ${x} ${yUpper}` : `L ${x} ${yUpper}`;
              }).join(" ") + " L 360 232 L 40 232 Z"} />
              {/* Forecast line */}
              <polyline fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeDasharray="6,4" points={forecast.revenue.map((f, i) => {
                const x = 40 + i * 28;
                const y = 232 - ((f.forecast / 2000000) * 192);
                return `${x},${y}`;
              }).join(" ")} />
              {/* Actual line */}
              <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" points={forecast.revenue.map((f, i) => {
                if (f.actual === null) return "";
                const x = 40 + i * 28;
                const y = 232 - ((f.actual / 2000000) * 192);
                return `${x},${y}`;
              }).filter(Boolean).join(" ")} />
              {/* X-axis labels */}
              {forecast.revenue.map((f, i) => (
                <text key={i} x={40 + i * 28} y={248} fontSize="9" fill="#64748b" textAnchor="middle">{f.month}</text>
              ))}
              {/* Legend */}
              <g fontSize="10">
                <rect x={280} y={12} width={12} height={12} fill="#0ea5e9" />
                <text x={295} y={21} fill="#64748b">Actual</text>
                <rect x={280} y={30} width={12} height={12} fill="url(#forecastArea)" stroke="#14b8a6" />
                <text x={295} y={39} fill="#64748b">Forecast ±CI</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Occupancy Forecast */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 mb-4">Bed Occupancy Forecast (30 Days)</h2>
          <div className="h-64 relative">
            <svg viewBox="0 0 400 256" className="w-full h-full">
              <defs>
                <linearGradient id="occArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <g stroke="#e2e8f0" strokeWidth="0.5">
                {Array.from({length: 5}).map((_, i) => <line key={i} x1="40" y1={40 + i * 48} x2="360" y2={40 + i * 48} />)}
                {Array.from({length: 10}).map((_, i) => <line key={i} x1={40 + i * 36} y1="40" x2={40 + i * 36} y2="232" />)}
              </g>
              {/* Target zone 85% */}
              <rect x="40" y={40 + (100-85)/100 * 192} width="320" height={(100-85)/100 * 192} fill="#fef3c7" opacity="0.5" />
              <line x1="40" y1={40 + (100-85)/100 * 192} x2="360" y2={40 + (100-85)/100 * 192} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" />
              <text x="370" y={40 + (100-85)/100 * 192 - 4} fontSize="9" fill="#f59e0b" textAnchor="end">Target 85%</text>
              {/* Actual */}
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={forecast.occupancy.map((d, i) => {
                const x = 40 + i * 10.67;
                const y = 232 - (d.actual / 100) * 192;
                return `${x},${y}`;
              }).join(" ")} />
              {/* Forecast */}
              <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" points={forecast.occupancy.map((d, i) => {
                const x = 40 + i * 10.67;
                const y = 232 - (d.forecast / 100) * 192;
                return `${x},${y}`;
              }).join(" ")} />
              {/* X-axis */}
              {forecast.occupancy.filter((_, i) => i % 3 === 0).map((d, i) => (
                <text key={i} x={40 + (i*3) * 10.67} y={248} fontSize="9" fill="#64748b" textAnchor="middle">Day {d.day}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Staffing & Department Scorecards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staffing Gap */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 mb-4">Staffing Gap Analysis (7-Day)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr><th className="p-3">Day</th><th className="p-3">Required</th><th className="p-3">Scheduled</th><th className="p-3">Gap</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecast.staffing.map((d, i) => (
                  <tr key={i} className={d.gap > 5 ? "bg-rose-50/30" : d.gap > 0 ? "bg-amber-50/30" : ""}>
                    <td className="p-3 font-bold">{d.day}</td>
                    <td className="p-3">{d.required}</td>
                    <td className="p-3">{d.scheduled}</td>
                    <td className="p-3 font-mono font-bold">{d.gap > 0 ? "+" : ""}{d.gap}</td>
                    <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${d.gap > 5 ? "bg-rose-100 text-rose-700" : d.gap > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{d.gap > 5 ? "Critical" : d.gap > 0 ? "Short" : "OK"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Scorecards */}
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 mb-4">Department Scorecards</h2>
          <div className="space-y-3">
            {[
              { dept: "Emergency", volume: 1247, los: 3.2, satisfaction: 4.6, revenue: 2.4, status: "🟢" },
              { dept: "Cardiology", volume: 892, los: 4.1, satisfaction: 4.7, revenue: 5.8, status: "🟢" },
              { dept: "Orthopedics", volume: 567, los: 5.8, satisfaction: 4.4, revenue: 4.2, status: "🟡" },
              { dept: "Neurology", volume: 434, los: 6.2, satisfaction: 4.5, revenue: 3.1, status: "🟢" },
              { dept: "Oncology", volume: 312, los: 8.5, satisfaction: 4.8, revenue: 6.7, status: "🟢" },
              { dept: "Pediatrics", volume: 789, los: 2.9, satisfaction: 4.7, revenue: 1.9, status: "🟢" },
            ].map((d, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.status}</span>
                  <div>
                    <p className="font-bold text-slate-800">{d.dept}</p>
                    <p className="text-xs text-slate-500">{d.volume} visits · {d.los}d LOS</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right min-w-[200px]">
                  <div><p className="text-xs text-slate-400">Satisfaction</p><p className="font-bold text-amber-600">{d.satisfaction}/5</p></div>
                  <div><p className="text-xs text-slate-400">Revenue (Cr)</p><p className="font-bold text-emerald-600">{d.revenue}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts & Actions */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
        <h2 className="font-bold text-slate-800 mb-4">⚠ Strategic Alerts & Recommended Actions</h2>
        <div className="space-y-3">
          {[
            { type: "warning", title: "ICU Occupancy >90%", detail: "Current 94%. Consider surge protocol or transfer agreements.", action: "View ICU Dashboard" },
            { type: "info", title: "Revenue Forecast Below Target", detail: "Q2 forecast 8% below budget. Elective volumes down 12%.", action: "Review Revenue Analytics" },
            { type: "success", title: "Readmission Rate Improved", detail: "30-day rate dropped to 11.2% (target <12%). Cardiac pathway working.", action: "View Quality Report" },
            { type: "warning", title: "Nursing Overtime Spike", detail: "Overtime hours +23% WoW. 3 units critically short.", action: "Open Staffing Plan" },
            { type: "info", title: "New Equipment ROI", detail: "CT scanner payback in 8 months (projected 14).", action: "View Capex Tracker" },
          ].map((alert, i) => (
            <div key={i} className={`rounded-xl p-4 flex items-start justify-between gap-4 ${alert.type === "warning" ? "bg-rose-50 border border-rose-200" : alert.type === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"}`}>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{alert.title}</p>
                <p className="text-sm text-slate-600 mt-1">{alert.detail}</p>
              </div>
              <ActionMenu triggerLabel="Action" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                items={[{ label: alert.action, primary: true }, { label: "Dismiss", danger: true }]} align="right" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExecutiveDashboard;
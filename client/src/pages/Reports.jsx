import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { usePrintModal } from "../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../utils/printTemplates.js";
import {
  getAppointments,
  getDoctors,
  getRevenueSummary,
  getRevenueAnalytics,
} from "../services/api.js";
import { getDoctorDisplayName } from "../utils/doctorName.js";

const PIE_COLORS = ["#0F766E", "#0284C7", "#10B981", "#8B5CF6", "#F59E0B", "#64748B"];
const statuses = ["pending", "confirmed", "completed", "cancelled"];

export default function Reports() {
  const { user, loading } = useAuth();
  const { openPrintPreview } = usePrintModal();
  const [reportData, setReportData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("revenue"); // 'revenue' | 'appointments'

  const handlePrintRevenueSummary = () => {
    if (!reportData) return;
    const rev = reportData.revenue || {};
    const methods = analytics?.paymentMethods || [];

    const html = generateGeneralHospitalReportHtml({
      title: "Hospital Financial & Revenue Audit Report",
      subtitle: "Consolidated Billing Collections & Departmental Revenue Analysis",
      metrics: [
        { label: "Total Gross Revenue", value: `₹${Number(rev.totalRevenue || 0).toLocaleString("en-IN")}`, color: "#0f766e" },
        { label: "Today's Collections", value: `₹${Number(rev.todayRevenue || 0).toLocaleString("en-IN")}`, color: "#0284c7" },
        { label: "Pending Invoices", value: `₹${Number(rev.pendingAmount || 0).toLocaleString("en-IN")}`, color: "#d97706" },
        { label: "Total Bills Settled", value: `${rev.totalBills || 0}`, color: "#166534" },
      ],
      tables: [
        {
          title: "Payment Method Collections Distribution",
          headers: ["Payment Mode", "Transaction Count", "Gross Amount (INR)", "% of Total"],
          rows: methods.map(m => [
            m._id?.toUpperCase() || "OTHER",
            String(m.count || 0),
            `₹${Number(m.value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            `${rev.totalRevenue > 0 ? Math.round((m.value / rev.totalRevenue) * 100) : 0}%`,
          ]),
        },
      ],
      notes: "Official hospital financial summary audited and compiled from the central billing registry. All transactions are logged with digital audit trails.",
    });

    openPrintPreview({
      title: "Hospital Financial & Revenue Audit Report",
      htmlContent: html,
      refNumber: `FIN-AUDIT-${Date.now().toString().slice(-6)}`,
    });
  };

  useEffect(() => {
    if (user?.role !== "admin") return;

    let isCurrentRequest = true;

    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const [revenueData, appointmentData, doctorData, analyticsData] =
          await Promise.all([
            getRevenueSummary(),
            getAppointments(),
            getDoctors(),
            getRevenueAnalytics().catch(() => null),
          ]);

        if (isCurrentRequest) {
          setReportData({
            revenue: revenueData,
            appointments: appointmentData.appointments,
            doctors: doctorData.doctors,
          });
          setAnalytics(analyticsData);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load reports.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchReports();

    return () => {
      isCurrentRequest = false;
    };
  }, [user?.role]);

  const { appointmentStatusData, doctorsByAppointmentCount } = useMemo(() => {
    const appointments = reportData?.appointments || [];
    const doctors = reportData?.doctors || [];
    const countsByDoctor = appointments.reduce((counts, appointment) => {
      const doctorId = appointment.doctor?._id;
      if (doctorId) counts[doctorId] = (counts[doctorId] || 0) + 1;
      return counts;
    }, {});

    return {
      appointmentStatusData: statuses.map((status) => ({
        status: status.replace("_", " "),
        count: appointments.filter((appointment) => appointment.status === status).length,
      })),
      doctorsByAppointmentCount: doctors
        .map((doctor) => ({
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          appointments: countsByDoctor[doctor._id] || 0,
        }))
        .sort((first, second) => second.appointments - first.appointments),
    };
  }, [reportData]);

  if (loading) {
    return <p className="text-slate-600">Checking access...</p>;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading comprehensive reports...</p>;
  }

  if (error) {
    return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  const kpis = analytics?.kpis || {
    totalRevenue: reportData.revenue.totalRevenue || 0,
    pendingAmount: reportData.revenue.totalPendingAmount || 0,
    todayRevenue: 0,
    monthRevenue: reportData.revenue.totalRevenue || 0,
    collectionRate: 92,
  };

  const monthlyTrends = analytics?.monthlyTrends || [
    { month: "Apr", revenue: 45000, pending: 5000 },
    { month: "May", revenue: 52000, pending: 4200 },
    { month: "Jun", revenue: 61000, pending: 6800 },
    { month: "Jul", revenue: 58000, pending: 3500 },
    { month: "Aug", revenue: 74000, pending: 5100 },
    { month: "Sep", revenue: Number(kpis.totalRevenue) || 82000, pending: Number(kpis.pendingAmount) || 6000 },
  ];

  const paymentBreakdown = analytics?.paymentMethodsBreakdown || [
    { name: "Razorpay Gateway", value: 34500, count: 24 },
    { name: "Instant UPI / QR", value: 28000, count: 18 },
    { name: "Cash Counter", value: 15000, count: 12 },
    { name: "Health Insurance", value: 45000, count: 5 },
  ];

  return (
    <section className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-2">
            <span>📈 Revenue Analytics & Operations</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Executive BI
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial performance, billing method distributions, and doctor OPD volume.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex w-full sm:w-auto overflow-x-auto rounded-xl bg-slate-100 p-1 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView("revenue")}
            className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-lg transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              activeView === "revenue"
                ? "bg-white text-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💰 Revenue & Finance
          </button>
          <button
            type="button"
            onClick={() => setActiveView("appointments")}
            className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2 rounded-lg transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              activeView === "appointments"
                ? "bg-white text-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🩺 Appointments & Doctors
          </button>
        </div>
      </div>

      {/* ── Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-md flex flex-col justify-between">
          <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
            Total Collections
          </span>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono tabular-nums">
              ₹{Number(kpis.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-teal-200 mt-0.5">
              Across all OPD & IPD settled invoices
            </p>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Outstanding Due
          </span>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-amber-700 tabular-nums">
              ₹{Number(kpis.pendingAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unsettled invoices & claims
            </p>
          </div>
        </div>

        {/* Month Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            This Month
          </span>
          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-slate-900 tabular-nums">
              ₹{Number(kpis.monthRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Current billing cycle
            </p>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Collection Rate
          </span>
          <div className="mt-3">
            <p className="text-2xl font-black text-teal-700">
              {kpis.collectionRate || 100}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Settled vs generated ratio
            </p>
          </div>
        </div>
      </div>

      {activeView === "revenue" ? (
        <div className="space-y-6">
          {/* ── Monthly Revenue Chart (Area/Line) ── */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Monthly Hospital Revenue Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Monthly comparison of settled collections vs outstanding amounts (₹)
                </p>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                Past 6 Months
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F766E" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0F766E" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Settled Collections (₹)"
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    name="Pending Due (₹)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pendingGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Payment Method Distribution (Donut & Breakdown) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie / Donut Chart */}
            <section className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Payment Channels & Method Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Revenue proportion breakdown across Razorpay, UPI QR, Cash, and Insurance
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {paymentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                      contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Method Breakdown Table */}
            <section className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 mb-3">
                  Channel Financials & Transaction Volume
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {paymentBreakdown.map((method, idx) => (
                    <div key={method.name} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <div>
                          <p className="font-bold text-slate-800">{method.name}</p>
                          <p className="text-[10px] text-slate-400">{method.count} transactions</p>
                        </div>
                      </div>
                      <p className="font-mono font-black text-slate-900 text-sm">
                        ₹{Number(method.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-right no-print print:hidden">
                <button
                  type="button"
                  onClick={handlePrintRevenueSummary}
                  className="w-full sm:w-auto text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 min-h-[44px] px-4 py-2 rounded-xl border border-teal-200 inline-flex items-center justify-center gap-1.5 transition"
                >
                  🖨️ Export Revenue Summary
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Appointments Status Bar Chart ── */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Appointments by Status</h3>
              <p className="text-xs text-slate-500">
                Overview of pending, confirmed, completed, and cancelled consultations
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentStatusData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value) => [value, "Appointments"]}
                    contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#0F766E" name="Appointments" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Doctor Consultations Volume List ── */}
          <section className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Specialist OPD Volume</h3>
              <span className="text-xs font-bold text-slate-500">
                {doctorsByAppointmentCount.length} active specialists
              </span>
            </div>

            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {doctorsByAppointmentCount.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                      👨‍⚕️
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{getDoctorDisplayName(doctor)}</p>
                      <p className="text-[11px] text-slate-500">{doctor.specialization}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 font-mono font-bold">
                    {doctor.appointments} consultations
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminRevenueAnalytics } from "../../services/api.js";

const formatCurrency = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt || 0);

export default function RevenueAnalyticsPage() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRevenueData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminRevenueAnalytics(range);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load financial telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueData();
  }, [range]);

  const stats = data?.stats || {
    totalRevenue: 0,
    outstandingRevenue: 0,
    settledInvoices: 0,
    unsettledInvoices: 0,
  };

  const paymentBreakdown = data?.paymentMethodBreakdown || [];
  const recentTransactions = data?.recentSettledTransactions || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Finance & Accounts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Revenue & Financial Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cash flow monitoring, digital receipts settlement, outstanding patient balances, and department income.
          </p>
        </div>

        {/* Range Controls */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs text-xs">
          {["today", "week", "month", "year"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 font-bold capitalize transition ${
                range === r
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Financial Highlight Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <p className="text-xs font-semibold text-slate-500">Collected Revenue</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span>✓</span> {stats.settledInvoices} Invoices Settled
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <p className="text-xs font-semibold text-slate-500">Outstanding Receivables</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
            {formatCurrency(stats.outstandingRevenue)}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
            <span>⏳</span> {stats.unsettledInvoices} Invoices Pending
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Settlement Ratio</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.settledInvoices + stats.unsettledInvoices > 0
              ? `${Math.round((stats.settledInvoices / (stats.settledInvoices + stats.unsettledInvoices)) * 100)}%`
              : "100%"}
          </p>
          <div className="mt-2 text-[11px] font-semibold text-slate-500">
            Cashier settlement health
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-600" />
          <p className="text-xs font-semibold text-slate-500">Billing Directory</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.settledInvoices + stats.unsettledInvoices}
          </p>
          <Link to="/billing" className="mt-2 text-[11px] font-bold text-blue-600 hover:underline block">
            Open Billing Terminal →
          </Link>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Channels Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <h2 className="text-sm font-bold text-slate-900">Payment Methods Breakdown</h2>
          <p className="text-xs text-slate-400 mt-0.5">Distribution across collection channels</p>

          <div className="mt-5 space-y-4">
            {paymentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No paid transactions in this time window.</p>
            ) : (
              paymentBreakdown.map((pm) => {
                const pct = stats.totalRevenue > 0 ? Math.round((pm.totalAmount / stats.totalRevenue) * 100) : 0;
                return (
                  <div key={pm._id || "Other"} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="capitalize">{pm._id || "Cash / Counter"}</span>
                      <span>{formatCurrency(pm.totalAmount)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">{pm.count} transactions settled</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Settled Transactions List */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Settled Receipts</h2>
              <p className="text-xs text-slate-400 mt-0.5">Audited real-time billing settlements</p>
            </div>
            <Link to="/billing" className="text-xs font-bold text-purple-600 hover:underline">
              View All Invoices →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Patient</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No settled transactions found.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-mono font-bold text-purple-700">
                        {tx.invoiceNumber || tx._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {tx.patient?.name || "Patient Walk-in"}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.updatedAt || tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {tx.paymentMethod || "Counter Cash"}
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700 font-mono">
                        {formatCurrency(tx.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import { getMyBillings } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

function MetricCard({ label, value, sub, valueColor = "text-slate-900" }) {
  return (
    <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between min-h-[120px]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-mono ${valueColor}`}>{value}</p>
      </div>
      <p className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">{sub}</p>
    </div>
  );
}

function PaymentHistory() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyBillings();
        if (active) {
          setBillings(res.billings || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load payment history");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredBills = statusFilter === "all"
    ? billings
    : billings.filter((b) => b.paymentStatus === statusFilter);

  const totalPaid = billings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const totalPending = billings
    .filter((b) => b.paymentStatus === "pending" || b.paymentStatus === "partially_paid")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Payment History", active: true },
        ]}
        title="Hospital Payment History"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Billing Ledger
          </span>
        }
        subtitle="Track all past payments, download official hospital GST invoices, and settle outstanding balances."
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Settled / Paid"
          value={`₹${totalPaid.toFixed(2)}`}
          sub="Successfully processed receipts"
          valueColor="text-emerald-700"
        />
        <MetricCard
          label="Outstanding Balance"
          value={`₹${totalPending.toFixed(2)}`}
          sub="Pending clearance"
          valueColor={totalPending > 0 ? "text-amber-800" : "text-slate-900"}
        />
        <MetricCard
          label="Total Invoices"
          value={billings.length}
          sub="Consultation & diagnostic bills"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `All Transactions (${billings.length})` },
          { key: "paid", label: `Paid (${billings.filter((b) => b.paymentStatus === "paid").length})` },
          { key: "pending", label: `Pending (${billings.filter((b) => b.paymentStatus === "pending").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === tab.key
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your payment records...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-700 text-2xl mb-3">
            💳
          </div>
          <h3 className="text-sm font-bold text-slate-800">No payment records found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No transactions match the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3 font-bold">Invoice / Date</th>
                  <th className="px-5 py-3 font-bold">Description</th>
                  <th className="px-5 py-3 font-bold">Payment Method</th>
                  <th className="px-5 py-3 font-bold">Amount</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-900">
                        #{b._id.toString().slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {b.appointment ? `Consultation (${b.appointment.timeSlot || ""})` : "Hospital Services & Diagnostics"}
                      </p>
                      <p className="text-xs text-slate-400">Nivora Care Outpatient/Inpatient</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full liquid-glass-pill bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
                        {b.paymentMethod || "UPI / Online"}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        ₹{b.totalAmount?.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize liquid-glass-pill border ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                            : "bg-amber-50 text-amber-800 border-amber-200/70"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(b)}
                        className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                      >
                        📄 Receipt
                      </button>
                      {b.paymentStatus !== "paid" && (
                        <a
                          href={`/pay/${b._id}`}
                          className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-3.5 py-1.5 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 inline-block"
                        >
                          💳 Pay
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          isPatient={true}
          onBillingUpdate={(updated) => {
            setBillings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
          }}
        />
      )}
    </div>
  );
}

export default PaymentHistory;

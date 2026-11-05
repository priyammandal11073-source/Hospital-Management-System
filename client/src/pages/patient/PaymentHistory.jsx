import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import { getMyBillings } from "../../services/api.js";
import { PageHeader, Button } from "../../components/ui/index.js";

function MetricCard({ label, value, sub, valueColor = "text-slate-900" }) {
  return (
    <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70 flex flex-col justify-between min-h-[120px]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-1.5 text-2xl sm:text-3xl font-black tracking-tight font-mono tabular-nums ${valueColor}`}>{value}</p>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100">{sub}</p>
    </div>
  );
}

/**
 * PaymentHistory – Patient Financial Ledger
 * Emil Kowalski Craft Polish:
 * - Tone-on-tone borderless elevation
 * - Seamless filter pill toggle
 * - Tabular numbers and instant invoice settlement
 */
function PaymentHistory() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentBilling, setPaymentBilling] = useState(null);
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
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-teal-800 bg-teal-50 ring-1 ring-teal-600/20">
            Billing Ledger
          </span>
        }
        subtitle="Track past receipts, download official hospital GST invoices, and clear outstanding bills."
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <MetricCard
          label="Total Settled / Paid"
          value={`₹${totalPaid.toFixed(2)}`}
          sub="Verified payments & receipts"
          valueColor="text-emerald-800"
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
          sub="Consultation & lab test bills"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `All Transactions (${billings.length})` },
          { key: "paid", label: `Paid (${billings.filter((b) => b.paymentStatus === "paid").length})` },
          { key: "pending", label: `Pending (${billings.filter((b) => b.paymentStatus !== "paid").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-[0.97] cursor-pointer ${
              statusFilter === tab.key
                ? "bg-teal-800 text-white shadow-xs"
                : "bg-white text-slate-700 ring-1 ring-slate-200/70 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card bg-white p-12 text-center shadow-xs ring-1 ring-slate-200/70">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Loading payment history...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card bg-white p-12 text-center shadow-xs ring-1 ring-slate-200/70">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 text-2xl mb-3 ring-1 ring-slate-200/70">
            💳
          </div>
          <h3 className="text-sm font-bold text-slate-800">No payment records found</h3>
          <p className="mt-1 text-xs text-slate-500">
            No transactions match the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Invoice / Date</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-900">
                        #{b._id.toString().slice(-6).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {new Date(b.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {b.appointment ? "Outpatient Medical Consultation" : "Hospital Medical Services"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {b.itemizedCharges?.length || 1} billable line item(s)
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs uppercase font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {b.paymentMethod || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-black text-slate-900 text-sm tabular-nums">
                        ₹{(b.totalAmount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20"
                            : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.paymentStatus !== "paid" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPaymentBilling(b)}
                            className="text-xs font-bold active:scale-[0.96] shadow-2xs"
                          >
                            💳 Pay
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(b)}
                          className="text-xs font-bold active:scale-[0.96]"
                        >
                          Invoice
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Universal Online Payment Modal */}
      {paymentBilling && (
        <UniversalPaymentModal
          billing={paymentBilling}
          isOpen={Boolean(paymentBilling)}
          onClose={() => setPaymentBilling(null)}
          isPatient={true}
          onPaymentSuccess={(updatedBilling) => {
            setBillings((prev) =>
              prev.map((b) => (b._id === updatedBilling._id ? updatedBilling : b))
            );
            setPaymentBilling(null);
          }}
          title="Online Invoice Settlement"
        />
      )}

      {/* Invoice modal */}
      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          isPatient={true}
        />
      )}
    </div>
  );
}

export default PaymentHistory;

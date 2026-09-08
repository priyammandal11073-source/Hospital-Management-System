import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import { getMyBillings } from "../../services/api.js";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Payment History</h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              Billing Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track all past payments, download official hospital GST invoices, and settle outstanding balances.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Settled / Paid</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">₹{totalPaid.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Successfully processed receipts</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">₹{totalPending.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Pending clearance</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Invoices</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{billings.length}</p>
          <p className="mt-1 text-xs text-slate-400">Consultation & diagnostic bills</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: `All Transactions (${billings.length})` },
          { key: "paid", label: `Paid (${billings.filter((b) => b.paymentStatus === "paid").length})` },
          { key: "pending", label: `Pending (${billings.filter((b) => b.paymentStatus === "pending").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading your payment records...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            💳
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No payment records found</h3>
          <p className="mt-1 text-sm text-slate-500">
            No transactions match the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-mono font-bold text-slate-900">
                        #{b._id.toString().slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-400">
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
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                        {b.paymentMethod || "UPI / Online"}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{b.totalAmount?.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(b)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                      >
                        📄 Receipt
                      </button>
                      {b.paymentStatus !== "paid" && (
                        <a
                          href={`/pay/${b._id}`}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 shadow-2xs transition inline-block"
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

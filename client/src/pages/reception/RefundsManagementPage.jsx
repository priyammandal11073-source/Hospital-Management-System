import { useState, useEffect } from "react";
import { getBillings, processBillingRefund } from "../../services/api.js";
import { toast } from "../../utils/toast.js";

export default function RefundsManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await getBillings();
      setInvoices(data.billings || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openRefund = (inv) => {
    setRefundModal(inv);
    setRefundAmount(inv.totalAmount);
    setRefundReason("");
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      toast.warning("Please state the clinical or administrative reason for the refund.");
      return;
    }

    setIsProcessing(true);
    try {
      await processBillingRefund(refundModal._id, {
        reason: refundReason.trim(),
        amount: Number(refundAmount),
      });
      toast.success(`Refund of ₹${refundAmount} recorded successfully.`);
      setRefundModal(null);
      loadInvoices();
    } catch (err) {
      toast.error("Failed to process refund: " + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const refundedList = invoices.filter((i) => i.paymentStatus === "refunded");
  const paidList = invoices.filter((i) => i.paymentStatus === "paid");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Cashier Audit</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Billing Refunds & Counter Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Process authorized counter refunds for cancelled consultations, pharmacy returns, or admission fee reversals.
          </p>
        </div>

        <button
          onClick={loadInvoices}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition self-start sm:self-auto"
        >
          <span>🔄</span>
          <span>Refresh Invoices</span>
        </button>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <p className="text-xs font-bold text-slate-500">Settled Invoices Eligible for Refund</p>
          <p className="mt-2 text-3xl font-black text-slate-800">{paidList.length}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Cleared counter payments</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
          <p className="text-xs font-bold text-slate-500">Total Processed Refunds</p>
          <p className="mt-2 text-3xl font-black text-rose-600">{refundedList.length}</p>
          <p className="text-xs text-rose-500 font-semibold mt-1">Adjusted in hospital ledger</p>
        </div>
      </div>

      {/* Settled Invoices Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 p-4 font-bold text-slate-800 text-sm">
          Settled Counter Invoices (Click to Process Refund)
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">Loading billing ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 15).map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      INV-{inv._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {inv.patient?.name || "Patient"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-500">
                      {inv.paymentMethod || "Cash"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                            : inv.paymentStatus === "refunded"
                            ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.paymentStatus === "paid" ? (
                        <button
                          onClick={() => openRefund(inv)}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          Process Refund
                        </button>
                      ) : inv.paymentStatus === "refunded" ? (
                        <span className="text-[11px] text-slate-400 italic">Refunded</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unsettled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3">
              Process Counter Refund
            </h2>

            <form onSubmit={handleRefundSubmit} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Patient: <span className="font-bold text-slate-800">{refundModal.patient?.name}</span></p>
                <p className="text-xs text-slate-500">Invoice: <span className="font-mono font-bold text-slate-800">INV-{refundModal._id.slice(-6).toUpperCase()}</span></p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Refund Amount (₹):</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={refundModal.totalAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Refund:</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Doctor unavailable / OPD cancellation / pharmacy consumable adjustment"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Confirm & Issue Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

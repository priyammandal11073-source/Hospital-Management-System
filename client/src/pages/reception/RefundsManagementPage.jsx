import { useState, useEffect } from "react";
import { getBillings, processBillingRefund } from "../../services/api.js";
import { toast } from "../../utils/toast.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
  Modal,
} from "../../components/ui/index.js";

export default function RefundsManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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
      setError(err.response?.data?.message || "Failed to load invoices");
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
    <div className="space-y-6" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="Billing Refunds & Counter Settlements"
        subtitle="Process authorized counter refunds for cancelled consultations, pharmacy returns, or admission fee reversals."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span><span className="text-xs font-bold uppercase tracking-wider text-rose-600">Cashier Audit</span></span>}
        actions={[
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            leftIcon={<span>🔄</span>}
          >
            Refresh Invoices
          </Button>,
        ]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Settled Invoices Eligible for Refund" subtitle="Cleared counter payments">
          <div className="text-3xl font-black text-slate-800 mt-1">{paidList.length}</div>
        </Card>
        <Card title="Total Processed Refunds" subtitle="Adjusted in hospital ledger">
          <div className="text-3xl font-black text-rose-600 mt-1">{refundedList.length}</div>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="border-b border-slate-100 p-4 font-bold text-slate-800 text-sm">
          Settled Counter Invoices (Click to Process Refund)
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">Loading billing ledger…</div>
        ) : paidList.length === 0 ? (
          <EmptyStateCard
            icon="🧾"
            title="No settled invoices available for refund"
            description="Processed payments will appear here once cashier settlements are complete."
          />
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
                {paidList.slice(0, 15).map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      INV-{inv._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {inv.patient?.name || "Patient"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 tabular-nums">
                      ₹{inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-500 font-mono text-xs">
                      {inv.paymentMethod || "Cash"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status="paid">
                        {inv.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => openRefund(inv)} className="text-xs font-bold active:scale-[0.96]">
                        Process Refund
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {refundModal && (
        <Modal
          isOpen={Boolean(refundModal)}
          onClose={() => setRefundModal(null)}
          title="Process Counter Refund"
          className="max-w-md"
        >
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
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
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
                {isProcessing ? "Processing…" : "Confirm & Issue Refund"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

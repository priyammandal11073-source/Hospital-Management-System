import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBillings } from "../../services/api.js";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import {
  PageHeader,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

/**
 * PharmacyBillingPage – Pharmacy POS & Cashier Workbench
 * Emil Kowalski Craft Polish:
 * - Tone-on-tone borderless elevation with soft ambient ring-1 ring-slate-200/70
 * - Tactile active press responses on all cashier buttons
 * - Instant invoice view & settlement modal integration
 */
export default function PharmacyBillingPage() {
  const [billings, setBillings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const data = await getBillings();
      setBillings(data.billings || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const filteredBillings = billings.filter((b) => {
    const status = b.paymentStatus || "pending";
    if (activeTab === "unpaid" && status === "paid") return false;
    if (activeTab === "paid" && status !== "paid") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const patMatch = b.patient?.name?.toLowerCase().includes(q);
      const idMatch = b._id?.toLowerCase().includes(q);
      return patMatch || idMatch;
    }
    return true;
  });

  const totalCollected = billings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);

  const totalPending = billings
    .filter((b) => b.paymentStatus !== "paid")
    .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Billing, Cashier & Receipts"
        subtitle="Collect medication payments, process insurance co-pays, print GST tax invoices, and issue refunds."
        breadcrumbs={
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Financials & POS</span>
          </span>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Settled Receipts</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-800 font-mono tabular-nums">
            ₹{Math.round(totalCollected).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            Cash, UPI & Card collections
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Invoices</p>
          <p className={`mt-1.5 text-2xl font-black font-mono tabular-nums ${totalPending > 0 ? "text-amber-800" : "text-slate-900"}`}>
            ₹{Math.round(totalPending).toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            Awaiting patient or TPA clearance
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pharmacy GSTIN</p>
          <p className="mt-1.5 text-xl font-bold font-mono text-slate-900">
            27AAAAA0000A1Z5
          </p>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
            5% & 12% pharmaceutical slabs
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Transactions" },
            { id: "unpaid", label: "Pending Cashier Settlement" },
            { id: "paid", label: "Paid Receipts" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-[0.97] whitespace-nowrap cursor-pointer ${
                activeTab === f.id
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Input
            type="text"
            placeholder="Search patient, invoice #…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-3 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="billing-search"
          />
        </div>
      </div>

      {/* Billings Table */}
      <div className="rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Loading cashier ledger…</p>
          </div>
        ) : filteredBillings.length === 0 ? (
          <EmptyStateCard
            icon="🧾"
            title="No billing records found"
            description="Transactions will be recorded upon prescription dispensation."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Invoice # / Date</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Breakdown</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5 text-right">Cashier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBillings.map((bill) => {
                  const isPaid = bill.paymentStatus === "paid";
                  const amount = bill.totalAmount || bill.amount || 0;

                  return (
                    <tr key={bill._id} className="hover:bg-slate-50/70 transition-colors duration-150">
                      <td className="px-5 py-4 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {bill.invoiceNumber || `INV-${bill._id.slice(-6).toUpperCase()}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(bill.createdAt || Date.now()).toLocaleDateString("en-IN")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900">{bill.patient?.name || "Outpatient"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {bill.patient?.contact || "+91 98765 43210"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {bill.services?.map((s) => s.name).join(", ") || "Pharmacy Medications & Dispensing Fees"}
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-slate-900 text-sm tabular-nums">
                        ₹{amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPaid ? (
                          <Badge status="completed">✓ Paid ({bill.paymentMethod || "Cash"})</Badge>
                        ) : (
                          <Badge status="pending">Pending Payment</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(bill)}
                            className="text-xs font-bold active:scale-[0.96]"
                          >
                            Invoice
                          </Button>
                          {!isPaid ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedBilling(bill)}
                              className="text-xs font-bold active:scale-[0.96] shadow-2xs"
                            >
                              💳 Settle
                            </Button>
                          ) : (
                            <Link
                              to={`/pharmacy/dispense/${bill._id}`}
                              className="rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20 px-3 py-1.5 text-xs font-bold active:scale-[0.96] transition"
                            >
                              Dispense Receipt
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {selectedBilling && (
        <UniversalPaymentModal
          billing={selectedBilling}
          isOpen={Boolean(selectedBilling)}
          onClose={() => setSelectedBilling(null)}
          onPaymentSuccess={() => {
            setSelectedBilling(null);
            fetchBillings();
          }}
          title="Pharmacy Medicine Billing & Settlement"
        />
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onBillingUpdate={() => {
            fetchBillings();
          }}
        />
      )}
    </div>
  );
}

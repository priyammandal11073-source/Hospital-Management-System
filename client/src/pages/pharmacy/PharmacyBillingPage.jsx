import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBillings } from "../../services/api.js";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
  Modal,
} from "../../components/ui/index.js";

export default function PharmacyBillingPage() {
  const [billings, setBillings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(null);

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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Pharmacy Billing, Cashier & Receipts"
          subtitle="Collect medication payments, process insurance co-pays, print GST tax invoices, and issue refunds."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Financials & POS</span>
            </span>
          }
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Total Settled Receipts" subtitle="Cash, UPI & Card collections">
          <div className="text-2xl font-black text-emerald-950">₹{Math.round(totalCollected).toLocaleString("en-IN")}</div>
        </Card>
        <Card title="Pending Invoices" subtitle="Awaiting patient or TPA clearance">
          <div className="text-2xl font-black text-rose-950">₹{Math.round(totalPending).toLocaleString("en-IN")}</div>
        </Card>
        <Card title="Pharmacy GSTIN" subtitle="5% & 12% pharmaceutical slabs">
          <div className="text-base font-mono font-bold text-slate-900">27AAAAA0000A1Z5</div>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Transactions" },
            { id: "unpaid", label: "Pending Cashier Settlement" },
            { id: "paid", label: "Paid Receipts" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                activeTab === f.id
                  ? "bg-slate-900 text-slate-100 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="billing-search"
          />
        </div>
      </div>

      {/* Billings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading cashier ledger…</p>
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
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice # / Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Bill Breakdown</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Cashier Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBillings.map((bill) => {
                  const isPaid = bill.paymentStatus === "paid";
                  const amount = bill.totalAmount || bill.amount || 450;

                  return (
                    <tr key={bill._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {bill.invoiceNumber || `INV-${bill._id.slice(-6).toUpperCase()}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {new Date(bill.createdAt || Date.now()).toLocaleDateString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{bill.patient?.name || "Outpatient"}</div>
                        <div className="text-[11px] text-slate-500">
                          {bill.patient?.contact || "+91 98765 43210"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {bill.services?.map((s) => s.name).join(", ") || "Pharmacy Medications & Dispensing Fees"}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        ₹{amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPaid ? (
                          <Badge status="completed">✓ Paid ({bill.paymentMethod || "Cash"})</Badge>
                        ) : (
                          <Badge status="pending" className="animate-pulse">Pending Payment</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => setSelectedBilling(bill)}
                            className="rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm flex items-center gap-1 ml-auto"
                          >
                            <span>💳</span>
                            <span>Pay & Settle</span>
                          </button>
                        )}
                        {isPaid && (
                          <Link to={`/pharmacy/dispense/${bill._id}`} className="text-[11px] font-bold text-emerald-600">
                            Receipt Issued
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </div>
  );
}

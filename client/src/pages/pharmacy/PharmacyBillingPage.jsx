import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBillings } from "../../services/api.js";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Financials & POS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Billing, Cashier & Receipts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collect medication payments, process insurance co-pays, print GST tax invoices, and issue refunds.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-emerald-800 uppercase">Total Settled Receipts</p>
          <p className="mt-1 text-2xl font-black text-emerald-950">₹{Math.round(totalCollected).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-emerald-700 mt-1">Cash, UPI & Card collections</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-800 uppercase">Pending Invoices</p>
          <p className="mt-1 text-2xl font-black text-rose-950">₹{Math.round(totalPending).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-rose-700 mt-1">Awaiting patient or TPA clearance</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Pharmacy GSTIN</p>
          <p className="mt-1 text-base font-mono font-bold text-slate-900">27AAAAA0000A1Z5</p>
          <p className="text-[10px] text-slate-400 mt-1">5% & 12% pharmaceutical slabs</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
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
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, invoice #..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Billings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading cashier ledger...</p>
          </div>
        ) : filteredBillings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No billing records found</p>
            <p className="text-xs text-slate-400 mt-1">Transactions will be recorded upon prescription dispensation.</p>
          </div>
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
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Paid ({bill.paymentMethod || "Cash"})
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                            Pending Payment
                          </span>
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
                          <span className="text-[11px] font-bold text-emerald-600">Receipt Issued</span>
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

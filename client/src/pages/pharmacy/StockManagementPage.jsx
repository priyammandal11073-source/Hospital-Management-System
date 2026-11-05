import { useState, useEffect } from "react";
import {
  getStockMovements,
  recordStockAdjustment,
  getPharmacyInventory,
} from "../../services/api.js";
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

export default function StockManagementPage() {
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal for Stock Adjustment
  const [showModal, setShowModal] = useState(false);
  const [adjForm, setAdjForm] = useState({
    medicineName: "",
    batchNumber: "BAT-2026-09A",
    type: "adjustment",
    quantity: -5,
    reason: "Damaged vial in dispensing counter",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const [txData, invData] = await Promise.all([
        getStockMovements(),
        getPharmacyInventory(),
      ]);
      setTransactions(txData.transactions || []);
      setMedicines(invData.medicines || []);
      if (invData.medicines?.length > 0 && !adjForm.medicineName) {
        setAdjForm((f) => ({ ...f, medicineName: invData.medicines[0].name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordStockAdjustment(adjForm);
      setShowModal(false);
      fetchTransactions();
      alert("Stock adjustment successfully written to immutable ledger!");
    } catch (err) {
      alert("Adjustment failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const medMatch = tx.medicine?.name?.toLowerCase().includes(q) || tx.notes?.toLowerCase().includes(q);
      const batchMatch = tx.batch?.batchNumber?.toLowerCase().includes(q);
      return medMatch || batchMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Stock Movement & Ledger Audit"
          subtitle="Immutable physical audit trail of all dispensing deductions, vendor receipts, and damage write-offs."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Stock Integrity & Audit</span>
            </span>
          }
          actions={[
            <Button               key="adjust"
              size="sm"
              onClick={() => setShowModal(true)}
              leftIcon={<span>+</span>}
            >
              Record Adjustment / Write-Off
            </Button>,
          ]}
        />
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Movements" },
            { id: "dispensed", label: "Dispensed (-)" },
            { id: "purchase", label: "Goods Received (+)" },
            { id: "adjustment", label: "Audit Adjustments" },
            { id: "damage", label: "Damage / Expired" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                typeFilter === f.id
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
            placeholder="Search drug, batch #, reason…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
            id="stock-search"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading stock ledger transactions…</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <EmptyStateCard
            icon="📋"
            title="No transactions found"
            description="Movement entries are permanently captured on dispensing or stock receiving."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Medicine / Formulary</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Quantity Delta</th>
                  <th className="px-4 py-3">Reason / Reference</th>
                  <th className="px-4 py-3 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTx.map((tx) => {
                  const isNegative = (tx.quantity || 0) < 0 || tx.type === "dispensed" || tx.type === "damage";

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(tx.createdAt || Date.now()).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {tx.medicine?.name || "Medicine Item"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          tx.type === "dispensed" ? "bg-amber-100 text-amber-800" :
                          tx.type === "purchase" ? "bg-emerald-100 text-emerald-800" :
                          tx.type === "damage" ? "bg-rose-100 text-rose-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={isNegative ? "text-rose-600" : "text-emerald-600"}>
                          {isNegative ? "" : "+"}{tx.quantity} units
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {tx.notes || tx.referenceDocument || "Standard movement"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium">
                        {tx.performedBy?.name || "Chief Pharmacist"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Adjustment Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Physical Stock Adjustment"
          className="max-w-md"
        >
          <form onSubmit={handleAdjustmentSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Medicine</label>
              <select
                value={adjForm.medicineName}
                onChange={(e) => setAdjForm({ ...adjForm, medicineName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-teal-600 focus:outline-none"
              >
                {medicines.map((m) => (
                  <option key={m._id} value={m.name}>{m.name} (Stock: {m.currentStock})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Adjustment Type</label>
              <select
                value={adjForm.type}
                onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-teal-600 focus:outline-none"
              >
                <option value="adjustment">Physical Count Discrepancy</option>
                <option value="damage">Spillage / Damaged Stock</option>
                <option value="expired">Expired Quarantine</option>
                <option value="supplier_return">Return to Manufacturer</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity (Positive for addition, negative for deduction)</label>
              <Input
                type="number"
                value={adjForm.quantity}
                onChange={(e) => setAdjForm({ ...adjForm, quantity: parseInt(e.target.value) || 0 })}
                required
                id="adj-quantity"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason / Clinical Audit Justification</label>
              <textarea
                rows="2"
                value={adjForm.reason}
                onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                required
                placeholder="Explain why the adjustment is needed…"
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? "Writing Ledger…" : "Commit Adjustment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

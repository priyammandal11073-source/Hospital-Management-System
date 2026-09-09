import { useState, useEffect } from "react";
import {
  getStockMovements,
  recordStockAdjustment,
  getPharmacyInventory,
} from "../../services/api.js";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Stock Integrity & Audit</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Movement & Ledger Audit</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable physical audit trail of all dispensing deductions, vendor receipts, and damage write-offs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Adjustment / Write-Off</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
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
            placeholder="Search drug, batch #, reason..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading stock ledger transactions...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">Movement entries are permanently captured on dispensing or stock receiving.</p>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Physical Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Medicine</label>
                <select
                  value={adjForm.medicineName}
                  onChange={(e) => setAdjForm({ ...adjForm, medicineName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
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
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
                >
                  <option value="adjustment">Physical Count Discrepancy</option>
                  <option value="damage">Spillage / Damaged Stock</option>
                  <option value="expired">Expired Quarantine</option>
                  <option value="supplier_return">Return to Manufacturer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity (Positive for addition, negative for deduction)</label>
                <input
                  type="number"
                  value={adjForm.quantity}
                  onChange={(e) => setAdjForm({ ...adjForm, quantity: parseInt(e.target.value) || 0 })}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Clinical Audit Justification</label>
                <textarea
                  rows="2"
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  required
                  placeholder="Explain why the adjustment is needed..."
                  className="w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400"
                >
                  {isSubmitting ? "Writing Ledger..." : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

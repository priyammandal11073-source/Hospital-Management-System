import { useState, useEffect } from "react";
import {
  getPharmacyReturns,
  processPharmacyReturn,
  getPharmacyInventory,
} from "../../services/api.js";

export default function PharmacyReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // New Return Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    returnType: "patient_return",
    medicineName: "",
    batchNumber: "BAT-2026-09A",
    quantity: 1,
    refundAmount: 15.0,
    reason: "Doctor revised medication",
    disposition: "restock",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const [retRes, invRes] = await Promise.all([
        getPharmacyReturns(),
        getPharmacyInventory(),
      ]);
      setReturns(retRes.returns || []);
      setMedicines(invRes.medicines || []);
      if (invRes.medicines?.length > 0 && !form.medicineName) {
        setForm((prev) => ({ ...prev, medicineName: invRes.medicines[0].name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await processPharmacyReturn(form);
      setShowModal(false);
      fetchReturns();
      alert("Return record processed successfully!");
    } catch (err) {
      alert("Return processing failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReturns = returns.filter((r) => {
    if (filterType !== "all" && r.returnType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Disposal & Reconciliations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Returns & Damage Control</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process patient medicine returns, vendor credit claims for near-expiry stocks, and disposal of damaged items.
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
          <span>Initiate Return / Credit</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {[
          { id: "all", label: "All Returns" },
          { id: "patient_return", label: "Patient Medication Returns" },
          { id: "supplier_return", label: "Supplier Recalls / Returns" },
          { id: "damage_writeoff", label: "Damage & Breakage Disposal" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              filterType === f.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading returns and credit archives...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No returns recorded</p>
            <p className="text-xs text-slate-400 mt-1">Returned medication and supplier credit claims appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Return ID / Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Medicine Item</th>
                  <th className="px-4 py-3">Batch #</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Credit / Refund</th>
                  <th className="px-4 py-3 text-right">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.map((ret) => (
                  <tr key={ret._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <span className="font-bold text-slate-900">
                        {ret.returnNumber || `RET-${ret._id.slice(-6).toUpperCase()}`}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {new Date(ret.createdAt || Date.now()).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                        {ret.returnType?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {ret.medicine?.name || ret.medicineName || "Medicine Item"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {ret.batch?.batchNumber || ret.batchNumber || "BAT-2026-09A"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {ret.quantity} units
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{(ret.refundAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {ret.reason || "Patient revised prescription"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Process Return / Credit Note</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Category</label>
                <select
                  value={form.returnType}
                  onChange={(e) => setForm({ ...form, returnType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
                >
                  <option value="patient_return">Patient Return (Unused / Cancelled)</option>
                  <option value="supplier_return">Return to Supplier (Near Expiry / Defect)</option>
                  <option value="damage_writeoff">Breakage / Damage Write-Off</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Formulation</label>
                <select
                  value={form.medicineName}
                  onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold"
                >
                  {medicines.map((m) => (
                    <option key={m._id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Units Returned</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Refund / Credit (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.refundAmount}
                    onChange={(e) => setForm({ ...form, refundAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Disposition</label>
                  <select
                    value={form.disposition}
                    onChange={(e) => setForm({ ...form, disposition: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5"
                  >
                    <option value="restock">Restock to Inventory</option>
                    <option value="quarantine">Quarantine & Quarantine Bin</option>
                    <option value="destroy">Destroy / Waste Disposal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Clinical Authorization</label>
                <textarea
                  rows="2"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  placeholder="Explain why the return was accepted..."
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
                  {isSubmitting ? "Processing..." : "Authorize Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

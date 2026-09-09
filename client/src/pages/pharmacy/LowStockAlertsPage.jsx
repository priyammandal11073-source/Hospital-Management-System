import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPharmacyAlerts } from "../../services/api.js";

export default function LowStockAlertsPage() {
  const [alerts, setAlerts] = useState({ lowStock: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await getPharmacyAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const lowStockItems = alerts.lowStock || [];
  const outOfStock = lowStockItems.filter((m) => (m.currentStock || 0) === 0);
  const reorderNeeded = lowStockItems.filter((m) => (m.currentStock || 0) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Stock Replenishment</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Low Stock & Out-of-Stock Alerts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time replenishment alerts for medications at risk of stockout with automatic purchase order triggers.
          </p>
        </div>
        <Link
          to="/pharmacy/purchase-orders"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Create Vendor PO</span>
        </Link>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase">Completely Out of Stock</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{outOfStock.length}</p>
          <p className="text-[10px] text-rose-700 mt-1">Requires immediate emergency purchase</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-amber-800 uppercase">Below Reorder Point</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{reorderNeeded.length}</p>
          <p className="text-[10px] text-amber-800 mt-1">Standard PO generation recommended</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Average Lead Time</p>
          <p className="mt-1 text-2xl font-black text-slate-900">24-48 hrs</p>
          <p className="text-[10px] text-slate-400 mt-1">Approved local pharmaceutical vendors</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Medicines Requiring Stock Replenishment</h2>
          <span className="text-xs font-bold text-amber-600">{lowStockItems.length} items flagged</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Scanning stock levels across all formulary items...</p>
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">All inventory levels are healthy!</p>
            <p className="text-xs text-slate-400 mt-1">No items currently below their designated reorder thresholds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine & Dosage</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Balance</th>
                  <th className="px-4 py-3">Reorder Point</th>
                  <th className="px-4 py-3">Suggested Reorder Qty</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((med) => {
                  const isOut = (med.currentStock || 0) === 0;
                  const suggested = (med.reorderLevel || 20) * 3;

                  return (
                    <tr key={med._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {med.genericName || "—"} • {med.dosageForm || "Tablet"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {med.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold">
                        <span className={isOut ? "text-rose-600 font-black" : "text-amber-600"}>
                          {med.currentStock || 0} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {med.reorderLevel || 20} units
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                        +{suggested} units
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/pharmacy/purchase-orders?prefill=${encodeURIComponent(med.name)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-2xs transition"
                        >
                          <span>Generate PO</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

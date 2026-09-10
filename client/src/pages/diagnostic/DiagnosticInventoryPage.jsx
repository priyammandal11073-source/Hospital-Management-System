import { useEffect, useState } from "react";
import { getDiagnosticInventory } from "../../services/api.js";

export default function DiagnosticInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getDiagnosticInventory();
        if (res.success) {
          setItems(res.data || []);
        }
      } catch (e) {
        console.error("Failed to load diagnostic inventory", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Laboratory Reagents & Radiology Consumables
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time stock monitoring of vacutainer blood tubes, analyzer reagents, contrast media, and phlebotomy supplies
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-semibold">
          Accessing diagnostic consumables stock records...
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Item Code</th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">In Stock</th>
                  <th className="p-3.5">Min Threshold</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 pr-5 text-right">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((it) => {
                  const isLow = it.quantity <= it.minThreshold;
                  return (
                    <tr key={it._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{it.itemCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{it.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {it.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold ${isLow ? "text-rose-600 font-black" : "text-slate-900"}`}>
                          {it.quantity} {it.unit || "Units"}
                        </span>
                        {isLow && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                            LOW
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">{it.minThreshold} {it.unit || "Units"}</td>
                      <td className="p-3.5 font-bold text-slate-800">₹{it.unitPrice}</td>
                      <td className="p-3.5 text-slate-500">
                        {it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="p-3.5 pr-5 text-right font-semibold text-slate-700">{it.supplier}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

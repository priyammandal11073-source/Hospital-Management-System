import { useState, useEffect } from "react";
import { getDiagnosticInventory } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
  DataTable,
} from "../../components/ui/index.js";

export default function DiagnosticInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticInventory();
      if (res.success) {
        setInventory(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filtered = inventory.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q);
  });

  const stockColors = {
    available: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    low: "bg-amber-50 text-amber-700 border border-amber-200",
    out: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  if (loading) {
    return <PageLoader message="Loading inventory database…" />;
  }

  if (error) {
    return (
      <Card title="Inventory Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchInventory}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Inventory & Formulary"
        subtitle="Centralized pharmaceutical master catalog with real-time stock balances, reorder points, and unit pricing."
        actions={[]}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input placeholder="Search by brand, generic, category…" value={search} onChange={(e) => setSearch(e.target.value)} id="inventory-search" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyStateCard icon="💊" title="No inventory items found." description="Try another search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine & Strength</th>
                  <th className="px-4 py-3">Generic Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((m) => {
                  const stock = m.currentStock || 0;
                  const reorder = m.reorderLevel || 20;
                  const isLow = stock <= reorder;
                  const isOut = stock === 0;
                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-[11px] text-slate-500">{m.dosageForm || "Tablet"} • {m.strength || "Standard"} • {m.manufacturer || "Cipla"}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">{m.genericName || "—"}</td>
                      <td className="px-4 py-3.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{m.category || "General"}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"}`}>{stock} units</span>
                          {isOut ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">Out</span>
                          ) : isLow ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">Low</span>
                          ) : null}
                        </div>
                        <div className="mt-1 h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (stock / (reorder * 2)) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 font-mono">₹{(m.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Link to={`/diagnostic/batches?medicine=${encodeURIComponent(m.name)}`} className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition">Batches</Link>
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

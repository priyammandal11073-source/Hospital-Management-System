import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPharmacyAlerts } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Low Stock & Out-of-Stock Alerts"
          subtitle="Real-time replenishment alerts for medications at risk of stockout with automatic purchase order triggers."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Stock Replenishment</span>
            </span>
          }
          actions={[
            <Link key="create-po" to="/pharmacy/purchase-orders">
              <Button size="sm" leftIcon={<span>📋</span>}>
                Create Vendor PO
              </Button>
            </Link>,
          ]}
        />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Completely Out of Stock" subtitle="Requires immediate emergency purchase">
          <div className="text-2xl font-black text-rose-900">{outOfStock.length}</div>
        </Card>
        <Card title="Below Reorder Point" subtitle="Standard PO generation recommended">
          <div className="text-2xl font-black text-amber-900">{reorderNeeded.length}</div>
        </Card>
        <Card title="Average Lead Time" subtitle="Approved local pharmaceutical vendors">
          <div className="text-2xl font-black text-slate-900">24-48 hrs</div>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Medicines Requiring Stock Replenishment</h2>
          <Badge status="pending">{lowStockItems.length} items flagged</Badge>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Scanning stock levels across all formulary items…</p>
          </div>
        ) : lowStockItems.length === 0 ? (
          <EmptyStateCard
            icon="✅"
            title="All inventory levels are healthy!"
            description="No items currently below their designated reorder thresholds."
          />
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
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition"
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

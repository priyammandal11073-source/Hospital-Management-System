import { useState, useEffect } from "react";
import { getPharmacyAlerts, recordStockAdjustment } from "../../services/api.js";

export default function ExpiryManagementPage() {
  const [alerts, setAlerts] = useState({ expiredBatches: [], expiringBatches: [] });
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
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

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleQuarantine = async (batch) => {
    const confirmQuarantine = window.confirm(
      `Quarantine and write off Batch ${batch.batchNumber} (${batch.currentStock} units)? This will remove stock from active dispensing.`
    );
    if (!confirmQuarantine) return;

    try {
      await recordStockAdjustment({
        medicineName: batch.medicine?.name || "Medicine Item",
        batchNumber: batch.batchNumber,
        type: "expired",
        quantity: -Math.abs(batch.currentStock || 1),
        reason: "Quarantined and written off due to expiry",
      });
      alert(`Batch ${batch.batchNumber} quarantined successfully!`);
      fetchAlerts();
    } catch (err) {
      alert("Quarantine action failed: " + (err.response?.data?.message || err.message));
    }
  };

  const expiredList = alerts.expiredBatches || [];
  const expiringList = alerts.expiringBatches || [];

  // Group by timeframe
  const expiring30 = expiringList.filter((b) => {
    const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });
  const expiring60 = expiringList.filter((b) => {
    const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 30 && days <= 60;
  });
  const expiring90 = expiringList.filter((b) => {
    const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 60 && days <= 90;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Patient Safety & Quality</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expiry Management & Quarantine Radar</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Advance warning system for near-expiry formulations, strict disposal protocols, and supplier credit returns.
          </p>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase">Expired (Quarantine)</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{expiredList.length}</p>
          <p className="text-[10px] text-rose-700 mt-1">Blocked from dispensing</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-amber-800 uppercase">Expiring &lt; 30 Days</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{expiring30.length}</p>
          <p className="text-[10px] text-amber-800 mt-1">Immediate FIFO priority</p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-4 shadow-2xs">
          <p className="text-xs font-bold text-yellow-800 uppercase">Expiring 31-60 Days</p>
          <p className="mt-1 text-2xl font-black text-yellow-900">{expiring60.length}</p>
          <p className="text-[10px] text-yellow-800 mt-1">Monitor dispensing velocity</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Expiring 61-90 Days</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{expiring90.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Vendor credit window</p>
        </div>
      </div>

      {/* Critical Alert Banner if any expired */}
      {expiredList.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-black text-rose-900">
                {expiredList.length} Batch(es) have surpassed their labeled expiry date!
              </p>
              <p className="text-rose-700">
                Clinical dispensing is automatically blocked. Please quarantine these lots immediately to prevent patient safety risks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Items List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Batches Requiring Monitoring / Quarantine</h2>
          <span className="text-xs text-slate-400">{expiredList.length + expiringList.length} lots identified</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Running expiry radar scan...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine Item</th>
                  <th className="px-4 py-3">Batch #</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Days Remaining</th>
                  <th className="px-4 py-3">Units in Stock</th>
                  <th className="px-4 py-3 text-right">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Expired Batches */}
                {expiredList.map((b) => (
                  <tr key={b._id} className="bg-rose-50/50 hover:bg-rose-50 transition">
                    <td className="px-4 py-3.5 font-bold text-rose-950">
                      {b.medicine?.name || "Medicine Item"}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-800">
                      {b.batchNumber}
                    </td>
                    <td className="px-4 py-3.5 text-rose-800 font-semibold">
                      {new Date(b.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-black text-rose-900">
                        EXPIRED
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-900">
                      {b.currentStock} units
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuarantine(b)}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                      >
                        Quarantine & Write-Off
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Expiring Batches */}
                {expiringList.map((b) => {
                  const days = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = days <= 30;

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {b.medicine?.name || "Medicine Item"}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">
                        {b.batchNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {new Date(b.expiryDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isUrgent ? "bg-amber-200 text-amber-900" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {days} Days Left
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                        {b.currentStock} units
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {isUrgent ? "Prioritize Dispensing (FIFO)" : "Supplier Return Window"}
                        </span>
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

import { useState, useEffect } from "react";
import { getPharmacyAlerts, recordStockAdjustment } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyStateCard,
  PageLoader,
  ConfirmDialog,
} from "../../components/ui/index.js";

export default function ExpiryManagementPage() {
  const [alerts, setAlerts] = useState({ expiredBatches: [], expiringBatches: [] });
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [quarantineModal, setQuarantineModal] = useState(null);
  const [isQuarantining, setIsQuarantining] = useState(false);

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
    setQuarantineModal(batch);
  };

  const doQuarantine = async (batch) => {
    setIsQuarantining(true);
    try {
      await recordStockAdjustment({
        medicineName: batch.medicine?.name || "Medicine Item",
        batchNumber: batch.batchNumber,
        type: "expired",
        quantity: -Math.abs(batch.currentStock || 1),
        reason: "Quarantined and written off due to expiry",
      });
      setQuarantineModal(null);
      fetchAlerts();
    } catch (err) {
      alert("Quarantine action failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsQuarantining(false);
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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Expiry Management & Quarantine Radar"
          subtitle="Advance warning system for near-expiry formulations, strict disposal protocols, and supplier credit returns."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Patient Safety & Quality</span>
            </span>
          }
        />
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card title="Expired (Quarantine)" subtitle="Blocked from dispensing">
          <div className="text-2xl font-black text-rose-900">{expiredList.length}</div>
        </Card>
        <Card title="Expiring < 30 Days" subtitle="Immediate FIFO priority">
          <div className="text-2xl font-black text-amber-900">{expiring30.length}</div>
        </Card>
        <Card title="Expiring 31-60 Days" subtitle="Monitor dispensing velocity">
          <div className="text-2xl font-black text-yellow-900">{expiring60.length}</div>
        </Card>
        <Card title="Expiring 61-90 Days" subtitle="Vendor credit window">
          <div className="text-2xl font-black text-slate-900">{expiring90.length}</div>
        </Card>
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
            <p className="mt-3 text-xs font-semibold">Running expiry radar scan…</p>
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
                      <Badge status="cancelled">Expired</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-900">
                      {b.currentStock} units
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button                         variant="danger"
                        size="sm"
                        disabled={isQuarantining}
                        onClick={() => handleQuarantine(b)}
                      >
                        Quarantine & Write-Off
                      </Button>
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
                        <Badge status={isUrgent ? "urgent" : "normal"}>
                          {days} Days Left
                        </Badge>
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

      {/* Quarantine Confirmation Dialog */}
      {quarantineModal && (
        <ConfirmDialog
          isOpen={Boolean(quarantineModal)}
          onCancel={() => setQuarantineModal(null)}
          title="Quarantine & Write-Off Batch"
          message={`Quarantine and write off Batch ${quarantineModal.batchNumber} (${quarantineModal.currentStock} units)? This will remove stock from active dispensing.`}
          confirmText={isQuarantining ? "Quarantining…" : "Quarantine & Write-Off"}
          cancelText="Cancel"
          variant="danger"
          loading={isQuarantining}
          onConfirm={() => doQuarantine(quarantineModal)}
        />
      )}
    </div>
  );
}

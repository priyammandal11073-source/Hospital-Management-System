import { useState, useEffect } from "react";
import { getDiagnosticEquipment } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function DiagnosticEquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticEquipment();
      if (res.success) {
        setEquipment(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const statusColors = {
    operational: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 border border-amber-200",
    offline: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  if (loading) {
    return <PageLoader message="Loading diagnostic equipment registry…" />;
  }

  if (error) {
    return (
      <Card title="Equipment Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchEquipment}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Equipment Registry"
        subtitle="Licensed dispensary practitioners, council registration credentials, counter allocations, and active duty shifts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((eq) => (
          <Card key={eq._id || eq.name} title={eq.name} subtitle={eq.type || "Medical Equipment"} className={`border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between h-full`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[eq.status] || statusColors.available}`}>{eq.status}</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Specifications</h3>
              <p className="text-xs text-slate-600">{eq.model || "Standard Model"} • Serial: {eq.serialNumber || "N/A"}</p>
              <p className="text-xs text-slate-500 mt-0.5">Last Calibration: <span className="text-slate-700">{eq.lastCalibration || "Not recorded"}</span></p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm">Calibrate</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

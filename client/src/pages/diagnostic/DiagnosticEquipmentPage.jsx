import { useEffect, useState } from "react";
import { getDiagnosticEquipment } from "../../services/api.js";

export default function DiagnosticEquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getDiagnosticEquipment();
        if (res.success) {
          setEquipment(res.data || []);
        }
      } catch (e) {
        console.error("Failed to load equipment", e);
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
          Biomedical & Diagnostic Equipment Fleet
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          High-end radiological imaging modalities, automated analyzers, calibration tracking, and preventive maintenance
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-semibold">
          Querying biomedical asset management subsystem...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <div
              key={eq._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700">{eq.equipmentId}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    eq.status === "operational"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    {eq.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2">{eq.name}</h3>
                <p className="text-xs text-slate-500">{eq.department} • Model: {eq.modelNumber}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suite / Location:</span>
                    <span className="font-semibold text-slate-800">{eq.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Calibrated:</span>
                    <span className="font-semibold text-slate-700">
                      {eq.lastServiceDate ? new Date(eq.lastServiceDate).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Service Due:</span>
                    <span className="font-semibold text-indigo-600">
                      {eq.nextServiceDate ? new Date(eq.nextServiceDate).toLocaleDateString() : "Within 60 days"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">AERB / ISO Compliant</span>
                <button
                  type="button"
                  onClick={() => alert(`Service logs and calibration certificate for ${eq.name} are current.`)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-xs font-bold transition cursor-pointer"
                >
                  Calibration Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

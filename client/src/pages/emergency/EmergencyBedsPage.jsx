import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getEmergencyBeds } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateEmergencyCensusHtml } from "../../utils/printTemplates.js";

export default function EmergencyBedsPage() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getEmergencyBeds();
      setBeds(r.beds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      getEmergencyBeds().then(r => setBeds(r.beds || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const availableCount = beds.filter(b => b.status === "available").length;
  const occupiedCount = beds.filter(b => b.status === "occupied").length;
  const filteredBeds = filter === "all" ? beds : beds.filter(b => b.status === filter);

  const { openPrintPreview } = usePrintModal();

  const handlePrintBedBoard = () => {
    openPrintPreview({
      title: "Emergency Bed Board & Capacity Report",
      htmlContent: generateEmergencyCensusHtml({
        stats: { availableBeds: availableCount, occupied: occupiedCount },
        beds,
      }),
      refNumber: `BED-${Date.now().toString().slice(-6)}`,
    });
  };

  if (loading && beds.length === 0) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading Emergency Bed Board...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">Emergency Bed Board</h1>
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">Trauma & Resuscitation Bays</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status of emergency beds, ventilators, and oxygen bays</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold">Queue</Link>
          <Link to="/emergency/dashboard" className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold">Dashboard</Link>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold">Refresh</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
        >
          All Bays ({beds.length})
        </button>
        <button
          onClick={() => setFilter("available")}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filter === "available" ? "bg-emerald-600 text-white border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
        >
          Available ({availableCount})
        </button>
        <button
          onClick={() => setFilter("occupied")}
          className={`px-3 py-1.5 rounded-full font-bold border transition ${filter === "occupied" ? "bg-rose-600 text-white border-rose-700" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"}`}
        >
          Occupied ({occupiedCount})
        </button>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredBeds.map(b => {
          const isAvail = b.status === "available";
          return (
            <div
              key={b._id || b.bedNumber}
              className={`rounded-2xl p-4 border transition shadow-xs flex flex-col justify-between ${isAvail ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50/50 border-rose-200"}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-base">{b.bedNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isAvail ? "bg-emerald-600 text-white border-emerald-700" : "bg-rose-600 text-white border-rose-700"}`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">{b.ward} • {b.floor || "Ground Floor"}</div>

                {b.currentAdmission?.patient ? (
                  <div className="mt-3 p-2.5 bg-white rounded-xl border border-rose-100 text-xs space-y-1">
                    <div className="font-bold text-slate-900 truncate">{b.currentAdmission.patient.name}</div>
                    <div className="text-[11px] text-slate-500">{b.currentAdmission.patient.age}y • {b.currentAdmission.patient.gender || ""}</div>
                    {b.currentAdmission.admissionReason && (
                      <div className="text-[11px] text-slate-600 truncate mt-1">Reason: {b.currentAdmission.admissionReason}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 bg-white/60 rounded-xl border border-dashed border-emerald-300 text-xs text-emerald-700 font-semibold text-center">
                    Ready for Emergency Intake
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  {b.features?.hasOxygen && <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">O₂</span>}
                  {b.features?.hasVentilator && <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[10px]">Vent</span>}
                  <span>₹{b.dailyRate}/day</span>
                </div>
                {isAvail && (
                  <Link to="/emergency/queue" className="text-emerald-700 font-bold hover:underline text-[11px]">
                    Assign Patient →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-4">
          <span>Total ER Bays: <b className="text-slate-900">{beds.length}</b></span>
          <span>Available: <b className="text-emerald-600">{availableCount}</b></span>
          <span>Occupied: <b className="text-rose-600">{occupiedCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrintBedBoard} className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-1.5 text-xs font-semibold transition">🖨 Print Bed Board</button>
        </div>
      </div>
    </div>
  );
}

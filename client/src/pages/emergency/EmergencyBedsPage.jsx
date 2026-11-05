import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getEmergencyBeds } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateEmergencyCensusHtml } from "../../utils/printTemplates.js";
import { PageHeader } from "../../components/ui/index.js";

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
      getEmergencyBeds().then((r) => setBeds(r.beds || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const availableCount = beds.filter((b) => b.status === "available").length;
  const occupiedCount = beds.filter((b) => b.status === "occupied").length;
  const filteredBeds = filter === "all" ? beds : beds.filter((b) => b.status === filter);

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
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white/70 rounded-2xl liquid-glass-card" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white/70 rounded-2xl liquid-glass-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-white/70 rounded-2xl liquid-glass-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <Link to="/emergency/dashboard" className="hover:underline">Emergency Command</Link>
            <span>/</span>
            <span>Bed Census</span>
          </div>
        }
        title="Emergency Bed Board & Trauma Bays"
        subtitle="Real-time capacity tracking for resuscitation bays, acute trauma beds, observation units, and ventilator reserves."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            {availableCount} Bays Ready
          </span>
        }
        actions={
          <>
            <Link
              to="/emergency/queue"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Patient Queue
            </Link>
            <Link
              to="/emergency/dashboard"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Command Center
            </Link>
            <button
              type="button"
              onClick={handlePrintBedBoard}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>🖨 Print Bed Board</span>
            </button>
            <button
              type="button"
              onClick={load}
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Refresh bays"
            >
              ↻ Refresh
            </button>
          </>
        }
      />

      {/* 3 Capacity Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl liquid-glass-card p-5 shadow-2xs flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Emergency Bays</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{beds.length}</p>
          <span className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100/80">Trauma center & observation</span>
        </div>
        <div className="rounded-2xl liquid-glass-card p-5 shadow-2xs flex flex-col justify-between bg-emerald-50/20">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Available for Immediate Intake</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 tracking-tight tabular-nums">{availableCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium mt-2 pt-2 border-t border-emerald-100/80">Cleaned & disinfected</span>
        </div>
        <div className="rounded-2xl liquid-glass-card p-5 shadow-2xs flex flex-col justify-between bg-rose-50/20">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Currently Occupied</p>
          <p className="mt-1 text-3xl font-bold text-rose-600 tracking-tight tabular-nums">{occupiedCount}</p>
          <span className="text-[10px] text-rose-600 font-medium mt-2 pt-2 border-t border-rose-100/80">Active care & observation</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 ${
            filter === "all"
              ? "bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-950/10"
              : "liquid-glass-pill text-slate-700 border border-slate-200/80 hover:bg-slate-100/80"
          }`}
        >
          All Bays ({beds.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("available")}
          className={`rounded-xl px-4 py-1.5 text-xs font-bold border transition shadow-2xs cursor-pointer active:scale-95 ${
            filter === "available"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
              : "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80"
          }`}
        >
          Available ({availableCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("occupied")}
          className={`rounded-xl px-4 py-1.5 text-xs font-bold border transition shadow-2xs cursor-pointer active:scale-95 ${
            filter === "occupied"
              ? "bg-rose-700 text-white border-rose-700 shadow-sm"
              : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80"
          }`}
        >
          Occupied ({occupiedCount})
        </button>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBeds.map((b) => {
          const isAvail = b.status === "available";
          return (
            <div
              key={b._id || b.bedNumber}
              className={`rounded-2xl p-5 border transition shadow-2xs flex flex-col justify-between hover:shadow-md ${
                isAvail
                  ? "liquid-glass-card border-emerald-200/80 bg-emerald-50/20"
                  : "liquid-glass-card border-rose-200/80 bg-rose-50/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-lg tracking-tight">{b.bedNumber}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isAvail ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  {b.ward || "Trauma Center"} • {b.floor || "Ground Floor"}
                </div>

                {b.currentAdmission?.patient ? (
                  <div className="mt-3.5 p-3 rounded-xl bg-white/90 border border-rose-200/80 text-xs space-y-1 shadow-2xs">
                    <div className="font-bold text-slate-900 truncate">👤 {b.currentAdmission.patient.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {b.currentAdmission.patient.age}y • {b.currentAdmission.patient.gender || "—"}
                    </div>
                    {b.currentAdmission.admissionReason && (
                      <div className="text-[11px] text-slate-600 truncate mt-1 pt-1 border-t border-rose-100">
                        Reason: {b.currentAdmission.admissionReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-50/50 border border-dashed border-emerald-300 text-xs text-emerald-800 font-semibold text-center">
                    ✓ Ready for Patient Intake
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  {b.features?.hasOxygen && (
                    <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">O₂</span>
                  )}
                  {b.features?.hasVentilator && (
                    <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded text-[10px]">Vent</span>
                  )}
                  <span className="font-mono text-slate-600">₹{b.dailyRate || 0}/day</span>
                </div>
                {isAvail && (
                  <Link
                    to="/emergency/queue"
                    className="text-teal-800 font-bold hover:underline text-[11px] inline-flex items-center gap-0.5"
                  >
                    <span>Assign Patient</span>
                    <span>→</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer Card */}
      <div className="rounded-2xl liquid-glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-5 text-slate-600">
          <span>Total Trauma Bays: <b className="text-slate-900">{beds.length}</b></span>
          <span>Ready for Care: <b className="text-emerald-700">{availableCount}</b></span>
          <span>In Care: <b className="text-rose-600">{occupiedCount}</b></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintBedBoard}
            className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-4 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition cursor-pointer"
          >
            🖨 Print Bed Census Board
          </button>
        </div>
      </div>
    </div>
  );
}

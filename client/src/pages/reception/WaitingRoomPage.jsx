import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getWaitingRoomQueue,
  updateWaitingRoomStatus,
  getDoctors,
} from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateQueueTokenSlipHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function WaitingRoomPage() {
  const { openPrintPreview } = usePrintModal();
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTokenModal, setActiveTokenModal] = useState(null);
  const [callingId, setCallingId] = useState(null);

  const handlePrintSlip = (token) => {
    if (!token) return;
    const html = generateQueueTokenSlipHtml(token);
    openPrintPreview({
      title: `OPD Token #${token.tokenNumber || token.token || "Slip"}`,
      htmlContent: html,
      refNumber: `TKN-${token.tokenNumber || "SLIP"}`,
    });
  };

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedDoctor !== "all") params.doctorId = selectedDoctor;

      const [qData, dData] = await Promise.all([
        getWaitingRoomQueue(params),
        doctors.length === 0 ? getDoctors() : Promise.resolve({ doctors }),
      ]);
      setQueue(qData.queue || []);
      if (doctors.length === 0) setDoctors(dData.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load waiting room queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Live refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [selectedDoctor]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateWaitingRoomStatus(appointmentId, newStatus);
      fetchQueue();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCallPatient = (item) => {
    setCallingId(item._id);
    // Beep / notification feedback
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 587.33; // D5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}

    setTimeout(() => {
      setCallingId(null);
      handleStatusChange(item._id, "waiting");
    }, 1200);
  };

  // Metrics
  const inHallCount = queue.filter((q) => ["checked_in", "waiting"].includes(q.status)).length;
  const inConsultationCount = queue.filter((q) => q.status === "in_consultation").length;
  const delayedCount = queue.filter((q) => q.isDelayed && ["checked_in", "waiting"].includes(q.status)).length;
  const completedTodayCount = queue.filter((q) => q.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Live OPD Queue</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Waiting Room & Token Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time patient tracking, wait-time counters, doctor call alerts, and digital token slips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <span>🔄</span>
            <span>Refresh Queue</span>
          </button>
          <Link
            to="/appointments"
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition"
          >
            <span>➕</span>
            <span>Walk-in Check-In</span>
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-700">Waiting in Hall</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{inHallCount}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting consultation</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700">In Consultation</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{inConsultationCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Inside doctor cabins</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-700">Wait Duration &gt; 30m</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{delayedCount}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Priority expedited attention</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-blue-700">Consultations Done</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{completedTodayCount}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Discharged from clinic</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Filter by Doctor:</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Specialists & Clinics</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {formatDoctorName(doc.name)} ({doc.department || doc.specialization})
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400">
          Auto-refreshes every 30s • Sorted by arrival time
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        {isLoading ? (
          <div className="py-20 text-center text-sm font-medium text-slate-400 animate-pulse">
            Loading real-time waiting hall queue...
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🛋️</span>
            <p className="mt-2 text-sm font-bold text-slate-700">Waiting hall is currently clear</p>
            <p className="text-xs text-slate-400 mt-1">Check in arriving patients from OPD scheduling or Walk-in desk.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Token #</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor & Department</th>
                  <th className="py-3.5 px-4">Slot</th>
                  <th className="py-3.5 px-4">Wait Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="inline-block rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-black text-amber-900 shadow-xs">
                        {item.tokenNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm">{item.patient?.name || "Patient"}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.patient?.age}y • {item.patient?.gender} • {item.patient?.contactNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{formatDoctorName(item.doctor?.name)}</div>
                      <div className="text-[11px] text-slate-500">{item.doctor?.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {item.appointmentTime}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                          item.isDelayed
                            ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        ⏱️ {item.waitingMinutes} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === "in_consultation"
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 animate-pulse"
                            : item.status === "waiting"
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                            : item.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "no_show"
                            ? "bg-slate-100 text-slate-600 line-through"
                            : "bg-cyan-100 text-cyan-800"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Call Patient Button */}
                        <button
                          onClick={() => handleCallPatient(item)}
                          disabled={callingId === item._id}
                          className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-bold transition shadow-xs disabled:opacity-50"
                          title="Broadcast audio chime and call patient"
                        >
                          {callingId === item._id ? "Calling..." : "📢 Call"}
                        </button>

                        {/* In consultation toggle */}
                        {item.status !== "in_consultation" && item.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(item._id, "in_consultation")}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition"
                            title="Send patient into consultation room"
                          >
                            🚪 In Cabin
                          </button>
                        )}

                        {/* Done toggle */}
                        {item.status === "in_consultation" && (
                          <button
                            onClick={() => handleStatusChange(item._id, "completed")}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-bold transition"
                            title="Mark consultation completed"
                          >
                            ✓ Done
                          </button>
                        )}

                        {/* Print Token Slip */}
                        <button
                          onClick={() => setActiveTokenModal({ ...item, checkedInAt: item.checkedInAt || new Date().toISOString() })}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-1 text-xs font-semibold transition"
                          title="Print OPD Token Slip"
                        >
                          🖨️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable OPD Token Slip Modal */}
      {activeTokenModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 clinical-print-sheet printable-card print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <h3 className="text-base font-black text-slate-800">NIVORA CARE HOSPITAL</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Care • Trust • Healing</p>
              <p className="text-xs text-slate-500 mt-1">OPD Consultation Token Pass</p>
            </div>

            <div className="my-6 text-center">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Token Number</div>
              <div className="mt-1 text-4xl font-black font-mono tracking-tight text-amber-600">
                {activeTokenModal.tokenNumber}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">
                Position in Queue: <span className="font-bold text-slate-800">#{activeTokenModal.queueNumber}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-dashed border-slate-200 py-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-slate-800">{activeTokenModal.patient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-bold text-slate-800">{formatDoctorName(activeTokenModal.doctor?.name)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-bold text-slate-800">{activeTokenModal.doctor?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot:</span>
                <span className="font-bold text-slate-800">{activeTokenModal.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued At:</span>
                <span className="font-medium text-slate-700">
                  {new Date(activeTokenModal.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <p className="mt-4 text-center text-[10px] text-slate-400 leading-tight">
              Please proceed to OPD Waiting Hall Zone B. Listen for your token number on the central display speakers.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2 print:hidden">
              <button
                onClick={() => setActiveTokenModal(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintSlip(activeTokenModal)}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

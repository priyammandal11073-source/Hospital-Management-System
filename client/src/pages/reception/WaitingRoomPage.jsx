import { useState, useEffect } from "react";
import {
  getWaitingRoomQueue,
  updateWaitingRoomStatus,
  getDoctors,
} from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateQueueTokenSlipHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { SkeletonTable, ActionDropdown } from "../../components/ui/index.js";
import { toast } from "../../utils/toast.js";

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
      toast.success(`Queue status updated to ${newStatus.replace("_", " ")}.`);
      fetchQueue();
    } catch (err) {
      toast.error("Failed to update status: " + (err.response?.data?.message || err.message));
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
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting in Hall</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{inHallCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting consultation</p>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">In Consultation</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900 tabular-nums">{inConsultationCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Inside doctor cabins</p>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Wait Duration &gt; 30m</p>
          <p className="mt-1 text-2xl font-bold text-rose-900 tabular-nums">{delayedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Priority expedited attention</p>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultations Done</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{completedTodayCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Discharged from clinic</p>
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
          <div className="p-4">
            <SkeletonTable rows={5} cols={7} />
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🛋️</span>
            <p className="mt-2 text-sm font-bold text-slate-700">Waiting hall is currently clear</p>
            <p className="text-xs text-slate-400 mt-1">Check in arriving patients from OPD scheduling or Walk-in desk.</p>
          </div>
        ) : (
          <>
            {/* Mobile Queue Card View (< md) */}
            <div className="md:hidden space-y-3 p-3">
              {queue.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-block rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-black text-amber-900 font-mono shadow-xs flex-shrink-0">
                        {item.tokenNumber}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">
                          {item.patient?.name || "Patient"}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.patient?.age}y • {item.patient?.gender} • {item.patient?.contactNumber || "No phone"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Doctor & Dept</span>
                      <span className="font-semibold text-slate-800 text-xs block truncate">
                        {formatDoctorName(item.doctor?.name)}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{item.doctor?.department || "OPD"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Slot & Wait Time</span>
                      <span className="font-medium text-slate-800 block text-xs">{item.appointmentTime}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold mt-0.5 ${
                          item.isDelayed
                            ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                            : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        ⏱️ {item.waitingMinutes}m wait
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                    {item.status === "in_consultation" ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item._id, "completed")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                        title="Mark consultation completed"
                      >
                        <span>✓ Done</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCallPatient(item)}
                        disabled={callingId === item._id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                        title="Broadcast audio chime and call patient"
                      >
                        <span>📢 {callingId === item._id ? "Calling..." : "Call Patient"}</span>
                      </button>
                    )}

                    <ActionDropdown
                      align="right"
                      items={[
                        ...(item.status !== "in_consultation" && item.status !== "completed"
                          ? [
                              {
                                label: "Send to Cabin (In Consultation)",
                                icon: "🚪",
                                onClick: () => handleStatusChange(item._id, "in_consultation"),
                              },
                            ]
                          : []),
                        ...(item.status === "in_consultation"
                          ? [
                              {
                                label: "Call Again (Broadcast Chime)",
                                icon: "📢",
                                onClick: () => handleCallPatient(item),
                              },
                            ]
                          : []),
                        ...(item.status !== "completed"
                          ? [
                              {
                                label: "Mark Consultation Done",
                                icon: "✓",
                                onClick: () => handleStatusChange(item._id, "completed"),
                              },
                            ]
                          : []),
                        { divider: true },
                        {
                          label: "Print Token Slip",
                          icon: "🖨️",
                          onClick: () =>
                            setActiveTokenModal({
                              ...item,
                              checkedInAt: item.checkedInAt || new Date().toISOString(),
                            }),
                        },
                        {
                          label: "Quick Print Preview",
                          icon: "📄",
                          onClick: () => handlePrintSlip(item),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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
                  {queue.map((item, idx) => (
                    <tr
                      key={item._id}
                      style={{ animationDelay: `${Math.min(idx * 25, 200)}ms` }}
                      className="animate-row-stagger hover:bg-slate-50/70 transition-colors"
                    >
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
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "in_consultation" ? (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item._id, "completed")}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                              title="Mark consultation completed"
                            >
                              <span>✓ Done</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(item)}
                              disabled={callingId === item._id}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                              title="Broadcast audio chime and call patient"
                            >
                              <span>📢 {callingId === item._id ? "Calling..." : "Call"}</span>
                            </button>
                          )}

                          <ActionDropdown
                            align="right"
                            items={[
                              ...(item.status !== "in_consultation" && item.status !== "completed"
                                ? [
                                    {
                                      label: "Send to Cabin (In Consultation)",
                                      icon: "🚪",
                                      onClick: () => handleStatusChange(item._id, "in_consultation"),
                                    },
                                  ]
                                : []),
                              ...(item.status === "in_consultation"
                                ? [
                                    {
                                      label: "Call Again (Broadcast Chime)",
                                      icon: "📢",
                                      onClick: () => handleCallPatient(item),
                                    },
                                  ]
                                : []),
                              ...(item.status !== "completed"
                                ? [
                                    {
                                      label: "Mark Consultation Done",
                                      icon: "✓",
                                      onClick: () => handleStatusChange(item._id, "completed"),
                                    },
                                  ]
                                : []),
                              { divider: true },
                              {
                                label: "Print Token Slip",
                                icon: "🖨️",
                                onClick: () =>
                                  setActiveTokenModal({
                                    ...item,
                                    checkedInAt: item.checkedInAt || new Date().toISOString(),
                                  }),
                              },
                              {
                                label: "Quick Print Preview",
                                icon: "📄",
                                onClick: () => handlePrintSlip(item),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

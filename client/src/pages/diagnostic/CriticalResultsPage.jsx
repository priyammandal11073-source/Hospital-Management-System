import { useEffect, useState } from "react";
import {
  getCriticalDiagnosticResults,
  acknowledgeCriticalDiagnosticResult,
} from "../../services/api.js";

export default function CriticalResultsPage() {
  const [criticalResults, setCriticalResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [callModalOrder, setCallModalOrder] = useState(null);
  const [callerName, setCallerName] = useState("Central Diagnostic Call Desk");
  const [callNotes, setCallNotes] = useState("");

  const fetchCriticalResults = async () => {
    try {
      setLoading(true);
      const res = await getCriticalDiagnosticResults();
      if (res.success) {
        setCriticalResults(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load critical alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriticalResults();
  }, []);

  const handleAcknowledge = async (orderId, doctorNotes = "") => {
    try {
      setAcknowledgingId(orderId);
      await acknowledgeCriticalDiagnosticResult(orderId, {
        doctorNotes: doctorNotes || "Emergency notification received and clinical intervention initiated.",
      });
      alert("Critical finding successfully acknowledged and closed!");
      setCallModalOrder(null);
      fetchCriticalResults();
    } catch (err) {
      alert("Failed to acknowledge: " + (err.response?.data?.message || err.message));
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-rose-300 bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-2xl shadow-lg animate-pulse">
            🚨
          </span>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 border border-rose-400/30 px-3 py-1 text-xs font-semibold text-rose-300 mb-1">
              <span>Immediate Patient Safety Action Protocol • NABH Standard COP.6</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Emergency Critical Results Notification Desk
            </h1>
            <p className="text-xs sm:text-sm text-rose-200 mt-1 max-w-2xl">
              Laboratory tests with life-threatening biological parameters or emergency radiologic diagnoses requiring mandatory clinician notification within 30 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Findings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Connecting to Critical Findings Alert Network...
          </div>
        ) : criticalResults.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
            <span className="text-3xl block mb-2">🛡️</span>
            <h3 className="text-sm font-bold text-emerald-900">Zero Pending Critical Alerts</h3>
            <p className="text-xs text-emerald-700 mt-1">
              All life-threatening findings have been communicated, acknowledged, and addressed by clinical teams.
            </p>
          </div>
        ) : (
          criticalResults.map((item) => {
            const isAcknowledged = item.criticalDetails?.acknowledged;
            return (
              <div
                key={item._id}
                className={`rounded-2xl border p-5 transition shadow-sm ${
                  isAcknowledged
                    ? "border-slate-200 bg-white opacity-85"
                    : "border-rose-300 bg-gradient-to-r from-rose-50/80 via-white to-white ring-1 ring-rose-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800">{item.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                        CRITICAL ALERT
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Detected: {new Date(item.criticalDetails?.flaggedAt || item.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{item.testName}</h3>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-950 font-medium">
                      <span className="font-bold text-rose-800 block mb-0.5">Critical Finding Note:</span>
                      <p>{item.criticalDetails?.criticalFindings || "Severely abnormal biological parameter requiring immediate review."}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                      <span><strong>Patient:</strong> {item.patientName}</span>
                      <span><strong>Referring Doctor:</strong> {item.doctorName || "Emergency Physician"}</span>
                      <span><strong>Department:</strong> {item.department}</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {isAcknowledged ? (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-right">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          ✓ Acknowledged
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          At {new Date(item.criticalDetails.acknowledgedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setCallModalOrder(item)}
                          className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-sm"
                        >
                          📞 Log Emergency Call
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(item._id)}
                          disabled={acknowledgingId === item._id}
                          className="w-full sm:w-auto rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md shadow-rose-600/25"
                        >
                          {acknowledgingId === item._id ? "Processing..." : "Mark Acknowledged ✓"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= EMERGENCY CALL LOG MODAL ================= */}
      {callModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Log Doctor Phone Notification</h3>
              <button
                type="button"
                onClick={() => setCallModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 mb-4 text-xs">
              <p className="font-bold text-rose-900">{callModalOrder.testName} (Order: {callModalOrder.orderNumber})</p>
              <p className="text-slate-600 mt-0.5">Patient: {callModalOrder.patientName}</p>
              <p className="text-slate-600">Doctor to Notify: <strong>{callModalOrder.doctorName || "Attending Consultant"}</strong></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Caller Name / Designation</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Call Communication Notes & Read-Back</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with Dr. Sharma at 14:15. Critical Hb value of 6.2 g/dL communicated and read back verified."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCallModalOrder(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAcknowledge(callModalOrder._id, callNotes)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-sm"
              >
                Save Log & Close Alert →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

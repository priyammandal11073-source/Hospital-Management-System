import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiagnosticDashboard, acknowledgeCriticalDiagnosticResult } from "../../services/api.js";

export default function DiagnosticDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || "Failed to load diagnostic telemetry");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch diagnostic data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [refreshKey]);

  const handleAcknowledge = async (orderId) => {
    try {
      setAcknowledgingId(orderId);
      await acknowledgeCriticalDiagnosticResult(orderId, {
        doctorNotes: `Acknowledged via Diagnostic Command Center by ${user?.name || "Staff"}`
      });
      fetchDashboard();
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      alert("Failed to acknowledge: " + (err.response?.data?.message || err.message));
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-sm font-semibold text-slate-700">Connecting to Diagnostic Services Telemetry...</p>
        <p className="text-xs text-slate-400 mt-1">Syncing Pathology, Radiology, and External Object Storage</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-base font-bold text-rose-900">Diagnostic Gateway Notice</h3>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentRequests = data?.recentRequests || [];
  const recentReports = data?.recentReports || [];
  const equipment = data?.equipment || [];
  const storageStats = data?.storageStats || {};
  const categoryDistribution = data?.categoryDistribution || [];

  return (
    <div className="space-y-6">
      {/* ================= HERO HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-3">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Nivora Care Diagnostic Services Portal • NABH ISO 15189 Compliant
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Central Pathology & Radiology Command Hub
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Real-time synchronization of laboratory investigations, phlebotomy workflows, imaging modalities (X-Ray, CT, MRI, USG), specialist digital signatures, and secure medical object storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              to="/diagnostic/requests"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <span>+ New Test Order</span>
            </Link>
            <Link
              to="/diagnostic/samples"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <span>🧪 Phlebotomy Queue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= CRITICAL RESULTS ALERT BANNER ================= */}
      {kpis.criticalResults > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100/50 to-white p-4 sm:p-5 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md animate-bounce flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <span>CRITICAL PATHOLOGY / RADIOLOGY ALERTS DETECTED</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                    {kpis.criticalResults} Action Required
                  </span>
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Investigations contain critical laboratory parameters or urgent radiological findings requiring immediate clinician notification under NABH safety protocols.
                </p>
              </div>
            </div>
            <Link
              to="/diagnostic/critical-alerts"
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition flex-shrink-0"
            >
              Open Alert Desk →
            </Link>
          </div>
        </div>
      )}

      {/* ================= TELEMETRY KPI TILES ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 to-slate-700" />
          <div className="flex items-start justify-between gap-2 text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">Total Orders</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-sm">📋</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{kpis.totalTestsToday || 0}</p>
          <div className="pt-2 border-t border-slate-100 text-[10px] font-medium text-slate-400 min-h-[26px] flex items-center">
            Total active orders
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-start justify-between gap-2 text-amber-700">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">Pending Reqs</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-sm animate-pulse">⏳</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-amber-900 tracking-tight">{kpis.pendingRequests || 0}</p>
          <div className="pt-2 border-t border-amber-100/80 text-[10px] font-semibold text-amber-700 min-h-[26px] flex items-center">
            Awaiting acceptance
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
          <div className="flex items-start justify-between gap-2 text-teal-700">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">Samples Due</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-sm">🧪</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-teal-900 tracking-tight">{kpis.samplesPending || 0}</p>
          <div className="pt-2 border-t border-teal-100/80 text-[10px] font-semibold text-teal-700 min-h-[26px] flex items-center">
            Phlebotomy collection
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="flex items-start justify-between gap-2 text-blue-700">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">In Progress</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 text-sm">⚙️</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">{kpis.testsInProgress || 0}</p>
          <div className="pt-2 border-t border-blue-100/80 text-[10px] font-semibold text-blue-700 min-h-[26px] flex items-center">
            Testing & Scans
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600" />
          <div className="flex items-start justify-between gap-2 text-purple-700">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">Review Due</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-800 text-sm">✍️</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-purple-900 tracking-tight">{kpis.reportsPending || 0}</p>
          <div className="pt-2 border-t border-purple-100/80 text-[10px] font-semibold text-purple-700 min-h-[26px] flex items-center">
            Specialist sign-off
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full min-h-[148px]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-start justify-between gap-2 text-emerald-700">
            <span className="text-xs font-semibold uppercase tracking-wider line-clamp-1">Completed</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-sm">✓</span>
          </div>
          <p className="my-1 text-2xl sm:text-3xl font-extrabold text-emerald-900 tracking-tight">{kpis.reportsCompleted || 0}</p>
          <div className="pt-2 border-t border-emerald-100/80 text-[10px] font-semibold text-emerald-700 min-h-[26px] flex items-center">
            Finalized reports
          </div>
        </div>
      </div>

      {/* ================= WORKLOAD & MODALITY BREAKDOWN + OBJECT STORAGE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modality & Category Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Investigation Categories & Workload</h3>
              <p className="text-xs text-slate-400">Order distribution across Pathology & Radiology sub-specialties</p>
            </div>
            <Link to="/diagnostic/catalog" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              View All 369+ Tests →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 truncate">{cat._id || "Routine"}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {cat.count} Orders
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (cat.count / (kpis.totalTestsToday || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Workflow Navigation Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              to="/diagnostic/requests"
              className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 p-2.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition"
            >
              <span className="text-base">📥</span>
              <span>Test Requests</span>
            </Link>
            <Link
              to="/diagnostic/lab-workstation"
              className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 p-2.5 text-xs font-semibold text-slate-700 hover:text-teal-700 transition"
            >
              <span className="text-base">🔬</span>
              <span>Lab Workbench</span>
            </Link>
            <Link
              to="/diagnostic/radiology"
              className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 p-2.5 text-xs font-semibold text-slate-700 hover:text-sky-700 transition"
            >
              <span className="text-base">🩻</span>
              <span>Imaging Viewer</span>
            </Link>
            <Link
              to="/diagnostic/specialist-review"
              className="flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 p-2.5 text-xs font-semibold text-slate-700 hover:text-purple-700 transition"
            >
              <span className="text-base">✍️</span>
              <span>Sign-Off Desk</span>
            </Link>
          </div>
        </div>

        {/* External Object Storage & Modality Telemetry */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Object Storage Subsystem</h3>
            <p className="text-xs text-slate-400">External isolated medical binary storage</p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Storage Architecture:</span>
              <span className="font-bold text-indigo-700 uppercase">External Object Storage</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">MongoDB Payload:</span>
              <span className="font-bold text-emerald-700">Metadata & URLs Only (0 bytes raw binary)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Medical Scans Hosted:</span>
              <span className="font-bold text-slate-800">{storageStats.totalFiles || 0} files</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Security / Access:</span>
              <span className="font-bold text-indigo-600">HMAC Token & RBAC Protected</span>
            </div>
          </div>

          {/* Biomedical Equipment Status Pill */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Equipment Fleet Health</span>
              <Link to="/diagnostic/equipment" className="text-[11px] font-bold text-indigo-600 hover:underline">
                Manage ({equipment.length}) →
              </Link>
            </div>
            <div className="space-y-1.5">
              {equipment.slice(0, 3).map((eq, i) => (
                <div key={i} className="flex items-center justify-between text-xs rounded-lg border border-slate-100 p-2">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">{eq.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ● Operational
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT WORK ORDERS & FINALIZED REPORTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Active Test Orders</h3>
              <p className="text-xs text-slate-400">Real-time status progression from requested to completed</p>
            </div>
            <Link to="/diagnostic/requests" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              View Worklist →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No orders currently active.</p>
            ) : (
              recentRequests.slice(0, 5).map((order) => (
                <div key={order._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.priority === "STAT"
                          ? "bg-rose-100 text-rose-800 animate-pulse"
                          : order.priority === "Urgent"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {order.priority}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{order.testName}</p>
                    <p className="text-[11px] text-slate-400">
                      {order.patientName} • {order.department} ({order.category})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      order.status === "Finalized" || order.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : order.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : order.status === "Sample Collected"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {order.status}
                    </span>
                    {order.isCritical && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(order._id)}
                        disabled={acknowledgingId === order._id}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 text-[10px] font-bold cursor-pointer"
                      >
                        {acknowledgingId === order._id ? "..." : "Ack"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finalized Reports */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Finalized Diagnostic Reports</h3>
              <p className="text-xs text-slate-400">Clinically signed reports ready for patients and doctors</p>
            </div>
            <Link to="/diagnostic/reports" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Browse Archive →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No reports finalized yet.</p>
            ) : (
              recentReports.slice(0, 5).map((rep) => (
                <div key={rep._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">{rep.reportNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Digitally Signed
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{rep.testName}</p>
                    <p className="text-[11px] text-slate-400">
                      Patient: {rep.patientName} • Signed by: {rep.digitalSignature?.signedBy || rep.specialistName || "Consultant"}
                    </p>
                  </div>

                  <Link
                    to={`/diagnostic/reports`}
                    className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 transition"
                  >
                    View Report →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

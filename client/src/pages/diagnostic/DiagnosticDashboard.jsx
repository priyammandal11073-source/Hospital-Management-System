import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDiagnosticDashboard,
  acknowledgeCriticalDiagnosticResult,
} from "../../services/api.js";
import { toast } from "../../utils/toast.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  DataTable,
  SkeletonTable,
  EmptyStateCard,
  PageLoader,
  ConfirmDialog,
} from "../../components/ui/index.js";

export default function DiagnosticDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

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
        doctorNotes: `Acknowledged via Diagnostic Command Center by ${user?.name || "Staff"}`,
      });
      toast.success("Critical result acknowledged successfully.");
      setConfirmingId(null);
      fetchDashboard();
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      toast.error("Unable to acknowledge result", {
        description: err.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setAcknowledgingId(null);
      setConfirmingId(null);
    }
  };

  if (loading) {
    return <PageLoader message="Connecting to Diagnostic Services Telemetry…" />;
  }

  if (error) {
    return (
      <Card title="Diagnostic Gateway Notice" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchDashboard}>
            Retry Connection
          </Button>
        </div>
      </Card>
    );
  }

  const kpis = data?.kpis || {};
  const recentRequests = data?.recentRequests || [];
  const recentReports = data?.recentReports || [];
  const equipment = data?.equipment || [];
  const storageStats = data?.storageStats || {};
  const categoryDistribution = data?.categoryDistribution || [];

  const kpiTiles = [
    {
      title: "Total Orders",
      subtitle: "Total active orders",
      value: kpis.totalTestsToday || 0,
      icon: "📋",
      colorClass: "bg-slate-100 text-slate-700 border border-slate-200",
      iconClass: "bg-slate-100 text-slate-600",
      borderColor: "border-slate-200/80",
    },
    {
      title: "Pending Reqs",
      subtitle: "Awaiting acceptance",
      value: kpis.pendingRequests || 0,
      icon: "⏳",
      colorClass: "bg-amber-50/40 text-amber-700 border border-amber-200/80",
      iconClass: "bg-amber-100 text-amber-800",
      borderColor: "border-amber-200/80",
    },
    {
      title: "Samples Due",
      subtitle: "Phlebotomy collection",
      value: kpis.samplesPending || 0,
      icon: "🧪",
      colorClass: "bg-teal-50/40 text-teal-700 border border-teal-200/80",
      iconClass: "bg-teal-100 text-teal-800",
      borderColor: "border-teal-200/80",
    },
    {
      title: "In Progress",
      subtitle: "Testing & Scans",
      value: kpis.testsInProgress || 0,
      icon: "⚙️",
      colorClass: "bg-blue-50/40 text-blue-700 border border-blue-200/80",
      iconClass: "bg-blue-100 text-blue-800",
      borderColor: "border-blue-200/80",
    },
    {
      title: "Review Due",
      subtitle: "Specialist sign-off",
      value: kpis.reportsPending || 0,
      icon: "✍️",
      colorClass: "bg-purple-50/40 text-purple-700 border border-purple-200/80",
      iconClass: "bg-purple-100 text-purple-800",
      borderColor: "border-purple-200/80",
    },
    {
      title: "Completed",
      subtitle: "Finalized reports",
      value: kpis.reportsCompleted || 0,
      icon: "✓",
      colorClass: "bg-emerald-50/40 text-emerald-700 border border-emerald-200/80",
      iconClass: "bg-emerald-100 text-emerald-800",
      borderColor: "border-emerald-200/80",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Pathology & Radiology Command Hub"
        subtitle="Real-time synchronization of laboratory investigations, phlebotomy workflows, imaging modalities (X-Ray, CT, MRI, USG), specialist digital signatures, and secure medical object storage."
        breadcrumbs={
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 border border-teal-300/25 px-3 py-1 text-xs font-semibold text-teal-200">
              <span className="h-2 w-2 rounded-full bg-teal-300"></span>
              Nivora Care Diagnostic Services Portal • NABH ISO 15189 Compliant
            </span>
          </span>
        }
        actions={[
          <Link to="/diagnostic/requests" key="new-order">
            <Button size="sm" leftIcon={<span>+</span>}>
              New Test Order
            </Button>
          </Link>,
          <Link to="/diagnostic/samples" key="phlebotomy">
            <Button variant="outline" size="sm" leftIcon={<span>🧪</span>}>
              Phlebotomy Queue
            </Button>
          </Link>,
        ]}
      />

      {kpis.criticalResults > 0 && (
        <Card title="CRITICAL PATHOLOGY / RADIOLOGY ALERTS DETECTED" subtitle="Investigations contain critical laboratory parameters or urgent radiological findings requiring immediate clinician notification under NABH safety protocols." className="border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100/50 to-white">
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-slate-100 shadow-md animate-bounce flex-shrink-0">
                ⚠️
              </span>
              <div>
                <p className="text-xs text-rose-700 mt-0.5">
                  {kpis.criticalResults} investigation(s) require immediate clinician notification.
                </p>
              </div>
            </div>
            <Link to="/diagnostic/critical-alerts" className="inline-flex min-h-11 items-center rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-bold text-slate-100 shadow-sm transition-[transform,background-color] duration-150 ease-out hover:bg-rose-800 active:scale-[0.98] flex-shrink-0">
              Open Alert Desk →
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpiTiles.map((tile, idx) => (
          <Card key={idx} title={tile.title} subtitle={tile.subtitle} className={tile.borderColor}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wider line-clamp-1 ${tile.colorClass === "bg-slate-100 text-slate-700" ? "text-slate-500" : "text-slate-500"}`}>
                  {tile.title}
                </p>
                <p className={`my-1 text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight ${tile.colorClass.replace("bg-slate-100 text-slate-700 border border-slate-200/80", "text-slate-800").replace("bg-amber-50/40 text-amber-700 border border-amber-200/80", "text-amber-900").replace("bg-teal-50/40 text-teal-700 border border-teal-200/80", "text-teal-900").replace("bg-blue-50/40 text-blue-700 border border-blue-200/80", "text-blue-900").replace("bg-purple-50/40 text-purple-700 border border-purple-200/80", "text-purple-900").replace("bg-emerald-50/40 text-emerald-700 border border-emerald-200/80", "text-emerald-900")}`}>
                  {tile.value}
                </p>
              </div>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tile.iconClass}`}>
                {tile.icon}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[10px] font-medium text-slate-400 min-h-[26px] flex items-center">
              {tile.subtitle}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Investigation Categories & Workload" subtitle="Order distribution across Pathology & Radiology sub-specialties">
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categoryDistribution.map((cat, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 truncate">{cat._id || "Routine"}</span>
                    <Badge status="normal">{cat.count} Orders</Badge>
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
          </Card>

          <Card title="Object Storage Subsystem" subtitle="External isolated medical binary storage">
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-2">
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

            <div className="mt-4">
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
                    <Badge status="active">Operational</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card title="Recent Test Orders" subtitle="Real-time status progression from requested to completed">
          <div className="mt-4 overflow-x-auto">
            <DataTable
              columns={[
                { key: "orderNumber", header: "Order #", width: 120 },
                { key: "patient", header: "Patient", width: 180 },
                { key: "testName", header: "Investigation Test", width: 200 },
                { key: "department", header: "Department", width: 140 },
                { key: "priority", header: "Priority", width: 100 },
                { key: "status", header: "Status", width: 140 },
                { key: "actions", header: "Actions", width: 100, align: "right" },
              ]}
              data={recentRequests.slice(0, 8).map((order) => ({
                orderNumber: order.orderNumber,
                patient: order.patientName || "Patient",
                testName: order.testName,
                department: order.department,
                priority: order.priority,
                status: order.status,
                actions: order._id,
              }))}
              loading={loading}
              searchable={false}
              pagination={false}
              toolbarExtra={[
                <Link key="view-all" to="/diagnostic/requests" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  View Worklist →
                </Link>,
              ]}
              onRowClick={(row) => {
                if (row.status === "In Progress" || row.status === "scheduled") {
                  // handled inline below
                }
              }}
              className="mt-4"
            />
            {recentRequests.slice(0, 8).map((order) => (
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
                    <Button                       variant="danger"
                      size="sm"
                      disabled={acknowledgingId === order._id}
                      onClick={() => {
                        setConfirmingId(order._id);
                      }}
                    >
                      Ack
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Finalized Diagnostic Reports" subtitle="Clinically signed reports ready for patients and doctors">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Report #</th>
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Signed By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.slice(0, 5).map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {rep.reportNumber || `REP-${(rep.order?.orderNumber || rep._id || "").slice(-6)}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800 truncate">{rep.testName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{rep.patientName}</div>
                      <div className="text-[11px] text-slate-400">
                        {rep.digitalSignature?.signedBy || rep.specialistName || "Consultant"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-800">
                      Digitally Signed
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link to={`/diagnostic/reports`} className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 transition">
                        View Report →
                      </Link>
                    </td>
                  </tr>
                ))}
                {recentReports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs">
                      No reports finalized yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {confirmingId && (
        <ConfirmDialog
          isOpen={Boolean(confirmingId)}
          onCancel={() => setConfirmingId(null)}
          title="Acknowledge Critical Result"
          message="Mark this critical result as acknowledged by the attending clinician?"
          confirmText={acknowledgingId === confirmingId ? "Acknowledging…" : "Acknowledge"}
          cancelText="Cancel"
          variant="primary"
          loading={acknowledgingId === confirmingId}
          onConfirm={() => handleAcknowledge(confirmingId)}
        />
      )}
    </div>
  );
}

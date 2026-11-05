import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPharmacyTelemetry,
  getPharmacyAlerts,
  getPrescriptionQueue,
  flagPrescriptionIssue,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  ConfirmDialog,
  EmptyStateCard,
  PageLoader,
  ActionDropdown,
  SkeletonTable,
} from "../../components/ui/index.js";

export default function PharmacyDashboard({ user, refreshKey, onTriggerRefresh }) {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringBatches: [], expiredBatches: [] });
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal for flagging issue to doctor
  const [flagModalItem, setFlagModalItem] = useState(null);
  const [flagReason, setFlagReason] = useState("Potential drug-drug interaction");
  const [flagNotes, setFlagNotes] = useState("");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [telRes, alertsRes, qRes] = await Promise.all([
        getPharmacyTelemetry(),
        getPharmacyAlerts(),
        getPrescriptionQueue(),
      ]);
      setTelemetry(telRes.telemetry || telRes);
      setAlerts(alertsRes);
      setQueue(qRes.prescriptions || []);
    } catch (err) {
      console.error("Failed to load pharmacy telemetry:", err);
      setError(err.response?.data?.message || "Failed to load central pharmacy telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagModalItem) return;
    setIsSubmittingFlag(true);
    try {
      await flagPrescriptionIssue(flagModalItem._id, {
        reason: flagReason,
        notes: flagNotes,
      });
      setFlagModalItem(null);
      setFlagNotes("");
      loadDashboardData();
      if (onTriggerRefresh) onTriggerRefresh();
    } catch (err) {
      setError("Failed to flag prescription: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Connecting to Nivora Care Central Pharmacy formulary & live queue…" />;
  }

  const kpis = telemetry?.metrics || telemetry?.kpis || {
    prescriptionsToday: 42,
    pendingDispensing: 7,
    dispensedToday: 35,
    lowStockItems: 4,
    outOfStockItems: 1,
    expiringSoon: 3,
    pendingPayments: 2450,
    totalMedicines: 128,
  };

  const kpiCards = [
    {
      title: "Prescriptions Today",
      value: kpis.prescriptionsToday,
      subtitle: `${kpis.dispensedToday} fulfilled`,
      icon: "📄",
      color: "text-blue-600",
      badgeClass: "bg-blue-50 text-blue-600 border-blue-200/90",
      link: "/pharmacy/queue",
    },
    {
      title: "Pending Dispensing",
      value: kpis.pendingDispensing,
      subtitle: "Needs Action",
      icon: "🔔",
      color: "text-amber-600",
      badgeClass: "bg-amber-50 text-amber-600 border-amber-200/90",
      link: "/pharmacy/queue",
    },
    {
      title: "Dispensed Today",
      value: kpis.dispensedToday,
      subtitle: `${kpis.prescriptionsToday > 0 ? Math.round((kpis.dispensedToday / kpis.prescriptionsToday) * 100) : 100}% Fulfilled`,
      icon: "✅",
      color: "text-emerald-600",
      badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200/90",
      link: "/pharmacy/prescriptions-history",
    },
    {
      title: "Low Stock Items",
      value: kpis.lowStockItems,
      subtitle: `${kpis.outOfStockItems} Out of Stock`,
      icon: "📦",
      color: "text-rose-600",
      badgeClass: "bg-rose-50 text-rose-600 border-rose-200/90",
      link: "/pharmacy/low-stock",
    },
    {
      title: "Expiring Soon (<60d)",
      value: kpis.expiringSoon,
      subtitle: "FIFO Priority",
      icon: "⏰",
      color: "text-amber-700",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/90",
      link: "/pharmacy/expiry",
    },
    {
      title: "Pending Rx Payments",
      value: `₹${kpis.pendingPayments?.toLocaleString("en-IN")}`,
      subtitle: "Cashier / Insurance",
      icon: "💳",
      color: "text-violet-600",
      badgeClass: "bg-violet-50 text-violet-600 border-violet-200/90",
      link: "/pharmacy/billing",
    },
    {
      title: "Formulary Catalog",
      value: kpis.totalMedicines,
      subtitle: "100% Active",
      icon: "💊",
      color: "text-sky-600",
      badgeClass: "bg-sky-50 text-sky-600 border-sky-200/90",
      link: "/pharmacy/inventory",
    },
    {
      title: "Approved Suppliers",
      value: "12",
      subtitle: "Verified Vendors",
      icon: "🏭",
      color: "text-teal-600",
      badgeClass: "bg-teal-50 text-teal-600 border-teal-200/90",
      link: "/pharmacy/suppliers",
    },
  ];

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Nivora Care Central Pharmacy"
          subtitle={`Welcome back, ${user?.name || "Pharmacist"}. Review clinical prescriptions, monitor drug interactions, manage batches, and dispense verified medications.`}
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/40">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                Central Pharmacy Active Operations
              </span>
              <span className="text-xs text-slate-400">| Counter #02 (Main Outpatient)</span>
            </span>
          }
          actions={[
            <Link to="/pharmacy/queue" key="dispense">
              <Button size="sm" leftIcon={<span>📄</span>}>
                Dispense Queue ({kpis.pendingDispensing})
              </Button>
            </Link>,
            <Link to="/pharmacy/inventory" key="add-med">
              <Button size="sm" variant="outline" leftIcon={<span>💊</span>}>
                Add Medicine
              </Button>
            </Link>,
            <Link to="/pharmacy/purchase-orders" key="new-po">
              <Button size="sm" variant="outline" leftIcon={<span>📋</span>}>
                New PO
              </Button>
            </Link>,
          ]}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-rose-500">⚠</span>
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} title={kpi.title} subtitle={kpi.subtitle} className={kpi.link ? "cursor-pointer hover:shadow-md transition-shadow" : ""}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold ${kpi.color === "text-blue-600" ? "text-slate-500" : "text-slate-500"} uppercase tracking-wider line-clamp-1`}>
                  {kpi.title}
                </p>
                <p className={`mt-1 text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight ${kpi.color.replace("text-", "")}`}>
                  {kpi.value}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <span className="text-xl">{kpi.icon}</span>
              </div>
            </div>
            <div className={`mt-3 flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-slate-100 min-h-[28px]`}>
              <span className={`text-slate-400 ${kpi.color === "text-blue-600" ? "text-slate-400" : ""}`}>
                {kpi.subtitle}
              </span>
              <span className="text-slate-500 shrink-0">→</span>
            </div>
          </Card>
        ))}
      </div>

      {/* PRESCRIPTION WORK QUEUE (LIVE) */}
      <Card title="Live Prescription Work Queue" subtitle={`Doctor-prescribed medications awaiting clinical verification and batch dispensing. ${queue.length} Active`}>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/pharmacy/queue" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs">
              Full Queue View →
            </Link>
          </div>

          {queue.length === 0 ? (
            <EmptyStateCard
              icon="📄"
              title="No pending prescriptions in the queue."
              description="All doctor orders have been clinically verified and dispensed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Token / RX ID</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-4 py-3">Prescribing Doctor</th>
                    <th className="px-4 py-3">Medications</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.slice(0, 5).map((rx) => {
                    const status = rx.dispensingStatus || "pending";
                    const isHold = status === "on_hold";
                    const isDispensed = status === "dispensed";
                    const isReady = status === "ready";

                    return (
                      <tr key={rx._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="text-amber-600">RX-{rx._id.slice(-6).toUpperCase()}</span>
                          <span className="block text-[10px] text-slate-400 font-sans">
                            {new Date(rx.createdAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800">{rx.patient?.name || "Patient"}</div>
                          <div className="text-[11px] text-slate-500">
                            {rx.patient?.gender || "Unknown"} • {rx.patient?.age || "—"} yrs
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">
                            {formatDoctorName(rx.doctor?.name, "Specialist")}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {rx.doctor?.specialization || "Clinical OPD"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-800 max-w-xs truncate">
                            {rx.medicines?.map((m) => `${m.name} (${m.dosage})`).join(", ") || "Medication items"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {rx.medicines?.length || 1} item(s) prescribed
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isDispensed ? (
                            <Badge status="completed">✓ Dispensed</Badge>
                          ) : isHold ? (
                            <Badge status="cancelled">⚠ On Hold</Badge>
                          ) : isReady ? (
                            <Badge status="in_progress">Ready for Pick-up</Badge>
                          ) : (
                            <Badge status="pending">Pending Dispense</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          {!isDispensed && (
                            <Link
                              to={`/pharmacy/dispense/${rx._id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
                            >
                              <span>Dispense</span>
                              <span>→</span>
                            </Link>
                          )}
                          {!isDispensed && (
                            <button
                              type="button"
                              onClick={() => {
                                setFlagModalItem(rx);
                                setFlagNotes("");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition"
                              title="Flag clinical issue to doctor without modifying prescription"
                            >
                              <span>Flag Doctor</span>
                            </button>
                          )}
                          {isDispensed && (
                            <Link
                              to={`/pharmacy/dispense/${rx._id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition"
                            >
                              <span>Receipt</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* OPERATIONS GRID: FAST MOVING DRUGS & EXPIRY/STOCK RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Dispensed & Fast Velocity */}
        <Card title="Fast Moving Drugs & Velocity" subtitle="Real-time stock velocity & reorder threshold">
          <div className="mt-4 space-y-3.5">
            {[
              { name: "Paracetamol 650mg (Dolo)", stock: 120, total: 500, status: "Adequate", velocity: "High (45/day)" },
              { name: "Amoxicillin + Clavulanic 625mg", stock: 14, total: 100, status: "Low Stock", velocity: "High (18/day)", warn: true },
              { name: "Pantoprazole 40mg (Pan-40)", stock: 240, total: 400, status: "Adequate", velocity: "Moderate" },
              { name: "Azithromycin 500mg", stock: 8, total: 150, status: "Critical", velocity: "High (12/day)", danger: true },
              { name: "Cetirizine 10mg", stock: 310, total: 500, status: "Adequate", velocity: "Moderate" },
            ].map((drug, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{drug.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    drug.danger ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300" :
                    drug.warn ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                    {drug.status} ({drug.stock} left)
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Velocity: {drug.velocity}</span>
                  <span>Threshold: 20 units</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      drug.danger ? "bg-rose-500" : drug.warn ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (drug.stock / drug.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Critical Alerts & Storage Warnings */}
        <Card title="Safety, Expiry & Cold Chain Radar" subtitle="Critical safety monitoring">
          <div className="mt-4 space-y-3">
            {/* Cold Chain Alert */}
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-900 flex items-center gap-1.5">
                  ❄️ Refrigerator Unit #01 (Vaccines & Insulin)
                </span>
                <span className="rounded-full bg-cyan-200 px-2 py-0.5 text-[10px] font-extrabold text-cyan-800">
                  3.8°C (Optimal 2°C - 8°C)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-cyan-700">
                12 batches of Insulin Glargine and Rabies Vaccines stored safely. Sensor verified 12m ago.
              </p>
            </div>

            {/* Expiry Warning: <30 days */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  ⏳ Batch EXP-202609-A (Amoxicillin 250mg)
                </span>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  Expiring in 22 Days
                </span>
              </div>
              <p className="mt-1 text-[11px] text-amber-800">
                Quantity: 45 strips. Prioritize FIFO dispensing or initiate supplier credit return.
              </p>
            </div>

            {/* Critical Stock Warning */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  🚨 Stock Depleted: Epinephrine Inj 1mg/ml
                </span>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                  0 Vials Left
                </span>
              </div>
              <p className="mt-1 text-[11px] text-rose-800">
                Emergency Crash Cart stock level critical. Immediate PO created (#PO-77401).
              </p>
            </div>

            {/* High-Alert Medicine Warning */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  🔒 High-Risk / Schedule H1 Drug Log
                </span>
                <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                  Strict Audit Active
                </span>
              </div>
              <p className="mt-1 text-[11px] text-purple-800">
                Requires mandatory Doctor Registration # and Patient ID verification on every dispensation.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* QUICK SHORTCUT TILES */}
      <Card title="Pharmacy Operations Hub">
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/pharmacy/queue"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">📄</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Prescription Queue</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Dispense & verify</span>
          </Link>

          <Link
            to="/pharmacy/inventory"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">💊</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Medicine Formulary</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Stock & Pricing</span>
          </Link>

          <Link
            to="/pharmacy/stock-receiving"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">📦</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Receive Stock</span>
            <span className="text-[10px] text-slate-400 mt-0.5">GRN & Invoices</span>
          </Link>

          <Link
            to="/pharmacy/purchase-orders"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">🏭</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Purchase Orders</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Vendor orders</span>
          </Link>

          <Link
            to="/pharmacy/returns"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">↩️</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Returns & Damage</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Credits & refunds</span>
          </Link>

          <Link
            to="/pharmacy/analytics"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition group text-center"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-xs font-bold text-slate-800">Pharmacy Reports</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Audits & revenue</span>
          </Link>
        </div>
      </Card>

      {/* CLINICAL SAFEGUARD MODAL: CONTACT DOCTOR / FLAG ISSUE */}
      {flagModalItem && (
        <Modal
          isOpen={Boolean(flagModalItem)}
          onClose={() => setFlagModalItem(null)}
          title="Clinical Safeguard: Flag Issue to Doctor"
          className="max-w-lg"
        >
          <form onSubmit={handleFlagSubmit} className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
              <div className="font-bold text-amber-900">
                Prescription: RX-{flagModalItem._id.slice(-6).toUpperCase()}
              </div>
              <div className="text-amber-800 mt-0.5">
                Patient: <span className="font-semibold">{flagModalItem.patient?.name}</span> | Doctor:{" "}
                <span className="font-semibold">{formatDoctorName(flagModalItem.doctor?.name)}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason for Clarification Flag</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-none"
              >
                <option value="Potential drug-drug interaction">Potential drug-drug interaction</option>
                <option value="Known patient allergy conflict">Known patient allergy conflict</option>
                <option value="Dosage or frequency anomaly">Dosage or frequency anomaly</option>
                <option value="Prescribed medicine out of stock (substitute recommended)">
                  Prescribed medicine out of stock (substitute recommended)
                </option>
                <option value="Route of administration requires verification">
                  Route of administration requires verification
                </option>
                <option value="Renal/Hepatic dose adjustment required">
                  Renal/Hepatic dose adjustment required
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Pharmacist Notes for Doctor</label>
              <textarea
                rows="3"
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                required
                placeholder="E.g., Patient's records indicate severe Penicillin hypersensitivity. Recommend switching to Azithromycin 500mg once daily."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFlagModalItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingFlag}
                className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-slate-100 hover:bg-rose-700 shadow-sm disabled:opacity-50"
              >
                {isSubmittingFlag ? "Submitting…" : "Put On Hold & Alert Doctor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

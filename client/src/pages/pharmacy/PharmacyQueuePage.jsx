import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPrescriptionQueue,
  flagPrescriptionIssue,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { ActionDropdown } from "../../components/ui/index.js";
import { toast } from "../../utils/toast.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
  Modal,
} from "../../components/ui/index.js";

export default function PharmacyQueuePage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Flag Modal state
  const [flagModalItem, setFlagModalItem] = useState(null);
  const [flagReason, setFlagReason] = useState("Potential drug-drug interaction");
  const [flagNotes, setFlagNotes] = useState("");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPrescriptionQueue();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Error fetching queue:", err);
      setError(err.response?.data?.message || "Failed to load prescription queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagModalItem) return;
    setIsSubmittingFlag(true);
    try {
      await flagPrescriptionIssue(flagModalItem._id, {
        reason: flagReason,
        notes: flagNotes,
      });
      toast.success("Prescription placed on hold", {
        description: `RX-${flagModalItem._id.slice(-6).toUpperCase()} flagged to ${formatDoctorName(flagModalItem.doctor?.name, "Physician in charge")}.`,
      });
      setFlagModalItem(null);
      setFlagNotes("");
      fetchQueue();
    } catch (err) {
      toast.error("Unable to flag prescription", {
        description: err.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const status = rx.dispensingStatus || "pending";
    if (activeFilter === "pending" && status !== "pending" && status !== "processing") return false;
    if (activeFilter === "on_hold" && status !== "on_hold") return false;
    if (activeFilter === "ready" && status !== "ready") return false;
    if (activeFilter === "dispensed" && status !== "dispensed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patientMatch = rx.patient?.name?.toLowerCase().includes(q);
      const doctorMatch = rx.doctor?.name?.toLowerCase().includes(q);
      const idMatch = rx._id?.toLowerCase().includes(q);
      const medMatch = rx.medicines?.some((m) => m.name?.toLowerCase().includes(q));
      return patientMatch || doctorMatch || idMatch || medMatch;
    }
    return true;
  });

  const pendingCount = prescriptions.filter((p) => (p.dispensingStatus || "pending") === "pending").length;
  const onHoldCount = prescriptions.filter((p) => p.dispensingStatus === "on_hold").length;
  const dispensedCount = prescriptions.filter((p) => p.dispensingStatus === "dispensed").length;

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Prescription Verification & Dispensing Queue"
          subtitle="Real-time outpatient and inpatient doctor orders awaiting pharmacist verification, allergy checking, and batch deduction."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Prescription Operations</span>
            </span>
          }
          actions={[
          <Button             key="refresh"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={fetchQueue}
            leftIcon={<span>🔄</span>}
          >
            Refresh
          </Button>,
          <Link
            to="/pharmacy/dispense"
            key="direct-dispense"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
          >
            <span>💊</span>
            <span>Direct Dispense</span>
          </Link>,
        ]}
      />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchQueue} className="font-bold">Retry</button>
        </div>
      )}

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card title="Queue Total" subtitle="Orders today">
          <div className="text-2xl font-black text-slate-900">{prescriptions.length}</div>
        </Card>
        <Card title="Pending Review" subtitle="Awaiting batch assign">
          <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
        </Card>
        <Card title="On Hold / Flagged" subtitle="Physician clarification">
          <div className="text-2xl font-black text-rose-900">{onHoldCount}</div>
        </Card>
        <Card title="Fulfilled Today" subtitle="Completed & billed">
          <div className="text-2xl font-black text-emerald-900">{dispensedCount}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${prescriptions.length})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "on_hold", label: `On Hold (${onHoldCount})` },
            { id: "dispensed", label: `Dispensed (${dispensedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                activeFilter === f.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Input
            type="text"
            placeholder="Search patient, doctor, drug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            id="queue-search"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="liquid-glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Updating prescription work queue…</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <EmptyStateCard
            icon="📋"
            title="No prescriptions match your criteria"
            description="Try switching tabs or adjusting search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Prescription #</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Prescribed By</th>
                  <th className="px-4 py-3">Medications</th>
                  <th className="px-4 py-3">Clinical Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((rx) => {
                  const status = rx.dispensingStatus || "pending";
                  const isDispensed = status === "dispensed";
                  const isOnHold = status === "on_hold";
                  const hasAllergies = rx.patient?.allergies && rx.patient.allergies.length > 0;

                  return (
                    <tr key={rx._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">RX-{rx._id.slice(-6).toUpperCase()}</span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {new Date(rx.createdAt || Date.now()).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span>{rx.patient?.name || "Patient"}</span>
                          {hasAllergies && (
                            <span
                              className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-700 border border-rose-200"
                              title={`Allergy Alert: ${Array.isArray(rx.patient.allergies) ? rx.patient.allergies.join(", ") : rx.patient.allergies}`}
                            >
                              ALLERGY ALERT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rx.patient?.gender || "—"} • {rx.patient?.age || "—"} yrs {rx.patient?.bloodGroup ? `• ${rx.patient.bloodGroup}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {formatDoctorName(rx.doctor?.name, "Specialist")}
                        </div>
                        <div className="text-[11px] text-slate-500">{rx.doctor?.specialization || "Clinical OPD"}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 max-w-sm truncate">
                          {rx.medicines?.map((m) => `${m.name} (${m.dosage})`).join(", ") || "No medication details"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rx.medicines?.length || 0} item(s) • Instructions: {rx.medicines?.[0]?.instructions || "Standard"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isDispensed ? (
                          <Badge status="completed">✓ Dispensed</Badge>
                        ) : isOnHold ? (
                          <Badge status="cancelled">⚠ On Hold</Badge>
                        ) : (
                          <Badge status="pending">Pending Dispense</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/pharmacy/dispense/${rx._id}`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-[transform,background-color] duration-150 ease-out hover:bg-teal-700 active:scale-[0.98]"
                          >
                            <span>{isDispensed ? "View Receipt" : "Verify & Dispense"}</span>
                            <span className="text-slate-400">→</span>
                          </Link>

                          {!isDispensed && (
                            <ActionDropdown
                              align="right"
                              items={[
                                {
                                  label: "Flag Issue to Doctor",
                                  icon: "🚩",
                                  danger: true,
                                  onClick: () => {
                                    setFlagModalItem(rx);
                                    setFlagNotes("");
                                  },
                                },
                              ]}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flag Issue to Doctor Modal */}
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
              <label className="block font-bold text-slate-700 mb-1">Clarification Category</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-teal-600 focus:outline-none"
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
              <label className="block font-bold text-slate-700 mb-1">Clinical Pharmacist Clarification Note</label>
              <textarea
                rows="3"
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                required
                placeholder="Explain the clinical concern, suspected interaction or stock substitute proposed…"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-600 focus:outline-none"
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
                className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50"
              >
                {isSubmittingFlag ? "Submitting…" : "Put On Hold & Send Alert"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

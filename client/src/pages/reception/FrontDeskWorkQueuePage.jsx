import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getFrontDeskWorkQueue,
  confirmOnlineBooking,
  updatePaymentStatus,
  createWalkInDiagnostic,
  getDiagnosticTests,
  getPatients,
  checkInPatient,
} from "../../services/api.js";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import { toast } from "../../utils/toast.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
  Modal,
  ConfirmDialog,
} from "../../components/ui/index.js";

export default function FrontDeskWorkQueuePage() {
  const [workQueue, setWorkQueue] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [settlingBilling, setSettlingBilling] = useState(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getFrontDeskWorkQueue(activeCategory);
      setWorkQueue(data.queue || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load front desk queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeCategory]);

  const handleConfirm = async (appointmentId) => {
    setActioningId(appointmentId);
    try {
      await confirmOnlineBooking(appointmentId, { action: "confirm" });
      toast.success("Online booking confirmed successfully.");
      fetchQueue();
    } catch (err) {
      toast.error("Failed to confirm: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleQuickCash = async (billingId) => {
    setActioningId(billingId);
    try {
      await updatePaymentStatus(billingId, { paymentStatus: "paid", paymentMethod: "cash" });
      toast.success("Payment recorded as cash.");
      fetchQueue();
    } catch (err) {
      toast.error("Payment settlement failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleCheckInDiagnostic = async (appointmentId, diagnosticOrderId) => {
    const targetId = appointmentId || diagnosticOrderId;
    setActioningId(targetId);
    try {
      const resData = await checkInPatient(targetId);
      toast.success(`Patient Checked In! Token: ${resData?.tokenNumber || "DX-Ready"}. Status updated to 'Patient Ready'.`);
      fetchQueue();
    } catch (err) {
      toast.error("Check-in failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [diagnosticTestsList, setDiagnosticTestsList] = useState([]);
  const [walkInForm, setWalkInForm] = useState({
    patientId: "",
    testId: "",
    timeSlot: "10:30 AM",
    priority: "Routine",
    assignedRoom: "Central Diagnostics",
    notes: "",
  });
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  const openWalkInModal = async () => {
    setShowWalkInModal(true);
    try {
      const [pRes, tRes] = await Promise.all([
        getPatients("", 1, 50),
        getDiagnosticTests({ limit: 100 }),
      ]);
      const patients = pRes.patients || pRes.data || [];
      const tests = tRes.data || [];
      setPatientsList(patients);
      setDiagnosticTestsList(tests);
      if (patients.length > 0 && !walkInForm.patientId) {
        setWalkInForm((prev) => ({ ...prev, patientId: patients[0]._id }));
      }
      if (tests.length > 0 && !walkInForm.testId) {
        setWalkInForm((prev) => ({ ...prev, testId: tests[0]._id }));
      }
    } catch (e) {
      console.error("Failed to load walkin modal data", e);
    }
  };

  const submitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInForm.patientId || !walkInForm.testId) {
      toast.warning("Please select both a patient and a diagnostic test.");
      return;
    }
    setWalkInSubmitting(true);
    try {
      const res = await createWalkInDiagnostic(walkInForm);
      toast.success(`Walk-in Diagnostic Registered & Checked In! Token: ${res.tokenNumber || "DX-Ready"}`);
      setShowWalkInModal(false);
      fetchQueue();
    } catch (err) {
      toast.error("Walk-in diagnostic failed: " + (err.response?.data?.message || err.message));
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const filteredQueue = workQueue.filter((item) => {
    const matchesSearch =
      item.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.task?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const priorityVariant = (priority) => {
    switch (priority) {
      case "Emergency": return "critical";
      case "Urgent": return "urgent";
      case "Normal": return "normal";
      default: return "normal";
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="Central Front Desk Work Queue"
        subtitle="Aggregated queue of all items requiring front-desk action: online booking verifications, arrival check-ins, cashier settlements, and patient inquiries."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span><span className="text-xs font-bold uppercase tracking-wider text-amber-600">Front Desk Dispatch</span></span>}
        actions={[
          <Button             size="sm"
            onClick={openWalkInModal}
            leftIcon={<span>🔬</span>}
          >
            + Walk-in Diagnostic Test
          </Button>,
          <Button             variant="outline"
            size="sm"
            onClick={fetchQueue}
            leftIcon={<span>🔄</span>}
          >
            Refresh Queue
          </Button>,
        ]}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/90 liquid-glass-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: "all", label: "All Tasks" },
              { id: "online_booking", label: "Online Bookings" },
              { id: "waiting_checkin", label: "Arrival Check-In" },
              { id: "awaiting_doctor", label: "Awaiting Doctor" },
              { id: "payment", label: "Pending Cashier" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`min-h-[44px] rounded-xl px-3.5 py-2 font-bold transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] inline-flex items-center justify-center cursor-pointer touch-target ${
                  activeCategory === tab.id
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 font-medium focus:border-teal-600 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by patient name or keyword..."
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Compiling front desk actionable queue…
          </div>
        ) : filteredQueue.length === 0 ? (
          <EmptyStateCard
            icon="✨"
            title="No tasks in this queue"
            description="All front desk tasks have been addressed!"
          />
        ) : (
          <div>
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredQueue.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.patient}</h3>
                      {item.contactNumber && (
                        <p className="text-[11px] text-slate-500">📞 {item.contactNumber}</p>
                      )}
                    </div>
                    <Badge status={priorityVariant(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>

                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {item.task}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="font-mono text-[11px]">
                      📅 {item.timeSlot || new Date(item.dateTime).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.status === "In Progress" ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`}></span>
                      {item.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {item.actionType === "confirm_booking" ? (
                      <button                         disabled={actioningId === item.originalId}
                        onClick={() => handleConfirm(item.originalId)}
                        className="w-full"
                      >
                        {actioningId === item.originalId ? "Saving…" : "Confirm Slot"}
                      </button>
                    ) : item.actionType === "collect_payment" ? (
                      <button                         disabled={actioningId === item.originalId}
                        onClick={() => handleQuickCash(item.originalId)}
                        className="w-full"
                      >
                        {actioningId === item.originalId ? "Settling…" : "Collect Cash"}
                      </button>
                    ) : item.actionType === "check_in_diagnostic" ? (
                      <button                         disabled={actioningId === item.originalId}
                        onClick={() => handleCheckInDiagnostic(item.metadata?.appointmentId, item.metadata?.diagnosticOrderId)}
                        className="w-full"
                      >
                        {actioningId === item.originalId ? "Checking In…" : "Check In (Patient Ready)"}
                      </button>
                    ) : (
                      <Link
                        to={item.actionLink || "/reception/waiting-room"}
                        className="w-full inline-flex items-center justify-center gap-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition"
                      >
                        Open Desk →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Task Details</th>
                    <th className="py-3.5 px-4">Date / Time</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div>
                          <div className="text-sm font-bold text-slate-800">{item.patient}</div>
                          {item.contactNumber && (
                            <div className="text-[11px] text-slate-400 font-normal">📞 {item.contactNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.task}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.timeSlot || new Date(item.dateTime).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={priorityVariant(item.priority)}>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.status === "In Progress" ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.actionType === "confirm_booking" ? (
                          <Button                             variant="outline"
                            size="sm"
                            disabled={actioningId === item.originalId}
                            onClick={() => handleConfirm(item.originalId)}
                          >
                            {actioningId === item.originalId ? "Saving…" : "Confirm Slot"}
                          </Button>
                        ) : item.actionType === "collect_payment" ? (
                          <Button                             variant="outline"
                            size="sm"
                            onClick={() =>
                              setSettlingBilling({
                                _id: item.originalId,
                                id: item.originalId,
                                totalAmount: item.amount || 500,
                                patient: { name: item.patient, contactNumber: item.contactNumber },
                              })
                            }
                          >
                            <span>💳</span>
                            <span>Settle Bill</span>
                          </Button>
                        ) : item.actionType === "check_in_diagnostic" ? (
                          <Button                             variant="outline"
                            size="sm"
                            disabled={actioningId === item.originalId}
                            onClick={() => handleCheckInDiagnostic(item.metadata?.appointmentId, item.metadata?.diagnosticOrderId)}
                          >
                            {actioningId === item.originalId ? "Checking In…" : "Check In (Patient Ready)"}
                          </Button>
                        ) : (
                          <Link
                            to={item.actionLink || "/reception/waiting-room"}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
                          >
                            Open Desk →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showWalkInModal && (
        <Modal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
          title="Walk-in Diagnostic Booking"
          className="max-w-lg"
        >
          <form onSubmit={submitWalkIn} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Patient</label>
              <select
                value={walkInForm.patientId}
                onChange={(e) => setWalkInForm({ ...walkInForm, patientId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
                required
              >
                <option value="">-- Choose Patient --</option>
                {patientsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.gender || "—"}, {p.age || "—"}y) - PID: {p.patientId || p.contactNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Diagnostic Investigation</label>
              <select
                value={walkInForm.testId}
                onChange={(e) => setWalkInForm({ ...walkInForm, testId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
                required
              >
                <option value="">-- Choose Diagnostic Test --</option>
                {diagnosticTestsList.map((t) => (
                  <option key={t._id} value={t._id}>
                    [{t.department} • {t.modality}] {t.testName} (₹{t.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={walkInForm.timeSlot}
                  onChange={(e) => setWalkInForm({ ...walkInForm, timeSlot: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
                >
                  <option value="Immediate / Stat">Immediate / Stat</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Priority</label>
                <select
                  value={walkInForm.priority}
                  onChange={(e) => setWalkInForm({ ...walkInForm, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Diagnostic Room</label>
              <input
                type="text"
                value={walkInForm.assignedRoom}
                onChange={(e) => setWalkInForm({ ...walkInForm, assignedRoom: e.target.value })}
                placeholder="e.g. Phlebotomy Station 2 / Ultrasound Suite 1"
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Notes & Indications</label>
              <textarea
                rows={2}
                value={walkInForm.notes}
                onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                placeholder="e.g. Walk-in self-request for routine health screening..."
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={walkInSubmitting}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                {walkInSubmitting ? "Processing…" : "Register & Mark 'Patient Ready' →"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {settlingBilling && (
        <UniversalPaymentModal
          billing={settlingBilling}
          isOpen={Boolean(settlingBilling)}
          onClose={() => setSettlingBilling(null)}
          onPaymentSuccess={() => {
            setSettlingBilling(null);
            fetchQueue();
          }}
          title="Reception Cashier Payment Settlement"
        />
      )}
    </div>
  );
}

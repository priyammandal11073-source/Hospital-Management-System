import { useState, useEffect } from "react";
import { getDeskHandovers, createDeskHandover, acknowledgeDeskHandover } from "../../services/api.js";

export default function DeskHandoverPage() {
  const [handovers, setHandovers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    shiftType: "Morning",
    deskNumber: "Desk 1 - Main Reception Counter",
    pendingAdmissionsCount: 0,
    unsettledPaymentsTotal: 0,
    waitingPatientsCount: 0,
    unconfirmedOnlineBookings: 0,
    administrativeNotes: "",
  });

  const loadHandovers = async () => {
    setIsLoading(true);
    try {
      const data = await getDeskHandovers();
      setHandovers(data.handovers || []);
    } catch (err) {
      console.error("Failed to load handovers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHandovers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createDeskHandover(form);
      setShowModal(false);
      setForm({
        shiftType: "Morning",
        deskNumber: "Desk 1 - Main Reception Counter",
        pendingAdmissionsCount: 0,
        unsettledPaymentsTotal: 0,
        waitingPatientsCount: 0,
        unconfirmedOnlineBookings: 0,
        administrativeNotes: "",
      });
      loadHandovers();
    } catch (err) {
      alert("Failed to submit handover: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeDeskHandover(id);
      loadHandovers();
    } catch (err) {
      alert("Failed to acknowledge handover: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Workforce Continuity</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Shift Handover & Desk Operations Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formal handover protocol between outgoing and incoming receptionists: pending payments, wait-list cases, and administrative notes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition self-start sm:self-auto"
        >
          <span>✍️</span>
          <span>Submit Shift Handover</span>
        </button>
      </div>

      {/* Handover Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading shift handovers...
          </div>
        ) : handovers.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-xs ring-1 ring-slate-200/80">
            <span className="text-4xl">📋</span>
            <p className="mt-2 text-sm font-bold text-slate-700">No shift handovers recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Submit your end-of-shift notes before clocking out.</p>
          </div>
        ) : (
          handovers.map((h) => (
            <div
              key={h._id}
              className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 transition hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      h.shiftType === "Morning"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : h.shiftType === "Evening"
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-purple-100 text-purple-900 border border-purple-300"
                    }`}
                  >
                    {h.shiftType} Shift
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{h.deskNumber}</h3>
                    <p className="text-xs text-slate-400">Date: {h.shiftDate} • Outgoing: {h.outgoingStaffName}</p>
                  </div>
                </div>

                <div>
                  {h.status === "Acknowledged" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-300">
                      ✓ Acknowledged by {h.incomingStaffName || "Incoming Staff"}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(h._id)}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      Acknowledge Handover
                    </button>
                  )}
                </div>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                  <span className="text-base font-black text-slate-800">{h.waitingPatientsCount}</span>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Patients Waiting</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                  <span className="text-base font-black text-slate-800">{h.unconfirmedOnlineBookings}</span>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Pending Bookings</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                  <span className="text-base font-black text-slate-800">{h.pendingAdmissionsCount}</span>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Pending Admissions</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                  <span className="text-base font-black text-amber-700">₹{h.unsettledPaymentsTotal}</span>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Unsettled Cash Total</p>
                </div>
              </div>

              {/* Administrative Notes */}
              {h.administrativeNotes && (
                <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-3.5 text-xs text-amber-950">
                  <span className="font-bold block mb-1">Administrative Shift Notes:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{h.administrativeNotes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Handover Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3">
              Record Shift Handover
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shift Type:</label>
                  <select
                    value={form.shiftType}
                    onChange={(e) => setForm({ ...form, shiftType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="Morning">Morning (08:00 - 16:00)</option>
                    <option value="Evening">Evening (16:00 - 00:00)</option>
                    <option value="Night">Night (00:00 - 08:00)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Desk Designation:</label>
                  <input
                    type="text"
                    value={form.deskNumber}
                    onChange={(e) => setForm({ ...form, deskNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Waiting Patients in Hall:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.waitingPatientsCount}
                    onChange={(e) => setForm({ ...form, waitingPatientsCount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unconfirmed Online Bookings:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unconfirmedOnlineBookings}
                    onChange={(e) => setForm({ ...form, unconfirmedOnlineBookings: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pending Bed Admissions:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.pendingAdmissionsCount}
                    onChange={(e) => setForm({ ...form, pendingAdmissionsCount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unsettled Cash Amount (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={form.unsettledPaymentsTotal}
                    onChange={(e) => setForm({ ...form, unsettledPaymentsTotal: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Important Administrative Notes:</label>
                <textarea
                  rows={3}
                  required
                  value={form.administrativeNotes}
                  onChange={(e) => setForm({ ...form, administrativeNotes: e.target.value })}
                  placeholder="e.g. Dr. Verma arriving 30 mins late; Room 204 VIP patient arriving at 17:00; cash drawer reconciled."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Save Handover"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

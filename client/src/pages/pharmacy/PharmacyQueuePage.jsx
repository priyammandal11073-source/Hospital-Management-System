import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPrescriptionQueue,
  flagPrescriptionIssue,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function PharmacyQueuePage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

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
      setLastRefreshed(new Date());
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
      alert(`Prescription RX-${flagModalItem._id.slice(-6).toUpperCase()} flagged to ${formatDoctorName(flagModalItem.doctor?.name, "Physician in charge")} and placed on Hold.`);
      setFlagModalItem(null);
      setFlagNotes("");
      fetchQueue();
    } catch (err) {
      alert("Failed to flag prescription: " + (err.response?.data?.message || err.message));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Prescription Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prescription Verification & Dispensing Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time outpatient and inpatient doctor orders awaiting pharmacist verification, allergy checking, and batch deduction.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQueue}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className={`h-4 w-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <Link
            to="/pharmacy/dispense"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Direct Dispense</span>
          </Link>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Queue Total</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{prescriptions.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Orders today</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <p className="text-xs font-bold text-amber-700 uppercase">Pending Review</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{pendingCount}</p>
          <p className="text-[10px] text-amber-700 mt-1">Awaiting batch assign</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase">On Hold / Flagged</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{onHoldCount}</p>
          <p className="text-[10px] text-rose-700 mt-1">Physician clarification</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <p className="text-xs font-bold text-emerald-700 uppercase">Fulfilled Today</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{dispensedCount}</p>
          <p className="text-[10px] text-emerald-700 mt-1">Completed & billed</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
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
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, doctor, drug..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Updating prescription work queue...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No prescriptions match your criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search query.</p>
          </div>
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Dispensed
                          </span>
                        ) : isOnHold ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                            ⚠ On Hold (Doctor Flagged)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                            Pending Dispense
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <Link
                          to={`/pharmacy/dispense/${rx._id}`}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                            isDispensed
                              ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                              : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                          }`}
                        >
                          {isDispensed ? "View Receipt" : "Verify & Dispense"}
                        </Link>
                        {!isDispensed && (
                          <button
                            type="button"
                            onClick={() => {
                              setFlagModalItem(rx);
                              setFlagNotes("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition"
                          >
                            Flag Doctor
                          </button>
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

      {/* Flag Issue to Doctor Modal */}
      {flagModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                  Clinical Safeguard: Flag Issue to Doctor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prescription RX-{flagModalItem._id.slice(-6).toUpperCase()} will be paused until doctor review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFlagModalItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

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
                <label className="block font-bold text-slate-700 mb-1">Clinical Pharmacist Clarification Note</label>
                <textarea
                  rows="3"
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  required
                  placeholder="Explain the clinical concern, suspected interaction or stock substitute proposed..."
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
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingFlag ? "Submitting..." : "Put On Hold & Send Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

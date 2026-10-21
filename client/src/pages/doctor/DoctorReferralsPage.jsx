import React, { useState, useEffect } from "react";
import {
  getSpecialistReferrals,
  createSpecialistReferral,
  updateSpecialistReferralStatus,
  getSpecialistDirectory,
  getPatients,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function DoctorReferralsPage() {
  const [activeTab, setActiveTab] = useState("inbound"); // "inbound" | "outbound"
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialists, setSpecialists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [newReferral, setNewReferral] = useState({
    patientId: "",
    specialistDoctorId: "",
    specialistDoctorName: "",
    department: "",
    reason: "",
    clinicalSummary: "",
    priority: "Routine",
  });

  useEffect(() => {
    loadReferrals();
    loadSpecialistsAndPatients();
  }, [activeTab]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSpecialistReferrals({ type: activeTab });
      if (res.success && res.data) {
        setReferrals(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialistsAndPatients = async () => {
    try {
      const [specRes, patRes] = await Promise.all([
        getSpecialistDirectory(),
        getPatients(),
      ]);
      if (specRes.success && specRes.data) setSpecialists(specRes.data);
      const patientList = patRes.patients || patRes.data || (Array.isArray(patRes) ? patRes : []);
      setPatients(patientList);
    } catch (e) {
      console.error("Failed to load specialists or patients", e);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await updateSpecialistReferralStatus(id, { status });
      if (res.success) {
        loadReferrals();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update referral status.");
    }
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!newReferral.patientId || !newReferral.specialistDoctorId || !newReferral.reason.trim()) {
      alert("Please select patient, specialist doctor, and provide referral reason.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await createSpecialistReferral(newReferral);
      if (res.success) {
        setIsModalOpen(false);
        setNewReferral({
          patientId: "",
          specialistDoctorId: "",
          specialistDoctorName: "",
          department: "",
          reason: "",
          clinicalSummary: "",
          priority: "Routine",
        });
        setActiveTab("outbound");
        loadReferrals();
      } else {
        alert(res.message || "Failed to submit referral.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting referral.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 text-xl">⇄</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Specialist Cross-Referrals
            </h1>
            <p className="text-xs text-slate-500">
              Cross-department consultations, opinions, and transfer of clinical care
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <span>+ Initiate Specialist Referral</span>
        </button>
      </div>

      {/* Inbound / Outbound Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 rounded-t-2xl">
        <button
          onClick={() => setActiveTab("inbound")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "inbound"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📥 Inbound Referrals (To Me)</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">
            {activeTab === "inbound" ? referrals.length : ""}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("outbound")}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === "outbound"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📤 Outbound Referrals (By Me)</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">
            {activeTab === "outbound" ? referrals.length : ""}
          </span>
        </button>
      </div>

      {/* Referrals Cards Grid */}
      <div className="bg-slate-50/50 rounded-b-2xl border border-t-0 border-slate-200 p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="h-8 w-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading referrals...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">{error}</div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            No {activeTab} referrals found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {referrals.map((ref) => (
              <div
                key={ref._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {ref.patient?.name || "Patient"}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ({ref.patient?.gender}, {ref.patient?.age}y) • {ref.patient?.patientId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ref.priority === "STAT" ? "bg-rose-100 text-rose-800" :
                      ref.priority === "Urgent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {ref.priority}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {ref.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-slate-700 font-semibold"><span className="text-slate-400 font-normal">Reason:</span> {ref.reason}</p>
                    {ref.clinicalSummary && (
                      <p className="text-slate-500 text-[11px] mt-1">{ref.clinicalSummary}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      {activeTab === "inbound"
                        ? `From: ${formatDoctorName(ref.referringDoctorName)}`
                        : `To: ${formatDoctorName(ref.specialistDoctorName)} (${ref.department})`}
                    </span>
                    <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {activeTab === "inbound" && ref.status === "Requested" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(ref._id, "Accepted")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      Accept Referral
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(ref._id, "Cancelled")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {activeTab === "inbound" && ref.status === "Accepted" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(ref._id, "Completed")}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition"
                    >
                      Mark Opinion Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Initiate Referral Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">Initiate Specialist Referral</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient</label>
                <select
                  required
                  value={newReferral.patientId}
                  onChange={(e) => setNewReferral({ ...newReferral, patientId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId || "PID"}) - {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Specialist</label>
                  <select
                    required
                    value={newReferral.specialistDoctorId}
                    onChange={(e) => {
                      const sel = specialists.find((s) => s._id === e.target.value);
                      setNewReferral({
                        ...newReferral,
                        specialistDoctorId: e.target.value,
                        specialistDoctorName: sel?.name || "",
                        department: sel?.department || "",
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="">-- Choose Colleague --</option>
                    {specialists.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {formatDoctorName(doc.name)} ({doc.department} - {doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newReferral.priority}
                    onChange={(e) => setNewReferral({ ...newReferral, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-xs"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT (Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Specialist Referral</label>
                <input
                  type="text"
                  required
                  value={newReferral.reason}
                  onChange={(e) => setNewReferral({ ...newReferral, reason: e.target.value })}
                  placeholder="e.g. Cardiology consult for uncontrolled arrhythmia"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Summary / Questions for Specialist</label>
                <textarea
                  rows={3}
                  value={newReferral.clinicalSummary}
                  onChange={(e) => setNewReferral({ ...newReferral, clinicalSummary: e.target.value })}
                  placeholder="e.g. Patient on Metformin 500mg. Recent ECG shows ST changes. Kindly evaluate for echo."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Submit Referral Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

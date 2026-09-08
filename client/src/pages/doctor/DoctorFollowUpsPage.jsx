import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctorFollowUps } from "../../services/api.js";
import DoctorPatientProfileModal from "../../components/doctor/DoctorPatientProfileModal.jsx";

export default function DoctorFollowUpsPage() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysFilter, setDaysFilter] = useState(14);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  useEffect(() => {
    loadFollowUps();
  }, [daysFilter]);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDoctorFollowUps(daysFilter);
      if (res.success && res.data) {
        setFollowUps(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load follow-ups.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-teal-50 text-teal-600 text-xl">📅</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Clinical Follow-ups Due</h1>
            <p className="text-xs text-slate-500">
              Track upcoming reviews, post-treatment follow-ups, and chronic disease surveillance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase text-[10px]">Window:</span>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                daysFilter === d
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Next {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="h-8 w-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading follow-ups roster...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600">{error}</div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No patient follow-ups scheduled in the next {daysFilter} days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Follow-up Due Date</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Previous Diagnosis</th>
                  <th className="px-4 py-3">Follow-up Directives</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-teal-800 whitespace-nowrap">
                      {new Date(apt.followUpDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{apt.patient?.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {apt.patient?.patientId} • {apt.patient?.gender}, {apt.patient?.age}y
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {apt.diagnosis || apt.reasonForVisit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {apt.followUpInstructions || "Routine review of clinical symptoms"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {apt.patient?.phone || "No phone"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPatientId(apt.patient?._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                        >
                          View Chart
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor/consultation/${apt._id}`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                        >
                          Consult
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPatientId && (
        <DoctorPatientProfileModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onStartConsultation={(id) => {
            // Find appointment or navigate
            navigate(`/appointments`);
          }}
        />
      )}
    </div>
  );
}

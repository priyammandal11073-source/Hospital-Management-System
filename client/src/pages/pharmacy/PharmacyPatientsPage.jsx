import { useState, useEffect } from "react";
import { getPatients, getPrescriptionQueue } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function PharmacyPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patRes, rxRes] = await Promise.all([
        getPatients(),
        getPrescriptionQueue(),
      ]);
      setPatients(patRes.patients || patRes || []);
      setPrescriptions(rxRes.prescriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.contact?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p._id?.toLowerCase().includes(q)
    );
  });

  // Find medication history for selected patient
  const patientPrescriptions = selectedPatient
    ? prescriptions.filter((rx) => rx.patient?._id === selectedPatient._id || rx.patient?.name === selectedPatient.name)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Patient Safety Profiles</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Medication Profiles & Allergies</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cross-reference past prescriptions, verify documented adverse drug reactions, and view active therapies.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by full name, phone number, or ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading patient medication profiles...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No patients found</p>
            <p className="text-xs text-slate-400 mt-1">Try another search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Known Allergies</th>
                  <th className="px-4 py-3">Medical Alerts</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const hasAllergies = p.allergies && p.allergies.length > 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {p._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {p.gender || "—"} • {p.age || "—"} yrs • Blood: {p.bloodGroup || "O+"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {p.contact || "+91 98765 43210"}
                      </td>
                      <td className="px-4 py-3.5">
                        {hasAllergies ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800 border border-rose-200">
                            ⚠️ {Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No known drug allergies (NKDA)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {p.medicalHistory || "None documented"}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(p)}
                          className="rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition shadow-2xs"
                        >
                          Drug Profile →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedPatient.name} — Medication Profile</h3>
                <p className="text-xs text-slate-500">
                  {selectedPatient.gender} • {selectedPatient.age} yrs • Blood Group: {selectedPatient.bloodGroup || "O+"}
                </p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Allergy Warning */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="font-bold text-rose-900 uppercase text-[10px]">Allergy & Adverse Drug Reaction Alert</p>
                <p className="font-bold text-rose-800 text-sm mt-0.5">
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0
                    ? (Array.isArray(selectedPatient.allergies) ? selectedPatient.allergies.join(", ") : selectedPatient.allergies)
                    : "No known drug allergies (NKDA) recorded on file."}
                </p>
              </div>

              {/* Prescriptions History for this Patient */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2">Hospital Prescription History</h4>
                {patientPrescriptions.length === 0 ? (
                  <p className="text-slate-400 italic">No previous prescription records found for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {patientPrescriptions.map((rx) => (
                      <div key={rx._id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>RX-{rx._id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(rx.createdAt || Date.now()).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                          Doctor: {formatDoctorName(rx.doctor?.name, "Specialist")} • Diagnosis: {rx.diagnosis || "OPD Consultation"}
                        </p>
                        <div className="mt-2 border-t border-slate-200/80 pt-2 space-y-1">
                          {(rx.medicines || []).map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between text-slate-800">
                              <span>• {m.name} ({m.dosage})</span>
                              <span className="text-slate-500">{m.frequency} — {m.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

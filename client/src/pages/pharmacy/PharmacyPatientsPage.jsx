import { useState, useEffect } from "react";
import { getPatients, getPrescriptionQueue } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Patient Medication Profiles & Allergies"
          subtitle="Cross-reference past prescriptions, verify documented adverse drug reactions, and view active therapies."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Patient Safety Profiles</span>
            </span>
          }
        />
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search patient by full name, phone number, or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="patient-search"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading patient medication profiles…</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyStateCard
            icon="👤"
            title="No patients found"
            description="Try another search keyword."
          />
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
                          <Badge status="urgent">⚠️ {Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies}</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">No known drug allergies (NKDA)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {p.medicalHistory || "None documented"}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
<Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPatient(p)}
                        >
                          Drug Profile →
                        </Button>
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
        <Modal
          isOpen={Boolean(selectedPatient)}
          onClose={() => setSelectedPatient(null)}
          title={`${selectedPatient.name} — Medication Profile`}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="mt-4 space-y-4 text-xs">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {selectedPatient.gender} • {selectedPatient.age} yrs • Blood Group: {selectedPatient.bloodGroup || "O+"}
              </span>
            </div>

            {/* Allergy Warning */}
            <Card title="Allergy & Adverse Drug Reaction Alert" subtitle={selectedPatient.allergies && selectedPatient.allergies.length > 0 ? Array.isArray(selectedPatient.allergies) ? selectedPatient.allergies.join(", ") : selectedPatient.allergies : "No known drug allergies (NKDA) recorded on file."} className={selectedPatient.allergies && selectedPatient.allergies.length > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}>
              <div className="mt-2">
                <span className={`font-bold text-sm ${selectedPatient.allergies && selectedPatient.allergies.length > 0 ? "text-rose-800" : "text-slate-800"}`}>
                  {selectedPatient.allergies && selectedPatient.allergies.length > 0
                    ? (Array.isArray(selectedPatient.allergies) ? selectedPatient.allergies.join(", ") : selectedPatient.allergies)
                    : "No known drug allergies (NKDA) recorded on file."}
                </span>
              </div>
            </Card>

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
              <button onClick={() => setSelectedPatient(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

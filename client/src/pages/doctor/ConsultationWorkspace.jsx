import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getConsultationBundle,
  concludeConsultation,
  getSpecialistDirectory,
} from "../../services/api.js";
import DoctorPatientProfileModal from "../../components/doctor/DoctorPatientProfileModal.jsx";

const COMMON_DIAGNOSES = [
  "Acute Upper Respiratory Infection",
  "Type 2 Diabetes Mellitus",
  "Essential Primary Hypertension",
  "Acute Gastroenteritis",
  "Viral Pyrexia / Fever",
  "Bronchial Asthma - Acute Exacerbation",
  "Urinary Tract Infection (UTI)",
  "Migraine Headache",
  "Acid Peptic Disease / GERD",
  "Lumbar Spondylosis / Low Back Pain",
  "General Weakness & Fatigue",
  "Allergic Dermatitis",
];

const COMMON_MEDICATIONS = [
  { name: "Paracetamol", strength: "650mg", route: "Oral", frequency: "1-0-1", timing: "After food", duration: "3 days" },
  { name: "Amoxicillin / Clavulanate", strength: "625mg", route: "Oral", frequency: "1-0-1", timing: "After food", duration: "5 days" },
  { name: "Pantoprazole", strength: "40mg", route: "Oral", frequency: "1-0-0", timing: "Before food", duration: "7 days" },
  { name: "Metformin", strength: "500mg", route: "Oral", frequency: "1-0-1", timing: "With food", duration: "30 days" },
  { name: "Telmisartan", strength: "40mg", route: "Oral", frequency: "1-0-0", timing: "After food", duration: "30 days" },
  { name: "Cetirizine", strength: "10mg", route: "Oral", frequency: "0-0-1", timing: "At bedtime", duration: "5 days" },
  { name: "Azithromycin", strength: "500mg", route: "Oral", frequency: "1-0-0", timing: "After food", duration: "3 days" },
  { name: "Cough Syrup (Levosalbutamol)", strength: "100ml", route: "Oral", frequency: "1-1-1", timing: "After food", duration: "5 days" },
  { name: "Ibuprofen", strength: "400mg", route: "Oral", frequency: "1-0-1", timing: "After food", duration: "3 days" },
  { name: "Ondansetron", strength: "4mg", route: "Oral", frequency: "1-0-1", timing: "Before food", duration: "3 days" },
];

const COMMON_LAB_TESTS = [
  { testName: "Complete Blood Count (CBC)", category: "Hematology" },
  { testName: "Liver Function Test (LFT)", category: "Biochemistry" },
  { testName: "Kidney Function Test (KFT)", category: "Biochemistry" },
  { testName: "Fasting Blood Sugar (FBS)", category: "Biochemistry" },
  { testName: "HbA1c Glycated Hemoglobin", category: "Biochemistry" },
  { testName: "Lipid Profile Panel", category: "Biochemistry" },
  { testName: "Urine Routine & Microscopic", category: "Urine Analysis" },
  { testName: "Chest X-Ray (PA View)", category: "Radiology / X-Ray" },
  { testName: "12-Lead ECG", category: "Cardiology / ECG" },
];

export default function ConsultationWorkspace() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  // Consultation bundle state
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [specialists, setSpecialists] = useState([]);

  // Clinical inputs
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [examination, setExamination] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

  // Prescriptions state
  const [medications, setMedications] = useState([]);
  const [newMed, setNewMed] = useState({
    name: "",
    strength: "",
    route: "Oral",
    frequency: "1-0-1",
    timing: "After food",
    duration: "5 days",
    instructions: "",
  });
  const [allergyWarning, setAllergyWarning] = useState(null);
  const [allergyAcknowledged, setAllergyAcknowledged] = useState(false);

  // Lab Orders state
  const [labOrders, setLabOrders] = useState([]);
  const [customLab, setCustomLab] = useState({ testName: "", category: "General Lab", notes: "" });

  // Referral state
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralData, setReferralData] = useState({
    specialistDoctorId: "",
    specialistDoctorName: "",
    department: "",
    reason: "",
    priority: "Routine",
    clinicalSummary: "",
  });

  useEffect(() => {
    loadBundle();
    loadSpecialists();
  }, [appointmentId]);

  const loadBundle = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getConsultationBundle(appointmentId);
      if (res.success && res.data) {
        setBundle(res.data);
        const apt = res.data.appointment;
        setChiefComplaint(apt?.reasonForVisit || "");
        if (apt?.diagnosis) setDiagnosis(apt.diagnosis);
        if (apt?.clinicalSummary) setTreatmentPlan(apt.clinicalSummary);
        if (apt?.followUpDate) {
          setFollowUpDate(new Date(apt.followUpDate).toISOString().split("T")[0]);
        }
        if (apt?.followUpInstructions) {
          setFollowUpInstructions(apt.followUpInstructions);
        }
      } else {
        setError("Unable to load consultation bundle.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load consultation details.");
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialists = async () => {
    try {
      const res = await getSpecialistDirectory();
      if (res.success && res.data) {
        setSpecialists(res.data);
      }
    } catch (e) {
      console.error("Failed to load specialists directory", e);
    }
  };

  const patient = bundle?.patient || {};
  const patientAllergies = Array.isArray(patient.allergies)
    ? patient.allergies
    : patient.allergies
    ? [patient.allergies]
    : [];

  // Check medicine against allergies
  const handleAddMedication = () => {
    if (!newMed.name.trim()) return;

    // Allergy check
    const medLower = newMed.name.toLowerCase();
    const matchedAllergy = patientAllergies.find((alg) =>
      medLower.includes(alg.toLowerCase()) || alg.toLowerCase().includes(medLower)
    );

    if (matchedAllergy && !allergyAcknowledged) {
      setAllergyWarning({
        medicine: newMed.name,
        allergy: matchedAllergy,
      });
      return;
    }

    setMedications([...medications, { ...newMed }]);
    setNewMed({
      name: "",
      strength: "",
      route: "Oral",
      frequency: "1-0-1",
      timing: "After food",
      duration: "5 days",
      instructions: "",
    });
    setAllergyWarning(null);
    setAllergyAcknowledged(false);
  };

  const handleSelectPredefinedMed = (med) => {
    setNewMed({
      ...newMed,
      name: med.name,
      strength: med.strength,
      route: med.route,
      frequency: med.frequency,
      timing: med.timing,
      duration: med.duration,
    });
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleToggleLabOrder = (lab) => {
    const exists = labOrders.some((l) => l.testName === lab.testName);
    if (exists) {
      setLabOrders(labOrders.filter((l) => l.testName !== lab.testName));
    } else {
      setLabOrders([...labOrders, { ...lab, notes: "" }]);
    }
  };

  const handleAddCustomLab = () => {
    if (!customLab.testName.trim()) return;
    setLabOrders([...labOrders, { ...customLab }]);
    setCustomLab({ testName: "", category: "General Lab", notes: "" });
  };

  const handleRemoveLabOrder = (index) => {
    setLabOrders(labOrders.filter((_, i) => i !== index));
  };

  const handleFollowUpPreset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split("T")[0]);
  };

  const handleConclude = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Please provide a clinical diagnosis or assessment.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        appointmentId,
        chiefComplaint,
        clinicalHistory,
        examination,
        assessment: diagnosis,
        diagnosis,
        differentialDiagnosis,
        treatmentPlan,
        clinicalSummary: treatmentPlan || diagnosis,
        followUpDate: followUpDate || undefined,
        followUpInstructions,
        prescription:
          medications.length > 0
            ? {
                medications,
                advice: followUpInstructions || treatmentPlan,
                allergyWarningAcknowledged: allergyAcknowledged,
                allergyWarningDetails: allergyWarning ? `Overrode allergy: ${allergyWarning.allergy}` : "",
              }
            : undefined,
        labOrders: labOrders.length > 0 ? labOrders : undefined,
        referral:
          referralEnabled && referralData.specialistDoctorId
            ? {
                ...referralData,
                clinicalSummary: referralData.clinicalSummary || diagnosis,
              }
            : undefined,
      };

      const res = await concludeConsultation(payload);
      if (res.success) {
        setSuccessModal(true);
      } else {
        alert(res.message || "Failed to conclude consultation.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting consultation record.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold">Initializing clinical consultation workspace...</p>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">{error || "Consultation record not available"}</p>
          <button
            onClick={() => navigate("/appointments")}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
          >
            Return to Consultations Queue
          </button>
        </div>
      </div>
    );
  }

  const latestVitals = bundle.latestVitals;
  const currentMeds = bundle.currentMedications || [];
  const labReports = bundle.labReports || [];
  const notesHistory = bundle.clinicalNotes || [];

  return (
    <div className="space-y-4 pb-12">
      {/* ================= 1. PATIENT CLINICAL HEADER BANNER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-extrabold text-white text-xl shadow-md">
              {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{patient.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {patient.patientId || "PID"}
                </span>
                {patient.bloodGroup && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                    {patient.bloodGroup}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {patient.gender}, {patient.age} yrs
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span>📞 {patient.phone || "No phone"}</span>
                <span>📅 Slot: <strong className="text-slate-700">{bundle.appointment?.timeSlot}</strong></span>
                <span>Reason: <strong className="text-slate-700">{bundle.appointment?.reasonForVisit}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>📋</span>
              <span>Open 360° Chart</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
            >
              Back to Queue
            </button>
          </div>
        </div>

        {/* Allergy Warning Alert */}
        {patientAllergies.length > 0 && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-rose-700 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-600"></span>
            <span>CRITICAL ALLERGY ALERT:</span>
            <span>Patient is allergic to: {patientAllergies.join(", ")}</span>
          </div>
        )}
      </div>

      {/* ================= 2. TWO-COLUMN WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ================= LEFT 2 COLUMNS: CLINICAL INPUT DESK ================= */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleConclude} className="space-y-5">
            {/* 2.1 SOAP: Subjective & Objective Examination */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Subjective & Objective Clinical Findings
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">SOAP Protocol</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chief Complaint & Presenting Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Fever for 3 days, dry cough, body ache..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinical History & Systemic Inquiry
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalHistory}
                    onChange={(e) => setClinicalHistory(e.target.value)}
                    placeholder="e.g. No history of DM/HTN. Had similar episode 6 months ago..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Examination & Clinical Observations
                </label>
                <textarea
                  rows={2}
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  placeholder="e.g. Chest: bilateral clear breath sounds. Abdomen soft, non-tender. CVS: S1 S2 normal..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 2.2 Assessment & Diagnosis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Assessment & Clinical Diagnosis
                  </h2>
                </div>
                <span className="text-[11px] text-rose-500 font-semibold">* Required</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Clinical Diagnosis
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Infection"
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 font-semibold text-slate-800 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                {/* Quick diagnoses picker */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium self-center">Quick pick:</span>
                  {COMMON_DIAGNOSES.slice(0, 6).map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                    >
                      + {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Differential Diagnosis / Secondary Considerations (Optional)
                </label>
                <input
                  type="text"
                  value={differentialDiagnosis}
                  onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                  placeholder="e.g. Rule out Influenza, Allergic Rhinitis"
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 2.3 Prescription Builder with Safety Check */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Digital Prescription (Rx Builder)
                  </h2>
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold">{medications.length} items added</span>
              </div>

              {/* Medication Input Row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      placeholder="e.g. Paracetamol"
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Strength</label>
                    <input
                      type="text"
                      value={newMed.strength}
                      onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                      placeholder="e.g. 650mg"
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Frequency</label>
                    <select
                      value={newMed.frequency}
                      onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    >
                      <option value="1-0-1">1-0-1 (Twice daily)</option>
                      <option value="1-0-0">1-0-0 (Morning)</option>
                      <option value="0-0-1">0-0-1 (Night)</option>
                      <option value="1-1-1">1-1-1 (Thrice daily)</option>
                      <option value="1-1-1-1">1-1-1-1 (Four times)</option>
                      <option value="SOS">SOS (As needed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Timing</label>
                    <select
                      value={newMed.timing}
                      onChange={(e) => setNewMed({ ...newMed, timing: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    >
                      <option value="After food">After food</option>
                      <option value="Before food">Before food</option>
                      <option value="With food">With food</option>
                      <option value="At bedtime">At bedtime</option>
                      <option value="As needed (SOS)">As needed (SOS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={newMed.duration}
                      onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                      placeholder="e.g. 5 days"
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quick Pick medicines */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Popular:</span>
                    {COMMON_MEDICATIONS.slice(0, 5).map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPredefinedMed(m)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200"
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <span>+ Add Drug</span>
                  </button>
                </div>
              </div>

              {/* Added Medications Table */}
              {medications.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Medicine</th>
                        <th className="px-3 py-2">Strength / Route</th>
                        <th className="px-3 py-2">Frequency</th>
                        <th className="px-3 py-2">Timing</th>
                        <th className="px-3 py-2">Duration</th>
                        <th className="px-2 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medications.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-800">💊 {m.name}</td>
                          <td className="px-3 py-2 text-slate-600">{m.strength || "-"} • {m.route || "Oral"}</td>
                          <td className="px-3 py-2 font-semibold text-indigo-700">{m.frequency}</td>
                          <td className="px-3 py-2 text-slate-600">{m.timing}</td>
                          <td className="px-3 py-2 text-slate-600">{m.duration}</td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2.4 Diagnostic Lab & Radiology Orders */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">4</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Diagnostic Lab & Imaging Orders
                  </h2>
                </div>
                <span className="text-[11px] text-cyan-700 font-semibold">{labOrders.length} tests ordered</span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Select Recommended Investigations:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_LAB_TESTS.map((lab, idx) => {
                    const isSelected = labOrders.some((l) => l.testName === lab.testName);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleLabOrder(lab)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-50/70 text-cyan-900 font-bold shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{lab.testName}</span>
                        <span className="text-xs">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Lab Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={customLab.testName}
                  onChange={(e) => setCustomLab({ ...customLab, testName: e.target.value })}
                  placeholder="Other diagnostic test name (e.g. Serum Ferritin, Thyroid Profile)"
                  className="flex-1 text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLab}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition shadow-xs"
                >
                  + Add Custom Test
                </button>
              </div>

              {/* Ordered Labs List */}
              {labOrders.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {labOrders.map((lab, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold flex items-center gap-2"
                    >
                      <span>🧪 {lab.testName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabOrder(i)}
                        className="text-cyan-600 hover:text-cyan-900 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2.5 Specialist Cross-Department Referral (Optional) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">5</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Cross-Department Specialist Referral
                  </h2>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={referralEnabled}
                    onChange={(e) => setReferralEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Refer to Specialist Colleague</span>
                </label>
              </div>

              {referralEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Specialist Doctor</label>
                    <select
                      value={referralData.specialistDoctorId}
                      onChange={(e) => {
                        const sel = specialists.find((s) => s._id === e.target.value);
                        setReferralData({
                          ...referralData,
                          specialistDoctorId: e.target.value,
                          specialistDoctorName: sel?.name || "",
                          department: sel?.department || "",
                        });
                      }}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    >
                      <option value="">-- Choose Specialist --</option>
                      {specialists.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          Dr. {doc.name} ({doc.department} - {doc.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={referralData.priority}
                      onChange={(e) => setReferralData({ ...referralData, priority: e.target.value })}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="STAT">STAT (Emergency)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Referral</label>
                    <input
                      type="text"
                      value={referralData.reason}
                      onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
                      placeholder="e.g. Cardiology consult for persistent arrhythmia"
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2.6 Treatment Plan, Follow-up & Discharge Instructions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">6</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Treatment Plan & Follow-up Scheduling
                  </h2>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Treatment Plan & Patient Care Advice
                </label>
                <textarea
                  rows={2}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="e.g. Adequate hydration, warm saline gargles, review with CBC report..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Follow-up Date</label>
                    <div className="flex gap-1">
                      {[
                        { label: "+3d", days: 3 },
                        { label: "+1w", days: 7 },
                        { label: "+2w", days: 14 },
                        { label: "+1m", days: 30 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleFollowUpPreset(p.days)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Follow-up Instructions
                  </label>
                  <input
                    type="text"
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder="e.g. Come fasting for blood sugar recheck"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel & Exit
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Recording Clinical Notes...</span>
                    </>
                  ) : (
                    <>
                      <span>🩺</span>
                      <span>Conclude Consultation & Generate Rx</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ================= RIGHT COLUMN: 360° PATIENT CONTEXT SIDEBAR ================= */}
        <div className="space-y-4">
          {/* Latest Recorded Vitals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                💓 Triage Vital Signs
              </h3>
              {latestVitals && (
                <span className="text-[10px] text-slate-400">
                  {new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            {latestVitals ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">BP</span>
                  <p className="font-extrabold text-slate-800">
                    {latestVitals.bloodPressureSys || "-"}/{latestVitals.bloodPressureDia || "-"}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">mmHg</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</span>
                  <p className="font-extrabold text-slate-800">
                    {latestVitals.heartRate || "-"}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">bpm</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">SpO2</span>
                  <p className={`font-extrabold ${latestVitals.spo2 && latestVitals.spo2 < 95 ? "text-rose-600" : "text-slate-800"}`}>
                    {latestVitals.spo2 ? `${latestVitals.spo2}%` : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Temp</span>
                  <p className="font-extrabold text-slate-800">
                    {latestVitals.temperature ? `${latestVitals.temperature}°F` : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No triage vitals recorded for this visit.</p>
            )}
          </div>

          {/* Current Active Medications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                💊 Current Active Medications ({currentMeds.length})
              </h3>
            </div>

            {currentMeds.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {currentMeds.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                    <p className="font-bold text-slate-800">{m.name} ({m.strength || m.dosage})</p>
                    <p className="text-slate-500">{m.frequency} • {m.timing}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No active long-term medications.</p>
            )}
          </div>

          {/* Past Notes / Consultations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                📝 Previous Consultations ({notesHistory.length})
              </h3>
            </div>

            {notesHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notesHistory.slice(0, 3).map((n) => (
                  <div key={n._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      <span>Dr. {n.doctorName}</span>
                    </div>
                    <p className="font-bold text-slate-800 mt-1">{n.diagnosis || n.chiefComplaint}</p>
                    {n.treatmentPlan && (
                      <p className="text-slate-500 text-[11px] line-clamp-1">{n.treatmentPlan}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">First documented clinical consultation.</p>
            )}
          </div>

          {/* Recent Lab Investigations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                🧪 Recent Lab Reports ({labReports.length})
              </h3>
            </div>

            {labReports.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {labReports.slice(0, 3).map((l) => (
                  <div key={l._id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{l.testName}</p>
                      <p className="text-slate-400">{new Date(l.testDate || l.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.isCritical ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous lab investigations recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* ================= ALLERGY WARNING OVERRIDE MODAL ================= */}
      {allergyWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-base font-bold text-rose-900">Drug Allergy Contraindication Alert</h3>
                <p className="text-xs text-rose-700">Patient safety warning system triggered</p>
              </div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
              <p>
                Patient has a documented allergy to: <strong className="uppercase">{allergyWarning.allergy}</strong>.
              </p>
              <p>
                You are adding: <strong className="uppercase">{allergyWarning.medicine}</strong>.
              </p>
              <p className="text-[11px] text-rose-700 font-medium">
                Please verify cross-reactivity or clinical indication before proceeding.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAllergyWarning(null);
                  setNewMed({ ...newMed, name: "" });
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel Drug
              </button>
              <button
                type="button"
                onClick={() => {
                  setAllergyAcknowledged(true);
                  setMedications([...medications, { ...newMed }]);
                  setNewMed({
                    name: "",
                    strength: "",
                    route: "Oral",
                    frequency: "1-0-1",
                    timing: "After food",
                    duration: "5 days",
                    instructions: "",
                  });
                  setAllergyWarning(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Acknowledge & Prescribe Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS CONFIRMATION MODAL ================= */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-slate-900">Consultation Concluded Successfully</h3>
            <p className="text-xs text-slate-500">
              Clinical notes, digital prescription, and diagnostic orders have been saved to the permanent patient record.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate("/prescriptions")}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                View Generated Prescription (Rx)
              </button>
              <button
                type="button"
                onClick={() => navigate("/appointments")}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
              >
                Back to Consultation Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 360° CLINICAL MODAL ================= */}
      {profileModalOpen && (
        <DoctorPatientProfileModal
          patientId={patient._id}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  );
}

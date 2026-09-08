import { useState, useEffect } from "react";
import { getPatients, getDoctors, createPrescription, updatePrescription } from "../services/api.js";

const COMMON_DIAGNOSES = [
  "Hypertension",
  "Type 2 diabetes",
  "Viral upper respiratory infection",
  "Allergic rhinitis",
  "Acute gastroenteritis",
  "Migraine / tension headache",
  "Asthma exacerbation",
  "Acid peptic disease / GERD",
];

const COMMON_MEDS = [
  { name: "Paracetamol 650mg (Dolo 650)", dosage: "1 tablet", frequency: "1-0-1", timing: "After food", duration: "3 days" },
  { name: "Pantoprazole 40mg (Pan 40)", dosage: "1 tablet", frequency: "1-0-0", timing: "Before food", duration: "7 days" },
  { name: "Telmisartan 40mg (Telma 40)", dosage: "1 tablet", frequency: "1-0-0", timing: "Before food", duration: "30 days" },
  { name: "Montelukast 10mg + Levocetirizine 5mg (Montair-LC)", dosage: "1 tablet", frequency: "0-0-1", timing: "At bedtime", duration: "10 days" },
  { name: "Azithromycin 500mg (Azithral 500)", dosage: "1 tablet", frequency: "1-0-0", timing: "After food", duration: "5 days" },
  { name: "Amoxicillin + Clavulanic Acid 625mg (Augmentin)", dosage: "1 tablet", frequency: "1-0-1", timing: "After food", duration: "5 days" },
];

const COMMON_LAB_TESTS = [
  "Complete Blood Count (CBC)",
  "Lipid Profile Fasting",
  "HbA1c & Fasting Blood Sugar",
  "12-Lead ECG",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Urine Routine & Microscopy",
  "Chest X-Ray PA View",
];

const DOSAGE_SHORTCUTS = ["1-0-1", "1-0-0", "0-1-0", "0-0-1", "1-1-1", "SOS"];

function PrescriptionForm({ prescriptionToEdit, initialAppointment, initialPatient, initialDoctor, onSuccess, onCancel }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState(
    prescriptionToEdit?.patient?._id || prescriptionToEdit?.patient || initialPatient?._id || initialAppointment?.patient?._id || ""
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    prescriptionToEdit?.doctor?._id || prescriptionToEdit?.doctor || initialDoctor?._id || initialAppointment?.doctor?._id || ""
  );
  const [appointmentId] = useState(
    prescriptionToEdit?.appointment?._id || prescriptionToEdit?.appointment || initialAppointment?._id || ""
  );

  const [diagnosis, setDiagnosis] = useState(prescriptionToEdit?.diagnosis || "");
  const [symptomsInput, setSymptomsInput] = useState(
    Array.isArray(prescriptionToEdit?.symptoms) ? prescriptionToEdit.symptoms.join(", ") : ""
  );

  const [vitals, setVitals] = useState({
    bloodPressure: prescriptionToEdit?.vitals?.bloodPressure || "",
    pulseRate: prescriptionToEdit?.vitals?.pulseRate || "",
    temperature: prescriptionToEdit?.vitals?.temperature || "",
    weight: prescriptionToEdit?.vitals?.weight || "",
    spo2: prescriptionToEdit?.vitals?.spo2 || "",
  });

  const [medications, setMedications] = useState(
    prescriptionToEdit?.medications?.length
      ? prescriptionToEdit.medications.map((m) => ({ ...m }))
      : [
          {
            name: "",
            dosage: "1 tablet",
            frequency: "1-0-1",
            timing: "After food",
            duration: "5 days",
            instructions: "",
          },
        ]
  );

  const [labTests, setLabTests] = useState(
    Array.isArray(prescriptionToEdit?.labTestsRecommended) ? [...prescriptionToEdit.labTestsRecommended] : []
  );
  const [customLabTest, setCustomLabTest] = useState("");

  const [advice, setAdvice] = useState(prescriptionToEdit?.advice || "");
  const [followUpDate, setFollowUpDate] = useState(
    prescriptionToEdit?.followUpDate ? new Date(prescriptionToEdit.followUpDate).toISOString().split("T")[0] : ""
  );

  // Load patients and doctors for selection dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingLookups(true);
        const [patientsRes, doctorsRes] = await Promise.all([
          getPatients("", 1, 100),
          getDoctors(),
        ]);
        setPatients(patientsRes.patients || []);
        const doctorList = doctorsRes.doctors || doctorsRes || [];
        setDoctors(doctorList);

        if (!selectedDoctorId && doctorList.length > 0) {
          // If logged in as doctor, find doctor matching user profile
          const userJson = localStorage.getItem("hms_user");
          if (userJson) {
            try {
              const user = JSON.parse(userJson);
              const matched = doctorList.find((d) => d.email === user.email);
              if (matched) setSelectedDoctorId(matched._id);
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Error fetching lookups:", err);
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchData();
  }, []);

  // Medication handlers
  const handleAddMedication = (preset) => {
    if (preset) {
      setMedications((prev) => [
        ...prev,
        {
          name: preset.name,
          dosage: preset.dosage || "1 tablet",
          frequency: preset.frequency || "1-0-1",
          timing: preset.timing || "After food",
          duration: preset.duration || "5 days",
          instructions: "",
        },
      ]);
    } else {
      setMedications((prev) => [
        ...prev,
        {
          name: "",
          dosage: "1 tablet",
          frequency: "1-0-1",
          timing: "After food",
          duration: "5 days",
          instructions: "",
        },
      ]);
    }
  };

  const handleUpdateMedication = (index, field, value) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveMedication = (index) => {
    if (medications.length <= 1) {
      setErrorMsg("At least one medication is required on the prescription.");
      return;
    }
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  // Lab test tag toggle
  const toggleLabTest = (testName) => {
    setLabTests((prev) =>
      prev.includes(testName) ? prev.filter((t) => t !== testName) : [...prev, testName]
    );
  };

  const handleAddCustomLabTest = (e) => {
    e.preventDefault();
    if (!customLabTest.trim()) return;
    if (!labTests.includes(customLabTest.trim())) {
      setLabTests((prev) => [...prev, customLabTest.trim()]);
    }
    setCustomLabTest("");
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPatientId) {
      setErrorMsg("Please select a patient.");
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg("Please select a consulting doctor.");
      return;
    }
    if (!diagnosis.trim()) {
      setErrorMsg("Diagnosis is required.");
      return;
    }

    const invalidMed = medications.find((m) => !m.name.trim());
    if (invalidMed) {
      setErrorMsg("Please provide a medicine name for all medication rows.");
      return;
    }

    const payload = {
      patient: selectedPatientId,
      doctor: selectedDoctorId,
      appointment: appointmentId || undefined,
      diagnosis: diagnosis.trim(),
      symptoms: symptomsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      vitals,
      medications,
      labTestsRecommended: labTests,
      advice: advice.trim(),
      followUpDate: followUpDate || undefined,
    };

    setIsSubmitting(true);
    try {
      let result;
      if (prescriptionToEdit?._id) {
        result = await updatePrescription(prescriptionToEdit._id, payload);
      } else {
        result = await createPrescription(payload);
      }
      onSuccess?.(result.prescription);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((p) => p._id === selectedPatientId) || initialPatient;
  const selectedDoctorObj = doctors.find((d) => d._id === selectedDoctorId) || initialDoctor;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-sm">
            ℞
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {prescriptionToEdit ? "Edit clinical prescription" : "Generate digital prescription (Rx)"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nivora Care Hospital • ABDM & NABH standard clinical e-prescription
            </p>
          </div>
        </div>

        {initialAppointment && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
            Linked to appointment: {initialAppointment.timeSlot || "Scheduled visit"}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 1. Patient & Doctor Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Patient *
            </label>
            {initialPatient || initialAppointment?.patient ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedPatientObj?.name || "Patient"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Age: {selectedPatientObj?.age || "—"} yrs • Gender: {selectedPatientObj?.gender || "—"}
                  {selectedPatientObj?.bloodGroup && ` • Blood: ${selectedPatientObj.bloodGroup}`}
                </p>
                {selectedPatientObj?.abhaId && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    ABHA: {selectedPatientObj.abhaId}
                  </p>
                )}
              </div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.age}y / {p.gender}) {p.abhaId ? `[ABHA: ${p.abhaId}]` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Consulting physician *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name} — {d.specialization} ({d.department})
                </option>
              ))}
            </select>
            {selectedDoctorObj && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Department: {selectedDoctorObj.department} • Ref: Dr-{selectedDoctorObj._id?.toString().slice(-6).toUpperCase()}
              </p>
            )}
          </div>
        </div>

        {/* 2. Patient Clinical Vitals */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Patient clinical vitals (recorded at triage / OPD)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Blood pressure
              </label>
              <input
                type="text"
                placeholder="120/80 mmHg"
                value={vitals.bloodPressure}
                onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Pulse rate
              </label>
              <input
                type="text"
                placeholder="72 bpm"
                value={vitals.pulseRate}
                onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Temperature
              </label>
              <input
                type="text"
                placeholder="98.6 °F"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Weight
              </label>
              <input
                type="text"
                placeholder="68 kg"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                SpO2 (Oxygen)
              </label>
              <input
                type="text"
                placeholder="98%"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Diagnosis & Symptoms */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Provisional diagnosis *
              </label>
              <span className="text-[11px] text-slate-400">Quick suggestions below</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Primary Hypertension with Mild Tachycardia"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            />
            {/* Quick diagnosis chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_DIAGNOSES.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDiagnosis(d)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/60 dark:hover:text-teal-300 transition-colors"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Symptoms reported (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Occasional dizziness, Morning headache, Palpitations"
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 4. ℞ Prescribed Medications Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">℞</span>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Prescribed medications ({medications.length}) *
              </label>
            </div>
            <button
              type="button"
              onClick={() => handleAddMedication()}
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              + Add medicine row
            </button>
          </div>

          {/* Quick preset medicines */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              1-Click popular medicines in India:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MEDS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddMedication(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors shadow-2xs font-medium"
                >
                  + {preset.name.split(" ")[0]} ({preset.frequency})
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Medication Rows */}
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    Medicine #{index + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  {/* Name */}
                  <div className="md:col-span-4">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Medicine name & strength *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Telmisartan 40mg (Telma 40)"
                      value={med.name}
                      onChange={(e) => handleUpdateMedication(index, "name", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Dosage */}
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="1 tablet"
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedication(index, "dosage", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      placeholder="1-0-1"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedication(index, "frequency", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white font-bold text-teal-600 dark:text-teal-400"
                    />
                    {/* Shortcut chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {DOSAGE_SHORTCUTS.map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => handleUpdateMedication(index, "frequency", freq)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            med.frequency === freq
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Timing
                    </label>
                    <select
                      value={med.timing}
                      onChange={(e) => handleUpdateMedication(index, "timing", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white"
                    >
                      <option value="After food">After food</option>
                      <option value="Before food">Before food</option>
                      <option value="With food">With food</option>
                      <option value="At bedtime">At bedtime</option>
                      <option value="As needed (SOS)">As needed (SOS)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  {/* Duration */}
                  <div className="md:col-span-3">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="5 days"
                      value={med.duration}
                      onChange={(e) => handleUpdateMedication(index, "duration", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="md:col-span-9">
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Special instructions (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Take with warm water at bedtime; do not crush tablet"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedication(index, "instructions", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Recommended Diagnostic & Lab Tests */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Recommended diagnostic / pathology tests
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_LAB_TESTS.map((test, idx) => {
              const isSelected = labTests.includes(test);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleLabTest(test)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-teal-600 border-teal-600 text-white font-semibold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {test}
                </button>
              );
            })}
          </div>

          {/* Add custom test */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Or add custom test name (e.g. Serum Vitamin D3)"
              value={customLabTest}
              onChange={(e) => setCustomLabTest(e.target.value)}
              className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddCustomLabTest}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300"
            >
              Add test
            </button>
          </div>
        </div>

        {/* 6. Clinical Advice & Follow-Up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Dietary & lifestyle advice
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Low sodium diet (<2g/day). Engage in 30 mins brisk walking. Avoid oily foods. Hydrate well."
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Next follow-up consultation
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Leaves follow-up date printed on the letterhead for patient scheduling.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                <span>Generating prescription...</span>
              </>
            ) : (
              <span>{prescriptionToEdit ? "Update prescription" : "Generate digital prescription"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PrescriptionForm;

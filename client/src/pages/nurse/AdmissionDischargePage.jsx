import { useState, useEffect } from "react";
import { getInpatientsWithCare, createNursingNote } from "../../services/api.js";

export default function AdmissionDischargePage() {
  const [inpatients, setInpatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [activeTab, setActiveTab] = useState("admission"); // "admission" | "discharge"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Admission checklist states
  const [admissionChecks, setAdmissionChecks] = useState({
    allergiesVerified: false,
    vitalBaselineRecorded: false,
    valuablesLogged: false,
    wristbandVerified: false,
    fallRiskAssessed: false,
    skinPressureRiskAssessed: false,
  });
  const [fallRiskLevel, setFallRiskLevel] = useState("Low Risk");
  const [bradenScore, setBradenScore] = useState("No Risk (>18)");
  const [admissionNotes, setAdmissionNotes] = useState("");

  // Discharge checklist states
  const [dischargeChecks, setDischargeChecks] = useState({
    medsReconciled: false,
    educationProvided: false,
    linesRemoved: false,
    valuablesReturned: false,
    followUpConfirmed: false,
    summaryDelivered: false,
  });
  const [dischargeNotes, setDischargeNotes] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getInpatientsWithCare();
      const list = data.inpatients || [];
      setInpatients(list);
      if (list.length > 0) {
        setSelectedPatientId(list[0].patientId);
      }
    } catch (err) {
      setErrorMessage("Failed to load admitted inpatients.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = inpatients.find((p) => p.patientId === selectedPatientId);

  const toggleAdmissionCheck = (key) => {
    setAdmissionChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDischargeCheck = (key) => {
    setDischargeChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAdmissionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const completedCount = Object.values(admissionChecks).filter(Boolean).length;
      const totalCount = Object.keys(admissionChecks).length;
      
      const summaryText = `[NURSING ADMISSION ASSESSMENT COMPLETED (${completedCount}/${totalCount})]\n` +
        `Fall Risk: ${fallRiskLevel} | Pressure Ulcer Risk: ${bradenScore}\n` +
        `Wristband: ${admissionChecks.wristbandVerified ? "Attached & Verified" : "Pending"}\n` +
        `Baseline Vitals: ${admissionChecks.vitalBaselineRecorded ? "Documented" : "Pending"}\n` +
        `Allergies: ${admissionChecks.allergiesVerified ? "Verified" : "Pending"}\n` +
        `Valuables: ${admissionChecks.valuablesLogged ? "Logged & Safekeeping" : "None"}\n` +
        (admissionNotes ? `Assessment Notes: ${admissionNotes}` : "");

      await createNursingNote({
        patient: selectedPatient.patientId,
        category: "Assessment",
        symptomsOrComplaints: "Inpatient Admission Nursing Assessment",
        nursingIntervention: summaryText,
        patientResponse: "Assessment completed smoothly; patient oriented to room and call-bell.",
        isHandoverFlagged: true,
      });

      setSuccessMessage(`Admission assessment for ${selectedPatient.patientName} saved to clinical record.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to save admission assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const completedCount = Object.values(dischargeChecks).filter(Boolean).length;
      const totalCount = Object.keys(dischargeChecks).length;

      const summaryText = `[NURSING DISCHARGE CHECKLIST COMPLETED (${completedCount}/${totalCount})]\n` +
        `Medications Reconciled: ${dischargeChecks.medsReconciled ? "Yes" : "Pending"}\n` +
        `IV Cannula/Catheters Removed: ${dischargeChecks.linesRemoved ? "Yes, site clean" : "No"}\n` +
        `Patient Education: ${dischargeChecks.educationProvided ? "Provided" : "Pending"}\n` +
        `Belongings Returned: ${dischargeChecks.valuablesReturned ? "Yes" : "Pending"}\n` +
        `Follow-up & Discharge Summary: ${dischargeChecks.summaryDelivered ? "Delivered" : "Pending"}\n` +
        (dischargeNotes ? `Discharge Notes: ${dischargeNotes}` : "");

      await createNursingNote({
        patient: selectedPatient.patientId,
        category: "Discharge",
        symptomsOrComplaints: "Nursing Discharge Checklist Sign-off",
        nursingIntervention: summaryText,
        patientResponse: "Patient and caregiver verbally confirmed understanding of home care and medication schedule.",
        isHandoverFlagged: true,
      });

      setSuccessMessage(`Discharge sign-off checklist for ${selectedPatient.patientName} saved to clinical record.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to save discharge checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  const admissionCompletion = Math.round(
    (Object.values(admissionChecks).filter(Boolean).length / Object.keys(admissionChecks).length) * 100
  );

  const dischargeCompletion = Math.round(
    (Object.values(dischargeChecks).filter(Boolean).length / Object.keys(dischargeChecks).length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">📋</span>
            Inpatient Admission & Discharge Protocols
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Clinical admission checklists, safety screening, fall/pressure risks, and formal discharge sign-offs.
          </p>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Select Admitted Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            disabled={loading || inpatients.length === 0}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {inpatients.length === 0 ? (
              <option value="">No admitted inpatients found</option>
            ) : (
              inpatients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  Bed {p.bedNumber} ({p.ward}) – {p.patientName} ({p.age}y/{p.gender})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>✅</span>
            <strong>Success:</strong> {successMessage}
          </span>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-700 font-bold">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>⚠️</span>
            <strong>Error:</strong> {errorMessage}
          </span>
          <button onClick={() => setErrorMessage("")} className="text-rose-700 font-bold">×</button>
        </div>
      )}

      {selectedPatient ? (
        <>
          {/* Patient Overview Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-xl font-bold">
                {selectedPatient.patientName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">{selectedPatient.patientName}</h2>
                  <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                    Bed {selectedPatient.bedNumber} • {selectedPatient.ward}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    {selectedPatient.gender}, {selectedPatient.age} yrs
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>Diagnosis / Reason:</strong> {selectedPatient.admissionReason || "General Medical Care"} •{" "}
                  <strong>Attending:</strong> Dr. {selectedPatient.attendingDoctor?.name || "Assigned"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="text-right">
                <div className="text-xs text-slate-400">Risk Assessment</div>
                <span
                  className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold uppercase mt-0.5 ${
                    selectedPatient.severityLevel === "Critical"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : selectedPatient.severityLevel === "High"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {selectedPatient.severityLevel} Severity
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-4">
            <button
              onClick={() => setActiveTab("admission")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "admission"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>📥</span> Nursing Admission Assessment
              <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {admissionCompletion}%
              </span>
            </button>
            <button
              onClick={() => setActiveTab("discharge")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "discharge"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>📤</span> Nursing Discharge Checklist
              <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {dischargeCompletion}%
              </span>
            </button>
          </div>

          {/* TAB 1: ADMISSION ASSESSMENT */}
          {activeTab === "admission" && (
            <form onSubmit={handleAdmissionSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Protocol Checklist Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Mandatory Safety Verification
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {Object.values(admissionChecks).filter(Boolean).length} of 6 Completed
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${admissionCompletion}%` }}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.wristbandVerified}
                        onChange={() => toggleAdmissionCheck("wristbandVerified")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">1. ID Wristband & Barcode Attached</div>
                        <div className="text-xs text-slate-500">
                          Verified with two unique patient identifiers (full name and ABHA / Hospital ID).
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.allergiesVerified}
                        onChange={() => toggleAdmissionCheck("allergiesVerified")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">2. Allergy Verification & Red Alert Band</div>
                        <div className="text-xs text-slate-500">
                          Cross-checked drug allergies (e.g. penicillin, NSAIDs), food, and latex sensitivities.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.vitalBaselineRecorded}
                        onChange={() => toggleAdmissionCheck("vitalBaselineRecorded")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">3. Baseline Vital Signs Recorded</div>
                        <div className="text-xs text-slate-500">
                          BP, pulse, oxygen saturation, temperature, respiratory rate & 0-10 pain score documented.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.valuablesLogged}
                        onChange={() => toggleAdmissionCheck("valuablesLogged")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">4. Valuables & Belongings Logged</div>
                        <div className="text-xs text-slate-500">
                          Jewelry, cash, mobile phone, and dentures safely placed in hospital locker or given to attendant.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.fallRiskAssessed}
                        onChange={() => toggleAdmissionCheck("fallRiskAssessed")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">5. Fall Risk Protocol Implemented</div>
                        <div className="text-xs text-slate-500">
                          Bed rails raised, call bell within reach, non-skid socks provided if high risk.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={admissionChecks.skinPressureRiskAssessed}
                        onChange={() => toggleAdmissionCheck("skinPressureRiskAssessed")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">6. Skin & Pressure Ulcer Evaluation</div>
                        <div className="text-xs text-slate-500">
                          Sacral/heel skin inspection, 2-hourly turning schedule initiated if immobile.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Risk Scoring & Clinical Notes Card */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>🛡️</span> Clinical Risk Screening Scales
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Morse Fall Risk Category
                      </label>
                      <select
                        value={fallRiskLevel}
                        onChange={(e) => setFallRiskLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="Low Risk">Low Risk (Score 0 - 24: Standard precautions)</option>
                        <option value="Moderate Risk">Moderate Risk (Score 25 - 50: Yellow bracelet + assist to stand)</option>
                        <option value="High Risk">High Risk (Score &gt; 50: Bed alarm + 2-person assist)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                        Braden Pressure Ulcer Risk Category
                      </label>
                      <select
                        value={bradenScore}
                        onChange={(e) => setBradenScore(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="No Risk (>18)">No Risk (Score 19 - 23: Standard care)</option>
                        <option value="Mild Risk (15-18)">Mild Risk (Score 15 - 18: Routine turning schedule)</option>
                        <option value="Moderate Risk (13-14)">Moderate Risk (Score 13 - 14: Foam mattress + repositioning)</option>
                        <option value="High Risk (<12)">High / Severe Risk (Score ≤ 12: Air mattress + barrier cream)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>📝</span> Nursing Admission Assessment Observations
                    </h3>
                    <textarea
                      rows={4}
                      value={admissionNotes}
                      onChange={(e) => setAdmissionNotes(e.target.value)}
                      placeholder="Document baseline physical findings, mobility status, mental orientation, special care requirements..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? "Signing & Saving..." : "Sign & Complete Admission Assessment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: DISCHARGE CHECKLIST */}
          {activeTab === "discharge" && (
            <form onSubmit={handleDischargeSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discharge Checklist Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Nursing Discharge Safety Checklist
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {Object.values(dischargeChecks).filter(Boolean).length} of 6 Completed
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dischargeCompletion}%` }}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.medsReconciled}
                        onChange={() => toggleDischargeCheck("medsReconciled")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">1. Discharge Medications Reconciled & Taught</div>
                        <div className="text-xs text-slate-500">
                          Explained dosages, frequency, interactions, and handed over physical prescriptions.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.linesRemoved}
                        onChange={() => toggleDischargeCheck("linesRemoved")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">2. Invasive Lines & Cannulas Removed</div>
                        <div className="text-xs text-slate-500">
                          IV catheter, surgical drains, and urinary catheter removed; dressing applied and site dry.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.educationProvided}
                        onChange={() => toggleDischargeCheck("educationProvided")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">3. Dietary & Wound Care Education Provided</div>
                        <div className="text-xs text-slate-500">
                          Diet restrictions, activity precautions, and red-flag emergency symptoms explained.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.valuablesReturned}
                        onChange={() => toggleDischargeCheck("valuablesReturned")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">4. Personal Belongings & Valuables Returned</div>
                        <div className="text-xs text-slate-500">
                          All stored items handed to patient or registered next-of-kin with counter-signature.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.followUpConfirmed}
                        onChange={() => toggleDischargeCheck("followUpConfirmed")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">5. Follow-Up Consultation Verified</div>
                        <div className="text-xs text-slate-500">
                          Date and doctor appointment scheduled and entered into patient's discharge plan.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={dischargeChecks.summaryDelivered}
                        onChange={() => toggleDischargeCheck("summaryDelivered")}
                        className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-800">6. Formal Discharge Summary Handover</div>
                        <div className="text-xs text-slate-500">
                          Physician-signed discharge summary folder and diagnostic disks/reports given to patient.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Discharge Notes & Sign-off Card */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>🩺</span> Nursing Discharge Status Summary
                    </h3>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                      <div>
                        <strong>Discharge Readiness:</strong>{" "}
                        {dischargeCompletion === 100 ? (
                          <span className="text-emerald-600 font-bold">100% - Ready for Safe Release</span>
                        ) : (
                          <span className="text-amber-600 font-bold">
                            {dischargeCompletion}% - Pending remaining safety items
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>Hospital Transit:</strong> Wheelchair escort or ambulatory discharge per clinical stability.
                      </div>
                      <div>
                        <strong>Physician Order:</strong> Formal medical clearance recorded by attending physician.
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>📝</span> Final Discharge Observations & Notes
                    </h3>
                    <textarea
                      rows={4}
                      value={dischargeNotes}
                      onChange={(e) => setDischargeNotes(e.target.value)}
                      placeholder="Note condition at departure, accompaniment by family, transportation method, mobility status at exit..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? "Signing & Finalizing..." : "Sign & Finalize Nursing Discharge"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500">No active inpatient selected. Please select or admit a patient first.</p>
        </div>
      )}
    </div>
  );
}

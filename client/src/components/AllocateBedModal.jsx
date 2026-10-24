import { useState, useEffect } from "react";
import { getPatients, getDoctors, getBeds, allocateBed } from "../services/api.js";
import { formatDoctorName } from "../utils/doctorName.js";

const ADMISSION_REASONS = [
  "Acute chest discomfort & cardiac telemetry",
  "Severe respiratory distress under oxygen therapy",
  "Post-operative inpatient recovery",
  "Observation & continuous vital monitoring",
  "Severe dehydration & intravenous hydration",
  "Uncontrolled hyperglycemia with ketosis check",
  "Acute neurological evaluation",
];

function AllocateBedModal({ bed, initialPatient, availableBeds: passedBeds, onClose, onSuccess }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableBeds, setAvailableBeds] = useState(passedBeds || []);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [selectedBedId, setSelectedBedId] = useState(bed?._id || "");
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatient?._id || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [admissionReason, setAdmissionReason] = useState("");
  const [expectedDischargeDate, setExpectedDischargeDate] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const fetchTasks = [getPatients("", 1, 100), getDoctors()];
        if (!bed && (!passedBeds || passedBeds.length === 0)) {
          fetchTasks.push(getBeds({ status: "available" }));
        }

        const results = await Promise.all(fetchTasks);
        const patientsRes = results[0];
        const doctorsRes = results[1];
        const bedsRes = results[2];

        setPatients(patientsRes.patients || []);
        const doctorList = doctorsRes.doctors || doctorsRes || [];
        setDoctors(doctorList);

        if (bedsRes?.beds) {
          setAvailableBeds(bedsRes.beds);
          if (!selectedBedId && bedsRes.beds.length > 0) {
            setSelectedBedId(bedsRes.beds[0]._id);
          }
        }

        if (doctorList.length > 0) {
          let docId = doctorList[0]._id;
          const userJson = localStorage.getItem("hms_user");
          if (userJson) {
            try {
              const user = JSON.parse(userJson);
              const matched = doctorList.find((d) => d.email === user.email);
              if (matched) docId = matched._id;
            } catch (e) {
              // ignore
            }
          }
          setSelectedDoctorId(docId);
        }
      } catch (err) {
        console.error("Error fetching lookups:", err);
      } finally {
        setLoadingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  const activeBed = bed || availableBeds.find((b) => b._id === selectedBedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const targetBedId = bed?._id || selectedBedId;
    if (!targetBedId) {
      setErrorMsg("Please select a bed to admit the patient to.");
      return;
    }
    if (!selectedPatientId) {
      setErrorMsg("Please select a patient to admit.");
      return;
    }
    if (!selectedDoctorId) {
      setErrorMsg("Please select an attending physician.");
      return;
    }
    if (!admissionReason.trim()) {
      setErrorMsg("Please provide an admission reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await allocateBed(targetBedId, {
        patient: selectedPatientId,
        attendingDoctor: selectedDoctorId,
        admissionReason: admissionReason.trim(),
        expectedDischargeDate: expectedDischargeDate || undefined,
        emergencyContact: emergencyContact.trim(),
        notes: notes.trim(),
      });
      onSuccess?.(res.bed);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to admit patient to bed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatientObj = patients.find((p) => p._id === selectedPatientId) || initialPatient;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 overflow-y-auto animate-backdrop-fade">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-pop-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {activeBed ? `Admit patient to ${activeBed.bedNumber}` : "Admit patient to bed"}
              </h2>
              <p className="text-xs text-slate-500">
                {activeBed
                  ? `${activeBed.ward} • ${activeBed.floor} • Daily rate: ₹${activeBed.dailyRate?.toLocaleString("en-IN")}/day`
                  : "Select an available bed and assign attending physician"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Bed Picker if not pre-provided */}
          {!bed && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Select Available Bed *
              </label>
              {availableBeds.length === 0 ? (
                <p className="p-3 text-xs font-bold text-rose-800 bg-rose-50 rounded-xl border border-rose-200">
                  No available beds found in any ward. Please clean or discharge beds first.
                </p>
              ) : (
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">Select available bed</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bedNumber} — {b.ward} ({b.floor}) [₹{b.dailyRate}/day]
                      {b.features?.hasVentilator ? " • Ventilator" : ""}
                      {b.features?.hasOxygen ? " • Oxygen" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Bed Amenities Pill Bar */}
          {activeBed && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Bed features:</span>
              {activeBed.features?.hasOxygen && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                  🫁 Piped oxygen
                </span>
              )}
              {activeBed.features?.hasVentilator && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                  ⚡ Ventilator ready
                </span>
              )}
              {activeBed.features?.hasMonitor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                  📟 Multipara monitor
                </span>
              )}
              {activeBed.features?.isIsolation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  🚪 Isolation room
                </span>
              )}
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Patient *
            </label>
            {initialPatient ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-extrabold text-slate-900">
                  {initialPatient.name}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Age: {initialPatient.age} yrs • Gender: {initialPatient.gender}
                  {initialPatient.bloodGroup && ` • Blood: ${initialPatient.bloodGroup}`}
                  {initialPatient.contactNumber && ` • Phone: ${initialPatient.contactNumber}`}
                </p>
                {initialPatient.abhaId && (
                  <p className="text-xs text-emerald-700 font-bold mt-1">
                    ABHA: {initialPatient.abhaId}
                  </p>
                )}
              </div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="">Select patient to admit</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.age}y / {p.gender}) {p.abhaId ? `[ABHA: ${p.abhaId}]` : ""} - Phone: {p.contactNumber}
                  </option>
                ))}
              </select>
            )}
            {selectedPatientObj && !initialPatient && (
              <div className="mt-2 text-xs text-slate-600 font-medium">
                Selected: <span className="font-bold text-slate-900">{selectedPatientObj.name}</span> ({selectedPatientObj.age}y / {selectedPatientObj.gender}) {selectedPatientObj.bloodGroup ? `• Blood: ${selectedPatientObj.bloodGroup}` : ""}
              </div>
            )}
          </div>

          {/* Attending Doctor */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Attending physician *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="">Select primary consulting physician</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {formatDoctorName(d.name)} — {d.specialization} ({d.department})
                </option>
              ))}
            </select>
          </div>

          {/* Admission Reason */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinical reason for admission *
              </label>
              <span className="text-[11px] font-medium text-slate-500">Click presets below</span>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Acute exacerbation of bronchial asthma under continuous monitoring"
              value={admissionReason}
              onChange={(e) => setAdmissionReason(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ADMISSION_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAdmissionReason(reason)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors"
                >
                  + {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact & Expected Discharge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Next of kin / Emergency contact
              </label>
              <input
                type="text"
                placeholder="e.g. Anjali Sharma (+91 98765 43210)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Estimated discharge date
              </label>
              <input
                type="date"
                value={expectedDischargeDate}
                onChange={(e) => setExpectedDischargeDate(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Admission notes & nurse instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Monitor blood pressure every 2 hours; alert consultant if systolic exceeds 160 mmHg."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  <span>Admitting patient...</span>
                </>
              ) : (
                <span>Confirm bed admission</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AllocateBedModal;

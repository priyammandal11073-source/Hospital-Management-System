import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getEmergencyById,
  updateEmergencyTriage,
  addEmergencyVitals,
  addEmergencyNote,
  assignEmergencyDoctor,
  assignEmergencyNurse,
  updateEmergencyStatus,
  createEmergencyDiagnosticOrder,
  createEmergencyPrescription,
  updateEmergencyObservation,
  addEmergencyProcedure,
  admitEmergencyPatient,
  transferEmergencyPatient,
  dischargeEmergencyPatient,
  getEmergencyBeds,
  getDoctors,
  getDiagnosticTests,
} from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateEmergencyEncounterHtml } from "../../utils/printTemplates.js";
import { getDoctorDisplayName, formatDoctorName } from "../../utils/doctorName.js";

const PriorityBadge = ({ priority }) => {
  const map = {
    critical: {
      badge: "bg-rose-50 text-rose-700 border-rose-200/80 font-bold",
      dot: "bg-rose-600 animate-pulse",
      label: "Critical (Resuscitation)",
    },
    urgent: {
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 font-bold",
      dot: "bg-amber-500",
      label: "Urgent",
    },
    less_urgent: {
      badge: "bg-sky-50 text-sky-800 border-sky-200/80 font-semibold",
      dot: "bg-sky-500",
      label: "Less Urgent",
    },
    non_urgent: {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold",
      dot: "bg-emerald-500",
      label: "Non-Urgent",
    },
  };
  const config = map[priority] || {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    label: priority || "Routine",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] border shadow-2xs ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    arrived: "bg-slate-100 text-slate-700 border-slate-200",
    registered: "bg-blue-50 text-blue-700 border-blue-200/80",
    awaiting_triage: "bg-amber-50 text-amber-800 border-amber-200/80",
    triaged: "bg-sky-50 text-sky-800 border-sky-200/80",
    awaiting_doctor: "bg-violet-50 text-violet-800 border-violet-200/80",
    under_assessment: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
    under_treatment: "bg-teal-50 text-teal-800 border-teal-200/80",
    awaiting_diagnostics: "bg-orange-50 text-orange-800 border-orange-200/80",
    under_observation: "bg-cyan-50 text-cyan-800 border-cyan-200/80",
    admitted: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    discharged: "bg-slate-100 text-slate-600 border-slate-200",
    transferred: "bg-purple-50 text-purple-800 border-purple-200/80",
    cancelled: "bg-rose-50 text-rose-600 border-rose-200",
  };
  const formatted = (status || "").replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {formatted}
    </span>
  );
};

const TABS = [
  "Overview",
  "Triage",
  "Vitals",
  "Clinical Notes",
  "Orders",
  "Diagnostics",
  "Medications",
  "Procedures",
  "Observation",
  "Billing",
  "Timeline",
];

export default function EmergencyPatientProfilePage() {
  const { id } = useParams();
  const [encounter, setEncounter] = useState(null);
  const [related, setRelated] = useState({});
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [beds, setBeds] = useState([]);
  const [diagnosticTests, setDiagnosticTests] = useState([]);
  const { openPrintPreview } = usePrintModal();

  const handlePrintEncounter = () => {
    if (!encounter) return;
    openPrintPreview({
      title: `Emergency Clinical Encounter — ${encounter.emergencyId || "Record"}`,
      htmlContent: generateEmergencyEncounterHtml(encounter),
      refNumber: encounter.emergencyId,
    });
  };

  // forms
  const [triageForm, setTriageForm] = useState({
    chiefComplaint: "",
    symptoms: "",
    bloodPressureSys: "",
    bloodPressureDia: "",
    heartRate: "",
    respiratoryRate: "",
    spo2: "",
    temperature: "",
    consciousnessLevel: "Alert",
    painScore: "",
    allergies: "",
    relevantHistory: "",
    triageNotes: "",
    priority: "urgent",
  });
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSys: "",
    bloodPressureDia: "",
    heartRate: "",
    respiratoryRate: "",
    spo2: "",
    temperature: "",
    painScore: "",
    consciousnessLevel: "Alert",
    notes: "",
  });
  const [noteForm, setNoteForm] = useState({ note: "", noteType: "Progress" });
  const [diagForm, setDiagForm] = useState({ testName: "", priority: "STAT", notes: "" });
  const [rxForm, setRxForm] = useState({
    medications: [{ name: "", dosage: "", frequency: "1-0-1", duration: "5 days", instructions: "" }],
    diagnosis: "",
    advice: "",
  });
  const [procForm, setProcForm] = useState({ procedureName: "", notes: "" });
  const [obsForm, setObsForm] = useState({ notes: "", status: "active" });
  const [admitForm, setAdmitForm] = useState({ bedId: "", ward: "", admissionReason: "" });
  const [transferForm, setTransferForm] = useState({ toLocation: "", reason: "", toBedId: "" });
  const [dischargeForm, setDischargeForm] = useState({
    finalDiagnosis: "",
    treatmentSummary: "",
    medications: "",
    instructions: "",
    followUp: "",
    dischargeNotes: "",
  });
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmergencyById(id);
      setEncounter(res.encounter);
      setRelated(res.related || {});
      setTriageForm((f) => ({
        ...f,
        chiefComplaint: res.encounter.chiefComplaint,
        priority: res.encounter.priority,
      }));
      setDischargeForm((f) => ({ ...f, finalDiagnosis: res.encounter.chiefComplaint }));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load emergency encounter.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    getDoctors()
      .then((r) => setDoctors(r.doctors || []))
      .catch(() => {});
    getEmergencyBeds()
      .then((r) => setBeds(r.beds || []))
      .catch(() => {});
    getDiagnosticTests({ limit: 100 })
      .then((r) => setDiagnosticTests(r.data || r.tests || []))
      .catch(() => {});
  }, [load]);

  const refresh = () => load();

  const handleTriage = async (e) => {
    e.preventDefault();
    try {
      const r = await updateEmergencyTriage(id, triageForm);
      setEncounter(r.encounter);
      setActiveTab("Overview");
      setActionMsg("Triage recorded successfully.");
      setTimeout(() => setActionMsg(""), 2500);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Triage recording failed.");
    }
  };

  const handleVitals = async (e) => {
    e.preventDefault();
    try {
      await addEmergencyVitals(id, vitalsForm);
      setVitalsForm({
        bloodPressureSys: "",
        bloodPressureDia: "",
        heartRate: "",
        respiratoryRate: "",
        spo2: "",
        temperature: "",
        painScore: "",
        consciousnessLevel: "Alert",
        notes: "",
      });
      refresh();
      setActionMsg("Emergency vitals recorded.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch (err) {
      alert("Failed to record vitals.");
    }
  };

  const handleNote = async (e) => {
    e.preventDefault();
    try {
      await addEmergencyNote(id, noteForm);
      setNoteForm({ note: "", noteType: "Progress" });
      refresh();
      setActionMsg("Clinical note added.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch (err) {
      alert("Failed to add note.");
    }
  };

  const handleProcedure = async (e) => {
    e.preventDefault();
    if (!procForm.procedureName.trim()) return;
    try {
      await addEmergencyProcedure(id, procForm);
      setProcForm({ procedureName: "", notes: "" });
      refresh();
      setActionMsg("Emergency procedure recorded.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Procedure record failed.");
    }
  };

  const handleAssignDoctor = async (doctorId) => {
    try {
      await assignEmergencyDoctor(id, doctorId);
      refresh();
      setActionMsg("Attending emergency doctor assigned.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Doctor assignment failed.");
    }
  };

  const handleAssignNurse = async () => {
    try {
      await assignEmergencyNurse(id, {});
      refresh();
      setActionMsg("You are assigned as the attending ER nurse.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch {}
  };

  const handleStatus = async (status) => {
    try {
      await updateEmergencyStatus(id, { status });
      refresh();
    } catch {}
  };

  const handleDiagOrder = async (e) => {
    e.preventDefault();
    try {
      await createEmergencyDiagnosticOrder(id, diagForm);
      setDiagForm({ testName: "", priority: "STAT", notes: "" });
      refresh();
      setActionMsg("STAT diagnostic order transmitted to Laboratory / Radiology.");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Diagnostic order failed.");
    }
  };

  const handlePrescription = async (e) => {
    e.preventDefault();
    const meds = rxForm.medications.filter((m) => m.name.trim());
    if (!meds.length) return alert("Add at least one medication.");
    try {
      await createEmergencyPrescription(id, {
        medications: meds,
        diagnosis: rxForm.diagnosis,
        advice: rxForm.advice,
      });
      setRxForm({
        medications: [{ name: "", dosage: "", frequency: "1-0-1", duration: "5 days", instructions: "" }],
        diagnosis: "",
        advice: "",
      });
      refresh();
      setActionMsg("Emergency prescription sent to Pharmacy for rapid dispensing.");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Prescription failed.");
    }
  };

  const handleObs = async (e) => {
    e.preventDefault();
    try {
      await updateEmergencyObservation(id, obsForm);
      refresh();
      setActionMsg("Observation status updated.");
      setTimeout(() => setActionMsg(""), 2000);
    } catch {}
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    try {
      await admitEmergencyPatient(id, admitForm);
      refresh();
      setActionMsg("Inpatient admission confirmed — inpatient bed allocated.");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Admission request failed.");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await transferEmergencyPatient(id, transferForm);
      refresh();
      setActionMsg("Emergency transfer documented.");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed.");
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    try {
      await dischargeEmergencyPatient(id, dischargeForm);
      refresh();
      setActionMsg("Patient clinical discharge completed.");
      setActiveTab("Overview");
      setTimeout(() => setActionMsg(""), 2500);
    } catch (err) {
      alert(err.response?.data?.message || "Discharge failed.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-36 bg-white/70 rounded-2xl liquid-glass-card" />
        <div className="h-12 bg-white/70 rounded-2xl liquid-glass-card" />
        <div className="h-96 bg-white/70 rounded-2xl liquid-glass-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl">
        <p className="font-bold">{error}</p>
        <Link to="/emergency/queue" className="mt-3 inline-block font-semibold text-slate-800 underline">
          ← Back to Emergency Queue
        </Link>
      </div>
    );
  }

  if (!encounter) {
    return <div className="p-12 text-center text-slate-500">Encounter not found</div>;
  }

  const patient = encounter.patient || {};
  const isDischarged = encounter.status === "discharged";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Clinical Patient Banner */}
      <div className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
                {patient.name || "Unknown Patient"}
              </h1>
              {encounter.isUnknown && (
                <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                  UNKNOWN TRAUMA
                </span>
              )}
              <PriorityBadge priority={encounter.priority} />
              <StatusBadge status={encounter.status} />
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/80">
                {encounter.emergencyId}
              </span>
              <span className="text-[11px] font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                Token {encounter.tokenNumber}
              </span>
            </div>

            <div className="mt-2.5 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium">
              <span>
                Age: <b className="text-slate-900">{patient.age || "—"}</b>y / {patient.gender || "—"} • Blood:{" "}
                <b className="text-rose-600">{patient.bloodGroup || "—"}</b>
              </span>
              <span>
                MRN: <b className="font-mono text-slate-900">{patient.patientId || patient._id?.slice(-6) || "—"}</b>
              </span>
              <span>
                Arrival: <b className="text-slate-900">{new Date(encounter.arrivalTime).toLocaleString("en-IN")}</b> via{" "}
                <span className="capitalize">{encounter.arrivalMode}</span>
              </span>
              <span>
                Bay: <b className="text-slate-900">{encounter.location || "Triage"}</b>
              </span>
              {encounter.bed && (
                <span>
                  Allocated Bed: <b className="text-slate-900">{encounter.bed?.bedNumber || encounter.bed}</b>
                </span>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-600">
              Chief Complaint: <span className="font-semibold text-slate-900">{encounter.chiefComplaint}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={encounter.assignedDoctor?._id || encounter.assignedDoctor || ""}
              onChange={(e) => handleAssignDoctor(e.target.value)}
              className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white font-medium text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
            >
              <option value="">+ Assign Doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {getDoctorDisplayName(d)} ({d.specialization || "Emergency"})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssignNurse}
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Assign Me (Nurse)
            </button>
            <button
              type="button"
              onClick={handlePrintEncounter}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>🖨 Print Chart</span>
            </button>
            <Link
              to="/emergency/queue"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Queue
            </Link>
          </div>
        </div>

        {actionMsg && (
          <div className="mt-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
            ✓ {actionMsg}
          </div>
        )}
      </div>

      {/* Patient Clinical Lifecycle Pipeline */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">Status:</span>
        {[
          "awaiting_triage",
          "triaged",
          "awaiting_doctor",
          "under_assessment",
          "under_treatment",
          "under_observation",
          "awaiting_diagnostics",
          "admitted",
          "discharged",
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatus(s)}
            disabled={isDischarged && s !== "discharged"}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 ${
              encounter.status === s
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "liquid-glass-pill text-slate-700 border-slate-200/80 hover:bg-slate-100/80"
            } ${isDischarged ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Interactive Tabs Menu Container */}
      <div className="rounded-2xl liquid-glass-card p-2 sm:p-2.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer active:scale-95 ${
              activeTab === t
                ? "bg-teal-700 text-white shadow-sm shadow-teal-950/10"
                : "liquid-glass-pill text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active Tab Content Panel */}
      <div className="rounded-2xl liquid-glass-card p-5 sm:p-7 shadow-2xs">
        {activeTab === "Overview" && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Patient Profile Data</div>
                <div className="mt-3 text-xs space-y-1.5 text-slate-700">
                  <div><span className="text-slate-400">Name:</span> <b className="text-slate-900">{patient.name}</b></div>
                  <div><span className="text-slate-400">Demographics:</span> {patient.age}y / {patient.gender}</div>
                  <div><span className="text-slate-400">Contact:</span> {patient.contactNumber || "—"}</div>
                  <div><span className="text-slate-400">ABHA ID:</span> {patient.abhaId || "—"}</div>
                  <div><span className="text-slate-400">Allergies:</span> {(patient.allergies || []).join(", ") || encounter.knownAllergies?.join(", ") || "None recorded"}</div>
                  <div><span className="text-slate-400">History:</span> {(patient.medicalHistory || []).join(", ") || encounter.knownConditions?.join(", ") || "None recorded"}</div>
                  <div><span className="text-slate-400">Next of Kin:</span> {encounter.emergencyContact?.name} ({encounter.emergencyContact?.phone || "No phone"})</div>
                </div>
              </div>

              <div className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Triage Assessment Snapshot</div>
                <div className="mt-3 text-xs space-y-2">
                  <div className="flex items-center gap-2">Priority: <PriorityBadge priority={encounter.priority} /></div>
                  <div>Triage: <span className="font-semibold text-slate-800 capitalize">{encounter.triageStatus || "Awaiting"}</span></div>
                  <div>Triaged By: <span className="font-medium text-slate-800">{encounter.triage?.triagedByName || "—"}</span></div>
                  <div>Timestamp: <span className="font-mono text-slate-600">{encounter.triage?.triagedAt ? new Date(encounter.triage.triagedAt).toLocaleString() : "—"}</span></div>
                  <div className="pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-700">
                    BP {encounter.triage?.bloodPressureSys || "—"}/{encounter.triage?.bloodPressureDia || "—"} • HR {encounter.triage?.heartRate || "—"} • SpO2 {encounter.triage?.spo2 || "—"}% • Temp {encounter.triage?.temperature || "—"}°F
                  </div>
                  <div className="text-[11px] text-slate-600">Pain Score: <b>{encounter.triage?.painScore ?? "—"}/10</b> • AVPU: <b>{encounter.triage?.consciousnessLevel || "Alert"}</b></div>
                </div>
              </div>

              <div className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Care Team & Location</div>
                  <div className="mt-3 text-xs space-y-1.5 text-slate-700">
                    <div>Attending: <b className="text-slate-900">{encounter.assignedDoctor ? getDoctorDisplayName(encounter.assignedDoctor) : encounter.assignedDoctorName || "Unassigned"}</b></div>
                    <div>Nurse: <b className="text-slate-900">{encounter.assignedNurseName || "Unassigned"}</b></div>
                    <div>Location: <b className="text-slate-900">{encounter.location || "Triage"}</b></div>
                    <div>Bed: <b className="text-slate-900">{encounter.bed?.bedNumber || "Not allocated"}</b></div>
                    <div className="flex items-center gap-2 mt-2">Status: <StatusBadge status={encounter.status} /></div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setActiveTab("Triage")} className="flex-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition">
                    Update Triage
                  </button>
                  <button type="button" onClick={() => setActiveTab("Vitals")} className="flex-1 rounded-xl liquid-glass-pill text-slate-700 hover:bg-slate-100/80 px-3 py-1.5 text-xs font-semibold border border-slate-200/80">
                    Log Vitals
                  </button>
                </div>
              </div>
            </div>

            {/* Encounter Printable Summary Box */}
            <div className="rounded-xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100/80 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">Encounter Summary</h3>
                <button
                  type="button"
                  onClick={handlePrintEncounter}
                  className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-teal-800 text-xs font-semibold px-3 py-1 border border-slate-200/80 cursor-pointer"
                >
                  Print Summary Sheet
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">Nivora Care Hospital — Emergency Encounter {encounter.emergencyId}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Token {encounter.tokenNumber} • Arrival {new Date(encounter.arrivalTime).toLocaleString("en-IN")}</div>
                  <div className="mt-2">Patient: <b>{patient.name}</b> ({patient.age}y {patient.gender}) • MRN {patient.patientId}</div>
                  <div className="mt-1">Chief Complaint: {encounter.chiefComplaint}</div>
                </div>
                <div>
                  <div>Diagnostic Orders Count: <b>{encounter.diagnosticOrders?.length || 0}</b></div>
                  <div>Prescriptions Count: <b>{encounter.prescriptions?.length || 0}</b></div>
                  <div>Clinical Notes Count: <b>{encounter.clinicalNotes?.length || 0}</b></div>
                  <div>Vitals Readings Count: <b>{encounter.vitalsHistory?.length || 0}</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Triage" && (
          <form onSubmit={handleTriage} className="space-y-4 max-w-3xl">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Triage Assessment & Vital Scoring</h3>
            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  value={triageForm.chiefComplaint}
                  onChange={(e) => setTriageForm({ ...triageForm, chiefComplaint: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 px-3.5 py-2 text-xs focus:border-teal-700 focus:outline-none"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Symptoms & Clinical Presentation</label>
                <textarea
                  value={triageForm.symptoms}
                  onChange={(e) => setTriageForm({ ...triageForm, symptoms: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200/80 p-3 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">BP Sys / Dia (mmHg)</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Sys (120)"
                    value={triageForm.bloodPressureSys}
                    onChange={(e) => setTriageForm({ ...triageForm, bloodPressureSys: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                  />
                  <input
                    placeholder="Dia (80)"
                    value={triageForm.bloodPressureDia}
                    onChange={(e) => setTriageForm({ ...triageForm, bloodPressureDia: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Heart Rate (bpm)</label>
                <input
                  value={triageForm.heartRate}
                  onChange={(e) => setTriageForm({ ...triageForm, heartRate: e.target.value })}
                  placeholder="72"
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Respiratory Rate (/min)</label>
                <input
                  value={triageForm.respiratoryRate}
                  onChange={(e) => setTriageForm({ ...triageForm, respiratoryRate: e.target.value })}
                  placeholder="16"
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">SpO2 (%)</label>
                <input
                  value={triageForm.spo2}
                  onChange={(e) => setTriageForm({ ...triageForm, spo2: e.target.value })}
                  placeholder="98"
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Temperature (°F)</label>
                <input
                  value={triageForm.temperature}
                  onChange={(e) => setTriageForm({ ...triageForm, temperature: e.target.value })}
                  placeholder="98.6"
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Consciousness Level (AVPU)</label>
                <select
                  value={triageForm.consciousnessLevel}
                  onChange={(e) => setTriageForm({ ...triageForm, consciousnessLevel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white focus:border-teal-700 focus:outline-none"
                >
                  <option value="Alert">Alert</option>
                  <option value="Verbal">Verbal (Responds to Voice)</option>
                  <option value="Pain">Pain (Responds to Pain)</option>
                  <option value="Unresponsive">Unresponsive</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pain Score (0–10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={triageForm.painScore}
                  onChange={(e) => setTriageForm({ ...triageForm, painScore: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority Categorization</label>
                <select
                  value={triageForm.priority}
                  onChange={(e) => setTriageForm({ ...triageForm, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white focus:border-teal-700 focus:outline-none font-bold"
                >
                  <option value="critical">🔴 Critical (Level 1 Resuscitation)</option>
                  <option value="urgent">🟠 Urgent (Level 2 STAT)</option>
                  <option value="less_urgent">🔵 Less Urgent (Level 3)</option>
                  <option value="non_urgent">🟢 Non-Urgent (Level 4)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Triage Notes & Assessment</label>
                <textarea
                  value={triageForm.triageNotes}
                  onChange={(e) => setTriageForm({ ...triageForm, triageNotes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200/80 p-3 text-xs focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-6 py-2.5 text-xs font-semibold shadow-sm shadow-teal-950/10 transition active:scale-95"
              >
                Save Triage Assessment
              </button>
              <button
                type="button"
                onClick={handlePrintEncounter}
                className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-4 py-2.5 text-xs font-semibold border border-slate-200/80 shadow-2xs"
              >
                🖨 Print Triage Sheet
              </button>
            </div>
          </form>
        )}

        {activeTab === "Vitals" && (
          <div className="space-y-5">
            <form onSubmit={handleVitals} className="grid sm:grid-cols-4 gap-3 rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs">
              <input
                placeholder="BP Sys (mmHg)"
                value={vitalsForm.bloodPressureSys}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSys: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="BP Dia (mmHg)"
                value={vitalsForm.bloodPressureDia}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDia: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="Heart Rate (bpm)"
                value={vitalsForm.heartRate}
                onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="Respiratory Rate"
                value={vitalsForm.respiratoryRate}
                onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="SpO2 (%)"
                value={vitalsForm.spo2}
                onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="Temp (°F)"
                value={vitalsForm.temperature}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <input
                placeholder="Pain (0-10)"
                value={vitalsForm.painScore}
                onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
              />
              <select
                value={vitalsForm.consciousnessLevel}
                onChange={(e) => setVitalsForm({ ...vitalsForm, consciousnessLevel: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white font-medium text-slate-700"
              >
                <option value="Alert">Alert</option>
                <option value="Verbal">Verbal</option>
                <option value="Pain">Pain</option>
                <option value="Unresponsive">Unresponsive</option>
              </select>
              <input
                placeholder="Vitals observation notes"
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white sm:col-span-3"
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Record Emergency Vitals
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Encounter Vitals Flowsheet
              </h4>
              {(encounter.vitalsHistory || []).slice().reverse().map((v, i) => (
                <div key={i} className="rounded-xl bg-white border border-slate-200/80 p-3 text-xs flex flex-wrap items-center gap-3 shadow-2xs font-mono">
                  <span>BP <b className="text-slate-900">{v.bloodPressureSys || "—"}/{v.bloodPressureDia || "—"}</b></span>
                  <span>HR <b className="text-slate-900">{v.heartRate || "—"}</b></span>
                  <span>RR <b className="text-slate-900">{v.respiratoryRate || "—"}</b></span>
                  <span>SpO2 <b className="text-slate-900">{v.spo2 || "—"}%</b></span>
                  <span>Temp <b className="text-slate-900">{v.temperature || "—"}°F</b></span>
                  <span>Pain <b className="text-slate-900">{v.painScore ?? "—"}/10</b></span>
                  <span className="font-sans font-semibold text-slate-700">{v.consciousnessLevel}</span>
                  <span className="text-slate-400 font-sans ml-auto">
                    {new Date(v.recordedAt || v.at || Date.now()).toLocaleTimeString("en-IN")} • {v.recordedBy}
                  </span>
                </div>
              ))}
              {(!encounter.vitalsHistory || encounter.vitalsHistory.length === 0) && (
                <div className="text-xs text-slate-400 p-4 text-center">No emergency vitals logged yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Clinical Notes" && (
          <div className="space-y-5">
            <form onSubmit={handleNote} className="space-y-3 rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <select
                  value={noteForm.noteType}
                  onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value })}
                  className="rounded-xl border border-slate-200/80 px-3 py-1.5 text-xs bg-white font-medium text-slate-800"
                >
                  <option value="Progress">Progress Note</option>
                  <option value="Assessment">Clinical Assessment</option>
                  <option value="Reassessment">Triage Reassessment</option>
                  <option value="Procedure">Procedure Note</option>
                  <option value="Observation">Observation Care</option>
                  <option value="Handover">Shift Handover</option>
                </select>
              </div>
              <textarea
                value={noteForm.note}
                onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                rows={3}
                placeholder="Type clinical progress note, rapid assessment, differential diagnosis, or response to therapy..."
                required
                className="w-full rounded-xl border border-slate-200/80 p-3 text-xs bg-white focus:border-teal-700 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Add Clinical Note
              </button>
            </form>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Encounter Clinical Notes History
              </h4>
              {(encounter.clinicalNotes || []).slice().reverse().map((n, i) => (
                <div key={i} className="rounded-xl bg-white border border-slate-200/80 p-3.5 shadow-2xs">
                  <div className="text-[11px] text-slate-500 flex justify-between items-center border-b border-slate-100 pb-1.5 mb-2">
                    <span className="font-bold text-slate-800">
                      {n.byName} ({n.byRole}) • <span className="text-teal-800">{n.noteType || "Clinical Note"}</span>
                    </span>
                    <span className="font-mono">{new Date(n.at).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{n.note}</div>
                </div>
              ))}
              {(encounter.clinicalNotes || []).length === 0 && (
                <div className="text-xs text-slate-400 p-4 text-center">No clinical notes recorded yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Orders" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs shadow-2xs space-y-2">
              <div className="font-bold text-amber-900">Hospital Physician Orders & Treatment Instructions</div>
              <div className="space-y-2">
                {(related.doctorOrders || []).slice(0, 5).map((o) => (
                  <div key={o._id} className="bg-white rounded-xl p-3 border border-amber-200/60 shadow-2xs">
                    <div className="font-bold text-slate-800">{o.orderType}: {o.description}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Status: {o.status}</div>
                  </div>
                ))}
                {(related.doctorOrders || []).length === 0 && (
                  <div className="text-amber-800">No active general physician orders recorded in EHR.</div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              For STAT Lab/Imaging orders, use the <b>Diagnostics</b> tab. For emergency medications, use the <b>Medications</b> tab.
            </p>
          </div>
        )}

        {activeTab === "Diagnostics" && (
          <div className="space-y-5">
            <form onSubmit={handleDiagOrder} className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Order STAT Diagnostic Test</h4>
              <select
                value={diagForm.testName}
                onChange={(e) => setDiagForm({ ...diagForm, testName: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 px-3.5 py-2 text-xs bg-white focus:border-teal-700 focus:outline-none"
                required
              >
                <option value="">Select diagnostic investigation</option>
                {diagnosticTests.slice(0, 60).map((t) => (
                  <option key={t._id} value={t.name}>
                    {t.name} — {t.category} {t.price ? `(₹${t.price})` : ""}
                  </option>
                ))}
                <option value="CBC">Complete Blood Count (CBC)</option>
                <option value="Cardiac markers (Troponin I)">Cardiac markers (Troponin I / CK-MB)</option>
                <option value="Arterial Blood Gas (ABG)">Arterial Blood Gas (ABG)</option>
                <option value="Blood glucose (STAT)">Blood Glucose (STAT)</option>
                <option value="Renal function (KFT)">Renal Function Panel (KFT)</option>
                <option value="Chest X-Ray">Chest X-Ray AP/PA</option>
                <option value="CT Brain (Plain)">NCCT Brain (Trauma Protocol)</option>
                <option value="FAST Ultrasound">FAST Ultrasound (Abdomen / Pelvis)</option>
              </select>

              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={diagForm.priority}
                  onChange={(e) => setDiagForm({ ...diagForm, priority: e.target.value })}
                  className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white font-bold"
                >
                  <option value="STAT">STAT (Immediate &lt; 30m)</option>
                  <option value="Urgent">Urgent (&lt; 2 hrs)</option>
                  <option value="Routine">Routine</option>
                </select>
                <input
                  value={diagForm.notes}
                  onChange={(e) => setDiagForm({ ...diagForm, notes: e.target.value })}
                  placeholder="Clinical indication & symptoms"
                  className="rounded-xl border border-slate-200/80 px-3.5 py-2 text-xs bg-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Transmit STAT Diagnostic Order
              </button>
            </form>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Emergency Diagnostic Orders
              </h4>
              {(encounter.diagnosticOrders || []).map((o, i) => {
                const name = typeof o === "string" ? o : o.testName || o.test?.name || o.orderNumber || o._id;
                const prio = o.priority || "STAT";
                const stat = o.status || "Requested";
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Order #{o.orderNumber || "—"} • {o.category || o.diagnosticDepartment || "Diagnostic Investigation"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          prio === "STAT"
                            ? "bg-rose-600 text-white border-rose-700"
                            : "bg-amber-50 text-amber-800 border-amber-200/80"
                        }`}
                      >
                        {prio}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                        {stat}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(encounter.diagnosticOrders || []).length === 0 && (
                <div className="text-xs text-slate-400 p-4 text-center">No diagnostic orders placed yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Medications" && (
          <div className="space-y-5">
            <form onSubmit={handlePrescription} className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Prescribe Emergency Medication</h4>
              {rxForm.medications.map((m, idx) => (
                <div key={idx} className="grid sm:grid-cols-6 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <input
                    value={m.name}
                    onChange={(e) => {
                      const n = [...rxForm.medications];
                      n[idx].name = e.target.value;
                      setRxForm({ ...rxForm, medications: n });
                    }}
                    placeholder="Medicine name *"
                    required
                    className="rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-xs sm:col-span-2"
                  />
                  <input
                    value={m.dosage}
                    onChange={(e) => {
                      const n = [...rxForm.medications];
                      n[idx].dosage = e.target.value;
                      setRxForm({ ...rxForm, medications: n });
                    }}
                    placeholder="Dosage"
                    className="rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    value={m.frequency}
                    onChange={(e) => {
                      const n = [...rxForm.medications];
                      n[idx].frequency = e.target.value;
                      setRxForm({ ...rxForm, medications: n });
                    }}
                    placeholder="Frequency"
                    className="rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    value={m.duration}
                    onChange={(e) => {
                      const n = [...rxForm.medications];
                      n[idx].duration = e.target.value;
                      setRxForm({ ...rxForm, medications: n });
                    }}
                    placeholder="Duration"
                    className="rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    value={m.instructions}
                    onChange={(e) => {
                      const n = [...rxForm.medications];
                      n[idx].instructions = e.target.value;
                      setRxForm({ ...rxForm, medications: n });
                    }}
                    placeholder="Instructions"
                    className="rounded-xl border border-slate-200/80 px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRxForm({
                        ...rxForm,
                        medications: rxForm.medications.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold py-1.5"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setRxForm({
                      ...rxForm,
                      medications: [
                        ...rxForm.medications,
                        { name: "", dosage: "", frequency: "1-0-1", duration: "5 days", instructions: "" },
                      ],
                    })
                  }
                  className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3 py-1.5 text-xs font-semibold border border-slate-200/80 shadow-2xs"
                >
                  + Add Medication Row
                </button>
              </div>

              <input
                value={rxForm.diagnosis}
                onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                placeholder="Clinical working diagnosis"
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs"
              />
              <textarea
                value={rxForm.advice}
                onChange={(e) => setRxForm({ ...rxForm, advice: e.target.value })}
                placeholder="Clinical advice and nurse administration instructions"
                rows={2}
                className="w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs"
              />
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Authorize & Send to Pharmacy
              </button>
            </form>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prescription History (Pharmacy Queue)
              </h4>
              {(related.prescriptions || []).slice(0, 8).map((p) => (
                <div key={p._id} className="rounded-xl bg-white border border-slate-200/80 p-3.5 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900">{p.prescriptionNumber}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.dispensingStatus === "dispensed"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                          : "bg-amber-50 text-amber-800 border-amber-200/80"
                      }`}
                    >
                      {p.dispensingStatus || p.status || "Pending"}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium text-xs">
                    {(p.medications || []).map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md mr-1.5 mb-1 text-[11px]"
                      >
                        {m.name} {m.dosage ? `(${m.dosage})` : ""} — {m.frequency || "1-0-1"}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(p.createdAt).toLocaleString("en-IN")} • {formatDoctorName(p.digitalSignature?.signedByName, "ER Physician")}
                  </div>
                </div>
              ))}
              {(related.prescriptions || []).length === 0 && (
                <div className="text-xs text-slate-400 p-4 text-center">No prescriptions recorded yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Procedures" && (
          <div className="space-y-5 text-xs">
            <form onSubmit={handleProcedure} className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Record Emergency Procedure</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Procedure Name *</label>
                  <input
                    value={procForm.procedureName}
                    onChange={(e) => setProcForm({ ...procForm, procedureName: e.target.value })}
                    placeholder="e.g. Endotracheal Intubation, Central Line, Chest Tube, CPR, Suturing"
                    required
                    className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Attending Notes & Outcomes</label>
                  <input
                    value={procForm.notes}
                    onChange={(e) => setProcForm({ ...procForm, notes: e.target.value })}
                    placeholder="Performed under aseptic precautions, no immediate complications"
                    className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
              >
                Record Clinical Procedure
              </button>
            </form>

            <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Recorded Emergency Procedures</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({(encounter.procedures || []).length})
                </span>
              </div>
              {(encounter.procedures || []).length === 0 ? (
                <div className="text-slate-400 py-4 text-center">No procedures recorded for this emergency encounter</div>
              ) : (
                <div className="space-y-2">
                  {encounter.procedures.map((pr, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-xl liquid-glass-subtle border border-slate-200/80 text-slate-800"
                    >
                      <span className="h-2 w-2 rounded-full bg-teal-700 shrink-0" />
                      <span className="font-semibold text-xs">{pr}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Observation" && (
          <div className="space-y-5">
            <form onSubmit={handleObs} className="rounded-xl liquid-glass-subtle p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Observation Unit Notes</h4>
              <textarea
                value={obsForm.notes}
                onChange={(e) => setObsForm({ ...obsForm, notes: e.target.value })}
                rows={3}
                placeholder="Document clinical evolution, response to fluids, pain trajectory, or telemetry findings..."
                className="w-full rounded-xl border border-slate-200/80 p-3 text-xs bg-white focus:border-teal-700 focus:outline-none"
              />
              <div className="flex gap-3 items-center">
                <select
                  value={obsForm.status}
                  onChange={(e) => setObsForm({ ...obsForm, status: e.target.value })}
                  className="rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white font-medium text-slate-800"
                >
                  <option value="active">Active Observation</option>
                  <option value="completed">Observation Completed</option>
                  <option value="cancelled">Observation Cancelled</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  Update Observation Status
                </button>
              </div>
            </form>

            <div className="rounded-xl bg-white border border-slate-200/80 p-4 text-xs shadow-2xs space-y-2">
              <div className="font-bold text-slate-900">Current Observation Log</div>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {encounter.observation?.notes || "No observation notes logged."}
              </div>
              <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                Started: {encounter.observation?.startedAt ? new Date(encounter.observation.startedAt).toLocaleString() : "—"} • Status: {encounter.observation?.status || "—"}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Billing" && (
          <div className="space-y-4">
            {(related.billings || []).length === 0 ? (
              <div className="text-xs text-slate-400 p-6 text-center">No billing records for this patient.</div>
            ) : (
              related.billings.slice(0, 10).map((b) => (
                <div key={b._id} className="rounded-xl bg-white border border-slate-200/80 p-4 text-xs shadow-2xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">
                      {b.itemizedCharges?.map((c) => c.description).join(", ") || "Hospital Emergency Services"}
                    </div>
                    <div className="text-slate-500 font-mono mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString()} • Invoice #{b._id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 font-mono text-sm">₹{b.totalAmount}</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 mt-1">
                      {b.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900">
              Emergency billing is automatically consolidated for triage, diagnostic panels, medications, bay usage, and discharge.
            </div>
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Clinical Event Chronology
            </h4>
            {(encounter.timeline || []).slice().reverse().map((t, i) => (
              <div key={i} className="flex gap-3 text-xs border-l-2 border-teal-700 pl-3.5 py-1.5">
                <div className="min-w-[95px] font-mono text-slate-500 text-[11px]">
                  {new Date(t.at).toLocaleString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.event}</div>
                  <div className="text-slate-600 mt-0.5">
                    {t.details} <span className="text-slate-400 font-medium">• {t.by}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!encounter.timeline || encounter.timeline.length === 0) && (
              <div className="text-xs text-slate-400 p-4 text-center">No timeline events recorded yet</div>
            )}
          </div>
        )}
      </div>

      {/* Disposition Management: Admission, Transfer & Discharge */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Admission Form */}
        <form onSubmit={handleAdmit} className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs space-y-3.5 bg-emerald-50/20 border border-emerald-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
            <h3 className="text-sm font-bold text-emerald-900">Request Inpatient Admission</h3>
            <span className="text-base">🏥</span>
          </div>
          <select
            value={admitForm.bedId}
            onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          >
            <option value="">Auto-assign hospital bed</option>
            {beds.filter((b) => b.status === "available").map((b) => (
              <option key={b._id} value={b._id}>
                {b.bedNumber} — {b.ward} (₹{b.dailyRate}/day)
              </option>
            ))}
          </select>
          <input
            value={admitForm.ward}
            onChange={(e) => setAdmitForm({ ...admitForm, ward: e.target.value })}
            placeholder="Ward preference (ICU, CCU, Ward)"
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <input
            value={admitForm.admissionReason}
            onChange={(e) => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}
            placeholder="Primary admission indication"
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <input
            type="date"
            value={admitForm.expectedDischargeDate || ""}
            onChange={(e) => setAdmitForm({ ...admitForm, expectedDischargeDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={isDischarged}
            className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            Confirm Admission & Allocate Bed
          </button>
        </form>

        {/* Transfer Form */}
        <form onSubmit={handleTransfer} className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs space-y-3.5 bg-purple-50/20 border border-purple-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
            <h3 className="text-sm font-bold text-purple-900">Emergency Patient Transfer</h3>
            <span className="text-base">⇄</span>
          </div>
          <input
            value={transferForm.toLocation}
            onChange={(e) => setTransferForm({ ...transferForm, toLocation: e.target.value })}
            placeholder="Target location (OT, Cath Lab, Radiology, ICU)"
            required
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <select
            value={transferForm.toBedId}
            onChange={(e) => setTransferForm({ ...transferForm, toBedId: e.target.value })}
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          >
            <option value="">Select target bed (optional)</option>
            {beds.filter((b) => b.status === "available").map((b) => (
              <option key={b._id} value={b._id}>
                {b.bedNumber} — {b.ward}
              </option>
            ))}
          </select>
          <input
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
            placeholder="Clinical reason for transfer"
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={isDischarged}
            className="w-full rounded-xl bg-purple-700 hover:bg-purple-800 text-white py-2.5 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            Execute Clinical Transfer
          </button>
        </form>

        {/* Discharge Form */}
        <form onSubmit={handleDischarge} className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs space-y-3.5 bg-slate-50/40 border border-slate-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <h3 className="text-sm font-bold text-slate-900">Clinical Discharge from ER</h3>
            <span className="text-base">📋</span>
          </div>
          <input
            value={dischargeForm.finalDiagnosis}
            onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
            placeholder="Final clinical diagnosis *"
            required
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <textarea
            value={dischargeForm.treatmentSummary}
            onChange={(e) => setDischargeForm({ ...dischargeForm, treatmentSummary: e.target.value })}
            placeholder="Summary of acute treatment provided"
            rows={2}
            className="w-full rounded-xl border border-slate-200/80 p-3 text-xs bg-white"
          />
          <input
            value={dischargeForm.medications}
            onChange={(e) => setDischargeForm({ ...dischargeForm, medications: e.target.value })}
            placeholder="Take-home discharge medications"
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <input
            value={dischargeForm.instructions}
            onChange={(e) => setDischargeForm({ ...dischargeForm, instructions: e.target.value })}
            placeholder="Post-discharge care instructions"
            className="w-full rounded-xl border border-slate-200/80 px-3 py-2 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={isDischarged}
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            Complete Patient Discharge
          </button>
          {isDischarged && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 font-medium">
              Discharged by {encounter.discharge?.dischargedByName} at{" "}
              {encounter.discharge?.dischargedAt ? new Date(encounter.discharge.dischargedAt).toLocaleString() : ""}
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link to="/emergency/queue" className="text-xs font-semibold text-teal-800 hover:underline inline-flex items-center gap-1">
          <span>← Back to Emergency Queue</span>
        </Link>
        <button
          type="button"
          onClick={handlePrintEncounter}
          className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 px-4 py-2 text-xs font-semibold shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>🖨 Print Encounter Summary</span>
        </button>
      </div>
    </div>
  );
}

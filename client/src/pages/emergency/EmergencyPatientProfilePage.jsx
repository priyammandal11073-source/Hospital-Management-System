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
    critical: "bg-red-600 text-white border-red-700 ring-2 ring-red-300 animate-pulse",
    urgent: "bg-amber-500 text-white border-amber-600",
    less_urgent: "bg-sky-600 text-white border-sky-700",
    non_urgent: "bg-emerald-600 text-white border-emerald-700",
  };
  const label = { critical: "Critical (Resuscitation)", urgent: "Urgent", less_urgent: "Less Urgent", non_urgent: "Non-Urgent" }[priority] || priority;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-xs ${map[priority] || "bg-slate-200 text-slate-700"}`}>{label}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    arrived: "bg-slate-100 text-slate-700 border-slate-300",
    registered: "bg-blue-50 text-blue-700 border-blue-200",
    awaiting_triage: "bg-amber-50 text-amber-700 border-amber-200",
    triaged: "bg-sky-50 text-sky-700 border-sky-200",
    awaiting_doctor: "bg-violet-50 text-violet-700 border-violet-200",
    under_assessment: "bg-indigo-50 text-indigo-700 border-indigo-200",
    under_treatment: "bg-blue-50 text-blue-700 border-blue-200",
    awaiting_diagnostics: "bg-orange-50 text-orange-700 border-orange-200",
    under_observation: "bg-teal-50 text-teal-700 border-teal-200",
    admitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    discharged: "bg-slate-100 text-slate-600 border-slate-200",
    transferred: "bg-purple-50 text-purple-700 border-purple-200",
    cancelled: "bg-rose-50 text-rose-600 border-rose-200",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${map[status] || "bg-slate-50 text-slate-700"}`}>{(status || "").replace(/_/g, " ")}</span>;
};

const priorityColor = { critical: "bg-red-600 text-white", urgent: "bg-amber-500 text-white", less_urgent: "bg-sky-600 text-white", non_urgent: "bg-emerald-600 text-white" };
const statusColor = { arrived: "bg-slate-200 text-slate-700", registered: "bg-blue-100 text-blue-700", awaiting_triage: "bg-amber-100 text-amber-700", triaged: "bg-sky-100 text-sky-700", awaiting_doctor: "bg-violet-100 text-violet-700", under_assessment: "bg-indigo-100 text-indigo-700", under_treatment: "bg-blue-100 text-blue-700", awaiting_diagnostics: "bg-orange-100 text-orange-700", under_observation: "bg-teal-100 text-teal-700", admitted: "bg-emerald-100 text-emerald-700", transferred: "bg-purple-100 text-purple-700", discharged: "bg-slate-100 text-slate-700" };

const TABS = ["Overview","Triage","Vitals","Clinical Notes","Orders","Diagnostics","Medications","Procedures","Observation","Billing","Timeline"];

export default function EmergencyPatientProfilePage(){
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
  const [triageForm, setTriageForm] = useState({ chiefComplaint:"", symptoms:"", bloodPressureSys:"", bloodPressureDia:"", heartRate:"", respiratoryRate:"", spo2:"", temperature:"", consciousnessLevel:"Alert", painScore:"", allergies:"", relevantHistory:"", triageNotes:"", priority:"urgent" });
  const [vitalsForm,setVitalsForm]=useState({ bloodPressureSys:"", bloodPressureDia:"", heartRate:"", respiratoryRate:"", spo2:"", temperature:"", painScore:"", consciousnessLevel:"Alert", notes:"" });
  const [noteForm,setNoteForm]=useState({ note:"", noteType:"Progress" });
  const [diagForm,setDiagForm]=useState({ testName:"", priority:"STAT", notes:"" });
  const [rxForm,setRxForm]=useState({ medications:[{name:"", dosage:"", frequency:"1-0-1", duration:"5 days", instructions:""}], diagnosis:"", advice:"" });
  const [procForm,setProcForm]=useState({ procedureName:"", notes:"" });
  const [obsForm,setObsForm]=useState({ notes:"", status:"active" });
  const [admitForm,setAdmitForm]=useState({ bedId:"", ward:"", admissionReason:"" });
  const [transferForm,setTransferForm]=useState({ toLocation:"", reason:"", toBedId:"" });
  const [dischargeForm,setDischargeForm]=useState({ finalDiagnosis:"", treatmentSummary:"", medications:"", instructions:"", followUp:"", dischargeNotes:"" });
  const [actionMsg,setActionMsg]=useState("");

  const load = useCallback(async ()=>{
    setLoading(true);
    try{
      const res = await getEmergencyById(id);
      setEncounter(res.encounter);
      setRelated(res.related||{});
      setTriageForm(f=>({...f, chiefComplaint: res.encounter.chiefComplaint, priority: res.encounter.priority }));
      setDischargeForm(f=>({...f, finalDiagnosis: res.encounter.chiefComplaint }));
    }catch(e){ setError(e.response?.data?.message || "Failed to load"); }
    finally{ setLoading(false); }
  },[id]);

  useEffect(()=>{ load(); getDoctors().then(r=>setDoctors(r.doctors||[])).catch(()=>{}); getEmergencyBeds().then(r=>setBeds(r.beds||[])).catch(()=>{}); getDiagnosticTests({limit:100}).then(r=>setDiagnosticTests(r.data||r.tests||[])).catch(()=>{}); },[load]);

  const refresh = ()=> load();

  const handleTriage = async (e)=>{ e.preventDefault(); try{ const r=await updateEmergencyTriage(id, triageForm); setEncounter(r.encounter); setActiveTab("Overview"); setActionMsg("Triage recorded"); setTimeout(()=>setActionMsg(""),2500); refresh(); }catch(err){ alert(err.response?.data?.message||"Triage failed"); } };
  const handleVitals = async (e)=>{ e.preventDefault(); try{ await addEmergencyVitals(id, vitalsForm); setVitalsForm({bloodPressureSys:"",bloodPressureDia:"",heartRate:"",respiratoryRate:"",spo2:"",temperature:"",painScore:"",consciousnessLevel:"Alert",notes:""}); refresh(); setActionMsg("Vitals recorded"); setTimeout(()=>setActionMsg(""),2000);}catch(err){alert("Vitals failed");} };
  const handleNote = async (e)=>{ e.preventDefault(); try{ await addEmergencyNote(id, noteForm); setNoteForm({note:"", noteType:"Progress"}); refresh(); setActionMsg("Note added"); }catch(err){alert("Note failed");} };
  const handleProcedure = async (e)=>{ e.preventDefault(); if(!procForm.procedureName.trim()) return; try{ await addEmergencyProcedure(id, procForm); setProcForm({procedureName:"", notes:""}); refresh(); setActionMsg("Procedure recorded"); setTimeout(()=>setActionMsg(""),2000); }catch(err){alert(err.response?.data?.message||"Procedure failed");} };
  const handleAssignDoctor = async (doctorId)=>{ try{ await assignEmergencyDoctor(id, doctorId); refresh(); setActionMsg("Doctor assigned"); }catch(err){alert(err.response?.data?.message||"Assign failed"); } };
  const handleAssignNurse = async ()=>{ try{ await assignEmergencyNurse(id, {}); refresh(); setActionMsg("You assigned as ER nurse"); }catch{} };
  const handleStatus = async (status)=>{ try{ await updateEmergencyStatus(id, {status}); refresh(); }catch{} };
  const handleDiagOrder = async (e)=>{ e.preventDefault(); try{ await createEmergencyDiagnosticOrder(id, diagForm); setDiagForm({testName:"", priority:"STAT", notes:""}); refresh(); setActionMsg("Diagnostic ordered - sent to Diagnostics"); }catch(err){alert(err.response?.data?.message||"Diagnostic order failed");} };
  const handlePrescription = async (e)=>{ e.preventDefault(); const meds = rxForm.medications.filter(m=>m.name.trim()); if(!meds.length) return alert("Add at least one medication"); try{ await createEmergencyPrescription(id, {medications: meds, diagnosis: rxForm.diagnosis, advice: rxForm.advice}); setRxForm({medications:[{name:"", dosage:"", frequency:"1-0-1", duration:"5 days", instructions:""}], diagnosis:"", advice:""}); refresh(); setActionMsg("Prescription sent to Pharmacy"); }catch(err){alert(err.response?.data?.message||"Prescription failed");} };
  const handleObs = async (e)=>{ e.preventDefault(); try{ await updateEmergencyObservation(id, obsForm); refresh(); setActionMsg("Observation updated"); }catch{} };
  const handleAdmit = async (e)=>{ e.preventDefault(); try{ await admitEmergencyPatient(id, admitForm); refresh(); setActionMsg("Patient admitted - bed allocated"); }catch(err){alert(err.response?.data?.message||"Admit failed");} };
  const handleTransfer = async (e)=>{ e.preventDefault(); try{ await transferEmergencyPatient(id, transferForm); refresh(); setActionMsg("Transfer recorded"); }catch(err){alert(err.response?.data?.message||"Transfer failed");} };
  const handleDischarge = async (e)=>{ e.preventDefault(); try{ await dischargeEmergencyPatient(id, dischargeForm); refresh(); setActionMsg("Patient discharged"); setActiveTab("Overview"); }catch(err){alert(err.response?.data?.message||"Discharge failed");} };

  if(loading) return <div className="p-8 text-center text-slate-500">Loading emergency encounter...</div>;
  if(error) return <div className="p-8 text-center text-red-600">{error} <Link to="/emergency/queue" className="underline ml-2">Back</Link></div>;
  if(!encounter) return <div className="p-8 text-center">Not found</div>;

  const patient = encounter.patient || {};
  const isDischarged = encounter.status==="discharged";

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{patient.name || "Unknown Patient"} {encounter.isUnknown && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">UNKNOWN</span>}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityColor[encounter.priority]}`}>{encounter.priority}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColor[encounter.status]}`}>{encounter.status.replace(/_/g," ")}</span>
              <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-full font-mono">{encounter.emergencyId}</span>
              <span className="text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">{encounter.tokenNumber}</span>
            </div>
            <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-3">
              <span>Age: <b>{patient.age || "-"}</b> / {patient.gender || "-"} • {patient.bloodGroup || "-"}</span>
              <span>MRN: <b className="font-mono">{patient.patientId || patient._id?.slice(-6) || "-"}</b></span>
              <span>Arrival: <b>{new Date(encounter.arrivalTime).toLocaleString("en-IN")}</b> via {encounter.arrivalMode}</span>
              <span>Location: <b>{encounter.location}</b></span>
              {encounter.bed && <span>Bed: <b>{encounter.bed?.bedNumber || encounter.bed}</b></span>}
            </div>
            <div className="mt-1 text-xs text-slate-500">Chief Complaint: <span className="font-semibold text-slate-800">{encounter.chiefComplaint}</span></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={encounter.assignedDoctor?._id || encounter.assignedDoctor || ""} onChange={e=>handleAssignDoctor(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-white font-medium text-slate-800">
              <option value="">Assign Doctor</option>
              {doctors.map(d=><option key={d._id} value={d._id}>{getDoctorDisplayName(d)} ({d.specialization || "Emergency"})</option>)}
            </select>
            <button onClick={handleAssignNurse} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">Assign Me (Nurse)</button>
            <Link to="/emergency/queue" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">Queue</Link>
          </div>
        </div>
        {actionMsg && <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs font-semibold text-emerald-700">{actionMsg}</div>}
      </div>

      {/* Quick status actions */}
      <div className="flex flex-wrap gap-2 text-xs">
        {["awaiting_triage","triaged","awaiting_doctor","under_assessment","under_treatment","under_observation","awaiting_diagnostics","admitted","discharged"].map(s=>(
          <button key={s} onClick={()=>handleStatus(s)} disabled={isDischarged && s!=="discharged"} className={`rounded-full px-3 py-1.5 font-bold border ${encounter.status===s?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-700 border-slate-200 hover:bg-slate-50"} ${isDischarged?"opacity-50":""}`}>{s.replace(/_/g," ")}</button>
        ))}
        <button onClick={handlePrintEncounter} className="ml-auto rounded-full bg-white border border-slate-200 px-3.5 py-1.5 font-bold hover:bg-slate-50 cursor-pointer shadow-xs">🖨 Print Encounter</button>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab===t?"bg-rose-600 text-white":"bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{t}</button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab==="Overview" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Patient Details</div>
                  <div className="mt-2 text-xs space-y-1 text-slate-700">
                    <div><span className="text-slate-500">Name:</span> <b>{patient.name}</b></div>
                    <div><span className="text-slate-500">Age/Gender:</span> {patient.age}y / {patient.gender}</div>
                    <div><span className="text-slate-500">Contact:</span> {patient.contactNumber}</div>
                    <div><span className="text-slate-500">ABHA:</span> {patient.abhaId || "-"}</div>
                    <div><span className="text-slate-500">Allergies:</span> {(patient.allergies||[]).join(", ") || encounter.knownAllergies?.join(", ") || "-"}</div>
                    <div><span className="text-slate-500">Conditions:</span> {(patient.medicalHistory||[]).join(", ") || encounter.knownConditions?.join(", ") || "-"}</div>
                    <div><span className="text-slate-500">EC:</span> {encounter.emergencyContact?.name} {encounter.emergencyContact?.phone} ({encounter.emergencyContact?.relationship})</div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Triage Snapshot</div>
                  <div className="mt-2 text-xs space-y-1">
                    <div>Priority: <PriorityBadge priority={encounter.priority} /></div>
                    <div>Triage: <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${encounter.triageStatus==="triaged"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{encounter.triageStatus}</span></div>
                    <div>By: {encounter.triage?.triagedByName || "-"}</div>
                    <div>At: {encounter.triage?.triagedAt ? new Date(encounter.triage.triagedAt).toLocaleString() : "-"}</div>
                    <div className="pt-2 border-t">BP: {encounter.triage?.bloodPressureSys || "-"} / {encounter.triage?.bloodPressureDia || "-"} • HR {encounter.triage?.heartRate || "-"} • RR {encounter.triage?.respiratoryRate || "-"} • SpO2 {encounter.triage?.spo2 || "-"} • Temp {encounter.triage?.temperature || "-"}</div>
                    <div>Pain: {encounter.triage?.painScore ?? "-"} /10 • AVPU: {encounter.triage?.consciousnessLevel || "-"}</div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Care Team & Location</div>
                  <div className="mt-2 text-xs space-y-1">
                    <div>Doctor: <b>{encounter.assignedDoctor ? getDoctorDisplayName(encounter.assignedDoctor) : (encounter.assignedDoctorName || "Unassigned")}</b></div>
                    <div>Nurse: <b>{encounter.assignedNurseName || "Unassigned"}</b></div>
                    <div>Location: <b>{encounter.location}</b></div>
                    <div>Bed: <b>{encounter.bed?.bedNumber || "Not allocated"}</b></div>
                    <div>Status: <StatusBadge status={encounter.status} /></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>setActiveTab("Triage")} className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold">Triage</button>
                    <button onClick={()=>setActiveTab("Vitals")} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold">Vitals</button>
                  </div>
                </div>
              </div>

              <div className="clinical-print-sheet rounded-xl bg-white border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800 flex justify-between">Encounter Summary <button onClick={handlePrintEncounter} className="no-print text-xs font-semibold text-rose-600 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer">Print Summary</button></h3>
                <div className="mt-2 grid md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div>
                    <div className="font-bold text-slate-900">Nivora Care Hospital — Emergency Encounter {encounter.emergencyId}</div>
                    <div className="text-[11px] text-slate-500">Token {encounter.tokenNumber} • Arrival {new Date(encounter.arrivalTime).toLocaleString("en-IN")}</div>
                    <div className="mt-2">Patient: <b>{patient.name}</b> ({patient.age}y {patient.gender}) • {patient.patientId}</div>
                    <div>Chief Complaint: {encounter.chiefComplaint}</div>
                    <div>Priority: {encounter.priority} • Status: {encounter.status}</div>
                    <div>Doctor: {encounter.assignedDoctorName || "-"} • Nurse: {encounter.assignedNurseName || "-"}</div>
                  </div>
                  <div>
                    <div>Location: {encounter.location}</div>
                    <div>Vitals count: {encounter.vitalsHistory?.length || 0}</div>
                    <div>Clinical notes: {encounter.clinicalNotes?.length || 0}</div>
                    <div>Diagnostics: {encounter.diagnosticOrders?.length || 0}</div>
                    <div>Prescriptions: {encounter.prescriptions?.length || 0}</div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-500">Care • Trust • Healing • 24/7 Emergency Helpline 108 • billing@nivoracare.com</div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800">Timeline</h3>
                <div className="mt-2 space-y-2">
                  {(encounter.timeline||[]).slice().reverse().slice(0,20).map((t,i)=>(
                    <div key={i} className="flex gap-3 text-xs border-l-2 border-slate-200 pl-3 py-1">
                      <div className="min-w-[90px] font-mono text-slate-500">{new Date(t.at).toLocaleString("en-IN", {hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short"})}</div>
                      <div><div className="font-bold text-slate-800">{t.event}</div><div className="text-slate-600">{t.details} <span className="text-slate-400">• {t.by}</span></div></div>
                    </div>
                  ))}
                  {(!encounter.timeline || encounter.timeline.length===0) && <div className="text-xs text-slate-400">No timeline events</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab==="Triage" && (
            <form onSubmit={handleTriage} className="space-y-4 max-w-3xl clinical-print-sheet printable-card">
              <h3 className="text-sm font-bold text-slate-800">Triage Assessment</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-600">Chief Complaint *</label><input value={triageForm.chiefComplaint} onChange={e=>setTriageForm({...triageForm, chiefComplaint:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" required /></div>
                <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-600">Symptoms</label><textarea value={triageForm.symptoms} onChange={e=>setTriageForm({...triageForm, symptoms:e.target.value})} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">BP Sys / Dia</label><div className="flex gap-2 mt-1"><input value={triageForm.bloodPressureSys} onChange={e=>setTriageForm({...triageForm, bloodPressureSys:e.target.value})} placeholder="Sys" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /><input value={triageForm.bloodPressureDia} onChange={e=>setTriageForm({...triageForm, bloodPressureDia:e.target.value})} placeholder="Dia" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div></div>
                <div><label className="text-xs font-bold text-slate-600">Pulse (bpm)</label><input value={triageForm.heartRate} onChange={e=>setTriageForm({...triageForm, heartRate:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">Respiratory Rate</label><input value={triageForm.respiratoryRate} onChange={e=>setTriageForm({...triageForm, respiratoryRate:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">SpO2 %</label><input value={triageForm.spo2} onChange={e=>setTriageForm({...triageForm, spo2:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">Temp (°F)</label><input value={triageForm.temperature} onChange={e=>setTriageForm({...triageForm, temperature:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">Consciousness</label><select value={triageForm.consciousnessLevel} onChange={e=>setTriageForm({...triageForm, consciousnessLevel:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"><option>Alert</option><option>Verbal</option><option>Pain</option><option>Unresponsive</option><option>A</option><option>V</option><option>P</option><option>U</option></select></div>
                <div><label className="text-xs font-bold text-slate-600">Pain Score 0-10</label><input type="number" min="0" max="10" value={triageForm.painScore} onChange={e=>setTriageForm({...triageForm, painScore:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">Allergies</label><input value={triageForm.allergies} onChange={e=>setTriageForm({...triageForm, allergies:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-600">Relevant History</label><input value={triageForm.relevantHistory} onChange={e=>setTriageForm({...triageForm, relevantHistory:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-bold text-slate-600">Triage Notes</label><textarea value={triageForm.triageNotes} onChange={e=>setTriageForm({...triageForm, triageNotes:e.target.value})} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
                <div><label className="text-xs font-bold text-slate-600">Priority</label><select value={triageForm.priority} onChange={e=>setTriageForm({...triageForm, priority:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="less_urgent">Less Urgent</option><option value="non_urgent">Non-Urgent</option></select></div>
              </div>
              <div className="flex gap-2 no-print print:hidden"><button type="submit" className="rounded-xl bg-rose-600 text-white px-6 py-2 text-xs font-bold">Save Triage</button><button type="button" onClick={handlePrintEncounter} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer">Print Triage Sheet</button></div>
            </form>
          )}

          {activeTab==="Vitals" && (
            <div className="space-y-4">
              <form onSubmit={handleVitals} className="grid sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input placeholder="BP Sys" value={vitalsForm.bloodPressureSys} onChange={e=>setVitalsForm({...vitalsForm, bloodPressureSys:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="BP Dia" value={vitalsForm.bloodPressureDia} onChange={e=>setVitalsForm({...vitalsForm, bloodPressureDia:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="HR" value={vitalsForm.heartRate} onChange={e=>setVitalsForm({...vitalsForm, heartRate:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="RR" value={vitalsForm.respiratoryRate} onChange={e=>setVitalsForm({...vitalsForm, respiratoryRate:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="SpO2" value={vitalsForm.spo2} onChange={e=>setVitalsForm({...vitalsForm, spo2:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="Temp" value={vitalsForm.temperature} onChange={e=>setVitalsForm({...vitalsForm, temperature:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <input placeholder="Pain 0-10" value={vitalsForm.painScore} onChange={e=>setVitalsForm({...vitalsForm, painScore:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <select value={vitalsForm.consciousnessLevel} onChange={e=>setVitalsForm({...vitalsForm, consciousnessLevel:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs"><option>Alert</option><option>Verbal</option><option>Pain</option><option>Unresponsive</option></select>
                <input placeholder="Notes" value={vitalsForm.notes} onChange={e=>setVitalsForm({...vitalsForm, notes:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs sm:col-span-4" />
                <button type="submit" className="rounded-lg bg-teal-600 text-white px-4 py-2 text-xs font-bold sm:col-span-4">Record Vitals</button>
              </form>
              <div className="space-y-2">
                {(encounter.vitalsHistory||[]).slice().reverse().map((v,i)=>(
                  <div key={i} className="rounded-xl bg-white border border-slate-200 p-3 text-xs flex flex-wrap gap-3">
                    <span>BP {v.bloodPressureSys||"-"}/{v.bloodPressureDia||"-"}</span><span>HR {v.heartRate||"-"}</span><span>RR {v.respiratoryRate||"-"}</span><span>SpO2 {v.spo2||"-"}%</span><span>Temp {v.temperature||"-"}°F</span><span>Pain {v.painScore??"-"}/10</span><span>{v.consciousnessLevel}</span><span className="text-slate-500">{new Date(v.recordedAt||v.at||Date.now()).toLocaleString("en-IN")} • {v.recordedBy}</span><span className="text-slate-600">{v.notes}</span>
                  </div>
                ))}
                {(!encounter.vitalsHistory || encounter.vitalsHistory.length===0) && <div className="text-xs text-slate-400">No vitals recorded</div>}
              </div>
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-slate-700">Recent Vitals from EHR</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {(related.vitals||[]).slice(0,5).map((v,i)=><div key={i} className="border border-slate-100 rounded-lg p-2 bg-slate-50">BP {v.bloodPressureSys}/{v.bloodPressureDia} • HR {v.heartRate} • SpO2 {v.spo2}% • {new Date(v.recordedAt).toLocaleString()}</div>)}
                  {(related.vitals||[]).length===0 && <div className="text-slate-400">No prior vitals in system</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab==="Clinical Notes" && (
            <div className="space-y-4">
              <form onSubmit={handleNote} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <select value={noteForm.noteType} onChange={e=>setNoteForm({...noteForm, noteType:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"><option>Progress</option><option>Assessment</option><option>Reassessment</option><option>Procedure</option><option>Observation</option><option>Handover</option></select>
                <textarea value={noteForm.note} onChange={e=>setNoteForm({...noteForm, note:e.target.value})} rows={3} placeholder="Clinical note, assessment, diagnosis, treatment plan..." required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <button type="submit" className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-xs font-bold">Add Note</button>
              </form>
              <div className="space-y-2">
                {(encounter.clinicalNotes||[]).slice().reverse().map((n,i)=>(
                  <div key={i} className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="text-[11px] text-slate-500 flex justify-between"><span>{n.byName} ({n.byRole}) • {n.noteType || "Note"}</span><span>{new Date(n.at).toLocaleString("en-IN")}</span></div>
                    <div className="text-xs text-slate-800 mt-1 whitespace-pre-wrap">{n.note}</div>
                  </div>
                ))}
                {(encounter.clinicalNotes||[]).length===0 && <div className="text-xs text-slate-400">No clinical notes</div>}
              </div>
              <div className="mt-4 border-t pt-3">
                <h4 className="text-xs font-bold text-slate-700">Prior Clinical Notes (EHR)</h4>
                <div className="mt-2 space-y-2 text-xs">
                  {(related.clinicalNotes||[]).slice(0,5).map(n=><div key={n._id} className="border rounded-lg p-2 bg-slate-50"><div className="font-bold text-slate-800">{n.noteType} - {new Date(n.createdAt).toLocaleString()}</div><div className="text-slate-700">{n.assessment || n.diagnosis || n.chiefComplaint}</div><div className="text-[11px] text-slate-500">by {n.doctorName}</div></div>)}
                </div>
              </div>
            </div>
          )}

          {activeTab==="Orders" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
                <div className="font-bold text-amber-800">Doctor Orders (General)</div>
                <div className="mt-1 space-y-1">
                  {(related.doctorOrders||[]).slice(0,5).map(o=><div key={o._id} className="bg-white rounded-lg p-2 border border-amber-100"><div className="font-bold text-slate-800">{o.orderType}: {o.description}</div><div className="text-slate-600">{o.status}</div></div>)}
                  {(related.doctorOrders||[]).length===0 && <div className="text-amber-700">No general orders</div>}
                </div>
              </div>
              <div className="text-xs text-slate-500">Use Clinical Notes to document treatment instructions. For lab/imaging, use Diagnostics tab. For meds, use Medications tab.</div>
            </div>
          )}

          {activeTab==="Diagnostics" && (
            <div className="space-y-4">
              <form onSubmit={handleDiagOrder} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Order Diagnostic Test</h4>
                <select value={diagForm.testName} onChange={e=>setDiagForm({...diagForm, testName:e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white" required>
                  <option value="">Select test</option>
                  {diagnosticTests.slice(0,60).map(t=><option key={t._id} value={t.name}>{t.name} - {t.category} {t.price?`₹${t.price}`:""}</option>)}
                  <option value="CBC">CBC</option><option value="Blood glucose">Blood glucose</option><option value="Electrolytes">Electrolytes</option><option value="Renal function">Renal function</option><option value="Liver function">Liver function</option><option value="Cardiac markers">Cardiac markers</option><option value="Urinalysis">Urinalysis</option><option value="X-ray">X-ray</option><option value="CT">CT</option><option value="MRI">MRI</option><option value="Ultrasound">Ultrasound</option>
                </select>
                <div className="grid sm:grid-cols-2 gap-3">
                  <select value={diagForm.priority} onChange={e=>setDiagForm({...diagForm, priority:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"><option>STAT</option><option>Urgent</option><option>Routine</option></select>
                  <input value={diagForm.notes} onChange={e=>setDiagForm({...diagForm, notes:e.target.value})} placeholder="Clinical indication" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                </div>
                <button type="submit" className="rounded-lg bg-sky-600 text-white px-4 py-2 text-xs font-bold">Order Test</button>
              </form>
              <div className="space-y-2">
                {(related.diagnostics||[]).slice(0,10).map(d=><div key={d._id} className="rounded-xl bg-white border border-slate-200 p-3 text-xs"><div className="font-bold text-slate-900">{d.testName} <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 border text-[10px]">{d.status}</span> <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-50 border-amber-200 text-amber-700 text-[10px]">{d.priority}</span></div><div className="text-slate-500">{new Date(d.createdAt).toLocaleString()} • {d.category}</div></div>)}
              </div>
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">ER Diagnostic Orders</h4>
                {(encounter.diagnosticOrders||[]).map((o,i)=>{
                  const name = typeof o === 'string' ? o : o.testName || o.test?.name || o.orderNumber || o._id;
                  const prio = o.priority || "STAT";
                  const stat = o.status || "Requested";
                  return (
                    <div key={i} className="rounded-xl bg-sky-50/70 border border-sky-200 p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{name}</div>
                        <div className="text-[11px] text-slate-500">Order #{o.orderNumber || "—"} • {o.category || o.diagnosticDepartment || "Diagnostic"}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prio === "STAT" ? "bg-red-600 text-white border-red-700" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{prio}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold">{stat}</span>
                      </div>
                    </div>
                  );
                })}
                {(encounter.diagnosticOrders||[]).length===0 && <div className="text-slate-400">No ER orders yet</div>}
              </div>
            </div>
          )}

          {activeTab==="Medications" && (
            <div className="space-y-4">
              <form onSubmit={handlePrescription} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Emergency Prescription</h4>
                {rxForm.medications.map((m,idx)=>(
                  <div key={idx} className="grid sm:grid-cols-6 gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <input value={m.name} onChange={e=>{ const n=[...rxForm.medications]; n[idx].name=e.target.value; setRxForm({...rxForm, medications:n});}} placeholder="Medicine name *" required className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs sm:col-span-2" />
                    <input value={m.dosage} onChange={e=>{ const n=[...rxForm.medications]; n[idx].dosage=e.target.value; setRxForm({...rxForm, medications:n});}} placeholder="Dosage" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                    <input value={m.frequency} onChange={e=>{ const n=[...rxForm.medications]; n[idx].frequency=e.target.value; setRxForm({...rxForm, medications:n});}} placeholder="Frequency" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                    <input value={m.duration} onChange={e=>{ const n=[...rxForm.medications]; n[idx].duration=e.target.value; setRxForm({...rxForm, medications:n});}} placeholder="Duration" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                    <input value={m.instructions} onChange={e=>{ const n=[...rxForm.medications]; n[idx].instructions=e.target.value; setRxForm({...rxForm, medications:n});}} placeholder="Instructions" className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                    <button type="button" onClick={()=>setRxForm({...rxForm, medications: rxForm.medications.filter((_,i)=>i!==idx)})} className="text-red-600 text-xs">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={()=>setRxForm({...rxForm, medications:[...rxForm.medications, {name:"", dosage:"", frequency:"1-0-1", duration:"5 days", instructions:""}]})} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">+ Add Medicine</button>
                <input value={rxForm.diagnosis} onChange={e=>setRxForm({...rxForm, diagnosis:e.target.value})} placeholder="Diagnosis" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <textarea value={rxForm.advice} onChange={e=>setRxForm({...rxForm, advice:e.target.value})} placeholder="Advice" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <button type="submit" className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-bold shadow-xs">Prescribe & Send to Pharmacy</button>
              </form>
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Pharmacy Orders</h4>
                {(related.prescriptions||[]).slice(0,8).map(p=>(
                  <div key={p._id} className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{p.prescriptionNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.dispensingStatus === "dispensed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {p.dispensingStatus || p.status || "Pending"}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      {(p.medications||[]).map((m, idx)=>(
                        <span key={idx} className="inline-block bg-slate-100 px-2 py-0.5 rounded-md mr-1.5 mb-1 text-[11px]">
                          {m.name} {m.dosage ? `(${m.dosage})` : ""} - {m.frequency || "1-0-1"}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500">{new Date(p.createdAt).toLocaleString("en-IN")} • {formatDoctorName(p.digitalSignature?.signedByName, "ER Physician")}</div>
                  </div>
                ))}
                {(related.prescriptions||[]).length===0 && <div className="text-slate-400">No prescriptions recorded yet</div>}
              </div>
            </div>
          )}

          {activeTab==="Procedures" && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleProcedure} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Record Emergency Procedure</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Procedure Name *</label>
                    <input
                      value={procForm.procedureName}
                      onChange={e=>setProcForm({...procForm, procedureName: e.target.value})}
                      placeholder="e.g. Endotracheal Intubation, Central Line, Chest Tube, CPR"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Notes / Attending Staff</label>
                    <input
                      value={procForm.notes}
                      onChange={e=>setProcForm({...procForm, notes: e.target.value})}
                      placeholder="e.g. Performed under sterile conditions, no complications"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"
                    />
                  </div>
                </div>
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-xs">Record Procedure</button>
              </form>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>Recorded Procedures</span>
                  <span className="text-[11px] font-normal text-slate-500">({(encounter.procedures||[]).length})</span>
                </div>
                {(encounter.procedures||[]).length===0 ? (
                  <div className="text-slate-400 py-3">No procedures recorded yet for this encounter</div>
                ) : (
                  <div className="space-y-1.5">
                    {encounter.procedures.map((pr, i)=>(
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0"></span>
                        <span className="font-semibold text-xs">{pr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab==="Observation" && (
            <div className="space-y-4">
              <form onSubmit={handleObs} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Observation Notes</h4>
                <textarea value={obsForm.notes} onChange={e=>setObsForm({...obsForm, notes:e.target.value})} rows={3} placeholder="Observation findings, response to treatment..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                <select value={obsForm.status} onChange={e=>setObsForm({...obsForm, status:e.target.value})} className="rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white"><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                <button type="submit" className="rounded-lg bg-teal-600 text-white px-4 py-2 text-xs font-bold">Update Observation</button>
              </form>
              <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs">
                <div className="font-bold text-slate-800">Current Observation</div>
                <div className="mt-1 text-slate-700 whitespace-pre-wrap">{encounter.observation?.notes || "No observation notes"}</div>
                <div className="text-[11px] text-slate-500 mt-1">Started: {encounter.observation?.startedAt ? new Date(encounter.observation.startedAt).toLocaleString(): "-"} • Status: {encounter.observation?.status || "-"}</div>
              </div>
            </div>
          )}

          {activeTab==="Billing" && (
            <div className="space-y-3">
              {(related.billings||[]).length===0 ? <div className="text-xs text-slate-400">No billing records for this patient</div> : related.billings.slice(0,10).map(b=>(
                <div key={b._id} className="rounded-xl bg-white border border-slate-200 p-3 text-xs">
                  <div className="font-bold text-slate-900">{b.itemizedCharges?.map(c=>c.description).join(", ") || "Hospital Services"}</div>
                  <div className="text-slate-600">₹{b.totalAmount} • {b.paymentStatus} • {new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Emergency billing is auto-generated for consultation, diagnostics, pharmacy, admission, and discharge. View full billing at <Link to="/billing" className="underline font-bold">Billing</Link></div>
            </div>
          )}

          {activeTab==="Timeline" && (
            <div className="space-y-2">
              {(encounter.timeline||[]).slice().reverse().map((t,i)=>(
                <div key={i} className="flex gap-3 text-xs border-l-2 border-slate-200 pl-3 py-1">
                  <div className="min-w-[90px] font-mono text-slate-500">{new Date(t.at).toLocaleString("en-IN", {hour:"2-digit", minute:"2-digit", day:"2-digit", month:"short"})}</div>
                  <div><div className="font-bold text-slate-800">{t.event}</div><div className="text-slate-600">{t.details} <span className="text-slate-400">• {t.by}</span></div></div>
                </div>
              ))}
              <div className="mt-4 rounded-xl bg-white border border-slate-200 p-3">
                <h4 className="text-xs font-bold text-slate-800">Patient Timeline (EHR)</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-600">Timeline is auto-synced to patient record; view full at <Link to={`/patients`} className="underline">Patient Records</Link></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admission / Transfer / Discharge actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <form onSubmit={handleAdmit} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Request Admission</h3>
          <select value={admitForm.bedId} onChange={e=>setAdmitForm({...admitForm, bedId:e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white">
            <option value="">Auto-assign bed</option>
            {beds.filter(b=>b.status==="available").map(b=><option key={b._id} value={b._id}>{b.bedNumber} - {b.ward} (₹{b.dailyRate}/day)</option>)}
          </select>
          <input value={admitForm.ward} onChange={e=>setAdmitForm({...admitForm, ward:e.target.value})} placeholder="Ward preference (ICU, General, Private)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={admitForm.admissionReason} onChange={e=>setAdmitForm({...admitForm, admissionReason:e.target.value})} placeholder="Admission reason" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input type="date" value={admitForm.expectedDischargeDate||""} onChange={e=>setAdmitForm({...admitForm, expectedDischargeDate:e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <button type="submit" disabled={isDischarged} className="w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold disabled:opacity-50">Admit Patient</button>
        </form>

        <form onSubmit={handleTransfer} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Transfer</h3>
          <input value={transferForm.toLocation} onChange={e=>setTransferForm({...transferForm, toLocation:e.target.value})} placeholder="To location (ICU, Ward, OT, Radiology)" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <select value={transferForm.toBedId} onChange={e=>setTransferForm({...transferForm, toBedId:e.target.value})} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white">
            <option value="">Select target bed (optional)</option>
            {beds.filter(b=>b.status==="available").map(b=><option key={b._id} value={b._id}>{b.bedNumber} - {b.ward}</option>)}
          </select>
          <input value={transferForm.reason} onChange={e=>setTransferForm({...transferForm, reason:e.target.value})} placeholder="Reason" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <button type="submit" disabled={isDischarged} className="w-full rounded-lg bg-purple-600 text-white py-2 text-xs font-bold disabled:opacity-50">Transfer</button>
        </form>

        <form onSubmit={handleDischarge} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Discharge</h3>
          <input value={dischargeForm.finalDiagnosis} onChange={e=>setDischargeForm({...dischargeForm, finalDiagnosis:e.target.value})} placeholder="Final diagnosis *" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <textarea value={dischargeForm.treatmentSummary} onChange={e=>setDischargeForm({...dischargeForm, treatmentSummary:e.target.value})} placeholder="Treatment summary" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={dischargeForm.medications} onChange={e=>setDischargeForm({...dischargeForm, medications:e.target.value})} placeholder="Medications on discharge" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={dischargeForm.instructions} onChange={e=>setDischargeForm({...dischargeForm, instructions:e.target.value})} placeholder="Instructions" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={dischargeForm.followUp} onChange={e=>setDischargeForm({...dischargeForm, followUp:e.target.value})} placeholder="Follow-up" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <textarea value={dischargeForm.dischargeNotes} onChange={e=>setDischargeForm({...dischargeForm, dischargeNotes:e.target.value})} placeholder="Discharge notes" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <button type="submit" disabled={isDischarged} className="w-full rounded-lg bg-slate-900 text-white py-2 text-xs font-bold disabled:opacity-50">Discharge Patient</button>
          {isDischarged && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">Discharged by {encounter.discharge?.dischargedByName} at {encounter.discharge?.dischargedAt ? new Date(encounter.discharge.dischargedAt).toLocaleString() : ""}</div>}
        </form>
      </div>

      <div className="flex justify-between">
        <Link to="/emergency/queue" className="text-xs font-semibold text-slate-600 underline">← Back to Queue</Link>
        <button onClick={handlePrintEncounter} className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-xs">🖨 Print Encounter</button>
      </div>
    </div>
  );
}

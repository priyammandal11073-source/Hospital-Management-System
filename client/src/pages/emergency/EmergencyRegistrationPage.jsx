import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { searchPatientsForEmergency, createEmergencyEncounter } from "../../services/api.js";

export default function EmergencyRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState("");
  const [isUnknown, setIsUnknown] = useState(false);
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    gender: "Male",
    contactNumber: "",
    email: "",
    address: "",
    bloodGroup: "",
    dateOfBirth: "",
    arrivalMode: "walk_in",
    arrivalTime: new Date().toISOString().slice(0,16),
    chiefComplaint: "",
    knownAllergies: "",
    knownConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    priority: "urgent",
  });
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await searchPatientsForEmergency(searchQ.trim());
      setSearchResults(res.patients || []);
    } catch(e){ setSearchResults([]);} finally { setSearching(false); }
  };

  const selectExisting = (p) => {
    setExistingPatientId(p._id);
    setForm(f=>({...f, patientName: p.name, age: p.age, gender: p.gender, contactNumber: p.contactNumber, address: p.address || "", bloodGroup: p.bloodGroup || "", knownAllergies: (p.allergies||[]).join(", "), knownConditions: (p.medicalHistory||[]).join(", "), emergencyContactName: p.emergencyContact?.name || "", emergencyContactPhone: p.emergencyContact?.phone || ""}));
    setSearchResults([]);
    setSearchQ(`${p.name} (${p.patientId || p._id.slice(-6)})`);
  };

  const quickAutofillUnknown = (gen = "Male") => {
    const code = Math.floor(1000 + Math.random() * 9000);
    setIsUnknown(true);
    setExistingPatientId("");
    setSearchQ("");
    setSearchResults([]);
    setForm(f => ({
      ...f,
      patientName: `Unknown Trauma ${gen} #${code}`,
      age: "35",
      gender: gen,
      contactNumber: "0000000000",
      arrivalMode: "ambulance",
      priority: "critical",
      chiefComplaint: "Acute trauma resuscitation required — patient unidentifiable / unconscious upon arrival",
      address: "Unknown - Brought by EMS",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        existingPatientId: existingPatientId || undefined,
        patientName: form.patientName,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        contactNumber: form.contactNumber,
        email: form.email || undefined,
        address: form.address,
        bloodGroup: form.bloodGroup || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        isUnknown,
        arrivalMode: form.arrivalMode,
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        chiefComplaint: form.chiefComplaint,
        knownAllergies: form.knownAllergies,
        knownConditions: form.knownConditions,
        emergencyContact: { name: form.emergencyContactName, phone: form.emergencyContactPhone, relationship: form.emergencyContactRelationship },
        priority: form.priority,
      };
      const res = await createEmergencyEncounter(payload);
      navigate(`/emergency/patients/${res.encounter._id}`);
    } catch(err){ setError(err.response?.data?.message || "Registration failed"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Emergency Registration</h1>
          <p className="text-xs text-slate-500">Register arrival • Link existing record • Unknown patient support</p>
        </div>
        <Link to="/emergency/queue" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold">Back to Queue</Link>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>}

      {/* Search existing */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">Link Existing Patient (avoid duplicate)</h3>
        <div className="mt-2 flex gap-2">
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search by name / phone / MRN / ABHA" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs bg-slate-50" />
          <button type="button" onClick={handleSearch} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-bold">{searching?"Searching...":"Search"}</button>
          {existingPatientId && <button type="button" onClick={()=>{setExistingPatientId(""); setSearchQ("");}} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Clear link</button>}
        </div>
        {existingPatientId && <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">✓ Linked to existing patient. New emergency encounter will reuse this record.</div>}
        {searchResults.length>0 && (
          <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {searchResults.map(p=>(
              <button key={p._id} type="button" onClick={()=>selectExisting(p)} className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center">
                <div><div className="font-bold text-slate-900 text-xs">{p.name}</div><div className="text-[11px] text-slate-500">{p.patientId || p._id.slice(-6)} • {p.age}y/{p.gender} • {p.contactNumber}</div></div>
                <span className="text-xs font-bold text-rose-600">Link →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
          <label className="flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer">
            <input type="checkbox" checked={isUnknown} onChange={e=>setIsUnknown(e.target.checked)} className="rounded text-rose-600 h-4 w-4" />
            Unknown / Unconscious Patient (Minimal Registration)
          </label>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={()=>quickAutofillUnknown("Male")} className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg text-rose-800 font-semibold shadow-2xs transition">⚡ Quick Unknown Male</button>
            <button type="button" onClick={()=>quickAutofillUnknown("Female")} className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg text-rose-800 font-semibold shadow-2xs transition">⚡ Quick Unknown Female</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-[11px] font-bold text-slate-600">Patient Name { !isUnknown && "*"} </label><input value={form.patientName} onChange={e=>setForm({...form, patientName:e.target.value})} disabled={!!existingPatientId && !isUnknown} required={!isUnknown && !existingPatientId} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100" placeholder="Full name" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-[11px] font-bold text-slate-600">Age</label><input type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="30" /></div>
            <div><label className="text-[11px] font-bold text-slate-600">Gender</label><select value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="text-[11px] font-bold text-slate-600">Blood Group</label><select value={form.bloodGroup} onChange={e=>setForm({...form, bloodGroup:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value="">Select</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=> <option key={g} value={g}>{g}</option>)}</select></div>
          </div>
          <div><label className="text-[11px] font-bold text-slate-600">Phone</label><input value={form.contactNumber} onChange={e=>setForm({...form, contactNumber:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="10-digit" /></div>
          <div><label className="text-[11px] font-bold text-slate-600">Email</label><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="optional" /></div>
          <div><label className="text-[11px] font-bold text-slate-600">Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form, dateOfBirth:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
          <div><label className="text-[11px] font-bold text-slate-600">Address</label><input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="Residence" /></div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="text-[11px] font-bold text-slate-600">Arrival Time *</label><input type="datetime-local" value={form.arrivalTime} onChange={e=>setForm({...form, arrivalTime:e.target.value})} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" /></div>
          <div><label className="text-[11px] font-bold text-slate-600">Arrival Mode</label><select value={form.arrivalMode} onChange={e=>setForm({...form, arrivalMode:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"><option value="walk_in">Walk-in</option><option value="ambulance">Ambulance</option><option value="police">Police / Emergency Referral</option><option value="transfer">Hospital Transfer</option><option value="other">Other</option></select></div>
          <div><label className="text-[11px] font-bold text-slate-600">Priority</label><select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="less_urgent">Less Urgent</option><option value="non_urgent">Non-Urgent</option></select></div>
        </div>

        <div><label className="text-[11px] font-bold text-slate-600">Chief Complaint *</label><textarea value={form.chiefComplaint} onChange={e=>setForm({...form, chiefComplaint:e.target.value})} required rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="e.g., Acute chest pain radiating to left arm, SOB, sweating" /></div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-[11px] font-bold text-slate-600">Known Allergies</label><input value={form.knownAllergies} onChange={e=>setForm({...form, knownAllergies:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="e.g., Penicillin, Dust" /></div>
          <div><label className="text-[11px] font-bold text-slate-600">Known Medical Conditions</label><input value={form.knownConditions} onChange={e=>setForm({...form, knownConditions:e.target.value})} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="e.g., Hypertension, Diabetes" /></div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="sm:col-span-3 text-[11px] font-bold text-slate-600">Emergency Contact</div>
          <input value={form.emergencyContactName} onChange={e=>setForm({...form, emergencyContactName:e.target.value})} placeholder="Name" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={form.emergencyContactPhone} onChange={e=>setForm({...form, emergencyContactPhone:e.target.value})} placeholder="Phone" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
          <input value={form.emergencyContactRelationship} onChange={e=>setForm({...form, emergencyContactRelationship:e.target.value})} placeholder="Relationship" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold">Cancel</Link>
          <button disabled={loading} type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 text-xs font-bold">{loading ? "Registering..." : "Register Emergency"}</button>
        </div>
      </form>
    </div>
  );
}

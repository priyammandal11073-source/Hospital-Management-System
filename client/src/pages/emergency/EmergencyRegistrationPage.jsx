import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { searchPatientsForEmergency, createEmergencyEncounter } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

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
    arrivalTime: new Date().toISOString().slice(0, 16),
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
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectExisting = (p) => {
    setExistingPatientId(p._id);
    setForm((f) => ({
      ...f,
      patientName: p.name,
      age: p.age,
      gender: p.gender,
      contactNumber: p.contactNumber,
      address: p.address || "",
      bloodGroup: p.bloodGroup || "",
      knownAllergies: (p.allergies || []).join(", "),
      knownConditions: (p.medicalHistory || []).join(", "),
      emergencyContactName: p.emergencyContact?.name || "",
      emergencyContactPhone: p.emergencyContact?.phone || "",
    }));
    setSearchResults([]);
    setSearchQ(`${p.name} (${p.patientId || p._id.slice(-6)})`);
  };

  const quickAutofillUnknown = (gen = "Male") => {
    const code = Math.floor(1000 + Math.random() * 9000);
    setIsUnknown(true);
    setExistingPatientId("");
    setSearchQ("");
    setSearchResults([]);
    setForm((f) => ({
      ...f,
      patientName: `Unknown Trauma ${gen} #${code}`,
      age: "35",
      gender: gen,
      contactNumber: "0000000000",
      arrivalMode: "ambulance",
      priority: "critical",
      chiefComplaint: "Acute trauma resuscitation required — patient unidentifiable / unconscious upon arrival",
      address: "Unknown - Brought by EMS Emergency Ambulance",
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
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relationship: form.emergencyContactRelationship,
        },
        priority: form.priority,
      };
      const res = await createEmergencyEncounter(payload);
      navigate(`/emergency/patients/${res.encounter._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please verify required fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <Link to="/emergency/dashboard" className="hover:underline">Emergency Command</Link>
            <span>/</span>
            <span>Intake Registration</span>
          </div>
        }
        title="Emergency Fast-Track Registration"
        subtitle="Immediate clinical intake, duplicate patient check, ABHA linking, or rapid registration for unknown trauma patients."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            Level-1 Trauma Intake
          </span>
        }
        actions={
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-4 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>← Back to Queue</span>
          </Link>
        }
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")} className="font-bold text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* Patient Record Matcher Card */}
      <div className="rounded-2xl liquid-glass-card p-5 sm:p-6 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100/80">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Link Existing Hospital Patient Record
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Avoid duplicate electronic medical records by searching registered hospital patients.
            </p>
          </div>
          {existingPatientId && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-semibold">
              ✓ Record Linked
            </span>
          )}
        </div>

        <div className="flex gap-2.5">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search by patient name, contact number, MRN, or ABHA ID..."
            className="flex-1 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
          >
            {searching ? "Searching..." : "Search"}
          </button>
          {existingPatientId && (
            <button
              type="button"
              onClick={() => {
                setExistingPatientId("");
                setSearchQ("");
              }}
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition"
            >
              Clear Link
            </button>
          )}
        </div>

        {existingPatientId && (
          <div className="text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
            <span>✓ Linked to existing medical history. Encounter will synchronize directly with this patient.</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 divide-y divide-slate-100/80 border border-slate-200/80 rounded-xl overflow-hidden bg-white/70">
            {searchResults.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => selectExisting(p)}
                className="w-full text-left p-3 hover:bg-teal-50/40 transition flex justify-between items-center cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {p.patientId || p._id.slice(-6)} • {p.age}y/{p.gender} • 📞 {p.contactNumber || "No phone"}
                  </div>
                </div>
                <span className="text-xs font-semibold text-teal-800 hover:underline">Link Record →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Intake Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl liquid-glass-card p-5 sm:p-7 shadow-2xs space-y-6">
        {/* Unknown / Unconscious Patient Quick Action Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
          <label className="flex items-center gap-2.5 text-xs font-bold text-rose-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUnknown}
              onChange={(e) => setIsUnknown(e.target.checked)}
              className="rounded text-rose-600 h-4 w-4 focus:ring-rose-500"
            />
            <span>Unknown / Unconscious Patient (Minimal Resuscitation Intake)</span>
          </label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickAutofillUnknown("Male")}
              className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-100/80 rounded-lg text-rose-800 font-semibold shadow-2xs transition active:scale-95"
            >
              ⚡ Unknown Male
            </button>
            <button
              type="button"
              onClick={() => quickAutofillUnknown("Female")}
              className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-100/80 rounded-lg text-rose-800 font-semibold shadow-2xs transition active:scale-95"
            >
              ⚡ Unknown Female
            </button>
          </div>
        </div>

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <div className="border-b border-slate-100/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Patient Identification & Demographic Data
            </h4>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Patient Full Name {!isUnknown && <span className="text-rose-600">*</span>}
              </label>
              <input
                type="text"
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                disabled={!!existingPatientId && !isUnknown}
                required={!isUnknown && !existingPatientId}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs disabled:bg-slate-100 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-2 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Blood</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-2 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="10-digit primary mobile"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="Optional email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Residence Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="Current residential location"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Arrival Mode & Triage Priority */}
        <div className="space-y-4">
          <div className="border-b border-slate-100/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Arrival Details & Initial Clinical Triage Priority
            </h4>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Arrival Timestamp <span className="text-rose-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.arrivalTime}
                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Arrival Mode</label>
              <select
                value={form.arrivalMode}
                onChange={(e) => setForm({ ...form, arrivalMode: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
              >
                <option value="walk_in">Walk-in Ambulatory</option>
                <option value="ambulance">Emergency Ambulance (EMS)</option>
                <option value="police">Police / Trauma Referral</option>
                <option value="transfer">Inter-Hospital Transfer</option>
                <option value="other">Other Transport</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
              >
                <option value="critical">🔴 Critical (Level 1 Resuscitation)</option>
                <option value="urgent">🟠 Urgent (Level 2 STAT)</option>
                <option value="less_urgent">🔵 Less Urgent (Level 3)</option>
                <option value="non_urgent">🟢 Non-Urgent (Level 4)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Chief Complaint & Acute Symptoms <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={form.chiefComplaint}
              onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              required
              rows={2}
              className="w-full rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              placeholder="e.g. Severe crushing retrosternal chest pain radiating to left arm with diaphoresis and dyspnea..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Known Allergies</label>
              <input
                type="text"
                value={form.knownAllergies}
                onChange={(e) => setForm({ ...form, knownAllergies: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="e.g. Penicillin, NSAIDs, Peanuts, Latex"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Known Medical Conditions</label>
              <input
                type="text"
                value={form.knownConditions}
                onChange={(e) => setForm({ ...form, knownConditions: e.target.value })}
                className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                placeholder="e.g. CAD, Diabetes Mellitus Type 2, Hypertension"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Next-of-Kin Contact */}
        <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Emergency Contact / Next-of-Kin Information
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              placeholder="Contact Person Full Name"
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
            />
            <input
              type="text"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              placeholder="Primary Phone Number"
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
            />
            <input
              type="text"
              value={form.emergencyContactRelationship}
              onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })}
              placeholder="Relationship (e.g. Spouse, Parent)"
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100/80">
          <Link
            to="/emergency/queue"
            className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-5 py-2.5 text-xs font-semibold border border-slate-200/80 shadow-2xs transition"
          >
            Cancel
          </Link>
          <button
            disabled={loading}
            type="submit"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-6 py-2.5 text-xs font-bold shadow-sm shadow-teal-950/10 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Registering Encounter..." : "Complete Emergency Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}

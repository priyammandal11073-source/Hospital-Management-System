import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getBeds,
  createPatient,
  createAppointment,
  allocateBed,
  getDoctors,
} from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function EmergencyDeskPage() {
  const [emergencyBeds, setEmergencyBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Express Registration Form
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    contactNumber: "Emergency / Unknown",
    emergencyContactName: "",
    emergencyContactPhone: "",
    selectedBedId: "",
    selectedDoctorId: "",
    triageLevel: "Red - Resuscitation",
    chiefComplaint: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bedsRes, docsRes] = await Promise.all([
        getBeds({ ward: "Emergency & Trauma" }),
        getDoctors(),
      ]);
      const beds = (bedsRes.beds || []).filter((b) => b.status === "available");
      setEmergencyBeds(beds);
      setDoctors(docsRes.doctors || []);
      if (beds.length > 0) setForm((prev) => ({ ...prev, selectedBedId: beds[0]._id }));
      if ((docsRes.doctors || []).length > 0) setForm((prev) => ({ ...prev, selectedDoctorId: docsRes.doctors[0]._id }));
    } catch (err) {
      setError("Failed to load emergency resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExpressTriage = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age) {
      alert("Patient Name and Age are required for emergency intake.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Create Patient Record
      const patRes = await createPatient({
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        contactNumber: form.contactNumber.trim() || "Emergency Triage",
        emergencyContact: {
          name: form.emergencyContactName || "Brought by Ambulance",
          phone: form.emergencyContactPhone || "108 / 112",
          relationship: "Emergency Contact",
        },
      });
      const patientId = patRes.patient?._id;

      // 2. If bed selected, admit immediately
      if (form.selectedBedId && form.selectedDoctorId) {
        await allocateBed(form.selectedBedId, {
          patient: patientId,
          attendingDoctor: form.selectedDoctorId,
          admissionReason: `EMERGENCY [${form.triageLevel}]: ${form.chiefComplaint || "Acute trauma / emergency resuscitation"}`,
        });
      }

      setSuccessMsg(`Emergency intake successful! Patient admitted under triage clearance.`);
      setForm({
        name: "",
        age: "",
        gender: "Male",
        contactNumber: "Emergency / Unknown",
        emergencyContactName: "",
        emergencyContactPhone: "",
        selectedBedId: emergencyBeds[0]?._id || "",
        selectedDoctorId: doctors[0]?._id || "",
        triageLevel: "Red - Resuscitation",
        chiefComplaint: "",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to process emergency intake");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white/85 backdrop-blur-xl border border-rose-200/80 p-6 sm:p-8 text-slate-900 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 px-2.5 py-1 text-xs font-semibold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>24/7 Trauma & Emergency Center</span>
              <span className="opacity-40">•</span>
              <span>Express Triage Desk</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Emergency Front Desk Operations
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Rapid intake console for acute trauma, ambulance arrivals, and resuscitation bed allocation.
            </p>
          </div>

          <div className="text-center rounded-xl bg-slate-50/80 border border-slate-200/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Trauma Bays</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{emergencyBeds.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for immediate triage</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Express Intake Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🚨</span>
            <span>Express Emergency Intake Form</span>
          </h2>

          <form onSubmit={handleExpressTriage} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Patient Full Name (or "Unknown Male/Female"): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe / Trauma Victim #4"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Estimated Age: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="e.g. 35"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender:</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-semibold focus:border-red-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Triage Acuity Level:</label>
                <select
                  value={form.triageLevel}
                  onChange={(e) => setForm({ ...form, triageLevel: e.target.value })}
                  className="w-full rounded-xl border border-red-200 bg-red-50/50 p-2.5 text-xs font-black text-red-800 focus:outline-none"
                >
                  <option value="Red - Resuscitation">🔴 Red - Resuscitation (Immediate)</option>
                  <option value="Orange - Emergent">🟠 Orange - Emergent (&lt; 15 mins)</option>
                  <option value="Yellow - Urgent">🟡 Yellow - Urgent (&lt; 60 mins)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trauma Bay / Bed:</label>
                <select
                  value={form.selectedBedId}
                  onChange={(e) => setForm({ ...form, selectedBedId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-bold focus:border-red-500 focus:outline-none"
                >
                  {emergencyBeds.map((bed) => (
                    <option key={bed._id} value={bed._id}>
                      {bed.bedNumber} ({bed.ward})
                    </option>
                  ))}
                  {emergencyBeds.length === 0 && <option value="">No trauma bays available</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Physician on Duty:</label>
                <select
                  value={form.selectedDoctorId}
                  onChange={(e) => setForm({ ...form, selectedDoctorId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-medium focus:border-red-500 focus:outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {formatDoctorName(d.name)} ({d.department || d.specialization})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contact / Accompanying Person:</label>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                  placeholder="e.g. Paramedic Dave / Relative"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Chief Trauma Complaint / Observation:</label>
              <textarea
                rows={2}
                value={form.chiefComplaint}
                onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                placeholder="e.g. RTA victim, blunt chest trauma, unconscious, vitals unstable..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Allocating Bay..." : "⚡ Admit to Trauma Bay Now"}
              </button>
            </div>
          </form>
        </div>

        {/* Emergency Resources Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Helplines</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Hospital Emergency:</span>
                <span className="font-mono font-bold text-red-600">108 / 112</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Trauma ICU Extension:</span>
                <span className="font-mono font-bold text-slate-700">EXT 402</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Blood Bank Desk:</span>
                <span className="font-mono font-bold text-slate-700">EXT 115</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trauma Bay Status</h3>
            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {emergencyBeds.map((b) => (
                <li key={b._id} className="flex items-center justify-between py-2">
                  <span className="font-mono font-bold text-slate-800">{b.bedNumber}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-300">
                    Ready
                  </span>
                </li>
              ))}
              {emergencyBeds.length === 0 && (
                <li className="py-4 text-center text-xs text-rose-500 font-semibold">
                  All trauma bays occupied! Alert Head of Nursing.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

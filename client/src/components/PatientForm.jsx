import { useState, useEffect } from "react";
import { createPatient, updatePatient, checkDuplicatePatient } from "../services/api.js";
import { Input, Button, Badge, Card } from "../components/ui/index.js";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const toCommaSeparatedText = (items) => (items || []).join(", ");

const toStringArray = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function PatientForm({ patient, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    name: patient?.name || "",
    age: patient?.age ?? "",
    gender: patient?.gender || "",
    contactNumber: patient?.contactNumber || "",
    email: patient?.email || "",
    address: patient?.address || "",
    bloodGroup: patient?.bloodGroup || "",
    abhaId: patient?.abhaId || "",
    allergies: toCommaSeparatedText(patient?.allergies),
    medicalHistory: toCommaSeparatedText(patient?.medicalHistory),
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  useEffect(() => {
    if (patient) return;
    const phone = formData.contactNumber.trim();
    const email = formData.email.trim();
    const name = formData.name.trim();

    if (phone.length < 5 && email.length < 5 && name.length < 3) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await checkDuplicatePatient({ phone, email, name });
        setDuplicates(res.matches || []);
      } catch (err) {
        console.error("Duplicate check error:", err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.contactNumber, formData.email, formData.name, patient]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.age || !formData.gender || !formData.contactNumber) {
      setError("Name, age, gender, and contact number are required.");
      return;
    }

    const age = Number(formData.age);

    if (!Number.isInteger(age) || age < 0) {
      setError("Age must be a non-negative whole number.");
      return;
    }

    const patientData = {
      name: formData.name.trim(),
      age,
      gender: formData.gender,
      contactNumber: formData.contactNumber.trim(),
      allergies: toStringArray(formData.allergies),
      medicalHistory: toStringArray(formData.medicalHistory),
    };

    if (formData.email.trim()) patientData.email = formData.email.trim();
    if (formData.address.trim()) patientData.address = formData.address.trim();
    if (formData.bloodGroup) patientData.bloodGroup = formData.bloodGroup;
    if (formData.abhaId.trim()) patientData.abhaId = formData.abhaId.trim();

    setIsSubmitting(true);

    try {
      if (patient) {
        await updatePatient(patient._id, patientData);
      } else {
        await createPatient(patientData);
      }

      onSuccess();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save patient details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {duplicates.length > 0 && (
        <Card title="Potential Duplicate Patient Record Found" subtitle="One or more existing patients match the entered contact, email, or name. Avoid creating duplicate records." className="border-amber-300/60 bg-amber-50">
          <ul className="mt-2 divide-y divide-amber-200/60 rounded-lg bg-white/70 p-2 text-xs">
            {duplicates.map((d) => (
              <li key={d._id} className="py-1.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{d.name}</span>
                  <span className="text-slate-500 text-[11px] ml-2">
                    {d.age}y • {d.gender} • 📞 {d.contactNumber}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                  {d.patientId || d.abhaId || "Existing File"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Name *</label>
          <Input
            label=" "
            name="name"
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            required
            autoCapitalize="words"
            autoComplete="name"
            enterKeyHint="next"
            value={formData.name}
            error={!formData.name && "Required"}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Age *</label>
          <Input
            type="number"
            min="0"
            name="age"
            onChange={handleChange}
            required
            inputMode="numeric"
            enterKeyHint="next"
            value={formData.age}
            error={!formData.age && "Required"}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Gender *</label>
          <select
            name="gender"
            onChange={handleChange}
            required
            value={formData.gender}
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-semibold text-slate-900 focus:border-teal-600 focus:outline-none"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Contact number *</label>
          <div className="relative mt-1 flex rounded-xl shadow-2xs">
            <span className="inline-flex min-h-[44px] items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 px-3.5 text-xs font-bold text-slate-600">
              +91
            </span>
            <input
              className="w-full min-h-[44px] rounded-r-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
              name="contactNumber"
              onChange={handleChange}
              placeholder="98765 43210"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              value={formData.contactNumber}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Email</label>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            name="email"
            onChange={handleChange}
            placeholder="rahul.sharma@example.com"
            value={formData.email}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Blood group</label>
          <select
            name="bloodGroup"
            onChange={handleChange}
            value={formData.bloodGroup}
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-semibold text-slate-900 focus:border-teal-600 focus:outline-none"
          >
            <option value="">Select blood group</option>
            {bloodGroups.map((bloodGroup) => (
              <option key={bloodGroup} value={bloodGroup}>
                {bloodGroup}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:col-span-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">ABHA number (Ayushman Bharat, optional)</label>
          <Input
            name="abhaId"
            onChange={handleChange}
            placeholder="e.g. 14-8891-2345-6789 or username@abdm"
            enterKeyHint="next"
            value={formData.abhaId}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Address</label>
        <textarea
          className="mt-1 w-full min-h-[72px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
          name="address"
          onChange={handleChange}
          placeholder="e.g. 123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038"
          rows="2"
          autoComplete="street-address"
          value={formData.address}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Allergies</label>
        <Input
          name="allergies"
          onChange={handleChange}
          placeholder="e.g. Penicillin, Peanuts"
          enterKeyHint="next"
          value={formData.allergies}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Medical history</label>
        <Input
          name="medicalHistory"
          onChange={handleChange}
          placeholder="e.g. Asthma, Diabetes"
          enterKeyHint="done"
          value={formData.medicalHistory}
        />
      </div>

      {isCheckingDuplicates && (
        <p className="text-xs text-slate-500">Checking for duplicate records…</p>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      <div
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
        className="sticky bottom-0 -mx-5 -mb-7 sm:mx-0 sm:mb-0 p-4 sm:p-0 bg-white/95 backdrop-blur-xs border-t border-slate-200/80 sm:border-t-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 z-10"
      >
        <Button
          variant="outline"
          onClick={onCancel}
          type="button"
          className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          type="submit"
          className="w-full sm:w-auto min-h-[44px] rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
        >
          {isSubmitting ? "Saving…" : patient ? "Update patient" : "Add patient"}
        </Button>
      </div>
    </form>
  );
}

export default PatientForm;

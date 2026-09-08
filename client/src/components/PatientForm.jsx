import { useState } from "react";
import { createPatient, updatePatient } from "../services/api.js";

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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="name"
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            required
            value={formData.name}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Age *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            min="0"
            name="age"
            onChange={handleChange}
            required
            type="number"
            value={formData.age}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Gender *
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="gender"
            onChange={handleChange}
            required
            value={formData.gender}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Contact number *
          <div className="relative mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
              +91
            </span>
            <input
              className="w-full rounded-r-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              name="contactNumber"
              onChange={handleChange}
              placeholder="98765 43210"
              required
              type="tel"
              value={formData.contactNumber}
            />
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="email"
            onChange={handleChange}
            placeholder="rahul.sharma@example.com"
            type="email"
            value={formData.email}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Blood group
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="bloodGroup"
            onChange={handleChange}
            value={formData.bloodGroup}
          >
            <option value="">Select blood group</option>
            {bloodGroups.map((bloodGroup) => (
              <option key={bloodGroup} value={bloodGroup}>
                {bloodGroup}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          ABHA number (Ayushman Bharat, optional)
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="abhaId"
            onChange={handleChange}
            placeholder="e.g. 14-8891-2345-6789 or username@abdm"
            value={formData.abhaId}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Address
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="address"
          onChange={handleChange}
          placeholder="e.g. 123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038"
          rows="2"
          value={formData.address}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Allergies
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="allergies"
          onChange={handleChange}
          placeholder="e.g. Penicillin, Peanuts"
          value={formData.allergies}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Medical history
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="medicalHistory"
          onChange={handleChange}
          placeholder="e.g. Asthma, Diabetes"
          value={formData.medicalHistory}
        />
      </label>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : patient ? "Update patient" : "Add patient"}
        </button>
      </div>
    </form>
  );
}

export default PatientForm;

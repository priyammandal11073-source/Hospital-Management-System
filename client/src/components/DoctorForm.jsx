import { useState } from "react";
import { createDoctor, updateDoctor } from "../services/api.js";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const toStringArray = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function DoctorForm({ doctor, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    name: doctor?.name || "",
    specialization: doctor?.specialization || "",
    department: doctor?.department || "",
    contactNumber: doctor?.contactNumber || "",
    email: doctor?.email || "",
    yearsOfExperience: doctor?.yearsOfExperience ?? "",
    availableDays: doctor?.availableDays || [],
    availableTimeSlots: (doctor?.availableTimeSlots || []).join(", "),
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const toggleDay = (day) => {
    setFormData((currentData) => ({
      ...currentData,
      availableDays: currentData.availableDays.includes(day)
        ? currentData.availableDays.filter((availableDay) => availableDay !== day)
        : [...currentData.availableDays, day],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.specialization ||
      !formData.department ||
      !formData.contactNumber ||
      !formData.email
    ) {
      setError("Name, specialization, department, contact number, and email are required.");
      return;
    }

    const doctorData = {
      name: formData.name.trim(),
      specialization: formData.specialization.trim(),
      department: formData.department.trim(),
      contactNumber: formData.contactNumber.trim(),
      email: formData.email.trim(),
      availableDays: formData.availableDays,
      availableTimeSlots: toStringArray(formData.availableTimeSlots),
    };

    if (formData.yearsOfExperience !== "") {
      const yearsOfExperience = Number(formData.yearsOfExperience);

      if (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0) {
        setError("Years of experience must be a non-negative whole number.");
        return;
      }

      doctorData.yearsOfExperience = yearsOfExperience;
    }

    setIsSubmitting(true);

    try {
      if (doctor) {
        await updateDoctor(doctor._id, doctorData);
      } else {
        await createDoctor(doctorData);
      }

      onSuccess();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save doctor details.");
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
            required
            value={formData.name}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Specialization *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="specialization"
            onChange={handleChange}
            required
            value={formData.specialization}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Department *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="department"
            onChange={handleChange}
            required
            value={formData.department}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Contact number *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="contactNumber"
            onChange={handleChange}
            required
            type="tel"
            value={formData.contactNumber}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={formData.email}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Years of experience
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            min="0"
            name="yearsOfExperience"
            onChange={handleChange}
            type="number"
            value={formData.yearsOfExperience}
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Available days</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((day) => (
            <label className="flex items-center gap-2 text-sm text-slate-700" key={day}>
              <input
                checked={formData.availableDays.includes(day)}
                onChange={() => toggleDay(day)}
                type="checkbox"
              />
              {day}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-slate-700">
        Available time slots
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="availableTimeSlots"
          onChange={handleChange}
          placeholder="e.g. 09:00-12:00, 14:00-17:00"
          value={formData.availableTimeSlots}
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
          {isSubmitting ? "Saving..." : doctor ? "Update doctor" : "Add doctor"}
        </button>
      </div>
    </form>
  );
}

export default DoctorForm;

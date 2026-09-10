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
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Name *
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
            name="name"
            onChange={handleChange}
            placeholder="e.g. Rajesh Sharma"
            required
            value={formData.name}
          />
        </label>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Specialization *
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
            name="specialization"
            onChange={handleChange}
            placeholder="e.g. Cardiology"
            required
            value={formData.specialization}
          />
        </label>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Department *
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
            name="department"
            onChange={handleChange}
            placeholder="e.g. OPD & Cardiac Sciences"
            required
            value={formData.department}
          />
        </label>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Contact number *
          <div className="relative mt-1 flex rounded-xl shadow-2xs">
            <span className="inline-flex min-h-[44px] items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3.5 text-sm text-slate-500">
              +91
            </span>
            <input
              className="w-full min-h-[44px] rounded-r-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
              name="contactNumber"
              onChange={handleChange}
              placeholder="98765 43210"
              required
              type="tel"
              value={formData.contactNumber}
            />
          </div>
        </label>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Email *
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
            name="email"
            onChange={handleChange}
            placeholder="dr.rajesh@hospital.com"
            required
            type="email"
            value={formData.email}
          />
        </label>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Years of experience
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
            min="0"
            name="yearsOfExperience"
            onChange={handleChange}
            placeholder="e.g. 15"
            type="number"
            value={formData.yearsOfExperience}
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-bold text-slate-800 uppercase tracking-wider">Available days</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((day) => (
            <label
              className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-teal-50/50 transition"
              key={day}
            >
              <input
                className="h-4 w-4 text-teal-600 rounded"
                checked={formData.availableDays.includes(day)}
                onChange={() => toggleDay(day)}
                type="checkbox"
              />
              {day}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
        Available time slots
        <input
          className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
          name="availableTimeSlots"
          onChange={handleChange}
          placeholder="e.g. 09:00-12:00, 14:00-17:00"
          value={formData.availableTimeSlots}
        />
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-bold text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <button
          className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="w-full sm:w-auto min-h-[44px] rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition shadow-2xs"
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

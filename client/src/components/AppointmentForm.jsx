import { useEffect, useMemo, useState } from "react";
import {
  createAppointment,
  getDoctors,
  getPatients,
} from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import PaymentMethodSelect from "./PaymentMethodSelect.jsx";
import UpiPaymentBox from "./UpiPaymentBox.jsx";

function AppointmentForm({ onCancel, onSuccess }) {
  const { user } = useAuth();
  if (user?.role === "nurse") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        <p className="font-bold">⚠️ Access Restricted</p>
        <p className="mt-1">Nurses do not have permission to book new patient appointments. Please contact front desk reception.</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Close
        </button>
      </div>
    );
  }

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // After successful booking, hold the new billingId to show payment UI
  const [createdBillingId, setCreatedBillingId] = useState(null);
  const [createdBilling, setCreatedBilling] = useState(null);

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    appointmentDate: "",
    timeSlot: "",
    reasonForVisit: "",
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchOptions = async () => {
      try {
        const [patientData, doctorData] = await Promise.all([
          getPatients("", 1, 100),
          getDoctors(),
        ]);

        if (isCurrentRequest) {
          setPatients(patientData.patients);
          setDoctors(doctorData.doctors);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load booking options.");
        }
      } finally {
        if (isCurrentRequest) setIsLoadingOptions(false);
      }
    };

    fetchOptions();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.contactNumber.toLowerCase().includes(query)
    );
  }, [patients, patientSearch]);

  const selectedDoctor = doctors.find((doctor) => doctor._id === formData.doctor);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !formData.patient ||
      !formData.doctor ||
      !formData.appointmentDate ||
      !formData.timeSlot.trim() ||
      !formData.reasonForVisit.trim()
    ) {
      setError("Patient, doctor, date, time slot, and reason for visit are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createAppointment({
        ...formData,
        timeSlot: formData.timeSlot.trim(),
        reasonForVisit: formData.reasonForVisit.trim(),
        paymentMethod,
      });

      // If UPI is selected show inline payment; otherwise signal success
      if (paymentMethod === "upi" && res.billingId) {
        // Build a minimal billing stub so UpiPaymentBox can render
        setCreatedBillingId(res.billingId);
        setCreatedBilling({
          _id: res.billingId,
          totalAmount: 500, // OPD fee — will be refreshed after payment
          paymentStatus: "pending",
          paymentMethod: "upi",
        });
      } else {
        onSuccess();
      }
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setError("This time slot is already booked for this doctor. Please choose another slot.");
      } else {
        setError(requestError.response?.data?.message || "Unable to book appointment.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── After successful booking with UPI ──────────────────────────────────────
  if (createdBillingId) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="font-semibold text-emerald-800 text-sm">
            ✅ Appointment booked! Complete UPI payment below.
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Your appointment is confirmed. Scan the QR or click to launch your UPI app.
          </p>
        </div>

        <UpiPaymentBox
          billing={createdBilling}
          onPaymentSuccess={() => onSuccess()}
          isPatient={false}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Pay later & close
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingOptions) {
    return <p className="py-8 text-center text-slate-600">Loading patients and doctors...</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        Search patient
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => setPatientSearch(event.target.value)}
          placeholder="Search by name or contact number"
          value={patientSearch}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Patient *
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="patient"
          onChange={handleChange}
          required
          value={formData.patient}
        >
          <option value="">Select patient</option>
          {filteredPatients.map((patient) => (
            <option key={patient._id} value={patient._id}>
              {patient.name} — {patient.contactNumber}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Doctor *
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="doctor"
          onChange={handleChange}
          required
          value={formData.doctor}
        >
          <option value="">Select doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor._id} value={doctor._id}>
              Dr. {doctor.name} — {doctor.specialization}
            </option>
          ))}
        </select>
      </label>

      {selectedDoctor && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Dr. {selectedDoctor.name}'s availability</p>
          <p className="mt-1">
            <span className="font-medium">Days: </span>
            {selectedDoctor.availableDays?.join(", ") || "Not set"}
          </p>
          <p className="mt-1">
            <span className="font-medium">Time slots: </span>
            {selectedDoctor.availableTimeSlots?.join(", ") || "Not set"}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Appointment date *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="appointmentDate"
            onChange={handleChange}
            required
            type="date"
            value={formData.appointmentDate}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Time slot *
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            list="doctor-time-slots"
            name="timeSlot"
            onChange={handleChange}
            placeholder="e.g. 10:00-10:30"
            required
            value={formData.timeSlot}
          />
          <datalist id="doctor-time-slots">
            {selectedDoctor?.availableTimeSlots?.map((slot) => (
              <option key={slot} value={slot} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Reason for visit *
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          name="reasonForVisit"
          onChange={handleChange}
          required
          rows="3"
          value={formData.reasonForVisit}
        />
      </label>

      {/* Payment Method */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <PaymentMethodSelect
          value={paymentMethod}
          onChange={setPaymentMethod}
          label="OPD Payment Method"
        />
        <p className="mt-2 text-xs text-slate-500">
          OPD consultation fee: <strong>₹500</strong>. An invoice will be automatically generated.
        </p>
      </div>

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
          {isSubmitting ? "Booking..." : "Book appointment"}
        </button>
      </div>
    </form>
  );
}

export default AppointmentForm;

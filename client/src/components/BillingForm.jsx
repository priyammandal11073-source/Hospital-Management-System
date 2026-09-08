import { useEffect, useMemo, useState } from "react";
import { createBilling, getAppointments } from "../services/api.js";

const emptyCharge = { description: "", cost: "" };

function BillingForm({ onCancel, onSuccess }) {
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [charges, setCharges] = useState([{ ...emptyCharge }]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchCompletedAppointments = async () => {
      try {
        const data = await getAppointments({ status: "completed" });
        if (isCurrentRequest) setAppointments(data.appointments);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load completed appointments.");
        }
      } finally {
        if (isCurrentRequest) setIsLoadingAppointments(false);
      }
    };

    fetchCompletedAppointments();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const selectedAppointment = appointments.find((appointment) => appointment._id === appointmentId);

  const total = useMemo(
    () => charges.reduce((sum, charge) => sum + (Number(charge.cost) || 0), 0),
    [charges]
  );

  const updateCharge = (index, field, value) => {
    setCharges((currentCharges) =>
      currentCharges.map((charge, chargeIndex) =>
        chargeIndex === index ? { ...charge, [field]: value } : charge
      )
    );
  };

  const removeCharge = (index) => {
    setCharges((currentCharges) => currentCharges.filter((_, chargeIndex) => chargeIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedAppointment?.patient?._id) {
      setError("Please select a completed appointment with a valid patient.");
      return;
    }

    if (charges.length === 0) {
      setError("Add at least one itemized charge.");
      return;
    }

    const hasInvalidCharge = charges.some(
      (charge) =>
        !charge.description.trim() ||
        charge.cost === "" ||
        Number.isNaN(Number(charge.cost)) ||
        Number(charge.cost) < 0
    );

    if (hasInvalidCharge) {
      setError("Each charge needs a description and a non-negative cost.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createBilling({
        patient: selectedAppointment.patient._id,
        appointment: selectedAppointment._id,
        itemizedCharges: charges.map((charge) => ({
          description: charge.description.trim(),
          cost: Number(charge.cost),
        })),
      });
      onSuccess();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create billing record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAppointments) {
    return <p className="py-8 text-center text-slate-600">Loading completed appointments...</p>;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        Completed appointment *
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          onChange={(event) => setAppointmentId(event.target.value)}
          required
          value={appointmentId}
        >
          <option value="">Select appointment</option>
          {appointments.map((appointment) => (
            <option key={appointment._id} value={appointment._id}>
              {appointment.patient?.name || "Unknown patient"} — {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ({appointment.timeSlot})
            </option>
          ))}
        </select>
      </label>

      {selectedAppointment && (
        <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-medium">Patient: </span>
          {selectedAppointment.patient?.name || "Unknown patient"}
          {selectedAppointment.patient?.contactNumber && ` — ${selectedAppointment.patient.contactNumber}`}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-slate-800">Itemized charges</h3>
          <button
            className="rounded-md border border-blue-600 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
            onClick={() => setCharges((currentCharges) => [...currentCharges, { ...emptyCharge }])}
            type="button"
          >
            + Add charge
          </button>
        </div>

        <div className="space-y-3">
          {charges.map((charge, index) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]" key={index}>
              <input
                aria-label={`Charge ${index + 1} description`}
                className="rounded-md border border-slate-300 px-3 py-2"
                onChange={(event) => updateCharge(index, "description", event.target.value)}
                placeholder="Description"
                value={charge.description}
              />
              <input
                aria-label={`Charge ${index + 1} cost`}
                className="rounded-md border border-slate-300 px-3 py-2"
                min="0"
                onChange={(event) => updateCharge(index, "cost", event.target.value)}
                placeholder="Cost"
                step="0.01"
                type="number"
                value={charge.cost}
              />
              <button
                aria-label={`Remove charge ${index + 1}`}
                className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => removeCharge(index)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-right text-lg font-semibold text-slate-800">
          Estimated total: ₹{total.toFixed(2)}
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
          {isSubmitting ? "Creating..." : "Create bill"}
        </button>
      </div>
    </form>
  );
}

export default BillingForm;

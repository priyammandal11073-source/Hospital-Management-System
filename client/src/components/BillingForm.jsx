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
      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
        Completed appointment *
        <select
          className="mt-1 w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-hidden"
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
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700">
          <span className="font-bold text-slate-900">Patient: </span>
          {selectedAppointment.patient?.name || "Unknown patient"}
          {selectedAppointment.patient?.contactNumber && ` — 📞 ${selectedAppointment.patient.contactNumber}`}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized charges</h3>
          <button
            className="min-h-[36px] rounded-xl border border-teal-600 px-3.5 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 transition"
            onClick={() => setCharges((currentCharges) => [...currentCharges, { ...emptyCharge }])}
            type="button"
          >
            + Add charge
          </button>
        </div>

        <div className="space-y-3">
          {charges.map((charge, index) => (
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_10rem_auto]" key={index}>
              <input
                aria-label={`Charge ${index + 1} description`}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
                onChange={(event) => updateCharge(index, "description", event.target.value)}
                placeholder="Description"
                value={charge.description}
              />
              <input
                aria-label={`Charge ${index + 1} cost`}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:outline-hidden"
                min="0"
                onChange={(event) => updateCharge(index, "cost", event.target.value)}
                placeholder="Cost (₹)"
                step="0.01"
                type="number"
                value={charge.cost}
              />
              <button
                aria-label={`Remove charge ${index + 1}`}
                className="min-h-[44px] rounded-xl border border-red-200 sm:border-0 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                onClick={() => removeCharge(index)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-right text-base sm:text-lg font-bold text-slate-900 font-mono">
          Estimated total: ₹{total.toFixed(2)}
        </p>
      </div>

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
          {isSubmitting ? "Creating..." : "Create bill"}
        </button>
      </div>
    </form>
  );
}

export default BillingForm;

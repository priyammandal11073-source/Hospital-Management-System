import { useEffect, useMemo, useState } from "react";
import { createBilling, getAppointments } from "../services/api.js";
import { Input, Button } from "../components/ui/index.js";

const emptyCharge = { description: "", cost: "" };

/**
 * BillingForm – Emil Kowalski Polish
 * Features:
 * - Tone-on-tone input styling with instant focus rings
 * - Tactile active press response on all buttons (scale 0.97)
 * - Clear visual hierarchy and tabular figures for invoice tally
 */
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
    return <p className="py-8 text-center text-slate-500 font-medium text-xs">Loading completed appointments…</p>;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
          Completed Appointment *
        </label>
        <select
          onChange={(event) => setAppointmentId(event.target.value)}
          required
          value={appointmentId}
          className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
        >
          <option value="">Select completed appointment</option>
          {appointments.map((appointment) => (
            <option key={appointment._id} value={appointment._id}>
              {appointment.patient?.name || "Unknown patient"} — {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ({appointment.timeSlot})
            </option>
          ))}
        </select>
      </div>

      {selectedAppointment && (
        <div className="rounded-2xl bg-teal-50/60 border border-teal-200/60 p-4 text-xs text-teal-900 flex items-center justify-between">
          <div>
            <span className="font-extrabold text-teal-950">Patient: </span>
            {selectedAppointment.patient?.name || "Unknown patient"}
          </div>
          {selectedAppointment.patient?.contactNumber && (
            <span className="font-mono font-bold text-teal-800">
              📞 {selectedAppointment.patient.contactNumber}
            </span>
          )}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Itemized Charges & Services
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCharges((currentCharges) => [...currentCharges, { ...emptyCharge }])}
            type="button"
            className="active:scale-[0.96] transition-transform duration-150 text-xs"
          >
            + Add Charge
          </Button>
        </div>

        <div className="space-y-2.5">
          {charges.map((charge, index) => (
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_10rem_auto]" key={index}>
              <Input
                aria-label={`Charge ${index + 1} description`}
                placeholder="Service or consultation description"
                value={charge.description}
                onChange={(event) => updateCharge(index, "description", event.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:bg-white focus:outline-none"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                aria-label={`Charge ${index + 1} cost`}
                placeholder="Cost (₹)"
                value={charge.cost}
                onChange={(event) => updateCharge(index, "cost", event.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-mono focus:border-teal-600 focus:bg-white focus:outline-none"
              />
              <Button
                variant="danger"
                size="sm"
                aria-label={`Remove charge ${index + 1}`}
                onClick={() => removeCharge(index)}
                type="button"
                className="min-h-[44px] rounded-xl border border-rose-200 sm:border-0 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-[0.95] transition"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50/90 border border-slate-200/60 p-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Calculated Invoice Total</span>
          <span className="text-xl font-black text-teal-800 font-mono tabular-nums">
            ₹{total.toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          type="button"
          className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition"
        >
          Cancel
        </Button>
        <Button
          disabled={isSubmitting}
          type="submit"
          className="w-full sm:w-auto min-h-[44px] rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 active:scale-[0.97] transition shadow-xs"
        >
          {isSubmitting ? "Generating…" : "Generate Invoice"}
        </Button>
      </div>
    </form>
  );
}

export default BillingForm;

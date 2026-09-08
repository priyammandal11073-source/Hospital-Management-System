import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookMyAppointment, getDoctors } from "../../services/api.js";
import PaymentMethodSelect from "../../components/PaymentMethodSelect.jsx";
import UpiPaymentBox from "../../components/UpiPaymentBox.jsx";

function BookAppointment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    doctor: "",
    appointmentDate: "",
    timeSlot: "",
    reasonForVisit: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // After booking: hold billingId to show payment UI for UPI
  const [createdBillingId, setCreatedBillingId] = useState(null);
  const [createdBilling, setCreatedBilling] = useState(null);

  useEffect(() => {
    getDoctors().then((d) => setDoctors(d.doctors)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.doctor || !form.appointmentDate || !form.timeSlot || !form.reasonForVisit) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookMyAppointment({ ...form, paymentMethod });

      if (paymentMethod === "upi" && res.billingId) {
        // Show inline UPI payment
        setCreatedBillingId(res.billingId);
        setCreatedBilling({
          _id: res.billingId,
          totalAmount: 500,
          paymentStatus: "pending",
          paymentMethod: "upi",
        });
      } else {
        navigate("/patient/appointments");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to book appointment. Slot may be taken.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── After booking with UPI ─────────────────────────────────────────────────
  if (createdBillingId) {
    return (
      <section className="max-w-xl space-y-5">
        <h1 className="text-2xl font-semibold text-slate-800">Complete Payment</h1>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="font-semibold text-emerald-800 text-sm">
            ✅ Appointment booked! Please complete UPI payment below.
          </p>
        </div>

        <UpiPaymentBox
          billing={createdBilling}
          onPaymentSuccess={() => navigate("/patient/billings")}
          isPatient={true}
        />

        <button
          type="button"
          onClick={() => navigate("/patient/appointments")}
          className="text-sm text-slate-500 hover:underline"
        >
          Skip — I'll pay later
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-800">Book appointment</h1>
      <p className="mt-1 text-sm text-slate-600">
        Choose a doctor and time — you'll be booked as pending until staff confirm.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Doctor
          <select name="doctor" required value={form.doctor} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">Select doctor</option>
            {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name} — {d.specialization}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Date
          <input name="appointmentDate" type="date" required value={form.appointmentDate} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Time slot
          <input name="timeSlot" placeholder="e.g. 10:00 AM" required value={form.timeSlot} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Reason for visit
          <textarea name="reasonForVisit" required rows={3} value={form.reasonForVisit} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>

        {/* OPD Payment Method */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <PaymentMethodSelect
            value={paymentMethod}
            onChange={setPaymentMethod}
            label="OPD Payment Method"
          />
          <p className="mt-2 text-xs text-slate-500">
            OPD consultation fee: <strong>₹500</strong>. An invoice will be generated automatically.
            {paymentMethod === "upi" && " Scan the QR to pay right after booking."}
            {paymentMethod === "cash" && " Pay at the billing counter on your visit."}
            {paymentMethod === "card" && " Pay by card at the billing counter."}
            {paymentMethod === "insurance" && " Our insurance desk will process your claim."}
          </p>
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          disabled={submitting}
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
        >
          {submitting ? "Booking..." : "Book appointment"}
        </button>
      </form>
    </section>
  );
}

export default BookAppointment;

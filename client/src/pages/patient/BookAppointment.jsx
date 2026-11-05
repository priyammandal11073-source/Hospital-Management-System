import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  bookMyAppointment,
  getDoctors,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../../services/api.js";
import PaymentMethodSelect from "../../components/PaymentMethodSelect.jsx";
import UpiPaymentBox from "../../components/UpiPaymentBox.jsx";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";
import env from "../../config/env.js";

const QUICK_REASONS = [
  { label: "🩺 Routine Health Checkup", text: "Routine General Health Checkup" },
  { label: "🤒 Fever, Cold or Flu", text: "High fever, chills, bodyache, and cold" },
  { label: "🫀 Chest Pain / Blood Pressure", text: "Chest discomfort and high blood pressure checkup" },
  { label: "🦴 Bone & Joint Pain", text: "Joint stiffness and orthopedic pain" },
  { label: "🫁 Breathing & Cough", text: "Persistent cough and respiratory difficulty" },
  { label: "💊 Follow-up & Refill", text: "Doctor follow-up consultation and prescription review" },
];

const TIME_SLOTS = {
  morning: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  afternoon: ["02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"],
  evening: ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"],
};

function BookAppointment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [doctorSearch, setDoctorSearch] = useState("");

  const [form, setForm] = useState({
    doctor: "",
    appointmentDate: "",
    timeSlot: "",
    reasonForVisit: "",
  });

  const [customSlot, setCustomSlot] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Success state / Post-booking handlers
  const [createdBillingId, setCreatedBillingId] = useState(null);
  const [createdBilling, setCreatedBilling] = useState(null);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);

  useEffect(() => {
    let active = true;
    getDoctors()
      .then((d) => {
        if (active) {
          setDoctors(d.doctors || []);
          setLoadingDoctors(false);
        }
      })
      .catch(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Today formatted as YYYY-MM-DD in user's local timezone
  const todayStr = new Date().toLocaleDateString("en-CA");

  // Helper for quick date chips
  const getDateOffsetStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-CA");
  };

  const setQuickDate = (days) => {
    setForm((f) => ({ ...f, appointmentDate: getDateOffsetStr(days) }));
    setError("");
  };

  const specialties = [
    "all",
    ...Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean))),
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      selectedSpecialty === "all" ||
      doc.specialization?.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch =
      !doctorSearch.trim() ||
      doc.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.department?.toLowerCase().includes(doctorSearch.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  const selectedDoctorObj = doctors.find((d) => d._id === form.doctor);

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSelectDoctor = (docId) => {
    setForm((f) => ({ ...f, doctor: docId }));
    setError("");
  };

  const handleSelectTimeSlot = (slot) => {
    setForm((f) => ({ ...f, timeSlot: slot }));
    setCustomSlot(false);
    setError("");
  };

  const handleSelectReason = (text) => {
    setForm((f) => ({ ...f, reasonForVisit: text }));
    setError("");
  };

  // Launch Razorpay checkout for a created billing record
  const launchRazorpayCheckout = async (billingId) => {
    setIsProcessingRazorpay(true);
    try {
      const orderData = await createRazorpayOrder(billingId);

      let scriptOK = Boolean(window.Razorpay);
      if (!scriptOK) {
        scriptOK = await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      }

      if (window.Razorpay && scriptOK) {
        const options = {
          key: orderData.keyId || env.razorpayKeyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Nivora Care Hospital",
          description: "OPD Consultation & Doctor Booking Fee",
          ...(orderData.orderId ? { order_id: orderData.orderId } : {}),
          image: "https://cdn.razorpay.com/static/assets/logo/rzp.png",
          prefill: {
            name: orderData.patientDetails?.name || "Patient",
            email: orderData.patientDetails?.email || "patient@example.com",
            contact: orderData.patientDetails?.contact || "9876543210",
          },
          theme: { color: "#0F766E" },
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                billingId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              navigate("/patient/appointments");
            } catch (err) {
              navigate(`/pay/${billingId}`);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingRazorpay(false);
              navigate("/patient/appointments");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setError(resp.error?.description || "Payment failed. You can pay later from your invoices.");
          setIsProcessingRazorpay(false);
        });
        rzp.open();
      } else {
        navigate(`/pay/${billingId}`);
      }
    } catch (err) {
      navigate(`/pay/${billingId}`);
    } finally {
      setIsProcessingRazorpay(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.doctor) {
      setError("Please select a doctor for your appointment.");
      return;
    }
    if (!form.appointmentDate) {
      setError("Please pick an appointment date.");
      return;
    }
    if (!form.timeSlot) {
      setError("Please pick a preferred time slot.");
      return;
    }
    if (!form.reasonForVisit.trim()) {
      setError("Please provide a reason or symptom for your visit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookMyAppointment({ ...form, paymentMethod });

      setBookingSuccessData(res.appointment);

      if (paymentMethod === "upi" && res.billingId) {
        setCreatedBillingId(res.billingId);
        setCreatedBilling({
          _id: res.billingId,
          totalAmount: 500,
          paymentStatus: "pending",
          paymentMethod: "upi",
        });
      } else if (paymentMethod === "razorpay" && res.billingId) {
        await launchRazorpayCheckout(res.billingId);
      } else {
        // Cash or Insurance -> Navigate with success feedback
        navigate("/patient/appointments", {
          state: {
            successMsg:
              paymentMethod === "cash"
                ? "🎉 Appointment booked! Please pay ₹500 at the OPD counter on visit."
                : "🎉 Appointment booked! Our insurance desk will verify your details on arrival.",
          },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to book appointment. This time slot may already be reserved."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── View: Instant UPI Payment Modal/Box after Booking ──
  if (createdBillingId && createdBilling) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="rounded-2xl liquid-glass-card border border-teal-200/80 bg-teal-50/70 p-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h1>
              <p className="text-teal-800 text-xs mt-0.5 font-medium">
                Doctor: {formatDoctorName(selectedDoctorObj?.name, "Consultant")} · Slot: {form.timeSlot}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/90 p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">Scan & Pay via UPI</h2>
          <p className="text-xs text-slate-500 mb-5">
            Pay ₹500 instantly to confirm and prioritize your consultation token.
          </p>

          <UpiPaymentBox
            billing={createdBilling}
            onPaymentSuccess={() => navigate("/patient/appointments")}
            isPatient={true}
          />

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/patient/appointments")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Skip for now · Pay at Hospital Counter →
            </button>
            <Link
              to={`/pay/${createdBillingId}`}
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              Open Full Payment Gateway ↗
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Care Visits", to: "/patient/appointments" },
          { label: "Book Appointment", active: true },
        ]}
        title="Book Doctor Appointment"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            OPD Portal
          </span>
        }
        subtitle="Choose your specialist, pick a preferred time slot, and confirm instantly."
        actions={
          <Link
            to="/patient/appointments"
            className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>← Back to My Appointments</span>
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-rose-800 text-xs font-bold flex items-start gap-3 shadow-2xs">
          <span className="text-base">⚠️</span>
          <div className="flex-1">
            <p className="font-bold">Booking Notification</p>
            <p className="text-xs text-rose-700 mt-0.5 font-normal">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── STEP 1: SELECT DOCTOR ── */}
        <section className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-bold text-white">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900">Select Doctor & Department</h2>
            </div>
            {selectedDoctorObj && (
              <span className="text-xs font-semibold text-teal-800 liquid-glass-pill px-2.5 py-1 rounded-lg border border-teal-200/70 bg-teal-50">
                Selected: {formatDoctorName(selectedDoctorObj.name)}
              </span>
            )}
          </div>

          {/* Specialty Filter Badges */}
          {specialties.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Filter:</span>
              {specialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${
                    selectedSpecialty === spec
                      ? "bg-teal-700 text-white shadow-xs font-bold"
                      : "bg-white/80 border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by doctor name or department..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
            />
          </div>

          {/* Doctor Cards / Grid */}
          {loadingDoctors ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-xs font-semibold gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
              Loading hospital doctors...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50/70 rounded-xl text-xs border border-slate-100">
              No doctors found matching the search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredDoctors.map((doc) => {
                const isSelected = form.doctor === doc._id;
                return (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => handleSelectDoctor(doc._id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-teal-700 bg-teal-50/50 shadow-2xs ring-1 ring-teal-700"
                        : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected
                          ? "bg-teal-700 text-white shadow-2xs"
                          : "liquid-glass-subtle text-slate-800 border border-slate-200/80"
                      }`}
                    >
                      👨‍⚕️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {formatDoctorName(doc.name)}
                        </p>
                        {isSelected && (
                          <span className="text-teal-700 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-teal-800 mt-0.5">
                        {doc.specialization || "General Medicine"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {doc.department || "OPD"} • Fee: ₹500
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── STEP 2: SELECT DATE & TIME SLOT ── */}
        <section className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-bold text-white">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900">Select Date & Time Slot</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Appointment Date
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  form.appointmentDate === todayStr
                    ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                    : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  form.appointmentDate === getDateOffsetStr(1)
                    ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                    : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  form.appointmentDate === getDateOffsetStr(2)
                    ? "bg-teal-700 text-white border-teal-700 shadow-2xs"
                    : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Day After
              </button>
            </div>
            <input
              type="date"
              name="appointmentDate"
              required
              min={todayStr}
              value={form.appointmentDate}
              onChange={handleChange}
              className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Available Consultation Time Slots
            </label>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Morning Slots
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.morning.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSelectTimeSlot(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition ${
                        form.timeSlot === slot
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs font-bold"
                          : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Afternoon Slots
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TIME_SLOTS.afternoon.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSelectTimeSlot(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition ${
                        form.timeSlot === slot
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs font-bold"
                          : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Evening Slots
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TIME_SLOTS.evening.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSelectTimeSlot(slot)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition ${
                        form.timeSlot === slot
                          ? "bg-teal-700 text-white border-teal-700 shadow-2xs font-bold"
                          : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STEP 3: REASON FOR VISIT ── */}
        <section className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-bold text-white">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900">Reason for Visit & Symptoms</h2>
          </div>

          {/* Quick Symptoms Chips */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Quick Select Common Symptoms:
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((reason) => (
                <button
                  key={reason.label}
                  type="button"
                  onClick={() => handleSelectReason(reason.text)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition text-left ${
                    form.reasonForVisit === reason.text
                      ? "bg-teal-50 border-teal-700 text-teal-900 font-bold ring-1 ring-teal-700"
                      : "bg-white/80 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Describe your symptoms / medical requirement
            </label>
            <textarea
              name="reasonForVisit"
              required
              rows={3}
              placeholder="Please describe symptoms, duration, past history, or specific requirements..."
              value={form.reasonForVisit}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-hidden"
            />
          </div>
        </section>

        {/* ── STEP 4: PAYMENT METHOD & SUMMARY ── */}
        <section className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-[11px] font-bold text-white">
              4
            </span>
            <h2 className="text-sm font-bold text-slate-900">OPD Consultation & Payment</h2>
          </div>

          <PaymentMethodSelect
            value={paymentMethod}
            onChange={setPaymentMethod}
            label="Select Payment Method"
          />

          {/* Transparency Breakdown Card */}
          <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 p-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Doctor Consultation Fee:</span>
              <span className="font-semibold text-slate-900">₹500.00</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Hospital Registration & Token:</span>
              <span className="font-semibold text-emerald-700">₹0.00 (Free)</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">Total Payable:</span>
              <span className="text-lg font-bold text-teal-800 font-mono">₹500.00</span>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              {paymentMethod === "razorpay" &&
                "🔒 Pay online securely via Razorpay (Cards, NetBanking, Wallets)."}
              {paymentMethod === "upi" &&
                "📲 Instant QR code & UPI apps (GPay, PhonePe, Paytm) right after booking."}
              {paymentMethod === "cash" &&
                "💵 Pay ₹500 cash at the hospital billing desk before doctor consultation."}
              {paymentMethod === "insurance" &&
                "🏥 Cashless claim verification will be handled at the hospital insurance desk."}
            </p>
          </div>
        </section>

        {/* ── SUBMIT BUTTON ── */}
        <button
          disabled={submitting || isProcessingRazorpay}
          type="submit"
          className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 px-6 text-sm shadow-sm shadow-teal-950/10 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting || isProcessingRazorpay ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>
                {isProcessingRazorpay ? "Launching Payment Window..." : "Booking Appointment..."}
              </span>
            </>
          ) : (
            <>
              <span>Confirm & Book Appointment</span>
              <span>→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default BookAppointment;

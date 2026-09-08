/**
 * PaymentPage – public page accessible via SMS payment link & patient portal.
 * Route: /pay/:billingId
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UpiPaymentBox from "../components/UpiPaymentBox.jsx";
import InsurancePaymentBox from "../components/InsurancePaymentBox.jsx";
import PaymentMethodSelect from "../components/PaymentMethodSelect.jsx";
import { getBillingById, createRazorpayOrder, verifyRazorpayPayment, payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

const STATUS_COLORS = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  partially_paid: "bg-blue-100 text-blue-800 border-blue-300",
};

function PaymentPage() {
  const { billingId } = useParams();
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  
  // Modals for instant actions
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Detect if user is a patient
  const isPatient = Boolean(localStorage.getItem("patient_token"));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getBillingById(billingId);
        if (active) setBilling(data.billing);
      } catch (err) {
        if (active) {
          if (err.response?.status === 401) {
            setError("login_required");
          } else {
            setError(err.response?.data?.message || "Unable to load invoice.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    if (billingId) load();
    return () => { active = false; };
  }, [billingId]);

  const handlePaymentSuccess = (updatedBilling) => {
    setBilling(updatedBilling);
    setShowUpiModal(false);
    setShowInsuranceModal(false);
    setSuccessMsg("Payment / Transaction update recorded successfully!");
  };

  // Launch official Razorpay payment window directly
  const handleLaunchRazorpayDirectly = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsRazorpayProcessing(true);

    try {
      // 1. Create Razorpay order from backend API
      const orderData = await createRazorpayOrder(billing._id);
      
      if (!orderData || !orderData.amount) {
        throw new Error("Failed to initialize Razorpay payment order.");
      }

      // 2. Load Razorpay script if needed
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
        const rzpIdStr = String(billing._id || billing.id || "");
        const invoiceNumber = `INV-${rzpIdStr ? rzpIdStr.slice(-6).toUpperCase() : "NIVORA"}`;
        const options = {
          key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TZavagxglGTRZp",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Nivora Care Hospital",
          description: `Hospital Invoice ${invoiceNumber}`,
          ...(orderData.orderId ? { order_id: orderData.orderId } : {}),
          image: "https://cdn.razorpay.com/static/assets/logo/rzp.png",
          prefill: {
            name: orderData.patientDetails?.name || billing.patient?.name || "Patient",
            email: orderData.patientDetails?.email || billing.patient?.email || "patient@example.com",
            contact: orderData.patientDetails?.contact || billing.patient?.contactNumber || "9876543210",
          },
          theme: {
            color: "#0F766E", // Healthcare Teal
          },
          handler: async function (response) {
            try {
              const res = await verifyRazorpayPayment({
                billingId: billing._id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });

              handlePaymentSuccess(res.billing);
            } catch (err) {
              console.error("Razorpay verification error:", err);
              setErrorMsg(err.response?.data?.message || "Failed to verify Razorpay payment signature.");
            } finally {
              setIsRazorpayProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsRazorpayProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setErrorMsg(resp.error?.description || "Razorpay Payment Failed.");
          setIsRazorpayProcessing(false);
        });

        rzp.open();
      } else {
        setErrorMsg("Unable to load Razorpay SDK. Please check connection.");
        setIsRazorpayProcessing(false);
      }
    } catch (err) {
      console.error("Razorpay launch error:", err);
      setErrorMsg(err.message || "Failed to launch Razorpay checkout.");
      setIsRazorpayProcessing(false);
    }
  };

  // Direct tile click router
  const handleSelectMethod = (method) => {
    setPaymentMethod(method);
    setErrorMsg("");
    setSuccessMsg("");

    if (method === "razorpay") {
      handleLaunchRazorpayDirectly();
    } else if (method === "upi") {
      setShowUpiModal(true);
    } else if (method === "insurance") {
      setShowInsuranceModal(true);
    } else if (method === "cash") {
      const amountStr = Number(billing.totalAmount).toFixed(2);
      setSuccessMsg(`💵 Cash Desk Selected: Please pay ₹${amountStr} in cash at the hospital billing counter. Redirecting to your appointments...`);
      setTimeout(() => {
        if (isPatient) {
          navigate("/patient/appointments");
        } else {
          navigate("/appointments");
        }
      }, 2000);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your invoice…</p>
        </div>
      </div>
    );
  }

  // ── Login required ─────────────────────────────────────────────────────────
  if (error === "login_required") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-8 text-center space-y-5">
          <div className="text-5xl">🔐</div>
          <h1 className="text-2xl font-bold text-slate-900">Login Required</h1>
          <p className="text-slate-600 text-sm">
            Please log in to your patient account to view and pay this invoice.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/patient/login?redirect=/pay/${billingId}`}
              className="block w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 transition"
            >
              Log in as Patient
            </Link>
            <Link
              to="/login"
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Log in as Staff
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Invoice not found</h1>
          <p className="text-slate-600 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-8 text-center space-y-4">
          <div className="text-4xl">📄</div>
          <h1 className="text-xl font-bold text-slate-900">Invoice Unavailable</h1>
          <p className="text-slate-600 text-sm">The requested invoice parameters could not be loaded.</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
          >
            Return Back
          </button>
        </div>
      </div>
    );
  }

  const idStr = String(billing?._id || billing?.id || "");
  const invoiceNumber = `INV-${idStr ? idStr.slice(-6).toUpperCase() : "NIVORA"}`;
  const isPaid = billing.paymentStatus === "paid";
  const docName = billing.appointment?.doctor?.name
    ? `Dr. ${billing.appointment.doctor.name}`
    : "Doctor";
  const apptDate = billing.appointment?.appointmentDate
    ? new Date(billing.appointment.appointmentDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-teal-700 tracking-tight">
              Nivora Care Hospital
            </h1>
            <p className="text-xs text-slate-500">Secure Payment Portal & Gateway</p>
          </div>
          <span
            className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${STATUS_COLORS[billing.paymentStatus] || STATUS_COLORS.pending}`}
          >
            {billing.paymentStatus.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ── Invoice Summary ── */}
        <section className="rounded-2xl bg-white shadow-md p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</p>
              <p className="text-3xl font-black text-teal-700 mt-0.5 font-mono">
                ₹{Number(billing.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-500 text-xs block">Patient</span>
              <p className="font-semibold text-slate-900">{billing.patient?.name || "—"}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Doctor</span>
              <p className="font-semibold text-slate-900">{docName}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Appointment</span>
              <p className="font-semibold text-slate-900">{apptDate}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Time Slot</span>
              <p className="font-semibold text-slate-900">{billing.appointment?.timeSlot || "—"}</p>
            </div>
          </div>

          {/* Itemized charges */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 font-semibold">Description</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-500 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.itemizedCharges?.map((charge, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{charge.description}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">
                      ₹{Number(charge.cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-teal-800">Total</td>
                  <td className="px-4 py-2.5 text-right font-black text-teal-800 font-mono text-base">
                    ₹{Number(billing.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── Status Messages & Feedback ── */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold shadow-sm animate-in fade-in">
            {successMsg}
          </div>
        )}

        {/* ── Direct Action Payment Tiles ── */}
        {!isPaid ? (
          <section className="rounded-2xl bg-white shadow-md p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Select Hospital Payment Method</h2>

            <PaymentMethodSelect
              value={paymentMethod}
              onChange={handleSelectPaymentMethod}
              disabled={isRazorpayProcessing}
            />

            {isRazorpayProcessing && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
                <span>Opening Razorpay Secure Payment Window...</span>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-2xl bg-emerald-50 border border-emerald-200 shadow-md p-6 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-black text-emerald-800">Invoice Paid!</h2>
            <p className="text-sm text-slate-600">
              This invoice has been settled. Thank you for choosing Nivora Care Hospital.
            </p>
            {billing.razorpayPaymentId && (
              <p className="text-xs text-slate-500">
                Razorpay Payment ID: <code className="font-mono font-bold text-blue-700">{billing.razorpayPaymentId}</code>
              </p>
            )}
            {billing.upiTransactionId && (
              <p className="text-xs text-slate-500">
                UPI Reference UTR: <code className="font-mono font-bold text-emerald-700">{billing.upiTransactionId}</code>
              </p>
            )}
          </section>
        )}

        {/* ── MODAL: INSTANT UPI QR CODE & APPS ── */}
        {showUpiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 relative">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
              <UpiPaymentBox
                billing={billing}
                onPaymentSuccess={handlePaymentSuccess}
                isPatient={isPatient}
              />
            </div>
          </div>
        )}

        {/* ── MODAL: HEALTH INSURANCE & TPA CLAIM ── */}
        {showInsuranceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 relative">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
              <InsurancePaymentBox
                billing={billing}
                onPaymentSuccess={handlePaymentSuccess}
                isPatient={isPatient}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Nivora Care Hospital · Outer Ring Road, Near AIIMS Metro, New Delhi · +91 9876543210
        </p>
      </main>
    </div>
  );
}

export default PaymentPage;

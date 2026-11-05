/**
 * PaymentPage – public page accessible via SMS payment link & patient portal.
 * Route: /pay/:billingId
 * 
 * Emil Kowalski Craft Polish:
 * - Tone-on-tone borderless elevation with soft ambient ring-1 ring-slate-900/5
 * - Tabular numbers for financial precision
 * - Tactile active press feedback on all CTA buttons (scale 0.97)
 * - Hardware-accelerated modal crossfades with backdrop blur
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UpiPaymentBox from "../components/UpiPaymentBox.jsx";
import InsurancePaymentBox from "../components/InsurancePaymentBox.jsx";
import RazorpayPaymentBox from "../components/RazorpayPaymentBox.jsx";
import PaymentMethodSelect from "../components/PaymentMethodSelect.jsx";
import { getBillingById, createRazorpayOrder, verifyRazorpayPayment, updatePaymentStatus } from "../services/api.js";
import { formatDoctorName } from "../utils/doctorName.js";
import env from "../config/env.js";

const STATUS_COLORS = {
  paid: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
  partially_paid: "bg-sky-50 text-sky-800 ring-1 ring-sky-600/20",
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
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Detect session
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const isStaff = Boolean(localStorage.getItem("hms_token"));
  const isAuthenticated = isPatient || isStaff;

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
    setSuccessMsg("Payment verified and invoice settled successfully!");
  };

  // Launch official Razorpay payment window directly
  const handleLaunchRazorpayDirectly = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsRazorpayProcessing(true);

    try {
      const orderData = await createRazorpayOrder(billing._id);
      
      if (!orderData || !orderData.amount) {
        throw new Error("Failed to initialize Razorpay payment order.");
      }

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
          key: orderData.keyId || env.razorpayKeyId,
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
            color: "#0F766E",
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
          setShowRazorpayModal(true);
        });

        rzp.open();
      } else {
        setIsRazorpayProcessing(false);
        setShowRazorpayModal(true);
      }
    } catch (err) {
      console.warn("Direct Razorpay checkout notice, engaging interactive payment modal:", err);
      setIsRazorpayProcessing(false);
      setShowRazorpayModal(true);
    }
  };

  const handleSelectMethod = (method) => {
    setPaymentMethod(method);
    setErrorMsg("");

    if (method === "razorpay") {
      handleLaunchRazorpayDirectly();
    } else if (method === "upi") {
      setShowUpiModal(true);
    } else if (method === "insurance") {
      setShowInsuranceModal(true);
    } else if (method === "cash") {
      setErrorMsg("Cash payments are accepted directly at the hospital reception cashier desk.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] p-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading secure checkout…</p>
        </div>
      </div>
    );
  }

  if (error === "login_required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] p-4">
        <div className="max-w-md w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/10 p-8 text-center space-y-4 animate-pop-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 text-2xl mx-auto ring-1 ring-amber-500/20">
            🔐
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Patient Login Required</h1>
          <p className="text-slate-600 text-xs leading-relaxed">
            For security and privacy, you must log in with your registered patient mobile number or email to view and pay this invoice.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to={`/patient/login?redirect=/pay/${billingId}`}
              className="w-full rounded-xl bg-teal-700 py-3 text-xs font-bold text-white hover:bg-teal-800 active:scale-[0.97] transition shadow-xs text-center"
            >
              Log In to Continue
            </Link>
            <Link
              to={`/patient/register?redirect=/pay/${billingId}`}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition text-center"
            >
              New Patient? Register Here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] p-4">
        <div className="max-w-md w-full rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/10 p-8 text-center space-y-4 animate-pop-in">
          <div className="text-4xl">📄</div>
          <h1 className="text-xl font-black text-slate-900">Invoice Unavailable</h1>
          <p className="text-slate-600 text-xs">{error || "The requested invoice could not be found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 active:scale-[0.97] transition shadow-xs"
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
    ? formatDoctorName(billing.appointment.doctor.name)
    : "Hospital Specialist";
  const apptDate = billing.appointment?.appointmentDate
    ? new Date(billing.appointment.appointmentDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* ── Top Header Strip ── */}
      <header className="border-b border-slate-200/70 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/nivora-logo.png"
              alt="Nivora Care Logo"
              className="h-8 w-8 rounded-lg bg-teal-50 object-contain p-1"
            />
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                Nivora Care Hospital
              </h1>
              <p className="text-[11px] text-teal-800 font-semibold">Official Secure Payment Gateway</p>
            </div>
          </div>
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[billing.paymentStatus] || STATUS_COLORS.pending}`}
          >
            {billing.paymentStatus.replace("_", " ")}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ── Invoice Summary Card ── */}
        <section className="rounded-3xl bg-white shadow-xs ring-1 ring-slate-900/5 p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice Reference</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Amount Due</p>
              <p className="text-3xl font-black text-teal-800 mt-0.5 font-mono tabular-nums">
                ₹{Number(billing.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-100">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Patient Name</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{billing.patient?.name || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Consultant</span>
              <p className="font-extrabold text-slate-900 mt-0.5">{docName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Date</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{apptDate}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Time Slot</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{billing.appointment?.timeSlot || "OPD Desk"}</p>
            </div>
          </div>

          {/* Itemized charges */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Service / Procedure Description</th>
                  <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billing.itemizedCharges?.map((charge, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-slate-800 font-medium">{charge.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ₹{Number(charge.cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50/70 border-t border-teal-100">
                <tr>
                  <td className="px-4 py-3 font-extrabold text-teal-950">Total Bill</td>
                  <td className="px-4 py-3 text-right font-black text-teal-950 font-mono text-sm tabular-nums">
                    ₹{Number(billing.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── Status Messages & Feedback ── */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            ✅ {successMsg}
          </div>
        )}

        {/* ── Direct Action Payment Tiles ── */}
        {!isPaid ? (
          <section className="rounded-3xl bg-white shadow-xs ring-1 ring-slate-900/5 p-6 sm:p-7 space-y-5">
            {!isAuthenticated && (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔐</span>
                      <h3 className="text-sm font-black text-amber-950">Patient Authentication Recommended</h3>
                    </div>
                    <p className="text-xs text-amber-900">
                      Log in to link this payment receipt directly to your permanent health timeline.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/patient/login?redirect=/pay/${billingId}`}
                      className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 active:scale-[0.97] transition shadow-xs"
                    >
                      Log In to Pay
                    </Link>
                    <Link
                      to={`/patient/register?redirect=/pay/${billingId}`}
                      className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100/50 active:scale-[0.97] transition"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div>
              <PaymentMethodSelect
                value={paymentMethod}
                onChange={handleSelectMethod}
                disabled={isRazorpayProcessing}
              />

              {isRazorpayProcessing && (
                <div className="mt-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
                  <span>Opening Razorpay Secure Payment Window...</span>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-emerald-50/90 border border-emerald-200/80 shadow-xs p-8 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-black text-emerald-950">Invoice Paid & Settled</h2>
            <p className="text-xs text-slate-600 font-medium">
              Thank you for choosing Nivora Care Hospital. A digital tax invoice has been generated.
            </p>
            {billing.razorpayPaymentId && (
              <p className="text-xs text-slate-500 font-mono">
                Razorpay Payment ID: <span className="font-bold text-teal-800">{billing.razorpayPaymentId}</span>
              </p>
            )}
            {billing.upiTransactionId && (
              <p className="text-xs text-slate-500 font-mono">
                UPI Reference UTR: <span className="font-bold text-emerald-800">{billing.upiTransactionId}</span>
              </p>
            )}
          </section>
        )}

        {/* ── Sub-Modals ── */}
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
              <button
                type="button"
                onClick={() => setShowRazorpayModal(false)}
                className="absolute top-4 right-4 z-20 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
              <RazorpayPaymentBox
                billing={billing}
                onPaymentSuccess={(updated) => {
                  handlePaymentSuccess(updated);
                  setShowRazorpayModal(false);
                }}
                isPatient={isPatient}
                autoOpen={true}
              />
            </div>
          </div>
        )}

        {showUpiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
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

        {showInsuranceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
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
        <div className="text-center space-y-1 pt-4 pb-8">
          <p className="text-xs text-slate-500 font-medium">
            🔒 256-bit SSL Encrypted • NPCI, RBI & NABH Accredited Hospital
          </p>
          <p className="text-[11px] text-slate-400">
            Nivora Care Hospital • Outer Ring Road, Near AIIMS Metro, New Delhi • Helpline: +91 98765 43210
          </p>
        </div>
      </main>
    </div>
  );
}

export default PaymentPage;

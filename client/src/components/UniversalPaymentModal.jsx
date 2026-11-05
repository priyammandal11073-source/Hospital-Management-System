import { useState } from "react";
import PaymentMethodSelect from "./PaymentMethodSelect.jsx";
import UpiPaymentBox from "./UpiPaymentBox.jsx";
import InsurancePaymentBox from "./InsurancePaymentBox.jsx";
import CardPaymentBox from "./CardPaymentBox.jsx";
import { createRazorpayOrder, verifyRazorpayPayment, updatePaymentStatus } from "../services/api.js";
import env from "../config/env.js";

/**
 * UniversalPaymentModal – Emil Kowalski Polish
 * Features:
 * - Tone-on-tone borderless elevation with soft ambient ring-1 ring-slate-900/10
 * - Hardware-accelerated modal entrance (scale 0.96 -> 1, opacity 0 -> 1)
 * - Tactile active-press feedback on all interactive controls (scale 0.97)
 * - WCAG AAA contrast and tabular numbers for clinical financial clarity
 */
export default function UniversalPaymentModal({
  billing,
  isOpen,
  onClose,
  onPaymentSuccess,
  isPatient = false,
  title = "Settle Hospital Bill",
}) {
  const isPatientUser = isPatient || (typeof window !== "undefined" && Boolean(localStorage.getItem("patient_token")));
  const [selectedMethod, setSelectedMethod] = useState("");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isRazorpayProcessing, setIsRazorpayProcessing] = useState(false);
  const [isCashSettling, setIsCashSettling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !billing) return null;

  const isPaid = billing.paymentStatus === "paid";
  const totalAmount = Number(billing.totalAmount || billing.amount || 0).toFixed(2);
  const invoiceNumber = billing.invoiceNumber || `INV-${String(billing._id || billing.id || "").slice(-6).toUpperCase()}`;

  const handleLaunchRazorpay = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsRazorpayProcessing(true);

    try {
      const orderData = await createRazorpayOrder(billing._id);
      if (!orderData || !orderData.amount) {
        throw new Error("Failed to initialize Razorpay checkout order.");
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

              setSuccessMsg("Payment verified successfully via Razorpay!");
              onPaymentSuccess?.(res.billing || res);
              setTimeout(() => onClose?.(), 1500);
            } catch (err) {
              console.error("Razorpay verification error:", err);
              setErrorMsg(err.response?.data?.message || "Failed to verify Razorpay signature.");
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
        setShowCardModal(true);
        setIsRazorpayProcessing(false);
      }
    } catch (err) {
      console.warn("Falling back to direct card modal:", err);
      setIsRazorpayProcessing(false);
      setShowCardModal(true);
    }
  };

  const handleCashSettlement = async () => {
    setIsCashSettling(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await updatePaymentStatus(billing._id, {
        paymentStatus: "paid",
        paymentMethod: "cash",
      });
      setSuccessMsg(`₹${totalAmount} collected and settled successfully at the Cash Desk.`);
      onPaymentSuccess?.(res.billing || res);
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Cash settlement failed.");
    } finally {
      setIsCashSettling(false);
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setErrorMsg("");
    setSuccessMsg("");

    if (method === "razorpay") {
      handleLaunchRazorpay();
    } else if (method === "upi") {
      setShowUpiModal(true);
    } else if (method === "insurance") {
      setShowInsuranceModal(true);
    } else if (method === "cash") {
      handleCashSettlement();
    }
  };

  const handleSubModalSuccess = (updatedBilling) => {
    setShowUpiModal(false);
    setShowInsuranceModal(false);
    setShowCardModal(false);
    setSuccessMsg("Payment recorded successfully!");
    onPaymentSuccess?.(updatedBilling);
    setTimeout(() => onClose?.(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4 backdrop-blur-md transition-opacity duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 animate-pop-in">
        {/* Modal Top Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 text-slate-900 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold text-teal-800 ring-1 ring-teal-600/20">
              <span>💳 Central Payment Gateway</span>
              <span className="text-teal-400">•</span>
              <span className="font-mono tracking-wide">{invoiceNumber}</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold transition text-sm cursor-pointer active:scale-90"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Invoice Summary Strip */}
        <div className="bg-slate-50/90 border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Patient Name</p>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">{billing.patient?.name || "Patient"}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact</p>
            <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{billing.patient?.contactNumber || billing.patient?.contact || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount Due</p>
            <p className="text-2xl font-black text-teal-800 font-mono tabular-nums mt-0.5">₹{totalAmount}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {!isPaid ? (
            <div>
              <PaymentMethodSelect
                value={selectedMethod}
                onChange={handleMethodSelect}
                disabled={isRazorpayProcessing || isCashSettling}
              />

              {isRazorpayProcessing && (
                <div className="mt-4 p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
                  <span>Opening Razorpay Secure Payment Window...</span>
                </div>
              )}

              {isCashSettling && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-r-transparent" />
                  <span>Recording Cash Counter Settlement...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-emerald-50/80 border border-emerald-200/80 p-8 text-center space-y-2">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-black text-emerald-950">Invoice Already Settled</h3>
              <p className="text-xs text-slate-600 font-medium">
                Payment method: <strong className="uppercase">{billing.paymentMethod || "CASH"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-500">🔒 256-bit SSL • PCI-DSS & NABH Compliant</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub-modal: UPI & Dynamic QR */}
      {showUpiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
            <button
              type="button"
              onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <UpiPaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatientUser}
            />
          </div>
        </div>
      )}

      {/* Sub-modal: Health Insurance / TPA */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
            <button
              type="button"
              onClick={() => setShowInsuranceModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <InsurancePaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatientUser}
            />
          </div>
        </div>
      )}

      {/* Sub-modal: Card direct fallback */}
      {showCardModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-pop-in">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/10 relative">
            <button
              type="button"
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <CardPaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatientUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}

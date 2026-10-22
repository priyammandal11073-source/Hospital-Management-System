import { useState } from "react";
import PaymentMethodSelect from "./PaymentMethodSelect.jsx";
import UpiPaymentBox from "./UpiPaymentBox.jsx";
import InsurancePaymentBox from "./InsurancePaymentBox.jsx";
import CardPaymentBox from "./CardPaymentBox.jsx";
import { createRazorpayOrder, verifyRazorpayPayment, updatePaymentStatus } from "../services/api.js";
import env from "../config/env.js";

/**
 * UniversalPaymentModal
 * Comprehensive, reusable modal providing complete hospital payment methods across all portals:
 * - Razorpay (Cards, NetBanking, Wallets, EMI)
 * - Instant UPI & Dynamic QR Code (GPay, PhonePe, Paytm, BHIM)
 * - Health Insurance / TPA Pre-authorization
 * - Cash Desk Counter Settlement
 */
export default function UniversalPaymentModal({
  billing,
  isOpen,
  onClose,
  onPaymentSuccess,
  isPatient = false,
  title = "Settle Hospital Bill",
}) {
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
        // Fallback to direct card payment modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 sm:p-4 backdrop-blur-md animate-backdrop-fade">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/80 animate-pop-in">
        {/* Modal Top Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 text-slate-900 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-0.5 text-[11px] font-semibold text-teal-700 border border-teal-200">
              <span>💳 Central Hospital Payment Gateway</span>
              <span>•</span>
              <span className="font-mono">{invoiceNumber}</span>
            </div>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold transition text-sm cursor-pointer active:scale-90"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Invoice Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Patient Name</p>
            <p className="text-sm font-bold text-slate-900">{billing.patient?.name || "Patient"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Contact</p>
            <p className="text-xs font-mono font-bold text-slate-700">{billing.patient?.contactNumber || billing.patient?.contact || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Amount Due</p>
            <p className="text-xl font-black text-teal-700 font-mono">₹{totalAmount}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {!isPaid ? (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Select Hospital Payment Method
              </p>
              <PaymentMethodSelect
                value={selectedMethod}
                onChange={handleMethodSelect}
                disabled={isRazorpayProcessing || isCashSettling}
              />

              {isRazorpayProcessing && (
                <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
                  <span>Opening Razorpay Secure Payment Window...</span>
                </div>
              )}

              {isCashSettling && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-r-transparent" />
                  <span>Recording Cash Counter Settlement...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-black text-emerald-900">Invoice Already Settled</h3>
              <p className="text-xs text-slate-600">
                Payment method: <strong className="uppercase">{billing.paymentMethod || "CASH"}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>🔒 256-bit SSL Encrypted • PCI-DSS & NABH Compliant</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub-modal: UPI & Dynamic QR */}
      {showUpiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-backdrop-fade">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200/80 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-all active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <UpiPaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatient}
            />
          </div>
        </div>
      )}

      {/* Sub-modal: Health Insurance / TPA */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-backdrop-fade">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200/80 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowInsuranceModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-all active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <InsurancePaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatient}
            />
          </div>
        </div>
      )}

      {/* Sub-modal: Card direct fallback */}
      {showCardModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 animate-backdrop-fade">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200/80 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowCardModal(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-all active:scale-90 cursor-pointer"
            >
              ✕
            </button>
            <CardPaymentBox
              billing={billing}
              onPaymentSuccess={handleSubModalSuccess}
              isPatient={isPatient}
            />
          </div>
        </div>
      )}
    </div>
  );
}

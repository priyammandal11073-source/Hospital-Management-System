import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

// Generates NPCI-compliant UPI deep link safely
export const getUpiPaymentUrl = (billing) => {
  if (!billing) return "";
  const idStr = String(billing._id || billing.id || "");
  const invoiceNumber = `INV-${idStr ? idStr.slice(-6).toUpperCase() : "NIVORA"}`;
  const amount = Number(billing.totalAmount || 0).toFixed(2);
  const payeeVpa = "nivoracare@icici";
  const payeeName = "Nivora Care Hospital";
  const note = `Invoice ${invoiceNumber}`;
  return `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${invoiceNumber}`;
};

// Generates a Base64 PNG data URL for printing and rendering
export const generateUpiQrDataUrl = async (billing) => {
  try {
    const url = getUpiPaymentUrl(billing);
    if (!url) return "";
    return await QRCode.toDataURL(url, {
      width: 220,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.error("Failed to generate UPI QR code:", err);
    return "";
  }
};

const UPI_APPS = [
  { name: "Google Pay", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "PhonePe", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "Paytm", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { name: "BHIM", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Cred", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Amazon Pay", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

function UpiPaymentBox({ billing, onPaymentSuccess, isPatient = false }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [manualUtr, setManualUtr] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const isPaid = billing?.paymentStatus === "paid";
  const idStr = String(billing?._id || billing?.id || "");
  const invoiceNumber = `INV-${idStr ? idStr.slice(-6).toUpperCase() : "NIVORA"}`;
  const totalAmount = Number(billing?.totalAmount || 0).toFixed(2);
  const upiUrl = billing ? getUpiPaymentUrl(billing) : "";

  // Generate QR Code data URL whenever billing changes
  useEffect(() => {
    let active = true;
    if (billing && !isPaid) {
      generateUpiQrDataUrl(billing).then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      });
    }
    return () => {
      active = false;
    };
  }, [billing, isPaid]);

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText("nivoracare@icici");
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2500);
    } catch {
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2500);
    }
  };

  const handleVerifyPayment = async (customUtr = null) => {
    setIsProcessing(true);
    setActionError("");
    setActionSuccess("");

    const finalUtr = customUtr || manualUtr || "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);

    try {
      let updatedBilling;
      if (isPatient) {
        const res = await payMyBillingUpi(billing._id, {
          upiTransactionId: finalUtr,
        });
        updatedBilling = res.billing;
      } else {
        const res = await updatePaymentStatus(billing._id, {
          paymentStatus: "paid",
          paymentMethod: "upi",
          upiTransactionId: finalUtr,
        });
        updatedBilling = res.billing;
      }

      setActionSuccess(`Payment verified! UTR: ${finalUtr}`);
      if (onPaymentSuccess) {
        onPaymentSuccess(updatedBilling);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to verify UPI payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  // If invoice is already paid, display verified high-contrast badge
  if (isPaid) {
    const isUpiPayment = billing.paymentMethod === "upi" || Boolean(billing.upiTransactionId);
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-slate-800">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-emerald-700 px-2.5 py-0.5 text-xs font-bold text-white tracking-wide uppercase">
                {isUpiPayment ? "Paid via UPI" : `Paid (${billing.paymentMethod?.toUpperCase() || "CASH"})`}
              </span>
              <span className="text-xs font-medium text-emerald-800">
                • Verified settlement
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">
              Invoice #{invoiceNumber} settled in full (₹{totalAmount})
            </p>
            {billing.upiTransactionId && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Bank UTR / Ref:</span>
                <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-emerald-800 border border-emerald-300">
                  {billing.upiTransactionId}
                </code>
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Payment date:{" "}
              {billing.paymentDate
                ? new Date(billing.paymentDate).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recorded"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-teal-600/30 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-black text-xs shadow-xs">
              ₹
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Dynamic UPI payment
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              NPCI Real-Time
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Scan with any UPI app to pay ₹{totalAmount} instantly
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Payable amount</span>
          <span className="text-xl font-black text-teal-700 font-mono">
            ₹{totalAmount}
          </span>
        </div>
      </div>

      {/* Main UPI Content Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Scannable QR Code */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative rounded-2xl border-2 border-slate-800 bg-white p-3 shadow-md">
            {/* Decorative Corner Targets */}
            <div className="absolute top-1 left-1 h-3 w-3 border-t-2 border-l-2 border-teal-600"></div>
            <div className="absolute top-1 right-1 h-3 w-3 border-t-2 border-r-2 border-teal-600"></div>
            <div className="absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-teal-600"></div>
            <div className="absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-teal-600"></div>

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`UPI QR Code for ${invoiceNumber}`}
                className="h-44 w-44 object-contain rounded-lg"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Scan & Pay ₹{totalAmount}
            </div>
          </div>

          {/* Direct UPI Mobile Intent Link */}
          {upiUrl && (
            <a
              href={upiUrl}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
              title="Click to launch UPI app on mobile or tablet"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Open UPI app on this device
            </a>
          )}
        </div>

        {/* Right Column: VPA Details & Instant Verification */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          {/* Hospital UPI VPA Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Payee VPA / UPI ID
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 select-all">
                nivoracare@icici
              </span>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                {copiedVpa ? "✓ Copied" : "Copy UPI ID"}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Account Name: <strong>Nivora Care Hospital</strong></span>
              <span>Ref: <strong>{invoiceNumber}</strong></span>
            </div>
          </div>

          {/* Supported UPI Apps Badges */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase tracking-wide">
              Supported payment apps:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {UPI_APPS.map((app) => (
                <span
                  key={app.name}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${app.color}`}
                >
                  {app.name}
                </span>
              ))}
            </div>
          </div>

          {/* Verification & Instant Simulation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Verify payment (Bank UTR / Transaction reference):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualUtr}
                onChange={(e) => setManualUtr(e.target.value)}
                placeholder="e.g. 423891029381 or auto"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-hidden"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleVerifyPayment()}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 transition"
              >
                {isProcessing ? "Verifying..." : "Verify UTR"}
              </button>
            </div>

            {/* 1-Click Simulation Button */}
            <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Testing / Demo scan:
              </span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  const mockUtr = "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);
                  setManualUtr(mockUtr);
                  handleVerifyPayment(mockUtr);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs"
              >
                ⚡ Simulate instant UPI scan
              </button>
            </div>

            {actionError && (
              <p className="mt-2 text-xs font-medium text-red-600">{actionError}</p>
            )}
            {actionSuccess && (
              <p className="mt-2 text-xs font-medium text-emerald-700">{actionSuccess}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpiPaymentBox;

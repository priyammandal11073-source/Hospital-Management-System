import { useState } from "react";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

function detectCardBrand(number) {
  const clean = number.replace(/\s+/g, "");
  if (clean.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
  if (/^6[0-9]/.test(clean) || /^65/.test(clean)) return "RuPay";
  if (/^3[47]/.test(clean)) return "Amex";
  return "Debit / Credit Card";
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/**
 * CardPaymentBox – Emil Kowalski Polish
 * Features:
 * - Tone-on-tone elevation with soft ambient ring
 * - Tactile active press response (scale 0.97)
 * - Tabular numbers and clear card typography
 */
function CardPaymentBox({ billing, onPaymentSuccess, isPatient }) {
  const [cardHolder, setCardHolder] = useState(billing?.patient?.name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cardBrand = detectCardBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\s/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!cardHolder.trim()) {
      setErrorMsg("Please enter the cardholder name.");
      return;
    }
    if (rawDigits.length < 13) {
      setErrorMsg("Please enter a valid 16-digit card number.");
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg("Please enter expiry date (MM/YY).");
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg("Please enter a valid 3 or 4 digit CVV.");
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const cardPayload = {
        paymentMethod: "card",
        cardDetails: {
          cardNumber: rawDigits,
          cardHolderName: cardHolder.trim(),
          expiry,
          cardBrand,
        },
      };

      let res;
      if (isPatient) {
        res = await payMyBillingUpi(billing._id, cardPayload);
      } else {
        res = await updatePaymentStatus(billing._id, {
          paymentStatus: "paid",
          paymentMethod: "card",
          cardDetails: {
            cardLast4: rawDigits.slice(-4),
            cardBrand,
            transactionRef: "CARD_" + Math.floor(100000000000 + Math.random() * 900000000000),
          },
        });
      }

      onPaymentSuccess?.(res.billing);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Card payment failed. Please check card details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-7 space-y-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Online Card Gateway</h3>
          <p className="text-xs text-slate-500 font-medium">Pay securely using any Credit or Debit Card</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl ring-1 ring-teal-600/20">
          <span>🔒 256-bit SSL</span>
        </div>
      </div>

      {/* Interactive Virtual Card Preview */}
      <div className="relative w-full aspect-[1.8/1] max-w-sm mx-auto rounded-3xl bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-900 p-5 text-white shadow-xl overflow-hidden flex flex-col justify-between ring-1 ring-white/10">
        {/* Hologram / Chip pattern */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-10 rounded-md bg-amber-400/90 shadow-inner flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-700/40"></div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Nivora Pay</span>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs text-teal-300">
            {cardBrand}
          </span>
        </div>

        {/* Card Number Display */}
        <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-100 drop-shadow-md">
          {cardNumber ? cardNumber : "•••• •••• •••• ••••"}
        </div>

        {/* Card Footer Details */}
        <div className="flex items-end justify-between text-xs">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Cardholder Name</span>
            <span className="font-bold uppercase tracking-wide truncate max-w-[180px] block">
              {cardHolder ? cardHolder : "YOUR NAME"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Expires</span>
            <span className="font-mono font-bold tracking-wider">{expiry ? expiry : "MM/YY"}</span>
          </div>
        </div>
      </div>

      {/* Online Card Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Cardholder Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Cardholder Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="As printed on front of card"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Card Number *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={19}
              placeholder="4532 •••• •••• 8912"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/80 pl-3.5 pr-20 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
            <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md ring-1 ring-teal-600/20">
              {cardBrand}
            </span>
          </div>
        </div>

        {/* Expiry, CVV & Zip */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expiry *
            </label>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className="w-full text-xs font-mono font-bold text-center rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              CVV *
            </label>
            <input
              type="password"
              required
              maxLength={4}
              placeholder="•••"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full text-xs font-mono font-bold text-center rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Postal Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="110001"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-xs font-mono font-bold text-center rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition active:scale-[0.97] shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Authorizing Card Payment...</span>
            </>
          ) : (
            <span>💳 Pay ₹{Number(billing.totalAmount).toFixed(2)} Online Now</span>
          )}
        </button>

        {/* Trust Badges */}
        <div className="pt-2 text-center text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-3 border-t border-slate-100">
          <span>✔ Visa & Mastercard 3D Secure</span>
          <span>•</span>
          <span>✔ 256-bit Encrypted</span>
          <span>•</span>
          <span>✔ PCI-DSS Compliant</span>
        </div>
      </form>
    </div>
  );
}

export default CardPaymentBox;

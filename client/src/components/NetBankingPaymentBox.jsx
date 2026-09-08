import { useState } from "react";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

const BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "Canara Bank",
  "Union Bank of India",
  "Other Bank (NEFT / RTGS Wire Transfer)",
];

function NetBankingPaymentBox({ billing, onPaymentSuccess, isPatient }) {
  const [bankName, setBankName] = useState(BANKS[0]);
  const [customerRef, setCustomerRef] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const transactionRef = customerRef.trim() || "NINB" + Math.floor(1000000000 + Math.random() * 9000000000);
      const payload = {
        paymentMethod: "netbanking",
        netbankingDetails: {
          bankName,
          transactionRef,
        },
      };

      let res;
      if (isPatient) {
        res = await payMyBillingUpi(billing._id, payload);
      } else {
        res = await updatePaymentStatus(billing._id, {
          paymentStatus: "paid",
          paymentMethod: "netbanking",
          netbankingDetails: payload.netbankingDetails,
        });
      }

      onPaymentSuccess?.(res.billing);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Net banking payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Internet Banking & Wire Transfer</h3>
          <p className="text-xs text-slate-600 font-medium">Pay directly via your retail / corporate bank account</p>
        </div>
        <span className="text-xs font-bold text-teal-900 bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-300">
          🏦 Direct NetBanking
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Select Your Bank *
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-hidden"
          >
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Bank Ref / NEFT-RTGS UTR Number (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. SBIN9876543210 or Bank Reference No"
            value={customerRef}
            onChange={(e) => setCustomerRef(e.target.value)}
            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-teal-600 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-all shadow-md shadow-teal-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Connecting to {bankName}...</span>
            </>
          ) : (
            <span>🏦 Pay ₹{Number(billing.totalAmount).toFixed(2)} via Net Banking</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default NetBankingPaymentBox;

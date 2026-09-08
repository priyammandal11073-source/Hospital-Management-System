import { useState } from "react";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

function ChequePaymentBox({ billing, onPaymentSuccess, isPatient }) {
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [micrCode, setMicrCode] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!chequeNumber.trim()) {
      setErrorMsg("Please enter the 6-digit cheque or DD number.");
      return;
    }
    if (!bankName.trim()) {
      setErrorMsg("Please enter the issuing bank name.");
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const payload = {
        paymentMethod: "cheque",
        chequeDetails: {
          chequeNumber: chequeNumber.trim(),
          bankName: bankName.trim(),
          micrCode: micrCode.trim(),
          transactionRef: "CHQ_CLR_" + Math.floor(100000 + Math.random() * 900000),
        },
      };

      let res;
      if (isPatient) {
        res = await payMyBillingUpi(billing._id, payload);
      } else {
        res = await updatePaymentStatus(billing._id, {
          paymentStatus: "partially_paid",
          paymentMethod: "cheque",
          chequeDetails: payload.chequeDetails,
        });
      }

      onPaymentSuccess?.(res.billing);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit cheque details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Demand Draft & CTS Cheque Clearing</h3>
          <p className="text-xs text-slate-600 font-medium">Record bank Cheque or Demand Draft (DD) details</p>
        </div>
        <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
          📜 Bank Cheque / DD
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Cheque / DD Number *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 000123"
              value={chequeNumber}
              onChange={(e) => setChequeNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Issuing Bank Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Bank, Connaught Place"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            9-Digit MICR Code (Optional)
          </label>
          <input
            type="text"
            maxLength={9}
            placeholder="e.g. 110240001"
            value={micrCode}
            onChange={(e) => setMicrCode(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-amber-600 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Recording cheque / DD details...</span>
            </>
          ) : (
            <span>📜 Submit Cheque / DD for Clearing</span>
          )}
        </button>

        <p className="text-[11px] text-slate-500 font-medium text-center">
          Note: Final payment confirmation is subject to CTS bank cheque realization.
        </p>
      </form>
    </div>
  );
}

export default ChequePaymentBox;

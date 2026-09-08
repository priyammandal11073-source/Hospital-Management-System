import { useState } from "react";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

function WalletPaymentBox({ billing, onPaymentSuccess, isPatient }) {
  const [walletId, setWalletId] = useState(
    billing?.patient?._id ? `NVR-WLT-${billing.patient._id.slice(-6).toUpperCase()}` : "NVR-WLT-881923"
  );
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const payload = {
        paymentMethod: "wallet",
        walletDetails: {
          walletAccountId: walletId,
          transactionRef: "WLT_" + Math.floor(100000000 + Math.random() * 900000000),
        },
      };

      let res;
      if (isPatient) {
        res = await payMyBillingUpi(billing._id, payload);
      } else {
        res = await updatePaymentStatus(billing._id, {
          paymentStatus: "paid",
          paymentMethod: "wallet",
          walletDetails: payload.walletDetails,
        });
      }

      onPaymentSuccess?.(res.billing);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Hospital wallet payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Hospital Patient Advance Wallet</h3>
          <p className="text-xs text-slate-600 font-medium">Deduct payment directly from patient advance deposit credit</p>
        </div>
        <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-300">
          👛 Prepaid Credit
        </span>
      </div>

      {/* Wallet Balance Card */}
      <div className="p-3.5 rounded-xl bg-white border border-purple-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prepaid Advance Balance</span>
          <span className="text-lg font-black text-purple-900 font-mono">₹25,000.00</span>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          ✓ Sufficient Funds
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
            Patient Hospital Wallet ID *
          </label>
          <input
            type="text"
            required
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-purple-600 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Account Authorisation PIN (Optional)
          </label>
          <input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-purple-600 focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition-all shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Deducting from advance deposit...</span>
            </>
          ) : (
            <span>👛 Pay ₹{Number(billing.totalAmount).toFixed(2)} from Hospital Deposit</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default WalletPaymentBox;

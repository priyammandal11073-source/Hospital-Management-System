import { useState } from "react";
import { payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

const INSURANCE_PROVIDERS = [
  "Star Health & Allied Insurance",
  "HDFC ERGO Health Insurance",
  "Care Health Insurance (Religare)",
  "Niva Bupa Health Insurance",
  "ICICI Lombard General Insurance",
  "Ayushman Bharat (PM-JAY National Health Authority)",
  "The New India Assurance Co. Ltd.",
  "Tata AIG General Insurance",
  "SBI General Health Insurance",
  "Bajaj Allianz General Insurance",
  "Corporate Group Medical Insurance",
  "Other TPA / Government Scheme",
];

function InsurancePaymentBox({ billing, onPaymentSuccess, isPatient }) {
  const [providerName, setProviderName] = useState(INSURANCE_PROVIDERS[0]);
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimId, setClaimId] = useState("");
  const [insuredMemberName, setInsuredMemberName] = useState(billing?.patient?.name || "");
  const [contactNumber, setContactNumber] = useState(billing?.patient?.contactNumber || "");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!policyNumber.trim()) {
      setErrorMsg("Please enter your insurance policy or health card number.");
      return;
    }
    if (!claimId.trim()) {
      setErrorMsg("Please enter your TPA Pre-authorization / Claim Reference ID.");
      return;
    }
    if (!insuredMemberName.trim()) {
      setErrorMsg("Please enter the primary insured member name.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate TPA desk pre-authorization check
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const insurancePayload = {
        paymentMethod: "insurance",
        insuranceDetails: {
          providerName,
          policyNumber: policyNumber.trim(),
          claimId: claimId.trim(),
          insuredMemberName: insuredMemberName.trim(),
          contactNumber: contactNumber.trim(),
          notes: notes.trim(),
          status: "pending_verification",
        },
      };

      let res;
      if (isPatient) {
        res = await payMyBillingUpi(billing._id, insurancePayload);
      } else {
        res = await updatePaymentStatus(billing._id, {
          paymentStatus: "partially_paid",
          paymentMethod: "insurance",
          insuranceDetails: insurancePayload.insuranceDetails,
        });
      }

      onPaymentSuccess?.(res.billing);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit insurance details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Health Insurance & TPA Cashless Desk</h3>
          <p className="text-xs text-slate-600 font-medium">Submit policy & claim pre-authorization details for invoice settlement</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300">
          <span>🏥 Cashless TPA</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Insurance Company */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Insurance Provider / Health TPA Company *
          </label>
          <select
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-hidden"
          >
            {INSURANCE_PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        {/* Policy Number & Claim ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Policy / Health Card Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. POL-987654321"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Claim ID / Pre-Auth Ref No *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CLM-2026-4412"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Insured Member & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Primary Insured Member Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={insuredMemberName}
              onChange={(e) => setInsuredMemberName(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Policy Holder Mobile Number
            </label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full text-xs font-mono font-semibold rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Claim Notes / Corporate TPA Authorization Details
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Corporate cashless approval letter attached; TPA desk verification requested for OPD coverage."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white transition-all shadow-md shadow-blue-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Submitting insurance claim details...</span>
            </>
          ) : (
            <span>🏥 Submit Insurance Claim Details</span>
          )}
        </button>

        <p className="text-[11px] text-slate-500 font-medium text-center">
          Note: Hospital TPA Desk will verify policy coverage against invoice total of ₹{Number(billing.totalAmount).toFixed(2)}.
        </p>
      </form>
    </div>
  );
}

export default InsurancePaymentBox;

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

/**
 * InsurancePaymentBox – Emil Kowalski Polish
 * Features:
 * - Tone-on-tone elevation with soft ambient ring
 * - Tactile active press response (scale 0.97)
 * - Clear TPA pre-authorization workflow
 */
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
    <div className="rounded-3xl bg-white p-6 sm:p-7 space-y-6 shadow-xs ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Health Insurance & TPA Cashless Desk</h3>
          <p className="text-xs text-slate-500 font-medium">Submit policy & claim pre-authorization for bill settlement</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-xl ring-1 ring-sky-600/20">
          <span>🏥 Cashless TPA</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Insurance Company */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Insurance Provider / Health TPA Company *
          </label>
          <select
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Policy / Health Card Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. POL-987654321"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Claim ID / Pre-Auth Ref No *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CLM-2026-9876"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Insured Member Name & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Insured Member Name *
            </label>
            <input
              type="text"
              required
              placeholder="Primary policyholder name"
              value={insuredMemberName}
              onChange={(e) => setInsuredMemberName(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Additional Insurance Remarks / Policy Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Co-pay percentage, room rent limit or corporate employee ID..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition active:scale-[0.97] shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              <span>Verifying Cashless Pre-Auth with TPA Desk...</span>
            </>
          ) : (
            <span>🏥 Submit TPA Cashless Claim</span>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center font-medium">
          Once submitted, our hospital billing desk will verify pre-auth with your insurance TPA within 30 minutes.
        </p>
      </form>
    </div>
  );
}

export default InsurancePaymentBox;

/**
 * PaymentPage – public page accessible via SMS payment link & patient portal.
 * Route: /pay/:billingId
 *
 * Patients can view their invoice and pay online directly via UPI, Card Gateway,
 * or submit Insurance TPA details without hassle.
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UpiPaymentBox from "../components/UpiPaymentBox.jsx";
import CardPaymentBox from "../components/CardPaymentBox.jsx";
import InsurancePaymentBox from "../components/InsurancePaymentBox.jsx";
import PaymentMethodSelect from "../components/PaymentMethodSelect.jsx";
import { getBillingById, payMyBillingUpi, updatePaymentStatus } from "../services/api.js";

const STATUS_COLORS = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  partially_paid: "bg-blue-100 text-blue-800 border-blue-300",
};

function PaymentPage() {
  const { billingId } = useParams();
  const navigate = useNavigate();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Detect if user is a patient (has patient token)
  const isPatient = Boolean(localStorage.getItem("patient_token"));

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

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      let updated;
      if (isPatient) {
        const res = await payMyBillingUpi(billingId, {
          paymentMethod,
        });
        updated = res.billing;
      } else {
        const res = await updatePaymentStatus(billingId, {
          paymentStatus: "paid",
          paymentMethod,
        });
        updated = res.billing;
      }
      setBilling(updated);
      setSuccessMsg(`Payment recorded as ${paymentMethod.toUpperCase()}. Thank you!`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handlePaymentSuccess = (updatedBilling) => {
    setBilling(updatedBilling);
    setSuccessMsg("Payment / Claim update recorded successfully!");
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your invoice…</p>
        </div>
      </div>
    );
  }

  // ── Login required ─────────────────────────────────────────────────────────
  if (error === "login_required") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-8 text-center space-y-5">
          <div className="text-5xl">🔐</div>
          <h1 className="text-2xl font-bold text-slate-900">Login Required</h1>
          <p className="text-slate-600 text-sm">
            Please log in to your patient account to view and pay this invoice.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/patient/login?redirect=/pay/${billingId}`}
              className="block w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 transition"
            >
              Log in as Patient
            </Link>
            <Link
              to="/login"
              className="block w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Log in as Staff
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Generic error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Invoice not found</h1>
          <p className="text-slate-600 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!billing) return null;

  const invoiceNumber = `INV-${billing._id?.toString().slice(-6).toUpperCase()}`;
  const isPaid = billing.paymentStatus === "paid";
  const docName = billing.appointment?.doctor?.name
    ? `Dr. ${billing.appointment.doctor.name}`
    : "Doctor";
  const apptDate = billing.appointment?.appointmentDate
    ? new Date(billing.appointment.appointmentDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-teal-700 tracking-tight">
              Nivora Care Hospital
            </h1>
            <p className="text-xs text-slate-500">Secure Online Payment Gateway</p>
          </div>
          <span
            className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${STATUS_COLORS[billing.paymentStatus] || STATUS_COLORS.pending}`}
          >
            {billing.paymentStatus.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ── Invoice Summary ── */}
        <section className="rounded-2xl bg-white shadow-md p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</p>
              <p className="text-3xl font-black text-teal-700 mt-0.5 font-mono">
                ₹{Number(billing.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-500">Patient</span>
              <p className="font-semibold text-slate-900">{billing.patient?.name || "—"}</p>
            </div>
            <div>
              <span className="text-slate-500">Doctor</span>
              <p className="font-semibold text-slate-900">{docName}</p>
            </div>
            <div>
              <span className="text-slate-500">Appointment</span>
              <p className="font-semibold text-slate-900">{apptDate}</p>
            </div>
            <div>
              <span className="text-slate-500">Time Slot</span>
              <p className="font-semibold text-slate-900">{billing.appointment?.timeSlot || "—"}</p>
            </div>
          </div>

          {/* Itemized charges */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-slate-500 font-semibold">Description</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-500 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {billing.itemizedCharges?.map((charge, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-700">{charge.description}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">
                      ₹{Number(charge.cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-teal-800">Total</td>
                  <td className="px-4 py-2.5 text-right font-black text-teal-800 font-mono text-base">
                    ₹{Number(billing.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── Payment Section ── */}
        {!isPaid ? (
          <section className="rounded-2xl bg-white shadow-md p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900">Select Payment Method</h2>

            <PaymentMethodSelect
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* UPI Payment Flow */}
            {paymentMethod === "upi" && (
              <UpiPaymentBox
                billing={billing}
                onPaymentSuccess={handlePaymentSuccess}
                isPatient={isPatient}
              />
            )}

            {/* Online Card Payment Gateway */}
            {paymentMethod === "card" && (
              <CardPaymentBox
                billing={billing}
                onPaymentSuccess={handlePaymentSuccess}
                isPatient={isPatient}
              />
            )}

            {/* Health Insurance & TPA Desk */}
            {paymentMethod === "insurance" && (
              <InsurancePaymentBox
                billing={billing}
                onPaymentSuccess={handlePaymentSuccess}
                isPatient={isPatient}
              />
            )}

            {/* Cash Payment Instructions */}
            {paymentMethod === "cash" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  💵 Please visit the hospital billing counter to pay in cash. Your invoice will be marked as paid once payment is received at the reception desk.
                </p>

                {/* Staff-only instant mark paid */}
                {!isPatient && (
                  <button
                    type="button"
                    disabled={isMarkingPaid}
                    onClick={handleMarkPaid}
                    className="w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition"
                  >
                    {isMarkingPaid ? "Recording…" : "Mark as Paid (CASH)"}
                  </button>
                )}

                {errorMsg && (
                  <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                )}
                {successMsg && (
                  <p className="text-sm text-emerald-700 font-semibold">{successMsg}</p>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-2xl bg-emerald-50 border border-emerald-200 shadow-md p-6 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-black text-emerald-800">Invoice Paid!</h2>
            <p className="text-sm text-slate-600">
              This invoice has been settled. Thank you for choosing Nivora Care Hospital.
            </p>
            {billing.upiTransactionId && (
              <p className="text-xs text-slate-500">
                UPI Reference UTR: <code className="font-mono font-bold text-emerald-700">{billing.upiTransactionId}</code>
              </p>
            )}
            {billing.cardDetails?.transactionRef && (
              <p className="text-xs text-slate-500">
                Card Transaction Ref: <code className="font-mono font-bold text-emerald-700">{billing.cardDetails.transactionRef}</code> ({billing.cardDetails.cardBrand} ending in •••• {billing.cardDetails.cardLast4})
              </p>
            )}
          </section>
        )}

        {/* Display Insurance TPA submission status if partially paid via insurance */}
        {billing.paymentStatus === "partially_paid" && billing.insuranceDetails && (
          <section className="rounded-2xl bg-blue-50 border border-blue-200 shadow-md p-6 space-y-2 text-xs text-blue-950">
            <div className="flex items-center justify-between font-bold text-sm">
              <span>🏥 Insurance Claim Submission Status</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 uppercase text-[10px]">
                {billing.insuranceDetails.status.replace("_", " ")}
              </span>
            </div>
            <p><strong>Provider:</strong> {billing.insuranceDetails.providerName}</p>
            <p><strong>Policy No:</strong> {billing.insuranceDetails.policyNumber}</p>
            <p><strong>Claim Ref ID:</strong> {billing.insuranceDetails.claimId}</p>
            <p><strong>Insured Member:</strong> {billing.insuranceDetails.insuredMemberName}</p>
          </section>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Nivora Care Hospital · Outer Ring Road, Near AIIMS Metro, New Delhi · +91 9876543210
        </p>
      </main>
    </div>
  );
}

export default PaymentPage;

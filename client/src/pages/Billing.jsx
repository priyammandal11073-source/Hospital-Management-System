import { useEffect, useState } from "react";
import BillingForm from "../components/BillingForm.jsx";
import InvoiceModal from "../components/InvoiceModal.jsx";
import PaymentMethodSelect from "../components/PaymentMethodSelect.jsx";
import {
  getBillingById,
  getBillings,
  sendBillingPaymentLinkSms,
  updatePaymentStatus,
} from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const paymentStatuses = ["pending", "paid", "partially_paid"];
const paymentMethods = ["cash", "card", "insurance", "upi", "netbanking", "wallet", "cheque"];

const paymentMethodLabels = {
  cash: "Cash",
  card: "Online Card",
  insurance: "Health Insurance",
  upi: "Instant UPI",
  netbanking: "Net Banking",
  wallet: "Hospital Wallet",
  cheque: "Cheque / DD",
};

const paymentStatusLabels = {
  pending: "Pending",
  paid: "Paid",
  partially_paid: "Partially paid",
};

const paymentStatusClasses = {
  pending: "bg-yellow-100 text-yellow-800 ring-yellow-400/40",
  paid: "bg-green-100 text-green-800 ring-green-400/40",
  partially_paid: "bg-orange-100 text-orange-800 ring-orange-400/40",
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Billing() {
  const { user } = useAuth();
  const canManageBilling = ["admin", "receptionist"].includes(user?.role);
  const [billings, setBillings] = useState([]);
  const [filters, setFilters] = useState({
    paymentStatus: "",
    startDate: "",
    endDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentBilling, setPaymentBilling] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [upiUtr, setUpiUtr] = useState("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // SMS payment link state
  const [smsBilling, setSmsBilling] = useState(null);
  const [smsPhone, setSmsPhone] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchBillings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const listData = await getBillings(filters);
        // The list API populates the patient. Fetch each detail only to obtain its
        // populated appointment date until the backend list endpoint includes it.
        const detailedBillings = await Promise.all(
          listData.billings.map(async (billing) => {
            if (typeof billing.appointment !== "string") return billing;
            const detailData = await getBillingById(billing._id);
            return detailData.billing;
          })
        );

        if (isCurrentRequest) setBillings(detailedBillings);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load billing records.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchBillings();

    return () => {
      isCurrentRequest = false;
    };
  }, [filters, refreshKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    if (!paymentBilling) return;

    setIsUpdatingPayment(true);
    setError("");

    try {
      const payload = {
        paymentStatus: "paid",
        paymentMethod,
      };
      if (paymentMethod === "upi" && upiUtr.trim()) {
        payload.upiTransactionId = upiUtr.trim();
      }
      await updatePaymentStatus(paymentBilling._id, payload);
      setPaymentBilling(null);
      setUpiUtr("");
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update payment status.");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleBillingSuccess = () => {
    setIsFormOpen(false);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleSendSms = async (e) => {
    e.preventDefault();
    if (!smsBilling) return;
    setIsSendingSms(true);
    setSmsResult("");
    try {
      await sendBillingPaymentLinkSms(smsBilling._id, smsPhone || undefined);
      setSmsResult("✅ Payment link sent successfully!");
    } catch (err) {
      setSmsResult("❌ " + (err.response?.data?.message || "Failed to send SMS."));
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Billing</h1>
          <p className="mt-1 text-sm text-slate-600">Create invoices and track patient payments.</p>
        </div>
        {canManageBilling ? (
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => setIsFormOpen(true)}
            type="button"
          >
            + Create bill
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700">
            👁️ View-only access (Nursing staff)
          </span>
        )}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Payment status
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="paymentStatus"
            onChange={handleFilterChange}
            value={filters.paymentStatus}
          >
            <option value="">All payment statuses</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {paymentStatusLabels[status] || status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          From date
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="startDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.startDate}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          To date
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="endDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.endDate}
          />
        </label>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-center text-slate-600">Loading billing records...</p>
        ) : billings.length === 0 ? (
          <p className="p-6 text-center text-slate-600">No billing records found.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Appointment date</th>
                <th className="px-4 py-3">Total amount</th>
                <th className="px-4 py-3">Payment status</th>
                <th className="px-4 py-3">Payment date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {billings.map((billing) => (
                <tr key={billing._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold text-xs ring-1 ring-amber-500/20 flex-shrink-0">
                        INV
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{billing.patient?.name || "Unknown patient"}</p>
                        <p className="text-xs text-slate-500">
                          #{billing._id.toString().slice(-6).toUpperCase()} • Dr. {billing.appointment?.doctor?.name || "Hospital Specialist"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {formatDate(billing.appointment?.appointmentDate)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{billing.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                        paymentStatusClasses[billing.paymentStatus]
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
                      {paymentStatusLabels[billing.paymentStatus] || billing.paymentStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 font-mono">
                    {formatDate(billing.paymentDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right space-x-2">
                    <button
                      className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                      onClick={() => setSelectedInvoice(billing)}
                      type="button"
                    >
                      📄 Invoice
                    </button>
                    {billing.paymentStatus !== "paid" && (
                      canManageBilling ? (
                        <>
                          <button
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs"
                            onClick={() => {
                              setPaymentBilling(billing);
                              setPaymentMethod("cash");
                            }}
                            type="button"
                          >
                            Mark as paid
                          </button>
                          <button
                            className="rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition shadow-2xs"
                            onClick={() => {
                              setSmsBilling(billing);
                              setSmsPhone(billing.patient?.contactNumber || "");
                              setSmsResult("");
                            }}
                            type="button"
                          >
                            📲 Send SMS link
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded-md border border-amber-200">
                          Unsettled
                        </span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Create bill</h2>
              <button
                aria-label="Close form"
                className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <BillingForm onCancel={() => setIsFormOpen(false)} onSuccess={handleBillingSuccess} />
          </div>
        </div>
      )}

      {paymentBilling && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <form className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onSubmit={handlePaymentSubmit}>
            <h2 className="text-xl font-semibold text-slate-800">Mark bill as paid</h2>
            <p className="mt-2 text-sm text-slate-600">
              Confirm payment of ₹{paymentBilling.totalAmount.toFixed(2)} for {paymentBilling.patient?.name || "this patient"}.
            </p>

            <div className="mt-4">
              <PaymentMethodSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                label="Payment Method"
              />
            </div>
            {paymentMethod === "upi" && (
              <label className="mt-3 block text-sm font-medium text-slate-700">
                UPI transaction / UTR number
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
                    placeholder="e.g. 423891029381"
                    value={upiUtr}
                    onChange={(e) => setUpiUtr(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                    onClick={() => setUpiUtr("UPI" + Math.floor(100000000000 + Math.random() * 900000000000))}
                  >
                    Generate mock UTR
                  </button>
                </div>
              </label>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setPaymentBilling(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-400"
                disabled={isUpdatingPayment}
                type="submit"
              >
                {isUpdatingPayment ? "Updating..." : "Confirm payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SMS Payment Link Modal ── */}
      {smsBilling && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
            onSubmit={handleSendSms}
          >
            <h2 className="text-xl font-semibold text-slate-800">📲 Send Payment Link via SMS</h2>
            <p className="text-sm text-slate-600">
              Send a secure payment link to the patient's phone. They can pay online without visiting the hospital.
            </p>

            <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-violet-900">
              <p className="font-semibold">{smsBilling.patient?.name}</p>
              <p className="text-xs text-violet-700 mt-0.5">Invoice #{smsBilling._id?.toString().slice(-6).toUpperCase()} · ₹{smsBilling.totalAmount?.toFixed(2)}</p>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Patient phone number
              <input
                type="tel"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono"
                placeholder="10-digit mobile number"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
              <span className="text-xs text-slate-400 mt-0.5 block">Pre-filled from patient record. Edit if needed.</span>
            </label>

            {smsResult && (
              <p className={`text-sm font-medium ${
                smsResult.startsWith("✅") ? "text-emerald-700" : "text-red-600"
              }`}>{smsResult}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => { setSmsBilling(null); setSmsResult(""); }}
                type="button"
              >
                Close
              </button>
              <button
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                disabled={isSendingSms}
                type="submit"
              >
                {isSendingSms ? "Sending…" : "Send SMS"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onBillingUpdate={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </section>
  );
}

export default Billing;

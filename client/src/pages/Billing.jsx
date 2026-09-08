import { useEffect, useState } from "react";
import BillingForm from "../components/BillingForm.jsx";
import InvoiceModal from "../components/InvoiceModal.jsx";
import {
  getBillingById,
  getBillings,
  updatePaymentStatus,
} from "../services/api.js";

const paymentStatuses = ["pending", "paid", "partially_paid"];
const paymentMethods = ["cash", "card", "insurance", "upi"];

const paymentStatusClasses = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-orange-100 text-orange-800",
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

function Billing() {
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
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      await updatePaymentStatus(paymentBilling._id, {
        paymentStatus: "paid",
        paymentMethod,
      });
      setPaymentBilling(null);
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

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Billing</h1>
          <p className="mt-1 text-sm text-slate-600">Create invoices and track patient payments.</p>
        </div>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          + Create Bill
        </button>
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
                {status}
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
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <tr key={billing._id}>
                  <td className="px-4 py-3 font-medium">{billing.patient?.name || "Unknown patient"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(billing.appointment?.appointmentDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">₹{billing.totalAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        paymentStatusClasses[billing.paymentStatus]
                      }`}
                    >
                      {billing.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(billing.paymentDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                    <button
                      className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                      onClick={() => setSelectedInvoice(billing)}
                      type="button"
                    >
                      📄 Invoice
                    </button>
                    {billing.paymentStatus !== "paid" && (
                      <button
                        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                        onClick={() => {
                          setPaymentBilling(billing);
                          setPaymentMethod("cash");
                        }}
                        type="button"
                      >
                        Mark as Paid
                      </button>
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
              <h2 className="text-xl font-semibold text-slate-800">Create Bill</h2>
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
            <h2 className="text-xl font-semibold text-slate-800">Mark Bill as Paid</h2>
            <p className="mt-2 text-sm text-slate-600">
              Confirm payment of ₹{paymentBilling.totalAmount.toFixed(2)} for {paymentBilling.patient?.name || "this patient"}.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Payment method
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                onChange={(event) => setPaymentMethod(event.target.value)}
                value={paymentMethod}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
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
                {isUpdatingPayment ? "Updating..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </section>
  );
}

export default Billing;

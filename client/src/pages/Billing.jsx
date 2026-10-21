import { useEffect, useState } from "react";
import BillingForm from "../components/BillingForm.jsx";
import InvoiceModal from "../components/InvoiceModal.jsx";
import UniversalPaymentModal from "../components/UniversalPaymentModal.jsx";
import PaymentMethodSelect from "../components/PaymentMethodSelect.jsx";
import {
  getBillingById,
  getBillings,
  sendBillingPaymentLinkSms,
  updatePaymentStatus,
} from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { exportToCsv } from "../utils/csvExport.js";
import ActionMenu from "../components/ui/ActionMenu.jsx";
import { formatDoctorName } from "../utils/doctorName.js";

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
        <button
          type="button"
          className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          onClick={() =>
            exportToCsv({
              filename: `billing-invoices.csv`,
              headers: ["Invoice #", "Patient", "Department", "Date", "Total", "Paid", "Status", "Method"],
              rows: billings.map((b) => [
                b.invoiceNumber || String(b._id).slice(-6).toUpperCase(),
                b.patient?.name || "Walk-in",
                b.department || "—",
                new Date(b.createdAt || b.billDate || Date.now()).toLocaleString("en-IN"),
                Number(b.totalAmount || 0).toFixed(2),
                Number(b.paidAmount || 0).toFixed(2),
                (b.paymentStatus || "").replace(/_/g, " "),
                b.paymentMethod || "—",
              ]),
            })
          }
          disabled={billings.length === 0}
        >
          ⬇ Export CSV
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

      {isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent mb-2"></div>
          <p>Loading billing records...</p>
        </div>
      ) : billings.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          No billing records found.
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card View (< md) */}
          <div className="block md:hidden space-y-3">
            {billings.map((billing) => (
              <div
                key={billing._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-black text-xs ring-1 ring-amber-500/20 flex-shrink-0">
                      INV
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {billing.patient?.name || "Unknown patient"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        #{billing._id.toString().slice(-6).toUpperCase()} • {formatDoctorName(billing.appointment?.doctor?.name, "Specialist")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${
                      paymentStatusClasses[billing.paymentStatus]
                    }`}
                  >
                    {paymentStatusLabels[billing.paymentStatus] || billing.paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Amount</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{billing.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Appt Date</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {formatDate(billing.appointment?.appointmentDate)}
                    </span>
                  </div>
                  {billing.paymentDate && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Paid On</span>
                      <span className="font-mono text-xs text-emerald-700 font-semibold">{formatDate(billing.paymentDate)}</span>
                    </div>
                  )}
                </div>

                {/* Mobile Touch-Friendly Action Buttons */}
                <div className="pt-1">
                  <ActionMenu
                    triggerLabel="Actions"
                    triggerIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    }
                    items={[
                      {
                        label: "View / Print",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                        primary: true,
                        onClick: () => setSelectedInvoice(billing),
                      },
                      {
                        label: "Download PDF",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                        onClick: () => {
                          setSelectedInvoice(billing);
                          setTimeout(() => {
                            const printBtn = document.querySelector('button[title="Print or Save as PDF"]');
                            printBtn?.click();
                          }, 300);
                        },
                      },
                      {
                        label: "Email Invoice",
                        icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                        disabled: !billing.patient?.email,
                        onClick: () => {
                          setSelectedInvoice(billing);
                          setTimeout(() => {
                            const emailBtn = document.querySelector('button[title^="Send invoice to"]');
                            emailBtn?.click();
                          }, 300);
                        },
                      },
                      {
                        label: "WhatsApp",
                        icon: <span className="text-sm">💬</span>,
                        disabled: !billing.patient?.contactNumber,
                        onClick: () => {
                          setSelectedInvoice(billing);
                          setTimeout(() => {
                            const waLink = document.querySelector('a[href^="https://wa.me/"]');
                            waLink?.click();
                          }, 300);
                        },
                      },
                      { divider: true },
                      ...(billing.paymentStatus !== "paid" && canManageBilling ? [
                        {
                          label: "Mark as Paid",
                          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
                          onClick: () => {
                            setPaymentBilling(billing);
                            setPaymentMethod("cash");
                          },
                        },
                        {
                          label: "Send SMS Link",
                          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h4M8 12l-2-2m2 2l2-2m-4 4v6M8 12V4m-2 8l4-4m-4 4l4 4" /></svg>,
                          onClick: () => {
                            setSmsBilling(billing);
                            setSmsPhone(billing.patient?.contactNumber || "");
                            setSmsResult("");
                          },
                        },
                      ] : []),
                    ]}
                    align="left"
                    triggerClassName="w-full justify-center"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl bg-white shadow-xs ring-1 ring-slate-200/80">
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
                            #{billing._id.toString().slice(-6).toUpperCase()} • {formatDoctorName(billing.appointment?.doctor?.name, "Hospital Specialist")}
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
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <ActionMenu
                        triggerIcon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        }
                        items={[
                          {
                            label: "View / Print",
                            icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                            primary: true,
                            onClick: () => setSelectedInvoice(billing),
                          },
                          {
                            label: "Download PDF",
                            icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                            onClick: () => {
                              setSelectedInvoice(billing);
                              setTimeout(() => {
                                const printBtn = document.querySelector('button[title="Print or Save as PDF"]');
                                printBtn?.click();
                              }, 300);
                            },
                          },
                          {
                            label: "Email Invoice",
                            icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                            disabled: !billing.patient?.email,
                            onClick: () => {
                              setSelectedInvoice(billing);
                              setTimeout(() => {
                                const emailBtn = document.querySelector('button[title^="Send invoice to"]');
                                emailBtn?.click();
                              }, 300);
                            },
                          },
                          {
                            label: "WhatsApp",
                            icon: <span className="text-sm">💬</span>,
                            disabled: !billing.patient?.contactNumber,
                            onClick: () => {
                              setSelectedInvoice(billing);
                              setTimeout(() => {
                                const waLink = document.querySelector('a[href^="https://wa.me/"]');
                                waLink?.click();
                              }, 300);
                            },
                          },
                          { divider: true },
                          ...(billing.paymentStatus !== "paid" && canManageBilling ? [
                            {
                              label: "Mark as Paid",
                              icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
                              onClick: () => {
                                setPaymentBilling(billing);
                                setPaymentMethod("cash");
                              },
                            },
                            {
                              label: "Send SMS Link",
                              icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h4M8 12l-2-2m2 2l2-2m-4 4v6M8 12V4m-2 8l4-4m-4 4l4 4" /></svg>,
                              onClick: () => {
                                setSmsBilling(billing);
                                setSmsPhone(billing.patient?.contactNumber || "");
                                setSmsResult("");
                              },
                            },
                          ] : []),
                        ]}
                        align="right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isFormOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2.5 sm:p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="modal-viewport w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Generate Patient Bill</h2>
              <button
                aria-label="Close form"
                className="rounded-lg p-1.5 text-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition touch-target flex items-center justify-center cursor-pointer"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <BillingForm onCancel={() => setIsFormOpen(false)} onSuccess={handleBillingSuccess} />
          </div>
        </div>
      )}

      {paymentBilling && (
        <UniversalPaymentModal
          billing={paymentBilling}
          isOpen={Boolean(paymentBilling)}
          onClose={() => setPaymentBilling(null)}
          onPaymentSuccess={() => {
            setPaymentBilling(null);
            setRefreshKey((k) => k + 1);
          }}
          title="Settle Patient Invoice"
        />
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

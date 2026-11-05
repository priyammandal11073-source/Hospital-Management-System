import { useEffect, useState, useMemo } from "react";
import BillingForm from "../components/BillingForm.jsx";
import InvoiceModal from "../components/InvoiceModal.jsx";
import UniversalPaymentModal from "../components/UniversalPaymentModal.jsx";
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
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
  Modal,
} from "../components/ui/index.js";

const paymentStatuses = ["pending", "paid", "partially_paid"];

const paymentStatusLabels = {
  pending: "Pending",
  paid: "Paid",
  partially_paid: "Partially paid",
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
  const [refreshKey, setRefreshKey] = useState(0);
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

  // Executive Metrics computation
  const metrics = useMemo(() => {
    const totalBilled = billings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalCollected = billings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const totalOutstanding = billings
      .filter((b) => b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const paidCount = billings.filter((b) => b.paymentStatus === "paid").length;
    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      count: billings.length,
      paidCount,
    };
  }, [billings]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
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
      setSmsResult("✅ Payment link sent successfully via SMS!");
    } catch (err) {
      setSmsResult("❌ " + (err.response?.data?.message || "Failed to send SMS."));
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Billing & Invoicing"
        subtitle="Generate patient invoices, collect payments, and track hospital revenue ledger."
        actions={[
          canManageBilling ? (
            <Button
              key="create"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              leftIcon={<span className="text-base font-bold">+</span>}
              className="active:scale-[0.97] transition-transform duration-150"
            >
              Create Bill
            </Button>
          ) : (
            <Badge key="view" status="active">
              👁️ View-only access
            </Badge>
          ),
          <Button
            key="export"
            variant="outline"
            size="sm"
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
            className="active:scale-[0.97] transition-transform duration-150"
          >
            ⬇ Export CSV
          </Button>,
        ]}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-bold text-rose-800" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── Emil Kowalski Executive KPI Metrics Strip ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
          <p className="mt-1.5 text-2xl font-black text-slate-900 font-mono tabular-nums">
            ₹{metrics.totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics.count} invoices issued</span>
            <span className="font-mono text-[10px] text-teal-700 font-bold">100% Tax Compliant</span>
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-800 font-mono tabular-nums">
            ₹{metrics.totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics.paidCount} settled receipts</span>
            <span className="text-[10px] text-emerald-700 font-bold font-mono">
              {metrics.count > 0 ? Math.round((metrics.paidCount / metrics.count) * 100) : 0}% Cleared
            </span>
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Dues</p>
          <p className={`mt-1.5 text-2xl font-black font-mono tabular-nums ${metrics.totalOutstanding > 0 ? "text-amber-800" : "text-slate-900"}`}>
            ₹{metrics.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100">
            Awaiting patient or insurance settlement
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card bg-white p-5 shadow-xs ring-1 ring-slate-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Gateways</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 ring-1 ring-teal-600/20">
              UPI QR
            </span>
            <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-800 ring-1 ring-indigo-600/20">
              Razorpay
            </span>
            <span className="inline-flex items-center rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 ring-1 ring-sky-600/20">
              TPA Cashless
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
            Instant reconciliation active
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="grid gap-3 md:grid-cols-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-700 mb-1">Payment Status</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-800 font-medium focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
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
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-700 mb-1">From Date</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-800 font-medium focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            name="startDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.startDate}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-700 mb-1">To Date</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-800 font-medium focus:border-teal-600 focus:bg-white focus:outline-none transition-colors"
            name="endDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.endDate}
          />
        </div>
      </div>

      {/* ── Table & List Views ── */}
      {isLoading ? (
        <Card title="Loading billing records…" subtitle="Please wait while we fetch the latest invoice data.">
          <PageLoader message="Loading billing records…" />
        </Card>
      ) : billings.length === 0 ? (
        <EmptyStateCard
          icon="🧾"
          title="No billing records found"
          description="Create a new bill or adjust your filters to see existing invoices."
        />
      ) : (
        <>
          {/* Mobile responsive cards */}
          <div className="block md:hidden space-y-3">
            {billings.map((billing) => (
              <div key={billing._id} className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs space-y-3 liquid-glass-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-mono font-black text-xs ring-1 ring-teal-600/20 flex-shrink-0">
                      INV
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {billing.patient?.name || "Unknown patient"}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        #{billing._id.toString().slice(-6).toUpperCase()} • {formatDoctorName(billing.appointment?.doctor?.name, "Specialist")}
                      </p>
                    </div>
                  </div>
                  <Badge status={billing.paymentStatus}>
                    {paymentStatusLabels[billing.paymentStatus] || billing.paymentStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Amount</span>
                    <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                      ₹{billing.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Appt Date</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {formatDate(billing.appointment?.appointmentDate)}
                    </span>
                  </div>
                  {billing.paymentDate && (
                    <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settled On</span>
                      <span className="font-mono text-xs text-emerald-800 font-bold">{formatDate(billing.paymentDate)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs active:scale-[0.97]"
                    onClick={() => setSelectedInvoice(billing)}
                  >
                    View Invoice
                  </Button>
                  {billing.paymentStatus !== "paid" && canManageBilling && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 text-xs active:scale-[0.97]"
                      onClick={() => setPaymentBilling(billing)}
                    >
                      💳 Settle Bill
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop full data table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Patient / Invoice</th>
                  <th className="px-5 py-3.5">Appointment Date</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment Status</th>
                  <th className="px-5 py-3.5">Settlement Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {billings.map((billing) => (
                  <tr key={billing._id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-mono font-extrabold text-xs ring-1 ring-teal-600/20 flex-shrink-0">
                          INV
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{billing.patient?.name || "Unknown patient"}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            #{billing._id.toString().slice(-6).toUpperCase()} • {formatDoctorName(billing.appointment?.doctor?.name, "Hospital Specialist")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 tabular-nums">
                        {formatDate(billing.appointment?.appointmentDate)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-black text-slate-900 font-mono tabular-nums">
                        ₹{billing.totalAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={billing.paymentStatus}>
                        {paymentStatusLabels[billing.paymentStatus] || billing.paymentStatus}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-mono text-slate-600">
                      {formatDate(billing.paymentDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {billing.paymentStatus !== "paid" && canManageBilling && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPaymentBilling(billing)}
                            className="active:scale-[0.96] text-xs font-bold shadow-2xs"
                          >
                            💳 Settle
                          </Button>
                        )}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Bill Creation Modal ── */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Generate Patient Bill"
          className="max-w-2xl"
        >
          <BillingForm onCancel={() => setIsFormOpen(false)} onSuccess={handleBillingSuccess} />
        </Modal>
      )}

      {/* ── Central Payment Settle Modal ── */}
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

      {/* ── SMS Link Send Modal ── */}
      {smsBilling && (
        <Modal
          isOpen={Boolean(smsBilling)}
          onClose={() => { setSmsBilling(null); setSmsResult(""); }}
          title="📲 Send Payment Link via SMS"
          className="max-w-md"
        >
          <form onSubmit={handleSendSms} className="space-y-4">
            <p className="text-sm text-slate-600">
              Send a secure payment link to the patient's phone. They can pay online instantly without queuing at the desk.
            </p>

            <div className="rounded-2xl bg-teal-50/80 border border-teal-200/80 p-4 text-sm text-teal-900">
              <p className="font-bold">{smsBilling.patient?.name}</p>
              <p className="text-xs text-teal-800 font-mono mt-0.5">
                Invoice #{smsBilling._id?.toString().slice(-6).toUpperCase()} • ₹{smsBilling.totalAmount?.toFixed(2)}
              </p>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Patient Phone Number</label>
              <input
                type="tel"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
                placeholder="10-digit mobile number"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Pre-filled from patient record. Edit if needed.</span>
            </div>

            {smsResult && (
              <p className={`text-xs font-bold ${smsResult.startsWith("✅") ? "text-emerald-800" : "text-rose-700"}`}>
                {smsResult}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setSmsBilling(null); setSmsResult(""); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.97] transition cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={isSendingSms}
                type="submit"
                className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 active:scale-[0.97] transition"
              >
                {isSendingSms ? "Sending…" : "Send SMS Link"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Official Invoice View / Print Modal ── */}
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

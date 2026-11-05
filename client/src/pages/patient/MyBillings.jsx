import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import { getMyBillings } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { PageHeader, Button } from "../../components/ui/index.js";

const statusClasses = {
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
  paid: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20",
  partially_paid: "bg-orange-50 text-orange-800 ring-1 ring-orange-600/20",
};

/**
 * MyBillings – Patient Invoices & Settlement
 * Emil Kowalski Craft Polish:
 * - Tone-on-tone borderless elevation
 * - Direct inline settlement via UniversalPaymentModal
 * - Tabular numbers and high-contrast typography
 */
function MyBillings() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentBilling, setPaymentBilling] = useState(null);

  useEffect(() => {
    let active = true;
    getMyBillings()
      .then((d) => {
        if (active) setBillings(d.billings || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Unable to load bills");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl liquid-glass-card bg-white p-12 text-center shadow-xs ring-1 ring-slate-200/70">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Loading bills & invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 shadow-2xs">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Invoices & Billing", active: true },
        ]}
        title="My Bills & Invoices"
        badge={
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-teal-800 bg-teal-50 ring-1 ring-teal-600/20">
            GST Invoices
          </span>
        }
        subtitle="View, download, and settle your official hospital medical invoices."
      />

      <div className="rounded-2xl liquid-glass-card bg-white p-5 sm:p-6 shadow-xs ring-1 ring-slate-200/70">
        {billings.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 text-xl mb-3 ring-1 ring-slate-200/70">
              🧾
            </div>
            <p className="text-sm font-bold text-slate-900">No billing records found</p>
            <p className="mt-1 text-xs text-slate-500">Your consultation and procedure invoices will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {billings.map((b) => (
              <li
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/70 rounded-xl px-3 transition-colors duration-150"
                key={b._id}
              >
                {/* Left side: Badge + Invoice Number + Subtitle */}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800 ring-1 ring-teal-600/20 font-mono font-extrabold text-xs flex-shrink-0">
                    INV
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">
                      Invoice #{b._id.toString().slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • {b.appointment ? `Consultation (${b.appointment.timeSlot})` : "Hospital Services"}
                    </p>
                  </div>
                </div>

                {/* Right side: Amount + Status Badge + Actions */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono tabular-nums">
                      ₹{b.totalAmount?.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                        statusClasses[b.paymentStatus] || "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-75" />
                      {b.paymentStatus?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.paymentStatus !== "paid" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setPaymentBilling(b)}
                        className="text-xs font-bold active:scale-[0.96] shadow-2xs"
                      >
                        💳 Pay Now
                      </Button>
                    )}
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
                          onClick: () => setSelectedInvoice(b),
                        },
                        {
                          label: "Download PDF",
                          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                          onClick: () => {
                            setSelectedInvoice(b);
                            setTimeout(() => {
                              const printBtn = document.querySelector('button[title="Print or Save as PDF"]');
                              printBtn?.click();
                            }, 300);
                          },
                        },
                        {
                          label: "Email Invoice",
                          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                          disabled: !b.patient?.email,
                          onClick: () => {
                            setSelectedInvoice(b);
                            setTimeout(() => {
                              const emailBtn = document.querySelector('button[title^="Send invoice to"]');
                              emailBtn?.click();
                            }, 300);
                          },
                        },
                        {
                          label: "WhatsApp",
                          icon: <span className="text-sm">💬</span>,
                          disabled: !b.patient?.contactNumber,
                          onClick: () => {
                            setSelectedInvoice(b);
                            setTimeout(() => {
                              const waLink = document.querySelector('a[href^="https://wa.me/"]');
                              waLink?.click();
                            }, 300);
                          },
                        },
                      ]}
                      align="right"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Universal Online Payment Modal */}
      {paymentBilling && (
        <UniversalPaymentModal
          billing={paymentBilling}
          isOpen={Boolean(paymentBilling)}
          onClose={() => setPaymentBilling(null)}
          isPatient={true}
          onPaymentSuccess={(updatedBilling) => {
            setBillings((prev) =>
              prev.map((b) => (b._id === updatedBilling._id ? updatedBilling : b))
            );
            setPaymentBilling(null);
          }}
          title="Online Invoice Settlement"
        />
      )}

      {/* Official Invoice View/Print Modal */}
      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          isPatient={true}
          onBillingUpdate={(updatedBilling) => {
            setBillings((prev) =>
              prev.map((b) => (b._id === updatedBilling._id ? updatedBilling : b))
            );
          }}
        />
      )}
    </section>
  );
}

export default MyBillings;

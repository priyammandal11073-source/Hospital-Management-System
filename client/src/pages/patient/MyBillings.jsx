import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import { getMyBillings } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { PageHeader } from "../../components/ui/index.js";

const statusClasses = {
  pending: "bg-amber-50 text-amber-800 border-amber-200/70",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200/70",
  partially_paid: "bg-orange-50 text-orange-800 border-orange-200/70",
};

function MyBillings() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading bills & invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-xs font-bold text-rose-800 shadow-2xs">
        {error}
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
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            GST Invoices
          </span>
        }
        subtitle="View, download, and settle your official hospital medical invoices."
      />

      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        {billings.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-700 text-xl mb-3">
              🧾
            </div>
            <p className="text-sm font-bold text-slate-900">No billing records found</p>
            <p className="mt-1 text-xs text-slate-500">Your consultation and procedure invoices will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {billings.map((b) => (
              <li
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors"
                key={b._id}
              >
                {/* Left side: Badge + Invoice Number + Subtitle */}
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-mono font-bold text-xs shadow-2xs flex-shrink-0">
                    INV
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      Invoice #{b._id.toString().slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} • {b.appointment ? `Consultation (${b.appointment.timeSlot})` : "Hospital services"}
                    </p>
                  </div>
                </div>

                {/* Right side: Amount + Status Badge + View/Print Button */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                      ₹{b.totalAmount?.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize liquid-glass-pill border ${
                        statusClasses[b.paymentStatus] || "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-75" />
                      {b.paymentStatus?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                        { divider: true },
                        ...(b.paymentStatus !== "paid" ? [{
                          label: "Pay Now",
                          icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2M17 9h2a2 2 0 000-4H5a2 2 0 000 4h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>,
                          primary: true,
                          onClick: () => window.location.href = `/pay/${b._id}`,
                        }] : []),
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

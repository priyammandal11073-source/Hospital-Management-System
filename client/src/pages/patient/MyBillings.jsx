import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import { getMyBillings } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";

const statusClasses = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800", partially_paid: "bg-orange-100 text-orange-800" };

function MyBillings() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    let active = true;
    getMyBillings().then((d) => { if (active) setBillings(d.billings); }).catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load bills"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <p className="text-slate-600">Loading bills...</p>;
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800">My bills</h1>
      <p className="mt-1 text-sm text-slate-600">View and print your medical invoices.</p>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        {billings.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="mt-2 text-sm text-slate-500">No billing records found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {billings.map((b) => (
              <li
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                key={b._id}
              >
                {/* Left side: Badge + Invoice Number + Subtitle */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold text-xs ring-1 ring-amber-500/20 flex-shrink-0">
                    INV
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
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
                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      ₹{b.totalAmount?.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
                        statusClasses[b.paymentStatus] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
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

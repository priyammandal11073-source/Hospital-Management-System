import { useEffect, useState } from "react";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import { getMyBillings } from "../../services/api.js";

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
                    <button
                      onClick={() => setSelectedInvoice(b)}
                      type="button"
                      className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                    >
                      📄 View / print
                    </button>
                    {b.paymentStatus !== "paid" && (
                      <a
                        href={`/pay/${b._id}`}
                        className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-2xs"
                      >
                        💳 Pay Now
                      </a>
                    )}
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

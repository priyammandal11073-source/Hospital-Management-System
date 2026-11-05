import { useState, useEffect } from "react";
import { getBillings, downloadDiagnosticReportPdfBlob } from "../../services/api.js";
import UniversalPaymentModal from "../../components/UniversalPaymentModal.jsx";
import InvoiceModal from "../../components/InvoiceModal.jsx";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

/**
 * DiagnosticBillingPage – Diagnostic, Lab & Radiology Cashier
 * Emil Kowalski Craft Polish:
 * - Tone-on-tone borderless elevation
 * - Tactile active press responses on all cashier buttons (scale 0.96)
 * - Tabular numbers and instant modal settlement
 */
export default function DiagnosticBillingPage() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ paymentStatus: "", search: "" });
  const [search, setSearch] = useState("");
  const [selectedPaymentBilling, setSelectedPaymentBilling] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const res = await getBillings();
      setBillings(res.billings || res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (report) => {
    try {
      setLoading(true);
      const blob = await downloadDiagnosticReportPdfBlob(report._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${report.reportNumber || report._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const filtered = billings.filter((b) => {
    if (filters.paymentStatus && b.paymentStatus !== filters.paymentStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.patientName?.toLowerCase().includes(q) || b.patient?.name?.toLowerCase().includes(q) || b._id?.toLowerCase().includes(q);
  });

  if (loading) {
    return <PageLoader message="Loading diagnostic cashier ledger…" />;
  }

  if (error) {
    return (
      <Card title="Billing Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchBillings} className="active:scale-[0.96]">Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic & Pathology Billing"
        subtitle="Collect test fees, process insurance approvals, print diagnostic receipts, and verify patient dues."
        breadcrumbs={
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Financials & Lab POS</span>
          </span>
        }
      />

      {/* Filter and search bar */}
      <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/70 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search patient, invoice #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="billing-search"
            className="bg-slate-50/80 rounded-xl border-slate-200"
          />
        </div>
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:bg-white transition-colors"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchBillings} className="active:scale-[0.96] text-xs font-bold">
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyStateCard
            icon="🧾"
            title="No billing records found"
            description="Diagnostic test requests will automatically appear here once ordered."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Invoice # / Date</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Test Breakdown</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.invoiceNumber || `INV-${b._id.slice(-6).toUpperCase()}`}
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                        {new Date(b.createdAt || Date.now()).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900">{b.patientName || b.patient?.name || "Unknown patient"}</div>
                      <p className="text-[11px] text-slate-400 font-mono">{b.patientAbhaId || b.patient?.contactNumber || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{b.testName || "Diagnostic & Pathology Investigation"}</td>
                    <td className="px-5 py-4 font-black text-slate-900 font-mono text-sm tabular-nums">
                      ₹{(b.amount || b.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge status={b.paymentStatus}>{b.paymentStatus || "pending"}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {b.paymentStatus !== "paid" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedPaymentBilling(b)}
                            className="text-xs font-bold active:scale-[0.96] shadow-2xs"
                          >
                            💳 Settle
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(b)}
                          className="text-xs font-bold active:scale-[0.96]"
                        >
                          Invoice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(b)}
                          className="text-xs font-bold active:scale-[0.96]"
                        >
                          PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPaymentBilling && (
        <UniversalPaymentModal
          billing={selectedPaymentBilling}
          isOpen={Boolean(selectedPaymentBilling)}
          onClose={() => setSelectedPaymentBilling(null)}
          onPaymentSuccess={() => {
            setSelectedPaymentBilling(null);
            fetchBillings();
          }}
          title="Diagnostic Test Billing & Settlement"
        />
      )}

      {selectedInvoice && (
        <InvoiceModal
          billing={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onBillingUpdate={() => {
            fetchBillings();
          }}
        />
      )}
    </div>
  );
}

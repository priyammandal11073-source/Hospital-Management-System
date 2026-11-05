import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
      link.setAttribute("download", `Report_${report.reportNumber}.pdf`);
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
    return b.patientName?.toLowerCase().includes(q) || b._id?.toLowerCase().includes(q);
  });

  const paymentColors = {
    paid: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    pending: "bg-amber-50 text-amber-800 border border-amber-200",
    partially_paid: "bg-orange-50 text-orange-800 border border-orange-200",
  };

  if (loading) {
    return <PageLoader message="Loading cashier ledger…" />;
  }

  if (error) {
    return (
      <Card title="Billing Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchBillings}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Billing, Cashier & Receipts"
        subtitle="Collect medication payments, process insurance co-pays, print GST tax invoices, and issue refunds."
        breadcrumbs={
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Financials & POS</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search patient, invoice #…" value={search} onChange={(e) => setSearch(e.target.value)} id="billing-search" />
        </div>
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchBillings}>
          Search
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyStateCard icon="🧾" title="No billing records found." description="Transactions will be recorded upon prescription dispensation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice # / Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Bill Breakdown</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">{b.invoiceNumber || `INV-${b._id.slice(-6).toUpperCase()}`}<span className="block text-[10px] text-slate-400">{new Date(b.createdAt).toLocaleDateString("en-IN")}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{b.patientName || "Unknown patient"}</div>
                      <p className="text-[11px] text-slate-500">{b.patientAbhaId || "N/A"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{b.testName || "Diagnostic Examination"}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 font-mono">₹{(b.amount || b.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-3.5"><Badge status={b.paymentStatus}>{b.paymentStatus}</Badge></td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                      {b.paymentStatus !== "paid" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedPaymentBilling(b)}
                        >
                          💳 Pay & Settle
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(b)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(b)}
                      >
                        PDF
                      </Button>
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

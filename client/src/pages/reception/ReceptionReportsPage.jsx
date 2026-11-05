import { useState, useEffect } from "react";
import { getDailyFrontDeskSummary } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  PageLoader,
} from "../../components/ui/index.js";

export default function ReceptionReportsPage() {
  const { openPrintPreview } = usePrintModal();
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handlePrintDailyReport = () => {
    const html = generateGeneralHospitalReportHtml({
      title: "Daily Front Desk Operational & Audit Report",
      subtitle: `Front Desk Census & Inpatient Admission Registry • ${new Date(reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
      metrics: [
        { label: "New Registrations", value: `${summary?.patientsRegistered ?? 0}`, color: "#0284c7" },
        { label: "Checked In", value: `${summary?.checkinsToday ?? 0}`, color: "#16a34a" },
        { label: "Consults Done", value: `${summary?.consultationsCompleted ?? 0}`, color: "#0f766e" },
        { label: "No Shows", value: `${summary?.noShowsToday ?? 0}`, color: "#dc2626" },
        { label: "Collections", value: `₹${(summary?.totalCollected || 0).toLocaleString("en-IN")}`, color: "#059669" },
      ],
      tables: [
        {
          title: "Front Desk Key Operational Performance Indicators",
          headers: ["Operational Metric Indicator", "Count / Value", "Operational Status"],
          rows: [
            ["Total Consultations Scheduled for Today", String(summary?.appointmentsToday ?? 0), "Scheduled Bookings"],
            ["Arrived & Checked In at Reception Desk", String(summary?.checkinsToday ?? 0), "Verified On-Site"],
            ["Completed Specialist Consultations", String(summary?.consultationsCompleted ?? 0), "Clinical Handover Complete"],
            ["Cancelled by Patient / Clinic", String(summary?.cancellationsToday ?? 0), "OPD Slot Freed"],
            ["Patient Absenteeism (No-Shows)", String(summary?.noShowsToday ?? 0), "Unattended"],
            ["New Inpatient Ward Admissions Processed", String(summary?.admissionsToday ?? 0), "Bed Allocated"],
            ["Gross Cashier Collections (Settled)", `₹${(summary?.totalCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, `${summary?.settledInvoicesCount || 0} Invoices Settled`],
            ["Total Outstanding Dues (Pending)", `₹${(summary?.totalPending || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, `${summary?.pendingInvoicesCount || 0} Open Accounts`],
          ],
        },
      ],
      notes: `Official Front Desk Audit certified for Date: ${reportDate}. Prepared by Central Patient Reception & Cashier Counter.`,
    });

    openPrintPreview({
      title: `Front Desk Audit Report - ${reportDate}`,
      htmlContent: html,
      refNumber: `RECPT-${reportDate.replace(/-/g, "")}`,
    });
  };

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await getDailyFrontDeskSummary(reportDate);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("Failed to load daily summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [reportDate]);

  const metricCard = (label, value, subLabel, colorClass) => (
    <Card title={label} subtitle={subLabel}>
      <div className={`text-2xl font-black ${colorClass} mt-1 tabular-nums`}>{value}</div>
    </Card>
  );

  return (
    <div className="space-y-6" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="Daily Front Desk Operational Reports"
        subtitle="Consolidated daily metrics covering outpatient check-ins, admission registrations, no-show rates, and cashier collections."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span><span className="text-xs font-bold uppercase tracking-wider text-amber-600">Operations Intelligence</span></span>}
        actions={[
          <div className="flex items-center gap-3 no-print print:hidden">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-teal-600 focus:outline-none"
            />
            <Button size="sm" onClick={handlePrintDailyReport} leftIcon={<span>🖨️</span>}>
              Print Daily Report
            </Button>
          </div>,
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metricCard("New Registrations", summary?.patientsRegistered ?? 0, "New Patient Files", "text-slate-800")}
        {metricCard("Patients Checked In", summary?.checkinsToday ?? 0, "Arrived at Front Desk", "text-emerald-700")}
        {metricCard("Completed Consults", summary?.consultationsCompleted ?? 0, "Discharged by Doctor", "text-teal-700")}
        {metricCard("No-Shows / Absentees", summary?.noShowsToday ?? 0, "Missed OPD Slots", "text-rose-700")}
        {metricCard("Inpatient Admissions", summary?.admissionsToday ?? 0, "Wards Allocated", "text-purple-700")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Cashier Collections" subtitle="Settled counter transactions">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cashier Collections</span>
            <Badge status="completed">Verified</Badge>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums">₹{(summary?.totalCollected || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Settled Invoices: {summary?.settledInvoicesCount || 0} counter transactions
          </p>
        </Card>

        <Card title="Outstanding Dues" subtitle="Open bills">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Dues</span>
            <Badge status="pending">Unsettled</Badge>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 tabular-nums">₹{(summary?.totalPending || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Pending Settlements: {summary?.pendingInvoicesCount || 0} open bills
          </p>
        </Card>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card clinical-print-sheet printable-card print:shadow-none print:ring-0">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800">Nivora Care Hospital Front Desk Audit</h3>
            <p className="text-xs text-slate-500">Official Daily Operations & Patient Census Log</p>
          </div>
          <div className="text-right text-xs font-mono text-slate-600">
            Date: {new Date(reportDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">Total Consultations Scheduled for Today:</span>
            <span className="font-bold text-right text-slate-800">{summary?.appointmentsToday ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">Arrived & Checked In at Reception:</span>
            <span className="font-bold text-right text-slate-800">{summary?.checkinsToday ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">Completed Specialist Appointments:</span>
            <span className="font-bold text-right text-slate-800">{summary?.consultationsCompleted ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">Cancelled by Patient / Clinic:</span>
            <span className="font-bold text-right text-slate-800">{summary?.cancellationsToday ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">No-Show Patients:</span>
            <span className="font-bold text-right text-slate-800">{summary?.noShowsToday ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">New Ward Admissions Processed:</span>
            <span className="font-bold text-right text-slate-800">{summary?.admissionsToday ?? 0}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
            <span className="text-slate-500">Total Realized Cashier Collections:</span>
            <span className="font-bold text-right text-emerald-700">₹{(summary?.totalCollected || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span>Prepared by Reception Desk</span>
          <span>Duty Supervisor Signature: _________________________</span>
        </div>
      </div>

      {isLoading && <PageLoader message="Compiling daily front desk audit…" />}
    </div>
  );
}

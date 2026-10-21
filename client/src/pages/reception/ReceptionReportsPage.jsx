import { useState, useEffect } from "react";
import { getDailyFrontDeskSummary } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Operations Intelligence</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Daily Front Desk Operational Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated daily metrics covering outpatient check-ins, admission registrations, no-show rates, and cashier collections.
          </p>
        </div>

        <div className="flex items-center gap-3 no-print print:hidden">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
          />
          <button
            onClick={handlePrintDailyReport}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition"
          >
            🖨️ Print Daily Report
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
          <span className="text-xs font-semibold text-slate-500">New Registrations</span>
          <p className="mt-1 text-2xl font-black text-slate-800">{summary?.patientsRegistered ?? 0}</p>
          <span className="text-[10px] text-blue-600 font-bold">New Patient Files</span>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
          <span className="text-xs font-semibold text-slate-500">Patients Checked In</span>
          <p className="mt-1 text-2xl font-black text-slate-800">{summary?.checkinsToday ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Arrived at Front Desk</span>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
          <span className="text-xs font-semibold text-slate-500">Completed Consults</span>
          <p className="mt-1 text-2xl font-black text-slate-800">{summary?.consultationsCompleted ?? 0}</p>
          <span className="text-[10px] text-teal-600 font-bold">Discharged by Doctor</span>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
          <span className="text-xs font-semibold text-slate-500">No-Shows / Absentees</span>
          <p className="mt-1 text-2xl font-black text-rose-600">{summary?.noShowsToday ?? 0}</p>
          <span className="text-[10px] text-rose-600 font-bold">Missed OPD Slots</span>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
          <span className="text-xs font-semibold text-slate-500">Inpatient Admissions</span>
          <p className="mt-1 text-2xl font-black text-purple-700">{summary?.admissionsToday ?? 0}</p>
          <span className="text-[10px] text-purple-600 font-bold">Wards Allocated</span>
        </div>
      </div>

      {/* Cashier Financial Reconciliations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Cashier Collections</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">Verified</span>
          </div>
          <p className="mt-3 text-3xl font-black">₹{(summary?.totalCollected || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-emerald-100/80 mt-1">
            Settled Invoices: {summary?.settledInvoicesCount || 0} counter transactions
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-700 to-orange-800 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Outstanding Dues</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">Unsettled</span>
          </div>
          <p className="mt-3 text-3xl font-black">₹{(summary?.totalPending || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-amber-100/80 mt-1">
            Pending Settlements: {summary?.pendingInvoicesCount || 0} open bills
          </p>
        </div>
      </div>

      {/* Printable Report View */}
      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 clinical-print-sheet printable-card print:shadow-none print:ring-0">
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
    </div>
  );
}

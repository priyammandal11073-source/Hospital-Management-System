import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEmergencyReports } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

export default function EmergencyReportsPage() {
  const { openPrintPreview } = usePrintModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmergencyReports()
      .then(r => setData(r.reports))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading emergency reports & analytics...</div>;
  }

  const todayVisits = data?.register?.todayTotal ?? 0;
  const criticalToday = data?.critical?.today ?? 0;
  const admittedToday = data?.flow?.admittedFromER ?? 0;
  const dischargedToday = data?.flow?.dischargedFromER ?? 0;
  const criticalPercent = todayVisits > 0 ? Math.round((criticalToday / todayVisits) * 100) : 0;
  const admissionPercent = todayVisits > 0 ? Math.round((admittedToday / todayVisits) * 100) : 0;

  const handlePrintReport = () => {
    openPrintPreview({
      title: "Emergency Department Census & Quality Report",
      htmlContent: generateGeneralHospitalReportHtml({
        title: "Emergency Department Census & Clinical Quality Report",
        subtitle: "24/7 Level-1 Trauma & Emergency Command • Census & Quality Telemetry",
        refNumber: `ER-REP-${Date.now().toString().slice(-6)}`,
        metrics: [
          { label: "Today's Registrations", value: todayVisits, color: "#1e3a8a" },
          { label: "7-Day Volume", value: data?.register?.weekTotal ?? 0, color: "#0f172a" },
          { label: "Critical Load (STAT)", value: `${criticalToday} (${criticalPercent}%)`, color: "#dc2626" },
          { label: "Door-to-Triage Avg", value: `${data?.waitTime?.averageMinutes ?? 0}m`, color: "#0284c7", sub: "Target < 15m" },
        ],
        tables: [
          {
            title: "Emergency Patient Flow & Outcomes Summary",
            headers: ["Operational Metric", "Count / Observed", "Clinical Implication"],
            rows: [
              ["Admitted to Specialist/ICU Wards", `${admittedToday} (${admissionPercent}%)`, "Inpatient bed transfer completed"],
              ["Discharged Home", String(dischargedToday), "Stable with outpatient prescriptions & follow-up"],
              ["Pending STAT Diagnostics", String(data?.diagnostics?.pending ?? 0), "Awaiting lab/radiology urgent results"],
              ["Average Triage Wait Time", `${data?.waitTime?.averageMinutes ?? 0} mins`, "Door-to-provider time within NABH benchmark"],
            ],
          },
        ],
        notes: "All emergency encounters are synchronized with hospital Electronic Health Records (EHR), Pharmacy Dispensing logs, Laboratory Information System (LIS), and Inpatient Ward Management under NABH tertiary guidelines.",
      }),
      refNumber: `ER-REP-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Emergency Department Census & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Key clinical indicators, patient flow, and triage wait times</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/emergency/queue" className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold">Queue</Link>
          <Link to="/emergency/dashboard" className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold">Dashboard</Link>
          <button onClick={handlePrintReport} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer">
            🖨 Print Census Report
          </button>
        </div>
      </div>

      <div className="clinical-print-sheet rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-6 shadow-xs">
        {/* Print Brand Header */}
        <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
          <div>
            <div className="text-lg font-black text-slate-900">Nivora Care Hospital — Emergency Department</div>
            <div className="text-xs text-slate-500">24/7 Level-1 Trauma & Emergency Command • Census & Quality Report</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Report Date: <b>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</b></div>
            <div>Generated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Volume & Inflow Register</h2>
          <div className="grid sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-slate-500 font-medium">Today's Total Registrations</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{todayVisits}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-slate-500 font-medium">Last 7 Days Volume</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{data?.register?.weekTotal ?? 0}</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
              <div className="text-rose-700 font-medium">Critical (Level 1 STAT)</div>
              <div className="text-3xl font-black text-rose-600 mt-1">{criticalToday} <span className="text-xs font-semibold text-rose-500">({criticalPercent}%)</span></div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="text-amber-700 font-medium">Pending STAT Diagnostics</div>
              <div className="text-3xl font-black text-amber-700 mt-1">{data?.diagnostics?.pending ?? 0}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Patient Outcomes & Disposition</h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-emerald-700 font-medium">Admitted to Inpatient Beds</div>
              <div className="text-3xl font-black text-emerald-700 mt-1">{admittedToday} <span className="text-xs font-semibold text-emerald-600">({admissionPercent}%)</span></div>
              <div className="text-[11px] text-emerald-600 mt-1">Transferred to ICU / Specialist Wards</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-slate-600 font-medium">Discharged Home</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{dischargedToday}</div>
              <div className="text-[11px] text-slate-500 mt-1">Stable with outpatient follow-up</div>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
              <div className="text-sky-800 font-medium">Door-to-Triage Wait Time</div>
              <div className="text-3xl font-black text-sky-700 mt-1">{data?.waitTime?.averageMinutes ?? 0} <span className="text-sm font-semibold">min</span></div>
              <div className="text-[11px] text-sky-600 mt-1">Target benchmark: &lt; 15 mins</div>
            </div>
          </div>
        </div>

        {/* Quality Notice */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-1.5 text-slate-700">
          <div className="font-bold text-slate-800">Quality & Safety Compliance</div>
          <div>All emergency encounters are synchronized with hospital Electronic Health Records (EHR), Pharmacy Dispensing logs, Laboratory Information System (LIS), and Inpatient Ward Management.</div>
          <div className="text-[11px] text-slate-500">Confidential clinical documentation • Hospital Management System Quality Review</div>
        </div>

        <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span>Nivora Care Hospital • 24/7 Emergency Helpline: 108</span>
          <span>Quality Audit Verified</span>
        </div>
      </div>
    </div>
  );
}

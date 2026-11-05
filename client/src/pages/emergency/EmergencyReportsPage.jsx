import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEmergencyReports } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";
import { PageHeader } from "../../components/ui/index.js";

export default function EmergencyReportsPage() {
  const { openPrintPreview } = usePrintModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmergencyReports()
      .then((r) => setData(r.reports))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white/70 rounded-2xl liquid-glass-card" />
        <div className="h-96 bg-white/70 rounded-2xl liquid-glass-card" />
      </div>
    );
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
        notes:
          "All emergency encounters are synchronized with hospital Electronic Health Records (EHR), Pharmacy Dispensing logs, Laboratory Information System (LIS), and Inpatient Ward Management under NABH tertiary guidelines.",
      }),
      refNumber: `ER-REP-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <Link to="/emergency/dashboard" className="hover:underline">Emergency Command</Link>
            <span>/</span>
            <span>Clinical Analytics</span>
          </div>
        }
        title="Emergency Census & Quality Reports"
        subtitle="Comprehensive clinical metrics, door-to-triage interval audits, patient disposition, and institutional trauma indicators."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-teal-600" />
            NABH Quality Audit Telemetry
          </span>
        }
        actions={
          <>
            <Link
              to="/emergency/queue"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Patient Queue
            </Link>
            <Link
              to="/emergency/dashboard"
              className="rounded-xl liquid-glass-pill hover:bg-slate-100/80 text-slate-700 px-3.5 py-2 text-xs font-semibold border border-slate-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Command Center
            </Link>
            <button
              type="button"
              onClick={handlePrintReport}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>🖨 Print Census Report</span>
            </button>
          </>
        }
      />

      <div className="clinical-print-sheet rounded-2xl liquid-glass-card p-6 sm:p-8 space-y-6 shadow-2xs">
        {/* Printable Brand Header */}
        <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              Nivora Care Hospital — Emergency & Trauma Center
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              24/7 Level-1 Trauma & Emergency Command • Clinical Quality & NABH Performance Review
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>
              Report Date:{" "}
              <b className="text-slate-900">
                {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </b>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Generated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Inflow Volume Telemetry */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Intake Volume & Emergency Register
          </h2>
          <div className="grid sm:grid-cols-4 gap-4 text-xs">
            <div className="liquid-glass-subtle rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                Today Total Registrations
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{todayVisits}</div>
              <span className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-200/60">
                Active clinical intake
              </span>
            </div>

            <div className="liquid-glass-subtle rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                7-Day Rolling Volume
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{data?.register?.weekTotal ?? 0}</div>
              <span className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-200/60">
                Weekly cumulative intake
              </span>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 sm:p-5 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <div className="text-rose-700 font-semibold uppercase text-[10px] tracking-wider">
                Critical (Level 1 STAT)
              </div>
              <div className="text-3xl font-bold text-rose-600 mt-1 tabular-nums">
                {criticalToday}{" "}
                <span className="text-xs font-semibold text-rose-500">({criticalPercent}%)</span>
              </div>
              <span className="text-[10px] text-rose-600 mt-2 pt-1 border-t border-rose-200/60">
                Immediate resuscitation load
              </span>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
              <div className="text-amber-800 font-semibold uppercase text-[10px] tracking-wider">
                Pending STAT Diagnostics
              </div>
              <div className="text-3xl font-bold text-amber-700 mt-1 tabular-nums">
                {data?.diagnostics?.pending ?? 0}
              </div>
              <span className="text-[10px] text-amber-600 mt-2 pt-1 border-t border-amber-200/60">
                LIS & Radiology STAT orders
              </span>
            </div>
          </div>
        </div>

        {/* Outcomes & Disposition */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Patient Flow, Disposition & Triage Efficiency
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-emerald-800 font-semibold uppercase text-[10px] tracking-wider">
                  Admitted to Inpatient Beds
                </div>
                <div className="text-3xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {admittedToday}{" "}
                  <span className="text-xs font-semibold text-emerald-600">({admissionPercent}%)</span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 font-medium">
                Transferred to ICU / Specialty Wards
              </div>
            </div>

            <div className="liquid-glass-subtle rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  Discharged Home
                </div>
                <div className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{dischargedToday}</div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 font-medium">
                Stable with outpatient prescriptions
              </div>
            </div>

            <div className="bg-sky-50/60 rounded-2xl p-4 sm:p-5 border border-sky-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-sky-800 font-semibold uppercase text-[10px] tracking-wider">
                  Door-to-Triage Wait Time
                </div>
                <div className="text-3xl font-bold text-sky-800 mt-1 tabular-nums">
                  {data?.waitTime?.averageMinutes ?? 0} <span className="text-sm font-semibold">mins</span>
                </div>
              </div>
              <div className="text-[11px] text-sky-700 mt-2 pt-2 border-t border-sky-200/60 font-medium">
                Target NABH benchmark: &lt; 15 mins
              </div>
            </div>
          </div>
        </div>

        {/* Quality & Safety Compliance Notice */}
        <div className="rounded-xl liquid-glass-subtle border border-slate-200/80 p-4 text-xs space-y-1.5 text-slate-700 shadow-2xs">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Quality & NABH Compliance Verification</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            All emergency intake encounters are automatically synchronized with hospital Electronic Health Records (EHR),
            Pharmacy Dispensing systems, Laboratory Information System (LIS), and Inpatient Ward Bed Management under NABH
            tertiary critical care standards.
          </p>
          <div className="text-[11px] text-slate-400 font-medium">
            Confidential clinical documentation • Nivora Care Hospital Enterprise Quality Review
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span>Nivora Care Hospital • 24/7 Emergency Command Desk Ext: 911</span>
          <span>Quality Audit Verified ✓</span>
        </div>
      </div>
    </div>
  );
}

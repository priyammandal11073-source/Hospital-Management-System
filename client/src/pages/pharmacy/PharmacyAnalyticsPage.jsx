import { useState, useEffect } from "react";
import { getPharmacyTelemetry } from "../../services/api.js";

export default function PharmacyAnalyticsPage() {
  const [telemetry, setTelemetry] = useState(null);
  const [timeframe, setTimeframe] = useState("today");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getPharmacyTelemetry();
      setTelemetry(data.telemetry || data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value,Target,Status\n" +
      "Prescriptions Today,42,50,Normal\n" +
      "Fulfillment Rate,88%,95%,Good\n" +
      "Average Dispense Time,4.2m,<5m,Optimal\n" +
      "Daily Pharmacy Revenue,₹65400,₹50000,Exceeded\n" +
      "Low Stock Items,4,<5,Stable\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pharmacy_Analytics_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Executive Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Analytics & Performance Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dispensing throughput velocity, inventory turnover ratios, expiry risk models, and pharmacy department revenues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV Audit</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Day-End Report</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Avg Dispense Turnaround</p>
          <p className="mt-1 text-3xl font-black text-slate-900">4.2 min</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-2">↓ 18% faster than benchmark</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Prescription Fill Rate</p>
          <p className="mt-1 text-3xl font-black text-slate-900">97.4%</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-2">↑ High formulary availability</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Inventory Turns / Year</p>
          <p className="mt-1 text-3xl font-black text-slate-900">8.6x</p>
          <p className="text-[11px] font-semibold text-blue-600 mt-2">Optimal capital velocity</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Expiry Loss Ratio</p>
          <p className="mt-1 text-3xl font-black text-emerald-600">&lt; 0.4%</p>
          <p className="text-[11px] font-semibold text-slate-400 mt-2">Protected by FIFO radar</p>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-Wise Volume & Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Therapeutic Class Share & Sales Volume</h2>
          <div className="space-y-4">
            {[
              { name: "Antibiotics & Anti-infectives", percent: 34, revenue: "₹28,400", color: "bg-amber-500" },
              { name: "Cardiovascular & Antihypertensives", percent: 22, revenue: "₹19,200", color: "bg-blue-500" },
              { name: "Analgesics & Anti-inflammatory", percent: 18, revenue: "₹14,500", color: "bg-emerald-500" },
              { name: "Gastrointestinal & Antacids", percent: 14, revenue: "₹11,100", color: "bg-purple-500" },
              { name: "Antidiabetic Formulations", percent: 12, revenue: "₹9,800", color: "bg-teal-500" },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">{cat.name}</span>
                  <span className="font-mono text-slate-900">{cat.revenue} ({cat.percent}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Queue & Workload Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">OPD Peak Dispensing Velocity (By Hour)</h2>
          <div className="space-y-4">
            {[
              { time: "09:00 AM - 11:00 AM (Morning OPD Surge)", count: 24, percent: 85, badge: "Peak Load" },
              { time: "11:00 AM - 01:00 PM (Ward Discharge Orders)", count: 18, percent: 65, badge: "High Load" },
              { time: "01:00 PM - 03:00 PM (Post-Lunch Routine)", count: 8, percent: 30, badge: "Moderate" },
              { time: "03:00 PM - 06:00 PM (Evening Consultation)", count: 21, percent: 75, badge: "High Load" },
              { time: "06:00 PM - 09:00 PM (Night Admissions)", count: 12, percent: 45, badge: "Moderate" },
            ].map((slot, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">{slot.time}</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                    {slot.count} orders ({slot.badge})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${slot.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";

const LabAutoVerificationDashboard = () => {
  const [rules, setRules] = useState([]);
  const [qcData, setQcData] = useState([]);
  const [deltaAlerts, setDeltaAlerts] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("rules");
  const [isLoading, setIsLoading] = useState(true);

  // Simulated data - in production would come from API
  useEffect(() => {
    setTimeout(() => {
      setRules([
        { id: "R1", name: "CBC Auto-verify", test: "CBC", enabled: true, conditions: "All params within ref range; No flags; WBC 4-11k; Hgb 11-17; Plt 150-450k", action: "Auto-verify", priority: 1 },
        { id: "R2", name: "BMP Auto-verify", test: "Basic Metabolic Panel", enabled: true, conditions: "Na 135-145; K 3.5-5.0; Cl 98-107; CO2 22-29; BUN 7-20; Cr 0.6-1.3; Glu 70-100", action: "Auto-verify", priority: 2 },
        { id: "R3", name: "LFT Critical Check", test: "Liver Function", enabled: true, conditions: "ALT/AST > 3x ULN OR Bilirubin > 2x ULN", action: "Flag for review", priority: 1 },
        { id: "R4", name: "Troponin Delta", test: "Troponin I", enabled: true, conditions: "Delta > 50% from previous within 6h", action: "Critical alert", priority: 1 },
        { id: "R5", name: "K+ Critical Auto-call", test: "Potassium", enabled: true, conditions: "K < 3.0 OR K > 6.0", action: "Critical alert + Phone call", priority: 1 },
        { id: "R6", name: "Glucose Critical", test: "Glucose", enabled: false, conditions: "Glu < 50 OR > 400", action: "Critical alert", priority: 1 },
        { id: "R7", name: "Coagulation Delta", test: "PT/INR", enabled: true, conditions: "INR change > 0.5 from baseline", action: "Flag for review", priority: 2 },
        { id: "R8", name: "Hemolysis Index", test: "All Chemistry", enabled: true, conditions: "Hemolysis index > 50", action: "Reject sample", priority: 2 },
      ]);
      setQcData([
        { test: "Glucose", level: "Level 1", mean: 92, sd: 1.2, target: 90, status: "in_control", points: [89,91,90,92,93,91,90,89,92,91] },
        { test: "Glucose", level: "Level 2", mean: 285, sd: 4.1, target: 280, status: "warning", points: [278,282,286,290,288,284,281,279,283,287] },
        { test: "Potassium", level: "Level 1", mean: 4.1, sd: 0.05, target: 4.0, status: "in_control", points: [4.05,4.1,4.08,4.12,4.09,4.11,4.07,4.1,4.09,4.1] },
        { test: "Potassium", level: "Level 2", mean: 6.2, sd: 0.12, target: 6.0, status: "out_of_control", points: [6.1,6.15,6.2,6.25,6.3,6.28,6.22,6.18,6.24,6.26] },
        { test: "Creatinine", level: "Level 1", mean: 1.0, sd: 0.02, target: 1.0, status: "in_control", points: [0.99,1.01,1.0,0.98,1.02,1.0,0.99,1.01,1.0,1.0] },
        { test: "ALT", level: "Level 1", mean: 28, sd: 1.5, target: 25, status: "in_control", points: [26,27,28,29,30,28,27,26,28,29] },
        { test: "Troponin", level: "Level 1", mean: 0.015, sd: 0.002, target: 0.014, status: "in_control", points: [0.014,0.015,0.016,0.015,0.014,0.015,0.014,0.016,0.015,0.014] },
      ]);
      setDeltaAlerts([
        { patient: "Rahul Sharma", test: "Troponin I", previous: 0.04, current: 0.09, delta: 125, time: "2h ago", severity: "critical" },
        { patient: "Priya Patel", test: "Potassium", previous: 4.2, current: 5.8, delta: 38, time: "4h ago", severity: "warning" },
        { patient: "Amit Singh", test: "Creatinine", previous: 1.2, current: 1.9, delta: 58, time: "6h ago", severity: "critical" },
        { patient: "Sunita Devi", test: "HbA1c", previous: 7.2, current: 8.5, delta: 18, time: "24h ago", severity: "info" },
      ]);
      setCriticalAlerts([
        { patient: "Vikram Mehta", test: "Potassium", value: 6.4, ref: "3.5-5.0", time: "5 min ago", acknowledged: false },
        { patient: "Neha Gupta", test: "Glucose", value: 42, ref: "70-100", time: "12 min ago", acknowledged: true },
        { patient: "Rajesh Kumar", test: "Troponin I", value: 2.8, ref: "<0.04", time: "2 min ago", acknowledged: false },
      ]);
      setIsLoading(false);
    }, 300);
  }, []);

  const toggleRule = (id) => setRules(r => r.map(rule => rule.id === id ? {...rule, enabled: !rule.enabled} : rule));

  const ackAlert = (idx) => setCriticalAlerts(a => a.map((c, i) => i === idx ? {...c, acknowledged: true} : c));

  const exportRules = () => exportToCsv({ filename: "auto-verification-rules.csv", headers: ["ID", "Name", "Test", "Enabled", "Conditions", "Action", "Priority"], rows: rules.map(r => [r.id, r.name, r.test, r.enabled ? "Yes" : "No", r.conditions, r.action, r.priority]) });
  const exportQC = () => exportToCsv({ filename: "qc-data.csv", headers: ["Test", "Level", "Mean", "SD", "Target", "Status"], rows: qcData.map(q => [q.test, q.level, q.mean, q.sd, q.target, q.status]) });
  const exportDeltas = () => exportToCsv({ filename: "delta-alerts.csv", headers: ["Patient", "Test", "Previous", "Current", "Delta %", "Time", "Severity"], rows: deltaAlerts.map(d => [d.patient, d.test, d.previous, d.current, d.delta, d.time, d.severity]) });

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lab Auto-Verification & QC Dashboard</h1>
          <p className="text-sm text-slate-600">Rules engine, Westgard QC, delta checks, critical value management.</p>
        </div>
        <ActionMenu
          triggerLabel="Export"
          triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
          items={[
            { label: "Export Rules", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>, onClick: exportRules },
            { label: "Export QC Data", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>, onClick: exportQC },
            { label: "Export Delta Alerts", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>, onClick: exportDeltas },
          ]}
          align="right"
        />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {["rules", "qc", "deltas", "critical"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {tab === "rules" && "📋 Rules Engine"}
            {tab === "qc" && "📊 QC / Westgard"}
            {tab === "deltas" && "📈 Delta Alerts"}
            {tab === "critical" && "🚨 Critical Values"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500">Loading dashboard...</div>
      ) : (
        <div className="space-y-6">
          {/* Rules Engine */}
          {activeTab === "rules" && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Auto-Verification Rules</h2>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={rules.every(r => r.enabled)} onChange={e => setRules(r => r.map(rule => ({...rule, enabled: e.target.checked})))} className="rounded border-slate-300" />
                  Enable All
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                    <tr><th className="p-3">Rule</th><th className="p-3">Test</th><th className="p-3">Conditions</th><th className="p-3">Action</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map(rule => (
                      <tr key={rule.id} className={rule.enabled ? "" : "opacity-50 bg-slate-50/50"}>
                        <td className="p-3 font-bold text-slate-800">{rule.id}</td>
                        <td className="p-3 font-medium text-slate-700">{rule.name}</td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{rule.conditions}</td>
                        <td className="p-3"><span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">{rule.action}</span></td>
                        <td className="p-3 text-center">{rule.priority === 1 ? "🔴 P1" : "🟡 P2"}</td>
                        <td className="p-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} className="rounded border-slate-300" />
                            <span className="text-xs">{rule.enabled ? "Active" : "Disabled"}</span>
                          </label>
                        </td>
                        <td className="p-3 text-right">
                          <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                            items={[
                              { label: "Edit Rule", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, onClick: () => {} },
                              { label: "Duplicate", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, onClick: () => {} },
                              { divider: true },
                              { label: rule.enabled ? "Disable" : "Enable", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rule.enabled ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M5 13l4 4L19 7"} /></svg>, onClick: () => toggleRule(rule.id) },
                            ]} align="right" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QC / Westgard */}
          {activeTab === "qc" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {qcData.map((qc, i) => {
                const statusMeta = {
                  in_control: { label: "In Control", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  warning: { label: "Warning (2s)", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                  out_of_control: { label: "Out of Control", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                }[qc.status];
                const cv = ((qc.sd / qc.mean) * 100).toFixed(1);
                const bias = ((qc.mean - qc.target) / qc.target * 100).toFixed(1);
                const points = qc.points.slice(-10);
                const min = Math.min(...points), max = Math.max(...points);
                return (
                  <div key={i} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{qc.test}</p>
                        <p className="text-xs text-slate-500">{qc.level}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta.cls}`}>{statusMeta.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">Mean</p><p className="font-bold">{qc.mean}</p></div>
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">SD</p><p className="font-bold">{qc.sd}</p></div>
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">CV%</p><p className="font-bold">{cv}%</p></div>
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">Target</p><p className="font-bold">{qc.target}</p></div>
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">Bias%</p><p className="font-bold">{bias}%</p></div>
                      <div className="bg-slate-50 rounded p-2"><p className="text-slate-400">n</p><p className="font-bold">{points.length}</p></div>
                    </div>
                    {/* Mini sparkline */}
                    <div className="h-20 relative">
                      <svg viewBox="0 0 200 80" className="w-full h-full">
                        <defs><linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs>
                        <rect x="10" y="10" width="180" height="60" fill="url(#grad-{i})" stroke="#10b981" strokeWidth="0.5"/>
                        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points.map((p, idx) => {
                          const x = 10 + (idx / (points.length - 1)) * 180;
                          const y = 70 - ((p - min) / (max - min || 1)) * 60;
                          return `${x},${y}`;
                        }).join(" ")} />
                        {/* Mean line */}
                        <line x1="10" y1={70 - ((qc.mean - min) / (max - min || 1)) * 60} x2="190" y2={70 - ((qc.mean - min) / (max - min || 1)) * 60} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,2" />
                        {/* ±2SD lines */}
                        <line x1="10" y1={70 - ((qc.mean + 2*qc.sd - min) / (max - min || 1)) * 60} x2="190" y2={70 - ((qc.mean + 2*qc.sd - min) / (max - min || 1)) * 60} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="10" y1={70 - ((qc.mean - 2*qc.sd - min) / (max - min || 1)) * 60} x2="190" y2={70 - ((qc.mean - 2*qc.sd - min) / (max - min || 1)) * 60} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delta Alerts */}
          {activeTab === "deltas" && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">Significant Delta Changes</h2>
                <ActionMenu triggerLabel="Export" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                    items={[{ label: "Export CSV", onClick: exportDeltas }]} align="right" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                    <tr><th className="p-3">Patient</th><th className="p-3">Test</th><th className="p-3">Previous</th><th className="p-3">Current</th><th className="p-3">Delta %</th><th className="p-3">Time</th><th className="p-3">Severity</th><th className="p-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deltaAlerts.map((d, i) => (
                      <tr key={i} className={d.severity === "critical" ? "bg-rose-50/30" : d.severity === "warning" ? "bg-amber-50/30" : ""}>
                        <td className="p-3 font-bold text-slate-800">{d.patient}</td>
                        <td className="p-3 font-medium text-slate-700">{d.test}</td>
                        <td className="p-3 text-slate-600 font-mono">{d.previous}</td>
                        <td className="p-3 text-slate-600 font-mono">{d.current}</td>
                        <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${d.severity === "critical" ? "bg-rose-100 text-rose-700" : d.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{d.delta > 0 ? "+" : ""}{d.delta}%</span></td>
                        <td className="p-3 text-slate-500">{d.time}</td>
                        <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${d.severity === "critical" ? "bg-rose-100 text-rose-700" : d.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{d.severity}</span></td>
                        <td className="p-3 text-right">
                          <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                            items={[
                              { label: "Review Result", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true },
                              { label: "Contact Clinician", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
                            ]} align="right" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Critical Values */}
          {activeTab === "critical" && (
            <div className="space-y-3">
              {criticalAlerts.map((alert, i) => (
                <div key={i} className={`rounded-2xl p-4 border ${alert.acknowledged ? "border-slate-200 bg-slate-50" : "border-rose-300 bg-rose-50 animate-pulse ring-1 ring-rose-200"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">CRITICAL</span>
                        <p className="font-bold text-slate-800">{alert.patient}</p>
                        <span className="text-sm text-slate-500">{alert.test}</span>
                        <span className="font-mono text-rose-600 font-bold text-lg">{alert.value}</span>
                        <span className="text-xs text-slate-400">Ref: {alert.ref}</span>
                        <span className="text-xs text-slate-400">{alert.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <button onClick={() => ackAlert(i)} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition">✓ Acknowledge</button>
                      )}
                      <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                        items={[
                          { label: "Call Clinician", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>, primary: true },
                          { label: "Send SMS Alert", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h4M8 12l-2-2m2 2l2-2m-4 4v6M8 12V4m-2 8l4-4m-4 4l4 4" /></svg> },
                          { label: "Document & Close", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>, disabled: !alert.acknowledged },
                        ]} align="right" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LabAutoVerificationDashboard;
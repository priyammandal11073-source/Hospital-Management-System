import { useState, useEffect } from "react";
import { getDiagnosticAuditLogs } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Button,
  EmptyStateCard,
  PageLoader,
  DataTable,
} from "../../components/ui/index.js";

export default function DiagnosticAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticAuditLogs();
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return <PageLoader message="Loading diagnostic audit logs…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Audit Logs"
        subtitle="Full chronological tracking of all hardcopy outputs, copies, operators, and justification reasons"
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {logs.length === 0 ? (
          <EmptyStateCard icon="📜" title="No audit logs found." description="Print and download actions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 pl-5">Print UID</th>
                  <th className="px-3.5 py-2.5">Date & Time</th>
                  <th className="px-3.5 py-2.5">Document Type</th>
                  <th className="px-3.5 py-2.5">Report / Study ID</th>
                  <th className="px-3.5 py-2.5">Patient Details</th>
                  <th className="px-3.5 py-2.5">Operator</th>
                  <th className="px-3.5 py-2.5">Copies</th>
                  <th className="px-3.5 py-2.5">Audit Reason</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log._id || log.printId} className="hover:bg-slate-50/80">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-600">{log.printId}</td>
                    <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                    <td className="px-3.5 py-2.5"><span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${log.documentType.includes("RADIOLOGY") ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>{log.documentType}</span></td>
                    <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">{log.reportNumber || log.studyId || "-"}</td>
                    <td className="px-3.5 py-2.5 font-medium text-slate-800">{log.patientName}</td>
                    <td className="px-3.5 py-2.5 text-slate-600">{log.printedByName} <span className="text-[10px] text-slate-400">({log.userRole})</span></td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-800">{log.copies || 1}</td>
                    <td className="px-3.5 py-2.5 text-slate-600 max-w-[180px] truncate" title={log.reason}>{log.isReprint ? <span className="font-bold text-amber-700">[REPRINT] </span> : null}{log.reason}</td>
                    <td className="px-3.5 py-2.5 text-center"><span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SUCCESS</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

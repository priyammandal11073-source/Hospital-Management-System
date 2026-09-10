import { useEffect, useState } from "react";
import { getDiagnosticAuditLogs } from "../../services/api.js";

export default function DiagnosticAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getDiagnosticAuditLogs();
        if (res.success) {
          setLogs(res.data || []);
        }
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          NABH & ISO 15189 Quality & Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Immutable logging of specimen chain of custody, analytical result entries, specialist digital signatures, and clinician critical alerts
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-semibold">
            Retrieving diagnostic governance audit trails...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No audit records recorded today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Action Code</th>
                  <th className="p-3.5">Resource Target</th>
                  <th className="p-3.5 pr-5">Activity Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((lg) => (
                  <tr key={lg._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500">
                      {new Date(lg.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{lg.userName || "System"}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{lg.action}</td>
                    <td className="p-3.5 text-slate-600">{lg.resource}</td>
                    <td className="p-3.5 pr-5 text-slate-700">{lg.details || "Activity logged."}</td>
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

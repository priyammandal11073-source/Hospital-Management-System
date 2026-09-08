import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminAuditLogs } from "../../services/api.js";

const MODULE_COLORS = {
  auth: "bg-blue-50 text-blue-700 ring-blue-500/20",
  patient: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  appointment: "bg-teal-50 text-teal-700 ring-teal-500/20",
  billing: "bg-amber-50 text-amber-700 ring-amber-500/20",
  staff: "bg-purple-50 text-purple-700 ring-purple-500/20",
  bed: "bg-indigo-50 text-indigo-700 ring-indigo-500/20",
  settings: "bg-slate-100 text-slate-700 ring-slate-400/20",
  pharmacy: "bg-rose-50 text-rose-700 ring-rose-500/20",
  equipment: "bg-cyan-50 text-cyan-700 ring-cyan-500/20",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [moduleFilter, setModuleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async (page = 1) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminAuditLogs({
        page,
        limit: 25,
        module: moduleFilter,
        search,
      });
      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, limit: 25, total: 0, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, [moduleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "User", "Role", "Action", "Module", "RecordId", "IP Address", "Details"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      `"${l.userName || ""}"`,
      l.role || "",
      `"${l.action || ""}"`,
      l.module || "",
      l.recordId || "",
      l.ipAddress || "",
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NivoraCare_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Security & Governance</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>System Audit Trail & Security Logs</span>
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-mono font-bold text-white">
              Immutable
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete append-only institutional event audit logs for compliance, security inspections, and clinical governance.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <span>📥</span>
          <span>Export Audit CSV</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by user name, action performed, or audit details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">System Module:</span>
          {["All", "auth", "patient", "appointment", "billing", "staff", "bed", "settings", "pharmacy", "equipment"].map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                moduleFilter === mod ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Initiator & Role</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3">Record Reference</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    Querying secure audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No audit records match the selected parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{log.userName || "System"}</p>
                      <span className="capitalize text-[10px] font-semibold text-slate-400">
                        {log.role || "admin"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${MODULE_COLORS[log.module] || "bg-slate-100 text-slate-700"}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {log.recordId ? log.recordId.slice(-8) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-sm truncate text-[11px]">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total events)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadLogs(pagination.page - 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadLogs(pagination.page + 1)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  getCriticalDiagnosticResults,
  acknowledgeCriticalDiagnosticResult,
} from "../../services/api.js";
import { toast } from "../../utils/toast.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function CriticalResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [callerNotes, setCallerNotes] = useState("");
  const [search, setSearch] = useState("");

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await getCriticalDiagnosticResults();
      if (res.success) {
        setResults(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load critical results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleAcknowledge = async (resultId) => {
    try {
      setAcknowledgingId(resultId);
      await acknowledgeCriticalDiagnosticResult(resultId, {
        doctorName,
        callerNotes,
      });
      setConfirmingId(null);
      setDoctorName("");
      setCallerNotes("");
      fetchResults();
    } catch (err) {
      toastError(`Failed to acknowledge result: ${err.response?.data?.message || err.message}`);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const toastError = (msg) => {
    const el = document.createElement("div");
    el.className = "fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  const severityColors = {
    critical: "bg-rose-600 text-white animate-pulse",
    urgent: "bg-amber-600 text-white",
    normal: "bg-slate-100 text-slate-700",
  };

  if (loading) {
    return <PageLoader message="Loading critical results radar…" />;
  }

  if (error) {
    return (
      <Card title="Critical Results Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchResults}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Results & Quarantine Radar"
        subtitle="Critical pathology / radiology alerts requiring immediate clinician notification under NABH safety protocols"
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input placeholder="Search by patient name, test, report #…" value={search} onChange={(e) => setSearch(e.target.value)} id="critical-search" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {results.length === 0 ? (
          <EmptyStateCard icon="🩺" title="No critical results requiring acknowledgment." description="All critical results have been acknowledged and acknowledged by attending clinicians." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 pl-5">Result #</th>
                  <th className="px-3.5">Patient Details</th>
                  <th className="px-3.5">Test / Study</th>
                  <th className="px-3.5">Severity</th>
                  <th className="px-3.5">Value</th>
                  <th className="px-3.5">Reference</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3.5 pl-5 font-mono font-bold text-slate-800 whitespace-nowrap">{r.resultNumber}</td>
                    <td className="px-3.5">
                      <div className="font-bold text-slate-800">{r.patientName}</div>
                      <p className="text-[11px] text-slate-500">{r.patientAge || "Adult"}Y / {r.patientGender || "N/A"}</p>
                    </td>
                    <td className="px-3.5">
                      <div className="font-bold text-slate-800">{r.testName}</div>
                      <p className="text-[11px] text-slate-500">{r.category}</p>
                    </td>
                    <td className="px-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityColors[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td className="px-3.5">
                      <div className="font-bold text-slate-800">{r.value}</div>
                      <p className="text-[11px] text-slate-500">Ref: {r.referenceRange || "N/A"}</p>
                    </td>
                    <td className="px-3.5 pr-5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingId(r._id);
                        }}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        title="Acknowledge critical result"
                      >
                        Acknowledge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmingId && (
        <Modal
          isOpen={Boolean(confirmingId)}
          onClose={() => setConfirmingId(null)}
          title="Acknowledge Critical Result"
          subtitle={`Acknowledge result #${confirmingId} as reviewed by attending clinician`}
          className="max-w-md"
        >
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attending Clinician Name *</label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Enter attending clinician name" id="clinician-name" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Caller Notes</label>
              <textarea rows={3} value={callerNotes} onChange={(e) => setCallerNotes(e.target.value)} placeholder="e.g. Notified Dr. Smith at 02:30 AM, patient informed, repeat sample scheduled" className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setConfirmingId(null)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <Button size="sm" disabled={acknowledgingId === confirmingId} type="submit">Acknowledge</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

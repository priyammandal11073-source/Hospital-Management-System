import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPrescriptionQueue } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function PrescriptionHistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getPrescriptionQueue();
      setHistory(data.prescriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter((rx) => {
    const status = rx.dispensingStatus || "pending";
    if (statusFilter !== "all" && status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const patientMatch = rx.patient?.name?.toLowerCase().includes(q);
      const docMatch = rx.doctor?.name?.toLowerCase().includes(q);
      const idMatch = rx._id?.toLowerCase().includes(q);
      const receiptMatch = rx.pharmacyReceiptNumber?.toLowerCase().includes(q);
      return patientMatch || docMatch || idMatch || receiptMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Prescription Dispensing History"
          subtitle="Archived log of fulfilled, on-hold, and active prescriptions with receipt reprints and audit trails."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Audit & Records</span>
            </span>
          }
          actions={[
            <Link key="queue" to="/pharmacy/queue">
              <Button size="sm" leftIcon={<span>→</span>}>
                Active Queue
              </Button>
            </Link>,
          ]}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All History" },
            { id: "dispensed", label: "Fulfilled / Dispensed" },
            { id: "on_hold", label: "On Hold (Doctor Flagged)" },
            { id: "pending", label: "Pending Dispensing" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === f.id
                  ? "bg-slate-900 text-slate-100 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Input
            type="text"
            placeholder="Search patient, receipt #, doctor…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="history-search"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading historical dispensary records…</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyStateCard
            icon="📋"
            title="No records found"
            description="Try changing filter criteria or search keyword."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Prescription / Receipt</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Prescribing Physician</th>
                  <th className="px-4 py-3">Dispensed Drugs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((rx) => {
                  const status = rx.dispensingStatus || "pending";
                  const isDispensed = status === "dispensed";
                  const isHold = status === "on_hold";

                  return (
                    <tr key={rx._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {rx.pharmacyReceiptNumber || `RX-${rx._id.slice(-6).toUpperCase()}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {new Date(rx.updatedAt || rx.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{rx.patient?.name || "Patient"}</div>
                        <div className="text-[11px] text-slate-500">
                          {rx.patient?.gender || "—"}, {rx.patient?.age || "—"} yrs
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{formatDoctorName(rx.doctor?.name, "Specialist")}</div>
                        <div className="text-[11px] text-slate-500">{rx.doctor?.specialization || "Clinical OPD"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate font-medium text-slate-800">
                          {rx.medicines?.map((m) => m.name).join(", ") || "Medications"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {rx.medicines?.length || 0} item(s) dispensed
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isDispensed ? (
                          <Badge status="completed">✓ Dispensed</Badge>
                        ) : isHold ? (
                          <Badge status="cancelled">⚠ On Hold</Badge>
                        ) : (
                          <Badge status="pending">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/pharmacy/dispense/${rx._id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                        >
                          {isDispensed ? "Reprint Receipt" : "Open Dispense"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

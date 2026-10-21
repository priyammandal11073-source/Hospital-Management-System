import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPrescriptionQueue } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

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
      // getPrescriptionQueue returns all prescriptions
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Audit & Records</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prescription Dispensing History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Archived log of fulfilled, on-hold, and active prescriptions with receipt reprints and audit trails.
          </p>
        </div>
        <Link
          to="/pharmacy/queue"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
        >
          <span>Active Queue →</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
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
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, receipt #, doctor..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading historical dispensary records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing filter criteria or search keyword.</p>
          </div>
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
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Dispensed
                          </span>
                        ) : isHold ? (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            ⚠ On Hold
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Pending
                          </span>
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

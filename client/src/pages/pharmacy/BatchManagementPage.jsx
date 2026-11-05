import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getBatches } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function BatchManagementPage() {
  const [searchParams] = useSearchParams();
  const initialMed = searchParams.get("medicine") || "";

  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialMed);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await getBatches();
      setBatches(data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const isExpired = new Date(b.expiryDate) <= new Date();
    const isDepleted = (b.currentStock || 0) <= 0;

    if (statusFilter === "expired" && !isExpired) return false;
    if (statusFilter === "active" && (isExpired || isDepleted)) return false;
    if (statusFilter === "depleted" && !isDepleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = b.batchNumber?.toLowerCase().includes(q);
      const medMatch = b.medicine?.name?.toLowerCase().includes(q);
      const suppMatch = b.supplier?.name?.toLowerCase().includes(q);
      return numMatch || medMatch || suppMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Medicine Batch Management"
          subtitle="Trace individual manufacturer batch numbers, manufacturing/expiry dates, purchase rates, and lot balances."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Batch & Lot Control</span>
            </span>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Lots" },
            { id: "active", label: "Active & Dispensing" },
            { id: "expired", label: "Expired Lots" },
            { id: "depleted", label: "Depleted Lots" },
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
            placeholder="Search batch #, drug, vendor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="batch-search"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading batch numbers and expiries…</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <EmptyStateCard
            icon="📦"
            title="No batches match the criteria"
            description="Batches are automatically created during Goods Receipt (GRN)."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Medicine Formulation</th>
                  <th className="px-4 py-3">Mfg Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Stock Remaining</th>
                  <th className="px-4 py-3">Rates (Cost/MRP)</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((b) => {
                  const isExpired = new Date(b.expiryDate) <= new Date();
                  const isDepleted = (b.currentStock || 0) <= 0;
                  const daysLeft = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {b.batchNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{b.medicine?.name || "Medicine Item"}</div>
                        <div className="text-[11px] text-slate-500">{b.supplier?.name || "Cipla Healthcare"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(b.mfgDate || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold ${isExpired ? "text-rose-600" : daysLeft < 60 ? "text-amber-600" : "text-slate-800"}`}>
                          {new Date(b.expiryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {isExpired ? "EXPIRED" : `${daysLeft} days left`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {b.currentStock} <span className="text-[10px] text-slate-400 font-normal">/ {b.initialStock || b.currentStock}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        ₹{(b.purchasePrice || 10).toFixed(2)} / ₹{(b.sellingPrice || 15).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isExpired ? (
                          <Badge status="cancelled">Expired</Badge>
                        ) : isDepleted ? (
                          <Badge status="normal">Depleted</Badge>
                        ) : daysLeft < 60 ? (
                          <Badge status="urgent">Expiring Soon</Badge>
                        ) : (
                          <Badge status="completed">Active (Valid)</Badge>
                        )}
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

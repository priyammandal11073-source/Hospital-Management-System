import { useEffect, useState } from "react";
import { getDiagnosticRequests } from "../../services/api.js";

export default function DiagnosticBillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getDiagnosticRequests();
        if (res.success) {
          setOrders(res.data || []);
        }
      } catch (e) {
        console.error("Failed to load diagnostic billing records", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBilled = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const totalPaid = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Diagnostic Investigation Billing & Tariff Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Laboratory charges, radiologic procedure billing, insurance clearance, and settlement tracking
        </p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Invoiced Amount</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">₹{totalBilled.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700">Settled & Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <span className="text-xs font-semibold text-amber-700">Outstanding Receivable</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-2">₹{(totalBilled - totalPaid).toLocaleString()}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-semibold">
            Loading billing records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Order #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Test Procedure</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Standard Tariff</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5 pr-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{o.patientName}</td>
                    <td className="p-3.5">{o.testName}</td>
                    <td className="p-3.5 font-semibold text-slate-600">{o.department}</td>
                    <td className="p-3.5 font-bold text-slate-900">₹{o.price || 0}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        o.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {o.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => alert(`Official Receipt for ${o.orderNumber} issued to ${o.patientName} for ₹${o.price}.`)}
                        className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold cursor-pointer"
                      >
                        Receipt →
                      </button>
                    </td>
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

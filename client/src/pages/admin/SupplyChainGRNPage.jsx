import { useCallback, useEffect, useState } from "react";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const SupplyChainGRNPage = () => {
  const { openPrintPreview } = usePrintModal();
  const [grns, setGrns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ poNumber: "", supplier: "", expectedDate: "", items: [{ item: "", qty: 1, unit: "Nos", batch: "", expiry: "", rate: 0 }] });
  const [isLoading, setIsLoading] = useState(true);

  const handlePrintGRN = (grn) => {
    const html = generateGeneralHospitalReportHtml({
      title: "Goods Received Note (GRN) & Inward Consignment",
      subtitle: `Central Hospital Stores & Supply Chain Management • ${grn.id}`,
      metrics: [
        { label: "Purchase Order", value: grn.poNumber, color: "#1e3a8a" },
        { label: "Consignment Status", value: (grn.status || "").toUpperCase(), color: grn.status === "completed" ? "#16a34a" : "#d97706" },
        { label: "Total Received Units", value: grn.totalQty?.toLocaleString() || "0", color: "#0f766e" },
        { label: "Quality Verified", value: grn.verified ? "VERIFIED ✓" : "PENDING", color: grn.verified ? "#16a34a" : "#dc2626" },
      ],
      tables: [
        {
          title: "Vendor Consignment & Inward Receiving Audit",
          headers: ["Inward Parameter", "Store Record Entry"],
          rows: [
            ["GRN Voucher Reference", grn.id],
            ["Original Purchase Order", grn.poNumber],
            ["Approved Supplier / Vendor", grn.supplier],
            ["Inward Consignment Date", grn.date],
            ["Receiving Store Officer", grn.receivedBy || "Central Receiving Store"],
            ["Itemized Line Count", `${grn.items || 1} Products`],
            ["Total Units Received", `${grn.totalQty || 0} Units`],
            ["Quality Assurance Audit", grn.verified ? "Passed All Quality Checks" : "Pending QA Inspection"],
          ],
        },
      ],
      notes: "Official Goods Received Note certified under Nivora Care Hospital Central Procurement and Inventory SOPs. Store copies distributed to Accounts and Inventory Audit.",
    });

    openPrintPreview({
      title: `Goods Received Note - ${grn.id}`,
      htmlContent: html,
      refNumber: grn.id,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      setGrns([
        { id: "GRN-001", poNumber: "PO-2024-001", supplier: "MediSupply India", date: "2024-01-10", status: "completed", items: 12, totalQty: 2450, receivedBy: "Rajesh Kumar", verified: true },
        { id: "GRN-002", poNumber: "PO-2024-002", supplier: "PharmaCorp Ltd", date: "2024-01-12", status: "partial", items: 8, totalQty: 1100, receivedBy: "Priya Sharma", verified: false },
        { id: "GRN-003", poNumber: "PO-2024-003", supplier: "SurgiMed Devices", date: "2024-01-14", status: "pending", items: 5, totalQty: 320, receivedBy: null, verified: false },
        { id: "GRN-004", poNumber: "PO-2024-004", supplier: "LifeLine Pharma", date: "2024-01-15", status: "in_progress", items: 15, totalQty: 5600, receivedBy: "Amit Singh", verified: false },
      ]);
      setIsLoading(false);
    }, 200);
  }, []);

  const statusMeta = {
    pending: { label: "Pending", cls: "bg-slate-100 text-slate-600" },
    in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-700" },
    partial: { label: "Partial", cls: "bg-amber-50 text-amber-700" },
    completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700" },
  };

  const addItem = () => setForm(f => ({...f, items: [...f.items, { item: "", qty: 1, unit: "Nos", batch: "", expiry: "", rate: 0 }]}));
  const removeItem = (idx) => setForm(f => ({...f, items: f.items.filter((_, i) => i !== idx)}));
  const updateItem = (idx, field, value) => setForm(f => ({...f, items: f.items.map((it, i) => i === idx ? {...it, [field]: value} : it)}));

  const handleCreate = async (e) => {
    e.preventDefault();
    const newGrn = { id: `GRN-${String(grns.length + 1).padStart(3, "0")}`, ...form, status: "pending", totalQty: form.items.reduce((s, i) => s + (Number(i.qty) || 0), 0), receivedBy: "Current User", verified: false };
    setGrns([newGrn, ...grns]);
    setShowCreate(false);
    setForm({ poNumber: "", supplier: "", expectedDate: "", items: [{ item: "", qty: 1, unit: "Nos", batch: "", expiry: "", rate: 0 }] });
  };

  const exportGRNs = () => exportToCsv({ filename: "grn-list.csv", headers: ["GRN #", "PO #", "Supplier", "Date", "Status", "Items", "Total Qty", "Received By", "Verified"], rows: grns.map(g => [g.id, g.poNumber, g.supplier, g.date, g.status, g.items, g.totalQty, g.receivedBy || "—", g.verified ? "Yes" : "No"]) });

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading GRN module...</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Goods Receipt Notes (GRN)</h1>
          <p className="text-sm text-slate-600">Receive, verify & record incoming stock against purchase orders.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">+ Create GRN</button>
          <ActionMenu triggerLabel="Export" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              items={[{ label: "Export All GRNs", onClick: exportGRNs }, { label: "Export Pending", onClick: () => exportToCsv({ filename: "grn-pending.csv", headers: ["GRN #", "PO #", "Supplier", "Date", "Items", "Total Qty"], rows: grns.filter(g => g.status !== "completed").map(g => [g.id, g.poNumber, g.supplier, g.date, g.items, g.totalQty]) }) }]} align="right" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total GRNs", value: grns.length, icon: "📦", cls: "bg-slate-50 text-slate-700" },
          { label: "Pending", value: grns.filter(g => g.status === "pending").length, icon: "⏳", cls: "bg-slate-50 text-slate-700" },
          { label: "In Progress", value: grns.filter(g => g.status === "in_progress").length, icon: "🔄", cls: "bg-blue-50 text-blue-700" },
          { label: "Completed", value: grns.filter(g => g.status === "completed").length, icon: "✅", cls: "bg-emerald-50 text-emerald-700" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.cls} border-current/20`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* GRN List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
              <tr><th className="p-3">GRN #</th><th className="p-3">PO #</th><th className="p-3">Supplier</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Items</th><th className="p-3">Total Qty</th><th className="p-3">Received By</th><th className="p-3">Verified</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.map(grn => (
                <tr key={grn.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800">{grn.id}</td>
                  <td className="p-3 font-mono text-sm text-slate-600">{grn.poNumber}</td>
                  <td className="p-3 font-medium text-slate-800">{grn.supplier}</td>
                  <td className="p-3 text-slate-600">{grn.date}</td>
                  <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta[grn.status].cls}`}>{statusMeta[grn.status].label}</span></td>
                  <td className="p-3 text-slate-600">{grn.items}</td>
                  <td className="p-3 font-mono text-slate-800">{grn.totalQty.toLocaleString()}</td>
                  <td className="p-3 text-slate-600">{grn.receivedBy || "—"}</td>
                  <td className="p-3">{grn.verified ? <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">✓ Verified</span> : <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-bold">⏳ Pending</span>}</td>
                  <td className="p-3 text-right">
                    <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                      items={[
                        { label: "View Details", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true },
                        { label: grn.status !== "completed" ? "Receive Items" : "View Receipt", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>, primary: true, disabled: grn.status === "completed" },
                        { label: "Verify", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, disabled: grn.verified },
                        { label: "Print GRN", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>, onClick: () => handlePrintGRN(grn) },
                        { divider: true },
                        { label: "Reject", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>, danger: true, disabled: grn.status === "completed" || grn.status === "rejected" },
                      ]} align="right" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create GRN Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Create New GRN</h2>
              <button onClick={() => setShowCreate(false)} className="text-2xl text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">PO Number *</label><input required value={form.poNumber} onChange={e => setForm(f => ({...f, poNumber: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="PO-2024-005" /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Expected Date</label><input type="date" value={form.expectedDate} onChange={e => setForm(f => ({...f, expectedDate: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Supplier *</label><input required value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Supplier Name" /></div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Items</h3>
                  <button type="button" onClick={addItem} className="rounded-lg bg-teal-100 text-teal-700 px-3 py-1.5 text-xs font-bold">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                      <div className="md:col-span-2"><label className="block text-[10px] text-slate-500 mb-1">Item / Medicine</label><input value={item.item} onChange={e => updateItem(idx, "item", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Paracetamol 500mg" /></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Qty</label><input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, "qty", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Unit</label><select value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="Nos">Nos</option><option value="Box">Box</option><option value="Strip">Strip</option><option value="Vial">Vial</option><option value="Ampoule">Ampoule</option></select></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Batch #</label><input value={item.batch} onChange={e => updateItem(idx, "batch", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="BATCH-001" /></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Expiry</label><input type="date" value={item.expiry} onChange={e => updateItem(idx, "expiry", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><label className="block text-[10px] text-slate-500 mb-1">Rate</label><input type="number" step="0.01" min="0" value={item.rate} onChange={e => updateItem(idx, "rate", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="0.00" /></div>
                        <button type="button" onClick={() => removeItem(idx)} className="rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-sm hover:bg-rose-100">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-700">Create GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default SupplyChainGRNPage;
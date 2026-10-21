import { useCallback, useEffect, useState } from "react";
import { exportToCsv } from "../../utils/csvExport.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const InterStoreTransferPage = () => {
  const { openPrintPreview } = usePrintModal();
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ fromStore: "", toStore: "", items: [{ item: "", qty: 1, unit: "Nos" }], priority: "routine", notes: "" });
  const [isLoading, setIsLoading] = useState(true);

  const handlePrintTransfer = (trf) => {
    const html = generateGeneralHospitalReportHtml({
      title: "Inter-Store Stock Transfer Note & Transit Voucher",
      subtitle: `Internal Hospital Pharmacy & Ward Dispensary Logistics • Transfer Ref: ${trf.id}`,
      metrics: [
        { label: "Dispatching Store", value: trf.from, color: "#1e3a8a" },
        { label: "Destination Store", value: trf.to, color: "#0284c7" },
        { label: "Transfer Priority", value: (trf.priority || "routine").toUpperCase(), color: trf.priority === "urgent" ? "#dc2626" : "#16a34a" },
        { label: "Transit Status", value: (trf.status || "").replace(/_/g, " ").toUpperCase(), color: "#0f766e" },
      ],
      tables: [
        {
          title: "Inter-Store Transfer Line Items & Authorization Audit",
          headers: ["Transfer Parameter", "Audit Specification"],
          rows: [
            ["Transfer Voucher ID", trf.id],
            ["Originating Location", trf.from],
            ["Receiving Location", trf.to],
            ["Transfer Indent Date", trf.date],
            ["Requested By", trf.requestedBy || "Store Pharmacist"],
            ["Received & Verified By", trf.receivedBy || "Awaiting Destination Sign-Off"],
            ["Line Items Count", `${trf.items || 1} SKU(s)`],
            ["Total Quantity Transferred", `${trf.totalQty || 0} Units`],
          ],
        },
      ],
      notes: "Official internal stock transit transfer note. Custody of pharmaceuticals passes to receiving satellite dispensary upon dual physical sign-off.",
    });

    openPrintPreview({
      title: `Inter-Store Transfer Note - ${trf.id}`,
      htmlContent: html,
      refNumber: trf.id,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      setStores([
        { id: "main", name: "Central Pharmacy", type: "central", location: "Basement" },
        { id: "emergency", name: "Emergency Pharmacy", type: "satellite", location: "ER Ground Floor" },
        { id: "icu", name: "ICU Satellite Pharmacy", type: "satellite", location: "ICU Level 2" },
        { id: "ot", name: "OT Pharmacy", type: "satellite", location: "OT Complex" },
        { id: "opd", name: "OPD Dispensary", type: "satellite", location: "OPD Block" },
        { id: "ward-a", name: "Ward A Pharmacy", type: "ward", location: "Ward A Corridor" },
        { id: "ward-b", name: "Ward B Pharmacy", type: "ward", location: "Ward B Corridor" },
      ]);
      setTransfers([
        { id: "TRF-001", from: "Central Pharmacy", to: "Emergency Pharmacy", date: "2024-01-10", status: "completed", items: 5, totalQty: 120, requestedBy: "Rajesh", priority: "urgent", receivedBy: "Priya" },
        { id: "TRF-002", from: "Central Pharmacy", to: "ICU Satellite Pharmacy", date: "2024-01-12", status: "in_transit", items: 8, totalQty: 340, requestedBy: "Amit", priority: "urgent", receivedBy: null },
        { id: "TRF-003", from: "Central Pharmacy", to: "OT Pharmacy", date: "2024-01-13", status: "dispatched", items: 3, totalQty: 50, requestedBy: "Sunita", priority: "routine", receivedBy: null },
        { id: "TRF-004", from: "Emergency Pharmacy", to: "Central Pharmacy", date: "2024-01-14", status: "pending", items: 2, totalQty: 15, requestedBy: "Vikram", priority: "routine", receivedBy: null },
        { id: "TRF-005", from: "Central Pharmacy", to: "Ward A Pharmacy", date: "2024-01-15", status: "pending", items: 12, totalQty: 500, requestedBy: "Priya", priority: "routine", receivedBy: null },
      ]);
      setIsLoading(false);
    }, 200);
  }, []);

  const statusMeta = {
    pending: { label: "Pending", cls: "bg-slate-100 text-slate-600" },
    dispatched: { label: "Dispatched", cls: "bg-blue-50 text-blue-700" },
    in_transit: { label: "In Transit", cls: "bg-amber-50 text-amber-700" },
    completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
  };
  const priorityMeta = { routine: { label: "Routine", cls: "bg-slate-100 text-slate-600" }, urgent: { label: "Urgent", cls: "bg-amber-50 text-amber-700" }, stat: { label: "STAT", cls: "bg-rose-50 text-rose-700" } };

  const addItem = () => setForm(f => ({...f, items: [...f.items, { item: "", qty: 1, unit: "Nos" }]}));
  const removeItem = (idx) => setForm(f => ({...f, items: f.items.filter((_, i) => i !== idx)}));
  const updateItem = (idx, field, value) => setForm(f => ({...f, items: f.items.map((it, i) => i === idx ? {...it, [field]: value} : it)}));

  const handleCreate = async (e) => {
    e.preventDefault();
    const newTrf = { id: `TRF-${String(transfers.length + 1).padStart(3, "0")}`, from: form.fromStore, to: form.toStore, date: new Date().toISOString().split("T")[0], status: "pending", items: form.items.length, totalQty: form.items.reduce((s, i) => s + (Number(i.qty) || 0), 0), requestedBy: "Current User", priority: form.priority, notes: form.notes, receivedBy: null };
    setTransfers([newTrf, ...transfers]);
    setShowCreate(false);
    setForm({ fromStore: "", toStore: "", items: [{ item: "", qty: 1, unit: "Nos" }], priority: "routine", notes: "" });
  };

  const exportTransfers = () => exportToCsv({ filename: "inter-store-transfers.csv", headers: ["Transfer #", "From", "To", "Date", "Status", "Priority", "Items", "Total Qty", "Requested By", "Received By"], rows: transfers.map(t => [t.id, t.from, t.to, t.date, t.status, t.priority, t.items, t.totalQty, t.requestedBy, t.receivedBy || "—"]) });

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading inter-store transfers...</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inter-Store Transfers</h1>
          <p className="text-sm text-slate-600">Manage stock movements between pharmacy stores & satellite dispensaries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">+ New Transfer</button>
          <ActionMenu triggerLabel="Export" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              items={[{ label: "Export All", onClick: exportTransfers }, { label: "Export Pending", onClick: () => exportToCsv({ filename: "transfers-pending.csv", headers: ["Transfer #", "From", "To", "Date", "Priority", "Items", "Total Qty"], rows: transfers.filter(t => t.status !== "completed").map(t => [t.id, t.from, t.to, t.date, t.priority, t.items, t.totalQty]) }) }]} align="right" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Transfers", value: transfers.length, icon: "🔄", cls: "bg-slate-50 text-slate-700" },
          { label: "Pending", value: transfers.filter(t => t.status === "pending").length, icon: "⏳", cls: "bg-slate-50 text-slate-700" },
          { label: "In Transit", value: transfers.filter(t => t.status === "in_transit" || t.status === "dispatched").length, icon: "🚚", cls: "bg-amber-50 text-amber-700" },
          { label: "Completed", value: transfers.filter(t => t.status === "completed").length, icon: "✅", cls: "bg-emerald-50 text-emerald-700" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${s.cls} border-current/20`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Store Network Visual */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <h3 className="font-bold text-slate-800 mb-3">Store Network</h3>
        <div className="flex flex-wrap gap-2">
          {stores.map((store, i) => (
            <div key={store.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${store.type === "central" ? "bg-purple-50 text-purple-700 border border-purple-200" : store.type === "satellite" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              <span className="font-bold">{store.type === "central" ? "🏢" : store.type === "satellite" ? "🏥" : "🏥"}</span>
              <span>{store.name}</span>
              {i < stores.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Central → Satellites → Wards (Hub & Spoke model)</p>
      </div>

      {/* Transfers List */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
              <tr><th className="p-3">Transfer #</th><th className="p-3">From → To</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Items</th><th className="p-3">Total Qty</th><th className="p-3">Requested By</th><th className="p-3">Received By</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map(trf => (
                <tr key={trf.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800">{trf.id}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-800">{trf.from}</span>
                      <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      <span className="font-medium text-teal-700">{trf.to}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{trf.date}</td>
                  <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusMeta[trf.status].cls}`}>{statusMeta[trf.status].label}</span></td>
                  <td className="p-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityMeta[trf.priority].cls}`}>{priorityMeta[trf.priority].label}</span></td>
                  <td className="p-3 text-slate-600">{trf.items}</td>
                  <td className="p-3 font-mono text-slate-800">{trf.totalQty}</td>
                  <td className="p-3 text-slate-600">{trf.requestedBy}</td>
                  <td className="p-3 text-slate-600">{trf.receivedBy || "—"}</td>
                  <td className="p-3 text-right">
                    <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                      items={[
                        { label: "View Details", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true },
                        { label: trf.status === "pending" ? "Dispatch" : trf.status === "dispatched" ? "Mark In Transit" : trf.status === "in_transit" ? "Mark Received" : "View Receipt", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>, primary: true, disabled: trf.status === "completed" || trf.status === "cancelled" },
                        { label: "Print Transfer Note", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>, onClick: () => handlePrintTransfer(trf) },
                        { divider: true },
                        { label: "Cancel", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>, danger: true, disabled: trf.status === "completed" || trf.status === "cancelled" },
                      ]} align="right" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">New Inter-Store Transfer</h2>
              <button onClick={() => setShowCreate(false)} className="text-2xl text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-slate-600 mb-1">From Store *</label><select required value={form.fromStore} onChange={e => setForm(f => ({...f, fromStore: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select source store</option>{stores.map(s => <option key={s.id} value={s.name}>{s.name} ({s.type})</option>)}</select></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">To Store *</label><select required value={form.toStore} onChange={e => setForm(f => ({...f, toStore: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Select destination store</option>{stores.map(s => <option key={s.id} value={s.name}>{s.name} ({s.type})</option>)}</select></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Priority</label><select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="stat">STAT</option></select></div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Transfer Items</h3>
                  <button type="button" onClick={addItem} className="rounded-lg bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-bold">+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                      <div className="md:col-span-2"><label className="block text-[10px] text-slate-500 mb-1">Item / Medicine</label><input value={item.item} onChange={e => updateItem(idx, "item", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Inj. Ceftriaxone 1g" /></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Qty</label><input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, "qty", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
                      <div><label className="block text-[10px] text-slate-500 mb-1">Unit</label><select value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="Nos">Nos</option><option value="Box">Box</option><option value="Vial">Vial</option><option value="Ampoule">Ampoule</option></select></div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => removeItem(idx)} className="rounded-lg bg-rose-50 text-rose-600 px-3 py-2 text-sm hover:bg-rose-100">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Special handling, cold chain, urgent requirement..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Create Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default InterStoreTransferPage;
import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSuppliers,
  getPharmacyInventory,
} from "../../services/api.js";

export default function PurchaseOrdersPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isReceivingRoute = location.pathname.includes("stock-receiving");

  const [activeTab, setActiveTab] = useState(isReceivingRoute ? "receiving" : "orders");
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New PO Modal state
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierId: searchParams.get("supplier") || "",
    expectedDeliveryDate: "",
    notes: "",
    items: [{ medicineName: searchParams.get("prefill") || "", quantity: 100, unitPrice: 12.5 }],
  });

  // GRN Stock Receiving Modal state
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnForm, setGrnForm] = useState({
    invoiceNumber: "",
    receivedItems: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, suppRes, invRes] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
        getPharmacyInventory(),
      ]);
      setOrders(ordersRes.orders || ordersRes.purchaseOrders || []);
      setSuppliers(suppRes.suppliers || []);
      setMedicines(invRes.inventory || invRes.medicines || []);

      if (suppRes.suppliers?.length > 0 && !poForm.supplierId) {
        setPoForm((prev) => ({ ...prev, supplierId: suppRes.suppliers[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update tab if route changes
  useEffect(() => {
    if (isReceivingRoute) {
      setActiveTab("receiving");
    }
  }, [isReceivingRoute]);

  // Handle PO Creation
  const handleAddPOItem = () => {
    setPoForm((prev) => ({
      ...prev,
      items: [...prev.items, { medicineName: medicines[0]?.name || "", quantity: 50, unitPrice: 10.0 }],
    }));
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId) {
      alert("Please select a vendor supplier.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPurchaseOrder(poForm);
      setShowPOModal(false);
      fetchData();
      alert("Purchase Order created and submitted to vendor!");
    } catch (err) {
      alert("PO creation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open GRN Receiving Dialog
  const handleOpenGRN = (po) => {
    setSelectedPO(po);
    const initialItems = (po.items || []).map((it) => ({
      medicineName: it.medicine?.name || it.medicineName || "Medicine",
      quantityReceived: it.quantityOrdered || 50,
      batchNumber: `BAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      purchasePrice: it.unitPrice || 12.0,
      sellingPrice: (it.unitPrice || 12.0) * 1.5,
    }));
    setGrnForm({
      invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      receivedItems: initialItems,
    });
    setShowGRNModal(true);
  };

  // Submit GRN
  const handleReceiveGRN = async (e) => {
    e.preventDefault();
    if (!selectedPO) return;
    setIsSubmitting(true);
    try {
      await receivePurchaseOrder(selectedPO._id, grnForm);
      setShowGRNModal(false);
      fetchData();
      alert("Goods received successfully! New batches added to formulary and inventory balances updated.");
    } catch (err) {
      alert("GRN receiving failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Procurement & Receiving</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders & Goods Receipt (GRN)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Procure wholesale medications from licensed suppliers and receive batches into physical stock with automatic ledger entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPOModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-xs font-bold transition border-b-2 px-1 ${
            activeTab === "orders"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Purchase Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("receiving")}
          className={`pb-3 text-xs font-bold transition border-b-2 px-1 ${
            activeTab === "receiving"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Awaiting Stock Receiving (GRN)
        </button>
      </div>

      {/* Orders List Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading purchase orders and vendor contracts...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No purchase orders found</p>
            <p className="text-xs text-slate-400 mt-1">Create a purchase order to restock low inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Items Ordered</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => {
                  const isReceived = po.status === "received";
                  const isSubmitted = po.status === "submitted" || po.status === "partially_received";

                  return (
                    <tr key={po._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {po.poNumber || `PO-${po._id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{po.supplier?.name || "Vendor Partner"}</div>
                        <div className="text-[11px] text-slate-400">{po.supplier?.contactPerson || "Sales Desk"}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 max-w-xs truncate">
                          {po.items?.map((it) => `${it.medicineName || it.medicine?.name} (${it.quantityOrdered})`).join(", ") || "Medication items"}
                        </div>
                        <div className="text-[10px] text-slate-400">{po.items?.length || 1} line item(s)</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        ₹{(po.totalAmount || 12500).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN") : "Standard (3-5 days)"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isReceived ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Stock Received (GRN)
                          </span>
                        ) : isSubmitted ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                            Awaiting Delivery
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {po.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {!isReceived && (
                          <button
                            type="button"
                            onClick={() => handleOpenGRN(po)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition"
                          >
                            Receive Stock (GRN)
                          </button>
                        )}
                        {isReceived && (
                          <span className="text-[11px] font-semibold text-slate-400">Archived</span>
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

      {/* New Purchase Order Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Create Vendor Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePO} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Supplier</label>
                  <select
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.paymentTerms})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Order Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddPOItem}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700"
                  >
                    + Add Drug Item
                  </button>
                </div>

                {poForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Medicine Name</label>
                      <input
                        type="text"
                        value={item.medicineName}
                        onChange={(e) => {
                          const items = [...poForm.items];
                          items[idx].medicineName = e.target.value;
                          setPoForm({ ...poForm, items });
                        }}
                        placeholder="e.g. Paracetamol 650mg"
                        required
                        className="w-full border border-slate-200 rounded p-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Quantity Ordered</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const items = [...poForm.items];
                          items[idx].quantity = parseInt(e.target.value) || 0;
                          setPoForm({ ...poForm, items });
                        }}
                        required
                        className="w-full border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Estimated Unit Cost (₹)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const items = [...poForm.items];
                          items[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setPoForm({ ...poForm, items });
                        }}
                        required
                        className="w-full border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Procurement Instructions / Terms</label>
                <textarea
                  rows="2"
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="e.g. Minimum 18 months shelf life remaining required upon receipt."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400"
                >
                  {isSubmitting ? "Creating PO..." : "Issue Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Goods Receipt Modal */}
      {showGRNModal && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Goods Receipt Note (GRN) & Stock Entry</h3>
                <p className="text-xs text-slate-500">
                  Receiving stock for PO #{selectedPO.poNumber || selectedPO._id}
                </p>
              </div>
              <button onClick={() => setShowGRNModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleReceiveGRN} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor Delivery Invoice / DC Number</label>
                <input
                  type="text"
                  value={grnForm.invoiceNumber}
                  onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
                  required
                  placeholder="e.g. INV-99201"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                />
              </div>

              {/* Line items for batch assignment */}
              <div className="space-y-3">
                <p className="font-bold text-slate-800">Batch Assignment & Quality Verification</p>
                {grnForm.receivedItems.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <p className="font-bold text-slate-900 text-sm">{item.medicineName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Batch Number</label>
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => {
                            const items = [...grnForm.receivedItems];
                            items[idx].batchNumber = e.target.value;
                            setGrnForm({ ...grnForm, receivedItems: items });
                          }}
                          required
                          className="w-full border border-slate-200 rounded p-1.5 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Units Received</label>
                        <input
                          type="number"
                          value={item.quantityReceived}
                          onChange={(e) => {
                            const items = [...grnForm.receivedItems];
                            items[idx].quantityReceived = parseInt(e.target.value) || 0;
                            setGrnForm({ ...grnForm, receivedItems: items });
                          }}
                          required
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Mfg Date</label>
                        <input
                          type="date"
                          value={item.mfgDate}
                          onChange={(e) => {
                            const items = [...grnForm.receivedItems];
                            items[idx].mfgDate = e.target.value;
                            setGrnForm({ ...grnForm, receivedItems: items });
                          }}
                          required
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Expiry Date</label>
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => {
                            const items = [...grnForm.receivedItems];
                            items[idx].expiryDate = e.target.value;
                            setGrnForm({ ...grnForm, receivedItems: items });
                          }}
                          required
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGRNModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {isSubmitting ? "Updating Ledger..." : "Accept Goods & Add to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

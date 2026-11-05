import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getSuppliers,
  getPharmacyInventory,
} from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
  Modal,
} from "../../components/ui/index.js";

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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Purchase Orders & Goods Receipt (GRN)"
          subtitle="Procure wholesale medications from licensed suppliers and receive batches into physical stock with automatic ledger entries."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Procurement & Receiving</span>
            </span>
          }
          actions={[
            <Button key="new-po" size="sm" onClick={() => setShowPOModal(true)} leftIcon={<span>+</span>}>
              New Purchase Order
            </Button>,
          ]}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 text-xs font-bold transition border-b-2 px-1 ${
            activeTab === "orders"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          All Purchase Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("receiving")}
          className={`pb-3 text-xs font-bold transition border-b-2 px-1 ${
            activeTab === "receiving"
              ? "border-amber-600 text-amber-600"
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
            <p className="mt-3 text-xs font-semibold">Loading purchase orders and vendor contracts…</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyStateCard
            icon="📋"
            title="No purchase orders found"
            description="Create a purchase order to restock low inventory."
            actionText="New Purchase Order"
            onActionClick={() => setShowPOModal(true)}
          />
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
                          <Badge status="completed">✓ Stock Received (GRN)</Badge>
                        ) : isSubmitted ? (
                          <Badge status="pending" className="animate-pulse">Awaiting Delivery</Badge>
                        ) : (
                          <Badge status="normal">{po.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {!isReceived && (
                          <Button                             variant="outline"
                            size="sm"
                            onClick={() => handleOpenGRN(po)}
                          >
                            Receive Stock (GRN)
                          </Button>
                        )}
                        {isReceived && (
                          <span className="text-[11px] font-bold text-emerald-600">Receipt Issued</span>
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
        <Modal
          isOpen={showPOModal}
          onClose={() => setShowPOModal(false)}
          title="Create Vendor Purchase Order"
          className="max-w-2xl"
        >
          <form onSubmit={handleCreatePO} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Supplier</label>
                <select
                  value={poForm.supplierId}
                  onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold focus:border-teal-600 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.paymentTerms})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                <Input
                  type="date"
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                  id="po-expected-date"
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
                    <Input
                      type="text"
                      placeholder="e.g. Paracetamol 650mg"
                      value={item.medicineName}
                      onChange={(e) => {
                        const items = [...poForm.items];
                        items[idx].medicineName = e.target.value;
                        setPoForm({ ...poForm, items });
                      }}
                      required
                      id={`po-medicine-${idx}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Quantity Ordered</label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const items = [...poForm.items];
                        items[idx].quantity = parseInt(e.target.value) || 0;
                        setPoForm({ ...poForm, items });
                      }}
                      required
                      id={`po-quantity-${idx}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">Estimated Unit Cost (₹)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const items = [...poForm.items];
                        items[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setPoForm({ ...poForm, items });
                      }}
                      required
                      id={`po-price-${idx}`}
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
                className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-teal-600 focus:outline-none"
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
                className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating PO…" : "Issue Purchase Order"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* GRN Goods Receipt Modal */}
      {showGRNModal && selectedPO && (
        <Modal
          isOpen={showGRNModal}
          onClose={() => setShowGRNModal(false)}
          title="Goods Receipt Note (GRN) & Stock Entry"
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="mt-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">Receiving stock for PO #{selectedPO.poNumber || selectedPO._id}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vendor Delivery Invoice / DC Number</label>
              <Input
                type="text"
                placeholder="e.g. INV-99201"
                value={grnForm.invoiceNumber}
                onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
                required
                id="grn-invoice"
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
                      <Input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => {
                          const items = [...grnForm.receivedItems];
                          items[idx].batchNumber = e.target.value;
                          setGrnForm({ ...grnForm, receivedItems: items });
                        }}
                        required
                        id={`grn-batch-${idx}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Units Received</label>
                      <Input
                        type="number"
                        value={item.quantityReceived}
                        onChange={(e) => {
                          const items = [...grnForm.receivedItems];
                          items[idx].quantityReceived = parseInt(e.target.value) || 0;
                          setGrnForm({ ...grnForm, receivedItems: items });
                        }}
                        required
                        id={`grn-qty-${idx}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Mfg Date</label>
                      <Input
                        type="date"
                        value={item.mfgDate}
                        onChange={(e) => {
                          const items = [...grnForm.receivedItems];
                          items[idx].mfgDate = e.target.value;
                          setGrnForm({ ...grnForm, receivedItems: items });
                        }}
                        required
                        id={`grn-mfg-${idx}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Expiry Date</label>
                      <Input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => {
                          const items = [...grnForm.receivedItems];
                          items[idx].expiryDate = e.target.value;
                          setGrnForm({ ...grnForm, receivedItems: items });
                        }}
                        required
                        id={`grn-expiry-${idx}`}
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
                className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Updating Ledger…" : "Accept Goods & Add to Stock"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

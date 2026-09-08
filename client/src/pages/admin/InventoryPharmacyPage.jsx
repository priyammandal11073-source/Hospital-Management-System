import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAdminInventory,
  createAdminInventory,
  updateAdminInventoryStock,
} from "../../services/api.js";

const formatCurrency = (amt) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt || 0);

const STATUS_BADGES = {
  in_stock: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  low_stock: "bg-amber-50 text-amber-700 ring-amber-500/20",
  out_of_stock: "bg-rose-50 text-rose-700 ring-rose-500/20",
  expired: "bg-slate-200 text-slate-800 ring-slate-400/20",
};

export default function InventoryPharmacyPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "medication",
    sku: "",
    batchNumber: "",
    quantity: 100,
    unit: "tablets",
    minimumThreshold: 20,
    unitPrice: 10,
    location: "Pharmacy Central Shelf A",
    supplierName: "Nivora MedSupply Ltd.",
    expiryDate: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminInventory({ category, status, search });
      setItems(res.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createAdminInventory(formData);
      setSuccessMsg(`Inventory item "${formData.name}" added.`);
      setShowAddModal(false);
      setFormData({
        name: "",
        genericName: "",
        category: "medication",
        sku: "",
        batchNumber: "",
        quantity: 100,
        unit: "tablets",
        minimumThreshold: 20,
        unitPrice: 10,
        location: "Pharmacy Central Shelf A",
        supplierName: "Nivora MedSupply Ltd.",
        expiryDate: "",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add inventory item.");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    setError("");
    try {
      await updateAdminInventoryStock(adjustItem._id, { quantity: Number(adjustQty) });
      setSuccessMsg(`Stock updated for ${adjustItem.name} to ${adjustQty} ${adjustItem.unit}.`);
      setAdjustItem(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not adjust stock level.");
    }
  };

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter((i) => i.status === "low_stock").length;
    const outOfStock = items.filter((i) => i.status === "out_of_stock" || i.quantity <= 0).length;
    const totalValuation = items.reduce((acc, i) => acc + (i.quantity || 0) * (i.unitPrice || 0), 0);
    return { totalItems, lowStock, outOfStock, totalValuation };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Supply Chain & Pharmacy</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Pharmacy Inventory & Consumables</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {stats.totalItems} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pharmaceutical stock tracking, surgical consumables, minimum threshold alerts, and batch expiries.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <span>+</span>
          <span>Add SKU Item</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold">✕</button>
        </div>
      )}

      {/* 4 Telemetry Highlights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Listed SKUs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalItems}</p>
          <span className="text-[10px] text-slate-500">Catalogued lines</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Low Stock Alerts</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.lowStock}</p>
          <span className="text-[10px] text-amber-600 font-medium">Reorder recommended</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Stockouts</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.outOfStock}</p>
          <span className="text-[10px] text-rose-600 font-medium">Zero units available</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Total Inventory Value</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(stats.totalValuation)}</p>
          <span className="text-[10px] text-emerald-600 font-medium">At current retail MRP</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by medication name, generic chemical, SKU code, or batch..."
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
          <span className="text-slate-400 font-semibold text-[11px]">Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="medication">Medications</option>
            <option value="consumables">Consumables</option>
            <option value="surgical">Surgical Supplies</option>
            <option value="diagnostic">Diagnostic Reagents</option>
            <option value="general">General Supplies</option>
          </select>

          <span className="text-slate-400 font-semibold text-[11px] ml-2">Stock Level:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expired">Expired Batches</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Item / Generic Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SKU & Batch</th>
                <th className="px-4 py-3 text-right">Available Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Loading inventory stock levels...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400 italic">{item.genericName || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-600 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      <div>SKU: {item.sku || "—"}</div>
                      <div className="text-[10px] text-slate-400">Batch: {item.batchNumber || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {item.quantity} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${STATUS_BADGES[item.status] || STATUS_BADGES.in_stock}`}>
                        {item.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setAdjustItem(item);
                          setAdjustQty(item.quantity);
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-50 transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h2>
              <button onClick={() => setAdjustItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3.5">
              <div>
                <p className="text-xs font-bold text-slate-800">{adjustItem.name}</p>
                <p className="text-[11px] text-slate-500">Currently: {adjustItem.quantity} {adjustItem.unit}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Physical Count ({adjustItem.unit})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Confirm Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Inventory SKU</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Paracetamol 650mg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic / Chemical</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="Acetaminophen"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="medication">Medication</option>
                    <option value="consumables">Consumables</option>
                    <option value="surgical">Surgical Supplies</option>
                    <option value="diagnostic">Diagnostic Kits</option>
                    <option value="general">General Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="tablets, vials, boxes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minimumThreshold}
                    onChange={(e) => setFormData({ ...formData, minimumThreshold: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. SKU-PARA-650"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="BATCH-2026-X"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

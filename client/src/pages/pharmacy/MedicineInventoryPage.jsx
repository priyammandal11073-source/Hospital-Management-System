import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPharmacyInventory,
  addOrUpdateMedicine,
} from "../../services/api.js";

export default function MedicineInventoryPage() {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg",
    manufacturer: "Cipla Ltd",
    unitPrice: 15.0,
    currentStock: 100,
    reorderLevel: 20,
    requiresPrescription: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPharmacyInventory();
      setMedicines(data.inventory || data.medicines || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load medicine inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setFormData({
      name: "",
      genericName: "",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "500mg",
      manufacturer: "Cipla Ltd",
      unitPrice: 15.0,
      currentStock: 100,
      reorderLevel: 20,
      requiresPrescription: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name || "",
      genericName: med.genericName || "",
      category: med.category || "Antibiotics",
      dosageForm: med.dosageForm || "Tablet",
      strength: med.strength || "500mg",
      manufacturer: med.manufacturer || "Cipla Ltd",
      unitPrice: med.unitPrice || 15.0,
      currentStock: med.currentStock || 0,
      reorderLevel: med.reorderLevel || 20,
      requiresPrescription: med.requiresPrescription !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addOrUpdateMedicine({
        ...formData,
        _id: editingMedicine?._id,
      });
      setShowModal(false);
      fetchInventory();
      alert(editingMedicine ? "Medicine updated successfully!" : "New medicine added to formulary!");
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchGen = m.genericName?.toLowerCase().includes(q);
      const matchCat = m.category?.toLowerCase().includes(q);
      return matchName || matchGen || matchCat;
    }
    return true;
  });

  const categories = ["all", ...new Set(medicines.map((m) => m.category).filter(Boolean))];
  const lowStockCount = medicines.filter((m) => (m.currentStock || 0) <= (m.reorderLevel || 20)).length;
  const totalValuation = medicines.reduce((sum, m) => sum + (m.currentStock || 0) * (m.unitPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Formulary Database</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Inventory & Formulary</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Centralized pharmaceutical master catalog with real-time stock balances, reorder points, and unit pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Formulary Items</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{medicines.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Active items</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <p className="text-xs font-bold text-rose-700 uppercase">Low Stock Alert</p>
          <p className="mt-1 text-2xl font-black text-rose-900">{lowStockCount}</p>
          <p className="text-[10px] text-rose-700 mt-1">At or below reorder level</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Inventory Value</p>
          <p className="mt-1 text-2xl font-black text-slate-900">₹{Math.round(totalValuation).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total physical stock value</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-bold text-slate-400 uppercase">Categories</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{categories.length - 1}</p>
          <p className="text-[10px] text-slate-400 mt-1">Therapeutic classes</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brand, generic, category..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading medication database...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No medicines found</p>
            <p className="text-xs text-slate-400 mt-1">Try another search or add a new drug formulation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Medicine & Strength</th>
                  <th className="px-4 py-3">Generic Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock Level</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.map((med) => {
                  const stock = med.currentStock || 0;
                  const reorder = med.reorderLevel || 20;
                  const isLow = stock <= reorder;
                  const isOut = stock === 0;

                  return (
                    <tr key={med._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {med.dosageForm || "Tablet"} • {med.strength || "Standard"} • {med.manufacturer || "Cipla"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {med.genericName || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {med.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${
                            isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800"
                          }`}>
                            {stock} units
                          </span>
                          {isOut ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">Out</span>
                          ) : isLow ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">Low</span>
                          ) : null}
                        </div>
                        <div className="mt-1 h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, (stock / (reorder * 2)) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">
                        ₹{(med.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(med)}
                          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                        >
                          Edit
                        </button>
                        <Link
                          to={`/pharmacy/batches?medicine=${encodeURIComponent(med.name)}`}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                        >
                          Batches
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

      {/* Add / Edit Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingMedicine ? `Edit: ${editingMedicine.name}` : "Add Medicine to Formulary"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand / Trade Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Augmentin 625"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic / Chemical Name</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    required
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antacids">Antacids</option>
                    <option value="Antidiabetics">Antidiabetics</option>
                    <option value="Antihypertensives">Antihypertensives</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Injectables">Injectables</option>
                    <option value="Vaccines">Vaccines</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg"
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                >
                  {isSubmitting ? "Saving..." : editingMedicine ? "Update Formulary" : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

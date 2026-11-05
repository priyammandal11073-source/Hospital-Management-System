import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPharmacyInventory,
  addOrUpdateMedicine,
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
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Medicine Inventory & Formulary"
          subtitle="Centralized pharmaceutical master catalog with real-time stock balances, reorder points, and unit pricing."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Formulary Database</span>
            </span>
          }
          actions={[
            <Button key="add" size="sm" onClick={handleOpenAdd} leftIcon={<span>+</span>}>
              Add Medicine
            </Button>,
          ]}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInventory} className="font-bold">Retry</button>
        </div>
      )}

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card title="Formulary Items" subtitle="Active items">
          <div className="text-2xl font-black text-slate-900">{medicines.length}</div>
        </Card>
        <Card title="Low Stock Alert" subtitle="At or below reorder level">
          <div className="text-2xl font-black text-rose-900">{lowStockCount}</div>
        </Card>
        <Card title="Inventory Value" subtitle="Total physical stock value">
          <div className="text-2xl font-black text-slate-900">₹{Math.round(totalValuation).toLocaleString("en-IN")}</div>
        </Card>
        <Card title="Categories" subtitle="Therapeutic classes">
          <div className="text-2xl font-black text-slate-900">{categories.length - 1}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition whitespace-nowrap inline-flex items-center justify-center ${
                selectedCategory === cat
                  ? "bg-slate-900 text-slate-100 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Input
            type="text"
            placeholder="Search brand, generic, category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
            id="inventory-search"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading medication database…</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <EmptyStateCard
            icon="💊"
            title="No medicines found"
            description="Try another search or add a new drug formulation."
            actionText="Add Medicine"
            onActionClick={handleOpenAdd}
          />
        ) : (
          <div>
            {/* Mobile Stacked Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredMedicines.map((med) => {
                const stock = med.currentStock || 0;
                const reorder = med.reorderLevel || 20;
                const isLow = stock <= reorder;
                const isOut = stock === 0;

                return (
                  <div key={med._id} className="p-4 space-y-3 hover:bg-slate-50/70 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{med.name}</h3>
                        <p className="text-[11px] text-slate-500">
                          {med.dosageForm || "Tablet"} • {med.strength || "Standard"} • {med.manufacturer || "Cipla"}
                        </p>
                        {med.genericName && (
                          <p className="text-xs text-slate-600 font-medium mt-0.5">{med.genericName}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shrink-0">
                        {med.category || "General"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
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
                      </div>

                      <span className="font-black text-slate-900 font-mono text-sm">
                        ₹{(med.unitPrice || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(med)}
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition flex items-center justify-center"
                      >
                        Edit Details
                      </button>
                      <Link
                        to={`/pharmacy/batches?medicine=${encodeURIComponent(med.name)}`}
                        className="flex-1 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition flex items-center justify-center"
                      >
                        View Batches
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}
      </div>

      {/* Add / Edit Medicine Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingMedicine ? `Edit: ${editingMedicine.name}` : "Add Medicine to Formulary"}
          className="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand / Trade Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Augmentin 625"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  id="med-name"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Generic / Chemical Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Amoxicillin + Clavulanate"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  required
                  id="med-generic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
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
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 p-2.5 focus:border-amber-500 focus:outline-none"
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
                <Input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  id="med-strength"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Price (₹)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  required
                  id="med-price"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Stock</label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  required
                  id="med-stock"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                  required
                  id="med-reorder"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] rounded-xl bg-amber-600 px-6 py-2.5 font-bold text-white hover:bg-amber-700 shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : editingMedicine ? "Update Formulary" : "Save Medicine"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

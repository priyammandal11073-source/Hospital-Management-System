import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuppliers, createSupplier } from "../../services/api.js";
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

export default function SuppliersManagementPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Add Supplier Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    drugLicenseNumber: "",
    paymentTerms: "Net 30",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createSupplier(formData);
      setShowModal(false);
      fetchSuppliers();
      alert("New pharmaceutical supplier registered successfully!");
    } catch (err) {
      alert("Failed to save supplier: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.gstNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 bg-[#f7f6f3]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
        <PageHeader
          title="Approved Pharmaceutical Suppliers"
          subtitle="Registered drug distributors, wholesale manufacturers, GST details, and licensed supply partners."
          breadcrumbs={
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Supply Chain & Vendors</span>
            </span>
          }
          actions={[
            <Button key="add" size="sm" onClick={() => setShowModal(true)} leftIcon={<span>+</span>}>
              Register New Supplier
            </Button>,
          ]}
        />
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search vendor by business name, contact person, or GSTIN…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
            id="supplier-search"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading verified pharmaceutical distributors…</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <EmptyStateCard
            icon="🏭"
            title="No suppliers registered"
            description="Register your first vendor to initiate purchase orders."
            actionText="Register Supplier"
            onActionClick={() => setShowModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vendor / Distributor</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Drug Lic. / GSTIN</th>
                  <th className="px-4 py-3">Payment Terms</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.address || "Mumbai, India"}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {s.contactPerson || "Account Manager"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div>{s.phone || "+91 98200 11223"}</div>
                      <div className="text-[11px] text-slate-400">{s.email || "orders@vendor.com"}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      <div>GST: {s.gstNumber || "27AABCU9603R1ZM"}</div>
                      <div className="text-[10px] text-slate-400">DL: {s.drugLicenseNumber || "MH-TZ2-9482"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status="normal">{s.paymentTerms || "Net 30"}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/pharmacy/purchase-orders?supplier=${s._id}`}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-2xs"
                      >
                        Create PO
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Register Approved Supplier"
          className="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Distributor Name</label>
              <Input
                type="text"
                placeholder="e.g. MedPlus Pharma Distributors Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                id="supplier-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                <Input
                  type="text"
                  placeholder="e.g. Ramesh Shah"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  required
                  id="supplier-contact"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <Input
                  type="text"
                  placeholder="+91 98200 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  id="supplier-phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="orders@medplus.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  id="supplier-email"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-teal-600 focus:outline-none"
                >
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Advance">100% Advance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                <Input
                  type="text"
                  placeholder="27AAACH0000A1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  id="supplier-gstin"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
                <Input
                  type="text"
                  placeholder="MH-MZ2-10829"
                  value={formData.drugLicenseNumber}
                  onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                  id="supplier-dl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? "Registering…" : "Save Supplier"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

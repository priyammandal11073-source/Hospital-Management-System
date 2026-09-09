import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuppliers, createSupplier } from "../../services/api.js";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Supply Chain & Vendors</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approved Pharmaceutical Suppliers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered drug distributors, wholesale manufacturers, GST details, and licensed supply partners.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Register New Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor by business name, contact person, or GSTIN..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading verified pharmaceutical distributors...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-bold text-slate-700">No suppliers registered</p>
            <p className="text-xs text-slate-400 mt-1">Register your first vendor to initiate purchase orders.</p>
          </div>
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
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                        {s.paymentTerms || "Net 30"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/pharmacy/purchase-orders?supplier=${s._id}`}
                        className="rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition shadow-2xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Register Approved Supplier</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Distributor Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. MedPlus Pharma Distributors Ltd"
                  className="w-full rounded-xl border border-slate-200 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                    placeholder="e.g. Ramesh Shah"
                    className="w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+91 98200 12345"
                    className="w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="orders@medplus.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5"
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
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="27AAACH0000A1Z5"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
                  <input
                    type="text"
                    value={formData.drugLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                    placeholder="MH-MZ2-10829"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400"
                >
                  {isSubmitting ? "Registering..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

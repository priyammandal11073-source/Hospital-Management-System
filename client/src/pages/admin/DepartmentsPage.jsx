import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminDepartments, createAdminDepartment, getDoctors } from "../../services/api.js";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    headOfDepartment: "",
    location: "Main Hospital Building",
    floor: "Ground Floor",
    contactExtension: "101",
    operatingHours: "08:00 AM - 08:00 PM",
    description: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        getAdminDepartments(),
        getDoctors(),
      ]);
      setDepartments(deptRes.departments || []);
      setDoctors(docRes.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hospital departments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createAdminDepartment(formData);
      setSuccessMsg(`Department "${formData.name}" created successfully.`);
      setShowAddModal(false);
      setFormData({
        name: "",
        code: "",
        headOfDepartment: "",
        location: "Main Hospital Building",
        floor: "Ground Floor",
        contactExtension: "101",
        operatingHours: "08:00 AM - 08:00 PM",
        description: "",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Hospital Infrastructure</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Hospital Departments & Clinical Wings</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {departments.length} Units
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical specialties, emergency trauma centers, diagnostics wings, and institutional divisions.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <span>+</span>
          <span>Add New Department</span>
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

      {/* Grid of Departments */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading hospital divisions...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 ring-1 ring-purple-500/20">
                  {dept.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Ext: #{dept.contactExtension || "—"}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-3 group-hover:text-purple-700 transition">
                {dept.name}
              </h2>

              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {dept.description || "Comprehensive clinical and patient care division."}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-700">{dept.location} ({dept.floor})</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Hours:</span>
                  <span className="font-medium text-slate-700">{dept.operatingHours}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">HOD / Lead:</span>
                  <span className="font-bold text-purple-700">
                    {dept.headOfDepartment?.name ? `Dr. ${dept.headOfDepartment.name}` : "Assigned Senior Lead"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Clinical Department</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Oncology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code (3-4 chars) *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase focus:border-purple-500 focus:outline-none"
                    placeholder="ONCO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Building / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intercom Extension</label>
                  <input
                    type="text"
                    value={formData.contactExtension}
                    onChange={(e) => setFormData({ ...formData, contactExtension: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head (Doctor)</label>
                <select
                  value={formData.headOfDepartment}
                  onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value="">-- Assign Doctor Lead (Optional) --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  placeholder="Clinical scope, diagnostic capabilities, or sub-specialties..."
                />
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
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

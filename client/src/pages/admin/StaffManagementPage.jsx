import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAdminStaff, createAdminStaff, updateAdminStaff, getAdminDepartments } from "../../services/api.js";

const ROLE_BADGES = {
  admin: "bg-purple-50 text-purple-700 ring-purple-500/20",
  super_admin: "bg-purple-100 text-purple-800 ring-purple-600/30",
  doctor: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  nurse: "bg-teal-50 text-teal-700 ring-teal-500/20",
  receptionist: "bg-amber-50 text-amber-700 ring-amber-500/20",
  lab_technician: "bg-blue-50 text-blue-700 ring-blue-500/20",
  pharmacist: "bg-rose-50 text-rose-700 ring-rose-500/20",
};

const STATUS_BADGES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-400/20",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-500/20",
};

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Form State for Add
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "nurse",
    department: "General Medicine",
    designation: "",
    employeeId: "",
    contactNumber: "",
    shift: "morning",
  });

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [staffRes, deptRes] = await Promise.all([
        getAdminStaff({ search: searchQuery, role: selectedRole, department: selectedDept, status: selectedStatus }),
        getAdminDepartments(),
      ]);
      setStaffList(staffRes.staff || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRole, selectedDept, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createAdminStaff(formData);
      setSuccessMsg(`Staff member ${formData.name} successfully registered.`);
      setShowAddModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "nurse",
        department: "General Medicine",
        designation: "",
        employeeId: "",
        contactNumber: "",
        shift: "morning",
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not register staff member.");
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setError("");
    try {
      await updateAdminStaff(editingStaff._id, {
        name: editingStaff.name,
        role: editingStaff.role,
        department: editingStaff.department,
        designation: editingStaff.designation,
        contactNumber: editingStaff.contactNumber,
        status: editingStaff.status,
      });
      setSuccessMsg(`Staff profile for ${editingStaff.name} updated.`);
      setEditingStaff(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update staff member.");
    }
  };

  const stats = useMemo(() => {
    const total = staffList.length;
    const doctors = staffList.filter((s) => s.role === "doctor").length;
    const nurses = staffList.filter((s) => s.role === "nurse").length;
    const admins = staffList.filter((s) => s.role === "admin" || s.role === "super_admin").length;
    const active = staffList.filter((s) => s.status === "active" || !s.status).length;
    return { total, doctors, nurses, admins, active };
  }, [staffList]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Human Resources</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Hospital Staff Directory & HR</span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
              {stats.total} Employees
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage medical specialists, nursing team, clinical officers, administration, and role-based permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
        >
          <span>+</span>
          <span>Register New Staff</span>
        </button>
      </div>

      {/* Alerts */}
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

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Personnel</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-500">All registered roles</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Doctors & Specialists</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.doctors}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Licensed consultants</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-teal-600 uppercase">Nursing Staff</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.nurses}</p>
          <span className="text-[10px] text-teal-600 font-medium">Inpatient & ICU</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">Administration</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.admins}</p>
          <span className="text-[10px] text-purple-600 font-medium">Executive control</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Active Status</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.active}</p>
          <span className="text-[10px] text-blue-600 font-medium">Duty ready</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by staff name, employee ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Filter By:</span>
          
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="doctor">Doctors</option>
            <option value="nurse">Nurses</option>
            <option value="receptionist">Receptionists</option>
            <option value="admin">Administrators</option>
            <option value="lab_technician">Lab Technicians</option>
            <option value="pharmacist">Pharmacists</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>

          {(selectedRole !== "All" || selectedDept !== "All" || selectedStatus !== "All" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRole("All");
                setSelectedDept("All");
                setSelectedStatus("All");
                setSearchQuery("");
                loadData();
              }}
              className="text-xs text-purple-600 font-bold hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Loading hospital workforce...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    No staff records found matching your filters.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase shadow-2xs">
                          {member.name ? member.name.charAt(0) : "S"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{member.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {member.employeeId || member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${ROLE_BADGES[member.role] || "bg-slate-100 text-slate-600"}`}>
                        {member.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {member.department || "General"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {member.designation || "Staff Member"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {member.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${STATUS_BADGES[member.status] || STATUS_BADGES.active}`}>
                        {member.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingStaff({ ...member })}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Register New Hospital Staff</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Dr. Priya Sen"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. EMP-1044"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="staff@nivoracare.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Specialist Doctor</option>
                    <option value="receptionist">Receptionist / Front Desk</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Senior Staff Nurse"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="+91 98765 43210"
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
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Edit Staff Record</h2>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Specialist Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingStaff.department || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingStaff.designation || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingStaff.status || "active"}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingStaff.contactNumber || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, contactNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

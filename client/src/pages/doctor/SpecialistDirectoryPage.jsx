import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSpecialistDirectory } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function SpecialistDirectoryPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    loadDirectory();
  }, []);

  const loadDirectory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSpecialistDirectory();
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load specialist directory.");
    } finally {
      setLoading(false);
    }
  };

  const departments = Array.from(new Set(doctors.map((d) => d.department).filter(Boolean)));

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.department?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || doc.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 text-xl">👥</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hospital Specialist Directory</h1>
            <p className="text-xs text-slate-500">
              Browse hospital physicians across all departments for cross-consultation and referrals
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/doctor/referrals")}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          View Referrals Desk
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialization, or department..."
            className="w-full rounded-lg border-0 bg-transparent text-xs focus:ring-0 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase text-[10px]">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specialist Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Loading specialist directory...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">{error}</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          No specialists found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{formatDoctorName(doc.name)}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{doc.specialization}</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold mt-1">
                    {doc.department}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p><span className="font-semibold text-slate-500">OPD Consultation Fee:</span> ₹{doc.consultationFee || "0"}</p>
                <p><span className="font-semibold text-slate-500">Phone:</span> {doc.phone || "-"}</p>
                <p><span className="font-semibold text-slate-500">Email:</span> {doc.email || "-"}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-600 font-semibold">
                  ● Available for Consultation
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/referrals")}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition border border-purple-200"
                >
                  Refer Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

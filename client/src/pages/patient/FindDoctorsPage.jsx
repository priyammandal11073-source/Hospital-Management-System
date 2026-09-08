import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatientDoctors } from "../../services/api.js";

const DEPARTMENTS = [
  "All",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
  "Dermatology",
  "Gynecology & Obstetrics",
  "Oncology",
  "Gastroenterology",
  "Pulmonology",
  "ENT / Otorhinolaryngology",
];

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getPatientDoctors({
          department: selectedDept !== "All" ? selectedDept : undefined,
          search: search.trim() || undefined,
        });
        if (isCurrent) setDoctors(data.doctors || []);
      } catch (err) {
        if (isCurrent) setError(err.response?.data?.message || "Failed to load doctors");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    load();
    return () => { isCurrent = false; };
  }, [selectedDept, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20 mb-2">
          <span>👨‍⚕️</span> Nivora Care Specialist Medical Team
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Find a Doctor & Clinical Specialists
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search renowned consultants, view weekly availability, and book outpatient appointments.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Department:
          </span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-xs font-medium text-slate-500 animate-pulse">Loading medical staff directory...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-3xl block mb-2">🔍</span>
          <h3 className="text-sm font-bold text-slate-800">No doctors match your search query</h3>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your department filter or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                    {doc.name ? doc.name.charAt(0) : "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                      Dr. {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-500">{doc.department}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-400 block font-semibold">Experience</span>
                    <strong className="text-slate-800">{doc.yearsOfExperience || 5}+ Years</strong>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-400 block font-semibold">OPD Fee</span>
                    <strong className="text-slate-800">₹{doc.consultationFee || 500}</strong>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Available Days
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(doc.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]).map((day) => (
                      <span key={day} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(doc)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  View Profile
                </button>
                <Link
                  to={`/patient/appointments/book?doctor=${doc._id}`}
                  className="flex-1 text-center rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  Book Visit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-slide-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {selectedDoctor.name ? selectedDoctor.name.charAt(0) : "D"}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Dr. {selectedDoctor.name}</h3>
                  <p className="text-xs font-semibold text-blue-600">{selectedDoctor.specialization} • {selectedDoctor.department}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Clinical Experience</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{selectedDoctor.yearsOfExperience || 5}+ Years</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Consultation Fee</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">₹{selectedDoctor.consultationFee || 500}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Consultation Schedule
                </span>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <p><strong>Days on duty:</strong> {(selectedDoctor.availableDays || []).join(", ")}</p>
                  <p><strong>Typical time slots:</strong> {(selectedDoctor.availableTimeSlots || []).join(", ")}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Department & Hospital Affiliation
                </span>
                <p className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-slate-600 leading-relaxed">
                  Attending Consultant at Nivora Care Hospital, Department of {selectedDoctor.department}. Specialized in high-acuity diagnostics and personalized outpatient care plans.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <Link
                to={`/patient/appointments/book?doctor=${selectedDoctor._id}`}
                className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
              >
                Book Appointment With Dr. {selectedDoctor.name} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

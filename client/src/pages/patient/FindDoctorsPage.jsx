import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPatientDoctors } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

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
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Care Visits", to: "/patient/appointments" },
          { label: "Doctor Directory", active: true },
        ]}
        title="Find a Doctor & Specialists"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Medical Faculty
          </span>
        }
        subtitle="Search renowned consultants, view weekly availability, and book outpatient appointments."
      />

      {/* Filter Toolbar */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Department:
          </span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-700 focus:outline-hidden"
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent mx-auto" />
          <p className="mt-3 text-xs font-medium text-slate-500">Loading medical staff directory...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <span className="text-3xl block mb-2">🔍</span>
          <h3 className="text-sm font-bold text-slate-800">No doctors match your search query</h3>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your department filter or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="group rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-black text-base flex items-center justify-center shrink-0 shadow-2xs">
                    {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {formatDoctorName(doc.name)}
                    </h3>
                    <p className="text-xs font-semibold text-teal-800 truncate">
                      {doc.specialization || "General Medicine"}
                    </p>
                    <span className="inline-block mt-1 rounded-full liquid-glass-pill px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/70">
                      {doc.department || "OPD Department"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <strong className="text-slate-800">{doc.yearsOfExperience || 5}+ Years</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <strong className="text-teal-800 font-bold font-mono">₹{doc.consultationFee || 500}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Available:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[150px]">
                      {(doc.availableDays || ["Mon", "Wed", "Fri"]).slice(0, 3).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(doc)}
                  className="flex-1 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  View Profile
                </button>
                <Link
                  to={`/patient/appointments/book?doctor=${doc._id}`}
                  className="flex-1 text-center rounded-xl bg-teal-700 hover:bg-teal-800 py-2 text-xs font-semibold text-white transition shadow-sm shadow-teal-950/10 active:scale-95"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-2xl liquid-glass-card border border-slate-200/80 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-black text-lg flex items-center justify-center shadow-2xs">
                  {selectedDoctor.name ? selectedDoctor.name.charAt(0).toUpperCase() : "D"}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{formatDoctorName(selectedDoctor.name)}</h3>
                  <p className="text-xs font-semibold text-teal-800">{selectedDoctor.specialization} • {selectedDoctor.department}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Clinical Experience</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{selectedDoctor.yearsOfExperience || 5}+ Years</strong>
                </div>
                <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <span className="text-slate-400 font-semibold block">Consultation Fee</span>
                  <strong className="text-teal-800 text-sm mt-0.5 block font-mono font-bold">₹{selectedDoctor.consultationFee || 500}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Consultation Schedule
                </span>
                <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100 space-y-1">
                  <p><strong>Days on duty:</strong> {(selectedDoctor.availableDays || []).join(", ")}</p>
                  <p><strong>Typical time slots:</strong> {(selectedDoctor.availableTimeSlots || []).join(", ")}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Department & Hospital Affiliation
                </span>
                <p className="rounded-xl bg-slate-50/70 p-3 border border-slate-100 text-slate-600 leading-relaxed">
                  Attending Consultant at Nivora Care Hospital, Department of {selectedDoctor.department}. Specialized in high-acuity diagnostics and personalized outpatient care plans.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Close
              </button>
              <Link
                to={`/patient/appointments/book?doctor=${selectedDoctor._id}`}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white transition shadow-sm shadow-teal-950/10 active:scale-95"
              >
                Book Appointment With {formatDoctorName(selectedDoctor.name)} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

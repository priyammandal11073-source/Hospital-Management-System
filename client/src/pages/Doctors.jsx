import { useEffect, useState } from "react";
import DoctorForm from "../components/DoctorForm.jsx";
import DoctorScheduleModal from "../components/DoctorScheduleModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteDoctor, getDoctors } from "../services/api.js";

const specializations = ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics"];
const departments = ["Cardiology", "Medicine", "Neurology", "Orthopedics", "Pediatrics"];

function Doctors() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchDoctors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getDoctors(specialization, department);
        if (isCurrentRequest) setDoctors(data.doctors);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load doctors.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchDoctors();

    return () => {
      isCurrentRequest = false;
    };
  }, [specialization, department, refreshKey]);

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedDoctor(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This cannot be undone.`)) return;

    setError("");

    try {
      await deleteDoctor(doctor._id);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete doctor.");
    }
  };

  const isDoctor = user?.role === "doctor";

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isDoctor ? "My Schedule & Availability" : "Doctors Directory"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isDoctor
              ? "Manage your weekly consultation shifts, slot durations, and planned leaves."
              : "View doctor profiles, specialties, and clinical availability."}
          </p>
        </div>
        {isAdmin && (
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => {
              setSelectedDoctor(null);
              setIsFormOpen(true);
            }}
            type="button"
          >
            + Add doctor
          </button>
        )}
      </div>

      {!isDoctor && (
        <div className="mb-5 grid max-w-2xl gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Specialization
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => setSpecialization(event.target.value)}
              value={specialization}
            >
              <option value="">All specializations</option>
              {specializations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              <option value="">All departments</option>
              {departments.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-center text-slate-600">Loading doctors...</p>
        ) : doctors.length === 0 ? (
          <p className="p-6 text-center text-slate-600">No doctors found.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Experience</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {doctors.map((doctor) => (
                <tr key={doctor._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs ring-1 ring-indigo-500/20 flex-shrink-0">
                        Dr
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Dr. {doctor.name}</p>
                        <p className="text-xs text-slate-500">{doctor.email || "Hospital specialist"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
                      {doctor.specialization}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {doctor.department}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {doctor.contactNumber ? (doctor.contactNumber.startsWith("+91") ? doctor.contactNumber : `+91 ${doctor.contactNumber}`) : "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {doctor.yearsOfExperience ?? 0} yrs exp
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right space-x-2">
                    <button
                      className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                      onClick={() => setScheduleDoctor(doctor)}
                      title="Manage availability schedule and leaves"
                      type="button"
                    >
                      📅 Schedule
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          aria-label={`Edit Dr. ${doctor.name}`}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setIsFormOpen(true);
                          }}
                          title="Edit doctor"
                          type="button"
                        >
                          ✎ Edit
                        </button>
                        <button
                          aria-label={`Delete Dr. ${doctor.name}`}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition shadow-2xs"
                          onClick={() => handleDelete(doctor)}
                          title="Delete doctor"
                          type="button"
                        >
                          🗑 Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedDoctor ? "Edit doctor" : "Add doctor"}
              </h2>
              <button
                aria-label="Close form"
                className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100"
                onClick={closeForm}
                type="button"
              >
                ×
              </button>
            </div>
            <DoctorForm
              doctor={selectedDoctor}
              key={selectedDoctor?._id || "new-doctor"}
              onCancel={closeForm}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
      {scheduleDoctor && (
        <DoctorScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setScheduleDoctor(null)}
          onUpdated={() => {
            setScheduleDoctor(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </section>
  );
}

export default Doctors;

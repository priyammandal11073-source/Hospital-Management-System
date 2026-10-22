import { useEffect, useState } from "react";
import DoctorForm from "../components/DoctorForm.jsx";
import DoctorScheduleModal from "../components/DoctorScheduleModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteDoctor, getDoctors } from "../services/api.js";
import { getDoctorDisplayName } from "../utils/doctorName.js";
import { PageHeader, ConfirmDialog } from "../components/ui/index.js";

const specializations = ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics"];
const departments = ["Cardiology", "Medicine", "Neurology", "Orthopedics", "Pediatrics"];

function Doctors() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isNurse = user?.role === "nurse";
  const canManageDoctorSchedule = !isNurse && (isAdmin || isDoctor);
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = (doctor) => {
    setDoctorToDelete(doctor);
  };

  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    setError("");

    try {
      await deleteDoctor(doctorToDelete._id);
      setDoctorToDelete(null);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete doctor.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section>
      <PageHeader
        title={isDoctor ? "My Schedule & Availability" : "Doctors Directory"}
        subtitle={
          isDoctor
            ? "Manage your weekly consultation shifts, slot durations, and planned leaves."
            : "View doctor profiles, specialties, and clinical availability."
        }
        action={
          isAdmin ? (
            <button
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
              onClick={() => {
                setSelectedDoctor(null);
                setIsFormOpen(true);
              }}
              type="button"
            >
              + Add Doctor
            </button>
          ) : null
        }
      />

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

      {isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent mb-2"></div>
          <p>Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          No doctors found.
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card View (< md) */}
          <div className="block md:hidden space-y-3">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs ring-1 ring-indigo-500/20 flex-shrink-0">
                      Dr
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{getDoctorDisplayName(doctor)}</h3>
                      <p className="text-xs text-slate-500">{doctor.email || "Hospital specialist"}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-500/20">
                    {doctor.specialization}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800 text-xs">{doctor.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Experience</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">{doctor.yearsOfExperience ?? 0} yrs exp</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {doctor.contactNumber ? (doctor.contactNumber.startsWith("+91") ? doctor.contactNumber : `+91 ${doctor.contactNumber}`) : "—"}
                    </span>
                  </div>
                </div>

                {/* Mobile Touch-Friendly Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {canManageDoctorSchedule && (
                    <button
                      className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => setScheduleDoctor(doctor)}
                      title="Manage availability schedule and leaves"
                      type="button"
                    >
                      📅 Schedule
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        aria-label={`Edit ${getDoctorDisplayName(doctor)}`}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
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
                        aria-label={`Delete ${getDoctorDisplayName(doctor)}`}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => handleDelete(doctor)}
                        title="Delete doctor"
                        type="button"
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl bg-white shadow-xs ring-1 ring-slate-200/80">
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
                          <p className="font-bold text-slate-800">{getDoctorDisplayName(doctor)}</p>
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
                      {canManageDoctorSchedule && (
                        <button
                          className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                          onClick={() => setScheduleDoctor(doctor)}
                          title="Manage availability schedule and leaves"
                          type="button"
                        >
                          📅 Schedule
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
aria-label={`Edit ${getDoctorDisplayName(doctor)}`}
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
aria-label={`Delete ${getDoctorDisplayName(doctor)}`}
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
          </div>
        </>
      )}

      {isFormOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-2.5 sm:p-4 backdrop-blur-md animate-backdrop-fade"
          role="dialog"
        >
          <div className="modal-viewport w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-slate-200/80 animate-pop-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedDoctor ? "Edit doctor profile" : "Add new doctor"}
              </h2>
              <button
                aria-label="Close form"
                className="rounded-lg p-1.5 text-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition touch-target flex items-center justify-center cursor-pointer"
                onClick={closeForm}
                type="button"
              >
                ✕
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
      {canManageDoctorSchedule && scheduleDoctor && (
        <DoctorScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setScheduleDoctor(null)}
          onUpdated={() => {
            setScheduleDoctor(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Modern Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(doctorToDelete)}
        title="Delete Doctor"
        message={
          doctorToDelete
            ? `Are you sure you want to delete ${getDoctorDisplayName(doctorToDelete)}? This cannot be undone.`
            : ""
        }
        confirmText="Delete Doctor"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDeleteDoctor}
        onCancel={() => setDoctorToDelete(null)}
      />
    </section>
  );
}

export default Doctors;

import { useEffect, useState } from "react";
import AppointmentForm from "../components/AppointmentForm.jsx";
import PrescriptionForm from "../components/PrescriptionForm.jsx";
import PrescriptionModal from "../components/PrescriptionModal.jsx";
import NursingChecklistModal from "../components/NursingChecklistModal.jsx";
import VitalsTracker from "../components/VitalsTracker.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  deleteAppointment,
  getAppointments,
  getDoctors,
  updateAppointmentStatus,
  getPatientVitals,
} from "../services/api.js";

const statuses = ["pending", "confirmed", "checked_in", "in_consultation", "completed", "cancelled"];

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In (Waiting)",
  in_consultation: "In Consultation",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusClasses = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-teal-100 text-teal-800",
  in_consultation: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function Appointments() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const canDelete = ["admin", "receptionist", "nurse"].includes(user?.role);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    doctor: "",
    startDate: "",
    endDate: "",
    bookedBy: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rxAppointment, setRxAppointment] = useState(null);
  const [viewedRx, setViewedRx] = useState(null);
  const [checklistAppointment, setChecklistAppointment] = useState(null);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [patientVitalsList, setPatientVitalsList] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchDoctors = async () => {
      try {
        const data = await getDoctors();
        if (isCurrentRequest) setDoctors(data.doctors);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load doctor filters.");
        }
      }
    };

    fetchDoctors();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getAppointments(filters);
        if (isCurrentRequest) setAppointments(data.appointments);
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load appointments.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchAppointments();

    return () => {
      isCurrentRequest = false;
    };
  }, [filters, refreshKey]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleStatusChange = async (appointmentId, status) => {
    setUpdatingId(appointmentId);
    setError("");

    try {
      await updateAppointmentStatus(appointmentId, status);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update appointment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (appointment) => {
    if (!window.confirm("Delete this appointment? This cannot be undone.")) return;

    setError("");

    try {
      await deleteAppointment(appointment._id);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete appointment.");
    }
  };

  const handleBookingSuccess = () => {
    setIsFormOpen(false);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isDoctor ? "My Clinical Consultations" : "Appointments"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isDoctor
              ? "Review and manage consultations assigned to your clinical schedule."
              : "Book and manage hospital-wide patient appointments."}
          </p>
        </div>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          + Book appointment
        </button>
      </div>

      <div className={`mb-5 grid gap-3 ${isDoctor ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="status"
            onChange={handleFilterChange}
            value={filters.status}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status] || status}
              </option>
            ))}
          </select>
        </label>
        {!isDoctor && (
          <label className="text-sm font-medium text-slate-700">
            Doctor
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              name="doctor"
              onChange={handleFilterChange}
              value={filters.doctor}
            >
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-medium text-slate-700">
          From date
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="startDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.startDate}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          To date
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="endDate"
            onChange={handleFilterChange}
            type="date"
            value={filters.endDate}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Booked by
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            name="bookedBy"
            onChange={handleFilterChange}
            value={filters.bookedBy}
          >
            <option value="">All bookings</option>
            <option value="patient">Patient self-booked</option>
            <option value="staff">Staff created</option>
          </select>
        </label>
      </div>
      {filters.bookedBy === "patient" && filters.status === "pending" && (
        <p className="mb-4 text-sm font-medium text-amber-700">Showing patient-booked pending appointments — staff review queue</p>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-center text-slate-600">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="p-6 text-center text-slate-600">No appointments found.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {appointments
                .filter((a) => !filters.bookedBy || a.bookedBy === filters.bookedBy)
                .map((appointment) => (
                <tr
                  key={appointment._id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    appointment.bookedBy === "patient" && appointment.status === "pending" ? "bg-amber-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs ring-1 ring-blue-500/20 flex-shrink-0">
                        {appointment.patient?.name ? appointment.patient.name.charAt(0).toUpperCase() : "P"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{appointment.patient?.name || "Unknown patient"}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{appointment.patient?.contactNumber || "No phone"}</span>
                          {appointment.bookedBy === "patient" && (
                            <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.2 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-500/20">
                              Portal booked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold ring-1 ring-indigo-500/20">
                        🩺
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Dr. {appointment.doctor?.name || "Unknown doctor"}</p>
                        <p className="text-xs text-slate-500">{appointment.doctor?.specialization || "Specialist"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {appointment.timeSlot}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                        statusClasses[appointment.status]
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                  </td>
                  <td className="max-w-48 truncate px-4 py-3.5 text-xs text-slate-600" title={appointment.reasonForVisit}>
                    {appointment.reasonForVisit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setChecklistAppointment(appointment)}
                      className="mr-2 inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                      title="Nursing triage & pre-procedure checklist"
                    >
                      <span>📋 Checklist</span>
                    </button>
                    {isDoctor && (
                      <button
                        type="button"
                        onClick={() => setRxAppointment(appointment)}
                        className="mr-2 inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition shadow-2xs"
                        title="Write clinical prescription for this appointment"
                      >
                        <span>℞ Write Rx</span>
                      </button>
                    )}
                    <select
                      aria-label={`Change status for ${appointment.patient?.name || "appointment"}`}
                      className="mr-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-blue-500"
                      disabled={updatingId === appointment._id}
                      onChange={(event) => handleStatusChange(appointment._id, event.target.value)}
                      value={appointment.status}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status] || status}
                        </option>
                      ))}
                    </select>
                    {canDelete && (
                      <button
                        aria-label="Delete appointment"
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-xs text-red-600 hover:bg-red-600 hover:text-white transition shadow-2xs"
                        onClick={() => handleDelete(appointment)}
                        title="Delete appointment"
                        type="button"
                      >
                        🗑
                      </button>
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
              <h2 className="text-xl font-semibold text-slate-800">Book appointment</h2>
              <button
                aria-label="Close form"
                className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <AppointmentForm
              onCancel={() => setIsFormOpen(false)}
              onSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}

      {/* Prescription Generator Modal */}
      {rxAppointment && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto">
            <PrescriptionForm
              initialAppointment={rxAppointment}
              initialPatient={rxAppointment.patient}
              initialDoctor={rxAppointment.doctor}
              onSuccess={(createdRx) => {
                setRxAppointment(null);
                setRefreshKey((k) => k + 1);
                if (createdRx) setViewedRx(createdRx);
              }}
              onCancel={() => setRxAppointment(null)}
            />
          </div>
        </div>
      )}

      {/* Prescription Viewer Modal */}
      {viewedRx && (
        <PrescriptionModal
          prescription={viewedRx}
          onClose={() => setViewedRx(null)}
        />
      )}

      {/* Nursing Triage / Pre-Procedure Checklist Modal */}
      {checklistAppointment && (
        <NursingChecklistModal
          appointment={checklistAppointment}
          onClose={() => setChecklistAppointment(null)}
          onUpdated={() => {
            setRefreshKey((k) => k + 1);
          }}
          onOpenVitals={async (patient) => {
            setVitalsPatient(patient);
            try {
              const res = await getPatientVitals(patient._id);
              setPatientVitalsList(res.vitals || []);
            } catch (err) {
              setPatientVitalsList([]);
            }
          }}
        />
      )}

      {/* Vitals Tracker Modal triggered from Checklist */}
      {vitalsPatient && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
        >
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Pre-Consultation Vitals: {vitalsPatient.name}
                </h3>
                <p className="text-xs text-slate-500">Record BP, Pulse, SpO2, Temperature & Glucose</p>
              </div>
              <button
                type="button"
                onClick={() => setVitalsPatient(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>
            <VitalsTracker
              vitals={patientVitalsList}
              patientId={vitalsPatient._id}
              onVitalsUpdated={async () => {
                const res = await getPatientVitals(vitalsPatient._id);
                setPatientVitalsList(res.vitals || []);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default Appointments;

import { useEffect, useState } from "react";
import AppointmentForm from "../components/AppointmentForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  deleteAppointment,
  getAppointments,
  getDoctors,
  updateAppointmentStatus,
} from "../services/api.js";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

const statusClasses = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function Appointments() {
  const { user } = useAuth();
  const canDelete = ["admin", "receptionist"].includes(user?.role);
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
          <h1 className="text-2xl font-semibold text-slate-800">Appointments</h1>
          <p className="mt-1 text-sm text-slate-600">Book and manage patient appointments.</p>
        </div>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          + Book Appointment
        </button>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-5">
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
                {status}
              </option>
            ))}
          </select>
        </label>
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
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                <tr key={appointment._id} className={appointment.bookedBy === "patient" && appointment.status === "pending" ? "bg-amber-50" : ""}>
                  <td className="px-4 py-3 font-medium">
                    {appointment.patient?.name || "Unknown patient"}
                    {appointment.bookedBy === "patient" && (
                      <span className="ml-2 inline-flex rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Patient-booked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{appointment.doctor?.name || "Unknown doctor"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{appointment.timeSlot}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusClasses[appointment.status]
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="max-w-48 truncate px-4 py-3" title={appointment.reasonForVisit}>
                    {appointment.reasonForVisit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <select
                      aria-label={`Change status for ${appointment.patient?.name || "appointment"}`}
                      className="mr-2 rounded border border-slate-300 px-2 py-1 text-xs"
                      disabled={updatingId === appointment._id}
                      onChange={(event) => handleStatusChange(appointment._id, event.target.value)}
                      value={appointment.status}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {canDelete && (
                      <button
                        aria-label="Delete appointment"
                        className="rounded p-2 text-red-600 hover:bg-red-50"
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
              <h2 className="text-xl font-semibold text-slate-800">Book Appointment</h2>
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
    </section>
  );
}

export default Appointments;

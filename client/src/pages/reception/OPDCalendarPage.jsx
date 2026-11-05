import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAppointments, getDoctors, getDoctorAvailability } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

const STANDARD_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

const STATUS_CONFIG = {
  confirmed: { badge: "confirmed", label: "Confirmed" },
  completed: { badge: "completed", label: "Completed" },
  pending: { badge: "pending", label: "Pending" },
  in_progress: { badge: "in_progress", label: "In Progress" },
  cancelled: { badge: "cancelled", label: "Cancelled" },
  waiting: { badge: "waiting", label: "Waiting" },
};

export default function OPDCalendarPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState("daily");
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await getDoctors();
        const docs = res.doctors || [];
        setDoctors(docs);
        if (docs.length > 0) setSelectedDoctorId(docs[0]._id);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const loadCalendar = async () => {
      setIsLoading(true);
      try {
        const [availRes, appRes] = await Promise.all([
          getDoctorAvailability(selectedDoctorId, selectedDate),
          getAppointments(),
        ]);
        setDoctorAvailability(availRes);
        setAppointments(appRes.appointments || []);
      } catch (err) {
        console.error("Failed to load availability:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCalendar();
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const aDocId = a.doctor?._id || a.doctor;
      const aDate = new Date(a.appointmentDate).toISOString().split("T")[0];
      return aDocId === selectedDoctorId && aDate === selectedDate && a.status !== "cancelled";
    });
  }, [appointments, selectedDoctorId, selectedDate]);

  const availableSlots = useMemo(() => {
    if (!doctorAvailability?.slots) return [];
    return STANDARD_SLOTS.map((slot) => {
      const bookedApp = filteredAppointments.find((a) => a.timeSlot === slot);
      return {
        time: slot,
        isOccupied: Boolean(bookedApp),
        appointment: bookedApp,
      };
    });
  }, [doctorAvailability, filteredAppointments]);

  return (
    <div className="space-y-6 animate-pop-in" style={{ backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      <PageHeader
        title="OPD Appointment Calendar & Doctor Availability"
        subtitle="Visual timetable of doctor working days, occupied OPD slots, open booking availability, and conflict prevention."
        breadcrumbs={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span><span className="text-xs font-bold uppercase tracking-wider text-amber-600">Central Clinic Schedule</span></span>}
        actions={[
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition active:scale-[0.97] touch-target self-start sm:self-auto"
          >
            <span>➕</span>
            <span>Book Specialist Visit</span>
          </Link>,
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Select Doctor / Specialist:</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition duration-150"
          >
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {formatDoctorName(doc.name)} ({doc.department || doc.specialization})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Calendar Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition duration-150"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Calendar View:</label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                viewMode === "daily" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                viewMode === "weekly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {selectedDoctor && (
        <Card title={formatDoctorName(selectedDoctor.name)} subtitle={`${selectedDoctor.specialization} • Department of ${selectedDoctor.department}`}>
          <div className="flex items-center gap-4 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 flex-1">
              <span className="text-lg font-black text-emerald-800">
                {doctorAvailability?.availableSlots ?? 0}
              </span>
              <p className="text-[10px] uppercase font-bold text-emerald-700">Open Slots</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 flex-1">
              <span className="text-lg font-black text-slate-800">
                {filteredAppointments.length}
              </span>
              <p className="text-[10px] uppercase font-bold text-slate-700">Booked</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 flex-1">
              <span className="text-lg font-black text-amber-800">
                {availableSlots.filter(s => !s.isOccupied).length}
              </span>
              <p className="text-[10px] uppercase font-bold text-amber-700">Available</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Fee: ₹{selectedDoctor.consultationFee || 500} • OPD Working Days: {selectedDoctor.workingDays?.join(", ") || "Mon - Fri"}
          </div>
        </Card>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 liquid-glass-card">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
          <span>OPD Slot Availability — {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <div className="flex items-center gap-3 text-xs font-normal text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Booked</span>
          </div>
        </h3>

        {isLoading ? (
          <PageLoader message="Loading slot schedule..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {availableSlots.map((slot) => {
              const isOccupied = slot.isOccupied;
              const statusConfig = isOccupied ? STATUS_CONFIG[slot.appointment?.status] || STATUS_CONFIG.cancelled : null;

              return (
                <div
                  key={slot.time}
                  className={`rounded-xl border p-3.5 transition ${
                    isOccupied
                      ? "border-rose-200 bg-rose-50/60 shadow-xs"
                      : "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-slate-800">{slot.time}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isOccupied ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    ></span>
                  </div>

                  {isOccupied ? (
                    <div className="mt-2 text-left">
                      <p className="text-[11px] font-bold text-rose-900 truncate">
                        {slot.appointment.patient?.name || "Patient"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge status={statusConfig.badge}>
                          {statusConfig.label}
                        </Badge>
                        <Link
                          to={`/appointments?doctor=${selectedDoctorId}&slot=${encodeURIComponent(slot.time)}&date=${selectedDate}`}
                          className="ml-auto inline-block rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-sky-700 transition active:scale-97"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-semibold text-emerald-700">Open Slot</p>
                      <Link
                        to={`/appointments?doctor=${selectedDoctorId}&slot=${encodeURIComponent(slot.time)}&date=${selectedDate}`}
                        className="mt-1.5 inline-block rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition active:scale-97"
                      >
                        Book Now
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAppointments, getDoctors, getDoctorAvailability } from "../../services/api.js";

const STANDARD_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

export default function OPDCalendarPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState("daily"); // 'daily' | 'weekly'
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

  // Appointments for this doctor on selected date
  const filteredAppointments = appointments.filter((a) => {
    const aDocId = a.doctor?._id || a.doctor;
    const aDate = new Date(a.appointmentDate).toISOString().split("T")[0];
    return aDocId === selectedDoctorId && aDate === selectedDate && a.status !== "cancelled";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Central Clinic Schedule</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            OPD Appointment Calendar & Doctor Availability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual timetable of doctor working days, occupied OPD slots, open booking availability, and conflict prevention.
          </p>
        </div>

        <Link
          to="/appointments"
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition self-start sm:self-auto"
        >
          <span>➕</span>
          <span>Book Specialist Visit</span>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200/80">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Select Doctor / Specialist:</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium focus:border-amber-500 focus:outline-none"
          >
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.name} ({doc.department || doc.specialization})
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Calendar View:</label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("daily")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                viewMode === "daily" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                viewMode === "weekly" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Summary Banner */}
      {selectedDoctor && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-xl font-black">
              Dr
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Dr. {selectedDoctor.name}</h2>
              <p className="text-xs text-slate-500">
                {selectedDoctor.specialization} • Department of {selectedDoctor.department}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                Fee: ₹{selectedDoctor.consultationFee || 500} • OPD Working Days: {selectedDoctor.workingDays?.join(", ") || "Mon - Fri"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
              <span className="text-lg font-black text-emerald-800">
                {doctorAvailability?.availableSlots ?? 0}
              </span>
              <p className="text-[10px] uppercase font-bold text-emerald-700">Open Slots</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2">
              <span className="text-lg font-black text-blue-800">
                {filteredAppointments.length}
              </span>
              <p className="text-[10px] uppercase font-bold text-blue-700">Booked</p>
            </div>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
          <span>OPD Slot Availability — {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <div className="flex items-center gap-3 text-xs font-normal text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Booked</span>
          </div>
        </h3>

        {isLoading ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading slot schedule...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STANDARD_SLOTS.map((slot) => {
              const bookedApp = filteredAppointments.find((a) => a.timeSlot === slot);
              const isOccupied = Boolean(bookedApp);

              return (
                <div
                  key={slot}
                  className={`rounded-xl border p-3.5 transition ${
                    isOccupied
                      ? "border-rose-200 bg-rose-50/60 shadow-xs"
                      : "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-slate-800">{slot}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isOccupied ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    ></span>
                  </div>

                  {isOccupied ? (
                    <div className="mt-2 text-left">
                      <p className="text-[11px] font-bold text-rose-900 truncate">
                        {bookedApp.patient?.name || "Patient"}
                      </p>
                      <p className="text-[10px] text-rose-700 capitalize">
                        {bookedApp.status.replace("_", " ")}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-semibold text-emerald-700">Open Slot</p>
                      <Link
                        to={`/appointments?doctor=${selectedDoctorId}&slot=${encodeURIComponent(slot)}&date=${selectedDate}`}
                        className="mt-1.5 inline-block rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition"
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

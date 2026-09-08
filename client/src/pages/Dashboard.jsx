import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  getBillings,
  getDoctors,
  getPatients,
} from "../services/api.js";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function SummaryCard({ label, value, icon, gradient, badge, badgeColor }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      {/* Top subtle accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        </div>
        {/* Metric Icon Badge */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>

      {badge && (
        <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const [patientData, doctorData, appointmentData, pendingBillingData] = await Promise.all([
          getPatients("", 1, 1),
          getDoctors(),
          getAppointments(),
          getBillings({ paymentStatus: "pending" }),
        ]);

        if (isCurrentRequest) {
          setDashboardData({
            totalPatients: patientData.pagination?.totalPatients || 0,
            totalDoctors: doctorData.doctors.length,
            appointments: appointmentData.appointments,
            pendingBills: pendingBillingData.billings.length,
            pendingPatientBookings: appointmentData.appointments.filter(
              (a) => a.status === "pending" && a.bookedBy === "patient"
            ).length,
          });
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load dashboard data.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const { recentAppointments, todayAppointments } = useMemo(() => {
    const appointments = dashboardData?.appointments || [];
    const today = new Date().toISOString().slice(0, 10);

    return {
      recentAppointments: [...appointments]
        .sort((first, second) => new Date(second.appointmentDate) - new Date(first.appointmentDate))
        .slice(0, 6),
      todayAppointments: appointments.filter(
        (appointment) =>
          appointment.appointmentDate &&
          String(appointment.appointmentDate).slice(0, 10) === today
      ),
    };
  }, [dashboardData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
          Synchronizing hospital telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
        <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HERO GRADIENT BANNER ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-800 p-6 sm:p-8 text-white shadow-lg">
        {/* Animated medical pulse background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 500 150" fill="none" preserveAspectRatio="none">
            <path
              d="M0,75 L120,75 L140,25 L160,120 L180,50 L200,85 L220,75 L500,75"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Ambient light glow */}
        <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Clinical Overview</span>
            <span className="opacity-60">•</span>
            <span>24/7 Operations</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hospital Operations Center
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Monitor real-time patient admissions, active medical specialists, upcoming consultations, and clinical invoice settlements.
          </p>
        </div>
      </div>

      {/* ================= SUMMARY STAT METRICS ================= */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* Total Patients */}
        <SummaryCard
          label="Total Patients"
          value={dashboardData.totalPatients}
          gradient="from-blue-600 to-cyan-600"
          badge="Registered records"
          badgeColor="bg-blue-50 text-blue-700"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        {/* Total Doctors */}
        <SummaryCard
          label="Total Doctors"
          value={dashboardData.totalDoctors}
          gradient="from-indigo-600 to-purple-600"
          badge="Active Practitioners"
          badgeColor="bg-indigo-50 text-indigo-700"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        {/* Appointments Today */}
        <SummaryCard
          label="Appointments Today"
          value={todayAppointments.length}
          gradient="from-emerald-500 to-teal-600"
          badge="Scheduled for today"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Pending Bills */}
        <SummaryCard
          label="Pending Bills"
          value={dashboardData.pendingBills}
          gradient="from-amber-500 to-orange-600"
          badge="Awaiting settlement"
          badgeColor="bg-amber-50 text-amber-700"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        {/* Pending Patient Bookings */}
        <SummaryCard
          label="Portal Bookings"
          value={dashboardData.pendingPatientBookings}
          gradient="from-rose-500 to-red-600"
          badge="Needs Confirmation"
          badgeColor="bg-rose-50 text-rose-700"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </div>

      {/* ================= APPOINTMENTS SECTION ================= */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Appointments Table */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-800">Recent Appointments</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Latest {recentAppointments.length}
            </span>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-slate-500">No appointments recorded yet.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 pr-4">Doctor</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {appointment.patient?.name ? appointment.patient.name.charAt(0) : "P"}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {appointment.patient?.name || "Unknown patient"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-600">
                        Dr. {appointment.doctor?.name || "Unknown doctor"}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        {formatDate(appointment.appointmentDate)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            appointment.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : appointment.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                              : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          }`}
                        >
                          {appointment.status || "scheduled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Today's Schedule Card */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-800">Today&apos;s Appointments</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              {todayAppointments.length} Consultations
            </span>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-slate-500">No appointments scheduled for today.</p>
              <p className="text-xs text-slate-400">New patient bookings will appear here automatically.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {todayAppointments.map((appointment) => (
                <li
                  className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                  key={appointment._id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20">
                      {appointment.timeSlot ? appointment.timeSlot.slice(0, 5) : "AM"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{appointment.patient?.name}</p>
                      <p className="text-xs text-slate-500">
                        Consultation with <span className="font-medium text-slate-700">Dr. {appointment.doctor?.name}</span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                    {appointment.timeSlot}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;

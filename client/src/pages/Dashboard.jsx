import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DoctorScheduleModal from "../components/DoctorScheduleModal.jsx";
import PrescriptionForm from "../components/PrescriptionForm.jsx";
import VitalsTracker from "../components/VitalsTracker.jsx";
import NursingChecklistModal from "../components/NursingChecklistModal.jsx";
import {
  cancelMyAppointment,
  getAppointments,
  getBillings,
  getDoctors,
  getMyProfile,
  getMyAppointments,
  getMyBillings,
  getPatients,
  getMyDoctorProfile,
  getPatientVitals,
  updateAppointmentStatus,
  updatePaymentStatus,
  getBeds,
  dischargeBed,
  getRecentVitalsAlerts,
} from "../services/api.js";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function MetricCard({ label, value, icon, gradient, badge, badgeColor }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        </div>
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

/* =========================================================================
   1. ADMIN EXECUTIVE PORTAL DASHBOARD
   ========================================================================= */
function AdminDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [patientData, doctorData, appointmentData, pendingBillingData] = await Promise.all([
          getPatients("", 1, 1),
          getDoctors(),
          getAppointments(),
          getBillings({ paymentStatus: "pending" }),
        ]);

        if (active) {
          setData({
            totalPatients: patientData.pagination?.totalPatients || 0,
            totalDoctors: doctorData.doctors.length,
            appointments: appointmentData.appointments,
            pendingBills: pendingBillingData.billings.length,
            pendingPatientBookings: appointmentData.appointments.filter(
              (a) => a.status === "pending" && a.bookedBy === "patient"
            ).length,
          });
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load admin telemetry.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchAdminData();
    return () => { active = false; };
  }, [refreshKey]);

  const { recentAppointments, todayAppointments } = useMemo(() => {
    const appointments = data?.appointments || [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      recentAppointments: [...appointments]
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
        .slice(0, 5),
      todayAppointments: appointments.filter(
        (a) => a.appointmentDate && String(a.appointmentDate).slice(0, 10) === today
      ),
    };
  }, [data]);

  if (isLoading) return <LoadingSpinner label="Loading Executive Operations..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Admin Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span>Administrator executive command</span>
            <span className="opacity-60">•</span>
            <span>Full system clearance</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hospital Operations & Governance Center
          </h1>
          <p className="mt-2 text-sm text-purple-100/90 leading-relaxed">
            Welcome back, {user?.name}. Oversee clinical specialties, patient admissions, appointment volume, and institutional financial settlements.
          </p>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total patients"
          value={data.totalPatients}
          gradient="from-blue-600 to-cyan-600"
          badge="Registered records"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <MetricCard
          label="Specialist doctors"
          value={data.totalDoctors}
          gradient="from-indigo-600 to-purple-600"
          badge="Active practitioners"
          badgeColor="bg-indigo-50 text-indigo-700"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <MetricCard
          label="Today consultations"
          value={todayAppointments.length}
          gradient="from-emerald-500 to-teal-600"
          badge="Scheduled today"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <MetricCard
          label="Pending invoices"
          value={data.pendingBills}
          gradient="from-amber-500 to-orange-600"
          badge="Awaiting settlement"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
        <MetricCard
          label="Review queue"
          value={data.pendingPatientBookings}
          gradient="from-rose-500 to-red-600"
          badge="Self-booked patients"
          badgeColor="bg-rose-50 text-rose-700"
          icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
      </div>

      {/* Admin Quick Action Hub */}
      <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500"></span>
              Admin operations hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Direct 1-click management of all hospital infrastructure</p>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-500/20">
            Full access
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link to="/patients" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">👥</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Patients</span>
            <span className="text-[10px] text-slate-500">Admit & manage</span>
          </Link>
          <Link to="/doctors" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🩺</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Specialists</span>
            <span className="text-[10px] text-slate-500">Roster & shifts</span>
          </Link>
          <Link to="/appointments" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">📅</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Appointments</span>
            <span className="text-[10px] text-slate-500">Hospital queue</span>
          </Link>
          <Link to="/billing" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">💳</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Invoices</span>
            <span className="text-[10px] text-slate-500">Accounts & cash</span>
          </Link>
          <Link to="/reports" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-purple-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">📊</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Analytics</span>
            <span className="text-[10px] text-slate-500">Financial reports</span>
          </Link>
          <a href="/patient/login" target="_blank" rel="noreferrer" className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-md">
            <span className="text-2xl">🌐</span>
            <span className="mt-1.5 text-xs font-bold text-slate-800">Patient portal</span>
            <span className="text-[10px] text-slate-500">Live preview ↗</span>
          </a>
        </div>
      </section>

      {/* Admin Appointments List */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Recent hospital consultations</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Latest {recentAppointments.length}</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {recentAppointments.map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs ring-1 ring-blue-500/20">
                    {a.patient?.name ? a.patient.name.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{a.patient?.name}</p>
                    <p className="text-xs text-slate-500">Dr. {a.doctor?.name} • {a.doctor?.specialization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">{formatDate(a.appointmentDate)}</span>
                  <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-blue-500/20">{a.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Today&apos;s appointments</h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">{todayAppointments.length} active</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {todayAppointments.map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{a.patient?.name}</p>
                    <p className="text-xs text-slate-500">Dr. {a.doctor?.name}</p>
                  </div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">{a.timeSlot}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================
   2. DOCTOR CLINICAL WORKSPACE PORTAL DASHBOARD
   ========================================================================= */
function DoctorDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [profileData, setProfileData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Modals for clinical workflow
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [rxAppointment, setRxAppointment] = useState(null);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [patientVitalsList, setPatientVitalsList] = useState([]);

  useEffect(() => {
    let active = true;
    const loadDoctorData = async () => {
      setLoading(true);
      setError("");
      try {
        const [meData, aData, pData] = await Promise.all([
          getMyDoctorProfile(),
          getAppointments(),
          getPatients("", 1, 20),
        ]);
        if (active) {
          setProfileData(meData);
          setAppointments(aData.appointments || []);
          setPatients(pData.patients || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load doctor clinical workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDoctorData();
    return () => { active = false; };
  }, [refreshKey]);

  const doctor = profileData?.doctor;
  const stats = profileData?.stats || {
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalAppointments: 0,
    totalPatients: 0,
  };
  const todaySchedule = profileData?.todaySchedule;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayConsultations = appointments.filter(
    (a) => a.appointmentDate && String(a.appointmentDate).slice(0, 10) === todayStr
  );
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const handleMarkComplete = async (id) => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, "completed");
      onTriggerRefresh();
    } catch (err) {
      alert("Error updating status: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenVitals = async (patient) => {
    setVitalsPatient(patient);
    try {
      const res = await getPatientVitals(patient._id);
      setPatientVitalsList(res.vitals || []);
    } catch {
      setPatientVitalsList([]);
    }
  };

  if (loading) return <LoadingSpinner label="Opening Doctor Clinical Workspace..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Doctor Hero & Identity Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl ring-1 ring-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Doctor clinical workspace</span>
              <span className="opacity-60">•</span>
              <span className="text-emerald-300 font-mono">ID: {doctor?._id?.slice(-6).toUpperCase()}</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, Dr. {doctor?.name || user?.name?.replace(/^Dr\.\s*/i, "")}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-emerald-100/90">
              <span className="font-semibold text-emerald-200">
                {doctor?.specialization || "Specialist"}
              </span>
              <span>•</span>
              <span>Department of {doctor?.department || "Medicine"}</span>
              <span>•</span>
              <span className="rounded-md bg-emerald-800/80 px-2 py-0.5 text-xs font-medium">
                {doctor?.yearsOfExperience ?? 5} yrs experience
              </span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">
                Fee: ₹{doctor?.consultationFee ?? 500} / visit
              </span>
            </div>
          </div>

          {/* Quick Actions in Hero */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setScheduleDoctor(doctor)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition hover:bg-emerald-50 hover:shadow-lg"
              type="button"
            >
              <span>📅</span>
              <span>My schedule & leaves</span>
            </button>
            <Link
              to="/prescriptions"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition border border-emerald-400/30"
            >
              <span>℞</span>
              <span>Write prescription</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's consultations"
          value={todayConsultations.length}
          gradient="from-emerald-600 to-teal-600"
          badge="Scheduled for today"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">🩺</span>}
        />
        <MetricCard
          label="In waiting queue"
          value={pendingCount}
          gradient="from-amber-500 to-orange-600"
          badge="Pending consultation"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-2xl">⏳</span>}
        />
        <MetricCard
          label="Completed visits"
          value={completedCount}
          gradient="from-blue-600 to-indigo-600"
          badge="Concluded consultations"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-2xl">✓</span>}
        />
        <MetricCard
          label="Total assigned patients"
          value={stats.totalPatients || patients.length}
          gradient="from-purple-600 to-pink-600"
          badge="Under your clinical care"
          badgeColor="bg-purple-50 text-purple-700"
          icon={<span className="text-2xl">👥</span>}
        />
      </div>

      {/* Today's Shift & Availability Strip */}
      <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-xl ring-1 ring-teal-500/20">
            ⏰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Today's Roster ({new Date().toLocaleDateString("en-IN", { weekday: "long" })})
              </h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                todaySchedule?.isAvailable !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {todaySchedule?.isAvailable !== false ? "● Active consulting shift" : "Off Duty"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {todaySchedule?.shifts?.length
                ? todaySchedule.shifts.map((s) => `${s.startTime} - ${s.endTime} (${s.slotDurationMinutes || 30}m slots)`).join(", ")
                : "Standard hospital shift: 09:00 AM - 05:00 PM"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {doctor?.leaves?.length > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 font-medium">
              🏖️ {doctor.leaves.length} approved leave scheduled
            </span>
          )}
          <button
            onClick={() => setScheduleDoctor(doctor)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            type="button"
          >
            ⚙ Edit weekly slots
          </button>
        </div>
      </div>

      {/* Main Consultation Queue */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">My consultation queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Patients scheduled exclusively for Dr. {doctor?.name || user?.name}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
            {appointments.length} assigned consultations
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <span className="text-4xl">🎉</span>
            <p className="mt-3 text-sm font-semibold text-slate-700">No appointments scheduled for you right now.</p>
            <p className="text-xs text-slate-400 mt-1">New patient bookings assigned to your schedule will appear here immediately.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 hover:bg-slate-50/70 rounded-xl px-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20 flex-shrink-0">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{a.patient?.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                        {a.patient?.age ? `${a.patient.age}y` : ""} {a.patient?.gender}
                      </span>
                      {a.patient?.bloodGroup && (
                        <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold border border-rose-100">
                          {a.patient.bloodGroup}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">Reason:</span> {a.reasonForVisit || "Routine consultation"} • {formatDate(a.appointmentDate)} • <span className="font-mono text-slate-600">{a.patient?.contactNumber || ""}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                    {a.timeSlot}
                  </span>

                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
                    a.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20"
                      : a.status === "confirmed"
                      ? "bg-blue-50 text-blue-700 ring-blue-500/20"
                      : "bg-amber-50 text-amber-700 ring-amber-500/20"
                  }`}>
                    {a.status}
                  </span>

                  {/* Vitals Button */}
                  {a.patient && (
                    <button
                      onClick={() => handleOpenVitals(a.patient)}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                      title="View or record vitals"
                      type="button"
                    >
                      📊 Vitals
                    </button>
                  )}

                  {/* Prescribe Rx Button */}
                  <button
                    onClick={() => setRxAppointment(a)}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                    title="Generate prescription for this patient"
                    type="button"
                  >
                    ℞ Prescribe
                  </button>

                  {/* Complete Visit Button */}
                  {a.status !== "completed" && (
                    <button
                      disabled={updatingId === a._id}
                      onClick={() => handleMarkComplete(a._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs disabled:opacity-50"
                      type="button"
                    >
                      {updatingId === a._id ? "Saving..." : "✓ Conclude"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Weekly Schedule Overview Widget */}
      {doctor?.weeklySchedule && (
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">My weekly availability timetable</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your recurring shift schedule configured in hospital registry</p>
            </div>
            <button
              onClick={() => setScheduleDoctor(doctor)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              type="button"
            >
              Modify schedule →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {doctor.weeklySchedule.map((dayPlan) => (
              <div
                key={dayPlan.day}
                className={`p-3 rounded-xl border text-center transition-all ${
                  dayPlan.isAvailable
                    ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                    : "border-slate-200 bg-slate-50 opacity-60"
                }`}
              >
                <p className="text-xs font-bold text-slate-800">{dayPlan.day.slice(0, 3)}</p>
                <div className="mt-1.5">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dayPlan.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {dayPlan.isAvailable ? "Available" : "Off"}
                  </span>
                </div>
                {dayPlan.isAvailable && dayPlan.shifts?.[0] && (
                  <p className="mt-1.5 text-[11px] font-mono text-slate-600">
                    {dayPlan.shifts[0].startTime.replace(" ", "")} - {dayPlan.shifts[0].endTime.replace(" ", "")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Doctor Schedule Modal */}
      {scheduleDoctor && (
        <DoctorScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setScheduleDoctor(null)}
          onUpdated={() => {
            setScheduleDoctor(null);
            onTriggerRefresh();
          }}
        />
      )}

      {/* Prescription Form Modal directly from Dashboard */}
      {rxAppointment && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <PrescriptionForm
              initialAppointment={rxAppointment}
              initialPatient={rxAppointment.patient}
              initialDoctor={doctor}
              onCancel={() => setRxAppointment(null)}
              onSuccess={() => {
                setRxAppointment(null);
                onTriggerRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {vitalsPatient && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Health Vitals Tracker — {vitalsPatient.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {vitalsPatient.age ? `${vitalsPatient.age}y / ` : ""}{vitalsPatient.gender} • Blood Group: {vitalsPatient.bloodGroup || "—"}
                </p>
              </div>
              <button
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setVitalsPatient(null)}
                type="button"
              >
                ✕
              </button>
            </div>
            <VitalsTracker
              patientId={vitalsPatient._id}
              initialVitals={patientVitalsList}
              onVitalsRecorded={(newV) => {
                setPatientVitalsList((prev) => [newV, ...prev]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. RECEPTIONIST & FRONT DESK ADMISSIONS PORTAL DASHBOARD
   ========================================================================= */
function ReceptionistDashboard({ user, refreshKey, onTriggerRefresh }) {
  const isNurse = user?.role === "nurse";
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadFrontDeskData = async () => {
      setLoading(true);
      try {
        const [pData, aData, bData] = await Promise.all([
          getPatients("", 1, 20),
          getAppointments(),
          getBillings({ paymentStatus: "pending" }),
        ]);
        if (active) {
          setPatients(pData.patients || []);
          setAppointments(aData.appointments || []);
          setBillings(bData.billings || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load front desk data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFrontDeskData();
    return () => { active = false; };
  }, [refreshKey]);

  const handleQuickCashSettlement = async (billingId) => {
    setSettlingId(billingId);
    try {
      await updatePaymentStatus(billingId, { paymentStatus: "paid", paymentMethod: "cash" });
      onTriggerRefresh();
    } catch (err) {
      alert("Payment settlement failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSettlingId(null);
    }
  };

  const handleConfirmAppointment = async (appId) => {
    try {
      await updateAppointmentStatus(appId, "confirmed");
      onTriggerRefresh();
    } catch (err) {
      alert("Failed to confirm: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <LoadingSpinner label={isNurse ? "Opening nursing station & inpatient care records..." : "Opening front desk & admissions counter..."} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Reception / Nurse Hero */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${isNurse ? "from-teal-800 via-cyan-900 to-slate-950" : "from-amber-700 via-orange-700 to-slate-950"} p-6 sm:p-8 text-white shadow-lg`}>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className={`h-2 w-2 rounded-full ${isNurse ? "bg-teal-400" : "bg-amber-400"} animate-pulse`}></span>
            <span>{isNurse ? "Clinical care & inpatient nursing station" : "Hospital admissions & cashier counter"}</span>
            <span className="opacity-60">•</span>
            <span>{isNurse ? "Ward care desk" : "Front office desk"}</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isNurse ? "Nursing station & inpatient care" : "Hospital front desk & admissions"}
          </h1>
          <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
            {isNurse
              ? `Welcome, ${user?.name}. Monitor admitted inpatients, record vital signs, coordinate ward bed allocations, and review diagnostic lab results.`
              : `Welcome, ${user?.name}. Process walk-in admissions, register patient check-ins, manage appointment schedules, and collect counter payments.`}
          </p>
        </div>
      </div>

      {/* Front Desk / Nurse Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={isNurse ? "Inpatients & records" : "Admitted patients"}
          value={patients.length}
          gradient="from-blue-600 to-cyan-600"
          badge="In system"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-2xl">👥</span>}
        />
        <MetricCard
          label="Scheduled consultations"
          value={appointments.length}
          gradient="from-emerald-600 to-teal-600"
          badge="OPD calendar"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">📅</span>}
        />
        <MetricCard
          label={isNurse ? "Unpaid hospital invoices" : "Pending cashier bills"}
          value={billings.length}
          gradient={isNurse ? "from-slate-600 to-slate-700" : "from-amber-500 to-orange-600"}
          badge={isNurse ? "View-only" : "Unsettled invoices"}
          badgeColor={isNurse ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}
          icon={<span className="text-2xl">💳</span>}
        />
        <MetricCard
          label="Online portal bookings"
          value={appointments.filter((a) => a.bookedBy === "patient" && a.status === "pending").length}
          gradient="from-rose-500 to-red-600"
          badge="Need desk confirmation"
          badgeColor="bg-rose-50 text-rose-700"
          icon={<span className="text-2xl">🔔</span>}
        />
      </div>

      {/* Operations Quick Action Hub */}
      <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isNurse ? "bg-teal-500" : "bg-amber-500"}`}></span>
              {isNurse ? "Nursing care quick actions" : "Front office quick operations"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{isNurse ? "Ward admissions, appointments & bed management" : "Admissions, OPD booking, and cashier desks"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/patients" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition">
            <span className="text-2xl">➕</span>
            <div>
              <p className="text-xs font-bold text-slate-800">{isNurse ? "Patient care directory" : "New patient admission"}</p>
              <p className="text-[11px] text-slate-500">{isNurse ? "View patients & record vitals" : "Register new hospital walk-in"}</p>
            </div>
          </Link>
          <Link to="/appointments" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 hover:shadow-md transition">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs font-bold text-slate-800">OPD appointments</p>
              <p className="text-[11px] text-slate-500">View & coordinate visits</p>
            </div>
          </Link>
          {isNurse ? (
            <Link to="/beds" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-400 hover:shadow-md transition">
              <span className="text-2xl">🛏️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Beds & wards</p>
                <p className="text-[11px] text-slate-500">Allocate beds & manage occupancy</p>
              </div>
            </Link>
          ) : (
            <Link to="/billing" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-amber-400 hover:shadow-md transition">
              <span className="text-2xl">🧾</span>
              <div>
                <p className="text-xs font-bold text-slate-800">Cashier & invoicing</p>
                <p className="text-[11px] text-slate-500">Generate bill & collect payment</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Pending Cashier Queue / Billing Monitor */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              {isNurse ? "Unpaid billing records (view-only)" : "Pending billing settlements"}
            </h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">{billings.length} unpaid</span>
          </div>
          {billings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">All bills are settled!</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {billings.slice(0, 5).map((b) => (
                <li key={b._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{b.patient?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500">Inv #{b._id.slice(-6).toUpperCase()} • ₹{b.totalAmount.toFixed(2)}</p>
                  </div>
                  {isNurse ? (
                    <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Unsettled
                    </span>
                  ) : (
                    <button
                      disabled={settlingId === b._id}
                      onClick={() => handleQuickCashSettlement(b._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {settlingId === b._id ? "Saving..." : "Collect cash"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Online Bookings Review Queue */}
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Online patient booking queue</h2>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/20">Needs confirmation</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.filter((a) => a.status === "pending").slice(0, 5).map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">Dr. {a.doctor?.name} • {a.timeSlot}</p>
                </div>
                <button
                  onClick={() => handleConfirmAppointment(a._id)}
                  className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  ✓ Confirm slot
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================
   4. PATIENT CARE PORTAL DASHBOARD (Integrated under /dashboard)
   ========================================================================= */
function PatientPortalDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadPatient = async () => {
      setLoading(true);
      try {
        const [p, a, b] = await Promise.all([
          getMyProfile(),
          getMyAppointments(),
          getMyBillings(),
        ]);
        if (active) {
          setProfile(p.patient);
          setAppointments(a.appointments || []);
          setBillings(b.billings || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load patient health records.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPatient();
    return () => { active = false; };
  }, [refreshKey]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await cancelMyAppointment(id);
      onTriggerRefresh();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your personal health records..." />;
  if (error) return <ErrorMessage message={error} />;

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Patient Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-700 via-blue-700 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Personal health portal</span>
            <span className="opacity-60">•</span>
            <span>Patient self-service</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, {profile?.name || user?.name}
          </h1>
          <p className="mt-2 text-sm text-cyan-100/90 leading-relaxed">
            Manage your medical consultations, schedule visits with hospital specialists, and view or print verified clinical invoices.
          </p>
        </div>
      </div>

      {/* Patient Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Upcoming consultations"
          value={upcoming}
          gradient="from-cyan-600 to-blue-600"
          badge="Scheduled visits"
          badgeColor="bg-cyan-50 text-cyan-700"
          icon={<span className="text-2xl">📅</span>}
        />
        <MetricCard
          label="Completed consultations"
          value={completed}
          gradient="from-emerald-500 to-teal-600"
          badge="Past records"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">✓</span>}
        />
        <MetricCard
          label="Medical receipts"
          value={billings.length}
          gradient="from-amber-500 to-orange-600"
          badge="Invoices generated"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-2xl">🧾</span>}
        />
      </div>

      {/* Health Profile Card */}
      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-800">My health identification</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            Blood group: {profile?.bloodGroup || "O+"}
          </span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-4 text-sm">
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3">
            <dt className="text-xs text-blue-700 font-semibold">ABHA number (Ayushman)</dt>
            <dd className="font-bold text-blue-900 mt-1 font-mono text-xs">{profile?.abhaId || "14-8891-2345-6789"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Registered email</dt>
            <dd className="font-semibold text-slate-800 mt-1 truncate">{profile?.email || user?.email}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Contact number</dt>
            <dd className="font-semibold text-slate-800 mt-1">+91 {profile?.contactNumber || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Age / gender</dt>
            <dd className="font-semibold text-slate-800 mt-1">{profile?.age || "—"} yrs / {profile?.gender || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Scheduled Appointments List */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">My scheduled consultations</h2>
          <Link
            to="/patient/appointments/book"
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            + Book new appointment
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">You have no upcoming consultations scheduled.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 font-bold text-xs ring-1 ring-cyan-500/20">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Dr. {a.doctor?.name}</p>
                    <p className="text-xs text-slate-500">Consultation with {a.doctor?.specialization} • {formatDate(a.appointmentDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">{a.timeSlot}</span>
                  <span className="rounded-full bg-cyan-50 text-cyan-700 px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-cyan-500/20">{a.status}</span>
                  {["pending", "confirmed"].includes(a.status) && (
                    <button
                      disabled={cancellingId === a._id}
                      onClick={() => handleCancel(a._id)}
                      className="rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                    >
                      {cancellingId === a._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   5. NURSE & INPATIENT CLINICAL STATION DASHBOARD
   ========================================================================= */
function NurseDashboard({ user, refreshKey, onTriggerRefresh }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [beds, setBeds] = useState([]);
  const [vitalsAlerts, setVitalsAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("rounds"); // "rounds" | "triage" | "alerts"
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [patientVitalsList, setPatientVitalsList] = useState([]);
  const [checklistAppointment, setChecklistAppointment] = useState(null);
  const [dischargingBedId, setDischargingBedId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const loadNurseData = async () => {
      setLoading(true);
      try {
        const [pData, aData, bData, vAlerts] = await Promise.all([
          getPatients("", 1, 50),
          getAppointments(),
          getBeds(),
          getRecentVitalsAlerts().catch(() => ({ alerts: [] })),
        ]);
        if (active) {
          setPatients(pData.patients || []);
          setAppointments(aData.appointments || []);
          setBeds(bData.beds || []);
          setVitalsAlerts(vAlerts.alerts || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load nursing station data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadNurseData();
    return () => { active = false; };
  }, [refreshKey]);

  const occupiedBeds = useMemo(() => {
    return beds.filter((b) => b.status === "occupied" && b.currentPatient);
  }, [beds]);

  const availableBeds = useMemo(() => {
    return beds.filter((b) => b.status === "available");
  }, [beds]);

  const triageQueue = useMemo(() => {
    return appointments.filter(
      (a) => a.status === "pending" || a.status === "confirmed" || a.status === "checked_in" || a.status === "in_consultation"
    );
  }, [appointments]);

  const handleQuickCheckIn = async (appId) => {
    try {
      await updateAppointmentStatus(appId, "checked_in");
      setActionSuccess("Patient marked as checked in (waiting in lobby).");
      onTriggerRefresh();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      alert("Failed to check in: " + (err.response?.data?.message || err.message));
    }
  };

  const handleQuickCallIn = async (appId) => {
    try {
      await updateAppointmentStatus(appId, "in_consultation");
      setActionSuccess("Patient called into doctor's consultation room.");
      onTriggerRefresh();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDischargeBed = async (bedId) => {
    if (!window.confirm("Confirm patient discharge and mark bed for sanitary turnover?")) return;
    setDischargingBedId(bedId);
    try {
      await dischargeBed(bedId, { dischargeNotes: "Discharged by Floor Nurse upon physician approval" });
      setActionSuccess("Patient discharged & bed released successfully.");
      onTriggerRefresh();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      alert("Discharge failed: " + (err.response?.data?.message || err.message));
    } finally {
      setDischargingBedId(null);
    }
  };

  const handleOpenVitals = async (patient) => {
    setVitalsPatient(patient);
    try {
      const res = await getPatientVitals(patient._id);
      setPatientVitalsList(res.vitals || []);
    } catch (err) {
      setPatientVitalsList([]);
    }
  };

  if (loading) return <LoadingSpinner label="Opening nursing station, ward beds & clinical records..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Nurse Clinical Station Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-cyan-900 to-slate-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Clinical Inpatient & Floor Care Desk</span>
            <span className="opacity-60">•</span>
            <span>On-Duty Shift</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Nursing Station & Inpatient Floor Care
          </h1>
          <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
            Welcome, {user?.name}. Monitor inpatient beds, review critical vital alerts, manage waiting room triage, and verify medication schedules.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
          <span>✅ {actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Admitted Inpatients"
          value={occupiedBeds.length}
          gradient="from-teal-600 to-cyan-600"
          badge="Bedside care"
          badgeColor="bg-teal-50 text-teal-700"
          icon={<span className="text-2xl">🛏️</span>}
        />
        <MetricCard
          label="Available Ward Beds"
          value={`${availableBeds.length}/${beds.length}`}
          gradient="from-emerald-600 to-teal-600"
          badge="Ready for admit"
          badgeColor="bg-emerald-50 text-emerald-700"
          icon={<span className="text-2xl">🏥</span>}
        />
        <MetricCard
          label="OPD Triage Queue"
          value={triageQueue.length}
          gradient="from-blue-600 to-indigo-600"
          badge="Scheduled today"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-2xl">📋</span>}
        />
        <MetricCard
          label="Critical Vitals Alerts"
          value={vitalsAlerts.length}
          gradient={vitalsAlerts.length > 0 ? "from-rose-500 to-red-600" : "from-slate-600 to-slate-700"}
          badge={vitalsAlerts.length > 0 ? "Attention needed" : "All stable"}
          badgeColor={vitalsAlerts.length > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}
          icon={<span className="text-2xl">🚨</span>}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("rounds")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === "rounds"
              ? "border-teal-600 text-teal-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🛏️ Inpatient Bedside Rounds</span>
          <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 text-[10px]">
            {occupiedBeds.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("triage")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === "triage"
              ? "border-blue-600 text-blue-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📋 OPD Triage & Waiting Queue</span>
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px]">
            {triageQueue.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === "alerts"
              ? "border-rose-600 text-rose-700 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🚨 Critical Vitals Deterioration Monitor</span>
          <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px]">
            {vitalsAlerts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: INPATIENT BEDSIDE ROUNDS */}
      {activeTab === "rounds" && (
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
                Floor Rounds & Inpatient Care Tracker
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check bedside vitals, track patient comfort, and process discharge releases.
              </p>
            </div>
            <Link
              to="/beds"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition shadow-2xs"
            >
              Manage All Beds & Wards →
            </Link>
          </div>

          {occupiedBeds.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">🛏️</span>
              No inpatients currently admitted to ward beds.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Bed & Ward</th>
                    <th className="py-3 px-3">Admitted Patient</th>
                    <th className="py-3 px-3">Age / Gender</th>
                    <th className="py-3 px-3">Admit Date</th>
                    <th className="py-3 px-3 text-right">Floor Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {occupiedBeds.map((bed) => {
                    const patient = bed.currentPatient || {};
                    return (
                      <tr key={bed._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-teal-800 text-xs bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            {bed.bedNumber}
                          </span>
                          <span className="ml-2 text-slate-700 font-semibold">{bed.ward}</span>
                          <span className="block text-[11px] text-slate-400 capitalize">{bed.roomType}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm">{patient.name || "Patient"}</div>
                          <div className="text-[11px] text-slate-500">Ph: {patient.contactNumber || "—"}</div>
                        </td>

                        <td className="py-3.5 px-3 font-medium text-slate-700">
                          {patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                          {bed.admissionDate ? new Date(bed.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>

                        <td className="py-3.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenVitals(patient)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition shadow-2xs"
                            title="Record fresh bedside vitals"
                          >
                            📊 Bedside Vitals
                          </button>

                          <button
                            type="button"
                            disabled={dischargingBedId === bed._id}
                            onClick={() => handleDischargeBed(bed._id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition shadow-2xs disabled:opacity-50"
                            title="Discharge patient upon physician approval"
                          >
                            {dischargingBedId === bed._id ? "Releasing..." : "Discharge"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: OPD TRIAGE & WAITING QUEUE */}
      {activeTab === "triage" && (
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                OPD Waiting Room Triage & Dispatcher
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check in patients, verify preparation checklists, and call patients into physician chambers.
              </p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition shadow-2xs"
            >
              View Full OPD Calendar →
            </Link>
          </div>

          {triageQueue.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📋</span>
              No appointments waiting in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Time & Date</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Consulting Doctor</th>
                    <th className="py-3 px-3">Queue Status</th>
                    <th className="py-3 px-3 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {triageQueue.map((apt) => {
                    const patient = apt.patient || {};
                    const doctor = apt.doctor || {};
                    return (
                      <tr key={apt._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-blue-800 text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {apt.timeSlot}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900 text-sm">{patient.name || "Patient"}</div>
                          <div className="text-[11px] text-slate-500">
                            {patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"} • {apt.reasonForVisit}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800">Dr. {doctor.name || "Doctor"}</div>
                          <div className="text-[11px] text-slate-500">{doctor.specialization || "Consultant"}</div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${
                              apt.status === "in_consultation"
                                ? "bg-purple-50 text-purple-700 ring-purple-500/20"
                                : apt.status === "checked_in"
                                ? "bg-teal-50 text-teal-700 ring-teal-500/20"
                                : apt.status === "confirmed"
                                ? "bg-blue-50 text-blue-700 ring-blue-500/20"
                                : "bg-amber-50 text-amber-700 ring-amber-500/20"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full mr-1 bg-current"></span>
                            {apt.status === "checked_in" ? "Checked In (Waiting)" : apt.status === "in_consultation" ? "In Consultation" : apt.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setChecklistAppointment(apt)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                            title="Pre-procedure clinical checklist"
                          >
                            📋 Checklist
                          </button>

                          {apt.status !== "checked_in" && apt.status !== "in_consultation" && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckIn(apt._id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition shadow-2xs"
                            >
                              ✓ Check In
                            </button>
                          )}

                          {apt.status === "checked_in" && (
                            <button
                              type="button"
                              onClick={() => handleQuickCallIn(apt._id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow-2xs"
                            >
                              Call In →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CRITICAL VITALS ALERT MONITOR */}
      {activeTab === "alerts" && (
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                Critical Vitals Deterioration Monitor
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated clinical detection for high blood pressure, desaturation (SpO2 &lt; 92%), fever, and acute hyper/hypoglycemia.
              </p>
            </div>
            <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-bold">
              {vitalsAlerts.length} Active Triggers
            </span>
          </div>

          {vitalsAlerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center text-xs text-emerald-800">
              <span className="text-3xl block mb-2">💚</span>
              <strong>All patient vitals are within normal clinical thresholds.</strong>
              <p className="mt-1 text-emerald-600">No acute vital deterioration triggers detected across hospital wards.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vitalsAlerts.map((alertItem) => {
                const patient = alertItem.patient || {};
                return (
                  <div
                    key={alertItem._id}
                    className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{patient.name || "Patient"}</span>
                        <span className="text-xs text-slate-500">
                          ({patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"})
                        </span>
                        {patient.isAdmitted && (
                          <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                            Inpatient Ward
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
                        {alertItem.spo2 && alertItem.spo2 <= 92 && (
                          <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5">
                            Low SpO2: {alertItem.spo2}%
                          </span>
                        )}
                        {alertItem.bloodPressureSys && alertItem.bloodPressureSys >= 150 && (
                          <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5">
                            High BP: {alertItem.bloodPressureSys}/{alertItem.bloodPressureDia || "—"} mmHg
                          </span>
                        )}
                        {alertItem.bloodSugar && alertItem.bloodSugar >= 220 && (
                          <span className="rounded-md bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5">
                            Elevated Sugar: {alertItem.bloodSugar} mg/dL
                          </span>
                        )}
                        {alertItem.temperature && alertItem.temperature >= 102 && (
                          <span className="rounded-md bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5">
                            High Fever: {alertItem.temperature} °F
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-0.5">
                        Recorded at {new Date(alertItem.recordedAt || alertItem.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {alertItem.recorderName && ` by ${alertItem.recorderName}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenVitals(patient)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                      >
                        📊 View History
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`🚨 Physician notification dispatched for patient ${patient.name}. On-call doctor notified.`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition shadow-2xs"
                      >
                        🚨 Alert Attending Doctor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Bedside Vitals Logger Modal */}
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
                  Record Bedside Vitals: {vitalsPatient.name}
                </h3>
                <p className="text-xs text-slate-500">Record BP, Pulse, SpO2, Temperature & Blood Glucose</p>
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
                onTriggerRefresh();
              }}
            />
          </div>
        </div>
      )}

      {/* Triage / Pre-Procedure Checklist Modal */}
      {checklistAppointment && (
        <NursingChecklistModal
          appointment={checklistAppointment}
          onClose={() => setChecklistAppointment(null)}
          onUpdated={() => {
            onTriggerRefresh();
          }}
          onOpenVitals={handleOpenVitals}
        />
      )}
    </div>
  );
}

/* =========================================================================
   MAIN DASHBOARD ROUTER: Renders based on role
   ========================================================================= */
function Dashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTriggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const role = user?.role || "admin";

  if (role === "doctor") {
    return <DoctorDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "nurse") {
    return <NurseDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "receptionist") {
    return <ReceptionistDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  if (role === "patient") {
    return <PatientPortalDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
  }

  // Default to Admin Executive Portal
  return <AdminDashboard user={user} refreshKey={refreshKey} onTriggerRefresh={handleTriggerRefresh} />;
}

function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{label}</p>
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
      <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default Dashboard;

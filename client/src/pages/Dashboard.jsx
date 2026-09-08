import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  cancelMyAppointment,
  getAppointments,
  getBillings,
  getDoctors,
  getMyProfile,
  getMyAppointments,
  getMyBillings,
  getPatients,
  updateAppointmentStatus,
  updatePaymentStatus,
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
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    const loadDoctorData = async () => {
      setLoading(true);
      try {
        const [aData, pData] = await Promise.all([
          getAppointments(),
          getPatients("", 1, 20),
        ]);
        if (active) {
          setAppointments(aData.appointments || []);
          setPatients(pData.patients || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load clinical workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDoctorData();
    return () => { active = false; };
  }, [refreshKey]);

  // Filter appointments for this doctor (or all if name doesn't match seed doctor)
  const myAppointments = useMemo(() => {
    const docName = user?.name ? user.name.replace(/^Dr\.\s*/i, "").toLowerCase() : "";
    const matched = appointments.filter((a) => {
      const aDocName = (a.doctor?.name || "").toLowerCase();
      return docName ? aDocName.includes(docName) : true;
    });
    return matched.length > 0 ? matched : appointments;
  }, [appointments, user]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayConsultations = myAppointments.filter(
    (a) => a.appointmentDate && String(a.appointmentDate).slice(0, 10) === todayStr
  );
  const pendingCount = myAppointments.filter((a) => a.status === "pending").length;
  const completedCount = myAppointments.filter((a) => a.status === "completed").length;

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

  if (loading) return <LoadingSpinner label="Opening Doctor Clinical Workspace..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Doctor Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Doctor clinical workspace</span>
            <span className="opacity-60">•</span>
            <span>Active consulting shift</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, Dr. {user?.name?.replace(/^Dr\.\s*/i, "")}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Your patient consultation queue for today is active. Review medical histories, examine symptoms, and conclude clinical visits.
          </p>
        </div>
      </div>

      {/* Doctor Metrics */}
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
          label="Awaiting confirmation"
          value={pendingCount}
          gradient="from-amber-500 to-orange-600"
          badge="Patient bookings"
          badgeColor="bg-amber-50 text-amber-700"
          icon={<span className="text-2xl">⏳</span>}
        />
        <MetricCard
          label="Completed visits"
          value={completedCount}
          gradient="from-blue-600 to-indigo-600"
          badge="Concluded cases"
          badgeColor="bg-blue-50 text-blue-700"
          icon={<span className="text-2xl">✓</span>}
        />
        <MetricCard
          label="Total clinical queue"
          value={myAppointments.length}
          gradient="from-purple-600 to-pink-600"
          badge="All scheduled"
          badgeColor="bg-purple-50 text-purple-700"
          icon={<span className="text-2xl">📋</span>}
        />
      </div>

      {/* Doctor Today's Patient Queue with Action */}
      <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">My consultation queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Patients assigned for your review</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
            {myAppointments.length} assigned cases
          </span>
        </div>

        {myAppointments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No appointments scheduled for you right now.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {myAppointments.map((a) => (
              <li key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20 flex-shrink-0">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">{a.patient?.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">{a.patient?.age ? `${a.patient.age}y` : ""} {a.patient?.gender}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">Reason:</span> {a.reasonForVisit || "Routine consultation"} • {formatDate(a.appointmentDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">{a.timeSlot}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
                    a.status === "completed" ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20" : "bg-blue-50 text-blue-700 ring-blue-500/20"
                  }`}>
                    {a.status}
                  </span>

                  {a.status !== "completed" && (
                    <button
                      disabled={updatingId === a._id}
                      onClick={() => handleMarkComplete(a._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs disabled:opacity-50"
                    >
                      {updatingId === a._id ? "Saving..." : "✓ Complete visit"}
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
   3. RECEPTIONIST & FRONT DESK ADMISSIONS PORTAL DASHBOARD
   ========================================================================= */
function ReceptionistDashboard({ user, refreshKey, onTriggerRefresh }) {
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

  if (loading) return <LoadingSpinner label="Opening front desk & admissions counter..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Reception Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 via-orange-700 to-slate-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/25">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Hospital admissions & cashier counter</span>
            <span className="opacity-60">•</span>
            <span>Front office desk</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hospital front desk & admissions
          </h1>
          <p className="mt-2 text-sm text-amber-100/90 leading-relaxed">
            Welcome, {user?.name}. Process walk-in admissions, register patient check-ins, manage appointment schedules, and collect counter payments.
          </p>
        </div>
      </div>

      {/* Front Desk Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Admitted patients"
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
          label="Pending cashier bills"
          value={billings.length}
          gradient="from-amber-500 to-orange-600"
          badge="Unsettled invoices"
          badgeColor="bg-amber-50 text-amber-700"
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

      {/* Front Desk Quick Action Hub */}
      <section className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
              Front office quick operations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Admissions, OPD booking, and cashier desks</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/patients" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 hover:shadow-md transition">
            <span className="text-2xl">➕</span>
            <div>
              <p className="text-xs font-bold text-slate-800">New patient admission</p>
              <p className="text-[11px] text-slate-500">Register new hospital walk-in</p>
            </div>
          </Link>
          <Link to="/appointments" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 hover:shadow-md transition">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs font-bold text-slate-800">Book OPD appointment</p>
              <p className="text-[11px] text-slate-500">Schedule specialist consultation</p>
            </div>
          </Link>
          <Link to="/billing" className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-amber-400 hover:shadow-md transition">
            <span className="text-2xl">🧾</span>
            <div>
              <p className="text-xs font-bold text-slate-800">Cashier & invoicing</p>
              <p className="text-[11px] text-slate-500">Generate bill & collect payment</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Pending Cashier Queue with 1-click Cash Settlement */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Pending billing settlements</h2>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">{billings.length} unpaid</span>
          </div>
          {billings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">All counter bills are settled!</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {billings.slice(0, 5).map((b) => (
                <li key={b._id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{b.patient?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500">Inv #{b._id.slice(-6).toUpperCase()} • ₹{b.totalAmount.toFixed(2)}</p>
                  </div>
                  <button
                    disabled={settlingId === b._id}
                    onClick={() => handleQuickCashSettlement(b._id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {settlingId === b._id ? "Saving..." : "Collect cash"}
                  </button>
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

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPatientDashboardSummary } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

function PatientDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getPatientDashboardSummary();
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load dashboard summary");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
        <div className="inline-block h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
        <p className="mt-3 text-sm font-semibold text-slate-600">Loading your Health Hub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-sm font-semibold text-red-700 shadow-xs">
        {error}
      </div>
    );
  }

  const { profile, stats, nextAppointment, activePrescription, latestLabReport, activeBedStay, alerts, upcomingDiagnostics } = data || {};

  return (
    <section className="space-y-6">
      {/* ================= PATIENT HEALTH IDENTITY WELCOME BANNER ================= */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-700 text-2xl sm:text-3xl font-black text-white shadow-lg flex-shrink-0">
              {profile?.name ? profile.name.charAt(0) : "P"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-500/25 px-3 py-0.5 text-xs font-bold text-teal-300 ring-1 ring-teal-400/30 uppercase tracking-wider">
                  Ayushman Bharat ABDM
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight mt-1">
                Welcome, {profile?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                ABHA ID: <strong className="font-mono text-white">{profile?.abhaId || "14-8891-2345-6789"}</strong> • Hospital UHID: <span className="font-mono text-cyan-300">NC-{profile?._id?.toString().slice(-6).toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:self-center border-t lg:border-t-0 lg:border-l border-slate-700/80 pt-4 lg:pt-0 lg:pl-6 text-xs">
            <div className="rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-400">Age / Gender</p>
              <p className="font-extrabold text-sm text-white mt-0.5">{profile?.age} Yrs / {profile?.gender}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-400">Blood Group</p>
              <p className="font-extrabold text-sm text-rose-300 mt-0.5">{profile?.bloodGroup || "—"}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-xs border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-400">Primary Contact</p>
              <p className="font-semibold text-xs text-white mt-0.5">+91 {profile?.contactNumber || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE CLINICAL ALERTS / INPATIENT STAY ================= */}
      {activeBedStay && (
        <div className="rounded-2xl bg-teal-50 border-2 border-teal-300 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white text-2xl font-black shadow-xs flex-shrink-0">
              🛏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-200 text-teal-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Active Inpatient Stay
                </span>
                <span className="font-mono text-xs font-bold text-teal-950">
                  Bed #{activeBedStay.bedNumber} ({activeBedStay.ward})
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                Reason: {activeBedStay.admissionReason || "Medical Observation"} • Attending: {formatDoctorName(activeBedStay.attendingDoctor?.name, "Consultant")}
              </p>
            </div>
          </div>
          <Link
            to="/patient/admissions"
            className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition shadow-2xs self-start sm:self-auto flex-shrink-0"
          >
            Ward Details →
          </Link>
        </div>
      )}

      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, aIdx) => (
            <div
              key={aIdx}
              className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-900 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
                <span>{alert.message || alert}</span>
              </div>
              {alert.link && (
                <Link to={alert.link} className="font-bold underline text-amber-950 hover:text-amber-700">
                  Take Action →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= 6 INTERACTIVE KPI STAT CARDS ================= */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Upcoming Appointments */}
        <div
          onClick={() => navigate("/patient/appointments")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Visits</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              📅
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats?.upcomingAppointments || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Scheduled visits</p>
          </div>
        </div>

        {/* Card 2: Active Prescriptions */}
        <div
          onClick={() => navigate("/patient/medicines")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Active Medicines</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              💊
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats?.activePrescriptions || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Daily dosages</p>
          </div>
        </div>

        {/* Card 3: Lab Reports */}
        <div
          onClick={() => navigate("/patient/lab-reports")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Lab Reports</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              🔬
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats?.labReportsCount || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Verified reports</p>
          </div>
        </div>

        {/* Card 4: Invoices & Receipts */}
        <div
          onClick={() => navigate("/patient/billings")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Bills</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              🧾
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats?.pendingBills || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">₹{stats?.pendingAmount?.toFixed(2) || "0.00"} due</p>
          </div>
        </div>

        {/* Card 5: Admissions */}
        <div
          onClick={() => navigate("/patient/admissions")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Inpatient Stays</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              🛏️
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{activeBedStay ? "1 Active" : "0 Active"}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Bed stays</p>
          </div>
        </div>

        {/* Card 6: Completed Consultations */}
        <div
          onClick={() => navigate("/patient/consultations")}
          className="group cursor-pointer rounded-2xl liquid-glass-card p-3.5 sm:p-5 flex flex-col justify-between active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Past Visits</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl liquid-glass-subtle text-xs sm:text-sm shrink-0">
              🩺
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats?.completedConsultations || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Summaries</p>
          </div>
        </div>
      </div>

      {/* ================= NEXT UPCOMING APPOINTMENT HIGHLIGHT ================= */}
      {nextAppointment ? (
        <div className="rounded-3xl liquid-glass-elevated p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-800 text-xl shadow-2xs flex-shrink-0">
                🩺
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 text-white px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                    Next Consultation
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold capitalize">
                    {nextAppointment.status}
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-bold uppercase">
                    {nextAppointment.appointmentType || "In-person"}
                  </span>
                </div>

                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {formatDoctorName(nextAppointment.doctor?.name, "Consultant")}
                </h2>
                <p className="text-xs font-semibold text-blue-700">
                  {nextAppointment.doctor?.specialization || "General Physician"} • {nextAppointment.doctor?.department || "OPD Department"}
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  Date: <strong className="text-slate-900 font-mono">
                    {new Date(nextAppointment.appointmentDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong> • Time: <strong className="text-slate-900 font-mono">{nextAppointment.timeSlot}</strong>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 self-start sm:self-auto md:self-center">
              <Link
                to="/patient/appointments"
                className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs text-center"
              >
                Reschedule / Cancel
              </Link>
              <Link
                to="/patient/appointments"
                className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs text-center"
              >
                View Visit Pass →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm font-bold text-slate-800">You don't have any upcoming consultations scheduled.</p>
          <p className="text-xs text-slate-500 mt-1">Book an appointment with our specialist physicians anytime.</p>
          <div className="mt-3">
            <Link
              to="/patient/appointments/book"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              📅 Book Specialist Visit
            </Link>
          </div>
        </div>
      )}

      {/* ================= UPCOMING DIAGNOSTIC PROCEDURES & SCANS ================= */}
      {upcomingDiagnostics && upcomingDiagnostics.length > 0 && (
        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50/70 via-sky-50/50 to-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-sm">
                🔬
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Upcoming Diagnostic Procedures & Tests ({upcomingDiagnostics.length})
                </h3>
                <p className="text-xs text-slate-500">Scheduled pathology investigations & radiology imaging studies</p>
              </div>
            </div>
            <Link
              to="/patient/lab-reports"
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 hover:underline"
            >
              Diagnostic History →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingDiagnostics.map((dx) => (
              <div
                key={dx._id}
                className="rounded-2xl border border-cyan-200/80 bg-white p-4 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-extrabold text-sm text-slate-900 leading-snug">{dx.testName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                      dx.status === "Patient Ready"
                        ? "bg-emerald-100 text-emerald-800"
                        : dx.status === "Scheduled"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {dx.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong className="text-cyan-700 font-semibold">{dx.modality || dx.diagnosticDepartment}</strong> • {dx.orderNumber}
                  </p>

                  <div className="mt-2 text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p>
                      📅 <strong className="font-mono text-slate-800">
                        {dx.scheduledDate ? new Date(dx.scheduledDate).toLocaleDateString() : "Pending Scheduling"}
                      </strong> {dx.scheduledTimeSlot ? `at ${dx.scheduledTimeSlot}` : ""}
                    </p>
                    <p>
                      📍 Room: <strong className="text-slate-800">{dx.assignedRoom || "Central Diagnostic Dept"}</strong>
                    </p>
                  </div>
                </div>

                {dx.preparationInstructions && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-900">
                    <span className="font-bold block text-[10px] uppercase text-amber-700">⚠️ Prep Instructions:</span>
                    <p className="line-clamp-2">{dx.preparationInstructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= QUICK ACTION SHORTCUTS ================= */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Quick Actions & Self-Service
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/patient/appointments/book"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-blue-50/60 hover:border-blue-200 transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold group-hover:scale-105 transition-transform">
              ➕
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Book Doctor Visit</h4>
              <p className="text-[11px] text-slate-500">Choose specialist & slot</p>
            </div>
          </Link>

          <Link
            to="/patient/vitals"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-rose-50/60 hover:border-rose-200 transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold group-hover:scale-105 transition-transform">
              ❤️
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700">Log Today's Vitals</h4>
              <p className="text-[11px] text-slate-500">BP, pulse, SpO2 & sugar</p>
            </div>
          </Link>

          <Link
            to="/patient/lab-reports"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-purple-50/60 hover:border-purple-200 transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold group-hover:scale-105 transition-transform">
              🔬
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Lab Diagnostic Reports</h4>
              <p className="text-[11px] text-slate-500">Download pathology PDF</p>
            </div>
          </Link>

          <Link
            to="/patient/billings"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 hover:bg-emerald-50/60 hover:border-emerald-200 transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold group-hover:scale-105 transition-transform">
              💳
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Pay Outstanding Bills</h4>
              <p className="text-[11px] text-slate-500">Instant UPI & card receipt</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ================= DUAL RECENT CLINICAL CARDS ================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Latest Prescription */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>💊</span> Latest Digital Prescription
              </h3>
              <Link to="/patient/prescriptions" className="text-xs font-bold text-teal-700 hover:underline">
                View All →
              </Link>
            </div>

            {activePrescription ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                  <div>
                    <span className="font-semibold text-slate-800">{formatDoctorName(activePrescription.doctor?.name, "Consultant")}</span>
                    <p className="text-[11px] text-slate-500">{activePrescription.doctor?.specialization}</p>
                  </div>
                  <span className="font-mono text-slate-500">
                    {new Date(activePrescription.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Prescribed Medicines ({activePrescription.medicines?.length || 0}):
                  </p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {activePrescription.medicines?.slice(0, 3).map((m, mIdx) => (
                      <div key={mIdx} className="p-2.5 bg-white flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800">{m.name}</strong>
                          <span className="text-slate-500 ml-1.5 font-semibold text-[11px]">({m.dosage})</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 italic">No recent prescriptions on record.</p>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">ABDM Digital Rx standard</span>
            <Link
              to="/patient/medicines"
              className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
            >
              Dosage Guide →
            </Link>
          </div>
        </div>

        {/* Right: Latest Lab Report */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🔬</span> Latest Diagnostic Test
              </h3>
              <Link to="/patient/lab-reports" className="text-xs font-bold text-purple-700 hover:underline">
                View All →
              </Link>
            </div>

            {latestLabReport ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{latestLabReport.testName}</h4>
                    <p className="text-[11px] text-slate-500">Ordered by {formatDoctorName(latestLabReport.doctor?.name, "Consultant")}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      latestLabReport.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {latestLabReport.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    Sample Date:{" "}
                    <strong className="text-slate-800 font-mono">
                      {new Date(latestLabReport.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                  {latestLabReport.resultNotes && (
                    <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                      <span className="font-semibold text-slate-800">Findings:</span> {latestLabReport.resultNotes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 italic">No lab diagnostics recorded yet.</p>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">NABL Accredited Pathology</span>
            <Link
              to="/patient/lab-reports"
              className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-2xs"
            >
              Report Details →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboard;

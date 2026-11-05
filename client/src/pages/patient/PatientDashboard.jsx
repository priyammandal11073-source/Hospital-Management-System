import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPatientDashboardSummary } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

function MetricCard({ label, value, sub, badge, icon, onClick, valueColor = "text-slate-900" }) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl liquid-glass-card p-4 sm:p-5 transition active:scale-[0.98] flex flex-col justify-between h-full min-h-[136px] border border-slate-200/80 bg-white/80 shadow-2xs ${
        onClick ? "cursor-pointer hover:border-slate-300" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate" title={label}>
            {label}
          </p>
          <p className={`mt-1 text-2xl sm:text-3xl font-bold tracking-tight truncate tabular-nums ${valueColor}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl liquid-glass-subtle text-slate-700 shadow-2xs">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100/80 text-[11px] text-slate-500">
        <span className="truncate">{sub || "Operational status"}</span>
        {badge && (
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2 py-0.5 text-[9px] font-semibold text-slate-700 shrink-0">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

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
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 liquid-glass-card p-16 text-center shadow-2xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading your Health Hub...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200/80 p-5 text-xs font-bold text-rose-800 shadow-2xs">
        {error}
      </div>
    );
  }

  const { profile, stats, nextAppointment, activePrescription, latestLabReport, activeBedStay, alerts, upcomingDiagnostics } = data || {};

  return (
    <section className="space-y-6">
      {/* ================= PATIENT HEALTH IDENTITY WELCOME BANNER ================= */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 liquid-glass-card p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-900 font-extrabold text-xl shadow-2xs border border-slate-200/80 flex-shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-teal-800 bg-teal-50/70 border border-teal-200/60 uppercase tracking-wider">
                  Ayushman Bharat ABDM
                </span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display mt-1">
                Welcome, {profile?.name || "Patient"}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>ABHA ID: <strong className="font-mono text-slate-800 font-medium">{profile?.abhaId || "14-8891-2345-6789"}</strong></span>
                <span>•</span>
                <span>Hospital UHID: <span className="font-mono text-teal-800 font-semibold">NC-{profile?._id?.toString().slice(-6).toUpperCase()}</span></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:self-center border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-3.5 lg:pt-0 lg:pl-5 text-xs">
            <div className="rounded-xl liquid-glass-subtle px-3 py-2 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Age / Gender</p>
              <p className="font-bold text-xs text-slate-800 mt-0.5">{profile?.age ? `${profile.age} Yrs` : "—"} / {profile?.gender || "—"}</p>
            </div>
            <div className="rounded-xl liquid-glass-subtle px-3 py-2 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Blood Group</p>
              <p className="font-bold text-xs text-rose-700 mt-0.5">{profile?.bloodGroup || "—"}</p>
            </div>
            <div className="rounded-xl liquid-glass-subtle px-3 py-2 border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Primary Contact</p>
              <p className="font-bold text-xs text-slate-800 mt-0.5 font-mono">+91 {profile?.contactNumber || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ACTIVE CLINICAL ALERTS / INPATIENT STAY ================= */}
      {activeBedStay && (
        <div className="rounded-2xl liquid-glass-card border border-teal-200/80 bg-teal-50/50 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white text-xl font-bold shadow-2xs flex-shrink-0">
              🛏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-100 text-teal-900 border border-teal-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Active Inpatient Stay
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  Bed #{activeBedStay.bedNumber} ({activeBedStay.ward})
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Reason: {activeBedStay.admissionReason || "Medical Observation"} • Attending: {formatDoctorName(activeBedStay.attendingDoctor?.name, "Consultant")}
              </p>
            </div>
          </div>
          <Link
            to="/patient/admissions"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 self-start sm:self-auto flex-shrink-0"
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
              className="rounded-2xl liquid-glass-card border border-amber-200/80 bg-amber-50/60 p-4 text-xs font-semibold text-amber-900 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⚠️</span>
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
        <MetricCard
          label="Upcoming Visits"
          value={stats?.upcomingAppointments || 0}
          sub="Scheduled visits"
          icon="📅"
          onClick={() => navigate("/patient/appointments")}
        />
        <MetricCard
          label="Active Medicines"
          value={stats?.activePrescriptions || 0}
          sub="Daily dosages"
          icon="💊"
          onClick={() => navigate("/patient/medicines")}
        />
        <MetricCard
          label="Lab Reports"
          value={stats?.labReportsCount || 0}
          sub="Verified reports"
          icon="🔬"
          onClick={() => navigate("/patient/lab-reports")}
        />
        <MetricCard
          label="Pending Bills"
          value={stats?.pendingBills || 0}
          sub={`₹${stats?.pendingAmount?.toFixed(2) || "0.00"} due`}
          icon="🧾"
          valueColor={stats?.pendingBills > 0 ? "text-amber-800" : "text-slate-900"}
          onClick={() => navigate("/patient/billings")}
        />
        <MetricCard
          label="Inpatient Stays"
          value={activeBedStay ? "1 Active" : "0 Active"}
          sub="Bed stays"
          icon="🛏️"
          onClick={() => navigate("/patient/admissions")}
        />
        <MetricCard
          label="Past Visits"
          value={stats?.completedConsultations || 0}
          sub="Summaries"
          icon="🩺"
          onClick={() => navigate("/patient/consultations")}
        />
      </div>

      {/* ================= NEXT UPCOMING APPOINTMENT HIGHLIGHT ================= */}
      {nextAppointment ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-800 text-xl shadow-2xs flex-shrink-0">
                🩺
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    Next Consultation
                  </span>
                  <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-bold capitalize text-emerald-800 bg-emerald-50 border border-emerald-200/60">
                    {nextAppointment.status}
                  </span>
                  <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
                    {nextAppointment.appointmentType || "In-person"}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {formatDoctorName(nextAppointment.doctor?.name, "Consultant")}
                </h2>
                <p className="text-xs font-medium text-teal-800">
                  {nextAppointment.doctor?.specialization || "General Physician"} • {nextAppointment.doctor?.department || "OPD Department"}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Date: <strong className="text-slate-800 font-mono font-semibold">
                    {new Date(nextAppointment.appointmentDate).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </strong> • Time: <strong className="text-slate-800 font-mono font-semibold">{nextAppointment.timeSlot}</strong>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 self-start sm:self-auto md:self-center">
              <Link
                to="/patient/appointments"
                className="min-h-[38px] inline-flex items-center justify-center rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs text-center"
              >
                Reschedule / Cancel
              </Link>
              <Link
                to="/patient/appointments"
                className="min-h-[38px] inline-flex items-center justify-center rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 text-center"
              >
                View Visit Pass →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/70 p-6 text-center">
          <p className="text-sm font-bold text-slate-800">You don't have any upcoming consultations scheduled.</p>
          <p className="text-xs text-slate-500 mt-1">Book an appointment with our specialist physicians anytime.</p>
          <div className="mt-3">
            <Link
              to="/patient/appointments/book"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95"
            >
              📅 Book Specialist Visit
            </Link>
          </div>
        </div>
      )}

      {/* ================= UPCOMING DIAGNOSTIC PROCEDURES & SCANS ================= */}
      {upcomingDiagnostics && upcomingDiagnostics.length > 0 && (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl liquid-glass-subtle text-slate-800 font-bold text-sm">
                🔬
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upcoming Diagnostic Procedures & Tests ({upcomingDiagnostics.length})
                </h3>
                <p className="text-xs text-slate-600">Scheduled pathology investigations & radiology imaging studies</p>
              </div>
            </div>
            <Link
              to="/patient/lab-reports"
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              Diagnostic History →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingDiagnostics.map((dx) => (
              <div
                key={dx._id}
                className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-sm text-slate-900 leading-snug">{dx.testName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 liquid-glass-pill ${
                      dx.status === "Patient Ready"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                        : dx.status === "Scheduled"
                        ? "bg-teal-50 text-teal-800 border-teal-200/70"
                        : "bg-slate-50 text-slate-700 border-slate-200/70"
                    }`}>
                      {dx.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Modality: <strong className="text-slate-700 capitalize">{dx.modality || "General"}</strong> • Priority: <span className="font-semibold capitalize text-teal-800">{dx.priority || "routine"}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Slot: <strong className="text-slate-800 font-mono">{dx.scheduledSlot?.date ? new Date(dx.scheduledSlot.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "TBD"} {dx.scheduledSlot?.time || ""}</strong></span>
                  <span className="text-slate-400">{dx.accessionNumber || ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= QUICK ACTION SHORTCUTS ================= */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions & Self-Service
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/patient/appointments/book"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 hover:border-slate-300 hover:bg-slate-50/80 transition group shadow-2xs"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-slate-800 font-bold group-hover:scale-105 transition-transform">
              ➕
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">Book Doctor Visit</h4>
              <p className="text-[11px] text-slate-500">Choose specialist & slot</p>
            </div>
          </Link>

          <Link
            to="/patient/vitals"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 hover:border-slate-300 hover:bg-slate-50/80 transition group shadow-2xs"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-rose-700 font-bold group-hover:scale-105 transition-transform">
              ❤️
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">Log Today's Vitals</h4>
              <p className="text-[11px] text-slate-500">BP, pulse, SpO2 & sugar</p>
            </div>
          </Link>

          <Link
            to="/patient/lab-reports"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 hover:border-slate-300 hover:bg-slate-50/80 transition group shadow-2xs"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-purple-700 font-bold group-hover:scale-105 transition-transform">
              🔬
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">Lab Diagnostic Reports</h4>
              <p className="text-[11px] text-slate-500">Download pathology PDF</p>
            </div>
          </Link>

          <Link
            to="/patient/billings"
            className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 hover:border-slate-300 hover:bg-slate-50/80 transition group shadow-2xs"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass-subtle text-emerald-700 font-bold group-hover:scale-105 transition-transform">
              💳
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition">Pay Outstanding Bills</h4>
              <p className="text-[11px] text-slate-500">Instant UPI & card receipt</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ================= DUAL RECENT CLINICAL CARDS ================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Latest Prescription */}
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>💊</span> Latest Digital Prescription
              </h3>
              <Link to="/patient/prescriptions" className="text-xs font-semibold text-teal-800 hover:underline">
                View All →
              </Link>
            </div>

            {activePrescription ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                  <div>
                    <span className="font-semibold text-slate-800">{formatDoctorName(activePrescription.doctor?.name, "Consultant")}</span>
                    <p className="text-[11px] text-slate-500">{activePrescription.doctor?.specialization}</p>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">
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
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                    {activePrescription.medicines?.slice(0, 3).map((m, mIdx) => (
                      <div key={mIdx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-800">{m.name}</strong>
                          <span className="text-slate-500 ml-1.5 font-medium text-[11px]">({m.dosage})</span>
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
              className="rounded-xl liquid-glass-pill px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition shadow-2xs"
            >
              Dosage Guide →
            </Link>
          </div>
        </div>

        {/* Right: Latest Lab Report */}
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🔬</span> Latest Diagnostic Test
              </h3>
              <Link to="/patient/lab-reports" className="text-xs font-semibold text-teal-800 hover:underline">
                View All →
              </Link>
            </div>

            {latestLabReport ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{latestLabReport.testName}</h4>
                    <p className="text-[11px] text-slate-500">Ordered by {formatDoctorName(latestLabReport.doctor?.name, "Consultant")}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider liquid-glass-pill ${
                      latestLabReport.status === "completed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                        : "bg-amber-50 text-amber-800 border-amber-200/70"
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
              className="rounded-xl liquid-glass-pill px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition shadow-2xs"
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

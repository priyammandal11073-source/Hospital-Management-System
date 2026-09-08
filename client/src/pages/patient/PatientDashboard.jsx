import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAppointments, getMyBedStay, getMyBillings, getMyPrescriptions, getMyProfile } from "../../services/api.js";

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bedStay, setBedStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [p, a, b, r, stayRes] = await Promise.all([
          getMyProfile(),
          getMyAppointments(),
          getMyBillings(),
          getMyPrescriptions(),
          getMyBedStay().catch(() => ({ bedStay: null })),
        ]);
        if (!active) return;
        setProfile(p.patient);
        setAppointments(a.appointments || []);
        setBillings(b.billings || []);
        setPrescriptions(r.prescriptions || []);
        setBedStay(stayRes?.bedStay || null);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <p className="text-slate-600 font-medium">Loading patient dashboard...</p>;
  if (error) return <p className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700">{error}</p>;

  const pending = appointments.filter((a) => a.status === "pending").length;
  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Welcome, {profile?.name}</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">Your patient care overview</p>
      </div>

      {/* Active Inpatient Admission Banner */}
      {bedStay && (
        <div className="p-5 rounded-2xl bg-teal-50/80 border-2 border-teal-300 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white font-black text-xl shadow-sm">
                🛏️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                    Active inpatient admission
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-700 text-white font-bold">
                    {bedStay.bedNumber}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {bedStay.ward} • {bedStay.floor}
                </h3>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  Reason: {bedStay.currentAdmission?.admissionReason}
                </p>
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-700">
              <p className="font-bold text-slate-900">
                Attending physician: Dr. {bedStay.currentAdmission?.attendingDoctor?.name || "Consultant"}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Admitted on {new Date(bedStay.currentAdmission?.admittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <article className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total appointments</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{appointments.length}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700">{upcoming}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending confirmation</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-700">{pending}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Digital prescriptions</p>
          <p className="mt-2 text-3xl font-extrabold text-teal-700">{prescriptions.length}</p>
        </article>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 ring-1 ring-slate-200/60">
        <h2 className="text-base font-extrabold text-slate-900">Patient profile</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">ABHA number (Ayushman)</dt>
            <dd className="font-mono font-extrabold text-blue-800 text-sm mt-0.5">{profile?.abhaId || "14-8891-2345-6789"}</dd>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{profile?.email || "—"}</dd>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">+91 {profile?.contactNumber || "—"}</dd>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age / gender</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">{profile?.age} yrs / {profile?.gender}</dd>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood group</dt>
            <dd className="font-extrabold text-rose-700 mt-0.5">{profile?.bloodGroup || "—"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/patient/appointments/book" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs">
            Book appointment
          </Link>
          <Link to="/patient/prescriptions" className="rounded-xl bg-teal-50 border border-teal-200 text-teal-900 px-4 py-2 text-xs font-bold hover:bg-teal-100 transition-colors">
            My prescriptions ({prescriptions.length})
          </Link>
          <Link to="/patient/billings" className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            View bills ({billings.length})
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboard;

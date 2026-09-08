import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyAppointments, getMyBillings, getMyPrescriptions, getMyProfile } from "../../services/api.js";

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [billings, setBillings] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [p, a, b, r] = await Promise.all([
          getMyProfile(),
          getMyAppointments(),
          getMyBillings(),
          getMyPrescriptions(),
        ]);
        if (!active) return;
        setProfile(p.patient);
        setAppointments(a.appointments || []);
        setBillings(b.billings || []);
        setPrescriptions(r.prescriptions || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <p className="text-slate-600">Loading patient dashboard...</p>;
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  const pending = appointments.filter((a) => a.status === "pending").length;
  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length;

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800">Welcome, {profile?.name}</h1>
      <p className="mt-1 text-sm text-slate-600">Your patient portal overview</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <article className="rounded-lg bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total appointments</p><p className="mt-2 text-3xl font-bold">{appointments.length}</p></article>
        <article className="rounded-lg bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Upcoming</p><p className="mt-2 text-3xl font-bold text-blue-600">{upcoming}</p></article>
        <article className="rounded-lg bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Pending confirmation</p><p className="mt-2 text-3xl font-bold text-amber-600">{pending}</p></article>
        <article className="rounded-lg bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Digital prescriptions</p><p className="mt-2 text-3xl font-bold text-teal-600">{prescriptions.length}</p></article>
      </div>
      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Profile</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">ABHA number (Ayushman)</dt><dd className="font-mono font-bold text-blue-700">{profile?.abhaId || "14-8891-2345-6789"}</dd></div>
          <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{profile?.email || "—"}</dd></div>
          <div><dt className="text-slate-500">Contact</dt><dd className="font-medium">+91 {profile?.contactNumber || "—"}</dd></div>
          <div><dt className="text-slate-500">Age / gender</dt><dd className="font-medium">{profile?.age} / {profile?.gender}</dd></div>
          <div><dt className="text-slate-500">Blood group</dt><dd className="font-medium">{profile?.bloodGroup || "—"}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/patient/appointments/book" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Book appointment</Link>
          <Link to="/patient/prescriptions" className="rounded-md bg-teal-50 border border-teal-200 text-teal-800 px-4 py-2 text-sm font-medium hover:bg-teal-100">My prescriptions ({prescriptions.length})</Link>
          <Link to="/patient/billings" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">View bills ({billings.length})</Link>
        </div>
      </div>
    </section>
  );
}

export default PatientDashboard;

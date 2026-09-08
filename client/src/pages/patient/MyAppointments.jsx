import { useEffect, useState } from "react";
import { cancelMyAppointment, getMyAppointments } from "../../services/api.js";

const statusClasses = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  const fetch = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointments(status ? { status } : {});
      setAppointments(data.appointments);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [status]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancelling(id);
    setError("");
    try {
      await cancelMyAppointment(id);
      await fetch();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to cancel");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800">My appointments</h1>
      <div className="mt-4 max-w-xs">
        <label className="text-sm font-medium text-slate-700">Filter by status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
        {loading ? (
          <p className="p-6 text-center text-slate-600">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-slate-500">No appointments found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <li
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                key={a._id}
              >
                {/* Left side: Badge + Doctor Name + Subtitle */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs ring-1 ring-emerald-500/20 flex-shrink-0">
                    {a.timeSlot ? a.timeSlot.slice(0, 5) : "AM"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Dr. {a.doctor?.name || "Specialist"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Consultation with <span className="font-medium text-slate-700">{a.doctor?.specialization || "General Medicine"}</span>
                      {a.reasonForVisit && (
                        <span className="hidden md:inline text-slate-400"> • {a.reasonForVisit}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right side: Date + Time Slot + Status Badge + Cancel Action */}
                <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-600">
                    {new Date(a.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                    {a.timeSlot}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${
                      statusClasses[a.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {a.status}
                  </span>
                  {["pending", "confirmed"].includes(a.status) && (
                    <button
                      disabled={cancelling === a._id}
                      onClick={() => handleCancel(a._id)}
                      className="rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                    >
                      {cancelling === a._id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default MyAppointments;

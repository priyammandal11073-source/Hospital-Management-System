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
      <h1 className="text-2xl font-semibold text-slate-800">My Appointments</h1>
      <div className="mt-4 max-w-xs">
        <label className="text-sm font-medium text-slate-700">Filter by status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
        {loading ? <p className="p-6 text-center text-slate-600">Loading...</p> : appointments.length === 0 ? <p className="p-6 text-center text-slate-600">No appointments found.</p> : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Doctor</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-3">{a.doctor?.name || "—"} <span className="text-slate-500">({a.doctor?.specialization || ""})</span></td>
                  <td className="px-4 py-3">{new Date(a.appointmentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{a.timeSlot}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[a.status]}`}>{a.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {["pending", "confirmed"].includes(a.status) && (
                      <button disabled={cancelling === a._id} onClick={() => handleCancel(a._id)} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-300">{cancelling === a._id ? "Cancelling..." : "Cancel"}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default MyAppointments;

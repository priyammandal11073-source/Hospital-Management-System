import { useEffect, useState } from "react";
import { getMyBillings } from "../../services/api.js";

const statusClasses = { pending: "bg-yellow-100 text-yellow-800", paid: "bg-green-100 text-green-800", partially_paid: "bg-orange-100 text-orange-800" };

function MyBillings() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyBillings().then((d) => { if (active) setBillings(d.billings); }).catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load bills"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <p className="text-slate-600">Loading bills...</p>;
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-800">My Bills</h1>
      <p className="mt-1 text-sm text-slate-600">Read-only — contact reception for payment.</p>
      <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
        {billings.length === 0 ? <p className="p-6 text-center text-slate-600">No bills found.</p> : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3">Appointment</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {billings.map((b) => (
                <tr key={b._id}>
                  <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{b.appointment ? `${new Date(b.appointment.appointmentDate).toLocaleDateString()} ${b.appointment.timeSlot}` : "—"}</td>
                  <td className="px-4 py-3 font-medium">₹{b.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[b.paymentStatus]}`}>{b.paymentStatus?.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default MyBillings;

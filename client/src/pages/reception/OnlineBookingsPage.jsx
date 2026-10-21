import { useState, useEffect } from "react";
import { getOnlineBookings, confirmOnlineBooking } from "../../services/api.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function OnlineBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const data = await getOnlineBookings({ status: statusFilter });
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load online bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleAction = async (id, action, reason = "") => {
    setProcessingId(id);
    try {
      await confirmOnlineBooking(id, { action, reason });
      loadBookings();
      if (cancelModal) setCancelModal(null);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Patient Self-Service Portal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Online Patient Booking Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, verify, and confirm self-scheduled appointment requests made through the Nivora Care Patient Portal.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-white p-1 shadow-xs ring-1 ring-slate-200/80">
          {[
            { id: "pending", label: "Needs Confirmation" },
            { id: "confirmed", label: "Confirmed" },
            { id: "cancelled", label: "Rejected / Cancelled" },
            { id: "all", label: "All Bookings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
        {isLoading ? (
          <div className="py-20 text-center text-xs font-medium text-slate-400 animate-pulse">
            Loading online bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🌐</span>
            <p className="mt-2 text-sm font-bold text-slate-700">No bookings in this category</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === "pending"
                ? "All self-service patient booking requests have been reviewed!"
                : "No matching appointment requests found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Requested Specialist</th>
                  <th className="py-3.5 px-4">Date & Time Slot</th>
                  <th className="py-3.5 px-4">Reason for Visit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{app.patient?.name || "Patient"}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {app.patient?.age}y • {app.patient?.gender} • 📞 {app.patient?.contactNumber}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{formatDoctorName(app.doctor?.name)}</div>
                      <div className="text-[11px] text-slate-500">{app.doctor?.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">
                        {new Date(app.appointmentDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[11px] text-purple-700 font-mono font-semibold">{app.timeSlot}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {app.reasonForVisit}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          app.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                            : app.status === "cancelled"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800 ring-1 ring-amber-300 animate-pulse"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {app.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={processingId === app._id}
                            onClick={() => handleAction(app._id, "confirm")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            ✓ Confirm
                          </button>
                          <button
                            disabled={processingId === app._id}
                            onClick={() => setCancelModal(app)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject / Cancel Reason Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="text-base font-bold text-slate-800">Reject Online Booking Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please provide a reason. The patient ({cancelModal.patient?.name}) will receive this update on their portal.
            </p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Doctor is in emergency surgery; please choose another slot."
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none"
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancelModal(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Back
              </button>
              <button
                disabled={processingId === cancelModal._id}
                onClick={() => handleAction(cancelModal._id, "cancel", cancelReason)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {processingId === cancelModal._id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

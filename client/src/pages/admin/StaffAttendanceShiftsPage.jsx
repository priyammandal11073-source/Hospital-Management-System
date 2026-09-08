import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAdminStaffAttendance,
  getAdminStaffLeaves,
  reviewAdminStaffLeave,
} from "../../services/api.js";

const STATUS_BADGES = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  late: "bg-amber-50 text-amber-700 ring-amber-500/20",
  half_day: "bg-blue-50 text-blue-700 ring-blue-500/20",
  absent: "bg-rose-50 text-rose-700 ring-rose-500/20",
};

const LEAVE_BADGES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-500/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-500/20",
};

export default function StaffAttendanceShiftsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance' | 'leaves'
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminStaffAttendance({ date: selectedDate });
      setAttendanceRecords(res.records || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminStaffLeaves({ status: leaveStatusFilter });
      setLeaveRequests(res.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leaves.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance") {
      loadAttendance();
    } else {
      loadLeaves();
    }
  }, [activeTab, selectedDate, leaveStatusFilter]);

  const handleReviewLeave = async (leaveId, status) => {
    setError("");
    try {
      await reviewAdminStaffLeave(leaveId, { status, adminNotes: `Reviewed by Admin on ${new Date().toLocaleDateString("en-IN")}` });
      setSuccessMsg(`Leave request ${status}.`);
      loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update leave status.");
    }
  };

  const stats = useMemo(() => {
    const presentCount = attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length;
    const pendingLeavesCount = leaveRequests.filter((l) => l.status === "pending").length;
    return { presentCount, pendingLeavesCount };
  }, [attendanceRecords, leaveRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Workforce Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Staff Attendance & Shift Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor daily check-ins, multi-tier hospital shifts (morning, evening, night), and approve leave applications.
          </p>
        </div>

        {/* Date Selector */}
        {activeTab === "attendance" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Log Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${
            activeTab === "attendance" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Daily Attendance Sheet ({attendanceRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("leaves")}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${
            activeTab === "leaves" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Leave Applications ({leaveRequests.length})
        </button>
      </div>

      {/* Attendance View */}
      {activeTab === "attendance" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Role & Dept</th>
                  <th className="px-4 py-3">Assigned Shift</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      Loading biometric attendance records...
                    </td>
                  </tr>
                ) : attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      No attendance logged for {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{rec.user?.name || "Staff Member"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{rec.user?.employeeId || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="capitalize font-semibold text-slate-700">{rec.user?.role}</span> • {rec.user?.department || "General"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 font-medium text-[11px] text-slate-700">
                          {rec.shift} Shift
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Active on duty"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${STATUS_BADGES[rec.status] || STATUS_BADGES.present}`}>
                          {rec.status?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaves View */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Filter:</span>
            {["pending", "approved", "rejected", "All"].map((st) => (
              <button
                key={st}
                onClick={() => setLeaveStatusFilter(st)}
                className={`rounded-lg px-3 py-1 font-semibold capitalize transition ${
                  leaveStatusFilter === st ? "bg-purple-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                        No leave requests found in this status.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((leave) => (
                      <tr key={leave._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{leave.user?.name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{leave.user?.role} • {leave.user?.department}</p>
                        </td>
                        <td className="px-4 py-3 capitalize font-semibold text-slate-700">
                          {leave.leaveType} Leave
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {new Date(leave.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(leave.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ring-1 ${LEAVE_BADGES[leave.status] || LEAVE_BADGES.pending}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          {leave.status === "pending" ? (
                            <>
                              <button
                                onClick={() => handleReviewLeave(leave._id, "approved")}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewLeave(leave._id, "rejected")}
                                className="rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

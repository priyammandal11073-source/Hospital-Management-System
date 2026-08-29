import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getAppointments,
  getDoctors,
  getRevenueSummary,
} from "../services/api.js";

const statuses = ["pending", "confirmed", "completed", "cancelled"];

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">₹{value.toFixed(2)}</p>
    </article>
  );
}

function Reports() {
  const { user, loading } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;

    let isCurrentRequest = true;

    const fetchReports = async () => {
      setIsLoading(true);

      try {
        const [revenueData, appointmentData, doctorData] = await Promise.all([
          getRevenueSummary(),
          getAppointments(),
          getDoctors(),
        ]);

        if (isCurrentRequest) {
          setReportData({
            revenue: revenueData,
            appointments: appointmentData.appointments,
            doctors: doctorData.doctors,
          });
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load reports.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchReports();

    return () => {
      isCurrentRequest = false;
    };
  }, [user?.role]);

  const { appointmentStatusData, doctorsByAppointmentCount } = useMemo(() => {
    const appointments = reportData?.appointments || [];
    const doctors = reportData?.doctors || [];
    const countsByDoctor = appointments.reduce((counts, appointment) => {
      const doctorId = appointment.doctor?._id;
      if (doctorId) counts[doctorId] = (counts[doctorId] || 0) + 1;
      return counts;
    }, {});

    return {
      appointmentStatusData: statuses.map((status) => ({
        status,
        count: appointments.filter((appointment) => appointment.status === status).length,
      })),
      doctorsByAppointmentCount: doctors
        .map((doctor) => ({
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          appointments: countsByDoctor[doctor._id] || 0,
        }))
        .sort((first, second) => second.appointments - first.appointments),
    };
  }, [reportData]);

  if (loading) {
    return <p className="text-slate-600">Checking access...</p>;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading reports...</p>;
  }

  if (error) {
    return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">Financial and appointment summaries.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Total Revenue Collected" value={reportData.revenue.totalRevenue} />
        <SummaryCard label="Total Pending Amount" value={reportData.revenue.totalPendingAmount} />
      </div>

      <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Appointments by Status</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={appointmentStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" name="Appointments" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Appointments per Doctor</h2>
        {doctorsByAppointmentCount.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No doctors found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-3 pr-4">Doctor</th>
                  <th className="pb-3 pr-4">Specialization</th>
                  <th className="pb-3 text-right">Appointments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {doctorsByAppointmentCount.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="py-3 pr-4 font-medium">Dr. {doctor.name}</td>
                    <td className="py-3 pr-4">{doctor.specialization}</td>
                    <td className="py-3 text-right">{doctor.appointments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default Reports;

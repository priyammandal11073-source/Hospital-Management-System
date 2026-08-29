import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  getBillings,
  getDoctors,
  getPatients,
} from "../services/api.js";

const formatDate = (date) => new Date(date).toLocaleDateString();

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </article>
  );
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        // The patient API provides a total without transferring all patient records.
        const [patientData, doctorData, appointmentData, pendingBillingData] = await Promise.all([
          getPatients("", 1, 1),
          getDoctors(),
          getAppointments(),
          getBillings({ paymentStatus: "pending" }),
        ]);

        if (isCurrentRequest) {
          setDashboardData({
            totalPatients: patientData.pagination?.totalPatients || 0,
            totalDoctors: doctorData.doctors.length,
            appointments: appointmentData.appointments,
            pendingBills: pendingBillingData.billings.length,
          });
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load dashboard data.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const { recentAppointments, todayAppointments } = useMemo(() => {
    const appointments = dashboardData?.appointments || [];
    const today = new Date().toISOString().slice(0, 10);

    return {
      recentAppointments: [...appointments]
        .sort((first, second) => new Date(second.appointmentDate) - new Date(first.appointmentDate))
        .slice(0, 5),
      todayAppointments: appointments.filter(
        (appointment) => appointment.appointmentDate.slice(0, 10) === today
      ),
    };
  }, [dashboardData]);

  if (isLoading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">A quick overview of today&apos;s hospital activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Patients" value={dashboardData.totalPatients} />
        <SummaryCard label="Total Doctors" value={dashboardData.totalDoctors} />
        <SummaryCard label="Appointments Today" value={todayAppointments.length} />
        <SummaryCard label="Pending Bills" value={dashboardData.pendingBills} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Recent Appointments</h2>
          {recentAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No appointments yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Patient</th>
                    <th className="pb-2 pr-4">Doctor</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td className="py-3 pr-4">{appointment.patient?.name || "Unknown patient"}</td>
                      <td className="py-3 pr-4">{appointment.doctor?.name || "Unknown doctor"}</td>
                      <td className="py-3">{formatDate(appointment.appointmentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Today&apos;s Appointments</h2>
          {todayAppointments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No appointments scheduled for today.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {todayAppointments.map((appointment) => (
                <li className="flex items-center justify-between py-3 text-sm" key={appointment._id}>
                  <span>
                    <span className="font-medium text-slate-800">{appointment.patient?.name}</span>
                    <span className="text-slate-500"> with Dr. {appointment.doctor?.name}</span>
                  </span>
                  <span className="text-slate-600">{appointment.timeSlot}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

export default Dashboard;

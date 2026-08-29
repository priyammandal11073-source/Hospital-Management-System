import React from "react";
import DashboardLayout from "../components/layout/dashboardlayout";

const Dashboard = () => {
  const totalPatients = 47;
  const totalDoctors = 12;
  const todayAppointments = 8;
  const pendingBills = 3;

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-md p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-primary">{totalPatients}</span>
            <span className="text-sm text-neutral-500">Total Patients</span>
          </div>
          <div className="mt-2 h-2 w-6 bg-primary rounded-full overflow-hidden">
            <div className="h-full w-full bg-primary" style={{ width: `${(totalPatients / 200) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-md p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-secondary">{totalDoctors}</span>
            <span className="text-sm text-neutral-500">Total Doctors</span>
          </div>
          <div className="mt-2 h-2 w-6 bg-secondary-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-secondary" style={{ width: `${(totalDoctors / 30) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-md p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-600">{todayAppointments}</span>
            <span className="text-sm text-neutral-500">Today's Appointments</span>
          </div>
          <div className="mt-2 h-2 w-6 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-emerald-500" style={{ width: `${(todayAppointments / 15) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-md p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-amber-600">{pendingBills}</span>
            <span className="text-sm text-neutral-500">Pending Bills</span>
          </div>
          <div className="mt-2 h-2 w-6 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-amber-500" style={{ width: `${(pendingBills / 10) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
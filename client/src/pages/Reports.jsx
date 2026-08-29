import React from "react";
import { Card, Badge } from "../components/u";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Reports = () => {
  const appointmentData = [
    { name: "Pending", uv: 45, pv: 45 },
    { name: "Confirmed", uv: 32, pv: 32 },
    { name: "Completed", uv: 28, pv: 28 },
    { name: "Cancelled", uv: 12, pv: 12 },
  ];

  const revenueData = [
    { name: "January", amount: 2400 },
    { name: "February", amount: 1800 },
    { name: "March", amount: 3100 },
    { name: "April", amount: 2900 },
    { name: "May", amount: 2500 },
    { name: "June", amount: 3200 },
  ];

  const doctorsData = [
    { name: "Dr. Smith", appointments: 45 },
    { name: "Dr. Johnson", appointments: 38 },
    { name: "Dr. Williams", appointments: 32 },
    { name: "Dr. Brown", appointments: 28 },
    { name: "Dr. Jones", appointments: 22 },
  ];

  return (
    <div>
      <Card>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Revenue Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md p-4 shadow-sm">
            <div className="text-2xl font-bold text-primary">$28,450</div>
            <div className="text-sm text-neutral-500">Total Revenue</div>
          </div>
          <div className="bg-white rounded-md p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600">$12,800</div>
            <div className="text-sm text-neutral-500">Paid This Month</div>
          </div>
          <div className="bg-white rounded-md p-4 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">$4,200</div>
            <div className="text-sm text-neutral-500">Pending Payment</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Appointments by Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={appointmentData}>
            <XAxis dataKey="name" className="text-sm text-neutral-500" />
            <YAxis 
              domain={["0", "max"]} 
              tick={{ fontSize: 10 }} 
              className="text-sm text-neutral-500"
            />
            <Tooltip 
              wrapperStyle={{ padding: 8 }} 
              itemStyle={{ stroke: "none" }} 
              className="text-sm"
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              dataKey="uv" 
              fontSize={12} 
              className="text-sm text-neutral-600"
            />
            <Bar dataKey="uv" name="Appointments" fill="#1E3A8A" />
            <Bar dataKey="pv" name="Visits" fill="#0F766E" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Busiest Doctors</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border bg-white">
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Doctor</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Appointments</th>
              </tr>
            </thead>
            <tbody>
              {doctorsData.map((doc) => (
                <tr key={doc.name} className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {doc.appointments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
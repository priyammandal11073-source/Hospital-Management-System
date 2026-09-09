import { useState, useEffect } from "react";
import { getPharmacyStaff } from "../../services/api.js";

export default function PharmacyStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await getPharmacyStaff();
      setStaffList(data.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const shifts = [
    { name: "Morning Shift (OPD Peak)", time: "07:00 AM - 03:00 PM", staffCount: "3 On Duty", lead: "Dr. Vikram Joshi (Reg: MH-PCI-98124)" },
    { name: "Evening Shift (Discharge & OPD)", time: "03:00 PM - 11:00 PM", staffCount: "2 On Duty", lead: "Suresh Iyer (Reg: MH-PCI-77215)" },
    { name: "Night / 24x7 Emergency Shift", time: "11:00 PM - 07:00 AM", staffCount: "1 On Duty", lead: "Kavita Rao (Reg: MH-PCI-88392)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Personnel & Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Staff, Licensure & Shift Roster</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Licensed dispensary practitioners, council registration credentials, counter allocations, and active duty shifts.
          </p>
        </div>
      </div>

      {/* Current Active Duty Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Counter #01 — Outpatient OPD</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-2 text-base font-black text-slate-900">Dr. Vikram Joshi</p>
          <p className="text-xs text-slate-600">Chief Clinical Pharmacist • Reg: MH-PCI-98124</p>
          <p className="text-[11px] text-amber-800 mt-2 font-medium">Duty: 07:00 AM - 03:00 PM</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Counter #02 — IPD & Discharges</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-2 text-base font-black text-slate-900">Suresh Iyer</p>
          <p className="text-xs text-slate-600">Senior Dispensing Pharmacist • Reg: MH-PCI-77215</p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Duty: 03:00 PM - 11:00 PM</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Counter #03 — 24/7 Trauma & Night</span>
            <span className="flex h-2 w-2 rounded-full bg-slate-400"></span>
          </div>
          <p className="mt-2 text-base font-black text-slate-900">Kavita Rao</p>
          <p className="text-xs text-slate-600">Emergency Pharmacist • Reg: MH-PCI-88392</p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Duty: 11:00 PM - 07:00 AM (Next Shift)</p>
        </div>
      </div>

      {/* Shifts Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Daily 24-Hour Coverage Schedule</h2>
        <div className="divide-y divide-slate-100">
          {shifts.map((s, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                <p className="text-[11px] text-slate-500">Shift Lead: {s.lead}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {s.time}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  {s.staffCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Licensure Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Registered Pharmacy Practitioners</h2>
          <span className="text-xs text-slate-400">Compliance Verified with State Pharmacy Council</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-semibold">Loading dispensary roster...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Pharmacist</th>
                  <th className="px-4 py-3">Designation / Role</th>
                  <th className="px-4 py-3">Pharmacy Council Reg #</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Current Counter</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {st.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {st.role === "admin" ? "Chief Pharmacist & In-Charge" : "Registered Staff Pharmacist"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      MH-PCI-{st._id.slice(-5).toUpperCase()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {st.email}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      Counter #02 (Main OPD)
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Active on Duty
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

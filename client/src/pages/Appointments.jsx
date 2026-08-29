import React, { useState, useEffect } from "react";
import { Button } from "../components/u/button";
import { Input } from "../components/u/input";
import { Card } from "../components/u/card";
import { Badge } from "../components/u/badge";
import { Modal } from "../components/u/modal";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [currentAppointment, setCurrentAppointment] = useState(null);

  const filteredAppointments = appointments.filter(
    (a) => {
      const matchesSearch =
        a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.reasonForVisit.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || a.status === statusFilter;

      const matchesDoctor =
        doctorFilter === "all" || a.doctorName === doctorFilter;

      const matchesDate =
        dateFilter === "" || 
        new Date(a.appointmentDate).toISOString().includes(dateFilter);

      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    }
  );

  const toggleModal = (appointment = null) => {
    setCurrentAppointment(appointment || null);
    setMode(appointment ? "edit" : "add");
    setShowModal(!showModal);
  };

  return (
    <div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Appointments</h2>
          <Button variant="primary" onClick={toggleModal}>
            Book Appointment
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Input
            placeholder="Search..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Doctors</option>
            <option value="Dr. Smith">Dr. Smith</option>
            <option value="Dr. Jones">Dr. Jones</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border bg-white">
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Patient</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Doctor</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Date</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Time</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Reason</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Status</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt.id} className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {appt.patientName}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {appt.doctorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(appt.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {appt.timeSlot}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {appt.reasonForVisit}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={appt.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-sm">
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-sm ml-2"
                      onClick={() => toggleModal(appt)}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => toggleModal()}>
        <div>
          <h3 className="font-medium text-lg text-neutral-900">
            {mode === "add" ? "Book Appointment" : "Edit Appointment"}
          </h3>
          <form>
            <Input placeholder="Patient Name" value={currentAppointment?.patientName || ""} />
            <Input
              placeholder="Doctor Name"
              value={currentAppointment?.doctorName || ""}
            />
            <input
              type="date"
              value={currentAppointment?.appointmentDate || ""}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
            />
            <Input
              placeholder="Time Slot"
              value={currentAppointment?.timeSlot || ""}
            />
            <Input
              placeholder="Reason for Visit"
              value={currentAppointment?.reasonForVisit || ""}
            />
            <select
              value={currentAppointment?.status || "pending"}
              onChange={(e) => setCurrentAppointment({ ...currentAppointment, status: e.target.value })}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button
              type="submit"
              className="mt-4 w-full"
            >
              {mode === "add" ? "Book Appointment" : "Update Appointment"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;
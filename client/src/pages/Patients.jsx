import React, { useState } from "react";
import { Button } from "../components/u/button";
import { Input } from "../components/u/input";
import { Card } from "../components/u/card";
import { Badge } from "../components/u/badge";
import { Modal } from "../components/u/modal";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [currentPatient, setCurrentPatient] = useState(null);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModal = (patient = null) => {
    setCurrentPatient(patient || null);
    setMode(patient ? "edit" : "add");
    setShowModal(!showModal);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this patient?")) {
      setPatients(patients.filter((p) => p.id !== id));
      setShowModal(false);
    }
  };

  return (
    <div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Patients</h2>
          <Button variant="primary" onClick={toggleModal}>
            Add Patient
          </Button>
        </div>

        <Input
          placeholder="Search by name or email..."
        />
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border bg-white">
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Name</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Age</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Gender</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Contact</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Email</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {patient.age}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {patient.contactNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {patient.email}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-sm">
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-sm ml-2"
                      onClick={() => handleDelete(patient.id)}
                    >
                      Delete
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
            {mode === "add" ? "Add Patient" : "Edit Patient"}
          </h3>
          <form>
            <Input
              placeholder="Name"
              value={currentPatient?.name || ""}
            />
            <Input
              type="number"
              placeholder="Age"
              value={currentPatient?.age || ""}
            />
            <Input
              placeholder="Contact Number"
              value={currentPatient?.contactNumber || ""}
            />
            <Input
              type="email"
              placeholder="Email"
              value={currentPatient?.email || ""}
            />
            <Input
              placeholder="Address"
              value={currentPatient?.address || ""}
            />
            <Input
              placeholder="Blood Group"
              value={currentPatient?.bloodGroup || ""}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
            >
              {mode === "add" ? "Add Patient" : "Update Patient"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Patients;
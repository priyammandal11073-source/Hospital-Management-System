import React, { useState } from "react";
import { Button } from "../components/u/button";
import { Input } from "../components/u/input";
import { Card } from "../components/u/card";
import { Badge } from "../components/u/badge";
import { Modal } from "../components/u/modal";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [currentDoctor, setCurrentDoctor] = useState(null);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModal = (doctor = null) => {
    setCurrentDoctor(doctor || null);
    setMode(doctor ? "edit" : "add");
    setShowModal(!showModal);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this doctor?")) {
      setDoctors(doctors.filter((d) => d.id !== id));
      setShowModal(false);
    }
  };

  return (
    <div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Doctors</h2>
          <Button variant="primary" onClick={toggleModal}>
            Add Doctor
          </Button>
        </div>

        <Input
          placeholder="Search by name or specialization..."
        />
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border bg-white">
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Name</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Specialization</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Department</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Experience</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {doctor.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {doctor.specialization}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {doctor.department}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {doctor.yearsOfExperience} yrs
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-sm">
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-sm ml-2"
                      onClick={() => handleDelete(doctor.id)}
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
            {mode === "add" ? "Add Doctor" : "Edit Doctor"}
          </h3>
          <form>
            <Input placeholder="Name" value={currentDoctor?.name || ""} />
            <Input
              placeholder="Specialization"
              value={currentDoctor?.specialization || ""}
            />
            <Input
              placeholder="Department"
              value={currentDoctor?.department || ""}
            />
            <Input
              type="number"
              placeholder="Years of Experience"
              value={currentDoctor?.yearsOfExperience || ""}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
            >
              {mode === "add" ? "Add Doctor" : "Update Doctor"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Doctors;
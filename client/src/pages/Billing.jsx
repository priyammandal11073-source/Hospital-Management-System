import React, { useState } from "react";
import { Button } from "../components/u/button";
import { Input } from "../components/u/input";
import { Card } from "../components/u/card";
import { Badge } from "../components/u/badge";

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [currentBill, setCurrentBill] = useState(null);

  const filteredBills = bills.filter(
    (b) =>
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.paymentStatus.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModal = (bill = null) => {
    setCurrentBill(bill || null);
    setMode(bill ? "edit" : "add");
    setShowModal(!showModal);
  };

  return (
    <div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Billing</h2>
          <Button variant="primary" onClick={toggleModal}>
            New Bill
          </Button>
        </div>

        <Input
          placeholder="Search by patient or payment status..."
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-border bg-white">
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Patient</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Appointment</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Total Amount</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Payment Status</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Payment Date</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Payment Method</th>
                <th className="text-left text-sm font-medium text-neutral-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {bill.patientName}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {bill.appointmentDate}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    ${bill.totalAmount}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={bill.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {bill.paymentDate || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {bill.paymentMethod || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-sm">
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
            {mode === "add" ? "Create Bill" : "Edit Bill"}
          </h3>
          <form>
            <Input
              placeholder="Patient Name"
              value={currentBill?.patientName || ""}
            />
            <Input
              placeholder="Appointment Date"
              value={currentBill?.appointmentDate || ""}
            />
            <Input
              placeholder="Total Amount"
              value={currentBill?.totalAmount || ""}
            />
            <select
              value={currentBill?.paymentStatus || "pending"}
              onChange={(e) => setCurrentBill({ ...currentBill, paymentStatus: e.target.value })}
              className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full mb-3"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
            <Input
              placeholder="Payment Date"
              value={currentBill?.paymentDate || ""}
            />
            <Input
              placeholder="Payment Method"
              value={currentBill?.paymentMethod || ""}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
            >
              {mode === "add" ? "Create Bill" : "Update Bill"}
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;
import { useState } from "react";
import { sendBillingEmail } from "../services/api.js";

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

function InvoiceModal({ billing, onClose }) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  if (!billing) return null;

  const invoiceNumber = `INV-${billing._id?.toString().slice(-6).toUpperCase()}`;
  const totalAmount = (billing.totalAmount || 0).toFixed(2);
  const patient = billing.patient || {};
  const appointment = billing.appointment || {};
  const doctor = appointment.doctor || {};

  // WhatsApp link preparation
  const rawPhone = patient.contactNumber ? String(patient.contactNumber).replace(/[^0-9]/g, "") : "";
  const whatsappPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const isWhatsAppAvailable = Boolean(whatsappPhone && whatsappPhone.length >= 10);

  const chargesListText = (billing.itemizedCharges || [])
    .map((c, i) => `${i + 1}. ${c.description}: ₹${Number(c.cost || 0).toFixed(2)}`)
    .join("\n");

  const whatsappMessage = `🏥 *CITY GENERAL HOSPITAL - INVOICE*
*Invoice No:* ${invoiceNumber}
*Date:* ${formatDate(billing.createdAt)}
*Patient:* ${patient.name || "Patient"}
*Status:* ${billing.paymentStatus?.toUpperCase()}${billing.paymentMethod ? ` (${billing.paymentMethod.toUpperCase()})` : ""}

*Itemized Charges:*
${chargesListText}

*Total Amount:* ₹${totalAmount}
------------------------------------
Thank you for choosing City General Hospital.
For queries, contact billing at +91 98765 43210.`;

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Email handler
  const handleSendEmail = async () => {
    if (!patient.email) {
      setEmailStatus({
        type: "error",
        message: "This patient does not have an email address registered.",
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(null);

    try {
      const res = await sendBillingEmail(billing._id);
      setEmailStatus({
        type: "success",
        message: res.message || `Invoice emailed to ${patient.email}!`,
        previewUrl: res.previewUrl,
      });
    } catch (err) {
      setEmailStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to send invoice email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
    >
      <div className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Action Header (Hidden during print) */}
        <header className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
              📄
            </span>
            <h2 className="text-lg font-bold text-slate-800">Medical Invoice #{invoiceNumber}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 transition"
              title="Print or Save as PDF"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>

            {/* Email Button */}
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !patient.email}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title={patient.email ? `Send invoice to ${patient.email}` : "No email registered"}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isSendingEmail ? "Sending..." : "Send Email"}
            </button>

            {/* WhatsApp Button */}
            {isWhatsAppAvailable ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                title={`Send invoice via WhatsApp to +${whatsappPhone}`}
              >
                <span className="text-sm">💬</span>
                WhatsApp
              </a>
            ) : (
              <button
                disabled
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                title="WhatsApp unavailable (no contact number)"
              >
                <span>💬</span> WhatsApp (N/A)
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Close modal"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Email Status Notification (Hidden during print) */}
        {emailStatus && (
          <div
            className={`no-print mx-6 mt-4 rounded-lg p-3 text-xs flex items-center justify-between ${
              emailStatus.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{emailStatus.message}</span>
            {emailStatus.previewUrl && (
              <a
                href={emailStatus.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 font-bold underline hover:text-emerald-950"
              >
                View Sent Email (Preview)
              </a>
            )}
          </div>
        )}

        {/* PRINTABLE INVOICE BODY */}
        <div id="printable-invoice" className="p-8 text-slate-800">
          {/* Hospital Letterhead Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl text-blue-600 font-bold">✚</span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  CITY GENERAL HOSPITAL
                </h1>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-slate-500">
                Multi-Specialty Healthcare & Research Institute
              </p>
              <p className="mt-2 text-xs text-slate-600">
                123 Healthcare Boulevard, Medical District • Pin: 110001
              </p>
              <p className="text-xs text-slate-600">
                Phone: +91 98765 43210 • Email: contact@hospital.com
              </p>
            </div>

            <div className="mt-4 sm:mt-0 sm:text-right">
              <span
                className={`inline-block rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  billing.paymentStatus === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : billing.paymentStatus === "partially_paid"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {billing.paymentStatus === "paid" ? "PAID INVOICE" : "PAYMENT PENDING"}
              </span>
              <p className="mt-3 text-sm font-bold text-slate-800">Invoice: #{invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(billing.createdAt)}</p>
              {billing.paymentDate && (
                <p className="text-xs text-slate-500">
                  Paid On: {formatDate(billing.paymentDate)} ({billing.paymentMethod?.toUpperCase() || "CASH"})
                </p>
              )}
            </div>
          </div>

          {/* Patient & Doctor Two-Column Information */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Billed To (Patient Details)
              </h3>
              <p className="mt-1 text-base font-bold text-slate-900">{patient.name || "—"}</p>
              <div className="mt-1 text-xs space-y-0.5 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">Age / Gender:</span>{" "}
                  {patient.age ? `${patient.age} yrs` : "—"} / {patient.gender || "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Phone:</span>{" "}
                  {patient.contactNumber || "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Email:</span>{" "}
                  {patient.email || "—"}
                </p>
                {patient.address && (
                  <p>
                    <span className="font-semibold text-slate-700">Address:</span> {patient.address}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Consultation Details
              </h3>
              <p className="mt-1 text-base font-bold text-slate-900">
                {doctor.name ? `Dr. ${doctor.name}` : "General Physician"}
              </p>
              <div className="mt-1 text-xs space-y-0.5 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">Specialization:</span>{" "}
                  {doctor.specialization || "General Medicine"} ({doctor.department || "OPD"})
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Appointment Date:</span>{" "}
                  {formatDate(appointment.appointmentDate)} {appointment.timeSlot ? `at ${appointment.timeSlot}` : ""}
                </p>
                {appointment.reasonForVisit && (
                  <p>
                    <span className="font-semibold text-slate-700">Reason for Visit:</span>{" "}
                    {appointment.reasonForVisit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div className="mt-6">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-xs uppercase font-bold text-slate-600">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Description / Procedure</th>
                  <th className="py-2.5 px-4 text-right w-36">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(billing.itemizedCharges || []).map((charge, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="py-2.5 px-3 text-center text-xs text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{charge.description}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                      ₹{Number(charge.cost || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-800 font-bold">
                  <td colSpan="2" className="py-3 px-4 text-right text-base text-slate-900">
                    Total Amount Due:
                  </td>
                  <td className="py-3 px-4 text-right text-lg font-black text-blue-600 font-mono">
                    ₹{totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Terms & Signatures */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-500 max-w-sm">
              <p className="font-semibold text-slate-700">Payment Terms & Notes:</p>
              <p className="mt-1">
                This is a computer-generated medical bill issued by City General Hospital. All medical consultations, diagnostics, and procedures are non-refundable.
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-44 border-b border-slate-400"></div>
              <p className="mt-1 text-xs font-semibold text-slate-600">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">Accounts & Billing Department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;

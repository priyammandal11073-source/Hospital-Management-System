import { useState } from "react";
import { sendBillingEmail } from "../services/api.js";
import UpiPaymentBox, { generateUpiQrDataUrl, getUpiPaymentUrl } from "./UpiPaymentBox.jsx";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function InvoiceModal({ billing: initialBilling, onClose, onBillingUpdate, isPatient = false }) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [currentBilling, setCurrentBilling] = useState(initialBilling);

  if (!currentBilling) return null;

  const billing = currentBilling;

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

  const whatsappMessage = `🏥 *NIVORA CARE HOSPITAL - TAX INVOICE*
*Care • Trust • Healing*
*Invoice No:* ${invoiceNumber}
*Date:* ${formatDate(billing.createdAt)}
*Patient:* ${patient.name || "Patient"} ${patient.abhaId ? `(ABHA: ${patient.abhaId})` : ""}
*Status:* ${billing.paymentStatus?.toUpperCase()}${billing.paymentMethod ? ` (${billing.paymentMethod.toUpperCase()})` : ""}

*Itemized Charges:*
${chargesListText}

*Total Amount:* ₹${totalAmount}
------------------------------------
*NABH Accredited | GSTIN: 07AAAAA0000A1Z5*
Outer Ring Road, Near AIIMS Metro, New Delhi - 110029
Emergency: 108 / 112 | Billing Desk: +91 98765 43210`;

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  // Handle UPI payment success — update local billing and notify parent
  const handleUpiPaymentSuccess = (updatedBilling) => {
    setCurrentBilling(updatedBilling);
    if (onBillingUpdate) onBillingUpdate(updatedBilling);
  };

  // Clean isolated print handler — async to pre-generate QR data URL
  const handlePrint = async () => {
    // Pre-generate QR code data URL for embedding into print HTML
    let qrDataUrl = "";
    if (billing.paymentStatus !== "paid") {
      qrDataUrl = await generateUpiQrDataUrl(billing);
    }

    const upiPrintSection = billing.paymentStatus === "paid" && billing.upiTransactionId
      ? `<div style="margin-top: 20px; padding: 14px 18px; border: 2px solid #166534; border-radius: 8px; background: #f0fdf4;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #166534; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 18px; font-weight: bold;">✓</span>
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase;">Paid via UPI — Verified</div>
                <div style="font-size: 11px; color: #334155; margin-top: 2px;">UTR / Ref: <strong style="font-family: monospace;">${billing.upiTransactionId}</strong></div>
                ${billing.paymentDate ? `<div style="font-size: 10px; color: #64748b; margin-top: 1px;">Payment date: ${formatDate(billing.paymentDate)}</div>` : ''}
              </div>
            </div>
          </div>`
      : billing.paymentStatus !== "paid" && qrDataUrl
        ? `<div style="margin-top: 20px; padding: 16px; border: 2px solid #0d9488; border-radius: 8px; background: #f0fdfa; display: flex; align-items: center; gap: 20px;">
            <div style="text-align: center; flex-shrink: 0;">
              <img src="${qrDataUrl}" alt="UPI QR Code" style="width: 140px; height: 140px; border: 2px solid #1e293b; border-radius: 8px; padding: 4px; background: #fff;" />
              <div style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px;">Scan & Pay ₹${totalAmount}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a;">Pay via UPI — Scan QR Code</div>
              <div style="font-size: 11px; color: #334155; margin-top: 4px;">UPI ID: <strong style="font-family: monospace;">nivoracare@icici</strong></div>
              <div style="font-size: 11px; color: #334155;">Payee: <strong>Nivora Care Hospital</strong></div>
              <div style="font-size: 11px; color: #334155;">Amount: <strong style="color: #0d9488;">₹${totalAmount}</strong></div>
              <div style="font-size: 11px; color: #334155;">Ref: <strong>${invoiceNumber}</strong></div>
              <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Scan with Google Pay, PhonePe, Paytm, BHIM, Cred, or any UPI app.</div>
            </div>
          </div>`
        : '';

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoiceNumber}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              background: #ffffff;
              padding: 24px;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
            .hosp-title { font-size: 20px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px; }
            .hosp-subtitle { font-size: 11px; font-weight: 600; color: #0d9488; margin-top: 2px; }
            .hosp-contact { font-size: 11px; color: #475569; margin-top: 2px; }
            .hosp-badges { display: flex; gap: 8px; margin-top: 6px; }
            .tag { display: inline-block; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 3px; font-size: 10px; font-weight: 700; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.2px; }
            .badge-paid { background-color: #dcfce7; color: #166534; }
            .badge-pending { background-color: #fee2e2; color: #991b1b; }
            .badge-partially_paid { background-color: #fef3c7; color: #92400e; }
            .inv-meta { text-align: right; }
            .inv-num { font-size: 14px; font-weight: bold; margin-top: 6px; }
            .inv-date { font-size: 11px; color: #64748b; }
            .details-grid { display: flex; gap: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; }
            .details-col { flex: 1; }
            .col-title { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
            .name-highlight { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
            .info-line { font-size: 12px; color: #334155; margin-bottom: 2px; }
            .info-label { font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #475569; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row td { font-weight: 900; font-size: 16px; border-top: 2px solid #0f172a; padding: 12px 10px; color: #2563eb; }
            .footer-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; }
            .terms { font-size: 11px; color: #64748b; max-width: 380px; }
            .sign-box { text-align: center; }
            .sign-line { width: 180px; border-bottom: 1px solid #475569; height: 35px; margin-bottom: 4px; }
            @page { size: A4 portrait; margin: 12mm 15mm; }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="/nivora-logo.png" alt="Nivora Care Hospital" style="height: 56px; width: 56px; object-fit: contain; border-radius: 8px;" />
              <div>
                <div class="hosp-title">NIVORA CARE HOSPITAL</div>
                <div class="hosp-subtitle">Care • Trust • Healing | Multi-Specialty Healthcare</div>
                <div class="hosp-contact">Outer Ring Road, Near AIIMS Metro, New Delhi - 110029, India</div>
                <div class="hosp-contact">Phone: +91 98765 43210 • Emergency: 108 / 112 • Email: billing@nivoracare.com</div>
                <div class="hosp-badges">
                  <span class="tag">NABH ACCREDITED (NABH-2023-0412)</span>
                  <span class="tag">GSTIN: 07AAAAA0000A1Z5</span>
                  <span class="tag">REG: DL-HOSP-2024-8891</span>
                </div>
              </div>
            </div>
            <div class="inv-meta">
              <span class="badge ${billing.paymentStatus === 'paid' ? 'badge-paid' : billing.paymentStatus === 'partially_paid' ? 'badge-partially_paid' : 'badge-pending'}">
                ${billing.paymentStatus === 'paid' ? 'PAID INVOICE' : 'PAYMENT PENDING'}
              </span>
              <div class="inv-num">Tax Invoice #${invoiceNumber}</div>
              <div class="inv-date">Date: ${formatDate(billing.createdAt)}</div>
              ${billing.paymentDate ? `<div class="inv-date">Paid on: ${formatDate(billing.paymentDate)} (${billing.paymentMethod?.toUpperCase() || 'CASH'})</div>` : ''}
            </div>
          </div>

          <div class="details-grid">
            <div class="details-col">
              <div class="col-title">Billed to (Patient Details)</div>
              <div class="name-highlight">${patient.name || '—'}</div>
              ${patient.abhaId ? `<div class="info-line"><span class="info-label">ABHA ID:</span> <strong style="color:#0284c7;">${patient.abhaId}</strong></div>` : ''}
              <div class="info-line"><span class="info-label">Age / Gender:</span> ${patient.age ? `${patient.age} yrs` : '—'} / ${patient.gender || '—'}</div>
              <div class="info-line"><span class="info-label">Phone:</span> +91 ${patient.contactNumber ? String(patient.contactNumber).replace(/^(\+91|91)/, '') : '—'}</div>
              <div class="info-line"><span class="info-label">Email:</span> ${patient.email || '—'}</div>
              ${patient.address ? `<div class="info-line"><span class="info-label">Address:</span> ${patient.address}</div>` : ''}
            </div>
            <div class="details-col">
              <div class="col-title">Consultation Details</div>
              <div class="name-highlight">Dr. ${doctor.name || 'Assigned Physician'}</div>
              <div class="info-line"><span class="info-label">Specialization:</span> ${doctor.specialization || 'General'} (${doctor.department || 'Medicine'})</div>
              <div class="info-line"><span class="info-label">Appointment Date:</span> ${formatDate(appointment.appointmentDate)} ${appointment.timeSlot ? `at ${appointment.timeSlot}` : ''}</div>
              ${appointment.reasonForVisit ? `<div class="info-line"><span class="info-label">Reason for visit:</span> ${appointment.reasonForVisit}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Description / Procedure (SAC / HSN Code: 999312)</th>
                <th style="width: 140px;" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(billing.itemizedCharges || []).map((c, i) => `
                <tr style="${i % 2 === 0 ? 'background:#fff;' : 'background:#f8fafc;'}">
                  <td class="text-center" style="color: #64748b;">${i + 1}</td>
                  <td style="font-weight: 500;">${c.description}</td>
                  <td class="text-right" style="font-family: monospace; font-size: 13px;">₹${Number(c.cost || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2" class="text-right" style="color: #0f172a;">Total Amount Payable:</td>
                <td class="text-right" style="font-family: monospace;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          ${upiPrintSection}

          <div class="footer-flex">
            <div class="terms">
              <strong>Statutory Compliance & Payment Notes:</strong><br />
              • GST Exemption on Healthcare Services under Notification No. 12/2017-Central Tax (Rate).<br />
              • Accepted payment modes: UPI (BHIM, PhonePe, GPay, Paytm), RuPay / Cards, Net Banking, PM-JAY / CGHS / TPA Insurance, and Cash.<br />
              • This is an official computer-generated tax invoice issued by Nivora Care Hospital.
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div style="font-size: 11px; font-weight: bold; color: #334155;">Authorized Signatory</div>
              <div style="font-size: 10px; color: #64748b;">Accounts & Billing Department</div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
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
            <div className="flex items-start gap-4">
              <img
                src="/nivora-logo.png"
                alt="Nivora Care Hospital"
                className="h-14 w-14 rounded-xl border border-slate-200 bg-white p-1 object-contain shadow-xs flex-shrink-0"
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Nivora Care Hospital
                </h1>
                <p className="mt-0.5 text-xs font-semibold text-teal-700 uppercase tracking-wide">
                  Care • trust • healing
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Outer Ring Road, Near AIIMS Metro, New Delhi - 110029, India
                </p>
                <p className="text-xs text-slate-600">
                  Phone: +91 98765 43210 • Emergency: 108 / 112 • Email: billing@nivoracare.com
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                    NABH ACCREDITED (NABH-2023-0412)
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    GSTIN: 07AAAAA0000A1Z5
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    ABDM CONNECTED
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 sm:text-right">
              <span
                className={`inline-block rounded-md px-3 py-1 text-xs font-bold ${
                  billing.paymentStatus === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : billing.paymentStatus === "partially_paid"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {billing.paymentStatus === "paid" ? "Paid invoice" : "Payment pending"}
              </span>
              <p className="mt-3 text-sm font-bold text-slate-800">Tax invoice: #{invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(billing.createdAt)}</p>
              {billing.paymentDate && (
                <p className="text-xs text-slate-500">
                  Paid on: {formatDate(billing.paymentDate)} ({billing.paymentMethod?.toUpperCase() || "CASH"})
                </p>
              )}
            </div>
          </div>

          {/* Patient & Doctor Two-Column Information */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Billed to (patient details)
              </h3>
              <p className="mt-1 text-base font-bold text-slate-900">{patient.name || "—"}</p>
              <div className="mt-1 text-xs space-y-0.5 text-slate-600">
                {patient.abhaId && (
                  <p>
                    <span className="font-semibold text-slate-700">ABHA ID:</span>{" "}
                    <span className="font-bold text-blue-700">{patient.abhaId}</span>
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-700">Age / gender:</span>{" "}
                  {patient.age ? `${patient.age} yrs` : "—"} / {patient.gender || "—"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Contact:</span>{" "}
                  +91 {patient.contactNumber ? String(patient.contactNumber).replace(/^(\+91|91)/, '') : "—"}
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
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Consultation details
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
                  <span className="font-semibold text-slate-700">Appointment date:</span>{" "}
                  {formatDate(appointment.appointmentDate)} {appointment.timeSlot ? `at ${appointment.timeSlot}` : ""}
                </p>
                {appointment.reasonForVisit && (
                  <p>
                    <span className="font-semibold text-slate-700">Reason for visit:</span>{" "}
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
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Description / procedure (SAC: 999312)</th>
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
                    Total amount payable:
                  </td>
                  <td className="py-3 px-4 text-right text-lg font-black text-blue-600 font-mono">
                    ₹{totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Interactive Hospital Payment Gateway Section (When Unpaid) */}
          {billing.paymentStatus !== "paid" && (
            <div className="mt-6 no-print rounded-2xl border border-teal-200 bg-teal-50/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span>💳 Settle Invoice Online or at Counter</span>
                    <span className="rounded-full bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5">Instant Settlement</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scan the UPI QR code below, launch Razorpay Checkout (Cards/NetBanking), or submit Health Insurance claim
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/pay/${billing._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <span>🔗 Open Secure Gateway</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* Dynamic UPI QR Code Section */}
              <UpiPaymentBox
                billing={billing}
                onPaymentSuccess={handleUpiPaymentSuccess}
                isPatient={isPatient}
              />
            </div>
          )}

          {billing.paymentStatus === "paid" && (
            <div className="mt-6 no-print rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <span>✓</span>
                <span>INVOICE FULLY SETTLED VIA {(billing.paymentMethod || "CASH").toUpperCase()}</span>
              </span>
              {billing.upiTransactionId && (
                <p className="text-[11px] font-mono text-slate-600">
                  UTR: <strong>{billing.upiTransactionId}</strong>
                </p>
              )}
            </div>
          )}

          {/* Payment Terms & Signatures */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-500 max-w-sm">
              <p className="font-semibold text-slate-700">Statutory compliance & payment notes:</p>
              <p className="mt-1">
                • GST exemption on clinical healthcare services under Notification No. 12/2017-Central Tax (Rate).<br />
                • Accepted payment modes: UPI (BHIM, PhonePe, GPay, Paytm), RuPay / Cards, Net Banking, PM-JAY / CGHS / TPA Insurance, and Cash.
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 w-44 border-b border-slate-400"></div>
              <p className="mt-1 text-xs font-semibold text-slate-600">Authorized signatory</p>
              <p className="text-[10px] text-slate-400">Accounts & Billing Department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;

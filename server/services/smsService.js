/**
 * SMS Service – zero-cost implementation using Nodemailer Email-to-SMS gateway.
 *
 * Most Indian carriers support email-to-SMS gateways (e.g. number@carrier.sms.com).
 * If SMTP credentials are configured the SMS is delivered via email-to-SMS.
 * If no carrier gateway is configured, the SMS link is logged to the console so
 * development works without any third-party account.
 *
 * For production, set SMS_GATEWAY_DOMAIN in .env to your carrier's gateway domain
 * (e.g. "sms.vodafone.in" or "airtelap.com") and set SMTP_* env vars.
 *
 * This design uses only nodemailer which is already installed — no paid API needed.
 */

import nodemailer from "nodemailer";

const OPD_FEE = Number(process.env.OPD_FEE || 500);

/**
 * Build the raw payment link for a billing record.
 * @param {string} billingId
 * @returns {string}
 */
export const buildPaymentLink = (billingId) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${clientUrl}/pay/${billingId}`;
};

/**
 * Send an SMS via email-to-SMS gateway or fall back to console log.
 *
 * @param {string} phoneNumber  10-digit mobile number (no +91 prefix needed)
 * @param {string} message      Text content of the SMS
 * @returns {Promise<{ sent: boolean; method: string; preview?: string }>}
 */
export const sendSms = async (phoneNumber, message) => {
  const gateway = process.env.SMS_GATEWAY_DOMAIN;

  // ── Fallback: just log if no gateway configured ──────────────────────────
  if (!gateway) {
    console.log(
      `[SMS Simulation] To: ${phoneNumber}\n[SMS Simulation] Message: ${message}`
    );
    return { sent: true, method: "simulated" };
  }

  // ── Email-to-SMS via carrier gateway ─────────────────────────────────────
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  let transporter;
  let preview;
  let isTest = false;

  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });
  } else {
    isTest = true;
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch {
      // Last resort – simulate
      console.log(`[SMS Fallback] ${phoneNumber}: ${message}`);
      return { sent: true, method: "simulated" };
    }
  }

  // Email-to-SMS format: recipient is <10digitnumber>@<gateway>
  const toAddress = `${phoneNumber.replace(/\D/g, "")}@${gateway}`;

  const info = await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      `"Nivora Care Hospital" <billing@nivoracare.com>`,
    to: toAddress,
    subject: "",       // SMS gateways ignore subject
    text: message,     // Plain text only; no HTML in SMS
  });

  if (isTest && nodemailer.getTestMessageUrl) {
    preview = nodemailer.getTestMessageUrl(info);
  }

  return { sent: true, method: isTest ? "ethereal" : "gateway", preview };
};

/**
 * Send a payment link SMS to a patient's mobile number.
 *
 * @param {string} phoneNumber   10-digit mobile number
 * @param {string} billingId     Billing document _id
 * @param {string} patientName   Used to personalise the message
 * @param {number} [amount]      Amount due (defaults to env OPD_FEE)
 * @returns {Promise<object>}
 */
export const sendPaymentLinkSms = async (
  phoneNumber,
  billingId,
  patientName = "Patient",
  amount
) => {
  const link = buildPaymentLink(billingId);
  const due = amount !== undefined ? amount : OPD_FEE;
  const message =
    `Dear ${patientName}, your Nivora Care Hospital bill of ₹${due} is due. ` +
    `Pay securely online: ${link} . Ignore if already paid. -Nivora Care`;

  return sendSms(phoneNumber, message);
};

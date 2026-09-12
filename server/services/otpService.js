/**
 * OTP Service – in-memory one-time password store for patient registration.
 *
 * OTPs are keyed by the patient's normalized mobile number and expire after
 * OTP_TTL_MS (default 5 minutes). A max attempt count guards against guessing.
 * In-memory storage is intentional for this self-contained hospital demo; for a
 * production deployment swap this out for a Redis-backed store.
 */

const OTP_TTL_MS = Number(process.env.OTP_TTL_MS || 5 * 60 * 1000);
const MAX_ATTEMPTS = 5;

const store = new Map();

export const normalizeContact = (contactNumber) =>
  String(contactNumber || "").replace(/\D/g, "");

/**
 * Generate and persist a 6-digit OTP for a mobile number.
 * @param {string} contactNumber
 * @returns {string} the generated OTP (deliver to the user via SMS/email)
 */
export const generateOtp = (contactNumber) => {
  const key = normalizeContact(contactNumber);
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  store.set(key, {
    otp,
    attempts: 0,
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  return otp;
};

/**
 * Verify a submitted OTP for a mobile number. A successful check consumes the OTP.
 * @param {string} contactNumber
 * @param {string} otp
 * @returns {{ valid: boolean; message: string }}
 */
export const verifyOtp = (contactNumber, otp) => {
  const key = normalizeContact(contactNumber);

  if (!otp) {
    return { valid: false, message: "OTP is required" };
  }

  const record = store.get(key);
  if (!record) {
    return { valid: false, message: "No OTP was requested for this number. Please request a new code." };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return { valid: false, message: "OTP has expired. Please request a new code." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return { valid: false, message: "Too many incorrect attempts. Please request a new code." };
  }

  if (record.otp !== String(otp).trim()) {
    record.attempts += 1;
    return { valid: false, message: "Incorrect OTP. Please check and try again." };
  }

  store.delete(key);
  return { valid: true, message: "OTP verified successfully" };
};

/**
 * Test-only helper: whether an OTP currently exists for a number.
 * @param {string} contactNumber
 * @returns {boolean}
 */
export const hasActiveOtp = (contactNumber) =>
  store.has(normalizeContact(contactNumber));
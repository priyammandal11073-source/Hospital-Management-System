/**
 * Doctor name formatting utilities
 * Ensures consistent "Dr." prefix handling across the application
 */

/**
 * Formats a doctor's name with proper "Dr." prefix
 * - Removes any existing "Dr." prefix before adding one
 * - Handles null/undefined gracefully
 * @param {string} name - Doctor's name (may or may not have "Dr." prefix)
 * @param {string} fallback - Fallback name if name is empty
 * @returns {string} Formatted name with single "Dr." prefix
 */
export function formatDoctorName(nameOrDoctor, fallback = "Physician") {
  const rawName =
    typeof nameOrDoctor === "object" && nameOrDoctor !== null
      ? nameOrDoctor.name
      : nameOrDoctor;

  const target =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim()
      : typeof fallback === "string" && fallback.trim()
      ? fallback.trim()
      : "Physician";

  // If the target is a placeholder like "—", "N/A", or "None", don't prefix with "Dr."
  if (/^[-—–/]+$/.test(target) || /^(n\/?a|none)$/i.test(target)) {
    return target;
  }

  // Remove any existing "Dr." prefix (single or multiple, case-insensitive)
  const withoutPrefix = target.replace(/^(?:dr\.?\s*)+/i, "").trim();

  if (!withoutPrefix) {
    return "Dr. Physician";
  }

  return `Dr. ${withoutPrefix}`;
}

/**
 * Formats a doctor's name without "Dr." prefix
 * @param {string|object} nameOrDoctor - Doctor's name or doctor object
 * @param {string} fallback - Fallback name
 * @returns {string} Name without "Dr." prefix
 */
export function getDoctorName(nameOrDoctor, fallback = "Physician") {
  const rawName =
    typeof nameOrDoctor === "object" && nameOrDoctor !== null
      ? nameOrDoctor.name
      : nameOrDoctor;

  if (!rawName || typeof rawName !== "string") {
    return fallback;
  }

  const trimmed = rawName.trim();
  if (!trimmed) {
    return fallback;
  }

  // Remove any existing "Dr." prefix (single or multiple)
  return trimmed.replace(/^(?:dr\.?\s*)+/i, "").trim() || fallback;
}

/**
 * Gets the display name for a doctor object
 * @param {object|string} doctor - Doctor object with name property or doctor name string
 * @param {string} fallback - Fallback name
 * @returns {string} Formatted name with single "Dr." prefix
 */
export function getDoctorDisplayName(doctor, fallback = "Physician") {
  return formatDoctorName(doctor, fallback);
}

export default {
  formatDoctorName,
  getDoctorName,
  getDoctorDisplayName,
};
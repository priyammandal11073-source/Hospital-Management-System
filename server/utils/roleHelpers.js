/**
 * Role authorization helpers for Nivora Care HMS.
 */

export const BILLING_STAFF_ROLES = [
  "admin",
  "super_admin",
  "operations_admin",
  "finance_admin",
  "clinical_admin",
  "hr_admin",
  "accountant",
  "receptionist",
  "pharmacist",
  "doctor",
  "nurse",
  "emergency",
  "diagnostic_admin",
  "lab_technician",
  "radiologist",
  "pathologist",
  "radiology_technician",
];

const BILLING_STAFF_SET = new Set(BILLING_STAFF_ROLES);

/**
 * Validates whether a given staff user role is authorized to perform billing operations.
 * Allows super admins, finance admins, accountants, receptionists, pharmacists, doctors, etc.
 */
export const isBillingAuthorizedStaff = (role) => {
  if (!role || typeof role !== "string") return false;
  return BILLING_STAFF_SET.has(role) || role.endsWith("_admin");
};


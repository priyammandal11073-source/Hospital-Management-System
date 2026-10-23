import { z } from "zod";

/**
 * zod schemas for authentication endpoints.
 * Controllers still normalize values (e.g. lower-casing) defensively; these
 * schemas exist to reject malformed payloads before they reach business logic.
 */

const email = z.email("A valid email is required");
const password = z.string().min(1, "Password is required");
const strongPassword = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");
const indianMobile = z.string().regex(
  /^[6-9]\d{9}$/,
  "Enter a valid 10-digit Indian mobile number"
);

const ALLOWED_REGISTRATION_ROLES = [
  "patient",
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "diagnostic_admin",
  "pathologist",
  "radiologist",
  "lab_technician",
  "radiology_technician",
  "emergency",
];

// POST /api/auth/login
export const loginSchema = z.object({
  email,
  password,
});

// POST /api/auth/register
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email,
  password: strongPassword,
  role: z.enum(ALLOWED_REGISTRATION_ROLES, { message: "Invalid role specified" }).optional(),
});

// POST /api/patient-auth/login
export const patientLoginSchema = z.object({
  email,
  password,
});

// POST /api/patient-auth/otp/send
export const otpSendSchema = z.object({
  contactNumber: indianMobile,
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /.+@.+\..+/.test(value), "A valid email is required"),
});

// POST /api/patient-auth/register
export const patientRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email,
  password: strongPassword,
  age: z.coerce.number().int("Age must be a whole number").min(0, "Age cannot be negative").max(130, "Age is invalid"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender must be Male, Female, or Other" }),
  contactNumber: indianMobile,
  abhaId: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length <= 30, "ABHA ID is too long"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

// POST /api/patient-auth/forgot-password
export const forgotPasswordSchema = z.object({
  email,
});

// POST /api/patient-auth/reset-password
export const resetPasswordSchema = z.object({
  email,
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  newPassword: strongPassword,
});
import { z } from "zod";

const indianMobile = z.string().regex(
  /^[6-9]\d{9}$/,
  "Enter a valid 10-digit Indian mobile number"
);

export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  age: z.coerce.number().int("Age must be a whole number").min(0, "Age cannot be negative").max(130, "Age is invalid"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender must be Male, Female, or Other" }),
  contactNumber: indianMobile,
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /.+@.+\..+/.test(v), "A valid email is required"),
  address: z.string().trim().optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  abhaId: z.string().trim().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

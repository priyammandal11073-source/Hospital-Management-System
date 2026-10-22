import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createPrescriptionSchema = z.object({
  patient: objectId,
  doctor: objectId.optional(),
  appointment: objectId.optional(),
  diagnosis: z.string().trim().min(1, "Diagnosis is required"),
  symptoms: z.union([z.array(z.string()), z.string()]).optional(),
  vitals: z.record(z.any()).optional(),
  medications: z.array(z.record(z.any())).min(1, "At least one medication is required"),
  labTestsRecommended: z.union([z.array(z.string()), z.string()]).optional(),
  advice: z.string().optional(),
  followUpDate: z.string().optional(),
});

export const updatePrescriptionSchema = z.object({
  diagnosis: z.string().trim().min(1).optional(),
  symptoms: z.union([z.array(z.string()), z.string()]).optional(),
  vitals: z.record(z.any()).optional(),
  medications: z.array(z.record(z.any())).optional(),
  labTestsRecommended: z.union([z.array(z.string()), z.string()]).optional(),
  advice: z.string().optional(),
  followUpDate: z.string().optional(),
});

import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createBedSchema = z.object({
  bedNumber: z.string().trim().min(1, "Bed number is required"),
  ward: z.string().trim().min(1, "Ward is required"),
  floor: z.string().trim().optional(),
  dailyRate: z.coerce.number().min(0, "Daily rate must be non-negative").optional(),
  features: z.record(z.string(), z.any()).optional(),
});

export const allocateBedSchema = z.object({
  patient: objectId,
  attendingDoctor: objectId,
  admissionReason: z.string().trim().min(2, "Admission reason is required"),
  expectedDischargeDate: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

export const transferBedSchema = z.object({
  targetBedId: objectId,
  transferReason: z.string().trim().min(2, "Transfer reason is required"),
});

export const updateBedStatusSchema = z.object({
  status: z.enum(["available", "occupied", "maintenance", "cleaning", "reserved"], {
    message: "Invalid bed status",
  }),
});

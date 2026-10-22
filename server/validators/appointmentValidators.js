import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId format");

export const createAppointmentSchema = z.object({
  patient: objectId,
  doctor: objectId,
  appointmentDate: z.string().min(1, "Appointment date is required"),
  timeSlot: z.string().trim().min(1, "Time slot is required"),
  reasonForVisit: z.string().trim().min(2, "Reason for visit must be at least 2 characters"),
  paymentMethod: z.enum(["cash", "card", "upi", "insurance"]).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "waiting",
    "checked_in",
    "in_consultation",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ], { message: "Invalid appointment status" }),
});

export const updateAppointmentChecklistSchema = z.object({
  prepChecklist: z.any().optional(),
});

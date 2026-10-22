import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Doctor name must be at least 2 characters"),
  specialization: z.string().trim().min(2, "Specialization is required"),
  department: z.string().trim().min(2, "Department is required"),
  contactNumber: z.string().trim().min(5, "Contact number is required"),
  email: z.string().trim().email("Valid email is required"),
  availableDays: z.array(z.string()).optional(),
  availableTimeSlots: z.array(z.string()).optional(),
  weeklySchedule: z.array(z.record(z.any())).optional(),
  leaves: z.array(z.record(z.any())).optional(),
});

export const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).optional(),
  specialization: z.string().trim().min(2).optional(),
  department: z.string().trim().min(2).optional(),
  contactNumber: z.string().trim().min(5).optional(),
  email: z.string().trim().email().optional(),
  availableDays: z.array(z.string()).optional(),
  availableTimeSlots: z.array(z.string()).optional(),
  weeklySchedule: z.array(z.record(z.any())).optional(),
  leaves: z.array(z.record(z.any())).optional(),
});

export const addDoctorLeaveSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

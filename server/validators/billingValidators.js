import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid ObjectId format");

const paymentStatuses = ["pending", "paid", "partially_paid", "cancelled", "refunded"];
const paymentMethods = ["cash", "card", "insurance", "upi", "netbanking", "wallet", "cheque", "razorpay"];

export const createBillingSchema = z.object({
  patient: objectId,
  appointment: objectId.optional(),
  itemizedCharges: z.array(
    z.object({
      description: z.string().trim().min(1, "Charge description is required"),
      cost: z.coerce.number().min(0, "Cost must be a non-negative number"),
    })
  ).min(1, "At least one itemized charge is required"),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentStatus: z.enum(paymentStatuses).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(paymentStatuses, { message: "Invalid payment status" }),
  paymentMethod: z.enum(paymentMethods).optional(),
  transactionId: z.string().trim().optional(),
});

import Razorpay from "razorpay";
import crypto from "crypto";
import env from "../config/env.js";
import Billing from "../models/Billing.js";

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  if (env.razorpay.isConfigured) {
    return new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return null;
};

/**
 * @desc    Create Razorpay order for an invoice
 * @route   POST /api/razorpay/create-order
 * @access  Protected (Patient owner or authorized staff)
 */
export const createOrder = async (req, res) => {
  try {
    const { billingId } = req.body;
    if (!billingId) {
      return res.status(400).json({ message: "Billing ID is required." });
    }

    const billing = await Billing.findById(billingId).populate("patient", "name email contactNumber");
    if (!billing) {
      return res.status(404).json({ message: "Billing invoice not found." });
    }

    // Ownership & Authorization:
    // Only the patient who owns the invoice, or authorized clinical/desk staff, may create payment orders
    const patientUser = req.patient;
    const staffUser = req.user;
    const billingPatientId = billing.patient?._id ? billing.patient._id.toString() : billing.patient?.toString();

    if (patientUser) {
      const requesterPatientId = (patientUser._id || patientUser.id)?.toString();
      if (!billingPatientId || billingPatientId !== requesterPatientId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only create payment orders for your own billing records.",
        });
      }
    } else if (staffUser) {
      const ALLOWED_BILLING_STAFF = ["admin", "receptionist", "pharmacist", "emergency", "doctor"];
      if (!ALLOWED_BILLING_STAFF.includes(staffUser.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Staff role not authorized for billing operations.",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create a payment order.",
      });
    }

    const amountInPaise = Math.round(Number(billing.totalAmount || 0) * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ message: "Invalid billing amount." });
    }

    // Fail closed in production if Razorpay credentials are missing
    if (env.isProduction && !env.razorpay.isConfigured) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway error: Razorpay credentials are not configured in production.",
      });
    }

    const razorpay = getRazorpayInstance();
    const keyId = env.razorpay.keyId;

    if (razorpay) {
      // Real Razorpay API Order Creation
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${billing._id.toString().slice(-6)}`,
        notes: {
          patientName: billing.patient?.name || "Patient",
          billingId: billing._id.toString(),
        },
      };

      const order = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        patientDetails: {
          name: billing.patient?.name || "",
          email: billing.patient?.email || "",
          contact: billing.patient?.contactNumber || "",
        },
      });
    }

    // In development / test environment only: allow local non-production testing
    if (env.isDevelopment || env.isTest) {
      return res.status(200).json({
        success: true,
        orderId: null,
        amount: amountInPaise,
        currency: "INR",
        keyId: keyId || "rzp_test_simulated",
        patientDetails: {
          name: billing.patient?.name || "",
          email: billing.patient?.email || "",
          contact: billing.patient?.contactNumber || "",
        },
      });
    }

    return res.status(503).json({
      success: false,
      message: "Razorpay payment gateway is not configured.",
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: error.message || "Failed to create Razorpay order." });
  }
};

/**
 * @desc    Verify Razorpay payment signature & update invoice status
 * @route   POST /api/razorpay/verify-payment
 * @access  Protected (Patient owner or authorized staff)
 */
export const verifyPayment = async (req, res) => {
  try {
    const { billingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!billingId || !razorpayPaymentId) {
      return res.status(400).json({ message: "Missing required payment parameters." });
    }

    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found." });
    }

    // Ownership & Authorization:
    const patientUser = req.patient;
    const staffUser = req.user;
    const billingPatientId = billing.patient?._id ? billing.patient._id.toString() : billing.patient?.toString();

    if (patientUser) {
      const requesterPatientId = (patientUser._id || patientUser.id)?.toString();
      if (!billingPatientId || billingPatientId !== requesterPatientId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only verify payments for your own billing records.",
        });
      }
    } else if (staffUser) {
      const ALLOWED_BILLING_STAFF = ["admin", "receptionist", "pharmacist", "emergency", "doctor"];
      if (!ALLOWED_BILLING_STAFF.includes(staffUser.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Staff role not authorized for billing verification.",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication required to verify payments.",
      });
    }

    const secret = env.razorpay.keySecret;

    // In production, razorpay key secret is strictly mandatory.
    // Never allow unverified payments when running in production mode.
    if (env.isProduction && !secret) {
      return res.status(503).json({
        message: "Payment processing error: Razorpay gateway secret is not configured in production.",
      });
    }

    // Signature verification is MANDATORY whenever a key secret is configured.
    if (secret) {
      if (!razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({
          message: "Payment signature parameters are required to verify this payment.",
        });
      }

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Razorpay signature verification failed. Invalid payment signature." });
      }
    }

    // Mark billing as paid
    billing.paymentStatus = "paid";
    billing.paymentMethod = "razorpay";
    billing.razorpayPaymentId = razorpayPaymentId;
    if (razorpayOrderId) billing.razorpayOrderId = razorpayOrderId;
    if (razorpaySignature) billing.razorpaySignature = razorpaySignature;

    await billing.save();

    const updatedBilling = await Billing.findById(billingId)
      .populate("patient", "name email contactNumber")
      .populate({
        path: "appointment",
        populate: { path: "doctor", select: "name specialization department" },
      });

    return res.status(200).json({
      success: true,
      message: "Razorpay payment verified & invoice marked as paid successfully!",
      billing: updatedBilling,
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ message: error.message || "Failed to verify Razorpay payment." });
  }
};

/**
 * @desc    Razorpay server-to-server webhook (payment.captured etc.)
 * @route   POST /api/razorpay/webhook
 * @access  Webhook (signed with RAZORPAY_WEBHOOK_SECRET)
 *
 * Raw JSON body is required so the HMAC signature can be verified over the
 * exact bytes Razorpay signed. Rejects unsigned/forged payloads with 400.
 */
export const rzpWebhookHandler = async (req, res) => {
  const secret = env.razorpay.webhookSecret;
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.body;

  try {
    if (!secret || !signature || !Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature verification is required.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody.toString("utf8"))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      const billingId = payment?.notes?.billingId;

      if (billingId) {
        const billing = await Billing.findById(billingId);
        if (billing && billing.paymentStatus !== "paid") {
          billing.paymentStatus = "paid";
          billing.paymentMethod = "razorpay";
          billing.razorpayPaymentId = payment.id;
          billing.razorpayOrderId = payment.order_id;
          billing.razorpaySignature = signature;
          await billing.save();
        }
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process Razorpay webhook.",
    });
  }
};

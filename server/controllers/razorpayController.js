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
 * @access  Public
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

    const amountInPaise = Math.round(Number(billing.totalAmount || 0) * 100);
    if (amountInPaise <= 0) {
      return res.status(400).json({ message: "Invalid billing amount." });
    }

    const razorpay = getRazorpayInstance();
    const keyId = env.razorpay.keyId || "rzp_test_TZavagxglGTRZp";

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
    } else {
      // Standard Client-Side Test Checkout (order_id omitted so Razorpay SDK handles transaction in test mode without 400 error)
      return res.status(200).json({
        success: true,
        orderId: null,
        amount: amountInPaise,
        currency: "INR",
        keyId,
        patientDetails: {
          name: billing.patient?.name || "",
          email: billing.patient?.email || "",
          contact: billing.patient?.contactNumber || "",
        },
      });
    }
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: error.message || "Failed to create Razorpay order." });
  }
};

/**
 * @desc    Verify Razorpay payment signature & update invoice status
 * @route   POST /api/razorpay/verify-payment
 * @access  Public
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

    const secret = env.razorpay.keySecret;

    // Signature verification is MANDATORY whenever a key secret is configured.
    // Without this an attacker could mark an invoice as paid by posting a fake
    // payment id. The key secret is only absent in development/test mode where
    // the client runs a local (non-authoritative) checkout.
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

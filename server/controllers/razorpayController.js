import Razorpay from "razorpay";
import crypto from "crypto";
import Billing from "../models/Billing.js";

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret) {
    return new Razorpay({ key_id, key_secret });
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
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_1DP5AxB243BScq";

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

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Signature verification if secret exists and signature was sent
    if (secret && razorpayOrderId && razorpaySignature) {
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

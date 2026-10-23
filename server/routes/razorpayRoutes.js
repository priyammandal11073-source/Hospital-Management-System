import express from "express";
import { createOrder, rzpWebhookHandler, verifyPayment } from "../controllers/razorpayController.js";
import { protectStaffOrPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

// Webhook endpoint (also registered before global express.json in app.js)
router.post("/webhook", express.raw({ type: "application/json" }), rzpWebhookHandler);

// Order creation & payment verification strictly require authenticated caller (patient owner or staff)
router.post("/create-order", protectStaffOrPatient, createOrder);
router.post("/verify-payment", protectStaffOrPatient, verifyPayment);

export default router;
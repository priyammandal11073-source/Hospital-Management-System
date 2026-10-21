import express from "express";
import { createOrder, rzpWebhookHandler, verifyPayment } from "../controllers/razorpayController.js";

const router = express.Router();

// The webhook needs the raw JSON body to verify the HMAC signature, so it uses
// express.raw inline rather than the app-level express.json parser.
router.post("/webhook", express.raw({ type: "application/json" }), rzpWebhookHandler);
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

export default router;
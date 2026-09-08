import express from "express";
import {
  createBilling,
  getAllBillings,
  getBillingById,
  getRevenueSummary,
  sendBillingEmail,
  sendPaymentLinkSmsHandler,
  updatePaymentStatus,
} from "../controllers/billingController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createBilling).get(protect, getAllBillings);

// This route must be declared before /:id, otherwise "summary" is treated as an ID.
router.get("/summary", protect, restrictTo("admin"), getRevenueSummary);

router
  .route("/:id")
  .get(getBillingById);

router.patch("/:id/payment", protect, updatePaymentStatus);
router.post("/:id/send-email", protect, sendBillingEmail);
router.post("/:id/send-sms", protect, sendPaymentLinkSmsHandler);

export default router;

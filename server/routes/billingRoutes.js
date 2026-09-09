import express from "express";
import {
  createBilling,
  getAllBillings,
  getBillingById,
  getRevenueSummary,
  getRevenueAnalytics,
  sendBillingEmail,
  sendPaymentLinkSmsHandler,
  updatePaymentStatus,
} from "../controllers/billingController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, restrictTo("admin", "receptionist"), createBilling)
  .get(protect, getAllBillings);

// These routes must be declared before /:id, otherwise "summary", "revenue-summary", or "analytics" is treated as an ID.
router.get("/summary", protect, restrictTo("admin"), getRevenueSummary);
router.get("/revenue-summary", protect, restrictTo("admin"), getRevenueSummary);
router.get("/analytics", protect, getRevenueAnalytics);

router
  .route("/:id")
  .get(getBillingById);

router.patch("/:id/payment", protect, restrictTo("admin", "receptionist"), updatePaymentStatus);
router.post("/:id/send-email", protect, restrictTo("admin", "receptionist"), sendBillingEmail);
router.post("/:id/send-sms", protect, restrictTo("admin", "receptionist"), sendPaymentLinkSmsHandler);

export default router;

import express from "express";
import {
  getAllBeds,
  getBedSummary,
  getBedById,
  createBed,
  allocateBed,
  transferBed,
  dischargeBed,
  updateBedStatus,
  deleteBed,
} from "../controllers/bedController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getAllBeds)
  .post(protect, restrictTo("admin"), createBed);

// Specific route /summary must come before /:id parameter route
router.get("/summary", protect, getBedSummary);

router
  .route("/:id")
  .get(protect, getBedById)
  .delete(protect, restrictTo("admin"), deleteBed);

router.post("/:id/allocate", protect, allocateBed);
router.post("/:id/transfer", protect, transferBed);
router.post("/:id/discharge", protect, dischargeBed);
router.patch("/:id/status", protect, updateBedStatus);

export default router;

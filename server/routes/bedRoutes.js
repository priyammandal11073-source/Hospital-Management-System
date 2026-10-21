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

// Enforce authentication & staff access across bed & ward management routes
router.use(protect, restrictTo("receptionist", "nurse", "admin", "super_admin", "doctor", "emergency"));

router
  .route("/")
  .get(getAllBeds)
  .post(createBed);

// Specific route /summary must come before /:id parameter route
router.get("/summary", getBedSummary);

router
  .route("/:id")
  .get(getBedById)
  .delete(deleteBed);

router.post("/:id/allocate", allocateBed);
router.post("/:id/transfer", transferBed);
router.post("/:id/discharge", dischargeBed);
router.patch("/:id/status", updateBedStatus);

export default router;

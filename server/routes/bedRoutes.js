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
import { validate } from "../middleware/validate.js";
import {
  createBedSchema,
  allocateBedSchema,
  transferBedSchema,
  updateBedStatusSchema,
} from "../validators/bedValidators.js";

const router = express.Router();

// Enforce authentication & staff access across bed & ward management routes
router.use(protect, restrictTo("receptionist", "nurse", "admin", "super_admin", "doctor", "emergency"));

router
  .route("/")
  .get(getAllBeds)
  .post(validate(createBedSchema), createBed);

// Specific route /summary must come before /:id parameter route
router.get("/summary", getBedSummary);

router
  .route("/:id")
  .get(getBedById)
  .delete(deleteBed);

router.post("/:id/allocate", validate(allocateBedSchema), allocateBed);
router.post("/:id/transfer", validate(transferBedSchema), transferBed);
router.post("/:id/discharge", dischargeBed);
router.patch("/:id/status", validate(updateBedStatusSchema), updateBedStatus);

export default router;

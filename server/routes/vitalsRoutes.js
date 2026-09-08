import express from "express";
import {
  getPatientVitals,
  recordVitals,
  deleteVitals,
  getRecentVitalsAlerts,
} from "../controllers/vitalsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/alerts/recent", getRecentVitalsAlerts);
router.get("/:patientId", getPatientVitals);
router.post("/", recordVitals);
router.delete("/:id", deleteVitals);

export default router;

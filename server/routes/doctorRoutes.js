import express from "express";
import {
  createDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
} from "../controllers/doctorController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, restrictTo("admin"), createDoctor)
  .get(protect, getAllDoctors);

router
  .route("/:id")
  .get(protect, getDoctorById)
  .put(protect, restrictTo("admin"), updateDoctor)
  .delete(protect, restrictTo("admin"), deleteDoctor);

export default router;

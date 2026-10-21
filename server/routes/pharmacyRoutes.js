import express from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  getPharmacyTelemetry,
  getPrescriptionQueue,
  getPrescriptionForDispensing,
  dispensePrescription,
  flagPrescriptionIssue,
  getPharmacyInventory,
  addOrUpdateMedicine,
  getBatches,
  getPharmacyAlerts,
  getStockMovements,
  recordStockAdjustment,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder,
  getPharmacyReturns,
  processPharmacyReturn,
  getPharmacyStaff,
} from "../controllers/pharmacyController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Restrict operational pharmacy management to pharmacist, admin, super_admin, emergency, doctor
router.use(restrictTo("pharmacist", "admin", "super_admin", "emergency", "doctor"));

// 1. Telemetry & Analytics
router.get("/telemetry", getPharmacyTelemetry);
router.get("/alerts", getPharmacyAlerts);

// 2. Prescription Queue & Dispensing
router.get("/queue", getPrescriptionQueue);
router.get("/dispense/:id", getPrescriptionForDispensing);
router.post("/dispense/:id", dispensePrescription);
router.post("/flag-prescription/:id", flagPrescriptionIssue);

// 3. Inventory & Batches
router.get("/inventory", getPharmacyInventory);
router.post("/inventory", addOrUpdateMedicine);
router.get("/batches", getBatches);

// 4. Stock Management & Movements
router.get("/stock-movements", getStockMovements);
router.get("/movements", getStockMovements);
router.post("/adjust-stock", recordStockAdjustment);

// 5. Suppliers & Procurement
router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);
router.get("/purchase-orders", getPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrder);
router.post("/goods-receipt/:id", receivePurchaseOrder);

// 6. Returns & Damage
router.get("/returns", getPharmacyReturns);
router.post("/returns", processPharmacyReturn);

// 7. Staff & Shifts
router.get("/staff", getPharmacyStaff);

export default router;

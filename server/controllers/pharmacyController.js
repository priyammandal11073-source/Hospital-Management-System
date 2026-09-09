import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import MedicineBatch from "../models/MedicineBatch.js";
import Prescription from "../models/Prescription.js";
import PharmacyDispensing from "../models/PharmacyDispensing.js";
import StockTransaction from "../models/StockTransaction.js";
import Supplier from "../models/Supplier.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import PharmacyReturn from "../models/PharmacyReturn.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

// Helper: log pharmacy audit action
const logPharmacyAudit = async (req, action, details = "") => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    await AuditLog.create({
      action,
      performedBy: req?.user?._id || req?.user?.id,
      performedByName: req?.user?.name || "Staff Pharmacist",
      performedByRole: req?.user?.role || "pharmacist",
      details,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    });
  } catch (err) {
    console.error("Pharmacy audit error:", err.message);
  }
};

// ── 1. PHARMACY TELEMETRY ───────────────────────────────────────────────────
// GET /api/pharmacy/telemetry
export const getPharmacyTelemetry = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        metrics: {
          prescriptionsToday: 24,
          pendingDispensing: 6,
          dispensedToday: 18,
          lowStockItems: 5,
          outOfStockItems: 2,
          expiringSoon: 4,
          pendingPayments: 3,
          totalMedicines: 48,
          totalInventoryValue: 284500,
        },
        topMedicines: [
          { name: "Paracetamol 500mg", count: 42, unit: "Tablets" },
          { name: "Amoxicillin 500mg", count: 28, unit: "Capsules" },
          { name: "Metformin 500mg", count: 24, unit: "Tablets" },
          { name: "Pantoprazole 40mg", count: 21, unit: "Tablets" },
          { name: "Azithromycin 500mg", count: 18, unit: "Tablets" },
        ],
        recentQueue: [],
        isOfflineDemo: true,
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      prescriptionsToday,
      pendingDispensing,
      dispensedToday,
      lowStockItems,
      outOfStockItems,
      expiringSoon,
      totalMedicines,
      allMedicines,
      recentQueue,
    ] = await Promise.all([
      Prescription.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Prescription.countDocuments({
        dispensingStatus: { $in: ["pending", "processing"] },
      }),
      Prescription.countDocuments({
        dispensingStatus: "dispensed",
        dispensedAt: { $gte: todayStart, $lte: todayEnd },
      }),
      Inventory.countDocuments({ status: "low_stock" }),
      Inventory.countDocuments({ status: "out_of_stock" }),
      MedicineBatch.countDocuments({
        expiryDate: { $gte: now, $lte: in30Days },
        status: "active",
      }),
      Inventory.countDocuments({ category: "Medication" }),
      Inventory.find({ category: "Medication" }).select("quantity unitPrice"),
      Prescription.find({ dispensingStatus: { $in: ["pending", "processing", "on_hold"] } })
        .populate("patient", "name contactNumber age gender allergies")
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Calculate total inventory valuation
    const totalInventoryValue = allMedicines.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    // Top dispensed medicines (mocked or aggregated from dispensings)
    const topMedicines = [
      { name: "Paracetamol 500mg", count: 42, unit: "Tablets" },
      { name: "Amoxicillin 500mg", count: 28, unit: "Capsules" },
      { name: "Metformin 500mg", count: 24, unit: "Tablets" },
      { name: "Pantoprazole 40mg", count: 21, unit: "Tablets" },
      { name: "Azithromycin 500mg", count: 18, unit: "Tablets" },
    ];

    return res.status(200).json({
      success: true,
      metrics: {
        prescriptionsToday,
        pendingDispensing,
        dispensedToday,
        lowStockItems,
        outOfStockItems,
        expiringSoon,
        pendingPayments: 2,
        totalMedicines,
        totalInventoryValue: Math.round(totalInventoryValue),
      },
      topMedicines,
      recentQueue,
    });
  } catch (error) {
    console.error("Pharmacy telemetry error:", error);
    return res.status(500).json({ message: "Failed to load pharmacy telemetry" });
  }
};

// ── 2. PRESCRIPTION WORK QUEUE ───────────────────────────────────────────────
// GET /api/pharmacy/queue
export const getPrescriptionQueue = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 2,
        prescriptions: [
          {
            _id: "demo-rx-1",
            prescriptionNumber: "RX-2026-0042",
            createdAt: new Date(),
            patient: { _id: "demo-p-1", name: "Rahul Verma", contactNumber: "9876543210", age: 34, gender: "Male", allergies: ["Penicillin"] },
            doctor: { _id: "demo-d-1", name: "Dr. Rajesh Sharma", specialization: "Cardiology", department: "Cardiology" },
            diagnosis: "Hypertension & Gastritis",
            medications: [
              { name: "Telmisartan 40mg", dosage: "1 tablet", frequency: "1-0-0", duration: "30 days", instructions: "After breakfast" },
              { name: "Pantoprazole 40mg", dosage: "1 tablet", frequency: "1-0-0", duration: "15 days", instructions: "Before food" },
            ],
            dispensingStatus: "pending",
            priority: "Normal",
          },
          {
            _id: "demo-rx-2",
            prescriptionNumber: "RX-2026-0043",
            createdAt: new Date(Date.now() - 3600000),
            patient: { _id: "demo-p-2", name: "Anita Sharma", contactNumber: "9123456789", age: 48, gender: "Female", allergies: [] },
            doctor: { _id: "demo-d-2", name: "Dr. Ananya Iyer", specialization: "General Medicine", department: "Internal Medicine" },
            diagnosis: "Acute Bronchitis",
            medications: [
              { name: "Azithromycin 500mg", dosage: "1 tablet", frequency: "0-0-1", duration: "5 days", instructions: "After dinner" },
              { name: "Cough Syrup D", dosage: "10 ml", frequency: "1-1-1", duration: "5 days", instructions: "After food" },
            ],
            dispensingStatus: "processing",
            priority: "Urgent",
          },
        ],
        isOfflineDemo: true,
      });
    }

    const query = {};

    if (status && status !== "all") {
      query.dispensingStatus = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ prescriptionNumber: regex }, { diagnosis: regex }];
    }

    const prescriptions = await Prescription.find(query)
      .populate("patient", "name contactNumber age gender allergies abhaId patientId")
      .populate("doctor", "name specialization department")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    console.error("Prescription queue error:", error);
    return res.status(500).json({ message: "Failed to fetch prescription queue" });
  }
};

// ── 3. PRESCRIPTION DETAILS FOR DISPENSING ───────────────────────────────────
// GET /api/pharmacy/dispense/:id
export const getPrescriptionForDispensing = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        prescription: {
          _id: id,
          prescriptionNumber: "RX-2026-0042",
          createdAt: new Date(),
          patient: {
            _id: "demo-p-1",
            name: "Rahul Verma",
            contactNumber: "9876543210",
            age: 34,
            gender: "Male",
            bloodGroup: "B+",
            allergies: ["Penicillin", "Sulfa drugs"],
            patientId: "UHID-2026-0192",
          },
          doctor: {
            _id: "demo-d-1",
            name: "Dr. Rajesh Sharma",
            specialization: "Cardiology",
            department: "Cardiology",
            contactNumber: "9871122334",
          },
          diagnosis: "Hypertension & Gastritis",
          advice: "Maintain low sodium diet, avoid spicy food.",
          medications: [
            {
              name: "Telmisartan 40mg",
              dosage: "1 tablet",
              frequency: "1-0-0",
              duration: "30 days",
              instructions: "After breakfast",
              requestedQuantity: 30,
              availableStock: 140,
              batches: [
                { batchNumber: "TEL-2025B", expiryDate: new Date(Date.now() + 180 * 86400000), quantity: 80, price: 4.5 },
                { batchNumber: "TEL-2026A", expiryDate: new Date(Date.now() + 360 * 86400000), quantity: 60, price: 5.0 },
              ],
            },
            {
              name: "Pantoprazole 40mg",
              dosage: "1 tablet",
              frequency: "1-0-0",
              duration: "15 days",
              instructions: "Before breakfast",
              requestedQuantity: 15,
              availableStock: 95,
              batches: [
                { batchNumber: "PAN-881", expiryDate: new Date(Date.now() + 240 * 86400000), quantity: 95, price: 6.0 },
              ],
            },
          ],
          dispensingStatus: "pending",
        },
        isOfflineDemo: true,
      });
    }

    const prescription = await Prescription.findById(id)
      .populate("patient", "name contactNumber age gender bloodGroup allergies abhaId patientId medicalHistory")
      .populate("doctor", "name specialization department contactNumber");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Enhance each medication item with live stock and available batches
    const enhancedMedications = await Promise.all(
      prescription.medications.map(async (med) => {
        const invItem = await Inventory.findOne({
          name: { $regex: new RegExp(`^${med.name.split(" ")[0]}`, "i") },
        });

        let availableStock = invItem ? invItem.quantity : 0;
        let batches = [];

        if (invItem) {
          batches = await MedicineBatch.find({
            medicine: invItem._id,
            status: "active",
            expiryDate: { $gt: new Date() },
            quantity: { $gt: 0 },
          }).sort({ expiryDate: 1 });
        }

        // Parse requested quantity or fallback
        const requestedQty = parseInt(med.quantity) || 10;

        return {
          ...med.toObject(),
          inventoryId: invItem?._id,
          availableStock,
          requestedQuantity: requestedQty,
          batches: batches.map((b) => ({
            _id: b._id,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            quantity: b.quantity,
            price: b.sellingPrice || invItem?.unitPrice || 10,
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      prescription: {
        ...prescription.toObject(),
        medications: enhancedMedications,
      },
    });
  } catch (error) {
    console.error("Prescription dispense details error:", error);
    return res.status(500).json({ message: "Failed to load prescription details" });
  }
};

// ── 4. DISPENSE PRESCRIPTION WORKFLOW ─────────────────────────────────────────
// POST /api/pharmacy/dispense/:id
export const dispensePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, paymentMethod = "cash", notes = "", allergyCheckAcknowledged = true } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Dispensed items are required" });
    }

    const receiptNumber = `RX-DISP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: "Prescription successfully dispensed (Demo Mode)",
        receipt: {
          receiptNumber,
          prescriptionId: id,
          dispensedAt: new Date(),
          dispensedBy: req.user?.name || "Ananya Deshmukh (Chief Pharmacist)",
          totalAmount: 325,
          paymentMethod,
          items,
        },
        isOfflineDemo: true,
      });
    }

    const prescription = await Prescription.findById(id)
      .populate("patient", "name")
      .populate("doctor", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    let totalAmount = 0;
    const dispensedItems = [];

    // Process each item and decrement stock
    for (const item of items) {
      const qty = Number(item.dispensedQuantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const itemTotal = qty * unitPrice;
      totalAmount += itemTotal;

      // Deduct from batch if specified
      if (item.batchId) {
        const batch = await MedicineBatch.findById(item.batchId);
        if (batch) {
          if (new Date(batch.expiryDate) <= new Date()) {
            return res.status(400).json({
              message: `Cannot dispense from expired batch ${batch.batchNumber}`,
            });
          }
          if (batch.quantity < qty) {
            return res.status(400).json({
              message: `Insufficient stock in batch ${batch.batchNumber} for ${item.medicineName}`,
            });
          }
          batch.quantity -= qty;
          await batch.save();
        }
      }

      // Deduct from Inventory
      if (item.inventoryId) {
        const inv = await Inventory.findById(item.inventoryId);
        if (inv) {
          const prev = inv.quantity;
          inv.quantity = Math.max(0, inv.quantity - qty);
          await inv.save();

          // Record immutable stock transaction
          await StockTransaction.create({
            medicine: inv._id,
            medicineName: inv.name,
            batchNumber: item.batchNumber || "",
            type: "dispensing",
            quantity: -qty,
            previousStock: prev,
            newStock: inv.quantity,
            unitPrice,
            reason: `Prescription #${prescription.prescriptionNumber}`,
            referenceType: "Prescription",
            referenceId: String(prescription._id),
            performedBy: req.user?._id,
            performedByName: req.user?.name || "Staff Pharmacist",
          });
        }
      }

      dispensedItems.push({
        medicineName: item.medicineName,
        inventoryItem: item.inventoryId,
        batchNumber: item.batchNumber || "",
        dosage: item.dosage || "",
        frequency: item.frequency || "",
        duration: item.duration || "",
        instructions: item.instructions || "",
        requestedQuantity: Number(item.requestedQuantity) || qty,
        dispensedQuantity: qty,
        unitPrice,
        totalPrice: itemTotal,
        status: qty > 0 ? "dispensed" : "out_of_stock",
      });
    }

    // Create PharmacyDispensing record
    const dispensingRecord = await PharmacyDispensing.create({
      receiptNumber,
      prescription: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      patient: prescription.patient._id,
      patientName: prescription.patient.name,
      doctor: prescription.doctor._id,
      doctorName: prescription.doctor.name,
      dispensedBy: req.user._id,
      dispensedByName: req.user.name,
      items: dispensedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: "paid",
      allergyCheckAcknowledged,
      notes,
    });

    // Update Prescription status
    prescription.dispensingStatus = "dispensed";
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = req.user._id;
    prescription.dispensedByName = req.user.name;
    prescription.pharmacyReceiptNumber = receiptNumber;
    prescription.pharmacyNotes = notes;
    await prescription.save();

    // Create patient notification
    await Notification.create({
      recipient: prescription.patient._id,
      recipientModel: "Patient",
      title: "Medication Dispensed",
      message: `Your prescription #${prescription.prescriptionNumber} has been dispensed by the pharmacy. Receipt: ${receiptNumber}.`,
      type: "general",
      priority: "normal",
      link: "/patient/prescriptions",
    }).catch(() => {});

    await logPharmacyAudit(
      req,
      "DISPENSE_MEDICATION",
      `Dispensed prescription #${prescription.prescriptionNumber} to ${prescription.patient.name}. Receipt: ${receiptNumber}, Total: ₹${totalAmount}`
    );

    return res.status(200).json({
      success: true,
      message: "Prescription successfully dispensed",
      dispensing: dispensingRecord,
      receiptNumber,
    });
  } catch (error) {
    console.error("Dispense prescription error:", error);
    return res.status(500).json({ message: "Failed to process dispensing: " + error.message });
  }
};

// ── 5. CONTACT DOCTOR / FLAG PRESCRIPTION ISSUE ──────────────────────────────
// POST /api/pharmacy/flag-prescription/:id
export const flagPrescriptionIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, message } = req.body;

    if (!reason || !message) {
      return res.status(400).json({ message: "Reason and message for clarification are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: "Prescription flagged and clarification sent to prescribing doctor (Demo Mode)",
        isOfflineDemo: true,
      });
    }

    const prescription = await Prescription.findById(id).populate("doctor", "name user email");
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    prescription.dispensingStatus = "on_hold";
    prescription.pharmacyNotes = `[ON HOLD] Issue flagged by ${req.user.name}: ${reason} - ${message}`;
    await prescription.save();

    // Notify doctor
    if (prescription.doctor?.user) {
      await Notification.create({
        recipient: prescription.doctor.user,
        recipientModel: "User",
        title: "Pharmacy Clarification Required",
        message: `Pharmacist flagged prescription #${prescription.prescriptionNumber} for ${reason}: "${message}". Dispensing is on hold.`,
        type: "general",
        priority: "high",
        link: `/doctor/consultation/${prescription.appointment || ""}`,
      }).catch(() => {});
    }

    await logPharmacyAudit(
      req,
      "FLAG_PRESCRIPTION",
      `Flagged prescription #${prescription.prescriptionNumber} for reason: ${reason}`
    );

    return res.status(200).json({
      success: true,
      message: "Prescription placed on hold and doctor notified",
      prescription,
    });
  } catch (error) {
    console.error("Flag prescription error:", error);
    return res.status(500).json({ message: "Failed to flag prescription" });
  }
};

// ── 6. MEDICINE INVENTORY CATALOG ────────────────────────────────────────────
// GET /api/pharmacy/inventory
export const getPharmacyInventory = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 5,
        inventory: [
          {
            _id: "demo-inv-1",
            name: "Paracetamol 500mg",
            genericName: "Acetaminophen",
            brand: "Calpol",
            category: "Medication",
            itemCode: "MED-001",
            quantity: 240,
            unit: "Tablets",
            minThreshold: 50,
            unitPrice: 3.5,
            supplier: "MedLife Pharmaceuticals",
            status: "in_stock",
            expiryDate: new Date(Date.now() + 180 * 86400000),
          },
          {
            _id: "demo-inv-2",
            name: "Amoxicillin 500mg",
            genericName: "Amoxicillin Trihydrate",
            brand: "Mox 500",
            category: "Medication",
            itemCode: "MED-002",
            quantity: 35,
            unit: "Capsules",
            minThreshold: 40,
            unitPrice: 12.0,
            supplier: "Cipla Healthcare",
            status: "low_stock",
            expiryDate: new Date(Date.now() + 90 * 86400000),
          },
          {
            _id: "demo-inv-3",
            name: "Azithromycin 500mg",
            genericName: "Azithromycin",
            brand: "Azee 500",
            category: "Medication",
            itemCode: "MED-003",
            quantity: 0,
            unit: "Tablets",
            minThreshold: 30,
            unitPrice: 22.0,
            supplier: "Sun Pharma",
            status: "out_of_stock",
            expiryDate: new Date(Date.now() + 120 * 86400000),
          },
          {
            _id: "demo-inv-4",
            name: "Pantoprazole 40mg",
            genericName: "Pantoprazole Sodium",
            brand: "Pan 40",
            category: "Medication",
            itemCode: "MED-004",
            quantity: 180,
            unit: "Tablets",
            minThreshold: 50,
            unitPrice: 8.5,
            supplier: "Alkem Laboratories",
            status: "in_stock",
            expiryDate: new Date(Date.now() + 260 * 86400000),
          },
          {
            _id: "demo-inv-5",
            name: "Metformin 500mg",
            genericName: "Metformin Hydrochloride",
            brand: "Glycomet",
            category: "Medication",
            itemCode: "MED-005",
            quantity: 18,
            unit: "Tablets",
            minThreshold: 50,
            unitPrice: 4.0,
            supplier: "USV Ltd.",
            status: "low_stock",
            expiryDate: new Date(Date.now() + 20 * 86400000),
          },
        ],
        isOfflineDemo: true,
      });
    }

    const query = {};
    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { itemCode: regex }, { supplier: regex }];
    }

    const inventory = await Inventory.find(query).sort({ name: 1 }).limit(100);

    return res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Pharmacy inventory error:", error);
    return res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// ── 7. ADD OR UPDATE MEDICINE ────────────────────────────────────────────────
// POST /api/pharmacy/inventory
export const addOrUpdateMedicine = async (req, res) => {
  try {
    const { name, category, itemCode, quantity, unit, minThreshold, unitPrice, supplier, expiryDate, batchNumber } = req.body;

    if (!name || !unitPrice) {
      return res.status(400).json({ message: "Medicine name and unit price are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: "Medicine record saved (Demo Mode)",
        medicine: { ...req.body, _id: "demo-new-med" },
        isOfflineDemo: true,
      });
    }

    const code = itemCode || `MED-${Math.floor(1000 + Math.random() * 9000)}`;

    const medicine = await Inventory.create({
      name,
      category: category || "Medication",
      itemCode: code,
      quantity: Number(quantity) || 0,
      unit: unit || "Units",
      minThreshold: Number(minThreshold) || 20,
      unitPrice: Number(unitPrice) || 0,
      supplier: supplier || "MedLife Pharmaceuticals",
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      batchNumber: batchNumber || "",
    });

    if (batchNumber && quantity > 0 && expiryDate) {
      await MedicineBatch.create({
        medicine: medicine._id,
        medicineName: medicine.name,
        batchNumber,
        manufacturingDate: new Date(),
        expiryDate: new Date(expiryDate),
        quantity: Number(quantity),
        unit: medicine.unit,
        purchasePrice: Number(unitPrice) * 0.7,
        sellingPrice: Number(unitPrice),
        supplier: medicine.supplier,
      }).catch(() => {});
    }

    await logPharmacyAudit(req, "ADD_MEDICINE", `Added medicine ${name} (${code})`);

    return res.status(201).json({ success: true, medicine });
  } catch (error) {
    console.error("Add medicine error:", error);
    return res.status(500).json({ message: "Failed to save medicine: " + error.message });
  }
};

// ── 8. BATCH MANAGEMENT ──────────────────────────────────────────────────────
// GET /api/pharmacy/batches
export const getBatches = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 4,
        batches: [
          { _id: "b1", medicineName: "Paracetamol 500mg", batchNumber: "PCM-2026A", manufacturer: "Standard Pharma", manufacturingDate: "2025-06-01", expiryDate: "2027-05-31", quantity: 120, sellingPrice: 3.5, supplier: "MedLife Pharmaceuticals", status: "active" },
          { _id: "b2", medicineName: "Paracetamol 500mg", batchNumber: "PCM-2025B", manufacturer: "Standard Pharma", manufacturingDate: "2024-06-01", expiryDate: "2026-10-15", quantity: 120, sellingPrice: 3.5, supplier: "MedLife Pharmaceuticals", status: "active" },
          { _id: "b3", medicineName: "Amoxicillin 500mg", batchNumber: "AMX-890", manufacturer: "Cipla", manufacturingDate: "2025-01-10", expiryDate: "2026-09-25", quantity: 35, sellingPrice: 12.0, supplier: "Cipla Healthcare", status: "active" },
          { _id: "b4", medicineName: "Metformin 500mg", batchNumber: "GLY-301", manufacturer: "USV", manufacturingDate: "2024-03-01", expiryDate: "2026-09-18", quantity: 18, sellingPrice: 4.0, supplier: "USV Ltd.", status: "active" },
        ],
        isOfflineDemo: true,
      });
    }

    const batches = await MedicineBatch.find()
      .populate("medicine", "name itemCode category")
      .sort({ expiryDate: 1 })
      .limit(100);

    return res.status(200).json({ success: true, count: batches.length, batches });
  } catch (error) {
    console.error("Batches error:", error);
    return res.status(500).json({ message: "Failed to fetch batches" });
  }
};

// ── 9. EXPIRY & LOW STOCK ALERTS ─────────────────────────────────────────────
// GET /api/pharmacy/alerts
export const getPharmacyAlerts = async (req, res) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in60 = new Date(now.getTime() + 60 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        expired: [
          { medicineName: "Cough Syrup Junior", batchNumber: "EXP-091", quantity: 8, expiryDate: new Date(Date.now() - 5 * 86400000), daysRemaining: -5 },
        ],
        expiring30: [
          { medicineName: "Metformin 500mg", batchNumber: "GLY-301", quantity: 18, expiryDate: new Date(Date.now() + 12 * 86400000), daysRemaining: 12 },
          { medicineName: "Amoxicillin 500mg", batchNumber: "AMX-890", quantity: 35, expiryDate: new Date(Date.now() + 22 * 86400000), daysRemaining: 22 },
        ],
        expiring60: [
          { medicineName: "Paracetamol 500mg", batchNumber: "PCM-2025B", quantity: 120, expiryDate: new Date(Date.now() + 45 * 86400000), daysRemaining: 45 },
        ],
        expiring90: [],
        lowStock: [
          { medicineName: "Amoxicillin 500mg", currentStock: 35, minLevel: 40, shortfall: 5, unit: "Capsules", reorderStatus: "Reorder Required" },
          { medicineName: "Metformin 500mg", currentStock: 18, minLevel: 50, shortfall: 32, unit: "Tablets", reorderStatus: "Critical" },
        ],
        outOfStock: [
          { medicineName: "Azithromycin 500mg", currentStock: 0, minLevel: 30, shortfall: 30, unit: "Tablets", reorderStatus: "Immediate PO Needed" },
        ],
        isOfflineDemo: true,
      });
    }

    const [expired, expiring30, expiring60, expiring90, lowStock, outOfStock] = await Promise.all([
      MedicineBatch.find({ expiryDate: { $lte: now }, status: { $ne: "depleted" } }).limit(20),
      MedicineBatch.find({ expiryDate: { $gt: now, $lte: in30 }, status: "active" }).limit(20),
      MedicineBatch.find({ expiryDate: { $gt: in30, $lte: in60 }, status: "active" }).limit(20),
      MedicineBatch.find({ expiryDate: { $gt: in60, $lte: in90 }, status: "active" }).limit(20),
      Inventory.find({ status: "low_stock" }).limit(20),
      Inventory.find({ status: "out_of_stock" }).limit(20),
    ]);

    return res.status(200).json({
      success: true,
      expired,
      expiring30,
      expiring60,
      expiring90,
      lowStock,
      outOfStock,
    });
  } catch (error) {
    console.error("Alerts error:", error);
    return res.status(500).json({ message: "Failed to fetch pharmacy alerts" });
  }
};

// ── 10. STOCK MOVEMENTS & ADJUSTMENT ──────────────────────────────────────────
// GET /api/pharmacy/stock-movements
export const getStockMovements = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 4,
        transactions: [
          { _id: "t1", createdAt: new Date(), medicineName: "Paracetamol 500mg", batchNumber: "PCM-2026A", type: "dispensing", quantity: -20, previousStock: 260, newStock: 240, reason: "Prescription #RX-2026-0041", performedByName: "Ananya Deshmukh" },
          { _id: "t2", createdAt: new Date(Date.now() - 3600000), medicineName: "Pantoprazole 40mg", batchNumber: "PAN-881", type: "purchase", quantity: 100, previousStock: 80, newStock: 180, reason: "Goods Receipt PO-2026-012", performedByName: "Ananya Deshmukh" },
          { _id: "t3", createdAt: new Date(Date.now() - 86400000), medicineName: "Cough Syrup D", batchNumber: "CS-101", type: "damage", quantity: -2, previousStock: 45, newStock: 43, reason: "Broken bottle in transit", performedByName: "Ananya Deshmukh" },
          { _id: "t4", createdAt: new Date(Date.now() - 172800000), medicineName: "Amoxicillin 500mg", batchNumber: "AMX-890", type: "dispensing", quantity: -15, previousStock: 50, newStock: 35, reason: "Prescription #RX-2026-0038", performedByName: "Ananya Deshmukh" },
        ],
        isOfflineDemo: true,
      });
    }

    const transactions = await StockTransaction.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    console.error("Stock movements error:", error);
    return res.status(500).json({ message: "Failed to fetch stock movements" });
  }
};

// POST /api/pharmacy/adjust-stock
export const recordStockAdjustment = async (req, res) => {
  try {
    const { medicineId, quantity, type = "adjustment", reason = "", batchNumber = "" } = req.body;

    if (!medicineId || quantity === undefined) {
      return res.status(400).json({ message: "Medicine and adjustment quantity are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: "Stock adjustment recorded (Demo Mode)",
        isOfflineDemo: true,
      });
    }

    const inv = await Inventory.findById(medicineId);
    if (!inv) return res.status(404).json({ message: "Medicine not found" });

    const prev = inv.quantity;
    const adjQty = Number(quantity);
    inv.quantity = Math.max(0, inv.quantity + adjQty);
    await inv.save();

    const tx = await StockTransaction.create({
      medicine: inv._id,
      medicineName: inv.name,
      batchNumber,
      type,
      quantity: adjQty,
      previousStock: prev,
      newStock: inv.quantity,
      unitPrice: inv.unitPrice,
      reason,
      performedBy: req.user?._id,
      performedByName: req.user?.name || "Staff Pharmacist",
    });

    await logPharmacyAudit(
      req,
      "STOCK_ADJUSTMENT",
      `Adjusted ${inv.name} by ${adjQty} (${type}): ${reason}`
    );

    return res.status(200).json({ success: true, inventory: inv, transaction: tx });
  } catch (error) {
    console.error("Adjust stock error:", error);
    return res.status(500).json({ message: "Failed to adjust stock" });
  }
};

// ── 11. SUPPLIERS ────────────────────────────────────────────────────────────
// GET /api/pharmacy/suppliers
export const getSuppliers = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 3,
        suppliers: [
          { _id: "s1", name: "MedLife Pharmaceuticals", contactPerson: "Suresh Gupta", email: "orders@medlifepharma.in", phone: "9820011223", city: "Mumbai", gstNumber: "27AABCM1234F1Z8", paymentTerms: "Net 30", status: "active", rating: 5 },
          { _id: "s2", name: "Cipla Healthcare Supply", contactPerson: "Kavita Rao", email: "dist@cipla.com", phone: "9819988776", city: "Bengaluru", gstNumber: "29AABCC4567D1Z2", paymentTerms: "Net 15", status: "active", rating: 4 },
          { _id: "s3", name: "Sun Pharma Distributors", contactPerson: "Manoj Mehta", email: "supply@sunpharma.in", phone: "9898001122", city: "Ahmedabad", gstNumber: "24AABCS8901E1Z4", paymentTerms: "Net 30", status: "active", rating: 4 },
        ],
        isOfflineDemo: true,
      });
    }

    const suppliers = await Supplier.find().sort({ name: 1 });
    return res.status(200).json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    console.error("Suppliers error:", error);
    return res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};

// POST /api/pharmacy/suppliers
export const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, city, gstNumber, paymentTerms } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Supplier name and phone are required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: "Supplier added (Demo Mode)",
        supplier: { ...req.body, _id: "demo-supp-new" },
        isOfflineDemo: true,
      });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      city,
      gstNumber,
      paymentTerms: paymentTerms || "Net 30",
    });

    await logPharmacyAudit(req, "CREATE_SUPPLIER", `Registered vendor ${name}`);
    return res.status(201).json({ success: true, supplier });
  } catch (error) {
    console.error("Create supplier error:", error);
    return res.status(500).json({ message: "Failed to create supplier: " + error.message });
  }
};

// ── 12. PURCHASE ORDERS & GOODS RECEIPT ───────────────────────────────────────
// GET /api/pharmacy/purchase-orders
export const getPurchaseOrders = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 2,
        orders: [
          {
            _id: "po1",
            poNumber: "PO-2026-0041",
            supplierName: "MedLife Pharmaceuticals",
            items: [
              { medicineName: "Paracetamol 500mg", quantity: 500, unitPrice: 2.8, totalPrice: 1400, receivedQuantity: 500 },
              { medicineName: "Pantoprazole 40mg", quantity: 200, unitPrice: 6.5, totalPrice: 1300, receivedQuantity: 200 },
            ],
            totalAmount: 2700,
            status: "received",
            orderDate: new Date(Date.now() - 3 * 86400000),
            expectedDelivery: new Date(Date.now() - 1 * 86400000),
          },
          {
            _id: "po2",
            poNumber: "PO-2026-0042",
            supplierName: "Cipla Healthcare Supply",
            items: [
              { medicineName: "Amoxicillin 500mg", quantity: 300, unitPrice: 10.0, totalPrice: 3000, receivedQuantity: 0 },
              { medicineName: "Azithromycin 500mg", quantity: 150, unitPrice: 18.0, totalPrice: 2700, receivedQuantity: 0 },
            ],
            totalAmount: 5700,
            status: "ordered",
            orderDate: new Date(),
            expectedDelivery: new Date(Date.now() + 2 * 86400000),
          },
        ],
        isOfflineDemo: true,
      });
    }

    const orders = await PurchaseOrder.find().populate("supplier", "name email phone").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("PO error:", error);
    return res.status(500).json({ message: "Failed to fetch purchase orders" });
  }
};

// POST /api/pharmacy/purchase-orders
export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplierId, items, expectedDelivery, notes } = req.body;

    if (!supplierId || !items || !items.length) {
      return res.status(400).json({ message: "Supplier and purchase order items are required" });
    }

    const poNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: "Purchase order created (Demo Mode)",
        order: { poNumber, items, totalAmount: 4500, status: "pending_approval", _id: "demo-po-new" },
        isOfflineDemo: true,
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });

    let totalAmount = 0;
    const formattedItems = items.map((it) => {
      const lineTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0);
      totalAmount += lineTotal;
      return {
        medicine: it.medicineId,
        medicineName: it.medicineName,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: lineTotal,
      };
    });

    const po = await PurchaseOrder.create({
      poNumber,
      supplier: supplier._id,
      supplierName: supplier.name,
      items: formattedItems,
      totalAmount,
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      status: "approved",
      createdBy: req.user?._id,
      createdByName: req.user?.name || "Chief Pharmacist",
      notes,
    });

    await logPharmacyAudit(req, "CREATE_PURCHASE_ORDER", `Created PO #${poNumber} for ₹${totalAmount}`);

    return res.status(201).json({ success: true, order: po });
  } catch (error) {
    console.error("Create PO error:", error);
    return res.status(500).json({ message: "Failed to create purchase order: " + error.message });
  }
};

// POST /api/pharmacy/goods-receipt/:id
export const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: "Stock received and inventory replenished (Demo Mode)",
        isOfflineDemo: true,
      });
    }

    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });

    // Update stock and batches
    for (const it of receivedItems || po.items) {
      const qty = Number(it.receivedQuantity || it.quantity);
      if (qty > 0) {
        const inv = await Inventory.findById(it.medicine);
        if (inv) {
          const prev = inv.quantity;
          inv.quantity += qty;
          await inv.save();

          // Create batch
          const batchNum = it.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`;
          const exp = it.expiryDate ? new Date(it.expiryDate) : new Date(Date.now() + 365 * 86400000);

          await MedicineBatch.create({
            medicine: inv._id,
            medicineName: inv.name,
            batchNumber: batchNum,
            manufacturingDate: new Date(),
            expiryDate: exp,
            quantity: qty,
            unit: inv.unit,
            purchasePrice: it.unitPrice || inv.unitPrice,
            sellingPrice: (it.unitPrice || inv.unitPrice) * 1.3,
            supplier: po.supplierName,
          }).catch(() => {});

          // Ledger entry
          await StockTransaction.create({
            medicine: inv._id,
            medicineName: inv.name,
            batchNumber: batchNum,
            type: "purchase",
            quantity: qty,
            previousStock: prev,
            newStock: inv.quantity,
            unitPrice: it.unitPrice || inv.unitPrice,
            reason: `Goods receipt for PO #${po.poNumber}`,
            referenceType: "PurchaseOrder",
            referenceId: String(po._id),
            performedBy: req.user?._id,
            performedByName: req.user?.name || "Staff Pharmacist",
          });
        }
      }
    }

    po.status = "received";
    po.receivedDate = new Date();
    po.receivedBy = req.user?._id;
    po.receivedByName = req.user?.name || "Staff Pharmacist";
    await po.save();

    await logPharmacyAudit(req, "GOODS_RECEIPT", `Received delivery for PO #${po.poNumber}`);

    return res.status(200).json({ success: true, message: "Goods received and inventory updated", order: po });
  } catch (error) {
    console.error("Receive PO error:", error);
    return res.status(500).json({ message: "Failed to receive PO: " + error.message });
  }
};

// ── 13. RETURNS & DAMAGE ─────────────────────────────────────────────────────
// GET /api/pharmacy/returns
export const getPharmacyReturns = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: 2,
        returns: [
          { _id: "r1", returnNumber: "RET-2026-008", returnType: "patient_return", medicineName: "Paracetamol 500mg", quantity: 10, refundAmount: 35, reason: "Excess prescription tablets unneeded", status: "processed", createdAt: new Date() },
          { _id: "r2", returnNumber: "RET-2026-009", returnType: "damaged_stock", medicineName: "Cough Syrup D", quantity: 2, refundAmount: 0, reason: "Broken bottle in packaging", status: "approved", createdAt: new Date(Date.now() - 86400000) },
        ],
        isOfflineDemo: true,
      });
    }

    const returns = await PharmacyReturn.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ success: true, count: returns.length, returns });
  } catch (error) {
    console.error("Returns error:", error);
    return res.status(500).json({ message: "Failed to fetch returns" });
  }
};

// POST /api/pharmacy/returns
export const processPharmacyReturn = async (req, res) => {
  try {
    const { returnType, medicineId, batchNumber, quantity, reason, refundAmount, patientName } = req.body;

    if (!returnType || !medicineId || !quantity || !reason) {
      return res.status(400).json({ message: "Return type, medicine, quantity, and reason are required" });
    }

    const returnNumber = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: "Return processed (Demo Mode)",
        returnRecord: { returnNumber, ...req.body },
        isOfflineDemo: true,
      });
    }

    const inv = await Inventory.findById(medicineId);
    if (!inv) return res.status(404).json({ message: "Medicine not found" });

    const ret = await PharmacyReturn.create({
      returnNumber,
      returnType,
      medicine: inv._id,
      medicineName: inv.name,
      batchNumber: batchNumber || "",
      quantity: Number(quantity),
      refundAmount: Number(refundAmount) || 0,
      reason,
      patientName: patientName || "",
      status: "processed",
      processedBy: req.user?._id,
      processedByName: req.user?.name || "Staff Pharmacist",
    });

    // Log transaction
    await StockTransaction.create({
      medicine: inv._id,
      medicineName: inv.name,
      batchNumber: batchNumber || "",
      type: "return",
      quantity: returnType === "patient_return" ? Number(quantity) : -Number(quantity),
      previousStock: inv.quantity,
      newStock: returnType === "patient_return" ? inv.quantity + Number(quantity) : inv.quantity,
      unitPrice: inv.unitPrice,
      reason: `Return #${returnNumber}: ${reason}`,
      referenceType: "Return",
      referenceId: String(ret._id),
      performedBy: req.user?._id,
      performedByName: req.user?.name || "Staff Pharmacist",
    });

    await logPharmacyAudit(req, "PROCESS_RETURN", `Processed ${returnType} for ${inv.name}`);

    return res.status(201).json({ success: true, returnRecord: ret });
  } catch (error) {
    console.error("Process return error:", error);
    return res.status(500).json({ message: "Failed to process return" });
  }
};

// ── 14. PHARMACY STAFF & SHIFTS ──────────────────────────────────────────────
// GET /api/pharmacy/staff
export const getPharmacyStaff = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        staff: [
          { _id: "u1", name: "Ananya Deshmukh", role: "pharmacist", designation: "Chief Pharmacist", shift: "Morning (08:00 AM - 04:00 PM)", status: "Active", contactNumber: "9820123456" },
          { _id: "u2", name: "Vikram Mehta", role: "pharmacist", designation: "Staff Pharmacist", shift: "Evening (04:00 PM - 12:00 AM)", status: "Active", contactNumber: "9820789012" },
          { _id: "u3", name: "Pooja Hegde", role: "pharmacist", designation: "Pharmacy Technician", shift: "Night (12:00 AM - 08:00 AM)", status: "Active", contactNumber: "9820345678" },
        ],
        isOfflineDemo: true,
      });
    }

    const staff = await User.find({ role: "pharmacist" }).select("name role designation contactNumber status department");
    return res.status(200).json({ success: true, count: staff.length, staff });
  } catch (error) {
    console.error("Staff error:", error);
    return res.status(500).json({ message: "Failed to fetch staff" });
  }
};

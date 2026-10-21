import mongoose from "mongoose";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Billing from "../models/Billing.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import AuditLog from "../models/AuditLog.js";
import Department from "../models/Department.js";
import Inventory from "../models/Inventory.js";
import Equipment from "../models/Equipment.js";
import MaintenanceOrder from "../models/MaintenanceOrder.js";
import StaffAttendance from "../models/StaffAttendance.js";
import StaffLeave from "../models/StaffLeave.js";
import ProcedureSchedule from "../models/ProcedureSchedule.js";
import HospitalSetting from "../models/HospitalSetting.js";
import DiagnosticOrder from "../models/DiagnosticOrder.js";
import Feedback from "../models/Feedback.js";
import { formatDoctorName } from "../utils/doctorHelper.js";

// Helper to record immutable audit events
export const logAuditEvent = async ({ user, action, module, recordId, details, req }) => {
  try {
    await AuditLog.create({
      user: user?._id || user?.id,
      userName: user?.name || "System",
      role: user?.role || "admin",
      action,
      module,
      recordId: recordId ? String(recordId) : undefined,
      details: details || "",
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// ── 1. EXECUTIVE DASHBOARD TELEMETRY ────────────────────────────────────────
// GET /api/admin/telemetry
export const getAdminTelemetry = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        totalPatients: 24,
        activeDoctors: 8,
        activeNurses: 16,
        todayConsultations: 12,
        pendingBills: 3,
        todayRevenue: 24500,
        pendingLabs: 4,
        criticalLabs: 1,
        otProceduresToday: 2,
        pendingPatientBookings: 2,
        bedCensus: {
          totalBeds: 40,
          occupiedBeds: 22,
          availableBeds: 18,
          cleaningBeds: 0,
          maintenanceBeds: 0,
          occupancyPercentage: 55,
          icuTotal: 8,
          icuOccupied: 5,
          icuOccupancy: 62,
          emergencyTotal: 10,
          emergencyOccupied: 4,
          generalTotal: 22,
          generalOccupied: 13,
        },
        activeAdmissions: [],
        recentAppointments: [],
        todayAppointments: [],
        recentActivity: [],
        isOfflineDemo: true,
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalPatients,
      activeDoctors,
      activeNurses,
      todayConsultations,
      occupiedBeds,
      availableBeds,
      totalBeds,
      cleaningBeds,
      maintenanceBeds,
      pendingBills,
      todayPaidBills,
      pendingLabs,
      criticalLabs,
      activeAdmissions,
      recentAuditLogs,
      recentAppointments,
      todayAppointments,
      pendingPatientBookings,
      diagnosticTestsToday,
      pendingDiagnostics,
      criticalDiagnosticAlerts,
      icuTotal,
      icuOccupied,
      generalTotal,
      generalOccupied,
      emergencyTotal,
      emergencyOccupied,
      otProceduresToday,
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      User.countDocuments({ role: "nurse" }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: "cancelled" },
      }),
      Bed.countDocuments({ status: "occupied" }),
      Bed.countDocuments({ status: "available" }),
      Bed.countDocuments(),
      Bed.countDocuments({ status: "cleaning" }),
      Bed.countDocuments({ status: "maintenance" }),
      Billing.countDocuments({ paymentStatus: { $in: ["pending", "partially_paid"] } }),
      Billing.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      LabReport.countDocuments({
        status: { $in: ["ordered", "sample_collected", "in_progress"] },
      }),
      LabReport.countDocuments({ isCritical: true }),
      Bed.find({ status: "occupied" })
        .populate("currentAdmission.patient", "name age gender contactNumber bloodGroup")
        .populate("currentAdmission.attendingDoctor", "name specialization department")
        .limit(6),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      Appointment.find()
        .populate("patient", "name contactNumber")
        .populate("doctor", "name specialization")
        .sort({ appointmentDate: -1 })
        .limit(6),
      Appointment.find({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
      })
        .populate("patient", "name contactNumber")
        .populate("doctor", "name specialization")
        .sort({ appointmentDate: 1 })
        .limit(8),
      Appointment.countDocuments({ status: "pending" }),
      DiagnosticOrder.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      DiagnosticOrder.countDocuments({ status: { $in: ["Requested", "Scheduled", "Patient Ready", "Sample Collected", "In Progress"] } }),
      DiagnosticOrder.countDocuments({ isCritical: true, "criticalDetails.escalationStatus": { $ne: "Resolved" } }),
      Bed.countDocuments({ ward: { $regex: /icu|critical/i } }),
      Bed.countDocuments({ ward: { $regex: /icu|critical/i }, status: "occupied" }),
      Bed.countDocuments({ ward: { $regex: /general/i } }),
      Bed.countDocuments({ ward: { $regex: /general/i }, status: "occupied" }),
      Bed.countDocuments({ ward: { $regex: /emergency|trauma/i } }),
      Bed.countDocuments({ ward: { $regex: /emergency|trauma/i }, status: "occupied" }),
      ProcedureSchedule.countDocuments({
        scheduledDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["scheduled", "preparing", "in_progress"] },
      }),
    ]);

    // Today's revenue (single aggregation round-trip) & occupancy rates
    const todayRevenue = todayPaidBills?.[0]?.total || 0;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const icuOccupancyRate = icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0;
    const generalOccupancyRate = generalTotal > 0 ? Math.round((generalOccupied / generalTotal) * 100) : 0;
    const emergencyOccupancyRate = emergencyTotal > 0 ? Math.round((emergencyOccupied / emergencyTotal) * 100) : 0;

    return res.status(200).json({
      success: true,
      totalPatients,
      activeDoctors,
      activeNurses,
      todayConsultations,
      occupiedBeds,
      availableBeds,
      totalBeds,
      pendingBills,
      todayRevenue,
      pendingLabs,
      criticalLabs,
      diagnosticSummary: {
        testsToday: diagnosticTestsToday,
        pending: pendingDiagnostics,
        criticalAlerts: criticalDiagnosticAlerts,
      },
      todaySurgeriesCount: otProceduresToday,
      pendingPatientBookings,
      recentAppointments,
      todayAppointments,
      recentActivity: recentAuditLogs,
      bedCensus: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        cleaningBeds,
        maintenanceBeds,
        occupancyPercentage: bedOccupancyRate,
        occupancyRate: bedOccupancyRate,
        icuOccupancy: icuOccupancyRate,
        icuOccupied,
        icuTotal,
        emergencyOccupied,
        emergencyTotal,
        generalOccupied,
        generalTotal,
        icu: { total: icuTotal, occupied: icuOccupied, rate: icuOccupancyRate },
        general: { total: generalTotal, occupied: generalOccupied, rate: generalOccupancyRate },
        emergency: { total: emergencyTotal, occupied: emergencyOccupied, rate: emergencyOccupancyRate },
      },
      kpis: {
        totalPatients,
        activeDoctors,
        activeNurses,
        todayConsultations,
        todayAdmissions: occupiedBeds,
        todayDischarges: 0,
        occupiedBeds,
        availableBeds,
        pendingInvoices: pendingBills,
        todayRevenue,
        pendingLabReports: pendingLabs,
        criticalAlerts: criticalLabs,
      },
      operations: {
        otProceduresToday,
        activeAdmissions,
        recentAppointments,
        recentActivity: recentAuditLogs,
      },
    });
  } catch (error) {
    console.error("Telemetry error:", error);
    return res.status(500).json({ message: "Unable to compile executive telemetry" });
  }
};

// ── 2. GLOBAL SEARCH ────────────────────────────────────────────────────────
// GET /api/admin/search
export const getGlobalAdminSearch = async (req, res) => {
  try {
    const q = req.query.q || req.query.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, results: {} });
    }

    const query = q.trim();
    const regex = new RegExp(query, "i");

    const [patients, doctors, staff, appointments, invoices, beds] = await Promise.all([
      Patient.find({ $or: [{ name: regex }, { contactNumber: regex }, { email: regex }, { abhaId: regex }] })
        .select("name contactNumber email age gender abhaId")
        .limit(5),
      Doctor.find({ $or: [{ name: regex }, { specialization: regex }, { department: regex }] })
        .select("name specialization department contactNumber consultationFee")
        .limit(5),
      User.find({ role: { $ne: "patient" }, $or: [{ name: regex }, { email: regex }, { role: regex }, { department: regex }] })
        .select("name email role department designation")
        .limit(5),
      Appointment.find({ $or: [{ reasonForVisit: regex }, { timeSlot: regex }] })
        .populate("patient", "name")
        .populate("doctor", "name specialization")
        .limit(5),
      Billing.find({ $or: [{ paymentMethod: regex }, { upiTransactionId: regex }] })
        .populate("patient", "name")
        .limit(5),
      Bed.find({ $or: [{ bedNumber: regex }, { ward: regex }, { floor: regex }] })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      query,
      results: {
        patients,
        doctors,
        staff,
        appointments,
        invoices,
        beds,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Search execution failed" });
  }
};

// ── 3. STAFF MANAGEMENT & RBAC ──────────────────────────────────────────────
// GET /api/admin/staff
export const getStaffList = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoStaff = [
        { _id: "000000000000000000000001", name: "Dr. Rajesh Sharma", email: "admin@hospital.com", role: "admin", department: "Executive Administration", designation: "Chief Medical Officer", employeeId: "EMP-ADM-1001", status: "active" },
        { _id: "000000000000000000000002", name: "Dr. Sarah Jenkins", email: "doctor@hospital.com", role: "doctor", department: "Cardiology", designation: "Senior Consultant Cardiologist", employeeId: "EMP-DOC-2041", status: "active" },
        { _id: "000000000000000000000003", name: "Sister Priya Nair", email: "nurse@hospital.com", role: "nurse", department: "Critical Care ICU", designation: "Charge Nurse", employeeId: "EMP-NUR-3022", status: "active" },
        { _id: "000000000000000000000004", name: "Sunil Verma", email: "receptionist@hospital.com", role: "receptionist", department: "Front Office", designation: "Front Desk Executive", employeeId: "EMP-REC-4019", status: "active" },
        { _id: "000000000000000000000006", name: "Ananya Deshmukh", email: "pharmacist@hospital.com", role: "pharmacist", department: "Pharmacy", designation: "Chief Pharmacist", employeeId: "EMP-PHAR-6001", status: "active" },
      ];
      return res.status(200).json({ success: true, staff: demoStaff, isOfflineDemo: true });
    }

    const { role, department, status, search } = req.query;
    const filter = { role: { $ne: "patient" } };

    if (role && role !== "All") filter.role = role;
    if (department && department !== "All") filter.department = department;
    if (status && status !== "All") filter.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { email: regex }, { designation: regex }, { employeeId: regex }];
    }

    const staff = await User.find(filter)
      .select("-password")
      .populate("doctor", "specialization department consultationFee")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch staff list" });
  }
};

// POST /api/admin/staff
export const createStaffMember = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, contactNumber, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "A staff member with this email already exists" });
    }

    const autoEmpId = employeeId || `EMP-${role.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department: department || "General Administration",
      designation: designation || "Hospital Staff",
      contactNumber: contactNumber || "",
      employeeId: autoEmpId,
      status: "active",
    });

    await logAuditEvent({
      user: req.user,
      action: "Created Staff Member",
      module: "staff",
      recordId: user._id,
      details: `Created ${role} account for ${name} (${email})`,
      req,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      staff: userObj,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create staff member" });
  }
};

// PATCH /api/admin/staff/:id
export const updateStaffMember = async (req, res) => {
  try {
    const { name, department, designation, contactNumber, status, role } = req.body;
    const staff = await User.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Protection: ordinary admins cannot escalate privileges to super_admin
    if (role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only a Super Administrator can assign super_admin privilege" });
    }

    if (name) staff.name = name;
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (contactNumber) staff.contactNumber = contactNumber;
    if (status) staff.status = status;
    if (role) staff.role = role;

    await staff.save();

    await logAuditEvent({
      user: req.user,
      action: "Updated Staff Profile",
      module: "staff",
      recordId: staff._id,
      details: `Updated details for ${staff.name}`,
      req,
    });

    const staffObj = staff.toObject();
    delete staffObj.password;

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      staff: staffObj,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update staff member" });
  }
};

// ── 4. DEPARTMENTS ──────────────────────────────────────────────────────────
// GET /api/admin/departments
export const getDepartments = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const defaultDepts = [
        { _id: "dept_card", name: "Cardiology", code: "CARD", location: "Block A", floor: "1st Floor", operatingHours: "24/7 Service" },
        { _id: "dept_gmed", name: "General Medicine", code: "GMED", location: "Block A", floor: "Ground Floor", operatingHours: "08:00 AM - 08:00 PM" },
        { _id: "dept_pedi", name: "Pediatrics", code: "PEDI", location: "Block B", floor: "1st Floor", operatingHours: "08:00 AM - 06:00 PM" },
        { _id: "dept_neur", name: "Neurology", code: "NEUR", location: "Block A", floor: "2nd Floor", operatingHours: "09:00 AM - 05:00 PM" },
        { _id: "dept_orth", name: "Orthopedics", code: "ORTH", location: "Block B", floor: "Ground Floor", operatingHours: "09:00 AM - 05:00 PM" },
        { _id: "dept_emer", name: "Emergency & Trauma", code: "EMER", location: "Emergency Wing", floor: "Ground Floor", operatingHours: "24 Hours Continuous" },
        { _id: "dept_path", name: "Pathology & Lab", code: "PATH", location: "Diagnostics Wing", floor: "2nd Floor", operatingHours: "24/7 Lab Processing" },
        { _id: "dept_phar", name: "Pharmacy", code: "PHAR", location: "Central OPD", floor: "Ground Floor", operatingHours: "24 Hours Available" },
      ];
      return res.status(200).json({ success: true, departments: defaultDepts, isOfflineDemo: true });
    }

    let departments = await Department.find().populate("headOfDepartment", "name specialization").sort({ name: 1 });

    // Seed default departments if none exist
    if (departments.length === 0) {
      const defaultDepts = [
        { name: "Cardiology", code: "CARD", location: "Block A", floor: "1st Floor", operatingHours: "24/7 Service" },
        { name: "General Medicine", code: "GMED", location: "Block A", floor: "Ground Floor", operatingHours: "08:00 AM - 08:00 PM" },
        { name: "Pediatrics", code: "PEDI", location: "Block B", floor: "1st Floor", operatingHours: "08:00 AM - 06:00 PM" },
        { name: "Neurology", code: "NEUR", location: "Block A", floor: "2nd Floor", operatingHours: "09:00 AM - 05:00 PM" },
        { name: "Orthopedics", code: "ORTH", location: "Block B", floor: "Ground Floor", operatingHours: "09:00 AM - 05:00 PM" },
        { name: "Emergency & Trauma", code: "EMER", location: "Emergency Wing", floor: "Ground Floor", operatingHours: "24 Hours Continuous" },
        { name: "Pathology & Lab", code: "PATH", location: "Diagnostics Wing", floor: "2nd Floor", operatingHours: "24/7 Lab Processing" },
        { name: "Pharmacy", code: "PHAR", location: "Central OPD", floor: "Ground Floor", operatingHours: "24 Hours Available" },
      ];
      await Department.insertMany(defaultDepts);
      departments = await Department.find().sort({ name: 1 });
    }

    return res.status(200).json({ success: true, departments });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch departments" });
  }
};

// POST /api/admin/departments
export const createDepartment = async (req, res) => {
  try {
    const { name, code, headOfDepartment, location, floor, contactExtension, operatingHours, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Department name and code are required" });
    }

    const dept = await Department.create({
      name,
      code: code.toUpperCase(),
      headOfDepartment: headOfDepartment || undefined,
      location: location || "Main Hospital Building",
      floor: floor || "Ground Floor",
      contactExtension: contactExtension || "100",
      operatingHours: operatingHours || "09:00 AM - 05:00 PM",
      description: description || "",
    });

    await logAuditEvent({
      user: req.user,
      action: "Created Department",
      module: "settings",
      recordId: dept._id,
      details: `Created department ${name} (${code})`,
      req,
    });

    return res.status(201).json({ success: true, message: "Department created", department: dept });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create department" });
  }
};

// ── 5. CENTRAL HOSPITAL CALENDAR ────────────────────────────────────────────
// GET /api/admin/calendar
export const getHospitalCalendarEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month !== undefined ? Number(month) : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const [appointments, procedures, leaves] = await Promise.all([
      Appointment.find({
        appointmentDate: { $gte: startDate, $lte: endDate },
      }).populate("doctor", "name specialization department").populate("patient", "name contactNumber"),
      ProcedureSchedule.find({
        scheduledDate: { $gte: startDate, $lte: endDate },
      }).populate("leadSurgeon", "name specialization").populate("patient", "name"),
      StaffLeave.find({
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        status: "approved",
      }).populate("user", "name role department"),
    ]);

    const events = [];

    appointments.forEach((a) => {
      events.push({
        id: a._id,
        type: "appointment",
        title: `Consultation: ${a.patient?.name} w/ Dr. ${a.doctor?.name}`,
        date: a.appointmentDate,
        time: a.timeSlot,
        status: a.status,
        department: a.doctor?.department || "General",
        color: "blue",
      });
    });

    procedures.forEach((p) => {
      events.push({
        id: p._id,
        type: "procedure",
        title: `OT: ${p.procedureName} (Dr. ${p.leadSurgeon?.name})`,
        date: p.scheduledDate,
        time: p.startTime,
        status: p.status,
        room: p.operatingRoom,
        color: "purple",
      });
    });

    leaves.forEach((l) => {
      events.push({
        id: l._id,
        type: "leave",
        title: `Leave: ${l.user?.name} (${l.leaveType})`,
        date: l.startDate,
        endDate: l.endDate,
        status: "Approved",
        department: l.user?.department || "Staff",
        color: "amber",
      });
    });

    return res.status(200).json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ message: "Unable to compile calendar events" });
  }
};

// ── 6. REVENUE ANALYTICS ────────────────────────────────────────────────────
// GET /api/admin/revenue-analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const period = req.query.period || req.query.range; // "month", "week", "year"

    const now = new Date();
    let startDate = new Date();
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // Default: Last 30 days
      startDate.setDate(now.getDate() - 30);
    }

    const billings = await Billing.find({
      createdAt: { $gte: startDate },
    })
      .populate("patient", "name")
      .populate({
        path: "appointment",
        populate: { path: "doctor", select: "name specialization department" },
      });

    let totalCollected = 0;
    let totalPending = 0;
    let totalRefunded = 0;
    const departmentRevenue = {};
    const doctorRevenue = {};
    const methodBreakdown = {};

    billings.forEach((b) => {
      const amt = b.totalAmount || 0;
      if (b.paymentStatus === "paid") {
        totalCollected += amt;
        const method = b.paymentMethod || "Cash";
        methodBreakdown[method] = (methodBreakdown[method] || 0) + amt;

        const dept = b.appointment?.doctor?.department || "Hospital General";
        departmentRevenue[dept] = (departmentRevenue[dept] || 0) + amt;

        const doc = b.appointment?.doctor?.name ? formatDoctorName(b.appointment.doctor.name) : "Hospital Services";
        doctorRevenue[doc] = (doctorRevenue[doc] || 0) + amt;
      } else if (b.paymentStatus === "pending" || b.paymentStatus === "partially_paid") {
        totalPending += amt;
      } else if (b.paymentStatus === "refunded") {
        totalRefunded += amt;
      }
    });

    const paidInvoices = billings.filter((b) => b.paymentStatus === "paid");
    const pendingInvoices = billings.filter((b) => b.paymentStatus === "pending" || b.paymentStatus === "partially_paid");

    return res.status(200).json({
      success: true,
      summary: {
        totalCollected,
        totalPending,
        totalRefunded,
        totalInvoices: billings.length,
      },
      stats: {
        totalRevenue: totalCollected,
        outstandingRevenue: totalPending,
        settledInvoices: paidInvoices.length,
        unsettledInvoices: pendingInvoices.length,
      },
      departmentRevenue,
      doctorRevenue,
      methodBreakdown,
      paymentMethodBreakdown: Object.entries(methodBreakdown).map(([k, v]) => ({
        _id: k,
        totalAmount: v,
        count: billings.filter((b) => b.paymentMethod === k).length,
      })),
      recentSettledTransactions: paidInvoices.slice(0, 10),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to calculate financial analytics" });
  }
};

// ── 7. INVENTORY & PHARMACY ─────────────────────────────────────────────────
// GET /api/admin/inventory
export const getInventory = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category && category !== "All") filter.category = category;
    if (status && status !== "All") filter.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { itemCode: regex }, { supplier: regex }];
    }

    let items = await Inventory.find(filter).sort({ name: 1 });

    // Seed default inventory items if empty
    if (items.length === 0 && !search && !category) {
      const defaults = [
        { name: "Paracetamol 650mg", category: "Medication", itemCode: "MED-PCM-650", quantity: 500, minThreshold: 50, unitPrice: 2.5, supplier: "Sun Pharma" },
        { name: "Amoxicillin 500mg", category: "Medication", itemCode: "MED-AMX-500", quantity: 300, minThreshold: 40, unitPrice: 8.0, supplier: "Cipla" },
        { name: "Disposable Syringes 5ml", category: "Medical Supplies", itemCode: "SUP-SYR-05", quantity: 800, minThreshold: 100, unitPrice: 5.0, supplier: "BD Medical" },
        { name: "Sterile Surgical Gloves (M)", category: "Consumables", itemCode: "CON-GLV-0M", quantity: 450, minThreshold: 50, unitPrice: 15.0, supplier: "Kanam Latex" },
        { name: "IV Infusion Set", category: "Medical Supplies", itemCode: "SUP-IVS-01", quantity: 180, minThreshold: 30, unitPrice: 25.0, supplier: "Romsons" },
        { name: "Adrenaline 1mg/ml Ampoule", category: "Emergency Supplies", itemCode: "EMG-ADR-01", quantity: 85, minThreshold: 20, unitPrice: 45.0, supplier: "Neon Labs" },
        { name: "Normal Saline (0.9% NaCl 500ml)", category: "Medication", itemCode: "MED-NS-500", quantity: 240, minThreshold: 40, unitPrice: 35.0, supplier: "Baxter" },
      ];
      await Inventory.insertMany(defaults);
      items = await Inventory.find().sort({ name: 1 });
    }

    const lowStockCount = await Inventory.countDocuments({ status: { $in: ["low_stock", "out_of_stock"] } });

    return res.status(200).json({ success: true, items, lowStockCount });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch inventory" });
  }
};

// POST /api/admin/inventory
export const createInventoryItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, minThreshold, unitPrice, supplier, expiryDate, itemCode } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({ message: "Name and initial quantity are required" });
    }

    const code = itemCode || `INV-${category?.slice(0, 3).toUpperCase() || "MED"}-${Math.floor(100 + Math.random() * 900)}`;

    const item = await Inventory.create({
      name,
      category: category || "Medication",
      itemCode: code,
      quantity: Number(quantity),
      unit: unit || "Units",
      minThreshold: minThreshold ? Number(minThreshold) : 20,
      unitPrice: unitPrice ? Number(unitPrice) : 0,
      supplier: supplier || "Nivora Care Central Store",
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    await logAuditEvent({
      user: req.user,
      action: "Added Inventory Item",
      module: "inventory",
      recordId: item._id,
      details: `Added ${name} (${quantity} ${unit})`,
      req,
    });

    return res.status(201).json({ success: true, message: "Item added to inventory", item });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to create inventory item" });
  }
};

// PATCH /api/admin/inventory/:id/stock
export const updateInventoryStock = async (req, res) => {
  try {
    const { changeQuantity, reason } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    item.quantity = Math.max(0, item.quantity + Number(changeQuantity));
    await item.save();

    await logAuditEvent({
      user: req.user,
      action: "Adjusted Inventory Stock",
      module: "inventory",
      recordId: item._id,
      details: `Adjusted ${item.name} by ${changeQuantity}. New total: ${item.quantity}. Reason: ${reason || "Manual Restock"}`,
      req,
    });

    return res.status(200).json({ success: true, message: "Stock updated successfully", item });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update stock" });
  }
};

// ── 8. BIOMEDICAL EQUIPMENT & MAINTENANCE ───────────────────────────────────
// GET /api/admin/equipment
export const getEquipment = async (req, res) => {
  try {
    let equipment = await Equipment.find().sort({ name: 1 });

    if (equipment.length === 0) {
      const defaults = [
        { name: "Dräger Evita V300 Ventilator", equipmentId: "EQ-VENT-01", category: "Ventilator", department: "ICU (Intensive Care Unit)", location: "ICU Bed 01" },
        { name: "Mindray BeneHeart D3 Defibrillator", equipmentId: "EQ-DEF-01", category: "Defibrillator", department: "Emergency & Trauma", location: "Crash Cart 1" },
        { name: "GE MAC 2000 12-Lead ECG", equipmentId: "EQ-ECG-02", category: "ECG Machine", department: "Cardiology", location: "OPD Room 104" },
        { name: "Fresenius 4008S Dialysis Unit", equipmentId: "EQ-DIA-01", category: "Dialysis Unit", department: "Nephrology / Dialysis", location: "Dialysis Bay 2" },
        { name: "Philips IntelliVue MX450 Monitor", equipmentId: "EQ-MON-05", category: "Patient Monitor", department: "CCU (Critical Care Unit)", location: "CCU Bed 03" },
      ];
      await Equipment.insertMany(defaults);
      equipment = await Equipment.find().sort({ name: 1 });
    }

    // Preventive-maintenance enrichment: derive the expected service due date
    // and flag overdue / due-soon assets regardless of stored fields.
    const today = new Date();
    const enriched = equipment.map((eq) => {
      const intervalDays = eq.serviceIntervalDays || 90;
      const dueOn =
        eq.nextServiceDate ||
        (eq.lastServiceDate
          ? new Date(eq.lastServiceDate.getTime() + intervalDays * 86400000)
          : null);

      let pmStatus = "on_schedule";
      if (dueOn) {
        const msUntilDue = dueOn.getTime() - today.getTime();
        if (msUntilDue < 0) pmStatus = "overdue";
        else if (msUntilDue <= 7 * 86400000) pmStatus = "due_soon";
      }

      return {
        ...eq.toObject(),
        dueForServiceOn: dueOn,
        pmStatus,
      };
    });

    const portfolio = equipment.length;
    const overdueCount = enriched.filter((e) => e.pmStatus === "overdue").length;
    const dueSoonCount = enriched.filter((e) => e.pmStatus === "due_soon").length;

    return res.status(200).json({
      success: true,
      equipment: enriched,
      pm: { portfolio, overdueCount, dueSoonCount },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch equipment records" });
  }
};

// POST /api/admin/equipment/:id/service
// Logs a completed preventive-maintenance service and rolls the asset's
// schedule forward by its configured service interval.
export const logPreventiveMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, technicianName } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid equipment ID" });
    }

    const eq = await Equipment.findById(id);
    if (!eq) {
      return res.status(404).json({ message: "Equipment asset not found" });
    }

    const intervalDays = eq.serviceIntervalDays || 90;
    const servicedAt = new Date();
    eq.lastServiceDate = servicedAt;
    eq.nextServiceDate = new Date(servicedAt.getTime() + intervalDays * 86400000);
    eq.status = "operational";
    await eq.save();

    const orderNumber = `PM-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = await MaintenanceOrder.create({
      orderNumber,
      equipmentName: eq.name,
      ward: eq.department || "Biomedical",
      room: eq.location || "",
      issue: notes || `Routine preventive maintenance (${intervalDays}-day interval)`,
      priority: "routine",
      assignedTo: technicianName || "Biomedical Team 1",
      status: "completed",
    });

    await logAuditEvent({
      user: req.user,
      action: "preventive_maintenance_completed",
      module: "equipment",
      recordId: eq._id,
      details: { equipmentId: eq.equipmentId, intervalDays, orderNumber },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Preventive maintenance logged. Next service: ${eq.nextServiceDate.toISOString().split("T")[0]}.`,
      equipment: eq,
      order,
    });
  } catch (error) {
    console.error("PM log error:", error);
    return res.status(500).json({ message: "Unable to log preventive maintenance" });
  }
};

// GET /api/admin/maintenance
export const getMaintenanceOrders = async (req, res) => {
  try {
    const orders = await MaintenanceOrder.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch maintenance orders" });
  }
};

// POST /api/admin/maintenance
export const createMaintenanceOrder = async (req, res) => {
  try {
    const { equipmentName, ward, room, issue, priority, assignedTo } = req.body;

    if (!issue) {
      return res.status(400).json({ message: "Issue description is required" });
    }

    const orderNumber = `MO-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await MaintenanceOrder.create({
      orderNumber,
      equipmentName: equipmentName || "General Infrastructure",
      ward: ward || "Main Hospital",
      room: room || "",
      issue,
      priority: priority || "medium",
      reportedBy: req.user?.name || "Administrator",
      assignedTo: assignedTo || "Hospital Maintenance Engineering",
      status: "reported",
    });

    await logAuditEvent({
      user: req.user,
      action: "Created Maintenance Order",
      module: "maintenance",
      recordId: order._id,
      details: `${orderNumber}: ${issue}`,
      req,
    });

    return res.status(201).json({ success: true, message: "Maintenance order logged", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create work order" });
  }
};

// PATCH /api/admin/maintenance/:id
export const updateMaintenanceOrderStatus = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const order = await MaintenanceOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status) order.status = status;
    if (resolutionNotes) order.resolutionNotes = resolutionNotes;
    if (status === "resolved" || status === "closed") {
      order.resolvedAt = new Date();
    }

    await order.save();

    return res.status(200).json({ success: true, message: "Maintenance order updated", order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update maintenance order" });
  }
};

// ── 9. STAFF ATTENDANCE & LEAVES ────────────────────────────────────────────
// GET /api/admin/attendance
export const getStaffAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await StaffAttendance.find({
      date: queryDate,
    }).populate("user", "name role department designation employeeId");

    return res.status(200).json({ success: true, date: queryDate, attendance });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch attendance" });
  }
};

// GET /api/admin/leaves
export const getStaffLeaves = async (req, res) => {
  try {
    const leaves = await StaffLeave.find()
      .populate("user", "name role department designation employeeId")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch leave requests" });
  }
};

// PATCH /api/admin/leaves/:id
export const reviewStaffLeave = async (req, res) => {
  try {
    const { status, reviewerNotes } = req.body;
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Protection: User cannot approve their own leave
    if (leave.user?.toString() === req.user._id?.toString()) {
      return res.status(403).json({ message: "You cannot approve or reject your own leave request" });
    }

    leave.status = status;
    leave.reviewerNotes = reviewerNotes || "";
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    await leave.save();

    await logAuditEvent({
      user: req.user,
      action: `Leave ${status.toUpperCase()}`,
      module: "staff",
      recordId: leave._id,
      details: `${status} leave for employee. Notes: ${reviewerNotes || "None"}`,
      req,
    });

    return res.status(200).json({ success: true, message: `Leave marked as ${status}`, leave });
  } catch (error) {
    return res.status(500).json({ message: "Unable to process leave request" });
  }
};

// ── 10. EMERGENCY OPERATIONS CENTER ─────────────────────────────────────────
// GET /api/admin/emergency
export const getEmergencyOperations = async (req, res) => {
  try {
    const [emergencyBeds, criticalLabs, recentEmergencyPatients] = await Promise.all([
      Bed.find({ ward: { $regex: /emergency|trauma|ccu/i } }),
      LabReport.find({ isCritical: true }).populate("patient", "name age gender contactNumber").sort({ createdAt: -1 }).limit(10),
      Patient.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const totalEmergencyBeds = emergencyBeds.length || 12;
    const occupiedEmergencyBeds = emergencyBeds.filter((b) => b.status === "occupied").length;
    const availableEmergencyBeds = emergencyBeds.length > 0 ? emergencyBeds.filter((b) => b.status === "available").length : 8;

    const ambulanceFleet = [
      { id: "AMB-01", regNumber: "DL-01-EA-1081", type: "Advanced Life Support (ALS)", status: "available", driver: "Ramesh Kumar", contact: "+91 98111 22331" },
      { id: "AMB-02", regNumber: "DL-01-EA-1082", type: "Basic Life Support (BLS)", status: "available", driver: "Sunil Verma", contact: "+91 98111 22332" },
      { id: "AMB-03", regNumber: "DL-01-EA-1083", type: "Cardiac Mobile ICU", status: occupiedEmergencyBeds > 0 ? "on_call" : "available", driver: "Deepak Yadav", contact: "+91 98111 22333" },
      { id: "AMB-04", regNumber: "DL-01-EA-1084", type: "Neonatal Transport", status: "available", driver: "Mohd. Arif", contact: "+91 98111 22334" },
    ];

    const emergencyOccupancyPct = totalEmergencyBeds > 0 ? Math.round((occupiedEmergencyBeds / totalEmergencyBeds) * 100) : 33;

    return res.status(200).json({
      success: true,
      stats: {
        totalEmergencyBeds,
        occupiedEmergencyBeds,
        availableEmergencyBeds,
        criticalLabAlerts: criticalLabs.length,
        triageActiveCases: occupiedEmergencyBeds,
      },
      metrics: {
        emergencyBedsAvailable: availableEmergencyBeds,
        emergencyBedsTotal: totalEmergencyBeds,
        emergencyOccupancyPct,
        icuBedsAvailable: 4,
        icuBedsTotal: 10,
        activeEmergencyAdmissionsCount: occupiedEmergencyBeds || recentEmergencyPatients.length,
      },
      activeAdmissions: recentEmergencyPatients.map((p, idx) => ({
        _id: p._id,
        patient: p,
        bedNumber: `ER-${idx + 1}`,
        triageLevel: idx === 0 ? "Immediate" : idx === 1 ? "Urgent" : "Delayed",
        chiefComplaint: idx === 0 ? "Acute Myocardial Infarction / Chest Pain" : idx === 1 ? "Polytrauma / Road Accident" : "Severe Respiratory Distress",
        admissionDate: new Date(Date.now() - (idx + 1) * 3600000),
      })),
      ambulanceFleet,
      criticalLabs,
      emergencyBeds,
      recentEmergencyPatients,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load emergency telemetry" });
  }
};

// ── 11. OPERATING THEATRE (OT) ──────────────────────────────────────────────
// GET /api/admin/operating-theatre
export const getOperatingTheatreSchedule = async (req, res) => {
  try {
    const procedures = await ProcedureSchedule.find()
      .populate("patient", "name age gender")
      .populate("leadSurgeon", "name specialization department")
      .sort({ scheduledDate: -1 });

    const defaultTheatres = [
      { room: "OT 1 (Major - Cardiac/Neuro)", type: "Laminar Flow Suite (ISO 5)", status: procedures.some((p) => p.status === "in_progress") ? "occupied" : "available" },
      { room: "OT 2 (Orthopedics & Trauma)", type: "C-Arm Fluoroscopy Suite", status: "available" },
      { room: "OT 3 (General Surgery)", type: "High-Definition Laparoscopy Suite", status: "available" },
      { room: "OT 4 (Laparoscopy / Day Care)", type: "Endoscopic & Day Surgery Suite", status: "available" },
    ];

    return res.status(200).json({ success: true, procedures, theatres: defaultTheatres });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch OT schedules" });
  }
};

// POST /api/admin/operating-theatre
export const createProcedureSchedule = async (req, res) => {
  try {
    const { procedureName, patient, leadSurgeon, anesthetist, operatingRoom, scheduledDate, startTime, durationMinutes, preOpInstructions } = req.body;

    if (!procedureName || !patient || !leadSurgeon || !scheduledDate) {
      return res.status(400).json({ message: "Procedure name, patient, lead surgeon, and scheduled date are required" });
    }

    const procedure = await ProcedureSchedule.create({
      procedureName,
      patient,
      leadSurgeon,
      anesthetist: anesthetist || "Hospital On-Call Anesthesiologist",
      operatingRoom: operatingRoom || "OT Suite 1 (General & Laparoscopy)",
      scheduledDate: new Date(scheduledDate),
      startTime: startTime || "09:00 AM",
      durationMinutes: durationMinutes ? Number(durationMinutes) : 90,
      preOpInstructions: preOpInstructions || "Standard pre-operative fasting and PAC clearance required",
      status: "scheduled",
    });

    await logAuditEvent({
      user: req.user,
      action: "Scheduled Surgery / Procedure",
      module: "procedures",
      recordId: procedure._id,
      details: `Scheduled ${procedureName} in ${operatingRoom} on ${scheduledDate}`,
      req,
    });

    return res.status(201).json({ success: true, message: "Procedure scheduled successfully", procedure });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to schedule procedure" });
  }
};

// ── 12. AUDIT LOGS ──────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const { module, action, search, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (module && module !== "All") filter.module = module;
    if (action && action !== "All") filter.action = action;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ userName: regex }, { details: regex }, { action: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve system audit logs" });
  }
};

// ── 13. HOSPITAL SETTINGS & CONFIGURATION ───────────────────────────────────
// GET /api/admin/settings
export const getHospitalSettings = async (req, res) => {
  try {
    let settings = await HospitalSetting.findOne();
    if (!settings) {
      settings = await HospitalSetting.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load hospital settings" });
  }
};

// PATCH /api/admin/settings
export const updateHospitalSettings = async (req, res) => {
  try {
    let settings = await HospitalSetting.findOne();
    if (!settings) {
      settings = new HospitalSetting({});
    }

    const updatableFields = [
      "hospitalName",
      "tagline",
      "accreditation",
      "emergencyHelpline",
      "hospitalPhone",
      "hospitalEmail",
      "address",
      "city",
      "opdConsultationFee",
      "operatingHours",
      "tpaDeskContact",
      "notificationEmailAlerts",
      "systemMaintenanceMode",
    ];

    updatableFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        settings[f] = req.body[f];
      }
    });

    await settings.save();

    await logAuditEvent({
      user: req.user,
      action: "Updated Hospital Configuration",
      module: "settings",
      recordId: settings._id,
      details: "Modified institutional hospital configuration",
      req,
    });

    return res.status(200).json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to update hospital settings" });
  }
};

// ── INSURANCE CLAIMS DESK ───────────────────────────────────────────────────
// GET /api/admin/insurance-claims?status=pending_verification|approved|rejected
export const getInsuranceClaims = async (req, res) => {
  try {
    const { status } = req.query;
    const validStatuses = ["pending_verification", "approved", "rejected"];
    const filter = {
      "insuranceDetails.status": { $in: validStatuses },
    };
    if (validStatuses.includes(status)) {
      filter["insuranceDetails.status"] = status;
    }

    const [claims, summary] = await Promise.all([
      Billing.find(filter)
        .populate("patient", "name age gender contactNumber email bloodGroup")
        .populate({
          path: "appointment",
          select: "appointmentDate timeSlot status reasonForVisit doctor",
          populate: { path: "doctor", select: "name specialization department" },
        })
        .sort({ createdAt: -1 })
        .limit(200),
      Billing.aggregate([
        { $match: { "insuranceDetails.status": { $in: validStatuses } } },
        {
          $group: {
            _id: "$insuranceDetails.status",
            count: { $sum: 1 },
            total: { $sum: { $ifNull: ["$totalAmount", 0] } },
          },
        },
      ]),
    ]);

    const counts = { pending_verification: 0, approved: 0, rejected: 0 };
    summary.forEach((s) => {
      counts[s._id] = s.count;
    });

    return res.status(200).json({
      success: true,
      claims,
      summary: {
        counts,
        pendingAmount: counts.pending_verification
          ? summary.find((s) => s._id === "pending_verification")?.total || 0
          : 0,
      },
    });
  } catch (error) {
    console.error("Insurance claims error:", error);
    return res.status(500).json({ message: "Unable to load insurance claims" });
  }
};

// PATCH /api/admin/insurance-claims/:billingId/decision
// body: { decision: "approved" | "rejected", notes? }
export const decideInsuranceClaim = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { decision, notes } = req.body;

    if (!mongoose.isValidObjectId(billingId)) {
      return res.status(400).json({ message: "Invalid billing ID" });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }

    const billing = await Billing.findById(billingId);
    if (!billing || !billing.insuranceDetails) {
      return res.status(404).json({ message: "Insurance claim not found for this invoice" });
    }
    if (billing.insuranceDetails.status === "approved") {
      return res.status(400).json({ message: "This claim is already approved" });
    }

    if (decision === "approved") {
      billing.insuranceDetails.status = "approved";
      if (notes) {
        billing.insuranceDetails.notes = `${billing.insuranceDetails.notes ? billing.insuranceDetails.notes + " " : ""}[Preauth approved: ${notes}]`;
      }
      billing.paymentStatus = "paid";
      billing.paymentMethod = "insurance";
      billing.paymentDate = new Date();
    } else {
      billing.insuranceDetails.status = "rejected";
      billing.insuranceDetails.notes = `${billing.insuranceDetails.notes ? billing.insuranceDetails.notes + " " : ""}[Claim rejected: ${notes || "Reason not specified"}]`;
      // Invoice remains payable by the patient.
    }

    await billing.save();

    await logAuditEvent({
      user: req.user,
      action: "insurance_claim_decision",
      module: "billing",
      recordId: billing._id,
      details: { decision, billingId: billing._id, notes: notes || "" },
      req,
    });

    return res.status(200).json({
      success: true,
      message:
        decision === "approved"
          ? "Insurance claim approved and invoice settled via insurance."
          : "Insurance claim rejected. Invoice remains due from the patient.",
      billing,
    });
  } catch (error) {
    console.error("Insurance decision error:", error);
    return res.status(500).json({ message: "Unable to process insurance decision" });
  }
};

// ── PATIENT FEEDBACK QUALITY DESK ───────────────────────────────────────────
// GET /api/admin/feedback?status=new|reviewed
export const getFeedbackReview = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === "new" || status === "reviewed") {
      filter.status = status;
    }

    const [feedbackList, summary] = await Promise.all([
      Feedback.find(filter)
        .populate("patient", "name age gender contactNumber")
        .populate("appointment", "appointmentDate timeSlot")
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 })
        .limit(200),
      Feedback.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            avg: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const summaryByStatus = {
      new: summary.find((s) => s._id === "new") || { count: 0, avg: 0 },
      reviewed: summary.find((s) => s._id === "reviewed") || { count: 0, avg: 0 },
    };

    const overall = await Feedback.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: "$rating" } } },
    ]);

    return res.status(200).json({
      success: true,
      feedback: feedbackList,
      summary: {
        total: overall[0]?.count || 0,
        averageRating: overall[0]?.avg ? Number(overall[0].avg.toFixed(1)) : 0,
        new: summaryByStatus.new.count,
        reviewed: summaryByStatus.reviewed.count,
        averageNewRating: summaryByStatus.new.avg ? Number(summaryByStatus.new.avg.toFixed(1)) : 0,
      },
    });
  } catch (error) {
    console.error("Feedback review error:", error);
    return res.status(500).json({ message: "Unable to load patient feedback" });
  }
};

// PATCH /api/admin/feedback/:id/review
export const reviewFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid feedback ID" });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.status = "reviewed";
    feedback.response = response ? String(response).trim() : "";
    feedback.respondedBy = req.user?.name || req.user?.role || "Hospital Quality Desk";
    feedback.respondedAt = new Date();
    await feedback.save();

    return res.status(200).json({
      success: true,
      message: "Feedback reviewed and response recorded.",
      feedback,
    });
  } catch (error) {
    console.error("Feedback review update error:", error);
    return res.status(500).json({ message: "Unable to update feedback review status" });
  }
};

import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Bed from "../models/Bed.js";
import Billing from "../models/Billing.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import DeskHandover from "../models/DeskHandover.js";
import FrontDeskTask from "../models/FrontDeskTask.js";

// Helper: log audit action
const logReceptionistAudit = async (req, action, details = "") => {
  try {
    await AuditLog.create({
      action,
      performedBy: req?.user?._id,
      performedByName: req?.user?.name || "Reception Staff",
      performedByRole: req?.user?.role || "receptionist",
      details,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    });
  } catch (err) {
    console.error("Receptionist audit error:", err.message);
  }
};

// ── 1. RECEPTIONIST TELEMETRY ────────────────────────────────────────────────
// GET /api/receptionist/telemetry
export const getReceptionistTelemetry = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        metrics: {
          admittedPatients: 14,
          todayAppointments: 28,
          waitingPatients: 5,
          pendingAdmissions: 2,
          pendingCashierBills: 3,
          onlineBookings: 4,
          availableBeds: 18,
          cancelledAppointments: 1,
          checkedInPatients: 12,
          patientsWaitingForDoctor: 5,
          dischargesToday: 3,
          emergencyCases: 2,
          todayCollections: 14500,
          totalBeds: 32,
          bedOccupancy: 44,
        },
        recentAppointments: [],
        todayQueue: [],
        isOfflineDemo: true,
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      admittedPatients,
      todayAppointments,
      waitingPatients,
      pendingCashierBills,
      onlineBookings,
      availableBeds,
      cancelledAppointments,
      checkedInPatients,
      patientsWaitingForDoctor,
      emergencyCases,
      todayPaidBills,
      recentAppointments,
      todayQueue,
    ] = await Promise.all([
      Bed.countDocuments({ status: "occupied" }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["waiting", "checked_in"] },
      }),
      Billing.countDocuments({ paymentStatus: { $in: ["pending", "partially_paid"] } }),
      Appointment.countDocuments({
        bookedBy: "patient",
        status: "pending",
      }),
      Bed.countDocuments({ status: "available" }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: "cancelled",
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["checked_in", "waiting", "in_consultation", "in_progress", "completed"] },
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["checked_in", "waiting"] },
      }),
      Appointment.countDocuments({
        appointmentType: "emergency",
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Billing.find({
        paymentStatus: "paid",
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }).select("totalAmount"),
      Appointment.find()
        .populate("patient", "name contactNumber age gender abhaId")
        .populate("doctor", "name specialization department")
        .sort({ appointmentDate: -1 })
        .limit(8),
      Appointment.find({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["checked_in", "waiting", "in_consultation"] },
      })
        .populate("patient", "name contactNumber age gender")
        .populate("doctor", "name specialization department")
        .sort({ checkedInAt: 1 })
        .limit(6),
    ]);

    const todayCollections = todayPaidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // Bed overview
    const totalBeds = await Bed.countDocuments();
    const bedOccupancy = totalBeds > 0 ? Math.round((admittedPatients / totalBeds) * 100) : 0;

    return res.status(200).json({
      success: true,
      metrics: {
        admittedPatients,
        todayAppointments,
        waitingPatients,
        pendingAdmissions: 0,
        pendingCashierBills,
        onlineBookings,
        availableBeds,
        cancelledAppointments,
        checkedInPatients,
        patientsWaitingForDoctor,
        dischargesToday: 0,
        emergencyCases,
        todayCollections,
        totalBeds,
        bedOccupancy,
      },
      recentAppointments,
      todayQueue,
    });
  } catch (error) {
    console.error("Receptionist telemetry error:", error);
    return res.status(500).json({ message: "Failed to compile front desk telemetry" });
  }
};

// ── 2. FRONT DESK WORK QUEUE ─────────────────────────────────────────────────
// GET /api/receptionist/work-queue
export const getFrontDeskWorkQueue = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: 0, queue: [] });
    }

    const { category } = req.query;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const queueItems = [];

    // 1. Online Bookings requiring confirmation
    if (!category || category === "all" || category === "online_booking") {
      const pendingOnline = await Appointment.find({
        bookedBy: "patient",
        status: "pending",
      })
        .populate("patient", "name contactNumber email")
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 })
        .limit(10);

      for (const app of pendingOnline) {
        queueItems.push({
          id: `online-${app._id}`,
          originalId: app._id,
          category: "online_booking",
          patient: app.patient?.name || "Patient",
          contactNumber: app.patient?.contactNumber,
          task: `Online Booking Confirmation: Dr. ${app.doctor?.name || "Doctor"} (${app.doctor?.department || "OPD"})`,
          dateTime: app.appointmentDate,
          timeSlot: app.timeSlot,
          priority: app.priority || "Normal",
          status: "Pending",
          actionType: "confirm_booking",
          actionLink: `/reception/online-bookings`,
          metadata: { appointmentId: app._id },
        });
      }
    }

    // 2. Today's Appointments waiting for check-in
    if (!category || category === "all" || category === "waiting_checkin") {
      const pendingCheckins = await Appointment.find({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["confirmed", "pending"] },
        bookedBy: { $ne: "patient" },
      })
        .populate("patient", "name contactNumber")
        .populate("doctor", "name specialization department")
        .sort({ timeSlot: 1 })
        .limit(10);

      for (const app of pendingCheckins) {
        queueItems.push({
          id: `checkin-${app._id}`,
          originalId: app._id,
          category: "waiting_checkin",
          patient: app.patient?.name || "Patient",
          contactNumber: app.patient?.contactNumber,
          task: `Arrival Check-In: Dr. ${app.doctor?.name || "Doctor"} (${app.timeSlot})`,
          dateTime: app.appointmentDate,
          timeSlot: app.timeSlot,
          priority: app.priority || "Normal",
          status: "Pending",
          actionType: "check_in",
          actionLink: `/reception/waiting-room`,
          metadata: { appointmentId: app._id },
        });
      }
    }

    // 3. Patients checked in and awaiting doctor
    if (!category || category === "all" || category === "awaiting_doctor") {
      const waiting = await Appointment.find({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ["checked_in", "waiting"] },
      })
        .populate("patient", "name contactNumber")
        .populate("doctor", "name specialization department")
        .sort({ checkedInAt: 1 })
        .limit(10);

      for (const app of waiting) {
        queueItems.push({
          id: `waiting-${app._id}`,
          originalId: app._id,
          category: "awaiting_doctor",
          patient: app.patient?.name || "Patient",
          contactNumber: app.patient?.contactNumber,
          task: `In Queue: Token ${app.tokenNumber || "Pending"} • Dr. ${app.doctor?.name || "Doctor"}`,
          dateTime: app.checkedInAt || app.appointmentDate,
          timeSlot: app.timeSlot,
          priority: app.priority || "Normal",
          status: "In Progress",
          actionType: "call_patient",
          actionLink: `/reception/waiting-room`,
          metadata: { appointmentId: app._id, tokenNumber: app.tokenNumber },
        });
      }
    }

    // 4. Pending cashier payments
    if (!category || category === "all" || category === "payment") {
      const unpaidBills = await Billing.find({
        paymentStatus: { $in: ["pending", "partially_paid"] },
      })
        .populate("patient", "name contactNumber")
        .sort({ createdAt: -1 })
        .limit(10);

      for (const bill of unpaidBills) {
        const invoiceNum = String(bill._id || "").slice(-6).toUpperCase();
        const amountStr = Number(bill.totalAmount || 0).toFixed(2);
        queueItems.push({
          id: `bill-${bill._id}`,
          originalId: bill._id,
          category: "payment",
          patient: bill.patient?.name || "Patient",
          contactNumber: bill.patient?.contactNumber,
          task: `Settle Invoice #${invoiceNum} • ₹${amountStr}`,
          dateTime: bill.createdAt,
          priority: "Normal",
          status: "Pending",
          actionType: "collect_payment",
          actionLink: `/billing`,
          metadata: { billingId: bill._id, amount: bill.totalAmount || 0 },
        });
      }
    }

    // 5. Custom desk tasks
    if (!category || category === "all" || category === "general_desk") {
      const customTasks = await FrontDeskTask.find({ status: { $ne: "Completed" } })
        .populate("patient", "name contactNumber")
        .sort({ dueDate: 1 })
        .limit(10);

      for (const t of customTasks) {
        queueItems.push({
          id: `custom-${t._id}`,
          originalId: t._id,
          category: t.category,
          patient: t.patient?.name || t.patientName || "Administrative",
          task: t.taskTitle,
          dateTime: t.dueDate,
          priority: t.priority,
          status: t.status,
          actionType: "custom_task",
          actionLink: t.actionLink || "#",
          metadata: { taskId: t._id },
        });
      }
    }

    return res.status(200).json({ success: true, count: queueItems.length, queue: queueItems });
  } catch (error) {
    console.error("Front desk work queue error:", error);
    return res.status(500).json({ message: "Failed to compile work queue" });
  }
};

// ── 3. DUPLICATE PATIENT DETECTION ───────────────────────────────────────────
// GET /api/receptionist/duplicate-check
export const checkDuplicatePatient = async (req, res) => {
  try {
    const { phone, email, name, patientId } = req.query;

    const conditions = [];

    if (phone && phone.trim()) {
      conditions.push({ contactNumber: phone.trim() });
    }
    if (email && email.trim()) {
      conditions.push({ email: email.trim().toLowerCase() });
    }
    if (patientId && patientId.trim()) {
      conditions.push({ patientId: patientId.trim() });
      conditions.push({ abhaId: patientId.trim() });
    }
    if (name && name.trim().length >= 3) {
      conditions.push({ name: new RegExp(name.trim(), "i") });
    }

    if (conditions.length === 0) {
      return res.status(200).json({ isDuplicate: false, matches: [] });
    }

    const matches = await Patient.find({ $or: conditions })
      .select("name age gender contactNumber email bloodGroup address patientId abhaId registrationDate")
      .limit(5);

    return res.status(200).json({
      isDuplicate: matches.length > 0,
      matches,
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.status(500).json({ message: "Failed to perform duplicate check" });
  }
};

// ── 4. PATIENT CHECK-IN & TOKEN GENERATION ───────────────────────────────────
// POST /api/receptionist/check-in/:id
export const checkInPatient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id)
      .populate("patient", "name contactNumber")
      .populate("doctor", "name specialization department");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Generate OPD Token
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const checkedInCount = await Appointment.countDocuments({
      doctor: appointment.doctor._id,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["checked_in", "waiting", "in_consultation", "completed"] },
    });

    const deptCode = (appointment.doctor?.department || "OPD").substring(0, 3).toUpperCase();
    const tokenSeq = String(checkedInCount + 1).padStart(3, "0");
    const tokenNumber = `${deptCode}-${tokenSeq}`;

    appointment.status = "checked_in";
    appointment.checkedInAt = new Date();
    appointment.tokenNumber = tokenNumber;
    appointment.queueNumber = checkedInCount + 1;
    await appointment.save();

    await logReceptionistAudit(
      req,
      "PATIENT_CHECK_IN",
      `Checked in ${appointment.patient?.name} for Dr. ${appointment.doctor?.name} (Token: ${tokenNumber})`
    );

    return res.status(200).json({
      success: true,
      message: "Patient checked in successfully",
      tokenNumber,
      queuePosition: checkedInCount + 1,
      appointment,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({ message: "Failed to check in patient" });
  }
};

// ── 5. WALK-IN APPOINTMENT CREATION ──────────────────────────────────────────
// POST /api/receptionist/walk-in
export const createWalkInAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, timeSlot, reasonForVisit, priority } = req.body;

    if (!patientId || !doctorId || !timeSlot || !reasonForVisit) {
      return res.status(400).json({ message: "Patient, doctor, time slot, and reason are required" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check slot availability or allow walk-in
    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: today,
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existing) {
      return res.status(409).json({ message: `Slot ${timeSlot} is already booked. Please choose an open slot.` });
    }

    // Determine OPD Token
    const deptCode = (doctor.department || "OPD").substring(0, 3).toUpperCase();
    const checkedInCount = await Appointment.countDocuments({
      doctor: doctorId,
      appointmentDate: today,
      status: { $in: ["checked_in", "waiting", "in_consultation", "completed"] },
    });
    const tokenNumber = `${deptCode}-${String(checkedInCount + 1).padStart(3, "0")}`;

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: today,
      timeSlot,
      reasonForVisit,
      appointmentType: "walk_in",
      priority: priority || "normal",
      status: "checked_in",
      checkedInAt: new Date(),
      tokenNumber,
      queueNumber: checkedInCount + 1,
      bookedBy: "staff",
    });

    // Create corresponding billing invoice
    const OPD_FEE = Number(doctor.consultationFee || 500);
    const invoice = await Billing.create({
      patient: patientId,
      appointment: appointment._id,
      itemizedCharges: [
        {
          description: `Walk-in Consultation Fee - Dr. ${doctor.name} (${doctor.department})`,
          cost: OPD_FEE,
        },
      ],
      totalAmount: OPD_FEE,
      paymentStatus: "pending",
    });

    await logReceptionistAudit(
      req,
      "WALK_IN_APPOINTMENT",
      `Created walk-in appointment for patient ${patientId} with Dr. ${doctor.name} (Token: ${tokenNumber})`
    );

    return res.status(201).json({
      success: true,
      message: "Walk-in appointment created & checked in",
      appointment,
      billing: invoice,
      tokenNumber,
    });
  } catch (error) {
    console.error("Walk-in creation error:", error);
    return res.status(500).json({ message: error.message || "Failed to create walk-in appointment" });
  }
};

// ── 6. WAITING ROOM QUEUE ───────────────────────────────────────────────────
// GET /api/receptionist/waiting-room
export const getWaitingRoomQueue = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoQueue = [
        {
          _id: "demo_q_1",
          tokenNumber: "OPD-101",
          queueNumber: 1,
          patient: { _id: "pat_1", name: "Ananya Sharma", age: 34, gender: "Female", contactNumber: "9876543210", bloodGroup: "B+" },
          doctor: { _id: "doc_1", name: "Dr. Sarah Jenkins", specialization: "Cardiology", department: "Cardiology" },
          appointmentTime: "10:30 AM",
          checkedInAt: new Date(Date.now() - 15 * 60000),
          waitingMinutes: 15,
          isDelayed: false,
          status: "waiting",
          priority: "normal",
          reasonForVisit: "Routine BP Checkup",
        },
        {
          _id: "demo_q_2",
          tokenNumber: "OPD-102",
          queueNumber: 2,
          patient: { _id: "pat_2", name: "Rahul Verma", age: 45, gender: "Male", contactNumber: "9876543211", bloodGroup: "O+" },
          doctor: { _id: "doc_2", name: "Dr. Marcus Vance", specialization: "Neurology", department: "Neurology" },
          appointmentTime: "11:00 AM",
          checkedInAt: new Date(Date.now() - 35 * 60000),
          waitingMinutes: 35,
          isDelayed: true,
          status: "waiting",
          priority: "urgent",
          reasonForVisit: "Migraine follow-up",
        },
      ];
      return res.status(200).json({ success: true, count: demoQueue.length, queue: demoQueue });
    }

    const { doctorId, department } = req.query;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const filter = {
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["checked_in", "waiting", "in_consultation", "completed", "no_show"] },
    };

    if (doctorId && mongoose.isValidObjectId(doctorId)) {
      filter.doctor = doctorId;
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name age gender contactNumber bloodGroup abhaId")
      .populate("doctor", "name specialization department")
      .sort({ checkedInAt: 1 });

    const queue = appointments.map((app) => {
      let waitingMinutes = 0;
      if (app.checkedInAt) {
        waitingMinutes = Math.max(0, Math.round((now - new Date(app.checkedInAt)) / 60000));
      }

      return {
        _id: app._id,
        tokenNumber: app.tokenNumber || `OPD-${app.queueNumber || 1}`,
        queueNumber: app.queueNumber || 1,
        patient: app.patient,
        doctor: app.doctor,
        appointmentTime: app.timeSlot,
        checkedInAt: app.checkedInAt,
        waitingMinutes,
        isDelayed: waitingMinutes > 30,
        status: app.status,
        priority: app.priority || "normal",
        reasonForVisit: app.reasonForVisit,
      };
    });

    return res.status(200).json({ success: true, count: queue.length, queue });
  } catch (error) {
    console.error("Waiting room queue error:", error);
    return res.status(500).json({ message: "Failed to fetch waiting room queue" });
  }
};

// PATCH /api/receptionist/waiting-room/:id/status
export const updateWaitingRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["checked_in", "waiting", "in_consultation", "completed", "no_show", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid waiting status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("patient", "name contactNumber")
      .populate("doctor", "name specialization");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await logReceptionistAudit(
      req,
      "QUEUE_STATUS_UPDATE",
      `Updated ${appointment.patient?.name} queue status to '${status}'`
    );

    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error("Update waiting status error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

// ── 7. DOCTOR AVAILABILITY ───────────────────────────────────────────────────
// GET /api/receptionist/doctor-availability
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Valid doctor ID required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: targetDate,
      status: { $ne: "cancelled" },
    }).select("timeSlot status patient");

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);
    const standardSlots = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
      "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
      "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
      "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    const slots = standardSlots.map((slot) => ({
      slot,
      isAvailable: !bookedSlots.includes(slot),
    }));

    return res.status(200).json({
      success: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        consultationFee: doctor.consultationFee,
        workingDays: doctor.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      date: targetDate,
      totalSlots: standardSlots.length,
      availableSlots: slots.filter((s) => s.isAvailable).length,
      slots,
    });
  } catch (error) {
    console.error("Doctor availability error:", error);
    return res.status(500).json({ message: "Failed to fetch availability" });
  }
};

// ── 8. ONLINE BOOKINGS MANAGEMENT ───────────────────────────────────────────
// GET /api/receptionist/online-bookings
export const getOnlineBookings = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { bookedBy: "patient" };
    if (status !== "all") {
      filter.status = status;
    }

    const bookings = await Appointment.find(filter)
      .populate("patient", "name contactNumber email age gender abhaId")
      .populate("doctor", "name specialization department consultationFee")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error("Online bookings fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch online bookings" });
  }
};

// PATCH /api/receptionist/online-bookings/:id/confirm
export const confirmOnlineBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newDate, newTimeSlot, reason } = req.body;

    const appointment = await Appointment.findById(id)
      .populate("patient", "name contactNumber email _id")
      .populate("doctor", "name specialization department");

    if (!appointment) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (action === "confirm") {
      appointment.status = "confirmed";
      await appointment.save();

      // Create notification for patient
      await Notification.create({
        recipientType: "patient",
        patient: appointment.patient._id,
        title: "Appointment Confirmed",
        message: `Your appointment with Dr. ${appointment.doctor?.name} has been confirmed for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.timeSlot}.`,
        type: "appointment_confirmed",
      });

      await logReceptionistAudit(
        req,
        "CONFIRM_ONLINE_BOOKING",
        `Confirmed online booking for ${appointment.patient?.name} with Dr. ${appointment.doctor?.name}`
      );
    } else if (action === "cancel") {
      appointment.status = "cancelled";
      appointment.notes = reason || "Cancelled by front desk";
      await appointment.save();

      await Notification.create({
        recipientType: "patient",
        patient: appointment.patient._id,
        title: "Appointment Update",
        message: `Your appointment request with Dr. ${appointment.doctor?.name} could not be confirmed: ${reason || "Desk cancellation"}.`,
        type: "appointment_cancelled",
      });

      await logReceptionistAudit(
        req,
        "CANCEL_ONLINE_BOOKING",
        `Cancelled online booking for ${appointment.patient?.name} (${reason})`
      );
    }

    return res.status(200).json({ success: true, message: `Booking ${action}ed successfully`, appointment });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({ message: "Failed to process booking confirmation" });
  }
};

// ── 9. DISCHARGE COORDINATION ───────────────────────────────────────────────
// GET /api/receptionist/discharges
export const getDischargeQueue = async (req, res) => {
  try {
    const occupiedBeds = await Bed.find({ status: "occupied" })
      .populate("currentAdmission.patient", "name age gender contactNumber abhaId")
      .populate("currentAdmission.attendingDoctor", "name specialization department");

    // Check billing status for each admitted patient
    const dischargeList = await Promise.all(
      occupiedBeds.map(async (bed) => {
        const patientId = bed.currentAdmission?.patient?._id;
        const unpaidBills = await Billing.countDocuments({
          patient: patientId,
          paymentStatus: { $in: ["pending", "partially_paid"] },
        });

        return {
          bedId: bed._id,
          bedNumber: bed.bedNumber,
          ward: bed.ward,
          floor: bed.floor,
          dailyRate: bed.dailyRate,
          patient: bed.currentAdmission?.patient,
          doctor: bed.currentAdmission?.attendingDoctor,
          admittedAt: bed.currentAdmission?.admittedAt,
          expectedDischargeDate: bed.currentAdmission?.expectedDischargeDate,
          admissionReason: bed.currentAdmission?.admissionReason,
          unpaidInvoicesCount: unpaidBills,
          isBillingCleared: unpaidBills === 0,
        };
      })
    );

    return res.status(200).json({ success: true, count: dischargeList.length, discharges: dischargeList });
  } catch (error) {
    console.error("Discharge queue error:", error);
    return res.status(500).json({ message: "Failed to fetch discharge queue" });
  }
};

// ── 10. DAILY FRONT DESK SUMMARY ────────────────────────────────────────────
// GET /api/receptionist/daily-summary
export const getDailyFrontDeskSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const target = date ? new Date(date) : new Date();
    const start = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0);
    const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);

    const [
      patientsRegistered,
      appointmentsToday,
      checkinsToday,
      consultationsCompleted,
      cancellationsToday,
      noShowsToday,
      admissionsToday,
      paidBills,
      pendingBills,
    ] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Appointment.countDocuments({ appointmentDate: { $gte: start, $lte: end } }),
      Appointment.countDocuments({
        appointmentDate: { $gte: start, $lte: end },
        status: { $in: ["checked_in", "waiting", "in_consultation", "completed"] },
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: start, $lte: end },
        status: "completed",
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: start, $lte: end },
        status: "cancelled",
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: start, $lte: end },
        status: "no_show",
      }),
      Bed.countDocuments({
        status: "occupied",
        "currentAdmission.admittedAt": { $gte: start, $lte: end },
      }),
      Billing.find({
        paymentStatus: "paid",
        createdAt: { $gte: start, $lte: end },
      }).select("totalAmount"),
      Billing.find({
        paymentStatus: { $in: ["pending", "partially_paid"] },
        createdAt: { $gte: start, $lte: end },
      }).select("totalAmount"),
    ]);

    const totalCollected = paidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalPending = pendingBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    return res.status(200).json({
      success: true,
      date: start,
      summary: {
        patientsRegistered,
        appointmentsToday,
        checkinsToday,
        consultationsCompleted,
        cancellationsToday,
        noShowsToday,
        admissionsToday,
        dischargesToday: 0,
        totalCollected,
        totalPending,
        settledInvoicesCount: paidBills.length,
        pendingInvoicesCount: pendingBills.length,
      },
    });
  } catch (error) {
    console.error("Daily summary error:", error);
    return res.status(500).json({ message: "Failed to compile daily summary" });
  }
};

// ── 11. DESK SHIFT HANDOVER ─────────────────────────────────────────────────
// GET /api/receptionist/handover
export const getDeskHandovers = async (req, res) => {
  try {
    const handovers = await DeskHandover.find()
      .populate("outgoingStaff", "name email")
      .populate("incomingStaff", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({ success: true, count: handovers.length, handovers });
  } catch (error) {
    console.error("Get desk handovers error:", error);
    return res.status(500).json({ message: "Failed to fetch handovers" });
  }
};

// POST /api/receptionist/handover
export const createDeskHandover = async (req, res) => {
  try {
    const { shiftType, deskNumber, administrativeNotes, pendingAdmissionsCount, unsettledPaymentsTotal, waitingPatientsCount, unconfirmedOnlineBookings } = req.body;

    const todayStr = new Date().toISOString().split("T")[0];

    const handover = await DeskHandover.create({
      shiftType: shiftType || "Morning",
      shiftDate: todayStr,
      deskNumber: deskNumber || "Desk 1 - Main Reception",
      outgoingStaff: req.user._id,
      outgoingStaffName: req.user.name || "Reception Staff",
      pendingAdmissionsCount: Number(pendingAdmissionsCount || 0),
      unsettledPaymentsTotal: Number(unsettledPaymentsTotal || 0),
      waitingPatientsCount: Number(waitingPatientsCount || 0),
      unconfirmedOnlineBookings: Number(unconfirmedOnlineBookings || 0),
      administrativeNotes: administrativeNotes || "",
      status: "Submitted",
    });

    await logReceptionistAudit(
      req,
      "DESK_SHIFT_HANDOVER",
      `Submitted shift handover for ${shiftType} shift (${deskNumber})`
    );

    return res.status(201).json({ success: true, message: "Shift handover recorded", handover });
  } catch (error) {
    console.error("Create handover error:", error);
    return res.status(400).json({ message: error.message || "Failed to record handover" });
  }
};

// PATCH /api/receptionist/handover/:id/acknowledge
export const acknowledgeDeskHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const handover = await DeskHandover.findByIdAndUpdate(
      id,
      {
        status: "Acknowledged",
        incomingStaff: req.user._id,
        incomingStaffName: req.user.name,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!handover) {
      return res.status(404).json({ message: "Handover record not found" });
    }

    await logReceptionistAudit(
      req,
      "ACKNOWLEDGE_HANDOVER",
      `Acknowledged shift handover ID ${id}`
    );

    return res.status(200).json({ success: true, message: "Handover acknowledged", handover });
  } catch (error) {
    console.error("Acknowledge handover error:", error);
    return res.status(500).json({ message: "Failed to acknowledge handover" });
  }
};

// ── 12. REFUND PROCESSING ───────────────────────────────────────────────────
// POST /api/receptionist/refund/:id
export const processBillingRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;

    const billing = await Billing.findById(id).populate("patient", "name");
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    billing.paymentStatus = "refunded";
    billing.refundDetails = {
      reason: reason || "Administrative front-desk refund",
      amount: amount !== undefined ? Number(amount) : billing.totalAmount,
      refundedAt: new Date(),
      refundedBy: req.user._id,
      status: "Completed",
    };
    await billing.save();

    await logReceptionistAudit(
      req,
      "BILLING_REFUND",
      `Processed refund of ₹${billing.refundDetails.amount} for patient ${billing.patient?.name} (Inv #${billing._id})`
    );

    return res.status(200).json({ success: true, message: "Refund processed successfully", billing });
  } catch (error) {
    console.error("Refund processing error:", error);
    return res.status(500).json({ message: "Failed to process refund" });
  }
};

// ── 13. ADMINISTRATIVE NOTIFICATION ─────────────────────────────────────────
// POST /api/receptionist/notification
export const sendAdministrativeNotification = async (req, res) => {
  try {
    const { patientId, title, message, type } = req.body;
    if (!patientId || !title || !message) {
      return res.status(400).json({ message: "Patient ID, title, and message are required" });
    }

    const notification = await Notification.create({
      recipientType: "patient",
      patient: patientId,
      title,
      message,
      type: type || "general",
    });

    return res.status(201).json({ success: true, message: "Notification sent", notification });
  } catch (error) {
    console.error("Notification send error:", error);
    return res.status(500).json({ message: "Failed to send notification" });
  }
};

// ── 14. APPOINTMENT REMINDERS QUEUE ─────────────────────────────────────────
// GET /api/receptionist/reminders
export const getAppointmentReminders = async (req, res) => {
  try {
    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const reminders = await Appointment.find({
      appointmentDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      status: { $in: ["confirmed", "pending"] },
    })
      .populate("patient", "name contactNumber email")
      .populate("doctor", "name specialization department")
      .sort({ timeSlot: 1 });

    return res.status(200).json({ success: true, count: reminders.length, reminders });
  } catch (error) {
    console.error("Reminders queue error:", error);
    return res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

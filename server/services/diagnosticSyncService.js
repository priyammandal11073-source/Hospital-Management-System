import DiagnosticOrder from "../models/DiagnosticOrder.js";
import DiagnosticReport from "../models/DiagnosticReport.js";
import DiagnosticTest from "../models/DiagnosticTest.js";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Equipment from "../models/Equipment.js";
import Bed from "../models/Bed.js";
import NursingTask from "../models/NursingTask.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Hospital-wide Diagnostic Synchronization Service
 * Centralizes cross-portal mutations, notifications, billing sync, and audit trails
 */
class DiagnosticSyncService {
  /**
   * 1. On Diagnostic Request Created
   * Triggered when a Doctor or Receptionist orders a diagnostic test
   */
  async onDiagnosticRequestCreated(order, userContext = {}) {
    try {
      // 1. Fetch complete order with patient details if needed
      const populatedOrder = await DiagnosticOrder.findById(order._id)
        .populate("patient")
        .populate("test");

      if (!populatedOrder) return order;

      const patient = populatedOrder.patient;
      const test = populatedOrder.test;

      // 2. Check if patient is currently an Inpatient
      let activeBedStay = null;
      if (patient) {
        activeBedStay = await Bed.findOne({
          "currentAdmission.patient": patient._id,
          status: "occupied",
        });

        if (activeBedStay) {
          populatedOrder.isInpatient = true;
          populatedOrder.bedNumber = activeBedStay.bedNumber || "";
          populatedOrder.ward = activeBedStay.ward || "";
        }
      }

      // Check test preparation requirements from catalog if not already set
      if (test && test.preparationInstructions) {
        populatedOrder.preparationRequired = true;
        if (!populatedOrder.preparationInstructions) {
          populatedOrder.preparationInstructions = test.preparationInstructions;
        }
      }

      // 3. Billing Integration - Automatically create or link itemized diagnostic charge
      let existingBilling = await Billing.findOne({
        diagnosticOrder: populatedOrder._id,
      });

      if (!existingBilling) {
        const itemCharge = {
          description: `Diagnostic: ${populatedOrder.testName} (${populatedOrder.testCode || "DX"})`,
          cost: Number(populatedOrder.price) || 0,
        };

        const newBilling = await Billing.create({
          patient: populatedOrder.patient._id,
          diagnosticOrder: populatedOrder._id,
          itemizedCharges: [itemCharge],
          totalAmount: Number(populatedOrder.price) || 0,
          paymentStatus: "pending",
        });

        populatedOrder.billing = newBilling._id;
        populatedOrder.billingStatus = "Pending";
      }

      // 4. Inpatient Workflow Integration - Auto-create Nursing Tasks for Admitted Patients
      if (populatedOrder.isInpatient) {
        if (populatedOrder.preparationRequired || (test && test.preparationInstructions)) {
          const prepTask = await NursingTask.create({
            patient: populatedOrder.patient._id,
            diagnosticOrder: populatedOrder._id,
            taskType: "Patient Preparation",
            title: `Pre-Diagnostic Prep: ${populatedOrder.testName}`,
            description:
              populatedOrder.preparationInstructions ||
              `Prepare patient for diagnostic procedure (${populatedOrder.priority} Priority).`,
            priority:
              populatedOrder.priority === "STAT"
                ? "Critical"
                : populatedOrder.priority === "Urgent"
                ? "High"
                : "Routine",
            dueTime: populatedOrder.scheduledDate || new Date(Date.now() + 2 * 60 * 60 * 1000),
            status: "Pending",
          });
          populatedOrder.nursingTask = prepTask._id;
        }

        if (populatedOrder.transportRequired) {
          await NursingTask.create({
            patient: populatedOrder.patient._id,
            diagnosticOrder: populatedOrder._id,
            taskType: "Patient Transport",
            title: `Transport for ${populatedOrder.testName} (${populatedOrder.orderNumber})`,
            description: `Transfer patient from ${populatedOrder.ward || "Ward"} Bed ${
              populatedOrder.bedNumber || ""
            } to ${populatedOrder.assignedRoom || "Diagnostic Suite"}.`,
            priority:
              populatedOrder.priority === "STAT"
                ? "Critical"
                : populatedOrder.priority === "Urgent"
                ? "High"
                : "Routine",
            dueTime: populatedOrder.scheduledDate || new Date(Date.now() + 1 * 60 * 60 * 1000),
            status: "Pending",
          });
        }
      }

      await populatedOrder.save();

      // 5. Notifications
      // Notification to Patient
      if (patient) {
        await Notification.create({
          recipientType: "patient",
          patient: patient._id,
          title: "Diagnostic Test Ordered",
          message: `Your doctor ordered ${populatedOrder.testName}. Status: Requested.`,
          type: "diagnostic_ordered",
          diagnosticOrder: populatedOrder._id,
          link: "/patient/dashboard",
        });
      }

      // Notification to Doctor
      if (populatedOrder.doctor) {
        const doctorDoc = await Doctor.findById(populatedOrder.doctor);
        if (doctorDoc && doctorDoc.user) {
          await Notification.create({
            recipientType: "staff",
            user: doctorDoc.user,
            title: "Diagnostic Order Recorded",
            message: `Diagnostic request for ${populatedOrder.patientName} (${populatedOrder.testName}) is queued.`,
            type: "diagnostic_ordered",
            diagnosticOrder: populatedOrder._id,
            link: "/doctor/orders",
          });
        }
      }

      // Notification to Nurse Station if inpatient
      if (populatedOrder.isInpatient) {
        await Notification.create({
          recipientType: "staff",
          role: "nurse",
          title: `Inpatient Diagnostic: ${populatedOrder.testName}`,
          message: `Diagnostic order received for admitted patient ${populatedOrder.patientName} (${populatedOrder.bedNumber || "Bed"}).`,
          type: "diagnostic_ordered",
          diagnosticOrder: populatedOrder._id,
          link: "/nurse/tasks",
        });
      }

      // Pharmacy Notification for Contrast Media & Consumables
      if (populatedOrder.requiresContrast || (test && test.contrastRequired)) {
        await Notification.create({
          recipientType: "staff",
          role: "pharmacist",
          title: `Diagnostic Contrast Required: ${populatedOrder.testName}`,
          message: `Contrast media required for ${populatedOrder.testName} (${populatedOrder.orderNumber}) for ${populatedOrder.patientName}. Verify batch stock.`,
          type: "diagnostic_ordered",
          diagnosticOrder: populatedOrder._id,
          link: "/pharmacy/inventory",
        });
      }

      // 6. Audit Trail
      await AuditLog.create({
        user: userContext.userId || null,
        userName: userContext.userName || populatedOrder.doctorName || "Staff",
        role: userContext.role || "doctor",
        action: "Diagnostic Request Created",
        module: "diagnostics",
        recordId: populatedOrder.orderNumber,
        details: `Ordered ${populatedOrder.testName} for ${populatedOrder.patientName} (Priority: ${populatedOrder.priority}, Inpatient: ${populatedOrder.isInpatient})`,
      });

      return populatedOrder;
    } catch (error) {
      console.error("[DiagnosticSyncService] onDiagnosticRequestCreated error:", error);
      throw error;
    }
  }

  /**
   * 2. On Diagnostic Scheduled
   * Verifies equipment availability, prevents conflicts, schedules appointment & notifies
   */
  async onDiagnosticScheduled({
    orderId,
    scheduledDate,
    timeSlot,
    equipmentId,
    roomId,
    technicianId,
    userContext = {},
  }) {
    const order = await DiagnosticOrder.findById(orderId).populate("patient");
    if (!order) throw new Error("Diagnostic order not found");

    const targetDate = new Date(scheduledDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Equipment Conflict & Status Check
    if (equipmentId) {
      const equip = await Equipment.findById(equipmentId);
      if (equip) {
        const s = String(equip.status || "").toLowerCase();
        if (s.includes("maintenance") || s.includes("service")) {
          throw new Error(
            `Equipment '${equip.name}' is currently ${equip.status}. Cannot schedule diagnostic booking.`
          );
        }
        order.assignedEquipment = equip._id;
        order.assignedEquipmentName = equip.name;
      }

      // Check for double booking conflict on the same equipment & time slot
      const existingConflict = await Appointment.findOne({
        equipment: equipmentId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: timeSlot,
        status: { $in: ["pending", "confirmed", "waiting", "checked_in"] },
        diagnosticOrder: { $ne: order._id },
      });

      if (existingConflict) {
        throw new Error(
          `Equipment conflict: Selected equipment is already scheduled for slot '${timeSlot}' on ${targetDate.toLocaleDateString()}.`
        );
      }

      const existingOrderConflict = await DiagnosticOrder.findOne({
        assignedEquipment: equipmentId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        scheduledTimeSlot: timeSlot,
        status: { $in: ["Scheduled", "Patient Ready", "Procedure Started", "In Progress"] },
        _id: { $ne: order._id },
      });

      if (existingOrderConflict) {
        throw new Error(
          `Equipment conflict: Equipment is already booked by order ${existingOrderConflict.orderNumber} for slot '${timeSlot}'.`
        );
      }
    }

    if (roomId) order.assignedRoom = roomId;
    if (technicianId) {
      order.assignedTechnician = technicianId;
      const techUser = await User.findById(technicianId);
      if (techUser) order.assignedTechnicianName = techUser.name;
    }

    order.scheduledDate = targetDate;
    order.scheduledTimeSlot = timeSlot;
    order.status = "Scheduled";

    // 2. Create or Synchronize Appointment Record
    let appointment = null;
    if (order.appointment) {
      appointment = await Appointment.findById(order.appointment);
    }

    if (!appointment) {
      appointment = new Appointment({
        patient: order.patient._id,
        doctor: order.doctor || undefined,
        appointmentDate: targetDate,
        timeSlot: timeSlot,
        status: "confirmed",
        reasonForVisit: `Diagnostic: ${order.testName}`,
        appointmentType: "diagnostic",
        isDiagnostic: true,
        diagnosticOrder: order._id,
        equipment: equipmentId || undefined,
        room: order.assignedRoom || "",
        modality: order.modality || "",
        priority:
          order.priority === "STAT"
            ? "emergency"
            : order.priority === "Urgent"
            ? "urgent"
            : "normal",
        bookedBy: "staff",
      });
    } else {
      appointment.appointmentDate = targetDate;
      appointment.timeSlot = timeSlot;
      appointment.status = "confirmed";
      appointment.equipment = equipmentId || appointment.equipment;
      appointment.room = order.assignedRoom || appointment.room;
      appointment.modality = order.modality || appointment.modality;
    }

    await appointment.save();
    order.appointment = appointment._id;
    await order.save();

    // 3. Multi-Portal Notifications
    // Patient Notification
    await Notification.create({
      recipientType: "patient",
      patient: order.patient._id,
      title: "Diagnostic Appointment Scheduled",
      message: `Your ${order.testName} has been scheduled for ${targetDate.toLocaleDateString()} at ${timeSlot} in ${
        order.assignedRoom || "Suite A"
      }.${order.preparationInstructions ? " Prep: " + order.preparationInstructions : ""}`,
      type: "diagnostic_scheduled",
      diagnosticOrder: order._id,
      link: "/patient/my-appointments",
    });

    // Ordering Doctor Notification
    if (order.doctor) {
      const doctorDoc = await Doctor.findById(order.doctor);
      if (doctorDoc && doctorDoc.user) {
        await Notification.create({
          recipientType: "staff",
          user: doctorDoc.user,
          title: "Diagnostic Test Scheduled",
          message: `Test ${order.testName} for ${order.patientName} is scheduled for ${targetDate.toLocaleDateString()} at ${timeSlot}.`,
          type: "diagnostic_scheduled",
          diagnosticOrder: order._id,
          link: "/doctor/orders",
        });
      }
    }

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Staff",
      role: userContext.role || "staff",
      action: "Diagnostic Appointment Scheduled",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Scheduled ${order.testName} on ${targetDate.toLocaleDateString()} at ${timeSlot} (Room: ${order.assignedRoom})`,
    });

    return { order, appointment };
  }

  /**
   * 3. On Patient Checked In
   * Triggered when Receptionist or Diagnostic Desk checks in a patient
   */
  async onPatientCheckedIn({ orderId, appointmentId, userContext = {} }) {
    let order = null;
    if (orderId) {
      order = await DiagnosticOrder.findById(orderId).populate("patient");
    } else if (appointmentId) {
      order = await DiagnosticOrder.findOne({ appointment: appointmentId }).populate("patient");
    }

    if (!order) throw new Error("Diagnostic order not found for check-in");

    order.status = "Patient Ready";
    await order.save();

    // Synchronize Appointment status
    if (order.appointment) {
      await Appointment.findByIdAndUpdate(order.appointment, {
        status: "checked_in",
        checkedInAt: new Date(),
      });
    }

    // Notify Diagnostic Technician
    await Notification.create({
      recipientType: "staff",
      role: "diagnostic_tech",
      title: "Patient Ready for Diagnostic",
      message: `Patient ${order.patientName} is checked in and waiting for ${order.testName} (${order.assignedRoom}).`,
      type: "diagnostic_checkin",
      diagnosticOrder: order._id,
      link: "/diagnostics/workbench",
    });

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Receptionist",
      role: userContext.role || "receptionist",
      action: "Patient Checked In for Diagnostic",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Patient ${order.patientName} checked in for ${order.testName}. Status updated to 'Patient Ready'`,
    });

    return order;
  }

  /**
   * 4. On Sample Collected
   * Triggered in Pathology workflow when phlebotomist collects specimen
   */
  async onSampleCollected(orderIdOrParams, sampleDocArg = {}, userContextArg = {}) {
    let orderId, sampleDoc, userContext;
    if (typeof orderIdOrParams === "object" && orderIdOrParams.orderId) {
      orderId = orderIdOrParams.orderId;
      sampleDoc = orderIdOrParams.sampleDoc || { _id: null, sampleId: orderIdOrParams.sampleBarcode, sampleType: "Specimen" };
      userContext = orderIdOrParams.userContext || {};
    } else {
      orderId = orderIdOrParams;
      sampleDoc = sampleDocArg || {};
      userContext = userContextArg || {};
    }

    const order = await DiagnosticOrder.findById(orderId).populate("patient");
    if (!order) return null;

    order.status = "Sample Collected";
    if (sampleDoc?._id) order.sample = sampleDoc._id;
    await order.save();

    // If there is an associated nursing task for sample collection, mark it completed
    if (order.nursingTask) {
      await NursingTask.findByIdAndUpdate(order.nursingTask, {
        status: "Completed",
        completedAt: new Date(),
        completedByName: userContext.userName || "Phlebotomist",
      });
    }

    // Notifications
    if (order.patient?._id) {
      await Notification.create({
        recipientType: "patient",
        patient: order.patient._id,
        title: "Sample Collected",
        message: `Specimen (${sampleDoc?.sampleType || "Specimen"}) collected successfully for ${order.testName}. Processing in laboratory.`,
        type: "sample_collected",
        diagnosticOrder: order._id,
        link: "/patient/dashboard",
      });
    }

    if (order.doctor) {
      const doctorDoc = await Doctor.findById(order.doctor);
      if (doctorDoc && doctorDoc.user) {
        await Notification.create({
          recipientType: "staff",
          user: doctorDoc.user,
          title: "Sample Collected",
          message: `Specimen collected for patient ${order.patientName} (${order.testName}).`,
          type: "sample_collected",
          diagnosticOrder: order._id,
          link: "/doctor/orders",
        });
      }
    }

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Technician",
      role: userContext.role || "technician",
      action: "Diagnostic Sample Collected",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Collected sample for test ${order.testName}`,
    });

    return order;
  }

  /**
   * 5. On Sample Rejected
   * Triggered if sample is hemolyzed, clotted, or insufficient
   */
  async onSampleRejected(orderIdOrParams, rejectionReasonArg = "", userContextArg = {}) {
    let orderId, rejectionReason, userContext;
    if (typeof orderIdOrParams === "object" && orderIdOrParams.orderId) {
      orderId = orderIdOrParams.orderId;
      rejectionReason = orderIdOrParams.rejectionReason || "Specimen hemolyzed/insufficient";
      userContext = orderIdOrParams.userContext || {};
    } else {
      orderId = orderIdOrParams;
      rejectionReason = rejectionReasonArg;
      userContext = userContextArg || {};
    }

    const order = await DiagnosticOrder.findById(orderId).populate("patient");
    if (!order) return null;

    order.status = "Sample Rejected";
    order.rejectionReason = rejectionReason;
    await order.save();

    // Notify Doctor & Patient immediately
    if (order.patient?._id) {
      await Notification.create({
        recipientType: "patient",
        patient: order.patient._id,
        title: "Sample Recollection Required",
        message: `Your sample for ${order.testName} could not be processed (${rejectionReason}). Please visit the lab for recollection.`,
        type: "sample_rejected",
        diagnosticOrder: order._id,
        link: "/patient/dashboard",
      });
    }

    if (order.doctor) {
      const doctorDoc = await Doctor.findById(order.doctor);
      if (doctorDoc && doctorDoc.user) {
        await Notification.create({
          recipientType: "staff",
          user: doctorDoc.user,
          title: "Sample Rejected - Recollection Required",
          message: `Specimen rejected for ${order.patientName} (${order.testName}): ${rejectionReason}`,
          type: "sample_rejected",
          diagnosticOrder: order._id,
          link: "/doctor/orders",
        });
      }
    }

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Technician",
      role: userContext.role || "technician",
      action: "Diagnostic Sample Rejected",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Sample rejected for ${order.orderNumber}. Reason: ${rejectionReason}`,
    });

    return order;
  }

  /**
   * 6. On Diagnostic Test Completed
   * Triggered when technician records laboratory results or completes scan acquisition
   */
  async onTestCompleted(orderId, userContext = {}) {
    const order = await DiagnosticOrder.findById(orderId).populate("patient");
    if (!order) return;

    order.status = "Report Pending";
    await order.save();

    // Mark Appointment as completed if exists
    if (order.appointment) {
      await Appointment.findByIdAndUpdate(order.appointment, {
        status: "completed",
      });
    }

    // Notify Specialist (Pathologist/Radiologist) that review is pending
    await Notification.create({
      recipientType: "staff",
      role: order.diagnosticDepartment === "Radiology" ? "radiologist" : "pathologist",
      title: "Diagnostic Test Completed - Review Required",
      message: `${order.testName} for ${order.patientName} is completed and awaits specialist sign-off.`,
      type: "diagnostic_completed",
      diagnosticOrder: order._id,
      link: "/diagnostics/specialist-review",
    });

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Technician",
      role: userContext.role || "technician",
      action: "Diagnostic Test Completed",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Completed test for ${order.testName}. Status: Report Pending.`,
    });
  }

  /**
   * 7. On Report Finalized
   * Handles specialist approval, critical alerts escalation, patient/doctor portal syncing
   */
  async onReportFinalized(report, userContext = {}) {
    const order = await DiagnosticOrder.findById(report.order).populate("patient");
    if (!order) return;

    order.status = "Finalized";
    order.report = report._id;

    // Check for Critical Findings
    const isCritical =
      (report.criticalFindings && report.criticalFindings.isCritical === true) ||
      report.isCritical === true;

    if (isCritical) {
      order.isCritical = true;
      order.criticalDetails = {
        parameter: report.criticalFindings?.parameter || report.criticalParameters?.[0]?.parameter || "Critical Finding",
        detectedValue: report.criticalFindings?.value || report.criticalParameters?.[0]?.value || "Out of range",
        normalRange: report.criticalFindings?.normalRange || report.criticalParameters?.[0]?.referenceRange || "Normal",
        flaggedAt: new Date(),
        alertSentToDoctor: true,
        escalationStatus: "Open",
      };

      // Immediate high-priority alert to Doctor
      if (order.doctor) {
        const doctorDoc = await Doctor.findById(order.doctor);
        if (doctorDoc && doctorDoc.user) {
          await Notification.create({
            recipientType: "staff",
            user: doctorDoc.user,
            title: `CRITICAL LAB ALERT: ${order.testName}`,
            message: `CRITICAL ALERT for ${order.patientName}: ${
              order.criticalDetails.parameter
            } = ${order.criticalDetails.detectedValue}. Immediate clinical action required!`,
            type: "critical_diagnostic",
            diagnosticOrder: order._id,
            link: "/doctor/critical-labs",
          });
        }
      }
    }

    await order.save();

    // Notifications for Final Report Available
    // Doctor Notification
    if (order.doctor) {
      const doctorDoc = await Doctor.findById(order.doctor);
      if (doctorDoc && doctorDoc.user) {
        await Notification.create({
          recipientType: "staff",
          user: doctorDoc.user,
          title: `Final Report Ready: ${order.testName}`,
          message: `Official verified report for ${order.patientName} (${order.testName}) is now available.`,
          type: "lab_report_ready",
          diagnosticOrder: order._id,
          link: "/doctor/orders",
        });
      }
    }

    // Patient Notification
    await Notification.create({
      recipientType: "patient",
      patient: order.patient._id,
      title: `Report Finalized: ${order.testName}`,
      message: `Your final report for ${order.testName} is now ready and available in your portal.`,
      type: "lab_report_ready",
      diagnosticOrder: order._id,
      link: "/patient/lab-reports",
    });

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || report.approvedByName || "Specialist",
      role: userContext.role || "specialist",
      action: "Diagnostic Report Finalized",
      module: "diagnostics",
      recordId: report.reportNumber,
      details: `Finalized report for ${order.orderNumber} (${order.testName}). Critical: ${
        isCritical ? "YES" : "NO"
      }`,
    });

    return order;
  }

  /**
   * 8. On Critical Result Acknowledged
   * Triggered when doctor clicks Acknowledge in Doctor Portal
   */
  async onCriticalResultAcknowledged(orderIdOrParams, contextOrNotes = {}) {
    let orderId, reportId, userId, userName, notes;
    if (typeof orderIdOrParams === "object" && orderIdOrParams.orderId) {
      orderId = orderIdOrParams.orderId;
      reportId = orderIdOrParams.reportId;
      userId = orderIdOrParams.userContext?.userId;
      userName = orderIdOrParams.userContext?.userName;
      notes = orderIdOrParams.notes || "";
    } else {
      orderId = orderIdOrParams;
      userId = contextOrNotes.userId;
      userName = contextOrNotes.userName;
      notes = contextOrNotes.notes || "";
    }

    const order = await DiagnosticOrder.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (!order.criticalDetails) {
      order.criticalDetails = {};
    }

    order.criticalDetails.escalationStatus = "Resolved";
    order.criticalDetails.acknowledgedBy = userId;
    order.criticalDetails.acknowledgedByName = userName;
    order.criticalDetails.acknowledgedAt = new Date();
    order.criticalDetails.acknowledgmentNotes = notes;

    await order.save();

    // Also update DiagnosticReport if linked
    let reportDoc = null;
    const targetReportId = reportId || order.report;
    if (targetReportId) {
      reportDoc = await DiagnosticReport.findById(targetReportId);
      if (reportDoc) {
        reportDoc.criticalReviewStatus = "acknowledged";
        reportDoc.doctorReviewStatus = "reviewed";
        reportDoc.doctorReviewNotes = notes;
        reportDoc.reviewedAt = new Date();
        await reportDoc.save();
      }
    }

    // Audit Log
    await AuditLog.create({
      user: userId || null,
      userName: userName || "Doctor",
      role: "doctor",
      action: "Critical Result Acknowledged",
      module: "diagnostics",
      recordId: order.orderNumber,
      details: `Doctor acknowledged critical result for ${order.orderNumber}. Notes: ${notes || "None"}`,
    });

    return { order, report: reportDoc };
  }

  /**
   * 9. On Report Amended
   * Versioning and notifying doctor of amendments
   */
  async onReportAmended(report, amendmentReason, userContext = {}) {
    const order = await DiagnosticOrder.findById(report.order).populate("patient");
    if (!order) return;

    // Doctor Notification
    if (order.doctor) {
      const doctorDoc = await Doctor.findById(order.doctor);
      if (doctorDoc && doctorDoc.user) {
        await Notification.create({
          recipientType: "staff",
          user: doctorDoc.user,
          title: `Report Amended: ${order.testName}`,
          message: `Report for ${order.patientName} (${order.testName}) was amended. Reason: ${amendmentReason}`,
          type: "report_amended",
          diagnosticOrder: order._id,
          link: "/doctor/orders",
        });
      }
    }

    // Patient Notification
    await Notification.create({
      recipientType: "patient",
      patient: order.patient._id,
      title: `Report Updated: ${order.testName}`,
      message: `Your diagnostic report for ${order.testName} has been revised.`,
      type: "report_amended",
      diagnosticOrder: order._id,
      link: "/patient/lab-reports",
    });

    // Audit Log
    await AuditLog.create({
      user: userContext.userId || null,
      userName: userContext.userName || "Specialist",
      role: userContext.role || "specialist",
      action: "Diagnostic Report Amended",
      module: "diagnostics",
      recordId: report.reportNumber,
      details: `Amended report for ${order.orderNumber}. Reason: ${amendmentReason}`,
    });
  }

  /**
   * 10. On Billing Payment Received
   * Synchronizes DiagnosticOrder.billingStatus to "Paid"
   */
  async onBillingPaymentReceived(billingDoc, userContext = {}) {
    if (!billingDoc || !billingDoc.diagnosticOrder) return;

    const order = await DiagnosticOrder.findById(billingDoc.diagnosticOrder);
    if (!order) return;

    if (billingDoc.paymentStatus === "paid") {
      order.billingStatus = "Paid";
      await order.save();

      // Audit Log
      await AuditLog.create({
        user: userContext.userId || null,
        userName: userContext.userName || "Cashier",
        role: userContext.role || "billing",
        action: "Diagnostic Payment Synchronized",
        module: "billing",
        recordId: order.orderNumber,
        details: `Diagnostic order ${order.orderNumber} updated to 'Paid' upon receipt ${
          billingDoc.receiptNumber || ""
        }`,
      });
    }
  }
}

export const diagnosticSyncService = new DiagnosticSyncService();
export default diagnosticSyncService;

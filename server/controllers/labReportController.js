import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";

// GET /api/lab-reports
export const getAllLabReports = async (req, res) => {
  try {
    const { patient, status, category, search } = req.query;
    const filter = {};

    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor) {
        return res.status(403).json({ message: "Doctor profile not found for this account" });
      }

      const [apptPatientIds, rxPatientIds] = await Promise.all([
        Appointment.distinct("patient", { doctor: myDoctor._id }),
        Prescription.distinct("patient", { doctor: myDoctor._id }),
      ]);

      const assignedPatientIds = Array.from(
        new Set([...apptPatientIds.map(String), ...rxPatientIds.map(String)])
      );

      filter.$or = [
        { doctor: myDoctor._id },
        { patient: { $in: assignedPatientIds } },
      ];
    } else {
      if (patient) filter.patient = patient;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search?.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const searchConditions = [
        { reportNumber: searchRegex },
        { testName: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const reports = await LabReport.find(filter)
      .populate("patient", "name contactNumber email age gender")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch lab reports" });
  }
};

// GET /api/lab-reports/:id
export const getLabReportById = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate("patient", "name contactNumber email age gender address")
      .populate("doctor", "name specialization department");

    if (!report) {
      return res.status(404).json({ message: "Lab report not found" });
    }

    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (myDoctor) {
        const isMyOrder = report.doctor && report.doctor._id.equals(myDoctor._id);
        const [hasAppt, hasRx] = await Promise.all([
          Appointment.exists({ doctor: myDoctor._id, patient: report.patient?._id }),
          Prescription.exists({ doctor: myDoctor._id, patient: report.patient?._id }),
        ]);

        if (!isMyOrder && !hasAppt && !hasRx) {
          return res.status(403).json({ message: "Access denied: You do not have permission to view this lab report" });
        }
      }
    }

    return res.status(200).json({ report });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch lab report" });
  }
};

// POST /api/lab-reports
export const createLabReport = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      testName,
      category,
      testDate,
      reportDate,
      status = "ordered",
      technicianName,
      testResults = [],
      summaryConclusion,
      attachmentName,
      attachmentUrl,
      isSharedWithPatient = true,
      notes,
    } = req.body;

    if (!patient || !testName) {
      return res.status(400).json({ message: "Patient and test name are required" });
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    let assignedDoctor = doctor;
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (myDoctor) assignedDoctor = myDoctor._id;
    }

    const reportCount = await LabReport.countDocuments();
    const reportNumber = `LAB-${new Date().getFullYear()}-${String(reportCount + 1).padStart(5, "0")}`;

    const report = await LabReport.create({
      reportNumber,
      patient,
      doctor: assignedDoctor || undefined,
      testName,
      category,
      testDate: testDate ? new Date(testDate) : new Date(),
      reportDate: reportDate ? new Date(reportDate) : undefined,
      status,
      technicianName: technicianName || "Central Lab Tech",
      testResults,
      summaryConclusion,
      attachmentName,
      attachmentUrl,
      isSharedWithPatient,
      notes,
    });

    // Notify patient if report is ready / completed
    if (status === "completed" && isSharedWithPatient) {
      await Notification.create({
        recipientType: "patient",
        patient,
        title: `🧪 Lab Report Ready: ${testName}`,
        message: `Your diagnostic report (${reportNumber}) is now available to view and download.`,
        type: "lab_report_ready",
        link: "/patient/lab-reports",
      });
    }

    return res.status(201).json({
      message: "Lab report created successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to create lab report" });
  }
};

// PUT /api/lab-reports/:id
export const updateLabReport = async (req, res) => {
  try {
    const prevReport = await LabReport.findById(req.params.id);
    if (!prevReport) {
      return res.status(404).json({ message: "Lab report not found" });
    }

    const report = await LabReport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "name contactNumber email")
      .populate("doctor", "name specialization");

    // If status changed to completed, send patient notification
    if (prevReport.status !== "completed" && req.body.status === "completed") {
      await Notification.create({
        recipientType: "patient",
        patient: report.patient?._id,
        title: `🧪 Lab Report Ready: ${report.testName}`,
        message: `Your lab investigation report (${report.reportNumber}) has been finalized.`,
        type: "lab_report_ready",
        link: "/patient/lab-reports",
      });
    }

    return res.status(200).json({
      message: "Lab report updated successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update lab report" });
  }
};

// DELETE /api/lab-reports/:id
export const deleteLabReport = async (req, res) => {
  try {
    const report = await LabReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Lab report not found" });
    }
    return res.status(200).json({ message: "Lab report deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete lab report" });
  }
};

// PATCH /api/lab-reports/:id/sample-status
export const updateSampleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["ordered", "sample_collected", "in_progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid sample status" });
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Lab report not found" });
    }

    report.status = status;
    if (notes) {
      report.notes = (report.notes ? report.notes + " | " : "") + notes;
    }
    await report.save();

    return res.status(200).json({ message: `Sample collection status updated to ${status}`, report });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update sample status" });
  }
};


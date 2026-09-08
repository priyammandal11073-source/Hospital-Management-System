import Vitals from "../models/Vitals.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";

// GET /api/vitals/:patientId
export const getPatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (myDoctor) {
        const [hasAppt, hasRx] = await Promise.all([
          Appointment.exists({ doctor: myDoctor._id, patient: patientId }),
          Prescription.exists({ doctor: myDoctor._id, patient: patientId }),
        ]);
        if (!hasAppt && !hasRx) {
          return res.status(403).json({ message: "Access denied: Patient not assigned to your clinical care" });
        }
      }
    }

    const vitals = await Vitals.find({ patient: patientId }).sort({ recordedAt: -1 });
    return res.status(200).json({ vitals });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch vitals" });
  }
};

// POST /api/vitals
export const recordVitals = async (req, res) => {
  try {
    const {
      patient,
      recordedBy = "staff",
      recorderName = req.user?.name || "Hospital Staff",
      bloodPressureSys,
      bloodPressureDia,
      bloodSugar,
      sugarType,
      weight,
      height,
      heartRate,
      temperature,
      spo2,
      notes,
    } = req.body;

    if (!patient) {
      return res.status(400).json({ message: "Patient is required" });
    }

    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const newVitals = await Vitals.create({
      patient,
      recordedBy,
      recorderName,
      bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
      bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      sugarType,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      notes,
    });

    // Check for critical vitals alert (e.g. High BP >= 160/100 or SpO2 < 92)
    const isCritical =
      (bloodPressureSys && bloodPressureSys >= 160) ||
      (bloodPressureDia && bloodPressureDia >= 100) ||
      (spo2 && spo2 < 92) ||
      (bloodSugar && bloodSugar > 250);

    if (isCritical) {
      await Notification.create({
        recipientType: "staff",
        patient,
        title: `🚨 Critical Vitals Alert: ${patientExists.name}`,
        message: `High BP (${bloodPressureSys}/${bloodPressureDia}) or SpO2 (${spo2}%) or Sugar (${bloodSugar} mg/dL) recorded. Attention required.`,
        type: "vitals_alert",
        link: `/patients`,
      });
    }

    return res.status(201).json({
      message: "Patient vitals recorded successfully",
      vitals: newVitals,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to record vitals" });
  }
};

// DELETE /api/vitals/:id
export const deleteVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const vitals = await Vitals.findByIdAndDelete(id);
    if (!vitals) {
      return res.status(404).json({ message: "Vitals record not found" });
    }
    return res.status(200).json({ message: "Vitals record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete vitals record" });
  }
};

// GET /api/vitals/alerts/recent
export const getRecentVitalsAlerts = async (req, res) => {
  try {
    const alerts = await Vitals.find({
      $or: [
        { bloodPressureSys: { $gte: 150 } },
        { bloodPressureDia: { $gte: 95 } },
        { spo2: { $lte: 92 } },
        { bloodSugar: { $gte: 220 } },
        { temperature: { $gte: 102 } },
        { heartRate: { $gte: 115 } },
      ],
    })
      .populate("patient", "name age gender contactNumber isAdmitted")
      .sort({ recordedAt: -1 })
      .limit(10);

    return res.status(200).json({ alerts });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch vitals alerts" });
  }
};

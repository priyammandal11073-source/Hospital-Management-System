import { describe, it, expect } from "vitest";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../validators/appointmentValidators.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validators/patientValidators.js";
import {
  createBillingSchema,
  updatePaymentStatusSchema,
} from "../validators/billingValidators.js";
import {
  createBedSchema,
  allocateBedSchema,
} from "../validators/bedValidators.js";
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
} from "../validators/prescriptionValidators.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  addDoctorLeaveSchema,
} from "../validators/doctorValidators.js";

describe("Appointment Validators", () => {
  const validAppointment = {
    patient: "507f1f77bcf86cd799439011",
    doctor: "507f1f77bcf86cd799439012",
    appointmentDate: "2026-11-01",
    timeSlot: "10:00 AM - 10:30 AM",
    reasonForVisit: "Routine annual checkup",
    paymentMethod: "cash",
  };

  it("accepts a well-formed appointment payload", () => {
    const res = createAppointmentSchema.safeParse(validAppointment);
    expect(res.success).toBe(true);
  });

  it("rejects invalid ObjectId formats", () => {
    const res = createAppointmentSchema.safeParse({
      ...validAppointment,
      patient: "not-a-valid-id",
    });
    expect(res.success).toBe(false);
  });

  it("rejects empty reason for visit", () => {
    const res = createAppointmentSchema.safeParse({
      ...validAppointment,
      reasonForVisit: " ",
    });
    expect(res.success).toBe(false);
  });

  it("validates appointment status correctly", () => {
    expect(updateAppointmentStatusSchema.safeParse({ status: "confirmed" }).success).toBe(true);
    expect(updateAppointmentStatusSchema.safeParse({ status: "invalid_status" }).success).toBe(false);
  });
});

describe("Patient Validators", () => {
  const validPatient = {
    name: "Aarav Sharma",
    age: 32,
    gender: "Male",
    contactNumber: "9876543210",
    email: "aarav.sharma@example.com",
    bloodGroup: "O+",
  };

  it("accepts a well-formed patient payload", () => {
    const res = createPatientSchema.safeParse(validPatient);
    expect(res.success).toBe(true);
  });

  it("rejects an invalid Indian phone number", () => {
    const res = createPatientSchema.safeParse({
      ...validPatient,
      contactNumber: "12345",
    });
    expect(res.success).toBe(false);
  });

  it("rejects negative age", () => {
    const res = createPatientSchema.safeParse({
      ...validPatient,
      age: -5,
    });
    expect(res.success).toBe(false);
  });

  it("allows partial updates in updatePatientSchema", () => {
    const res = updatePatientSchema.safeParse({ bloodGroup: "AB+" });
    expect(res.success).toBe(true);
  });
});

describe("Billing Validators", () => {
  const validBilling = {
    patient: "507f1f77bcf86cd799439011",
    itemizedCharges: [
      { description: "General OPD Consultation", cost: 500 },
      { description: "CBC Blood Test", cost: 350 },
    ],
    paymentMethod: "upi",
    paymentStatus: "pending",
  };

  it("accepts a well-formed billing payload", () => {
    const res = createBillingSchema.safeParse(validBilling);
    expect(res.success).toBe(true);
  });

  it("rejects billing with empty charges list", () => {
    const res = createBillingSchema.safeParse({
      ...validBilling,
      itemizedCharges: [],
    });
    expect(res.success).toBe(false);
  });

  it("rejects negative cost", () => {
    const res = createBillingSchema.safeParse({
      ...validBilling,
      itemizedCharges: [{ description: "Test", cost: -100 }],
    });
    expect(res.success).toBe(false);
  });

  it("validates payment status update correctly", () => {
    expect(updatePaymentStatusSchema.safeParse({ paymentStatus: "paid" }).success).toBe(true);
    expect(updatePaymentStatusSchema.safeParse({ paymentStatus: "bogus" }).success).toBe(false);
  });
});

describe("Bed Validators", () => {
  it("accepts valid bed creation", () => {
    const res = createBedSchema.safeParse({
      bedNumber: "ICU-04",
      ward: "ICU (Intensive Care Unit)",
      floor: "2nd Floor",
      dailyRate: 3500,
    });
    expect(res.success).toBe(true);
  });

  it("rejects bed allocation with invalid doctor id", () => {
    const res = allocateBedSchema.safeParse({
      patient: "507f1f77bcf86cd799439011",
      attendingDoctor: "bad-id",
      admissionReason: "Observation",
    });
    expect(res.success).toBe(false);
  });
});

describe("Prescription Validators", () => {
  const validPrescription = {
    patient: "507f1f77bcf86cd799439011",
    diagnosis: "Acute Bronchitis",
    medications: [
      {
        medicineName: "Amoxicillin 500mg",
        dosage: "1 tablet",
        frequency: "TDS",
        duration: "5 days",
      },
    ],
    advice: "Drink warm fluids and rest",
  };

  it("accepts a well-formed prescription payload", () => {
    const res = createPrescriptionSchema.safeParse(validPrescription);
    expect(res.success).toBe(true);
  });

  it("rejects prescription with empty medications array", () => {
    const res = createPrescriptionSchema.safeParse({
      ...validPrescription,
      medications: [],
    });
    expect(res.success).toBe(false);
  });

  it("rejects prescription missing diagnosis", () => {
    const res = createPrescriptionSchema.safeParse({
      ...validPrescription,
      diagnosis: "",
    });
    expect(res.success).toBe(false);
  });

  it("allows partial updates in updatePrescriptionSchema", () => {
    const res = updatePrescriptionSchema.safeParse({
      advice: "Take medication after food",
    });
    expect(res.success).toBe(true);
  });
});

describe("Doctor Validators", () => {
  const validDoctor = {
    name: "Dr. Ananya Roy",
    specialization: "Cardiology",
    department: "Cardiology",
    contactNumber: "9876543211",
    email: "ananya.roy@example.com",
    availableDays: ["Monday", "Wednesday", "Friday"],
  };

  it("accepts a well-formed doctor payload", () => {
    const res = createDoctorSchema.safeParse(validDoctor);
    expect(res.success).toBe(true);
  });

  it("rejects doctor with invalid email format", () => {
    const res = createDoctorSchema.safeParse({
      ...validDoctor,
      email: "not-an-email",
    });
    expect(res.success).toBe(false);
  });

  it("allows partial updates in updateDoctorSchema", () => {
    const res = updateDoctorSchema.safeParse({
      department: "Internal Medicine",
    });
    expect(res.success).toBe(true);
  });

  it("validates doctor leave schema", () => {
    const validLeave = {
      startDate: "2026-11-10",
      endDate: "2026-11-15",
      reason: "Annual conference",
    };
    expect(addDoctorLeaveSchema.safeParse(validLeave).success).toBe(true);
    expect(addDoctorLeaveSchema.safeParse({ reason: "No dates" }).success).toBe(false);
  });
});

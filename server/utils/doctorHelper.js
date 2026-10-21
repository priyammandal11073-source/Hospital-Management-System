import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Resolves the Doctor document associated with a logged-in User.
 * Checks in order:
 * 1. user.doctorId if present in decoded JWT
 * 2. userDoc.doctor if linked on the User document
 * 3. Doctor with matching email (case-insensitive)
 * 4. Doctor with matching name (stripping 'Dr.' prefix)
 * If found and not yet linked on User, links userDoc.doctor = doctor._id.
 */
export const resolveDoctorForUser = async (user) => {
  if (!user || user.role !== "doctor") {
    return null;
  }

  // 1. Direct doctorId from JWT
  if (user.doctorId && mongoose.isValidObjectId(user.doctorId)) {
    const doc = await Doctor.findById(user.doctorId);
    if (doc) return doc;
  }

  // 2. Lookup user from database
  const userDoc = await User.findById(user.id || user._id);
  if (userDoc?.doctor && mongoose.isValidObjectId(userDoc.doctor)) {
    const doc = await Doctor.findById(userDoc.doctor);
    if (doc) return doc;
  }

  // 3. Match by email
  const userEmail = (user.email || userDoc?.email)?.toLowerCase();
  if (userEmail) {
    const doc = await Doctor.findOne({ email: userEmail });
    if (doc) {
      if (userDoc && !userDoc.doctor) {
        userDoc.doctor = doc._id;
        await userDoc.save().catch(() => {});
      }
      return doc;
    }
  }

  // 4. Match by name (strip Dr. prefix)
  const userName = user.name || userDoc?.name;
  if (userName) {
    const cleanName = userName.replace(/^Dr\.\s*/i, "").trim();
    const doc = await Doctor.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, "i") },
    });
    if (doc) {
      if (userDoc && !userDoc.doctor) {
        userDoc.doctor = doc._id;
        await userDoc.save().catch(() => {});
      }
      return doc;
    }
  }

  return null;
};

export const formatDoctorName = (nameOrDoctor, fallback = "Physician") => {
  const rawName =
    typeof nameOrDoctor === "object" && nameOrDoctor !== null
      ? nameOrDoctor.name
      : nameOrDoctor;

  const target =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim()
      : typeof fallback === "string" && fallback.trim()
      ? fallback.trim()
      : "Physician";

  if (/^[-—–/]+$/.test(target) || /^(n\/?a|none)$/i.test(target)) {
    return target;
  }

  const withoutPrefix = target.replace(/^(?:dr\.?\s*)+/i, "").trim();
  if (!withoutPrefix) {
    return "Dr. Physician";
  }

  return `Dr. ${withoutPrefix}`;
};

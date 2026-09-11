import cors from "cors";
import express from "express";
import { createPatient, listPatients } from "./patientsStore.js";

const app = express();
const port = 5001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

function validatePatient(body) {
  const errors = [];
  const fullName = String(body.fullName ?? "").trim();
  const age = Number(body.age);
  const gender = String(body.gender ?? "").trim();
  const phone = String(body.phone ?? "").replace(/\s+/g, "");
  const department = String(body.department ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (fullName.length < 2) errors.push("Full name must be at least 2 characters.");
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    errors.push("Age must be a whole number between 0 and 120.");
  }
  if (!["Female", "Male", "Other"].includes(gender)) {
    errors.push("Choose a valid gender.");
  }
  if (!/^\d{10}$/.test(phone)) errors.push("Phone must be exactly 10 digits.");
  if (!department) errors.push("Department is required.");

  return {
    errors,
    value: { fullName, age, gender, phone, department, notes },
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/patients", async (req, res) => {
  try {
    const patients = await listPatients(String(req.query.q ?? ""));
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load patients." });
  }
});

app.post("/api/patients", async (req, res) => {
  const { errors, value } = validatePatient(req.body ?? {});
  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  try {
    const patient = await createPatient(value);
    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not register patient." });
  }
});

const server = app.listen(port, () => {
  console.log(`Hospital API running on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("API failed to start:", error.message);
  process.exit(1);
});

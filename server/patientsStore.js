import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const dataFile = join(dirname(fileURLToPath(import.meta.url)), "data", "patients.json");

const seedPatients = [
  {
    id: "p-1001",
    fullName: "Anita Sharma",
    age: 34,
    gender: "Female",
    phone: "9876543210",
    department: "General OPD",
    notes: "Follow-up for fever",
    registeredAt: "2026-09-10T09:15:00.000Z",
  },
  {
    id: "p-1002",
    fullName: "Rahul Verma",
    age: 52,
    gender: "Male",
    phone: "9123456780",
    department: "Cardiology",
    notes: "Chest pain evaluation",
    registeredAt: "2026-09-11T11:40:00.000Z",
  },
];

async function ensureFile() {
  await mkdir(dirname(dataFile), { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedPatients, null, 2));
  }
}

async function load() {
  await ensureFile();
  const raw = await readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function save(patients) {
  await writeFile(dataFile, JSON.stringify(patients, null, 2));
}

export async function listPatients(query = "") {
  const patients = await load();
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...patients].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }

  return patients
    .filter((patient) => {
      const haystack = [patient.fullName, patient.phone, patient.department]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}

export async function createPatient(input) {
  const patients = await load();
  const patient = {
    id: randomUUID(),
    ...input,
    registeredAt: new Date().toISOString(),
  };
  patients.push(patient);
  await save(patients);
  return patient;
}

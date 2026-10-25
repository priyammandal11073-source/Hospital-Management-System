import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import createApp from "../app.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";

const app = createApp();

// Use the actual JWT secret from the environment (loaded by env.js from server/.env)
// Fallback to test value if not set
const TEST_JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-hospital-management-system-2026";
const testToken = jwt.sign({ id: "65a123456789012345678901", name: "Test Admin", email: "admin@hospital.com", role: "admin" }, TEST_JWT_SECRET, { expiresIn: "1h" });

describe("Health & API surface", () => {
  it("GET /health returns HTTP 200 minimal liveness probe without disclosing internal metrics", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("nivora-care-hospital");
    expect(res.body.timestamp).toBeDefined();

    // Verify no sensitive internal system disclosure
    expect(res.body.pid).toBeUndefined();
    expect(res.body.memoryUsageMB).toBeUndefined();
    expect(res.body.nodeVersion).toBeUndefined();
    expect(res.body.environment).toBeUndefined();
    expect(res.body.portals).toBeUndefined();
  });

  it("GET /ready returns HTTP 503 when MongoDB is not connected (readiness probe)", async () => {
    const res = await request(app).get("/ready");

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
    expect(res.body.status).toBe("not_ready");
  });

  it("GET /api/ready returns HTTP 503 when MongoDB is not connected", async () => {
    const res = await request(app).get("/api/ready");

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
  });

  it("GET /ready returns HTTP 200 when MongoDB is connected (readyState === 1)", async () => {
    const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);

    const res = await request(app).get("/ready");

    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.status).toBe("ready");

    readyStateSpy.mockRestore();
  });

  it("GET /api/health returns minimal liveness without internal portal/system disclosure", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("nivora-care-hospital");

    // Must not leak sensitive environment or internals
    expect(res.body.pid).toBeUndefined();
    expect(res.body.systemMetrics).toBeUndefined();
    expect(res.body.portals).toBeUndefined();
    expect(res.body.environment).toBeUndefined();
  });

  it("applies standard HTTP security headers and disables x-powered-by", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("returns a 404 JSON payload for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("not found");
  });
});

describe("POST /api/auth/login (fail-closed security)", () => {
  it("rejects requests that miss required fields", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "x@y.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
  });

  it("fails closed with 503 when database is unavailable; never produces tokens from hard-coded credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hospital.com", password: "admin123" });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Database service unavailable");
    expect(res.body.token).toBeUndefined();
  });

  it("rejects unknown or invalid credentials with 401 when database is connected", async () => {
    const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);
    const findOneSpy = vi.spyOn(User, "findOne").mockResolvedValue(null);
    const patientFindSpy = vi.spyOn(Patient, "findOne").mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@hospital.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
    expect(res.body.token).toBeUndefined();

    readyStateSpy.mockRestore();
    findOneSpy.mockRestore();
    patientFindSpy.mockRestore();
  });
});

describe("POST /api/auth/register (role escalation protection)", () => {
  it("rejects staff role escalation from unauthenticated callers with 403 Forbidden", async () => {
    const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Attacker", email: "attacker@test.com", password: "secret123", role: "admin" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("administrator");

    readyStateSpy.mockRestore();
  });

  it("rejects an invalid role string with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "t@t.com", password: "secret123", role: "superuser" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "role")).toBe(true);
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "t@t.com", password: "123", role: "patient" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
  });
});

describe("POST /api/patient-auth endpoints (validation & fail-closed)", () => {
  it("rejects an invalid mobile number for OTP send", async () => {
    const res = await request(app)
      .post("/api/patient-auth/otp/send")
      .send({ contactNumber: "123", email: "p@p.com" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "contactNumber")).toBe(true);
  });

  it("rejects a malformed email in login", async () => {
    const res = await request(app)
      .post("/api/patient-auth/login")
      .send({ email: "not-an-email", password: "abc123" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "email")).toBe(true);
  });

  it("rejects a forgot-password request without an email", async () => {
    const res = await request(app).post("/api/patient-auth/forgot-password").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "email")).toBe(true);
  });

  it("fails closed with 503 on patient login when MongoDB is offline", async () => {
    const res = await request(app)
      .post("/api/patient-auth/login")
      .send({ email: "john@example.com", password: "patient123" });

    expect(res.status).toBe(503);
    expect(res.body.token).toBeUndefined();
  });
});

describe("POST /api/razorpay authorization & security", () => {
  it("rejects unauthenticated create-order requests with 401", async () => {
    const res = await request(app)
      .post("/api/razorpay/create-order")
      .send({ billingId: "000000000000000000000001" });

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated verify-payment requests with 401", async () => {
    const res = await request(app)
      .post("/api/razorpay/verify-payment")
      .send({ billingId: "000000000000000000000001", razorpayPaymentId: "pay_123" });

    expect(res.status).toBe(401);
  });

  it("rejects unsigned or improperly signed webhook requests with 400", async () => {
    const res = await request(app)
      .post("/api/razorpay/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ event: "payment.captured" }));

    expect(res.status).toBe(400);
  });
});

describe("Database unavailability: fail-closed on all protected endpoints", () => {
  const endpoints = [
    { method: "get", path: "/api/appointments" },
    { method: "get", path: "/api/patients" },
    { method: "get", path: "/api/billing" },
    { method: "get", path: "/api/prescriptions" },
    { method: "get", path: "/api/doctors" },
    { method: "get", path: "/api/beds" },
    { method: "get", path: "/api/diagnostics/dashboard" },
    { method: "get", path: "/api/diagnostics/tests" },
    { method: "get", path: "/api/diagnostics/requests" },
    { method: "get", path: "/api/nurse/patients" },
    { method: "get", path: "/api/emergency/queue" },
    { method: "post", path: "/api/appointments", body: { patient: "65a123456789012345678901", doctor: "65b123456789012345678901", appointmentDate: "2026-10-25", timeSlot: "10:00 AM", reasonForVisit: "Checkup" } },
    { method: "post", path: "/api/patients", body: { name: "Test Patient", age: 30, gender: "Male", contactNumber: "9876543210" } },
    { method: "post", path: "/api/prescriptions", body: { patient: "65a123456789012345678901", doctor: "65b123456789012345678901", diagnosis: "Test", medications: [{ name: "Test", dosage: "1", frequency: "OD", timing: "Morning", duration: "5 days" }] } },
    { method: "post", path: "/api/billing", body: { patient: "65a123456789012345678901", itemizedCharges: [{ description: "Test", cost: 100 }] } },
  ];

  for (const ep of endpoints) {
    it(`fails closed with 503 on ${ep.method.toUpperCase()} ${ep.path} when MongoDB is offline (no fake clinical data)`, async () => {
      const req = request(app)[ep.method](ep.path).set("Authorization", `Bearer ${testToken}`);
      if (ep.body) req.send(ep.body);
      const res = await req;

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Database service unavailable");
      // Must not return fake clinical records
      expect(res.body.appointments).toBeUndefined();
      expect(res.body.patients).toBeUndefined();
      expect(res.body.billings).toBeUndefined();
      expect(res.body.prescriptions).toBeUndefined();
      expect(res.body.doctors).toBeUndefined();
      expect(res.body.beds).toBeUndefined();
      expect(res.body.isOfflineDemo).toBeUndefined();
    });
  }

  it("fails closed with 503 on diagnostic order creation when MongoDB is offline", async () => {
    const res = await request(app)
      .post("/api/diagnostics/requests")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ patient: "65a123456789012345678901", testId: "65c123456789012345678901", clinicalIndication: "Test" });

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Database service unavailable");
  });
});
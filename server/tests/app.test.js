import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import createApp from "../app.js";

/**
 * Integration tests for the public API surface.
 *
 * The test process never connects to MongoDB, so the login endpoint runs its
 * offline demo-account fallback — which lets us exercise the full request
 * pipeline (rate limiter, zod validation, controller, JWT issuance) without
 * a database.
 */
const app = createApp();

describe("Health & API surface", () => {
  it("GET /health returns HTTP 200 regardless of database connectivity (liveness probe)", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("nivora-care-hospital");
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(res.body.database).toBeDefined();
  });

  it("GET /ready returns HTTP 503 when MongoDB is not connected (readiness probe)", async () => {
    const res = await request(app).get("/ready");

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
    expect(res.body.status).toBe("not_ready");
    expect(res.body.database.readyState).not.toBe(1);
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
    expect(res.body.database.status).toBe("Connected");
    expect(res.body.database.readyState).toBe(1);

    readyStateSpy.mockRestore();
  });

  it("GET /api/health reports the API and all portals as operational", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("healthy");
    expect(res.body.portals.adminPortal.status).toBe("Operational");
    expect(res.body.portals.patientPortal.status).toBe("Operational");
    expect(res.body.database.isOfflineDemoFallbackActive).toBe(true);
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

describe("POST /api/auth/login (offline demo fallback)", () => {
  it("rejects requests that miss required fields", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "x@y.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
  });

  it("accepts valid demo credentials and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hospital.com", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("admin");
    expect(res.body.isOfflineDemo).toBe(true);
  });

  it("rejects demo accounts with a wrong password even offline", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@hospital.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("rejects unknown demo accounts", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@hospital.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });
});

describe("POST /api/auth/register (validation only)", () => {
  it("rejects an invalid role", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "t@t.com", password: "secret123", role: "superuser" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "role")).toBe(true);
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "t@t.com", password: "123", role: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === "password")).toBe(true);
  });
});

describe("POST /api/patient-auth endpoints (validation only)", () => {
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
});
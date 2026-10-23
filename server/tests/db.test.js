import { describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import {
  mongoConnectionOptions,
  sanitizeMongoUri,
  sanitizeErrorMessage,
  calculateBackoffDelay,
  MAX_RECONNECT_DELAY_MS,
  BASE_RECONNECT_DELAY_MS,
  executeConnect,
} from "../config/db.js";

describe("MongoDB Connection Reliability & Security Configuration", () => {
  it("enforces the exact required Mongoose connection pool options", () => {
    expect(mongoConnectionOptions.serverSelectionTimeoutMS).toBe(10000);
    expect(mongoConnectionOptions.connectTimeoutMS).toBe(10000);
    expect(mongoConnectionOptions.maxPoolSize).toBe(10);
    expect(mongoConnectionOptions.minPoolSize).toBe(1);
    expect(mongoConnectionOptions.maxIdleTimeMS).toBe(60000);
  });

  describe("Secret Sanitization", () => {
    it("redacts credentials from standard mongodb URIs", () => {
      const sanitized = sanitizeMongoUri("mongodb://hms_user:SuperSecretP@ss123@localhost:27017/hospital");
      expect(sanitized).toBe("mongodb://hms_user:****@localhost:27017/hospital");
      expect(sanitized).not.toContain("SuperSecretP@ss123");
    });

    it("redacts credentials from mongodb+srv Atlas URIs", () => {
      const sanitized = sanitizeMongoUri("mongodb+srv://admin:MyP@ssw0rd!@cluster0.abcde.mongodb.net/hospital?retryWrites=true");
      expect(sanitized).toBe("mongodb+srv://admin:****@cluster0.abcde.mongodb.net/hospital?retryWrites=true");
      expect(sanitized).not.toContain("MyP@ssw0rd!");
    });

    it("safely handles null, undefined, or empty URIs", () => {
      expect(sanitizeMongoUri("")).toBe("[empty-uri]");
      expect(sanitizeMongoUri(null)).toBe("[empty-uri]");
      expect(sanitizeMongoUri(undefined)).toBe("[empty-uri]");
    });

    it("strips connection string credentials and password parameters from error messages", () => {
      const rawError = "MongoServerSelectionError: connection <monitor> to mongodb+srv://db_admin:SecretPass789@cluster.net closed. password=myPlainPassword";
      const sanitized = sanitizeErrorMessage(rawError);

      expect(sanitized).not.toContain("SecretPass789");
      expect(sanitized).not.toContain("myPlainPassword");
      expect(sanitized).toContain("db_admin:****@");
      expect(sanitized).toContain("password=****");
    });
  });

  describe("Exponential Backoff Calculation", () => {
    it("computes backoff with exponential growth and capped at MAX_RECONNECT_DELAY_MS (30s)", () => {
      const delay0 = calculateBackoffDelay(0);
      expect(delay0).toBeGreaterThanOrEqual(BASE_RECONNECT_DELAY_MS);
      expect(delay0).toBeLessThanOrEqual(BASE_RECONNECT_DELAY_MS + 1000);

      const delay1 = calculateBackoffDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(BASE_RECONNECT_DELAY_MS * 2);

      const delayLarge = calculateBackoffDelay(20);
      expect(delayLarge).toBeLessThanOrEqual(MAX_RECONNECT_DELAY_MS);
      expect(delayLarge).toBe(MAX_RECONNECT_DELAY_MS);
    });
  });

  describe("Single Shared Connection Invariant & Mutex Lock", () => {
    it("skips reconnection when already connected (readyState === 1)", async () => {
      const connectSpy = vi.spyOn(mongoose, "connect");
      const readyStateSpy = vi.spyOn(mongoose.connection, "readyState", "get").mockReturnValue(1);

      await executeConnect("unit_test");

      expect(connectSpy).not.toHaveBeenCalled();

      readyStateSpy.mockRestore();
      connectSpy.mockRestore();
    });
  });
});

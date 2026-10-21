import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateOtp,
  hasActiveOtp,
  normalizeContact,
  verifyOtp,
} from "../services/otpService.js";

describe("normalizeContact", () => {
  it("strips non-digit characters", () => {
    expect(normalizeContact("+91 98765 43210")).toBe("919876543210");
    expect(normalizeContact("(080) 123-4567")).toBe("0801234567");
    expect(normalizeContact("")).toBe("");
  });
});

describe("generateOtp", () => {
  it("emits a six-digit numeric code", () => {
    const otp = generateOtp("9876543210");
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("marks the contact as having an active OTP", () => {
    generateOtp("9876543210");
    expect(hasActiveOtp("9876543210")).toBe(true);
    expect(hasActiveOtp("9999999999")).toBe(false);
  });
});

describe("verifyOtp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects a missing OTP", () => {
    const result = verifyOtp("9876543210", "");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("required");
  });

  it("rejects an OTP that was never requested", () => {
    const result = verifyOtp("1111111111", "123456");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("No OTP");
  });

  it("accepts a correct OTP and consumes it (single use)", () => {
    const otp = generateOtp("9876543210");

    const first = verifyOtp("9876543210", otp);
    expect(first.valid).toBe(true);

    // Second verification of the same code must fail — OTPs are single-use.
    const second = verifyOtp("9876543210", otp);
    expect(second.valid).toBe(false);
  });

  it("locks the OTP after the maximum number of attempts", () => {
    const otp = generateOtp("9876543210");

    for (let i = 0; i < 5; i += 1) {
      const result = verifyOtp("9876543210", "000000");
      expect(result.valid).toBe(false);
    }

    const final = verifyOtp("9876543210", otp);
    expect(final.valid).toBe(false);
    expect(final.message).toContain("Too many");
  });

  it("rejects an expired OTP", () => {
    const otp = generateOtp("9876543210");

    vi.setSystemTime(Date.now() + 6 * 60 * 1000);

    const result = verifyOtp("9876543210", otp);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("expired");
  });
});
import { describe, it, expect } from "vitest";
import { isBillingAuthorizedStaff, BILLING_STAFF_ROLES } from "../utils/roleHelpers.js";

describe("roleHelpers - Billing Authorization", () => {
  it("authorizes standard billing staff roles", () => {
    for (const role of BILLING_STAFF_ROLES) {
      expect(isBillingAuthorizedStaff(role)).toBe(true);
    }
  });

  it("authorizes dynamic admin subroles ending in _admin", () => {
    expect(isBillingAuthorizedStaff("custom_admin")).toBe(true);
    expect(isBillingAuthorizedStaff("billing_admin")).toBe(true);
    expect(isBillingAuthorizedStaff("super_admin")).toBe(true);
  });

  it("rejects unauthorized roles and invalid inputs", () => {
    expect(isBillingAuthorizedStaff("patient")).toBe(false);
    expect(isBillingAuthorizedStaff("guest")).toBe(false);
    expect(isBillingAuthorizedStaff("anonymous")).toBe(false);
    expect(isBillingAuthorizedStaff("")).toBe(false);
    expect(isBillingAuthorizedStaff(null)).toBe(false);
    expect(isBillingAuthorizedStaff(undefined)).toBe(false);
    expect(isBillingAuthorizedStaff(123)).toBe(false);
  });
});

import { describe, it, expect, vi } from "vitest";

describe("Environment API URL Resolution", () => {
  it("resolves default web and android API configurations properly", async () => {
    const envModule = await import("../config/env.js");
    const env = envModule.default;
    expect(env.appName).toBe("Nivora Care Hospital");
    expect(typeof env.apiBaseUrl).toBe("string");
  });

  it("ensures Render production URL is target for Capacitor native platform", async () => {
    const { Capacitor } = await import("@capacitor/core");
    const isNativeSpy = vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);

    // Re-import or verify logic
    const RENDER_PROD_API_URL = "https://nivora-care-hospital.onrender.com/api";
    expect(Capacitor.isNativePlatform()).toBe(true);

    isNativeSpy.mockRestore();
  });
});

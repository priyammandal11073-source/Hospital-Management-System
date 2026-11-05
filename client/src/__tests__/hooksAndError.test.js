import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getErrorMessage } from "../utils/errorHandler.js";
import { useNotifications } from "../hooks/index.js";
import * as components from "../components/index.js";
import * as hooks from "../hooks/index.js";

describe("Architecture & Codebase Quality Foundation", () => {
  describe("Centralized Error Handler (getErrorMessage)", () => {
    it("returns the fallback when error is null or undefined", () => {
      expect(getErrorMessage(null, "Default fallback")).toBe("Default fallback");
      expect(getErrorMessage(undefined)).toBe("An unexpected error occurred. Please try again.");
    });

    it("returns raw string error unchanged", () => {
      expect(getErrorMessage("Invalid credentials provided")).toBe("Invalid credentials provided");
    });

    it("extracts backend response message from Axios error object", () => {
      const axiosError = {
        response: {
          data: {
            message: "Doctor schedule slot already reserved.",
          },
        },
      };
      expect(getErrorMessage(axiosError)).toBe("Doctor schedule slot already reserved.");
    });

    it("extracts combined messages from Zod validation error arrays", () => {
      const zodError = {
        response: {
          data: {
            errors: [{ message: "Phone number required" }, { message: "Invalid email format" }],
          },
        },
      };
      expect(getErrorMessage(zodError)).toBe("Phone number required • Invalid email format");
    });

    it("handles network disconnects with friendly advice", () => {
      const netError = { code: "ECONNABORTED", message: "timeout of 5000ms exceeded" };
      expect(getErrorMessage(netError)).toContain("Network connection lost");
    });
  });

  describe("Hooks Architecture", () => {
    it("exports all standard domain hooks from index.js", () => {
      expect(hooks.useDebounce).toBeDefined();
      expect(hooks.useMediaQuery).toBeDefined();
      expect(hooks.useNotifications).toBeDefined();
      expect(hooks.usePatients).toBeDefined();
      expect(hooks.useAppointments).toBeDefined();
      expect(hooks.useBilling).toBeDefined();
      expect(hooks.useBeds).toBeDefined();
      expect(hooks.useVitals).toBeDefined();
    });

    it("returns safe defaults when useNotifications is called outside of provider", () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(typeof result.current.markRead).toBe("function");
    });
  });

  describe("Modular Component Architecture Barrels", () => {
    it("re-exports core layout, billing, bed, and UI components from central barrel", () => {
      expect(components.BaseLayout).toBeDefined();
      expect(components.UniversalPaymentModal).toBeDefined();
      expect(components.InvoiceModal).toBeDefined();
      expect(components.AllocateBedModal).toBeDefined();
      expect(components.DataTable).toBeDefined();
      expect(components.Modal).toBeDefined();
    });
  });
});

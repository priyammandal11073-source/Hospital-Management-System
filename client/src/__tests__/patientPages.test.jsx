import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MyBillings from "../pages/patient/MyBillings.jsx";
import PaymentHistory from "../pages/patient/PaymentHistory.jsx";
import MyPrescriptions from "../pages/patient/MyPrescriptions.jsx";
import MyVitals from "../pages/patient/MyVitals.jsx";
import MyDocuments from "../pages/patient/MyDocuments.jsx";

// Mock API calls
vi.mock("../services/api.js", () => ({
  getMyBillings: vi.fn().mockResolvedValue({
    billings: [
      {
        _id: "6724fa01bb9c084799000001",
        totalAmount: 1500,
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
        appointment: { timeSlot: "10:00 AM" },
      },
    ],
  }),
  getMyPrescriptions: vi.fn().mockResolvedValue({
    prescriptions: [],
  }),
  getMyVitals: vi.fn().mockResolvedValue({
    vitals: [],
  }),
  getMyDocuments: vi.fn().mockResolvedValue({
    documents: [],
  }),
  getRazorpayKey: vi.fn().mockResolvedValue({
    key: "rzp_test_mock",
  }),
}));

describe("Patient Portal Pages Rendering", () => {
  it("renders MyBillings without throwing React child error", async () => {
    const { container } = render(
      <MemoryRouter>
        <MyBillings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Bills & Invoices")).toBeDefined();
    });

    expect(screen.getByText("Invoices & Billing")).toBeDefined();
    expect(screen.getByText("My Health")).toBeDefined();
    expect(screen.getByText("Invoice #000001")).toBeDefined();
  });

  it("renders PaymentHistory without throwing React child error", async () => {
    render(
      <MemoryRouter>
        <PaymentHistory />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Hospital Payment History")).toBeDefined();
    });

    expect(screen.getByText("Payment History")).toBeDefined();
  });

  it("renders MyPrescriptions safely", async () => {
    render(
      <MemoryRouter>
        <MyPrescriptions />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Prescriptions")).toBeDefined();
    });
  });

  it("renders MyVitals safely", async () => {
    render(
      <MemoryRouter>
        <MyVitals />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Health Records & Vitals")).toBeDefined();
    });
  });

  it("renders MyDocuments safely", async () => {
    render(
      <MemoryRouter>
        <MyDocuments />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Health Documents & Records")).toBeDefined();
    });
  });
});

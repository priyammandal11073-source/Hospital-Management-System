import { describe, expect, it } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader.jsx";

describe("PageHeader component", () => {
  it("renders breadcrumb object arrays safely without throwing React child error", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="My Bills & Invoices"
          subtitle="Test Subtitle"
          breadcrumbs={[
            { label: "My Health", to: "/patient/dashboard" },
            { label: "Invoices & Billing", active: true },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("My Bills & Invoices")).toBeDefined();
    expect(screen.getByText("My Health")).toBeDefined();
    expect(screen.getByText("Invoices & Billing")).toBeDefined();
  });

  it("renders custom React node breadcrumbs safely", () => {
    render(
      <PageHeader
        title="Diagnostic Tests"
        breadcrumbs={<span data-testid="custom-crumb">Specialist POS</span>}
      />
    );

    expect(screen.getByTestId("custom-crumb")).toBeDefined();
    expect(screen.getByText("Specialist POS")).toBeDefined();
  });
});


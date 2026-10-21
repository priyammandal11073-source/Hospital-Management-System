import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Login portal-selection flow", () => {
  it("renders the portal-selection grid on first load", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: /Choose Your Portal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Doctor/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nursing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reception/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pharmacy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Diagnostics/i })).toBeInTheDocument();
  });

  it("shows only the specialization tiles after selecting Diagnostics", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /Diagnostics/i }));

    expect(screen.getByRole("heading", { name: /Select Specialization/i })).toBeInTheDocument();
    for (const role of ["Administrator", "Pathologist", "Radiologist", "Lab Tech", "Rad Tech"]) {
      expect(screen.getByRole("button", { name: new RegExp(role) })).toBeInTheDocument();
    }

    // No credentials form on the tiles-only step
    expect(screen.queryByLabelText("Staff Email")).not.toBeInTheDocument();
  });

  it("navigates to the credentials form after selecting a specialization", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /Diagnostics/i }));
    await user.click(screen.getByRole("button", { name: /Pathologist/i }));

    expect(screen.getByLabelText("Staff Email")).toHaveValue("pathologist@hospital.com");
    expect(screen.getByText(/Back to specialization selection/i)).toBeInTheDocument();
  });

  it("goes straight to the credentials form for portals without sub-roles", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /Pharmacy/i }));

    expect(screen.getByLabelText("Staff Email")).toHaveValue("pharmacist@hospital.com");
    expect(screen.getByLabelText("Password")).toHaveValue("pharmacist123");
  });
});
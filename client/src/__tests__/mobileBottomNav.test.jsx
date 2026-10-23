import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MobileBottomNav from "../components/mobile/MobileBottomNav.jsx";

describe("MobileBottomNav Component", () => {
  afterEach(cleanup);
  it("renders 4 navigation tabs and 1 menu button for admin role", () => {
    const toggleMenu = vi.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <MobileBottomNav
          role="admin"
          user={{ name: "Admin User", role: "admin" }}
          mobileOpen={false}
          onToggleMenu={toggleMenu}
          isModalOpen={false}
        />
      </MemoryRouter>
    );

    const nav = screen.getByLabelText("Mobile Bottom Navigation Bar");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass("opacity-100");

    const links = screen.getAllByRole("link");
    expect(links.length).toBe(4);

    const menuButton = screen.getByRole("button", { name: /navigation menu/i });
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(toggleMenu).toHaveBeenCalledTimes(1);
  });

  it("applies hidden pointer-events-none styling when isModalOpen is true", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <MobileBottomNav
          role="admin"
          user={{ name: "Admin User", role: "admin" }}
          mobileOpen={false}
          onToggleMenu={() => {}}
          isModalOpen={true}
        />
      </MemoryRouter>
    );

    const nav = screen.getByLabelText("Mobile Bottom Navigation Bar");
    expect(nav).toHaveClass("opacity-0");
    expect(nav).toHaveClass("pointer-events-none");
  });

  it("renders patient bottom tabs correctly for patient portal", () => {
    render(
      <MemoryRouter initialEntries={["/patient/dashboard"]}>
        <MobileBottomNav
          role="patient"
          user={{ name: "Patient Sharma", role: "patient" }}
          mobileOpen={false}
          onToggleMenu={() => {}}
          isModalOpen={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Health Hub")).toBeInTheDocument();
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("Prescriptions")).toBeInTheDocument();
    expect(screen.getByText("Lab Reports")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("closes mobile menu when a navigation tab is clicked while drawer is open", () => {
    const toggleMenu = vi.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <MobileBottomNav
          role="admin"
          user={{ name: "Admin", role: "admin" }}
          mobileOpen={true}
          onToggleMenu={toggleMenu}
          isModalOpen={false}
        />
      </MemoryRouter>
    );

    const links = screen.getAllByRole("link");
    fireEvent.click(links[0]);
    expect(toggleMenu).toHaveBeenCalledTimes(1);
  });
});

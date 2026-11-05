import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("portal design foundation", () => {
  it("scopes shared visual alignment to non-admin portals", () => {
    const layout = read("src/components/BaseLayout.jsx");
    const css = read("src/index.css");

    expect(layout).toContain("bg-[#f7f6f3]");
    expect(layout).toContain('data-portal-role={role}');
    expect(layout).toContain('data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}');
    expect(layout).toContain("getNavigationForRole(role, user)");
    expect(layout).toContain('"bg-teal-700 text-white font-semibold shadow-sm shadow-teal-950/10"');
    expect(layout).toContain('data-doctor-portal={role === "doctor" ? "true" : undefined}');
    expect(layout).toContain('data-nurse-portal={role === "nurse" ? "true" : undefined}');
    expect(css).toContain('[data-doctor-portal="true"] h1');
    expect(css).toContain('[data-nurse-portal="true"] h1');
    expect(css).toContain('[data-nurse-portal="true"] :is(button, a)[class*="bg-indigo-600"]');
    expect(css).not.toContain('[data-nurse-portal="true"] :is(button, a)[class*="bg-rose-600"]');
    expect(css).toContain('[data-doctor-portal="true"] :is(button, a)[class*="bg-indigo-600"]');
    expect(css).not.toContain('[data-portal-role]:not([data-portal-role="admin"]) [data-main-content]');
    expect(css).toContain("--color-card: #ffffff");
    expect(css).toContain("--color-focus: #0f766e");
    expect(css).toContain(".liquid-glass-sidebar");
  });

  it("keeps nurse routes and clinical workflow hooks available", () => {
    const app = read("src/App.jsx");
    const nursingPages = [
      "MyPatients.jsx", "PatientMonitoring.jsx", "VitalSignsPage.jsx", "MedicationsPage.jsx",
      "NursingNotesPage.jsx", "IntakeOutputPage.jsx", "NurseHandoverPage.jsx",
      "NursingTasksPage.jsx", "PatientTransfersPage.jsx", "AdmissionDischargePage.jsx", "DoctorOrdersPage.jsx",
    ].map((page) => read(`src/pages/nurse/${page}`));
    const nursePages = nursingPages.join("\\n");

    for (const route of [
      "/nurse/patients", "/nurse/monitoring", "/nurse/vitals", "/nurse/medications",
      "/nurse/notes", "/nurse/intake-output", "/nurse/handover", "/nurse/tasks",
      "/nurse/transfers", "/nurse/admission-discharge",
    ]) {
      expect(app).toContain(`<Route path="${route}"`);
    }

    for (const workflow of [
      "getInpatientsWithCare", "recordPatientVitals", "administerMedication",
      "createNursingNote", "createIntakeOutputRecord", "createHandover",
      "acknowledgeHandover", "createNursingTask", "updateNursingTaskStatus",
      "createPatientTransfer", "updatePatientTransferStatus",
    ]) {
      expect(nursePages).toContain(workflow);
    }
    expect(nursePages).toContain("isCritical");
    expect(nursePages).toContain("riskLevel");
    expect(nursePages).toContain("STAT");
  });

  it("keeps doctor clinical routes and workflows available", () => {
    const app = read("src/App.jsx");
    const consultation = read("src/pages/doctor/ConsultationWorkspace.jsx");
    const patientChart = read("src/components/doctor/DoctorPatientProfileModal.jsx");

    expect(app).toContain('<Route path="/doctor/consultation/:appointmentId"');
    expect(app).toContain('<Route path="/doctor/orders"');
    expect(app).toContain('<Route path="/doctor/referrals"');
    expect(app).toContain('<Route path="/doctor/critical-labs"');
    expect(app).toContain('<Route path="/doctor/follow-ups"');
    expect(app).toContain('<Route path="/doctor/telemedicine"');
    expect(consultation).toContain("concludeConsultation(payload)");
    expect(consultation).toContain("findClientInteractions(medications)");
    expect(consultation).toContain("allergyWarningAcknowledged");
    expect(consultation).toContain("labOrders: labOrders.length > 0");
    expect(consultation).toContain("referralEnabled && referralData.specialistDoctorId");
    expect(patientChart).toContain("getDoctorPatientProfile(patientId)");
  });

  it("keeps patient navigation separate from staff-only route configuration", () => {
    const navigation = read("src/config/navigationConfig.jsx");
    const patientStart = navigation.indexOf('if (normalizedRole === "patient")');
    const adminStart = navigation.indexOf("// 8. ADMIN / SUPER ADMIN NAVIGATION", patientStart);
    const patientSection = navigation.slice(patientStart, adminStart);

    expect(patientStart).toBeGreaterThanOrEqual(0);
    expect(patientSection).toContain("/patient/");
    expect(patientSection).not.toMatch(/\/admin\/|\/emergency\/|\/pharmacy\/|\/diagnostic\//);
  });

  it.each([
    "doctor", "nurse", "reception", "pharmacy", "diagnostic", "emergency", "patient",
  ])("contains the shared page hierarchy for the %s portal", (portal) => {
    const files = fs.readdirSync(path.join(projectRoot, "src/pages", portal));
    expect(files.some((file) => file.endsWith(".jsx"))).toBe(true);
  });

  it("verifies full 8-portal design system alignment attributes and typography", () => {
    const layout = read("src/components/BaseLayout.jsx");
    const css = read("src/index.css");

    // All non-admin portals scoped via data attributes
    expect(layout).toContain('data-doctor-portal=');
    expect(layout).toContain('data-nurse-portal=');
    expect(layout).toContain('data-emergency-portal=');
    expect(layout).toContain('data-patient-portal=');
    expect(layout).toContain('data-reception-portal=');
    expect(layout).toContain('data-pharmacy-portal=');
    expect(layout).toContain('data-diagnostic-portal=');

    // CSS selectors for unified typography and inputs
    expect(css).toContain('[data-reception-portal="true"] h1');
    expect(css).toContain('[data-pharmacy-portal="true"] h1');
    expect(css).toContain('[data-diagnostic-portal="true"] h1');
    expect(css).toContain('[data-emergency-portal="true"] h1');
    expect(css).toContain('[data-patient-portal="true"] h1');
  });
});

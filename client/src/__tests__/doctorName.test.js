import { describe, it, expect } from "vitest";
import { formatDoctorName, getDoctorName, getDoctorDisplayName } from "../utils/doctorName.js";

describe("Doctor Name Formatting Utilities", () => {
  it("removes duplicate Dr. prefixes when given a string with multiple Dr.", () => {
    expect(formatDoctorName("Dr. Dr. Rajesh Sharma")).toBe("Dr. Rajesh Sharma");
    expect(formatDoctorName("Dr. Dr. Dr. Ananya Sen")).toBe("Dr. Ananya Sen");
    expect(formatDoctorName("dr. Dr. Arvind Verma")).toBe("Dr. Arvind Verma");
    expect(formatDoctorName("DR. DR. Priya Nair")).toBe("Dr. Priya Nair");
  });

  it("handles names with single Dr. prefix correctly", () => {
    expect(formatDoctorName("Dr. Rajesh Sharma")).toBe("Dr. Rajesh Sharma");
    expect(formatDoctorName("Dr. Ananya Sen")).toBe("Dr. Ananya Sen");
  });

  it("adds Dr. prefix when given a raw name without prefix", () => {
    expect(formatDoctorName("Rajesh Sharma")).toBe("Dr. Rajesh Sharma");
    expect(formatDoctorName("Arvind Verma")).toBe("Dr. Arvind Verma");
  });

  it("handles doctor objects with name property", () => {
    expect(formatDoctorName({ name: "Dr. Dr. Rohan Kapoor" })).toBe("Dr. Rohan Kapoor");
    expect(formatDoctorName({ name: "Dr. Rohan Kapoor" })).toBe("Dr. Rohan Kapoor");
    expect(formatDoctorName({ name: "Rohan Kapoor" })).toBe("Dr. Rohan Kapoor");
  });

  it("handles null, undefined, and empty string with fallback", () => {
    expect(formatDoctorName(null, "Consultant")).toBe("Dr. Consultant");
    expect(formatDoctorName("", "Attending Physician")).toBe("Dr. Attending Physician");
    expect(formatDoctorName(undefined, "Dr. Specialist")).toBe("Dr. Specialist");
    expect(formatDoctorName(null, "—")).toBe("—");
    expect(formatDoctorName(null, "N/A")).toBe("N/A");
  });

  it("strips all Dr. prefixes in getDoctorName", () => {
    expect(getDoctorName("Dr. Dr. Priya Nair")).toBe("Priya Nair");
    expect(getDoctorName("Dr. Priya Nair")).toBe("Priya Nair");
    expect(getDoctorName("Priya Nair")).toBe("Priya Nair");
    expect(getDoctorName({ name: "Dr. Dr. Priya Nair" })).toBe("Priya Nair");
  });

  it("getDoctorDisplayName behaves identically to formatDoctorName", () => {
    expect(getDoctorDisplayName("Dr. Dr. Arvind Verma")).toBe("Dr. Arvind Verma");
  });
});

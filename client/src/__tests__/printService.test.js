import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateReportHtml, printClinicalReport } from "../utils/printReport.js";
import * as printUtils from "../utils/printUtils.js";

describe("Print Service & Report Generator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll("iframe[data-hms-print='true']").forEach(el => el.remove());
  });

  describe("generateReportHtml", () => {
    it("renders pathology reports with testResults correctly", () => {
      const mockReport = {
        reportNumber: "RPT-100234",
        department: "Pathology",
        patient: { name: "Aarav Sharma", age: 34, gender: "Male" },
        doctor: { name: "Dr. Ananya Roy", specialization: "Internal Medicine" },
        testResults: [
          { parameter: "Hemoglobin", result: "14.5", unit: "g/dL", referenceRange: "13.0 - 17.0", status: "normal" },
          { parameter: "WBC Count", result: "11500", unit: "/cumm", referenceRange: "4000 - 11000", status: "high" },
        ],
        summaryConclusion: "Mild leukocytosis observed. Clinical correlation advised.",
      };

      const html = generateReportHtml(mockReport);
      expect(html).toContain("RPT-100234");
      expect(html).toContain("Aarav Sharma");
      expect(html).toContain("Hemoglobin");
      expect(html).toContain("14.5");
      expect(html).toContain("WBC Count");
      expect(html).toContain("Mild leukocytosis observed");
      expect(html).toContain("FINAL REPORT");
    });

    it("renders standard LabReport with results array and notes", () => {
      const mockLabReport = {
        reportNumber: "LAB-998811",
        category: "Biochemistry",
        patientName: "Sunita Patel",
        patientAge: 48,
        patientGender: "Female",
        results: [
          { parameter: "Fasting Blood Sugar", result: "128", unit: "mg/dL", referenceRange: "70 - 99", status: "high" },
        ],
        notes: "Impaired fasting glucose pattern.",
        verifiedBy: "Dr. K. S. Verma",
      };

      const html = generateReportHtml(mockLabReport);
      expect(html).toContain("LAB-998811");
      expect(html).toContain("Sunita Patel");
      expect(html).toContain("Fasting Blood Sugar");
      expect(html).toContain("128");
      expect(html).toContain("Impaired fasting glucose pattern");
      expect(html).toContain("Dr. K. S. Verma");
    });

    it("renders radiology findings and impressions", () => {
      const mockRadiologyReport = {
        reportNumber: "RAD-772211",
        department: "Radiology",
        patient: { name: "Vikram Malhotra" },
        radiologyStudy: {
          technique: "High resolution CT Thorax without contrast",
          findings: "Clear lung parenchyma bilaterally without consolidation.",
          impression: "Normal CT Thorax study.",
          radiationDose: "1.2 mSv",
        },
      };

      const html = generateReportHtml(mockRadiologyReport);
      expect(html).toContain("RAD-772211");
      expect(html).toContain("Clear lung parenchyma bilaterally");
      expect(html).toContain("Normal CT Thorax study");
      expect(html).toContain("1.2 mSv");
    });
  });

  describe("printClinicalReport", () => {
    it("calls printHtml with generated HTML document and report title", async () => {
      const printSpy = vi.spyOn(printUtils, "printHtml").mockResolvedValue();

      const mockReport = {
        reportNumber: "RPT-556677",
        patient: { name: "Meera Nair" },
        testResults: [{ parameter: "Serum Creatinine", result: "0.9", unit: "mg/dL" }],
      };

      await printClinicalReport(mockReport);

      expect(printSpy).toHaveBeenCalledTimes(1);
      const [calledHtml, options] = printSpy.mock.calls[0];
      expect(calledHtml).toContain("RPT-556677");
      expect(calledHtml).toContain("Meera Nair");
      expect(options.title).toContain("RPT-556677");
    });
  });
});

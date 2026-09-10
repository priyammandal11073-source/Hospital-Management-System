import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

import User from "./models/User.js";
import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";
import Equipment from "./models/Equipment.js";
import Inventory from "./models/Inventory.js";
import DiagnosticTest from "./models/DiagnosticTest.js";
import DiagnosticOrder from "./models/DiagnosticOrder.js";
import DiagnosticSample from "./models/DiagnosticSample.js";
import DiagnosticReport from "./models/DiagnosticReport.js";
import DiagnosticFile from "./models/DiagnosticFile.js";
import Billing from "./models/Billing.js";
import AuditLog from "./models/AuditLog.js";

const storageDir = path.resolve(__dirname, "storage/medical_files");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// -----------------------------------------------------------------
// 1. COMPLETE TEST CATALOG DEFINITIONS (390+ TESTS)
// -----------------------------------------------------------------
const PATHOLOGY_CATALOG = [
  // HEMATOLOGY (28 tests)
  { testCode: "LAB-HEM-001", testName: "Complete Blood Count (CBC)", category: "Hematology", subCategory: "Routine", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 350, referenceRanges: [
    { parameter: "Hemoglobin", unit: "g/dL", normalRange: "13.0 - 17.0", lowCritical: 7.0, highCritical: 20.0 },
    { parameter: "RBC Count", unit: "million/uL", normalRange: "4.5 - 5.9", lowCritical: 2.5, highCritical: 6.5 },
    { parameter: "WBC Count", unit: "/uL", normalRange: "4000 - 11000", lowCritical: 2000, highCritical: 30000 },
    { parameter: "Platelet Count", unit: "/uL", normalRange: "150000 - 450000", lowCritical: 50000, highCritical: 1000000 },
    { parameter: "Hematocrit (PCV)", unit: "%", normalRange: "40 - 50", lowCritical: 20, highCritical: 60 },
  ]},
  { testCode: "LAB-HEM-002", testName: "Hemoglobin (Hb)", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "1 hour", price: 120 },
  { testCode: "LAB-HEM-003", testName: "RBC Count", category: "Hematology", subCategory: "Routine", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-004", testName: "WBC Count", category: "Hematology", subCategory: "Infection", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-005", testName: "Differential Leukocyte Count (DLC)", category: "Hematology", subCategory: "Routine", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-HEM-006", testName: "Absolute Neutrophil Count (ANC)", category: "Hematology", subCategory: "Infection", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-HEM-007", testName: "Absolute Lymphocyte Count (ALC)", category: "Hematology", subCategory: "Immunity", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-HEM-008", testName: "Absolute Monocyte Count", category: "Hematology", subCategory: "Infection", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-HEM-009", testName: "Absolute Eosinophil Count (AEC)", category: "Hematology", subCategory: "Allergy", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-HEM-010", testName: "Absolute Basophil Count", category: "Hematology", subCategory: "Routine", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-HEM-011", testName: "Platelet Count", category: "Hematology", subCategory: "Coagulation", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "1 hour", price: 150 },
  { testCode: "LAB-HEM-012", testName: "Hematocrit / PCV", category: "Hematology", subCategory: "Routine", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "1 hour", price: 150 },
  { testCode: "LAB-HEM-013", testName: "MCV (Mean Corpuscular Volume)", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-014", testName: "MCH (Mean Corpuscular Hemoglobin)", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-015", testName: "MCHC", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-016", testName: "Red Cell Distribution Width (RDW)", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-017", testName: "Mean Platelet Volume (MPV)", category: "Hematology", subCategory: "Coagulation", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-018", testName: "Peripheral Blood Smear (PS)", category: "Hematology", subCategory: "Microscopy", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "4 hours", price: 300 },
  { testCode: "LAB-HEM-019", testName: "Reticulocyte Count", category: "Hematology", subCategory: "Anemia", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "4 hours", price: 350 },
  { testCode: "LAB-HEM-020", testName: "Erythrocyte Sedimentation Rate (ESR)", category: "Hematology", subCategory: "Inflammation", sampleType: "Whole Blood", containerType: "Sodium Citrate (Black)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-HEM-021", testName: "Sickling Test", category: "Hematology", subCategory: "Hemoglobinopathy", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "6 hours", price: 400 },
  { testCode: "LAB-HEM-022", testName: "Hb Electrophoresis", category: "Hematology", subCategory: "Hemoglobinopathy", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "24 hours", price: 1200 },
  { testCode: "LAB-HEM-023", testName: "HPLC Hemoglobin Analysis", category: "Hematology", subCategory: "Hemoglobinopathy", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "24 hours", price: 1500 },
  { testCode: "LAB-HEM-024", testName: "G6PD Qualitative", category: "Hematology", subCategory: "Enzyme", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "12 hours", price: 600 },
  { testCode: "LAB-HEM-025", testName: "Osmotic Fragility Test", category: "Hematology", subCategory: "Hemolysis", sampleType: "Heparinized Blood", containerType: "Heparin (Green)", turnaroundTime: "12 hours", price: 800 },
  { testCode: "LAB-HEM-026", testName: "Bone Marrow Examination", category: "Hematology", subCategory: "Specialized", sampleType: "Bone Marrow", containerType: "Sterile Tube", turnaroundTime: "48 hours", price: 3500 },
  { testCode: "LAB-HEM-027", testName: "Bone Marrow Aspiration", category: "Hematology", subCategory: "Specialized", sampleType: "Bone Marrow", containerType: "Sterile Tube", turnaroundTime: "48 hours", price: 3000 },
  { testCode: "LAB-HEM-028", testName: "Bone Marrow Biopsy", category: "Hematology", subCategory: "Specialized", sampleType: "Bone Core", containerType: "Formalin Vial", turnaroundTime: "72 hours", price: 4500 },

  // COAGULATION (14 tests)
  { testCode: "LAB-COA-001", testName: "Prothrombin Time (PT / INR)", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "2 hours", price: 300 },
  { testCode: "LAB-COA-002", testName: "Activated Partial Thromboplastin Time (aPTT)", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "2 hours", price: 400 },
  { testCode: "LAB-COA-003", testName: "Bleeding Time & Clotting Time (BT/CT)", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Capillary Blood", containerType: "Capillary Tube", turnaroundTime: "30 mins", price: 150 },
  { testCode: "LAB-COA-004", testName: "Fibrinogen Level", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "4 hours", price: 650 },
  { testCode: "LAB-COA-005", testName: "D-Dimer Quantitative", category: "Coagulation", subCategory: "Thrombosis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "2 hours", price: 1200 },
  { testCode: "LAB-COA-006", testName: "Thrombin Time (TT)", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "4 hours", price: 500 },
  { testCode: "LAB-COA-007", testName: "Factor VIII Assay", category: "Coagulation", subCategory: "Factors", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "24 hours", price: 2500 },
  { testCode: "LAB-COA-008", testName: "Factor IX Assay", category: "Coagulation", subCategory: "Factors", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "24 hours", price: 2500 },
  { testCode: "LAB-COA-009", testName: "Protein C Activity", category: "Coagulation", subCategory: "Thrombophilia", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "48 hours", price: 3000 },
  { testCode: "LAB-COA-010", testName: "Protein S Activity", category: "Coagulation", subCategory: "Thrombophilia", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "48 hours", price: 3000 },
  { testCode: "LAB-COA-011", testName: "Antithrombin III", category: "Coagulation", subCategory: "Thrombophilia", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "48 hours", price: 2800 },
  { testCode: "LAB-COA-012", testName: "Lupus Anticoagulant (dRVVT)", category: "Coagulation", subCategory: "Autoimmune", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "48 hours", price: 2200 },
  { testCode: "LAB-COA-013", testName: "Platelet Aggregation Study", category: "Coagulation", subCategory: "Function", sampleType: "PRP", containerType: "Sodium Citrate (Blue)", turnaroundTime: "24 hours", price: 2800 },
  { testCode: "LAB-COA-014", testName: "Von Willebrand Factor Antigen", category: "Coagulation", subCategory: "Hemostasis", sampleType: "Plasma", containerType: "Sodium Citrate (Blue)", turnaroundTime: "48 hours", price: 3500 },

  // CLINICAL BIOCHEMISTRY (47 tests)
  { testCode: "LAB-BIO-001", testName: "Fasting Blood Sugar (FBS)", category: "Clinical Biochemistry", subCategory: "Diabetes", sampleType: "Fluoride Plasma", containerType: "Fluoride (Grey)", turnaroundTime: "2 hours", price: 80, fastingRequired: true },
  { testCode: "LAB-BIO-002", testName: "Post-Prandial Blood Sugar (PPBS)", category: "Clinical Biochemistry", subCategory: "Diabetes", sampleType: "Fluoride Plasma", containerType: "Fluoride (Grey)", turnaroundTime: "2 hours", price: 80 },
  { testCode: "LAB-BIO-003", testName: "Random Blood Sugar (RBS)", category: "Clinical Biochemistry", subCategory: "Diabetes", sampleType: "Fluoride Plasma", containerType: "Fluoride (Grey)", turnaroundTime: "30 mins", price: 80 },
  { testCode: "LAB-BIO-004", testName: "HbA1c (Glycated Hemoglobin)", category: "Clinical Biochemistry", subCategory: "Diabetes", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "4 hours", price: 550 },
  { testCode: "LAB-BIO-005", testName: "Kidney Function Test (KFT)", category: "Clinical Biochemistry", subCategory: "Renal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 650, referenceRanges: [
    { parameter: "Urea", unit: "mg/dL", normalRange: "15 - 40", lowCritical: 5, highCritical: 100 },
    { parameter: "Creatinine", unit: "mg/dL", normalRange: "0.6 - 1.2", lowCritical: 0.3, highCritical: 4.0 },
    { parameter: "Uric Acid", unit: "mg/dL", normalRange: "3.5 - 7.2" },
  ]},
  { testCode: "LAB-BIO-006", testName: "Serum Urea", category: "Clinical Biochemistry", subCategory: "Renal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-007", testName: "Blood Urea Nitrogen (BUN)", category: "Clinical Biochemistry", subCategory: "Renal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 160 },
  { testCode: "LAB-BIO-008", testName: "Serum Creatinine", category: "Clinical Biochemistry", subCategory: "Renal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-BIO-009", testName: "Estimated GFR (eGFR)", category: "Clinical Biochemistry", subCategory: "Renal", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-BIO-010", testName: "Serum Uric Acid", category: "Clinical Biochemistry", subCategory: "Metabolic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-BIO-011", testName: "Serum Electrolytes (Na, K, Cl)", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 450, referenceRanges: [
    { parameter: "Sodium (Na)", unit: "mEq/L", normalRange: "135 - 145", lowCritical: 120, highCritical: 160 },
    { parameter: "Potassium (K)", unit: "mEq/L", normalRange: "3.5 - 5.1", lowCritical: 2.8, highCritical: 6.2 },
    { parameter: "Chloride (Cl)", unit: "mEq/L", normalRange: "96 - 106", lowCritical: 80, highCritical: 125 },
  ]},
  { testCode: "LAB-BIO-012", testName: "Serum Sodium (Na)", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "1 hour", price: 180 },
  { testCode: "LAB-BIO-013", testName: "Serum Potassium (K)", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "1 hour", price: 180 },
  { testCode: "LAB-BIO-014", testName: "Serum Chloride (Cl)", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "1 hour", price: 180 },
  { testCode: "LAB-BIO-015", testName: "Serum Bicarbonate (HCO3)", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 220 },
  { testCode: "LAB-BIO-016", testName: "Serum Calcium Total", category: "Clinical Biochemistry", subCategory: "Bone & Minerals", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-BIO-017", testName: "Ionized Calcium", category: "Clinical Biochemistry", subCategory: "Bone & Minerals", sampleType: "Whole Blood/Serum", containerType: "Heparin (Green)", turnaroundTime: "2 hours", price: 450 },
  { testCode: "LAB-BIO-018", testName: "Serum Magnesium", category: "Clinical Biochemistry", subCategory: "Electrolytes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 300 },
  { testCode: "LAB-BIO-019", testName: "Serum Phosphorus", category: "Clinical Biochemistry", subCategory: "Bone & Minerals", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 220 },
  { testCode: "LAB-BIO-020", testName: "Liver Function Test (LFT)", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 750, referenceRanges: [
    { parameter: "Total Bilirubin", unit: "mg/dL", normalRange: "0.2 - 1.2", lowCritical: 0.1, highCritical: 15.0 },
    { parameter: "SGOT (AST)", unit: "U/L", normalRange: "10 - 40", lowCritical: 5, highCritical: 500 },
    { parameter: "SGPT (ALT)", unit: "U/L", normalRange: "7 - 56", lowCritical: 5, highCritical: 500 },
    { parameter: "Alkaline Phosphatase (ALP)", unit: "U/L", normalRange: "44 - 147" },
  ]},
  { testCode: "LAB-BIO-021", testName: "Total Bilirubin", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-022", testName: "Direct Bilirubin", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-023", testName: "Indirect Bilirubin", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-024", testName: "AST / SGOT", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-BIO-025", testName: "ALT / SGPT", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-BIO-026", testName: "Alkaline Phosphatase (ALP)", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-BIO-027", testName: "Gamma GT (GGT)", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 300 },
  { testCode: "LAB-BIO-028", testName: "Total Protein", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-029", testName: "Serum Albumin", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 160 },
  { testCode: "LAB-BIO-030", testName: "Serum Globulin", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 160 },
  { testCode: "LAB-BIO-031", testName: "A/G Ratio", category: "Clinical Biochemistry", subCategory: "Hepatic", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 160 },
  { testCode: "LAB-BIO-032", testName: "Lipid Profile", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 650, fastingRequired: true },
  { testCode: "LAB-BIO-033", testName: "Total Cholesterol", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-BIO-034", testName: "HDL Cholesterol", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 220 },
  { testCode: "LAB-BIO-035", testName: "LDL Cholesterol", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 250 },
  { testCode: "LAB-BIO-036", testName: "VLDL Cholesterol", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-BIO-037", testName: "Serum Triglycerides", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 250 },
  { testCode: "LAB-BIO-038", testName: "Cholesterol / HDL Ratio", category: "Clinical Biochemistry", subCategory: "Lipids", sampleType: "Calculated", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-BIO-039", testName: "Serum Amylase", category: "Clinical Biochemistry", subCategory: "Pancreas", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 450 },
  { testCode: "LAB-BIO-040", testName: "Serum Lipase", category: "Clinical Biochemistry", subCategory: "Pancreas", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 550 },
  { testCode: "LAB-BIO-041", testName: "Creatine Kinase (CK / CPK)", category: "Clinical Biochemistry", subCategory: "Cardiac & Muscle", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 400 },
  { testCode: "LAB-BIO-042", testName: "CK-MB", category: "Clinical Biochemistry", subCategory: "Cardiac", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 550 },
  { testCode: "LAB-BIO-043", testName: "LDH (Lactate Dehydrogenase)", category: "Clinical Biochemistry", subCategory: "Enzymes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 350 },
  { testCode: "LAB-BIO-044", testName: "Troponin I High Sensitivity (hs-cTnI)", category: "Clinical Biochemistry", subCategory: "Cardiac", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "1 hour", price: 1400, referenceRanges: [
    { parameter: "Troponin I", unit: "ng/mL", normalRange: "0.00 - 0.04", lowCritical: 0, highCritical: 0.1 },
  ]},
  { testCode: "LAB-BIO-045", testName: "Troponin T High Sensitivity", category: "Clinical Biochemistry", subCategory: "Cardiac", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "1 hour", price: 1500 },
  { testCode: "LAB-BIO-046", testName: "NT-proBNP / BNP", category: "Clinical Biochemistry", subCategory: "Cardiac", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 2800 },
  { testCode: "LAB-BIO-047", testName: "Arterial Blood Gas (ABG)", category: "Clinical Biochemistry", subCategory: "Critical Care", sampleType: "Arterial Blood", containerType: "Heparin Syringe", turnaroundTime: "30 mins", price: 1200 },

  // THYROID (8 tests)
  { testCode: "LAB-THY-001", testName: "Thyroid Profile Total (T3, T4, TSH)", category: "Thyroid", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 550 },
  { testCode: "LAB-THY-002", testName: "Thyroid Profile Free (FT3, FT4, TSH)", category: "Thyroid", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 750 },
  { testCode: "LAB-THY-003", testName: "TSH (Ultrasensitive)", category: "Thyroid", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 250 },
  { testCode: "LAB-THY-004", testName: "Free T3 (FT3)", category: "Thyroid", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 300 },
  { testCode: "LAB-THY-005", testName: "Free T4 (FT4)", category: "Thyroid", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 300 },
  { testCode: "LAB-THY-006", testName: "Anti-TPO Antibodies", category: "Thyroid", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1200 },
  { testCode: "LAB-THY-007", testName: "Anti-Thyroglobulin (Anti-Tg)", category: "Thyroid", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1400 },
  { testCode: "LAB-THY-008", testName: "Serum Thyroglobulin", category: "Thyroid", subCategory: "Tumor Marker", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1600 },

  // HORMONES (22 tests)
  { testCode: "LAB-HOR-001", testName: "FSH (Follicle Stimulating Hormone)", category: "Hormones", subCategory: "Fertility", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 500 },
  { testCode: "LAB-HOR-002", testName: "LH (Luteinizing Hormone)", category: "Hormones", subCategory: "Fertility", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 500 },
  { testCode: "LAB-HOR-003", testName: "Prolactin", category: "Hormones", subCategory: "Fertility", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 450 },
  { testCode: "LAB-HOR-004", testName: "Estradiol (E2)", category: "Hormones", subCategory: "Fertility", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 600 },
  { testCode: "LAB-HOR-005", testName: "Progesterone", category: "Hormones", subCategory: "Fertility", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 650 },
  { testCode: "LAB-HOR-006", testName: "Testosterone Total", category: "Hormones", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 600 },
  { testCode: "LAB-HOR-007", testName: "Free Testosterone", category: "Hormones", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1400 },
  { testCode: "LAB-HOR-008", testName: "SHBG", category: "Hormones", subCategory: "Endocrine", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1500 },
  { testCode: "LAB-HOR-009", testName: "DHEA-S", category: "Hormones", subCategory: "Adrenal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1200 },
  { testCode: "LAB-HOR-010", testName: "AMH (Anti-Mullerian Hormone)", category: "Hormones", subCategory: "Ovarian Reserve", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 2000 },
  { testCode: "LAB-HOR-011", testName: "Beta-hCG (Total)", category: "Hormones", subCategory: "Pregnancy", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 550 },
  { testCode: "LAB-HOR-012", testName: "Cortisol (Morning 8 AM)", category: "Hormones", subCategory: "Adrenal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 600 },
  { testCode: "LAB-HOR-013", testName: "Cortisol (Evening 4 PM)", category: "Hormones", subCategory: "Adrenal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 600 },
  { testCode: "LAB-HOR-014", testName: "ACTH (Adrenocorticotropic Hormone)", category: "Hormones", subCategory: "Pituitary", sampleType: "EDTA Plasma on Ice", containerType: "EDTA (Lavender)", turnaroundTime: "24 hours", price: 1800 },
  { testCode: "LAB-HOR-015", testName: "Aldosterone", category: "Hormones", subCategory: "Adrenal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "48 hours", price: 2200 },
  { testCode: "LAB-HOR-016", testName: "Plasma Renin Activity", category: "Hormones", subCategory: "Renal Endocrine", sampleType: "Plasma on Ice", containerType: "EDTA (Lavender)", turnaroundTime: "48 hours", price: 2800 },
  { testCode: "LAB-HOR-017", testName: "Growth Hormone (GH)", category: "Hormones", subCategory: "Pituitary", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1100 },
  { testCode: "LAB-HOR-018", testName: "IGF-1 (Somatomedin C)", category: "Hormones", subCategory: "Growth", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "48 hours", price: 2500 },
  { testCode: "LAB-HOR-019", testName: "Intact PTH (Parathyroid Hormone)", category: "Hormones", subCategory: "Bone", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 1400 },
  { testCode: "LAB-HOR-020", testName: "Vitamin D 25-Hydroxy", category: "Hormones", subCategory: "Nutrition & Bone", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 1200 },
  { testCode: "LAB-HOR-021", testName: "Fasting Insulin", category: "Hormones", subCategory: "Metabolic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 750, fastingRequired: true },
  { testCode: "LAB-HOR-022", testName: "C-Peptide", category: "Hormones", subCategory: "Diabetes", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 950 },

  // URINALYSIS (15 tests)
  { testCode: "LAB-URI-001", testName: "Routine Urine Examination (Complete)", category: "Urinalysis", subCategory: "Routine", sampleType: "Random Urine", containerType: "Sterile Cup", turnaroundTime: "2 hours", price: 150 },
  { testCode: "LAB-URI-002", testName: "Urine Microscopy", category: "Urinalysis", subCategory: "Microscopy", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "2 hours", price: 120 },
  { testCode: "LAB-URI-003", testName: "Urine Protein Dipstick", category: "Urinalysis", subCategory: "Renal", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "1 hour", price: 80 },
  { testCode: "LAB-URI-004", testName: "Urine Glucose", category: "Urinalysis", subCategory: "Metabolic", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "1 hour", price: 80 },
  { testCode: "LAB-URI-005", testName: "Urine Ketones", category: "Urinalysis", subCategory: "Metabolic", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "1 hour", price: 100 },
  { testCode: "LAB-URI-006", testName: "Urine Specific Gravity", category: "Urinalysis", subCategory: "Renal", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "1 hour", price: 80 },
  { testCode: "LAB-URI-007", testName: "Urine pH", category: "Urinalysis", subCategory: "Routine", sampleType: "Urine", containerType: "Sterile Cup", turnaroundTime: "1 hour", price: 80 },
  { testCode: "LAB-URI-008", testName: "Urine Microalbumin", category: "Urinalysis", subCategory: "Renal", sampleType: "Early Morning Urine", containerType: "Sterile Cup", turnaroundTime: "4 hours", price: 600 },
  { testCode: "LAB-URI-009", testName: "Urine Albumin / Creatinine Ratio (UACR)", category: "Urinalysis", subCategory: "Renal", sampleType: "Spot Urine", containerType: "Sterile Cup", turnaroundTime: "4 hours", price: 750 },
  { testCode: "LAB-URI-010", testName: "Urine Protein / Creatinine Ratio (UPCR)", category: "Urinalysis", subCategory: "Renal", sampleType: "Spot Urine", containerType: "Sterile Cup", turnaroundTime: "4 hours", price: 650 },
  { testCode: "LAB-URI-011", testName: "24-Hour Urine Protein", category: "Urinalysis", subCategory: "Renal", sampleType: "24h Urine Collection", containerType: "24h Canister", turnaroundTime: "6 hours", price: 450 },
  { testCode: "LAB-URI-012", testName: "24-Hour Urine Creatinine Clearance", category: "Urinalysis", subCategory: "Renal", sampleType: "24h Urine + Serum", containerType: "24h Canister", turnaroundTime: "6 hours", price: 600 },
  { testCode: "LAB-URI-013", testName: "Urine Bence Jones Protein", category: "Urinalysis", subCategory: "Myeloma", sampleType: "Fresh Urine", containerType: "Sterile Cup", turnaroundTime: "12 hours", price: 500 },
  { testCode: "LAB-URI-014", testName: "Urine Pregnancy Test (UPT)", category: "Urinalysis", subCategory: "Pregnancy", sampleType: "First Morning Urine", containerType: "Sterile Cup", turnaroundTime: "30 mins", price: 150 },
  { testCode: "LAB-URI-015", testName: "Urine Drug Screen Panel (10 Drugs)", category: "Urinalysis", subCategory: "Toxicology", sampleType: "Supervised Urine", containerType: "Tamper-Evident Cup", turnaroundTime: "6 hours", price: 1800 },

  // MICROBIOLOGY (24 tests)
  { testCode: "LAB-MIC-001", testName: "Blood Culture & Sensitivity (Aerobic)", category: "Microbiology", subCategory: "Bacteriology", sampleType: "Blood", containerType: "Blood Culture Bottle", turnaroundTime: "48-72 hours", price: 1200 },
  { testCode: "LAB-MIC-002", testName: "Blood Culture & Sensitivity (Anaerobic)", category: "Microbiology", subCategory: "Bacteriology", sampleType: "Blood", containerType: "Anaerobic Bottle", turnaroundTime: "48-72 hours", price: 1400 },
  { testCode: "LAB-MIC-003", testName: "Urine Culture & Sensitivity", category: "Microbiology", subCategory: "Bacteriology", sampleType: "Midstream Urine", containerType: "Sterile Cup", turnaroundTime: "48 hours", price: 650 },
  { testCode: "LAB-MIC-004", testName: "Sputum Culture & Sensitivity", category: "Microbiology", subCategory: "Respiratory", sampleType: "Morning Sputum", containerType: "Sterile Cup", turnaroundTime: "48 hours", price: 700 },
  { testCode: "LAB-MIC-005", testName: "Stool Culture & Sensitivity", category: "Microbiology", subCategory: "Enteric", sampleType: "Fresh Stool", containerType: "Sterile Container", turnaroundTime: "48 hours", price: 750 },
  { testCode: "LAB-MIC-006", testName: "Wound Swab Culture & Sensitivity", category: "Microbiology", subCategory: "Surgical", sampleType: "Swab Exudate", containerType: "Transport Swab", turnaroundTime: "48 hours", price: 650 },
  { testCode: "LAB-MIC-007", testName: "Pus Culture & Sensitivity", category: "Microbiology", subCategory: "Bacteriology", sampleType: "Pus Aspirate", containerType: "Sterile Syringe/Swab", turnaroundTime: "48 hours", price: 700 },
  { testCode: "LAB-MIC-008", testName: "Throat Swab Culture", category: "Microbiology", subCategory: "ENT", sampleType: "Throat Swab", containerType: "Transport Swab", turnaroundTime: "48 hours", price: 600 },
  { testCode: "LAB-MIC-009", testName: "CSF Culture & Sensitivity", category: "Microbiology", subCategory: "CNS", sampleType: "CSF", containerType: "Sterile Vial", turnaroundTime: "48 hours", price: 1500 },
  { testCode: "LAB-MIC-010", testName: "Gram Stain", category: "Microbiology", subCategory: "Staining", sampleType: "Body Fluid / Swab", containerType: "Slide / Sterile Vial", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-MIC-011", testName: "AFB Stain (Acid Fast Bacilli)", category: "Microbiology", subCategory: "TB", sampleType: "Sputum / Fluid", containerType: "Sterile Cup", turnaroundTime: "4 hours", price: 250 },
  { testCode: "LAB-MIC-012", testName: "KOH Mount for Fungus", category: "Microbiology", subCategory: "Mycology", sampleType: "Skin Scrape / Hair / Nail", containerType: "Sterile Envelope", turnaroundTime: "3 hours", price: 250 },
  { testCode: "LAB-MIC-013", testName: "India Ink Preparation (Cryptococcus)", category: "Microbiology", subCategory: "Mycology", sampleType: "CSF", containerType: "Sterile Tube", turnaroundTime: "2 hours", price: 350 },
  { testCode: "LAB-MIC-014", testName: "Wet Mount Examination", category: "Microbiology", subCategory: "Parasitology", sampleType: "Vaginal Swab / Stool", containerType: "Saline Tube", turnaroundTime: "1 hour", price: 200 },
  { testCode: "LAB-MIC-015", testName: "Antibiotic Sensitivity (MIC Determination)", category: "Microbiology", subCategory: "Antimicrobial", sampleType: "Bacterial Isolate", containerType: "Culture Plate", turnaroundTime: "24 hours", price: 1200 },
  { testCode: "LAB-MIC-016", testName: "MRSA Screening", category: "Microbiology", subCategory: "Infection Control", sampleType: "Nasal Swab", containerType: "Transport Swab", turnaroundTime: "24 hours", price: 850 },
  { testCode: "LAB-MIC-017", testName: "ESBL Detection", category: "Microbiology", subCategory: "Infection Control", sampleType: "Isolate", containerType: "Culture Plate", turnaroundTime: "24 hours", price: 950 },
  { testCode: "LAB-MIC-018", testName: "Carbapenemase Detection (CRE)", category: "Microbiology", subCategory: "Infection Control", sampleType: "Isolate", containerType: "Culture Plate", turnaroundTime: "24 hours", price: 1400 },
  { testCode: "LAB-MIC-019", testName: "Stool Routine & Microscopy", category: "Microbiology", subCategory: "Gastro", sampleType: "Stool", containerType: "Sterile Cup", turnaroundTime: "2 hours", price: 180 },
  { testCode: "LAB-MIC-020", testName: "Stool Occult Blood (FOBT)", category: "Microbiology", subCategory: "Gastro", sampleType: "Stool", containerType: "Sterile Cup", turnaroundTime: "2 hours", price: 250 },
  { testCode: "LAB-MIC-021", testName: "Stool Calprotectin", category: "Microbiology", subCategory: "IBD", sampleType: "Stool", containerType: "Sterile Cup", turnaroundTime: "24 hours", price: 2800 },
  { testCode: "LAB-MIC-022", testName: "Stool for Ova & Parasites", category: "Microbiology", subCategory: "Parasitology", sampleType: "Stool", containerType: "Sterile Cup", turnaroundTime: "3 hours", price: 220 },
  { testCode: "LAB-MIC-023", testName: "Stool Reducing Substances", category: "Microbiology", subCategory: "Pediatric", sampleType: "Fresh Stool", containerType: "Sterile Cup", turnaroundTime: "2 hours", price: 200 },
  { testCode: "LAB-MIC-024", testName: "Fungal Culture & Identification", category: "Microbiology", subCategory: "Mycology", sampleType: "Scraping / Tissue", containerType: "SDA Slant", turnaroundTime: "7-14 days", price: 1200 },

  // SEROLOGY / IMMUNOLOGY (29 tests)
  { testCode: "LAB-SER-001", testName: "C-Reactive Protein (CRP Quantitative)", category: "Serology / Immunology", subCategory: "Inflammation", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 400 },
  { testCode: "LAB-SER-002", testName: "High Sensitivity CRP (hs-CRP)", category: "Serology / Immunology", subCategory: "Cardiac Risk", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 650 },
  { testCode: "LAB-SER-003", testName: "ASO Titre (Anti-Streptolysin O)", category: "Serology / Immunology", subCategory: "Infection", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 450 },
  { testCode: "LAB-SER-004", testName: "Rheumatoid Factor (RF Quantitative)", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 500 },
  { testCode: "LAB-SER-005", testName: "Anti-Cyclic Citrullinated Peptide (Anti-CCP)", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 1600 },
  { testCode: "LAB-SER-006", testName: "Antinuclear Antibodies (ANA by IFA)", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1200 },
  { testCode: "LAB-SER-007", testName: "Anti-dsDNA Antibodies", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1400 },
  { testCode: "LAB-SER-008", testName: "Complement C3", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 650 },
  { testCode: "LAB-SER-009", testName: "Complement C4", category: "Serology / Immunology", subCategory: "Autoimmune", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 650 },
  { testCode: "LAB-SER-010", testName: "Total IgE (Immunoglobulin E)", category: "Serology / Immunology", subCategory: "Allergy", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 650 },
  { testCode: "LAB-SER-011", testName: "Serum IgG", category: "Serology / Immunology", subCategory: "Immunology", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 700 },
  { testCode: "LAB-SER-012", testName: "Serum IgA", category: "Serology / Immunology", subCategory: "Immunology", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 700 },
  { testCode: "LAB-SER-013", testName: "Serum IgM", category: "Serology / Immunology", subCategory: "Immunology", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 700 },
  { testCode: "LAB-SER-014", testName: "HIV 1 & 2 4th Gen Antigen/Antibody (ELISA)", category: "Serology / Immunology", subCategory: "Infectious", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 600 },
  { testCode: "LAB-SER-015", testName: "Hepatitis B Surface Antigen (HBsAg ELISA)", category: "Serology / Immunology", subCategory: "Hepatitis", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 500 },
  { testCode: "LAB-SER-016", testName: "Anti-HBs Antibody Titre", category: "Serology / Immunology", subCategory: "Hepatitis", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 750 },
  { testCode: "LAB-SER-017", testName: "Anti-HBc Total", category: "Serology / Immunology", subCategory: "Hepatitis", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "12 hours", price: 900 },
  { testCode: "LAB-SER-018", testName: "HCV Antibody (Anti-HCV ELISA)", category: "Serology / Immunology", subCategory: "Hepatitis", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 750 },
  { testCode: "LAB-SER-019", testName: "VDRL / RPR for Syphilis", category: "Serology / Immunology", subCategory: "Infectious", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 250 },
  { testCode: "LAB-SER-020", testName: "Dengue NS1 Antigen", category: "Serology / Immunology", subCategory: "Tropical", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 750 },
  { testCode: "LAB-SER-021", testName: "Dengue IgM & IgG Antibodies", category: "Serology / Immunology", subCategory: "Tropical", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 900 },
  { testCode: "LAB-SER-022", testName: "Malaria Antigen Rapid Card (Pv & Pf)", category: "Serology / Immunology", subCategory: "Tropical", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "1 hour", price: 350 },
  { testCode: "LAB-SER-023", testName: "Widal Test (Slide / Tube Agglutination)", category: "Serology / Immunology", subCategory: "Typhoid", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "3 hours", price: 250 },
  { testCode: "LAB-SER-024", testName: "TyphiDot IgM & IgG", category: "Serology / Immunology", subCategory: "Typhoid", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "2 hours", price: 500 },
  { testCode: "LAB-SER-025", testName: "Chikungunya IgM", category: "Serology / Immunology", subCategory: "Tropical", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 800 },
  { testCode: "LAB-SER-026", testName: "COVID-19 Rapid Antigen Test", category: "Serology / Immunology", subCategory: "Viral", sampleType: "Nasopharyngeal Swab", containerType: "Viral Extraction Tube", turnaroundTime: "30 mins", price: 400 },
  { testCode: "LAB-SER-027", testName: "TORCH Panel IgG & IgM (10 Parameters)", category: "Serology / Immunology", subCategory: "Antenatal", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 2500 },
  { testCode: "LAB-SER-028", testName: "Serum Iron Profile (Iron, TIBC, Transferrin)", category: "Serology / Immunology", subCategory: "Anemia", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 900 },
  { testCode: "LAB-SER-029", testName: "Serum Ferritin", category: "Serology / Immunology", subCategory: "Anemia", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 650 },

  // MOLECULAR / PCR (21 tests)
  { testCode: "LAB-MOL-001", testName: "COVID-19 RT-PCR", category: "Molecular / PCR", subCategory: "Virology", sampleType: "Nasopharyngeal Swab", containerType: "VTM Tube", turnaroundTime: "8 hours", price: 800 },
  { testCode: "LAB-MOL-002", testName: "GeneXpert MTB / RIF (TB PCR)", category: "Molecular / PCR", subCategory: "Mycobacteria", sampleType: "Sputum / Fluid", containerType: "Sterile Cup", turnaroundTime: "6 hours", price: 2200 },
  { testCode: "LAB-MOL-003", testName: "Hepatitis B Viral Load (HBV DNA Quantitative)", category: "Molecular / PCR", subCategory: "Hepatitis", sampleType: "Plasma", containerType: "EDTA (Lavender)", turnaroundTime: "48 hours", price: 3800 },
  { testCode: "LAB-MOL-004", testName: "Hepatitis C Viral Load (HCV RNA Quantitative)", category: "Molecular / PCR", subCategory: "Hepatitis", sampleType: "Plasma", containerType: "EDTA (Lavender)", turnaroundTime: "48 hours", price: 4200 },
  { testCode: "LAB-MOL-005", testName: "HIV-1 Viral Load (RNA Quantitative)", category: "Molecular / PCR", subCategory: "Virology", sampleType: "Plasma", containerType: "EDTA (Lavender)", turnaroundTime: "48 hours", price: 4500 },
  { testCode: "LAB-MOL-006", testName: "HPV DNA High Risk Genotyping", category: "Molecular / PCR", subCategory: "Oncology", sampleType: "Cervical Swab", containerType: "ThinPrep Vial", turnaroundTime: "48 hours", price: 2800 },
  { testCode: "LAB-MOL-007", testName: "Influenza A & B RT-PCR (H1N1 / H3N2)", category: "Molecular / PCR", subCategory: "Respiratory", sampleType: "Nasopharyngeal Swab", containerType: "VTM Tube", turnaroundTime: "12 hours", price: 2500 },
  { testCode: "LAB-MOL-008", testName: "Syndromic Respiratory Multiplex PCR Panel", category: "Molecular / PCR", subCategory: "Respiratory", sampleType: "NPS Swab", containerType: "VTM Tube", turnaroundTime: "12 hours", price: 6500 },
  { testCode: "LAB-MOL-009", testName: "Gastrointestinal Pathogen PCR Panel", category: "Molecular / PCR", subCategory: "Enteric", sampleType: "Stool", containerType: "Sterile Container", turnaroundTime: "24 hours", price: 5800 },
  { testCode: "LAB-MOL-010", testName: "HLA-B27 by Real-Time PCR", category: "Molecular / PCR", subCategory: "Genetics", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "24 hours", price: 2200 },
  { testCode: "LAB-MOL-011", testName: "BRCA1 / BRCA2 Mutation Analysis", category: "Molecular / PCR", subCategory: "Oncology", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "14 days", price: 18000 },
  { testCode: "LAB-MOL-012", testName: "Thalassemia Mutation Analysis (Alpha & Beta)", category: "Molecular / PCR", subCategory: "Genetics", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "7 days", price: 5500 },
  { testCode: "LAB-MOL-013", testName: "Karyotyping (Cytogenetic Chromosome Analysis)", category: "Molecular / PCR", subCategory: "Cytogenetics", sampleType: "Heparinized Blood", containerType: "Sodium Heparin (Green)", turnaroundTime: "14 days", price: 4200 },
  { testCode: "LAB-MOL-014", testName: "FISH for Her2/neu Amplification", category: "Molecular / PCR", subCategory: "Oncology", sampleType: "FFPE Tissue Block", containerType: "Tissue Cassette", turnaroundTime: "7 days", price: 7500 },

  // HISTOPATHOLOGY & CYTOLOGY (13 tests)
  { testCode: "LAB-HIS-001", testName: "Small Biopsy Examination (1 Site)", category: "Histopathology / Cytology", subCategory: "Surgical Path", sampleType: "Tissue Biopsy", containerType: "10% Formalin Vial", turnaroundTime: "48-72 hours", price: 1500 },
  { testCode: "LAB-HIS-002", testName: "Medium Surgical Specimen Biopsy", category: "Histopathology / Cytology", subCategory: "Surgical Path", sampleType: "Tissue Specimen", containerType: "10% Formalin Container", turnaroundTime: "3-5 days", price: 2800 },
  { testCode: "LAB-HIS-003", testName: "Large Radical Resection Specimen", category: "Histopathology / Cytology", subCategory: "Surgical Path", sampleType: "Organ Resection", containerType: "10% Formalin Container", turnaroundTime: "5-7 days", price: 5500 },
  { testCode: "LAB-HIS-004", testName: "Fine Needle Aspiration Cytology (FNAC)", category: "Histopathology / Cytology", subCategory: "Cytology", sampleType: "Needle Aspirate", containerType: "Glass Slides", turnaroundTime: "24 hours", price: 900 },
  { testCode: "LAB-HIS-005", testName: "USG-Guided FNAC (Procedure + Exam)", category: "Histopathology / Cytology", subCategory: "Cytology", sampleType: "Image Guided Aspirate", containerType: "Glass Slides", turnaroundTime: "24 hours", price: 2200 },
  { testCode: "LAB-HIS-006", testName: "Cervical Pap Smear (Conventional)", category: "Histopathology / Cytology", subCategory: "Gynec", sampleType: "Cervical Scraping", containerType: "Fixative Spray Slide", turnaroundTime: "24 hours", price: 600 },
  { testCode: "LAB-HIS-007", testName: "Liquid Based Cytology (LBC Pap)", category: "Histopathology / Cytology", subCategory: "Gynec", sampleType: "Cervical Brush", containerType: "ThinPrep PreservCyt", turnaroundTime: "24 hours", price: 1400 },
  { testCode: "LAB-HIS-008", testName: "Body Fluid Cytology (Pleural / Ascitic)", category: "Histopathology / Cytology", subCategory: "Fluids", sampleType: "Body Fluid", containerType: "Heparinized Container", turnaroundTime: "24 hours", price: 850 },
  { testCode: "LAB-HIS-009", testName: "CSF Cytology & Cell Count", category: "Histopathology / Cytology", subCategory: "Fluids", sampleType: "CSF", containerType: "Sterile Tube", turnaroundTime: "4 hours", price: 750 },
  { testCode: "LAB-HIS-010", testName: "Frozen Section Intraoperative Consultation", category: "Histopathology / Cytology", subCategory: "Intraoperative", sampleType: "Fresh Tissue", containerType: "Saline Moist Gauze", turnaroundTime: "30 mins", price: 4500 },
  { testCode: "LAB-HIS-011", testName: "Immunohistochemistry (IHC) Single Marker", category: "Histopathology / Cytology", subCategory: "IHC", sampleType: "FFPE Block", containerType: "Tissue Cassette", turnaroundTime: "48 hours", price: 1800 },
  { testCode: "LAB-HIS-012", testName: "IHC Breast Cancer Panel (ER, PR, Her2, Ki-67)", category: "Histopathology / Cytology", subCategory: "IHC", sampleType: "FFPE Block", containerType: "Tissue Cassette", turnaroundTime: "72 hours", price: 6500 },
  { testCode: "LAB-HIS-013", testName: "Special Histochemical Stains (PAS, ZN, Masson)", category: "Histopathology / Cytology", subCategory: "Staining", sampleType: "FFPE Block", containerType: "Tissue Cassette", turnaroundTime: "48 hours", price: 800 },

  // BLOOD BANK & TRANSFUSION (8 tests)
  { testCode: "LAB-BLD-001", testName: "ABO Blood Group & Rh Typing", category: "Blood Bank / Transfusion", subCategory: "Immunohematology", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "1 hour", price: 150 },
  { testCode: "LAB-BLD-002", testName: "Direct Coombs Test (DCT)", category: "Blood Bank / Transfusion", subCategory: "Coombs", sampleType: "Whole Blood", containerType: "EDTA (Lavender)", turnaroundTime: "2 hours", price: 400 },
  { testCode: "LAB-BLD-003", testName: "Indirect Coombs Test (ICT)", category: "Blood Bank / Transfusion", subCategory: "Coombs", sampleType: "Serum", containerType: "Plain (Red)", turnaroundTime: "2 hours", price: 450 },
  { testCode: "LAB-BLD-004", testName: "Cross Matching (Gel Card Technique)", category: "Blood Bank / Transfusion", subCategory: "Transfusion", sampleType: "Recipient Serum + Donor Cells", containerType: "Plain + Pilot Tube", turnaroundTime: "2 hours", price: 650 },
  { testCode: "LAB-BLD-005", testName: "Antibody Screening (3-Cell Panel)", category: "Blood Bank / Transfusion", subCategory: "Transfusion", sampleType: "Serum", containerType: "Plain (Red)", turnaroundTime: "6 hours", price: 1200 },
  { testCode: "LAB-BLD-006", testName: "Antibody Identification (11-Cell Panel)", category: "Blood Bank / Transfusion", subCategory: "Transfusion", sampleType: "Serum", containerType: "Plain (Red)", turnaroundTime: "24 hours", price: 3000 },
  { testCode: "LAB-BLD-007", testName: "Blood Donor Infectious Disease Screening", category: "Blood Bank / Transfusion", subCategory: "Screening", sampleType: "Serum", containerType: "Plain (Red)", turnaroundTime: "4 hours", price: 1200 },
  { testCode: "LAB-BLD-008", testName: "Rh Antibody Titre", category: "Blood Bank / Transfusion", subCategory: "Antenatal", sampleType: "Serum", containerType: "Plain (Red)", turnaroundTime: "6 hours", price: 600 },

  // VITAMINS & NUTRITION (10 tests)
  { testCode: "LAB-VIT-001", testName: "Vitamin B12 (Cyanocobalamin)", category: "Vitamins / Nutrition", subCategory: "Micronutrients", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 800 },
  { testCode: "LAB-VIT-002", testName: "Serum Folate / Folic Acid", category: "Vitamins / Nutrition", subCategory: "Micronutrients", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "6 hours", price: 900 },
  { testCode: "LAB-VIT-003", testName: "Vitamin D 25-OH (Total)", category: "Vitamins / Nutrition", subCategory: "Micronutrients", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "4 hours", price: 1200 },
  { testCode: "LAB-VIT-004", testName: "Serum Zinc", category: "Vitamins / Nutrition", subCategory: "Trace Elements", sampleType: "Trace Element Serum", containerType: "Royal Blue Tube", turnaroundTime: "48 hours", price: 1400 },
  { testCode: "LAB-VIT-005", testName: "Serum Copper", category: "Vitamins / Nutrition", subCategory: "Trace Elements", sampleType: "Trace Element Serum", containerType: "Royal Blue Tube", turnaroundTime: "48 hours", price: 1400 },
  { testCode: "LAB-VIT-006", testName: "Serum Selenium", category: "Vitamins / Nutrition", subCategory: "Trace Elements", sampleType: "Trace Element Serum", containerType: "Royal Blue Tube", turnaroundTime: "48 hours", price: 2000 },
  { testCode: "LAB-VIT-007", testName: "Serum Ceruloplasmin", category: "Vitamins / Nutrition", subCategory: "Metabolic", sampleType: "Serum", containerType: "SST (Yellow)", turnaroundTime: "24 hours", price: 1100 },
  { testCode: "LAB-VIT-008", testName: "Vitamin A (Retinol)", category: "Vitamins / Nutrition", subCategory: "Fat Soluble", sampleType: "Serum Protected from Light", containerType: "Amber SST Tube", turnaroundTime: "5 days", price: 2500 },
  { testCode: "LAB-VIT-009", testName: "Vitamin E (Tocopherol)", category: "Vitamins / Nutrition", subCategory: "Fat Soluble", sampleType: "Serum Protected from Light", containerType: "Amber SST Tube", turnaroundTime: "5 days", price: 2500 },
  { testCode: "LAB-VIT-010", testName: "Comprehensive Anemia & Vitamin Profile", category: "Vitamins / Nutrition", subCategory: "Panel", sampleType: "Serum + EDTA", containerType: "SST + Lavender", turnaroundTime: "6 hours", price: 2400 },
];

const RADIOLOGY_CATALOG = [
  // X-RAY (40 tests)
  // Chest
  { testCode: "RAD-XRAY-001", testName: "Chest X-Ray PA View", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 450, preparationInstructions: "Remove all metallic necklaces, chest jewelry, and clothing above waist." },
  { testCode: "RAD-XRAY-002", testName: "Chest X-Ray AP View (Bedside)", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-003", testName: "Chest X-Ray Lateral View", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 450 },
  { testCode: "RAD-XRAY-004", testName: "Chest X-Ray PA & Lateral Views", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 800 },
  { testCode: "RAD-XRAY-005", testName: "Chest X-Ray Apical Lordotic View", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 500 },
  { testCode: "RAD-XRAY-006", testName: "Chest X-Ray Decubitus View", category: "X-Ray", subCategory: "Chest", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  // Skull / Face
  { testCode: "RAD-XRAY-007", testName: "Skull X-Ray AP & Lateral", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 750 },
  { testCode: "RAD-XRAY-008", testName: "Paranasal Sinuses (PNS) Water's View", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 500 },
  { testCode: "RAD-XRAY-009", testName: "Nasal Bone X-Ray Lateral", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 450 },
  { testCode: "RAD-XRAY-010", testName: "Mandible X-Ray AP & Oblique", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-011", testName: "Facial Bones X-Ray Series", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 800 },
  { testCode: "RAD-XRAY-012", testName: "Orbits X-Ray (For Foreign Body)", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 550 },
  { testCode: "RAD-XRAY-013", testName: "Mastoids X-Ray (Towne's & Lateral)", category: "X-Ray", subCategory: "Skull & Face", modality: "X-Ray", turnaroundTime: "1 hour", price: 700 },
  // Spine
  { testCode: "RAD-XRAY-014", testName: "Cervical Spine X-Ray AP & Lateral", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "1 hour", price: 700 },
  { testCode: "RAD-XRAY-015", testName: "Cervical Spine Flexion & Extension Views", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "2 hours", price: 900 },
  { testCode: "RAD-XRAY-016", testName: "Thoracic (Dorsal) Spine AP & Lateral", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "1 hour", price: 750 },
  { testCode: "RAD-XRAY-017", testName: "Lumbosacral (LS) Spine AP & Lateral", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "1 hour", price: 800 },
  { testCode: "RAD-XRAY-018", testName: "LS Spine Flexion & Extension", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "2 hours", price: 1000 },
  { testCode: "RAD-XRAY-019", testName: "Sacrum & Coccyx X-Ray AP & Lateral", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-020", testName: "Whole Spine Screening X-Ray (Scoliosis)", category: "X-Ray", subCategory: "Spine", modality: "X-Ray", turnaroundTime: "2 hours", price: 1600 },
  // Upper Limb
  { testCode: "RAD-XRAY-021", testName: "Shoulder Joint X-Ray AP & Axial", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-022", testName: "Clavicle X-Ray AP", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 450 },
  { testCode: "RAD-XRAY-023", testName: "Scapula X-Ray AP & Lateral", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 550 },
  { testCode: "RAD-XRAY-024", testName: "Humerus (Arm) X-Ray AP & Lateral", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-025", testName: "Elbow Joint X-Ray AP & Lateral", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-026", testName: "Forearm X-Ray AP & Lateral", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-027", testName: "Wrist Joint X-Ray AP & Lateral", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 550 },
  { testCode: "RAD-XRAY-028", testName: "Hand X-Ray AP & Oblique", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 550 },
  { testCode: "RAD-XRAY-029", testName: "Scaphoid View Wrist X-Ray", category: "X-Ray", subCategory: "Upper Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  // Lower Limb
  { testCode: "RAD-XRAY-030", testName: "Pelvis with Both Hips AP View", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 750 },
  { testCode: "RAD-XRAY-031", testName: "Hip Joint X-Ray AP & Frog Lateral", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-032", testName: "Femur (Thigh) X-Ray AP & Lateral", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-033", testName: "Knee Joint X-Ray AP & Lateral (Standing)", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-034", testName: "Both Knees AP Standing (Scanogram)", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 1000 },
  { testCode: "RAD-XRAY-035", testName: "Patella Skyline View X-Ray", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 550 },
  { testCode: "RAD-XRAY-036", testName: "Tibia & Fibula (Leg) AP & Lateral", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-037", testName: "Ankle Joint X-Ray AP & Lateral", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-038", testName: "Foot X-Ray AP & Oblique", category: "X-Ray", subCategory: "Lower Limb", modality: "X-Ray", turnaroundTime: "1 hour", price: 600 },
  { testCode: "RAD-XRAY-039", testName: "Abdomen Plain X-Ray (Erect / Supine)", category: "X-Ray", subCategory: "Abdomen", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },
  { testCode: "RAD-XRAY-040", testName: "KUB Plain X-Ray (Kidneys, Ureters, Bladder)", category: "X-Ray", subCategory: "Abdomen", modality: "X-Ray", turnaroundTime: "1 hour", price: 650 },

  // CT SCAN (28 tests)
  { testCode: "RAD-CT-001", testName: "CT Brain (Head) Plain", category: "CT Scan", subCategory: "Brain & Neuro", modality: "CT Scan", turnaroundTime: "2 hours", price: 2800 },
  { testCode: "RAD-CT-002", testName: "CT Brain with Contrast", category: "CT Scan", subCategory: "Brain & Neuro", modality: "CT Scan", turnaroundTime: "3 hours", price: 4200, contrastRequired: true },
  { testCode: "RAD-CT-003", testName: "CT Angiography Brain & Neck", category: "CT Scan", subCategory: "Vascular", modality: "CT Scan", turnaroundTime: "4 hours", price: 7500, contrastRequired: true },
  { testCode: "RAD-CT-004", testName: "HRCT Chest (High Resolution CT)", category: "CT Scan", subCategory: "Chest", modality: "CT Scan", turnaroundTime: "3 hours", price: 4500 },
  { testCode: "RAD-CT-005", testName: "CT Chest with Contrast (CECT)", category: "CT Scan", subCategory: "Chest", modality: "CT Scan", turnaroundTime: "3 hours", price: 5500, contrastRequired: true },
  { testCode: "RAD-CT-006", testName: "CT Pulmonary Angiography (CTPA)", category: "CT Scan", subCategory: "Vascular", modality: "CT Scan", turnaroundTime: "3 hours", price: 8500, contrastRequired: true },
  { testCode: "RAD-CT-007", testName: "CT Whole Abdomen & Pelvis Plain", category: "CT Scan", subCategory: "Abdomen", modality: "CT Scan", turnaroundTime: "3 hours", price: 5500 },
  { testCode: "RAD-CT-008", testName: "CT Abdomen & Pelvis with Contrast (CECT)", category: "CT Scan", subCategory: "Abdomen", modality: "CT Scan", turnaroundTime: "4 hours", price: 7800, contrastRequired: true },
  { testCode: "RAD-CT-009", testName: "CT KUB Plain (Urolithiasis Protocol)", category: "CT Scan", subCategory: "Renal", modality: "CT Scan", turnaroundTime: "2 hours", price: 4500 },
  { testCode: "RAD-CT-010", testName: "CT Enterography", category: "CT Scan", subCategory: "Gastro", modality: "CT Scan", turnaroundTime: "4 hours", price: 8000, contrastRequired: true },
  { testCode: "RAD-CT-011", testName: "CT Colonography (Virtual Colonoscopy)", category: "CT Scan", subCategory: "Gastro", modality: "CT Scan", turnaroundTime: "4 hours", price: 9000 },
  { testCode: "RAD-CT-012", testName: "CT Cervical Spine 3D", category: "CT Scan", subCategory: "Spine", modality: "CT Scan", turnaroundTime: "3 hours", price: 4200 },
  { testCode: "RAD-CT-013", testName: "CT Thoracic Spine 3D", category: "CT Scan", subCategory: "Spine", modality: "CT Scan", turnaroundTime: "3 hours", price: 4200 },
  { testCode: "RAD-CT-014", testName: "CT Lumbar Spine 3D", category: "CT Scan", subCategory: "Spine", modality: "CT Scan", turnaroundTime: "3 hours", price: 4200 },
  { testCode: "RAD-CT-015", testName: "CT Coronary Angiography", category: "CT Scan", subCategory: "Cardiac", modality: "CT Scan", turnaroundTime: "4 hours", price: 12500, contrastRequired: true },
  { testCode: "RAD-CT-016", testName: "CT Renal Angiography", category: "CT Scan", subCategory: "Vascular", modality: "CT Scan", turnaroundTime: "4 hours", price: 7500, contrastRequired: true },
  { testCode: "RAD-CT-017", testName: "CT Aorta (Aortogram)", category: "CT Scan", subCategory: "Vascular", modality: "CT Scan", turnaroundTime: "4 hours", price: 9500, contrastRequired: true },
  { testCode: "RAD-CT-018", testName: "CT Peripheral Angiography Both Lower Limbs", category: "CT Scan", subCategory: "Vascular", modality: "CT Scan", turnaroundTime: "4 hours", price: 11000, contrastRequired: true },
  { testCode: "RAD-CT-019", testName: "CT Temporal Bone (HRCT)", category: "CT Scan", subCategory: "ENT", modality: "CT Scan", turnaroundTime: "3 hours", price: 4500 },
  { testCode: "RAD-CT-020", testName: "CT Paranasal Sinuses (PNS) 3D", category: "CT Scan", subCategory: "ENT", modality: "CT Scan", turnaroundTime: "3 hours", price: 3800 },
  { testCode: "RAD-CT-021", testName: "CT Facial Bones with 3D Reconstruction", category: "CT Scan", subCategory: "Facial Trauma", modality: "CT Scan", turnaroundTime: "3 hours", price: 4800 },
  { testCode: "RAD-CT-022", testName: "CT Neck Soft Tissues with Contrast", category: "CT Scan", subCategory: "Neck", modality: "CT Scan", turnaroundTime: "3 hours", price: 5500, contrastRequired: true },
  { testCode: "RAD-CT-023", testName: "CT Guided Biopsy (Lung / Liver / Bone)", category: "CT Scan", subCategory: "Interventional", modality: "CT Scan", turnaroundTime: "6 hours", price: 8500, requiresSpecialistApproval: true },
  { testCode: "RAD-CT-024", testName: "CT Guided Abscess Drainage", category: "CT Scan", subCategory: "Interventional", modality: "CT Scan", turnaroundTime: "6 hours", price: 9500, requiresSpecialistApproval: true },
  { testCode: "RAD-CT-025", testName: "CT Pelvis Plain & Contrast", category: "CT Scan", subCategory: "Pelvis", modality: "CT Scan", turnaroundTime: "3 hours", price: 5000, contrastRequired: true },
  { testCode: "RAD-CT-026", testName: "CT Shoulder / Hip / Knee 3D", category: "CT Scan", subCategory: "Musculoskeletal", modality: "CT Scan", turnaroundTime: "3 hours", price: 4500 },
  { testCode: "RAD-CT-027", testName: "CT Urogram (Triple Phase)", category: "CT Scan", subCategory: "Renal", modality: "CT Scan", turnaroundTime: "4 hours", price: 8500, contrastRequired: true },
  { testCode: "RAD-CT-028", testName: "Whole Body CT Polytrauma Scan", category: "CT Scan", subCategory: "Trauma", modality: "CT Scan", turnaroundTime: "1 hour", price: 16000, contrastRequired: true },

  // MRI (27 tests)
  { testCode: "RAD-MRI-001", testName: "MRI Brain Plain", category: "MRI", subCategory: "Neuro", modality: "MRI", turnaroundTime: "3 hours", price: 6500, preparationInstructions: "Screen for cardiac pacemakers, metallic implants, claustrophobia." },
  { testCode: "RAD-MRI-002", testName: "MRI Brain with Contrast", category: "MRI", subCategory: "Neuro", modality: "MRI", turnaroundTime: "4 hours", price: 8500, contrastRequired: true },
  { testCode: "RAD-MRI-003", testName: "MRI Brain with MRA (Angiography)", category: "MRI", subCategory: "Neuro", modality: "MRI", turnaroundTime: "4 hours", price: 9500 },
  { testCode: "RAD-MRI-004", testName: "MRI Brain with MRV (Venography)", category: "MRI", subCategory: "Neuro", modality: "MRI", turnaroundTime: "4 hours", price: 9500 },
  { testCode: "RAD-MRI-005", testName: "MRI Pituitary Sella Dynamic", category: "MRI", subCategory: "Endocrine", modality: "MRI", turnaroundTime: "4 hours", price: 8000, contrastRequired: true },
  { testCode: "RAD-MRI-006", testName: "MRI Orbits Plain & Contrast", category: "MRI", subCategory: "Ophthalmic", modality: "MRI", turnaroundTime: "4 hours", price: 7500, contrastRequired: true },
  { testCode: "RAD-MRI-007", testName: "MRI Internal Auditory Meatus (CP Angle)", category: "MRI", subCategory: "ENT", modality: "MRI", turnaroundTime: "4 hours", price: 7500 },
  { testCode: "RAD-MRI-008", testName: "MRI Cervical Spine Plain", category: "MRI", subCategory: "Spine", modality: "MRI", turnaroundTime: "3 hours", price: 6500 },
  { testCode: "RAD-MRI-009", testName: "MRI Thoracic Spine Plain", category: "MRI", subCategory: "Spine", modality: "MRI", turnaroundTime: "3 hours", price: 6500 },
  { testCode: "RAD-MRI-010", testName: "MRI Lumbar Spine (LS Spine)", category: "MRI", subCategory: "Spine", modality: "MRI", turnaroundTime: "3 hours", price: 6500 },
  { testCode: "RAD-MRI-011", testName: "MRI Whole Spine Screening", category: "MRI", subCategory: "Spine", modality: "MRI", turnaroundTime: "5 hours", price: 14000 },
  { testCode: "RAD-MRI-012", testName: "MRI Sacroiliac (SI) Joints", category: "MRI", subCategory: "Spine & Rheumatology", modality: "MRI", turnaroundTime: "3 hours", price: 7000 },
  { testCode: "RAD-MRI-013", testName: "MRI Shoulder Joint", category: "MRI", subCategory: "Musculoskeletal", modality: "MRI", turnaroundTime: "3 hours", price: 7000 },
  { testCode: "RAD-MRI-014", testName: "MRI Knee Joint", category: "MRI", subCategory: "Musculoskeletal", modality: "MRI", turnaroundTime: "3 hours", price: 7000 },
  { testCode: "RAD-MRI-015", testName: "MRI Hip Joint (Bilateral)", category: "MRI", subCategory: "Musculoskeletal", modality: "MRI", turnaroundTime: "3 hours", price: 8000 },
  { testCode: "RAD-MRI-016", testName: "MRI Ankle Joint", category: "MRI", subCategory: "Musculoskeletal", modality: "MRI", turnaroundTime: "3 hours", price: 7000 },
  { testCode: "RAD-MRI-017", testName: "MRI Wrist Joint", category: "MRI", subCategory: "Musculoskeletal", modality: "MRI", turnaroundTime: "3 hours", price: 7000 },
  { testCode: "RAD-MRI-018", testName: "MRCP (Magnetic Resonance Cholangiopancreatography)", category: "MRI", subCategory: "Hepato-Biliary", modality: "MRI", turnaroundTime: "4 hours", price: 8500, fastingRequired: true },
  { testCode: "RAD-MRI-019", testName: "MRI Upper Abdomen with Contrast", category: "MRI", subCategory: "Abdomen", modality: "MRI", turnaroundTime: "4 hours", price: 9000, contrastRequired: true },
  { testCode: "RAD-MRI-020", testName: "MRI Pelvis Female (Endometriosis / Fibroid)", category: "MRI", subCategory: "Pelvis", modality: "MRI", turnaroundTime: "4 hours", price: 8000 },
  { testCode: "RAD-MRI-021", testName: "MRI Prostate (Multiparametric mpMRI)", category: "MRI", subCategory: "Urology", modality: "MRI", turnaroundTime: "4 hours", price: 9500 },
  { testCode: "RAD-MRI-022", testName: "MR Enterography", category: "MRI", subCategory: "Gastro", modality: "MRI", turnaroundTime: "5 hours", price: 9500 },
  { testCode: "RAD-MRI-023", testName: "Cardiac MRI with Viability", category: "MRI", subCategory: "Cardiac", modality: "MRI", turnaroundTime: "5 hours", price: 16000, contrastRequired: true },
  { testCode: "RAD-MRI-024", testName: "MRI Breast Bilateral with Contrast", category: "MRI", subCategory: "Breast", modality: "MRI", turnaroundTime: "4 hours", price: 11000, contrastRequired: true },
  { testCode: "RAD-MRI-025", testName: "Fetal MRI", category: "MRI", subCategory: "Obstetrics", modality: "MRI", turnaroundTime: "4 hours", price: 12000 },
  { testCode: "RAD-MRI-026", testName: "MR Neurography (Brachial / Lumbosacral Plexus)", category: "MRI", subCategory: "Neuro", modality: "MRI", turnaroundTime: "4 hours", price: 10500 },
  { testCode: "RAD-MRI-027", testName: "MRI Defecography", category: "MRI", subCategory: "Pelvic Floor", modality: "MRI", turnaroundTime: "4 hours", price: 8500 },

  // ULTRASOUND (34 tests)
  { testCode: "RAD-USG-001", testName: "USG Whole Abdomen & Pelvis", category: "Ultrasound", subCategory: "General", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1200, preparationInstructions: "Fasting for 6 hours. Full bladder required for pelvis evaluation." },
  { testCode: "RAD-USG-002", testName: "USG Upper Abdomen (Liver, Gallbladder, Spleen)", category: "Ultrasound", subCategory: "General", modality: "Ultrasound", turnaroundTime: "1 hour", price: 950, fastingRequired: true },
  { testCode: "RAD-USG-003", testName: "USG KUB (Kidney, Ureter, Bladder)", category: "Ultrasound", subCategory: "Renal", modality: "Ultrasound", turnaroundTime: "1 hour", price: 900 },
  { testCode: "RAD-USG-004", testName: "USG Pelvis (Transabdominal)", category: "Ultrasound", subCategory: "Pelvis", modality: "Ultrasound", turnaroundTime: "1 hour", price: 900 },
  { testCode: "RAD-USG-005", testName: "USG Obstetric Early Pregnancy (Dating Scan)", category: "Ultrasound", subCategory: "Obstetrics", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1200 },
  { testCode: "RAD-USG-006", testName: "USG Nuchal Translucency (NT) Scan", category: "Ultrasound", subCategory: "Obstetrics", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1800 },
  { testCode: "RAD-USG-007", testName: "USG Level II Targeted Anomaly Scan (TIFFA)", category: "Ultrasound", subCategory: "Obstetrics", modality: "Ultrasound", turnaroundTime: "1.5 hours", price: 2500 },
  { testCode: "RAD-USG-008", testName: "USG Obstetric Growth Scan with Fetal Doppler", category: "Ultrasound", subCategory: "Obstetrics", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2200 },
  { testCode: "RAD-USG-009", testName: "Transvaginal Sonography (TVS)", category: "Ultrasound", subCategory: "Gynecology", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1400 },
  { testCode: "RAD-USG-010", testName: "USG Follicular Monitoring Series (3-5 Scans)", category: "Ultrasound", subCategory: "Infertility", modality: "Ultrasound", turnaroundTime: "Daily", price: 2500 },
  { testCode: "RAD-USG-011", testName: "USG Neck & Thyroid Gland", category: "Ultrasound", subCategory: "Small Parts", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1100 },
  { testCode: "RAD-USG-012", testName: "USG Both Breasts (Sono-Mammography)", category: "Ultrasound", subCategory: "Small Parts", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1500 },
  { testCode: "RAD-USG-013", testName: "USG Scrotum & Testes with Color Doppler", category: "Ultrasound", subCategory: "Small Parts", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1400 },
  { testCode: "RAD-USG-014", testName: "Carotid & Vertebral Doppler Bilateral", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2400 },
  { testCode: "RAD-USG-015", testName: "Renal Artery Color Doppler", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2500, fastingRequired: true },
  { testCode: "RAD-USG-016", testName: "Lower Limb Arterial Color Doppler (Bilateral)", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 3000 },
  { testCode: "RAD-USG-017", testName: "Lower Limb Venous Color Doppler (for DVT)", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2800 },
  { testCode: "RAD-USG-018", testName: "Upper Limb Arterial / Venous Doppler", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2500 },
  { testCode: "RAD-USG-019", testName: "Portal Vein & Hepatic Doppler", category: "Ultrasound", subCategory: "Doppler", modality: "Ultrasound", turnaroundTime: "1 hour", price: 2200 },
  { testCode: "RAD-USG-020", testName: "USG Liver Elastography (FibroScan)", category: "Ultrasound", subCategory: "Specialized", modality: "Ultrasound", turnaroundTime: "1 hour", price: 3000, fastingRequired: true },
  { testCode: "RAD-USG-021", testName: "USG Guided FNAC (Thyroid / Lymph Node)", category: "Ultrasound", subCategory: "Interventional", modality: "Ultrasound", turnaroundTime: "2 hours", price: 2200 },
  { testCode: "RAD-USG-022", testName: "USG Guided Core Needle Biopsy", category: "Ultrasound", subCategory: "Interventional", modality: "Ultrasound", turnaroundTime: "3 hours", price: 4000 },
  { testCode: "RAD-USG-023", testName: "USG Guided Pleural / Ascitic Fluid Tap", category: "Ultrasound", subCategory: "Interventional", modality: "Ultrasound", turnaroundTime: "2 hours", price: 3000 },
  { testCode: "RAD-USG-024", testName: "Musculoskeletal USG (Shoulder / Knee / Ankle)", category: "Ultrasound", subCategory: "MSK", modality: "Ultrasound", turnaroundTime: "1 hour", price: 1800 },

  // MAMMOGRAPHY (7 tests)
  { testCode: "RAD-MAM-001", testName: "Bilateral Digital Screening Mammography", category: "Mammography", subCategory: "Screening", modality: "Mammography", turnaroundTime: "2 hours", price: 2500 },
  { testCode: "RAD-MAM-002", testName: "Diagnostic Mammography (Both Breasts)", category: "Mammography", subCategory: "Diagnostic", modality: "Mammography", turnaroundTime: "2 hours", price: 2800 },
  { testCode: "RAD-MAM-003", testName: "Digital Breast Tomosynthesis (3D Mammogram)", category: "Mammography", subCategory: "Tomosynthesis", modality: "Mammography", turnaroundTime: "2 hours", price: 4200 },
  { testCode: "RAD-MAM-004", testName: "Unilateral Diagnostic Mammogram", category: "Mammography", subCategory: "Diagnostic", modality: "Mammography", turnaroundTime: "2 hours", price: 1600 },
  { testCode: "RAD-MAM-005", testName: "Stereotactic Breast Biopsy Guidance", category: "Mammography", subCategory: "Interventional", modality: "Mammography", turnaroundTime: "4 hours", price: 6500 },
  { testCode: "RAD-MAM-006", testName: "Mammography Needle Wire Localization", category: "Mammography", subCategory: "Pre-Operative", modality: "Mammography", turnaroundTime: "3 hours", price: 4500 },
  { testCode: "RAD-MAM-007", testName: "Comprehensive Breast Screening (Mammogram + USG)", category: "Mammography", subCategory: "Package", modality: "Mammography", turnaroundTime: "2 hours", price: 3600 },

  // INTERVENTIONAL RADIOLOGY (11 tests)
  { testCode: "RAD-INT-001", testName: "Image-Guided Liver / Renal Biopsy", category: "Interventional Radiology", subCategory: "Biopsy", modality: "Interventional Radiology", turnaroundTime: "4 hours", price: 6500, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-002", testName: "CT-Guided Lung Mass Biopsy", category: "Interventional Radiology", subCategory: "Biopsy", modality: "Interventional Radiology", turnaroundTime: "4 hours", price: 8500, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-003", testName: "Percutaneous Nephrostomy (PCN)", category: "Interventional Radiology", subCategory: "Drainage", modality: "Interventional Radiology", turnaroundTime: "6 hours", price: 12000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-004", testName: "Percutaneous Transhepatic Biliary Drainage (PTBD)", category: "Interventional Radiology", subCategory: "Biliary", modality: "Interventional Radiology", turnaroundTime: "6 hours", price: 16000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-005", testName: "Diagnostic Cerebral Angiography (DSA)", category: "Interventional Radiology", subCategory: "Angiography", modality: "Interventional Radiology", turnaroundTime: "6 hours", price: 18000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-006", testName: "Peripheral Angioplasty & Stenting", category: "Interventional Radiology", subCategory: "Vascular", modality: "Interventional Radiology", turnaroundTime: "8 hours", price: 45000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-007", testName: "Uterine Artery Embolization (UAE)", category: "Interventional Radiology", subCategory: "Embolization", modality: "Interventional Radiology", turnaroundTime: "8 hours", price: 38000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-008", testName: "Bronchial Artery Embolization (BAE for Hemoptysis)", category: "Interventional Radiology", subCategory: "Embolization", modality: "Interventional Radiology", turnaroundTime: "6 hours", price: 32000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-009", testName: "Radiofrequency Ablation (RFA) of Liver Lesion", category: "Interventional Radiology", subCategory: "Ablation", modality: "Interventional Radiology", turnaroundTime: "8 hours", price: 35000, requiresSpecialistApproval: true },
  { testCode: "RAD-INT-010", testName: "PICC Line Insertion under Fluoroscopy", category: "Interventional Radiology", subCategory: "Vascular Access", modality: "Interventional Radiology", turnaroundTime: "2 hours", price: 5500 },
  { testCode: "RAD-INT-011", testName: "Chemoport Placement under Fluoroscopy", category: "Interventional Radiology", subCategory: "Vascular Access", modality: "Interventional Radiology", turnaroundTime: "3 hours", price: 14000 },
];

// Helper to create a dummy 1x1 or sample PNG/PDF on disk
const createSampleMedicalFiles = () => {
  const dummyFiles = [
    { name: "sample_chest_xray.png", title: "Chest X-Ray Digital Study" },
    { name: "sample_brain_mri.png", title: "MRI Brain Axial T2 Scans" },
    { name: "sample_abdominal_usg.png", title: "Abdominal Ultrasound Sonogram" },
    { name: "sample_blood_smear.png", title: "Peripheral Blood Smear High-Power Field" },
    { name: "sample_diagnostic_report.pdf", title: "Clinical Diagnostic Summary PDF" },
  ];

  // Minimal valid PNG buffer (1x1 transparent PNG)
  const minimalPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const fileMap = {};
  dummyFiles.forEach((f) => {
    const filePath = path.join(storageDir, f.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, minimalPng);
    }
    fileMap[f.name] = filePath;
  });

  return fileMap;
};

async function seedDiagnosticServices() {
  console.log("==================================================================");
  console.log("=== SEEDING DIAGNOSTIC SERVICES PORTAL (PATHOLOGY & RADIOLOGY) ===");
  console.log("==================================================================");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("No MONGO_URI specified!");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB Atlas for diagnostic catalog population");

  // -------------------------------------------------------------
  // 1. SEED DIAGNOSTIC STAFF USERS
  // -------------------------------------------------------------
  const diagnosticStaff = [
    {
      name: "Dr. Diagnostic Administrator",
      email: "diagnostics@hospital.com",
      password: "diagnostic123",
      role: "diagnostic_admin",
      designation: "Head of Diagnostic Services",
      department: "Diagnostic Services",
      contactNumber: "+91 98450 11221",
    },
    {
      name: "Dr. Arvind Pathologist",
      email: "pathologist@hospital.com",
      password: "pathologist123",
      role: "pathologist",
      designation: "Senior Consultant Pathologist",
      department: "Pathology",
      contactNumber: "+91 98450 11222",
    },
    {
      name: "Dr. Meera Radiologist",
      email: "radiologist@hospital.com",
      password: "radiologist123",
      role: "radiologist",
      designation: "Chief Clinical Radiologist",
      department: "Radiology",
      contactNumber: "+91 98450 11223",
    },
    {
      name: "Suresh Senior Lab Technician",
      email: "labtech@hospital.com",
      password: "labtech123",
      role: "lab_technician",
      designation: "Senior Medical Laboratory Technician",
      department: "Pathology",
      contactNumber: "+91 98450 11224",
    },
    {
      name: "Ramesh Radiology Technician",
      email: "radtech@hospital.com",
      password: "radtech123",
      role: "radiology_technician",
      designation: "Senior Radiologic Technologist",
      department: "Radiology",
      contactNumber: "+91 98450 11225",
    },
  ];

  for (const staff of diagnosticStaff) {
    const existing = await User.findOne({ email: staff.email });
    if (!existing) {
      await User.create(staff);
      console.log(`✓ Seeded diagnostic staff user: ${staff.name} (${staff.email})`);
    } else {
      existing.role = staff.role;
      existing.designation = staff.designation;
      existing.department = staff.department;
      await existing.save();
    }
  }

  // -------------------------------------------------------------
  // 2. SEED CENTRAL TEST CATALOG
  // -------------------------------------------------------------
  console.log("\nPopulating Centralized Diagnostic Test Catalog...");

  const allCatalogTests = [
    ...PATHOLOGY_CATALOG.map((t) => ({ ...t, department: "Pathology", modality: t.modality || "Laboratory" })),
    ...RADIOLOGY_CATALOG.map((t) => ({ ...t, department: "Radiology", sampleType: "None (Imaging)", containerType: "N/A", requiresSample: false })),
  ];

  let testsInserted = 0;
  let testsUpdated = 0;

  for (const item of allCatalogTests) {
    const existing = await DiagnosticTest.findOne({ testCode: item.testCode });
    if (!existing) {
      await DiagnosticTest.create(item);
      testsInserted++;
    } else {
      Object.assign(existing, item);
      await existing.save();
      testsUpdated++;
    }
  }

  const totalCatalogCount = await DiagnosticTest.countDocuments();
  const pathCount = await DiagnosticTest.countDocuments({ department: "Pathology" });
  const radCount = await DiagnosticTest.countDocuments({ department: "Radiology" });

  console.log(`✓ Diagnostic Test Catalog successfully populated!`);
  console.log(`  - Total Tests: ${totalCatalogCount}`);
  console.log(`  - Pathology Tests: ${pathCount}`);
  console.log(`  - Radiology Tests: ${radCount}`);

  // -------------------------------------------------------------
  // 3. SEED BIOMEDICAL & DIAGNOSTIC EQUIPMENT
  // -------------------------------------------------------------
  const diagnosticEquipment = [
    {
      name: "Siemens Magnetom Vida 3.0T MRI",
      equipmentId: "EQ-RAD-MRI-01",
      category: "X-Ray / Imaging",
      department: "Radiology",
      modelNumber: "Vida 3T Supercon",
      status: "operational",
      location: "Radiology Wing - MRI Suite 1",
      lastServiceDate: new Date(Date.now() - 30 * 86400000),
      nextServiceDate: new Date(Date.now() + 60 * 86400000),
    },
    {
      name: "GE Revolution 128-Slice CT Scanner",
      equipmentId: "EQ-RAD-CT-01",
      category: "X-Ray / Imaging",
      department: "Radiology",
      modelNumber: "Revolution EVO",
      status: "operational",
      location: "Radiology Wing - CT Suite 2",
      lastServiceDate: new Date(Date.now() - 15 * 86400000),
      nextServiceDate: new Date(Date.now() + 75 * 86400000),
    },
    {
      name: "Philips DigitalDiagnost C90 High-Throughput X-Ray",
      equipmentId: "EQ-RAD-XRAY-01",
      category: "X-Ray / Imaging",
      department: "Radiology",
      modelNumber: "DigitalDiagnost C90",
      status: "operational",
      location: "OPD Diagnostic Suite 3",
      lastServiceDate: new Date(Date.now() - 40 * 86400000),
      nextServiceDate: new Date(Date.now() + 50 * 86400000),
    },
    {
      name: "GE Voluson E10 4D Ultrasound System",
      equipmentId: "EQ-RAD-USG-01",
      category: "X-Ray / Imaging",
      department: "Radiology",
      modelNumber: "Voluson E10 HDLive",
      status: "operational",
      location: "USG Room 104",
      lastServiceDate: new Date(Date.now() - 10 * 86400000),
      nextServiceDate: new Date(Date.now() + 80 * 86400000),
    },
    {
      name: "Sysmex XN-1000 Automated Hematology Analyzer",
      equipmentId: "EQ-LAB-HEM-01",
      category: "Other",
      department: "Pathology",
      modelNumber: "XN-1000",
      status: "operational",
      location: "Central Pathology Lab - Hematology",
      lastServiceDate: new Date(Date.now() - 7 * 86400000),
      nextServiceDate: new Date(Date.now() + 83 * 86400000),
    },
    {
      name: "Roche Cobas 6000 Clinical Biochemistry Analyzer",
      equipmentId: "EQ-LAB-BIO-01",
      category: "Other",
      department: "Pathology",
      modelNumber: "Cobas c501",
      status: "operational",
      location: "Central Pathology Lab - Biochemistry",
      lastServiceDate: new Date(Date.now() - 12 * 86400000),
      nextServiceDate: new Date(Date.now() + 78 * 86400000),
    },
  ];

  for (const eq of diagnosticEquipment) {
    const existing = await Equipment.findOne({ equipmentId: eq.equipmentId });
    if (!existing) {
      await Equipment.create(eq);
    }
  }
  console.log(`✓ Seeded ${diagnosticEquipment.length} diagnostic equipment units`);

  // -------------------------------------------------------------
  // 4. SEED DIAGNOSTIC INVENTORY & CONSUMABLES
  // -------------------------------------------------------------
  const diagnosticSupplies = [
    {
      name: "BD Vacutainer K2 EDTA 4ml Purple Top (Box of 100)",
      itemCode: "INV-DIAG-001",
      category: "Consumables",
      quantity: 450,
      minThreshold: 100,
      unitPrice: 12,
      unit: "Tubes",
      expiryDate: new Date(Date.now() + 365 * 86400000),
      supplier: "BD India Medical Supplies",
    },
    {
      name: "BD Vacutainer SST Gel & Clot Activator Yellow Top 5ml",
      itemCode: "INV-DIAG-002",
      category: "Consumables",
      quantity: 520,
      minThreshold: 100,
      unitPrice: 15,
      unit: "Tubes",
      expiryDate: new Date(Date.now() + 365 * 86400000),
      supplier: "BD India Medical Supplies",
    },
    {
      name: "Sysmex Cellpack DCL Diluent 20L",
      itemCode: "INV-DIAG-003",
      category: "Diagnostic Reagents",
      quantity: 18,
      minThreshold: 5,
      unitPrice: 3200,
      unit: "Units",
      expiryDate: new Date(Date.now() + 240 * 86400000),
      supplier: "Sysmex India Pvt Ltd",
    },
    {
      name: "Roche Cobas Creatinine Jaffe Reagent Pack",
      itemCode: "INV-DIAG-004",
      category: "Diagnostic Reagents",
      quantity: 14,
      minThreshold: 4,
      unitPrice: 4800,
      unit: "Units",
      expiryDate: new Date(Date.now() + 180 * 86400000),
      supplier: "Roche Diagnostics India",
    },
    {
      name: "Omnipaque 350mg I/ml Non-Ionic Contrast 100ml",
      itemCode: "INV-DIAG-005",
      category: "Medical Supplies",
      quantity: 35,
      minThreshold: 10,
      unitPrice: 1850,
      unit: "Units",
      expiryDate: new Date(Date.now() + 300 * 86400000),
      supplier: "GE Healthcare Life Sciences",
    },
    {
      name: "Aquasonic 100 Ultrasound Transmission Gel 5L",
      itemCode: "INV-DIAG-006",
      category: "Consumables",
      quantity: 22,
      minThreshold: 6,
      unitPrice: 950,
      unit: "Units",
      expiryDate: new Date(Date.now() + 450 * 86400000),
      supplier: "Parker Laboratories",
    },
  ];

  for (const sup of diagnosticSupplies) {
    const existing = await Inventory.findOne({ itemCode: sup.itemCode });
    if (!existing) {
      await Inventory.create(sup);
    }
  }
  console.log(`✓ Seeded ${diagnosticSupplies.length} diagnostic consumable inventory items`);

  // -------------------------------------------------------------
  // 5. SEED SAMPLE MEDICAL FILES & EXTERNAL STORAGE REFS
  // -------------------------------------------------------------
  const sampleFiles = createSampleMedicalFiles();
  const patients = await Patient.find().limit(3);
  const doctors = await Doctor.find().limit(2);
  const cbcTest = await DiagnosticTest.findOne({ testCode: "LAB-HEM-001" });
  const xrayTest = await DiagnosticTest.findOne({ testCode: "RAD-XRAY-001" });
  const mriTest = await DiagnosticTest.findOne({ testCode: "RAD-MRI-001" });

  if (patients.length > 0) {
    const patient1 = patients[0]; // Rahul Sharma
    const doctor1 = doctors[0]; // Dr. Rajesh Sharma

    // Create Initial Pathology Order (CBC)
    const order1 = await DiagnosticOrder.create({
      orderNumber: "DIAG-2026-001",
      patient: patient1._id,
      patientName: patient1.name,
      patientIdStr: patient1.patientId || patient1.abhaId,
      doctor: doctor1?._id,
      doctorName: doctor1 ? `Dr. ${doctor1.name}` : "Dr. Rajesh Sharma",
      department: "Cardiology",
      test: cbcTest._id,
      testCode: cbcTest.testCode,
      testName: cbcTest.testName,
      diagnosticDepartment: "Pathology",
      category: "Hematology",
      modality: "Laboratory",
      clinicalIndication: "Pre-hypertension evaluation & baseline complete blood count",
      priority: "Routine",
      status: "Finalized",
      price: cbcTest.price,
      assignedRoom: "Central Phlebotomy",
      assignedTechnicianName: "Suresh Senior Lab Technician",
    });

    // Sample record
    const sample1 = await DiagnosticSample.create({
      sampleId: "SMP-2026-8801",
      order: order1._id,
      patient: patient1._id,
      patientName: patient1.name,
      testName: cbcTest.testName,
      sampleType: "Whole Blood",
      containerType: "EDTA (Lavender)",
      collectionLocation: "Phlebotomy Station 1",
      collectorName: "Suresh Senior Lab Technician",
      status: "Completed",
      barcodeData: `SMP-2026-8801|${patient1.name}|LAB-HEM-001`,
    });
    order1.sample = sample1._id;

    // Report record (Finalized & Digitally Signed)
    const report1 = await DiagnosticReport.create({
      reportNumber: "REP-2026-001",
      order: order1._id,
      patient: patient1._id,
      patientName: patient1.name,
      patientAge: patient1.age,
      patientGender: patient1.gender,
      patientAbhaId: patient1.abhaId,
      doctor: doctor1?._id,
      doctorName: doctor1?.name,
      test: cbcTest._id,
      testName: cbcTest.testName,
      testCode: cbcTest.testCode,
      department: "Pathology",
      category: "Hematology",
      modality: "Laboratory",
      status: "Finalized",
      technicianName: "Suresh Senior Lab Technician",
      technicianNotes: "Specimen processed without hemolyzation.",
      specialistName: "Dr. Arvind Pathologist",
      specialistReviewNotes: "Normocytic normochromic red cell picture. No atypical cells.",
      specialistApprovedAt: new Date(),
      digitalSignature: {
        signedBy: "Dr. Arvind Pathologist",
        specialistRole: "Senior Consultant Pathologist",
        licenseNumber: "MCI-48921",
        timestamp: new Date(),
        signatureHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        isVerified: true,
      },
      summaryConclusion: "Normal Complete Blood Count parameters.",
      testResults: [
        { parameter: "Hemoglobin", result: "14.6", unit: "g/dL", referenceRange: "13.0 - 17.0", status: "normal" },
        { parameter: "RBC Count", result: "4.9", unit: "million/uL", referenceRange: "4.5 - 5.9", status: "normal" },
        { parameter: "WBC Count", result: "7200", unit: "/uL", referenceRange: "4000 - 11000", status: "normal" },
        { parameter: "Platelet Count", result: "245000", unit: "/uL", referenceRange: "150000 - 450000", status: "normal" },
        { parameter: "Hematocrit (PCV)", result: "43.2", unit: "%", referenceRange: "40 - 50", status: "normal" },
      ],
    });
    order1.report = report1._id;
    await order1.save();

    // Create Initial Radiology Order (Chest X-Ray) with External File Attachment
    const order2 = await DiagnosticOrder.create({
      orderNumber: "DIAG-2026-002",
      patient: patient1._id,
      patientName: patient1.name,
      patientIdStr: patient1.patientId || patient1.abhaId,
      doctor: doctor1?._id,
      doctorName: doctor1 ? `Dr. ${doctor1.name}` : "Dr. Rajesh Sharma",
      department: "Cardiology",
      test: xrayTest._id,
      testCode: xrayTest.testCode,
      testName: xrayTest.testName,
      diagnosticDepartment: "Radiology",
      category: "X-Ray",
      modality: "X-Ray",
      clinicalIndication: "Cardiomegaly screening & chest clearance",
      priority: "Routine",
      status: "Finalized",
      price: xrayTest.price,
      assignedRoom: "Radiology Suite 3 - Digital X-Ray",
      assignedTechnicianName: "Ramesh Radiology Technician",
    });

    const fileId2 = crypto.randomUUID();
    const diagFile2 = await DiagnosticFile.create({
      fileId: fileId2,
      patient: patient1._id,
      diagnosticOrder: order2._id,
      fileName: "sample_chest_xray.png",
      originalName: "chest_xray_pa_view.png",
      mimeType: "image/png",
      fileSize: 45200,
      storageProvider: "local_object_storage",
      storagePath: sampleFiles["sample_chest_xray.png"],
      secureUrl: `/api/diagnostics/files/${fileId2}/stream`,
      uploadedByName: "Ramesh Radiology Technician",
      studyModality: "X-Ray",
    });

    const report2 = await DiagnosticReport.create({
      reportNumber: "REP-2026-002",
      order: order2._id,
      patient: patient1._id,
      patientName: patient1.name,
      patientAge: patient1.age,
      patientGender: patient1.gender,
      patientAbhaId: patient1.abhaId,
      doctor: doctor1?._id,
      doctorName: doctor1?.name,
      test: xrayTest._id,
      testName: xrayTest.testName,
      testCode: xrayTest.testCode,
      department: "Radiology",
      category: "X-Ray",
      modality: "X-Ray",
      status: "Finalized",
      technicianName: "Ramesh Radiology Technician",
      specialistName: "Dr. Meera Radiologist",
      specialistReviewNotes: "Heart size is within normal limits. Both lung fields are clear. No active pleural effusion.",
      specialistApprovedAt: new Date(),
      radiologyStudy: {
        technique: "Standard Posteroanterior (PA) digital chest radiograph in upright inspiratory apnea.",
        findings: "Trachea is midline. Cardiothoracic ratio is normal (< 0.50). Bronchovascular markings are normal. Costophrenic and cardiophrenic angles are clear. Bony thorax is intact.",
        impression: "Normal digital chest radiograph. No cardiomegaly or active parenchymal lesion.",
        recommendations: "No immediate radiological intervention required.",
        radiationDose: "0.02 mSv",
      },
      summaryConclusion: "Normal chest radiograph (PA View).",
      digitalSignature: {
        signedBy: "Dr. Meera Radiologist",
        specialistRole: "Chief Clinical Radiologist",
        licenseNumber: "MCI-71829",
        timestamp: new Date(),
        signatureHash: "b4c1a2d3e4f5890123456789abcdef0123456789abcdef0123456789abcdef01",
        isVerified: true,
      },
      fileAttachments: [
        {
          fileId: fileId2,
          originalName: "chest_xray_pa_view.png",
          mimeType: "image/png",
          fileSize: 45200,
          secureUrl: `/api/diagnostics/files/${fileId2}/stream`,
          studyModality: "X-Ray",
          uploadedAt: new Date(),
        },
      ],
    });
    order2.report = report2._id;
    await order2.save();

    // Create a Critical Alert Diagnostic Order (Troponin I STAT)
    const tropTest = await DiagnosticTest.findOne({ testCode: "LAB-BIO-044" });
    if (tropTest) {
      const order3 = await DiagnosticOrder.create({
        orderNumber: "DIAG-2026-003",
        patient: patient1._id,
        patientName: patient1.name,
        patientIdStr: patient1.patientId || patient1.abhaId,
        doctor: doctor1?._id,
        doctorName: doctor1 ? `Dr. ${doctor1.name}` : "Dr. Rajesh Sharma",
        department: "Cardiology",
        test: tropTest._id,
        testCode: tropTest.testCode,
        testName: tropTest.testName,
        diagnosticDepartment: "Pathology",
        category: "Clinical Biochemistry",
        modality: "Laboratory",
        clinicalIndication: "Acute chest discomfort - Rule out Acute Coronary Syndrome",
        priority: "STAT",
        status: "Report Pending",
        price: tropTest.price,
        assignedRoom: "Stat Lab / ICU",
        assignedTechnicianName: "Suresh Senior Lab Technician",
        isCritical: true,
        criticalDetails: {
          parameter: "Troponin I",
          detectedValue: "0.85 ng/mL",
          normalRange: "0.00 - 0.04 ng/mL",
          flaggedAt: new Date(),
          alertSentToDoctor: true,
          escalationStatus: "Open",
        },
      });

      const sample3 = await DiagnosticSample.create({
        sampleId: "SMP-2026-8803",
        order: order3._id,
        patient: patient1._id,
        patientName: patient1.name,
        testName: tropTest.testName,
        sampleType: "Serum",
        containerType: "SST (Yellow)",
        collectionLocation: "ICU Bedside",
        collectorName: "Suresh Senior Lab Technician",
        status: "Processing",
      });
      order3.sample = sample3._id;
      await order3.save();
    }
  }

  console.log("✓ Seeded realistic Diagnostic Orders, Samples, Reports, and Files");
  console.log("==================================================================");
  console.log("=== DIAGNOSTIC SERVICES PORTAL SEEDING COMPLETE (100% SUCCESS) ===");
  console.log("==================================================================");

  await mongoose.disconnect();
}

seedDiagnosticServices().catch((err) => {
  console.error("Diagnostic seeding failed:", err);
  process.exit(1);
});

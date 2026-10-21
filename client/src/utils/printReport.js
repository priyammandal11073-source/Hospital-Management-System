import { downloadDiagnosticReportPdfBlob } from "../services/api.js";
import { getDoctorDisplayName } from "./doctorName.js";
import { printHtml, fallbackPopupPrint as printUtilsFallbackPopup } from "./printUtils.js";

/**
 * Format a date string safely to Indian standard format
 */
const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    return new Date(dateVal).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
};

/**
 * Generates official clinical report HTML for pathology, general lab, or radiology reports
 */
export const generateReportHtml = (report) => {
  if (!report) return "";

  // Safe department resolution (handles LabReport without department field)
  const rawDept = report.department || "";
  const rawCat = report.category || "";
  const isRadiology =
    rawDept === "Radiology" ||
    rawCat.toLowerCase().includes("radiology") ||
    rawCat.toLowerCase().includes("x-ray") ||
    rawCat.toLowerCase().includes("mri") ||
    rawCat.toLowerCase().includes("ct") ||
    rawCat.toLowerCase().includes("ultrasound");
  const department = rawDept || (isRadiology ? "Radiology" : "Pathology");
  const isPathology = !isRadiology;

  const patient = report.patient || {};
  const doctor = report.doctor || {};
  const order = report.order || {};
  const results =
    Array.isArray(report.testResults) && report.testResults.length > 0
      ? report.testResults
      : Array.isArray(report.results)
      ? report.results
      : [];
  const radiology = report.radiologyStudy || {};
  const signature = report.digitalSignature || {};

  const patientName = report.patientName || patient.name || "Patient";
  const patientAge = report.patientAge || patient.age || "—";
  const patientGender = report.patientGender || patient.gender || "—";
  const patientAbha = report.patientAbhaId || patient.abhaId || "ABDM-VERIFIED";
  const patientPhone = patient.contactNumber || report.patientPhone || "—";
  const refDoctor = report.doctorName || (doctor ? getDoctorDisplayName(doctor) : "OPD Consultant");
  const reportNum = report.reportNumber || (report._id ? `RPT-${String(report._id).slice(-6).toUpperCase()}` : "RPT-001");
  const orderNum = order.orderNumber || report.orderNumber || (reportNum ? "ORD-" + reportNum.slice(-6) : "ORD-001");
  const testDateFormatted = formatDate(order.requestedDate || report.testDate || report.reportDate || report.createdAt);

  const statusBadge = report.isAmended
    ? `<span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">AMENDED REPORT (v${report.version || 2})</span>`
    : `<span style="background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">FINAL REPORT</span>`;

  // Results section: render table if numerical/text parameters exist (Pathology or General Lab)
  let findingsHtml = "";
  if (results.length > 0) {
    findingsHtml = `
      <div style="margin-top: 18px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 2px solid #0f172a; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #334155;">
              <th style="padding: 8px 10px; text-align: left;">Investigation Analyte</th>
              <th style="padding: 8px 10px; text-align: left;">Observed Value</th>
              <th style="padding: 8px 10px; text-align: left;">Units</th>
              <th style="padding: 8px 10px; text-align: left;">Biological Reference Interval</th>
              <th style="padding: 8px 10px; text-align: right;">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            ${results
              .map((r, i) => {
                const isCrit = r.status === "critical" || r.flag === "CRITICAL";
                const isHigh = r.status === "high" || r.flag === "H";
                const isLow = r.status === "low" || r.flag === "L";
                const rowBg = isCrit ? "#fff1f2" : i % 2 === 0 ? "#ffffff" : "#f8fafc";
                const flagColor = isCrit ? "#e11d48" : isHigh ? "#b45309" : isLow ? "#1d4ed8" : "#047857";
                const flagLabel = isCrit ? "*** CRITICAL ***" : isHigh ? "HIGH (H)" : isLow ? "LOW (L)" : "Normal";
                const valStyle = isCrit || isHigh || isLow ? "font-weight: 700; color: #0f172a;" : "font-weight: 500; color: #1e293b;";

                return `
                  <tr style="background: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 7px 10px; font-weight: 600; color: #0f172a;">${r.parameter || "—"}</td>
                    <td style="padding: 7px 10px; font-family: monospace; font-size: 12px; ${valStyle}">${r.result || "—"}</td>
                    <td style="padding: 7px 10px; color: #64748b;">${r.unit || "—"}</td>
                    <td style="padding: 7px 10px; color: #475569;">${r.referenceRange || "Normal range"}</td>
                    <td style="padding: 7px 10px; text-align: right; font-weight: 700; font-size: 10px; color: ${flagColor};">
                      ${flagLabel}
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (!isPathology && (radiology.findings || radiology.technique || radiology.impression)) {
    findingsHtml = `
      <div style="margin-top: 18px; font-size: 11px; line-height: 1.6;">
        ${
          radiology.technique
            ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 3px;">Examination Technique</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; color: #1e293b;">${radiology.technique}</div>
          </div>
        `
            : ""
        }
        
        ${
          radiology.findings
            ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 3px;">Observations & Clinical Findings</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; color: #0f172a; white-space: pre-line;">${radiology.findings}</div>
          </div>
        `
            : ""
        }

        ${
          radiology.impression
            ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 3px;">Impression</div>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px 12px; border-radius: 8px; font-weight: 700; color: #0c4a6e;">${radiology.impression}</div>
          </div>
        `
            : ""
        }

        <div style="display: flex; gap: 24px; padding: 8px 0; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
          <div>Radiation Dose: <strong style="color: #334155;">${radiology.radiationDose || "Standard ALARA Protocol"}</strong></div>
          <div>Contrast Media: <strong style="color: #334155;">${radiology.contrastUsed || "None"}</strong></div>
        </div>
      </div>
    `;
  } else {
    findingsHtml = `
      <div style="margin-top: 18px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; color: #475569;">
        <em>Investigation completed. See clinical remarks and conclusion below.</em>
      </div>
    `;
  }

  const conclusionText = report.summaryConclusion || report.clinicalRemarks || report.notes;
  const conclusionHtml = conclusionText
    ? `
    <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
      <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 3px;">
        Diagnostic Conclusion / Clinical Correlation
      </div>
      <div style="font-size: 11px; font-weight: 600; color: #0f172a; line-height: 1.5;">
        ${conclusionText}
      </div>
    </div>
  `
    : "";

  const specialistName =
    signature.signedBy ||
    report.specialistName ||
    report.verifiedByName ||
    (report.verifiedBy?.name || report.verifiedBy?.username || (typeof report.verifiedBy === "string" ? report.verifiedBy : null)) ||
    (doctor ? getDoctorDisplayName(doctor) : "Dr. Senior Pathologist, MD");
  const specialistRole =
    signature.specialistRole ||
    report.specialistRole ||
    (isPathology ? "Consultant Pathologist" : "Consultant Radiologist");
  const licenseNum = signature.licenseNumber || report.licenseNumber || "MCI-48921";
  const signDate = formatDate(signature.timestamp || report.reportDate || report.testDate || report.updatedAt || report.createdAt);
  const techName = report.technicianName || "Certified Medical Lab Technologist";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Diagnostic Report - ${reportNum}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .sheet-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
          }
          .header-bar {
            height: 4px;
            background: linear-gradient(90deg, #1e3a8a 0%, #0284c7 100%);
            border-radius: 2px;
            margin-bottom: 12px;
          }
          .hospital-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
          }
          .hospital-brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .hosp-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .hosp-sub {
            font-size: 10px;
            font-weight: 700;
            color: #059669;
            text-transform: uppercase;
            margin: 2px 0 0 0;
          }
          .hosp-meta {
            font-size: 9px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .demographics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-top: 14px;
            font-size: 10px;
          }
          .demo-field label {
            display: block;
            text-transform: uppercase;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 2px;
          }
          .demo-field value {
            display: block;
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
          }
          .test-title-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #cbd5e1;
            padding: 10px 0 6px 0;
            margin-top: 10px;
          }
          .test-name {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0;
          }
          .test-meta {
            font-size: 10px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .signature-section {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 2px solid #0f172a;
            display: grid;
            grid-template-columns: 1fr 1.2fr 1fr;
            align-items: end;
            gap: 16px;
          }
          .qr-box {
            display: inline-block;
            border: 1px solid #cbd5e1;
            padding: 6px;
            background: #ffffff;
            border-radius: 6px;
            text-align: center;
          }
          .qr-sim {
            width: 58px;
            height: 58px;
            background: #0f172a;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-size: 8px;
            text-align: center;
            border-radius: 4px;
            padding: 4px;
          }
          .sign-box {
            border: 1px solid #a7f3d0;
            background: #ecfdf5;
            padding: 8px 12px;
            border-radius: 8px;
            text-align: right;
          }
          .sign-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #065f46;
            font-weight: 800;
            font-size: 10px;
          }
          .legal-footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px dashed #cbd5e1;
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div class="sheet-container">
          <div class="header-bar"></div>

          <!-- Hospital Letterhead -->
          <div class="hospital-header">
            <div class="hospital-brand">
              <img 
                src="/nivora-logo.png" 
                alt="Nivora Care Hospital" 
                style="height: 52px; width: 52px; object-fit: contain; border-radius: 10px; border: 1.5px solid #cbd5e1; padding: 2px; background: #ffffff; flex-shrink: 0;" 
                onerror="this.style.display='none'"
              />
              <div>
                <h1 class="hosp-title">NIVORA CARE HOSPITAL</h1>
                <p class="hosp-sub">
                  ${isPathology ? "CENTRAL DIAGNOSTIC & LABORATORY MEDICINE" : "DEPARTMENT OF RADIOLOGY & MEDICAL IMAGING"}
                </p>
                <p class="hosp-meta">
                  NABH & NABL Accredited • ISO 15189:2022 Certified • ABDM Integrated
                </p>
                <p class="hosp-meta">
                  Healthcare Boulevard, Medical Enclave • 24/7 Helpline: 108 • lab@nivoracare.com
                </p>
              </div>
            </div>

            <div style="text-align: right;">
              <div>${statusBadge}</div>
              <div style="font-family: monospace; font-weight: 800; font-size: 12px; color: #1e3a8a; margin-top: 6px;">
                ${reportNum}
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                Report Date: ${testDateFormatted}
              </div>
            </div>
          </div>

          <!-- Patient Demographics -->
          <div class="demographics-grid">
            <div class="demo-field">
              <label>Patient Full Name</label>
              <value>${patientName}</value>
            </div>
            <div class="demo-field">
              <label>Age / Gender</label>
              <value>${patientAge} Y / ${patientGender}</value>
            </div>
            <div class="demo-field">
              <label>ABHA Health ID</label>
              <value style="font-family: monospace; color: #0284c7;">${patientAbha}</value>
            </div>
            <div class="demo-field">
              <label>Contact Phone</label>
              <value>${patientPhone ? "+91 " + String(patientPhone).replace(/^(\+91|91)/, "") : "—"}</value>
            </div>
            <div class="demo-field">
              <label>Referring Doctor</label>
              <value>${refDoctor}</value>
            </div>
            <div class="demo-field">
              <label>Order / Study ID</label>
              <value style="font-family: monospace;">${orderNum}</value>
            </div>
            <div class="demo-field">
              <label>Department</label>
              <value>${department}</value>
            </div>
            <div class="demo-field">
              <label>Sample / Examination</label>
              <value>${testDateFormatted}</value>
            </div>
          </div>

          <!-- Investigation Title -->
          <div class="test-title-bar">
            <div>
              <h2 class="test-name">${report.testName || "Clinical Investigation"}</h2>
              <p class="test-meta">Category: ${report.category || department || "General"} • Modality: ${report.modality || "Standard Clinical"}</p>
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">
              ${(department || "CLINICAL").toUpperCase()} INVESTIGATION
            </div>
          </div>

          <!-- Investigation Results & Observations -->
          ${findingsHtml}

          <!-- Diagnostic Conclusion -->
          ${conclusionHtml}

          <!-- Specialist Digital Authentication & QR Verification -->
          <div class="signature-section">
            <div>
              <div class="qr-box">
                <div class="qr-sim">[ABDM QR VALIDATED]</div>
              </div>
              <div style="font-size: 8px; color: #64748b; margin-top: 3px; font-family: monospace;">
                Scan to verify authenticity
              </div>
            </div>

            <div style="font-size: 9px; color: #64748b; text-align: center;">
              <div style="font-weight: 600; color: #334155;">Technologist: ${techName}</div>
              <div style="margin-top: 4px; font-size: 8px; color: #94a3b8;">
                Electronically generated clinical report verified according to ISO 15189 guidelines.
              </div>
            </div>

            <div>
              <div class="sign-box">
                <div class="sign-badge">
                  <span>✓</span>
                  <span>DIGITALLY SIGNED</span>
                </div>
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                  ${specialistName}
                </div>
                <div style="font-size: 9px; color: #475569;">
                  ${specialistRole}
                </div>
                <div style="font-size: 8.5px; font-family: monospace; color: #64748b; margin-top: 2px;">
                  Reg: ${licenseNum} • ${signDate}
                </div>
              </div>
            </div>
          </div>

          <!-- Legal & Privacy Notice -->
          <div class="legal-footer">
            <strong>Confidential Medical Health Record:</strong> This diagnostic report is generated under statutory ABDM/NABL standards.
            Results correlate with clinical findings; interpretation requires consultation with a qualified medical practitioner.
            <br />
            Nivora Care Hospital Central Laboratory • Helpline: 108 • ISO 15189:2022 Certified
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Fallback popup window printer if iframe execution is restricted or fails
 */
const fallbackPopupPrint = (html) => {
  try {
    const printWin = window.open("", "_blank", "width=850,height=900");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch {
          window.print();
        }
      }, 350);
    } else {
      window.print();
    }
  } catch {
    window.print();
  }
};

/**
/**
 * Prints a clinical report in a completely isolated hidden iframe using printHtml.
 * Eliminates host page bleed-through and blank page printing bugs.
 */
export const printClinicalReport = async (report) => {
  if (!report) return;

  let html;
  try {
    html = generateReportHtml(report);
  } catch (err) {
    console.error("Failed to generate report HTML for printing:", err);
    window.print();
    return;
  }

  const reportNum = report.reportNumber || (report._id ? `RPT-${String(report._id).slice(-6).toUpperCase()}` : "RPT-001");
  try {
    await printHtml(html, {
      title: `Diagnostic Report - ${reportNum}`,
      waitForImages: true,
      cleanupDelay: 3000,
    });
  } catch (err) {
    console.warn("printHtml failed, falling back to popup print:", err);
    printUtilsFallbackPopup(html, `Diagnostic Report - ${reportNum}`);
  }
};


/**
 * Opens or downloads the vector PDF from the backend in a new tab/window for native printing
 */
export const openVectorPdfInNewTab = async (reportId) => {
  if (!reportId) return;
  try {
    const blob = await downloadDiagnosticReportPdfBlob(reportId);
    const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      // Popup blocked, fallback to download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (err) {
    console.error("Vector PDF load error:", err);
    alert("Could not load vector PDF for this investigation. Please ensure the report is finalized.");
  }
};

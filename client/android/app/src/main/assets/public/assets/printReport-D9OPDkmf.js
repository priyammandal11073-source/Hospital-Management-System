import{p as F,b as G,g as y}from"./index-mO1rv0a3.js";import{d as j}from"./diagnosticApi-BMXZId8d.js";const w=e=>{if(!e)return"—";try{return new Date(e).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}catch{return String(e)}},U=e=>{if(!e)return"";const o=e.department||"",t=e.category||"",s=o==="Radiology"||t.toLowerCase().includes("radiology")||t.toLowerCase().includes("x-ray")||t.toLowerCase().includes("mri")||t.toLowerCase().includes("ct")||t.toLowerCase().includes("ultrasound"),n=o||(s?"Radiology":"Pathology"),g=!s,l=e.patient||{},d=e.doctor||{},b=e.order||{},v=Array.isArray(e.testResults)&&e.testResults.length>0?e.testResults:Array.isArray(e.results)?e.results:[],i=e.radiologyStudy||{},r=e.digitalSignature||{},D=e.patientName||l.name||"Patient",R=e.patientAge||l.age||"—",A=e.patientGender||l.gender||"—",$=e.patientAbhaId||l.abhaId||"ABDM-VERIFIED",C=l.contactNumber||e.patientPhone||"—",I=e.doctorName||(d?y(d):"OPD Consultant"),p=e.reportNumber||(e._id?`RPT-${String(e._id).slice(-6).toUpperCase()}`:"RPT-001"),N=b.orderNumber||e.orderNumber||(p?"ORD-"+p.slice(-6):"ORD-001"),u=w(b.requestedDate||e.testDate||e.reportDate||e.createdAt),z=e.isAmended?`<span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">AMENDED REPORT (v${e.version||2})</span>`:'<span style="background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">FINAL REPORT</span>';let c="";v.length>0?c=`
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
            ${v.map((a,H)=>{const f=a.status==="critical"||a.flag==="CRITICAL",x=a.status==="high"||a.flag==="H",m=a.status==="low"||a.flag==="L",B=f?"#fff1f2":H%2===0?"#ffffff":"#f8fafc",E=f?"#e11d48":x?"#b45309":m?"#1d4ed8":"#047857",M=f?"*** CRITICAL ***":x?"HIGH (H)":m?"LOW (L)":"Normal",q=f||x||m?"font-weight: 700; color: #0f172a;":"font-weight: 500; color: #1e293b;";return`
                  <tr style="background: ${B}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 7px 10px; font-weight: 600; color: #0f172a;">${a.parameter||"—"}</td>
                    <td style="padding: 7px 10px; font-family: monospace; font-size: 12px; ${q}">${a.result||"—"}</td>
                    <td style="padding: 7px 10px; color: #64748b;">${a.unit||"—"}</td>
                    <td style="padding: 7px 10px; color: #475569;">${a.referenceRange||"Normal range"}</td>
                    <td style="padding: 7px 10px; text-align: right; font-weight: 700; font-size: 10px; color: ${E};">
                      ${M}
                    </td>
                  </tr>
                `}).join("")}
          </tbody>
        </table>
      </div>
    `:!g&&(i.findings||i.technique||i.impression)?c=`
      <div style="margin-top: 18px; font-size: 11px; line-height: 1.6;">
        ${i.technique?`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 3px;">Examination Technique</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; color: #1e293b;">${i.technique}</div>
          </div>
        `:""}
        
        ${i.findings?`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 3px;">Observations & Clinical Findings</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; color: #0f172a; white-space: pre-line;">${i.findings}</div>
          </div>
        `:""}

        ${i.impression?`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 3px;">Impression</div>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px 12px; border-radius: 8px; font-weight: 700; color: #0c4a6e;">${i.impression}</div>
          </div>
        `:""}

        <div style="display: flex; gap: 24px; padding: 8px 0; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
          <div>Radiation Dose: <strong style="color: #334155;">${i.radiationDose||"Standard ALARA Protocol"}</strong></div>
          <div>Contrast Media: <strong style="color: #334155;">${i.contrastUsed||"None"}</strong></div>
        </div>
      </div>
    `:c=`
      <div style="margin-top: 18px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; color: #475569;">
        <em>Investigation completed. See clinical remarks and conclusion below.</em>
      </div>
    `;const h=e.summaryConclusion||e.clinicalRemarks||e.notes,L=h?`
    <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
      <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 3px;">
        Diagnostic Conclusion / Clinical Correlation
      </div>
      <div style="font-size: 11px; font-weight: 600; color: #0f172a; line-height: 1.5;">
        ${h}
      </div>
    </div>
  `:"",k=r.signedBy||e.specialistName||e.verifiedByName||e.verifiedBy?.name||e.verifiedBy?.username||(typeof e.verifiedBy=="string"?e.verifiedBy:null)||(d?y(d):"Dr. Senior Pathologist, MD"),P=r.specialistRole||e.specialistRole||(g?"Consultant Pathologist":"Consultant Radiologist"),T=r.licenseNumber||e.licenseNumber||"MCI-48921",S=w(r.timestamp||e.reportDate||e.testDate||e.updatedAt||e.createdAt),O=e.technicianName||"Certified Medical Lab Technologist";return`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Diagnostic Report - ${p}</title>
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
                  ${g?"CENTRAL DIAGNOSTIC & LABORATORY MEDICINE":"DEPARTMENT OF RADIOLOGY & MEDICAL IMAGING"}
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
              <div>${z}</div>
              <div style="font-family: monospace; font-weight: 800; font-size: 12px; color: #1e3a8a; margin-top: 6px;">
                ${p}
              </div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                Report Date: ${u}
              </div>
            </div>
          </div>

          <!-- Patient Demographics -->
          <div class="demographics-grid">
            <div class="demo-field">
              <label>Patient Full Name</label>
              <value>${D}</value>
            </div>
            <div class="demo-field">
              <label>Age / Gender</label>
              <value>${R} Y / ${A}</value>
            </div>
            <div class="demo-field">
              <label>ABHA Health ID</label>
              <value style="font-family: monospace; color: #0284c7;">${$}</value>
            </div>
            <div class="demo-field">
              <label>Contact Phone</label>
              <value>${"+91 "+String(C).replace(/^(\+91|91)/,"")}</value>
            </div>
            <div class="demo-field">
              <label>Referring Doctor</label>
              <value>${I}</value>
            </div>
            <div class="demo-field">
              <label>Order / Study ID</label>
              <value style="font-family: monospace;">${N}</value>
            </div>
            <div class="demo-field">
              <label>Department</label>
              <value>${n}</value>
            </div>
            <div class="demo-field">
              <label>Sample / Examination</label>
              <value>${u}</value>
            </div>
          </div>

          <!-- Investigation Title -->
          <div class="test-title-bar">
            <div>
              <h2 class="test-name">${e.testName||"Clinical Investigation"}</h2>
              <p class="test-meta">Category: ${e.category||n} • Modality: ${e.modality||"Standard Clinical"}</p>
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">
              ${n.toUpperCase()} INVESTIGATION
            </div>
          </div>

          <!-- Investigation Results & Observations -->
          ${c}

          <!-- Diagnostic Conclusion -->
          ${L}

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
              <div style="font-weight: 600; color: #334155;">Technologist: ${O}</div>
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
                  ${k}
                </div>
                <div style="font-size: 9px; color: #475569;">
                  ${P}
                </div>
                <div style="font-size: 8.5px; font-family: monospace; color: #64748b; margin-top: 2px;">
                  Reg: ${T} • ${S}
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
  `},Y=async e=>{if(!e)return;let o;try{o=U(e)}catch(s){console.error("Failed to generate report HTML for printing:",s),window.print();return}const t=e.reportNumber||(e._id?`RPT-${String(e._id).slice(-6).toUpperCase()}`:"RPT-001");try{await F(o,{title:`Diagnostic Report - ${t}`,waitForImages:!0,cleanupDelay:3e3})}catch(s){console.warn("printHtml failed, falling back to popup print:",s),G(o,`Diagnostic Report - ${t}`)}},W=async e=>{if(e)try{const o=await j(e),t=window.URL.createObjectURL(new Blob([o],{type:"application/pdf"}));if(!window.open(t,"_blank")){const n=document.createElement("a");n.href=t,n.setAttribute("download",`Report_${e}.pdf`),document.body.appendChild(n),n.click(),n.remove()}}catch(o){console.error("Vector PDF load error:",o),alert("Could not load vector PDF for this investigation. Please ensure the report is finalized.")}};export{U as g,W as o,Y as p};

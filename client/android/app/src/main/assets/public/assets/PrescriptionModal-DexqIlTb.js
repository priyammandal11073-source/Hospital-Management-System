import{g as d,j as e,p as z}from"./index-ChD62AMc.js";import{r as w}from"./vendor-react-B1GI0_er.js";import{s as I}from"./prescriptionApi-BTbJFKrE.js";const n=t=>t?new Date(t).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";function H({prescription:t,onClose:v}){const[j,N]=w.useState(!1),[p,h]=w.useState(null);if(!t)return null;const r=t.prescriptionNumber||"RX-RECORD",l=t.patient||{},i=t.doctor||{},s=t.vitals||{},g=t.medications||[],b=t.symptoms||[],c=t.labTestsRecommended||[],m=t.digitalSignature||{},f=l.contactNumber?String(l.contactNumber).replace(/[^0-9]/g,""):"",u=f.length===10?`91${f}`:f,$=!!(u&&u.length>=10),k=g.map((a,o)=>`${o+1}. *${a.name}* - ${a.dosage||""}, ${a.frequency} (${a.timing||""}) for ${a.duration||""}${a.instructions?` [Note: ${a.instructions}]`:""}`).join(`
`),D=`🩺 *NIVORA CARE HOSPITAL - DIGITAL PRESCRIPTION*
*Care • Trust • Healing*
*Prescription No:* ${r}
*Date:* ${n(t.createdAt)}
*Patient:* ${l.name||"Patient"} ${l.abhaId?`(ABHA: ${l.abhaId})`:""}
*Doctor:* ${d(i,"Consultant")} (${i.specialization||"General Medicine"})

*Diagnosis:* ${t.diagnosis||"General Consultation"}

*℞ Medications:*
${k||"No medications listed"}

${c.length>0?`*Advised Lab Tests:*
• ${c.join(`
• `)}
`:""}${t.advice?`*Diet & Advice:*
${t.advice}
`:""}${t.followUpDate?`*Next Follow-Up:* ${n(t.followUpDate)}
`:""}------------------------------------
*NABH Accredited | ABDM Connected*
Outer Ring Road, Near AIIMS Metro, New Delhi - 110029
Emergency: 108 / 112 | Hospital Helpline: +91 98765 43210`,A=`https://wa.me/${u}?text=${encodeURIComponent(D)}`,P=async()=>{const a=g.map((x,y)=>`
        <tr style="${y%2===0?"background:#ffffff;":"background:#f8fafc;"}">
          <td style="padding: 9px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: center; color: #64748b;">${y+1}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${x.name}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${x.dosage}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0d9488;">${x.frequency}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${x.timing}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${x.duration}</td>
          <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${x.instructions||"—"}</td>
        </tr>
      `).join(""),o=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${r}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              background: #ffffff;
              padding: 24px;
              font-size: 13px;
              line-height: 1.45;
            }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 14px; margin-bottom: 16px; }
            .hosp-title { font-size: 20px; font-weight: 900; color: #0f172a; }
            .hosp-subtitle { font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
            .hosp-contact { font-size: 11px; color: #475569; margin-top: 2px; }
            .hosp-badges { display: flex; gap: 8px; margin-top: 5px; }
            .tag { display: inline-block; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 3px; font-size: 10px; font-weight: 700; }
            .rx-meta { text-align: right; }
            .rx-num { font-size: 15px; font-weight: 900; color: #0d9488; }
            .rx-date { font-size: 11px; color: #64748b; margin-top: 2px; }
            .patient-card { display: flex; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
            .patient-col { flex: 1; }
            .col-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
            .name-highlight { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
            .info-line { font-size: 12px; color: #334155; margin-bottom: 2px; }
            .vitals-bar { display: flex; flex-wrap: wrap; gap: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; }
            .vital-item { font-size: 12px; color: #166534; }
            .vital-label { font-weight: 700; color: #15803d; }
            .diagnosis-box { margin-bottom: 16px; padding: 10px 14px; background: #f8fafc; border-left: 4px solid #0d9488; border-radius: 4px; }
            .diag-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
            .diag-text { font-size: 14px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .section-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
            .advice-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
            .footer-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; padding-top: 14px; border-top: 1px solid #cbd5e1; }
            .terms { font-size: 10px; color: #64748b; max-width: 360px; line-height: 1.4; }
            .sign-box { text-align: center; }
            .sign-line { width: 180px; border-bottom: 1px solid #475569; height: 32px; margin-bottom: 4px; }
            @page { size: A4 portrait; margin: 12mm 14mm; }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="/nivora-logo.png" alt="Nivora Care Hospital" style="height: 52px; width: 52px; object-fit: contain; border-radius: 8px;" />
              <div>
                <div class="hosp-title">NIVORA CARE HOSPITAL</div>
                <div class="hosp-subtitle">Care • Trust • Healing | Digital Clinical Prescription</div>
                <div class="hosp-contact">Outer Ring Road, Near AIIMS Metro, New Delhi - 110029 | Helpline: +91 98765 43210</div>
                <div class="hosp-badges">
                  <span class="tag">NABH Accredited</span>
                  <span class="tag">ABDM (Ayushman Bharat) Connected</span>
                </div>
              </div>
            </div>
            <div class="rx-meta">
              <div class="rx-num">${r}</div>
              <div class="rx-date">Date: <strong>${n(t.createdAt)}</strong></div>
              <div class="rx-date">Time: ${new Date(t.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
          </div>

          <div class="patient-card">
            <div class="patient-col">
              <div class="col-title">Patient Details</div>
              <div class="name-highlight">${l.name||"Patient"}</div>
              <div class="info-line">Age / Gender: <strong>${l.age||"—"} yrs / ${l.gender||"—"}</strong></div>
              <div class="info-line">Phone: <strong>${l.contactNumber||"—"}</strong></div>
              ${l.abhaId?`<div class="info-line" style="font-family:monospace; color:#0d9488; font-weight:700;">ABHA ID: ${l.abhaId}</div>`:""}
            </div>
            <div class="patient-col" style="border-left: 1px solid #e2e8f0; padding-left: 16px;">
              <div class="col-title">Consulting Physician</div>
              <div class="name-highlight">${d(i,"Consultant")}</div>
              <div class="info-line">Specialization: <strong>${i.specialization||"General Medicine"}</strong></div>
              <div class="info-line">Department: <strong>${i.department||"OPD"}</strong></div>
              <div class="info-line">Ref Code: Dr-${i._id?.toString().slice(-6).toUpperCase()||"OPD"}</div>
            </div>
          </div>

          ${s.bloodPressure||s.pulseRate||s.temperature||s.weight||s.spo2?`
            <div class="vitals-bar">
              <span style="font-weight:700; color:#15803d; margin-right:4px;">Clinical Vitals:</span>
              ${s.bloodPressure?`<span class="vital-item"><span class="vital-label">BP:</span> ${s.bloodPressure}</span>`:""}
              ${s.pulseRate?`<span class="vital-item"><span class="vital-label">Pulse:</span> ${s.pulseRate} bpm</span>`:""}
              ${s.temperature?`<span class="vital-item"><span class="vital-label">Temp:</span> ${s.temperature}</span>`:""}
              ${s.weight?`<span class="vital-item"><span class="vital-label">Weight:</span> ${s.weight}</span>`:""}
              ${s.spo2?`<span class="vital-item"><span class="vital-label">SpO2:</span> ${s.spo2}</span>`:""}
            </div>
          `:""}

          <div class="diagnosis-box">
            <div class="diag-title">Provisional Diagnosis</div>
            <div class="diag-text">${t.diagnosis}</div>
            ${b.length>0?`<div style="font-size:11px; color:#64748b; margin-top:4px;"><strong>Symptoms:</strong> ${b.join(", ")}</div>`:""}
          </div>

          <div class="section-title"><span>℞</span> Prescribed Medications</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Timing</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${a}
            </tbody>
          </table>

          ${c.length>0?`
            <div style="margin-bottom: 16px; padding: 10px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
              <div style="font-size:11px; font-weight:700; color:#0369a1; text-transform:uppercase; margin-bottom: 4px;">Advised Lab / Diagnostic Tests</div>
              <div style="font-size:12px; color:#0c4a6e; font-weight:600;">• ${c.join(" &nbsp;•&nbsp; ")}</div>
            </div>
          `:""}

          ${t.advice?`
            <div class="advice-box">
              <div style="font-size:11px; font-weight:700; color:#b45309; text-transform:uppercase; margin-bottom: 4px;">Dietary & Clinical Advice</div>
              <div style="font-size:12px; color:#78350f; white-space: pre-line;">${t.advice}</div>
            </div>
          `:""}

          ${t.followUpDate?`
            <div style="margin-bottom: 16px; padding: 8px 12px; background: #ecfdf5; border-left: 4px solid #10b981; font-size: 12px; color: #065f46; font-weight: 700;">
              📅 Next Follow-up Consultation: ${n(t.followUpDate)}
            </div>
          `:""}

          <div class="footer-flex">
            <div class="terms">
              <strong>Official Digital Prescription</strong><br />
              This digital prescription is generated on the Nivora Care Hospital Clinical System in compliance with National Digital Health Mission (ABDM) guidelines. Valid across registered retail pharmacies in India.
            </div>
            <div class="sign-box">
              <div style="font-family: monospace; font-size: 12px; color: #0d9488; font-weight: 700;">/s/ ${d(i,"Physician")}</div>
              <div class="sign-line"></div>
              <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${m.signedByName||d(i,"Physician")}</div>
              <div style="font-size: 10px; color: #64748b;">${m.designation||i.specialization||"Consultant Physician"}</div>
              <div style="font-size: 9px; color: #94a3b8;">Digitally signed & verified</div>
            </div>
          </div>
        </body>
      </html>
    `;await z(o,{title:`Prescription - ${r}`,waitForImages:!0,cleanupDelay:3e3})},C=async()=>{N(!0),h(null);try{const a=await I(t._id);h({type:"success",message:a.message||"Prescription sent to patient's email!",previewUrl:a.previewUrl})}catch(a){h({type:"error",message:a.response?.data?.message||"Failed to send prescription email"})}finally{N(!1)}};return e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4 overflow-y-auto animate-backdrop-fade",children:e.jsxs("div",{className:"relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-pop-in",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-white",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-lg border border-teal-200",children:"℞"}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900",children:"Digital clinical prescription"}),e.jsx("span",{className:"font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold",children:r})]}),e.jsxs("p",{className:"text-xs font-medium text-slate-600",children:["Official prescription issued for ",l.name||"Patient"," • ",n(t.createdAt)]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[$?e.jsxs("a",{href:A,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs",title:"Send prescription via WhatsApp",children:[e.jsx("svg",{className:"w-4 h-4 fill-current",viewBox:"0 0 24 24",children:e.jsx("path",{d:"M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"})}),e.jsx("span",{children:"WhatsApp"})]}):null,l.email?e.jsxs("button",{type:"button",onClick:C,disabled:j,className:"inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50 shadow-2xs",children:[j?e.jsx("span",{className:"inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-r-transparent"}):e.jsx("svg",{className:"w-4 h-4 text-teal-700",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})}),e.jsx("span",{children:"Email Rx"})]}):null,e.jsxs("button",{type:"button",onClick:P,className:"inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})}),e.jsx("span",{children:"Print A4"})]}),e.jsx("button",{type:"button",onClick:v,className:"p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors","aria-label":"Close",children:e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M6 18L18 6M6 6l12 12"})})})]})]}),p&&e.jsxs("div",{className:`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${p.type==="success"?"bg-emerald-50 text-emerald-900 border-b border-emerald-200":"bg-rose-50 text-rose-900 border-b border-rose-200"}`,children:[e.jsx("span",{children:p.message}),p.previewUrl&&e.jsx("a",{href:p.previewUrl,target:"_blank",rel:"noreferrer",className:"underline font-black ml-2 hover:opacity-80",children:"View test email"})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100",children:e.jsxs("div",{className:"max-w-3xl mx-auto bg-white rounded-xl border border-slate-300 p-6 md:p-8 shadow-md",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-teal-600",children:[e.jsxs("div",{className:"flex items-center gap-3.5",children:[e.jsx("img",{src:"/nivora-logo.png",alt:"Nivora Care Hospital",className:"h-14 w-14 object-contain rounded-xl shadow-xs"}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-xl font-black tracking-tight text-slate-900",children:"NIVORA CARE HOSPITAL"}),e.jsx("p",{className:"text-xs font-bold uppercase tracking-wider text-teal-700 mt-0.5",children:"Care • Trust • Healing | Digital Clinical Prescription"}),e.jsx("p",{className:"text-xs text-slate-600 mt-0.5",children:"Outer Ring Road, Near AIIMS Metro, New Delhi - 110029"}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mt-2",children:[e.jsx("span",{className:"inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200",children:"NABH Accredited (NABH-2023-0412)"}),e.jsx("span",{className:"inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200",children:"ABDM Connected"})]})]})]}),e.jsxs("div",{className:"sm:text-right",children:[e.jsx("span",{className:"inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded bg-teal-100 text-teal-900 border border-teal-200",children:r}),e.jsxs("p",{className:"text-xs text-slate-600 mt-1.5",children:["Date: ",e.jsx("span",{className:"font-bold text-slate-900",children:n(t.createdAt)})]}),e.jsx("p",{className:"text-[11px] font-semibold text-slate-500 mt-0.5",children:"OPD Clinical Consultation"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1",children:"Patient details"}),e.jsx("p",{className:"text-base font-extrabold text-slate-900",children:l.name||"Patient"}),e.jsxs("div",{className:"text-xs text-slate-700 space-y-0.5 mt-1",children:[e.jsxs("p",{children:["Age: ",e.jsxs("span",{className:"font-bold text-slate-900",children:[l.age||"—"," yrs"]})," • Gender:"," ",e.jsx("span",{className:"font-bold text-slate-900",children:l.gender||"—"})," • Blood group:"," ",e.jsx("span",{className:"font-bold text-slate-900",children:l.bloodGroup||"—"})]}),e.jsxs("p",{className:"font-medium",children:["Contact: ",l.contactNumber||"—"]}),l.abhaId&&e.jsxs("div",{className:"flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200",children:[e.jsx("span",{className:"text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900",children:"ABHA"}),e.jsx("span",{className:"font-mono text-xs font-bold text-emerald-800",children:l.abhaId})]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1",children:"Consulting physician"}),e.jsx("p",{className:"text-base font-extrabold text-slate-900",children:d(i,"Consultant")}),e.jsxs("div",{className:"text-xs text-slate-700 space-y-0.5 mt-1",children:[e.jsxs("p",{children:["Specialization: ",e.jsx("span",{className:"font-bold text-slate-900",children:i.specialization||"General Medicine"})]}),e.jsxs("p",{children:["Department: ",e.jsx("span",{className:"font-bold text-slate-900",children:i.department||"OPD"})]}),e.jsxs("p",{className:"text-slate-600 font-medium",children:["Registration Ref: Dr-",i._id?.toString().slice(-6).toUpperCase()||"OPD"]})]})]})]}),(s.bloodPressure||s.pulseRate||s.temperature||s.weight||s.spo2)&&e.jsxs("div",{className:"mb-6 p-3.5 rounded-xl bg-teal-50 border border-teal-200",children:[e.jsx("div",{className:"flex items-center gap-2 mb-2",children:e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider text-teal-900",children:"Recorded clinical vitals"})}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs",children:[s.bloodPressure&&e.jsxs("div",{className:"bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 block",children:"BP"}),e.jsx("span",{className:"font-extrabold text-slate-900",children:s.bloodPressure})]}),s.pulseRate&&e.jsxs("div",{className:"bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 block",children:"Pulse"}),e.jsx("span",{className:"font-extrabold text-slate-900",children:s.pulseRate})]}),s.temperature&&e.jsxs("div",{className:"bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 block",children:"Temperature"}),e.jsx("span",{className:"font-extrabold text-slate-900",children:s.temperature})]}),s.weight&&e.jsxs("div",{className:"bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 block",children:"Weight"}),e.jsx("span",{className:"font-extrabold text-slate-900",children:s.weight})]}),s.spo2&&e.jsxs("div",{className:"bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 block",children:"SpO2"}),e.jsx("span",{className:"font-extrabold text-slate-900",children:s.spo2})]})]})]}),e.jsxs("div",{className:"mb-6 p-4 rounded-xl bg-slate-50 border-l-4 border-teal-600",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-wider text-slate-500",children:"Provisional diagnosis"}),e.jsx("p",{className:"text-base font-extrabold text-slate-900 mt-0.5",children:t.diagnosis}),b.length>0&&e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 mt-2",children:[e.jsx("span",{className:"text-xs font-semibold text-slate-600",children:"Symptoms:"}),b.map((a,o)=>e.jsx("span",{className:"text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold",children:a},o))]})]}),e.jsxs("div",{className:"mb-6",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx("span",{className:"text-xl font-black text-teal-700",children:"℞"}),e.jsx("h2",{className:"text-sm font-extrabold uppercase tracking-wider text-slate-900",children:"Prescribed medications"})]}),e.jsx("div",{className:"overflow-x-auto rounded-xl border border-slate-300",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-100 text-slate-800 font-bold uppercase text-[11px] border-b border-slate-300",children:e.jsxs("tr",{children:[e.jsx("th",{className:"py-2.5 px-3 text-center w-8",children:"#"}),e.jsx("th",{className:"py-2.5 px-3",children:"Medicine name"}),e.jsx("th",{className:"py-2.5 px-3",children:"Dosage"}),e.jsx("th",{className:"py-2.5 px-3",children:"Frequency"}),e.jsx("th",{className:"py-2.5 px-3",children:"Timing"}),e.jsx("th",{className:"py-2.5 px-3",children:"Duration"}),e.jsx("th",{className:"py-2.5 px-3",children:"Instructions"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-200",children:g.map((a,o)=>e.jsxs("tr",{className:o%2===0?"bg-white":"bg-slate-50",children:[e.jsx("td",{className:"py-3 px-3 text-center font-bold text-slate-500",children:o+1}),e.jsx("td",{className:"py-3 px-3 font-extrabold text-slate-900",children:a.name}),e.jsx("td",{className:"py-3 px-3 text-slate-800 font-semibold",children:a.dosage}),e.jsx("td",{className:"py-3 px-3 font-black text-teal-800",children:a.frequency}),e.jsx("td",{className:"py-3 px-3 text-slate-700 font-medium",children:a.timing}),e.jsx("td",{className:"py-3 px-3 text-slate-700 font-medium",children:a.duration}),e.jsx("td",{className:"py-3 px-3 text-slate-600 font-medium italic",children:a.instructions||"—"})]},o))})]})})]}),c.length>0&&e.jsxs("div",{className:"mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-wider text-sky-900 mb-2",children:"Advised diagnostic & pathology tests"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:c.map((a,o)=>e.jsxs("span",{className:"text-xs px-3 py-1 rounded-md bg-white font-bold text-sky-900 border border-sky-300 shadow-2xs",children:["✓ ",a]},o))})]}),t.advice&&e.jsxs("div",{className:"mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200",children:[e.jsx("p",{className:"text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1",children:"Clinical advice & dietary guidelines"}),e.jsx("p",{className:"text-xs text-amber-950 font-medium leading-relaxed whitespace-pre-line",children:t.advice})]}),t.followUpDate&&e.jsxs("div",{className:"flex items-center gap-2 mb-6 p-3 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200",children:[e.jsx("svg",{className:"w-4 h-4 text-emerald-700 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),e.jsxs("span",{children:["Recommended next follow-up consultation: ",n(t.followUpDate)]})]}),e.jsxs("div",{className:"pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6",children:[e.jsxs("div",{className:"text-[11px] text-slate-600 max-w-sm space-y-1",children:[e.jsx("p",{className:"font-bold text-slate-800",children:"Official digital prescription"}),e.jsx("p",{children:"Issued in accordance with ABDM standards. Valid across licensed medical pharmacies in India."}),e.jsx("p",{className:"font-medium",children:"Hospital 24/7 emergency: 108 / 112 • Helpline: +91 98765 43210"})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-mono text-xs font-bold text-teal-700 mb-1",children:["/s/ ",d(i,"Physician")]}),e.jsx("div",{className:"w-48 border-b-2 border-slate-400 mb-1.5 ml-auto"}),e.jsx("p",{className:"text-xs font-bold text-slate-900",children:m.signedByName||d(i,"Consultant")}),e.jsx("p",{className:"text-[11px] text-slate-600 font-medium",children:m.designation||i.specialization||"Consultant Physician"}),e.jsxs("p",{className:"text-[10px] text-slate-500 font-semibold",children:["Digitally signed on ",n(m.signedAt||t.createdAt)]})]})]})]})}),e.jsx("div",{className:"flex justify-end px-6 py-3 border-t border-slate-200 bg-slate-50",children:e.jsx("button",{type:"button",onClick:v,className:"px-4 py-2 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-200 transition-colors",children:"Close"})})]})})}export{H as P};

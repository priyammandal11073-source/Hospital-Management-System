import{j as e,g as j,p as H}from"./index-GDv1L6eJ.js";import{r as g}from"./vendor-react-B1GI0_er.js";import{f as E}from"./billingApi-DHSJKAtS.js";import{U as M,g as R}from"./UpiPaymentBox-Dx9wGHK7.js";const n=p=>p?new Date(p).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";function O({billing:p,onClose:w,onBillingUpdate:b,isPatient:A=!1}){const[f,v]=g.useState(!1),[d,x]=g.useState(null),[u,S]=g.useState(p);if(!u)return null;const t=u,l=`INV-${t._id?.toString().slice(-6).toUpperCase()}`,c=(t.totalAmount||0).toFixed(2),a=t.patient||{},i=t.appointment||{},r=i.doctor||{},h=a.contactNumber?String(a.contactNumber).replace(/[^0-9]/g,""):"",m=h.length===10?`91${h}`:h,I=!!(m&&m.length>=10),$=(t.itemizedCharges||[]).map((s,o)=>`${o+1}. ${s.description}: ₹${Number(s.cost||0).toFixed(2)}`).join(`
`),P=`🏥 *NIVORA CARE HOSPITAL - TAX INVOICE*
*Care • Trust • Healing*
*Invoice No:* ${l}
*Date:* ${n(t.createdAt)}
*Patient:* ${a.name||"Patient"} ${a.abhaId?`(ABHA: ${a.abhaId})`:""}
*Status:* ${t.paymentStatus?.toUpperCase()}${t.paymentMethod?` (${t.paymentMethod.toUpperCase()})`:""}

*Itemized Charges:*
${$}

*Total Amount:* ₹${c}
------------------------------------
*NABH Accredited | GSTIN: 07AAAAA0000A1Z5*
Outer Ring Road, Near AIIMS Metro, New Delhi - 110029
Emergency: 108 / 112 | Billing Desk: +91 98765 43210`,C=`https://wa.me/${m}?text=${encodeURIComponent(P)}`,k=s=>{S(s),b&&b(s)},z=async()=>{let s="";t.paymentStatus!=="paid"&&(s=await R(t));const o=t.paymentStatus==="paid"&&t.upiTransactionId?`<div style="margin-top: 20px; padding: 14px 18px; border: 2px solid #166534; border-radius: 8px; background: #f0fdf4;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #166534; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 18px; font-weight: bold;">✓</span>
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase;">Paid via UPI — Verified</div>
                <div style="font-size: 11px; color: #334155; margin-top: 2px;">UTR / Ref: <strong style="font-family: monospace;">${t.upiTransactionId}</strong></div>
                ${t.paymentDate?`<div style="font-size: 10px; color: #64748b; margin-top: 1px;">Payment date: ${n(t.paymentDate)}</div>`:""}
              </div>
            </div>
          </div>`:t.paymentStatus!=="paid"&&s?`<div style="margin-top: 20px; padding: 16px; border: 2px solid #0d9488; border-radius: 8px; background: #f0fdfa; display: flex; align-items: center; gap: 20px;">
            <div style="text-align: center; flex-shrink: 0;">
              <img src="${s}" alt="UPI QR Code" style="width: 140px; height: 140px; border: 2px solid #1e293b; border-radius: 8px; padding: 4px; background: #fff;" />
              <div style="font-size: 10px; font-weight: 700; color: #475569; margin-top: 4px;">Scan & Pay ₹${c}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a;">Pay via UPI — Scan QR Code</div>
              <div style="font-size: 11px; color: #334155; margin-top: 4px;">UPI ID: <strong style="font-family: monospace;">nivoracare@icici</strong></div>
              <div style="font-size: 11px; color: #334155;">Payee: <strong>Nivora Care Hospital</strong></div>
              <div style="font-size: 11px; color: #334155;">Amount: <strong style="color: #0d9488;">₹${c}</strong></div>
              <div style="font-size: 11px; color: #334155;">Ref: <strong>${l}</strong></div>
              <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Scan with Google Pay, PhonePe, Paytm, BHIM, Cred, or any UPI app.</div>
            </div>
          </div>`:"",T=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${l}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body {
              font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              background: #ffffff;
              padding: 24px;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
            .hosp-title { font-size: 20px; font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 6px; }
            .hosp-subtitle { font-size: 11px; font-weight: 600; color: #0d9488; margin-top: 2px; }
            .hosp-contact { font-size: 11px; color: #475569; margin-top: 2px; }
            .hosp-badges { display: flex; gap: 8px; margin-top: 6px; }
            .tag { display: inline-block; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 3px; font-size: 10px; font-weight: 700; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.2px; }
            .badge-paid { background-color: #dcfce7; color: #166534; }
            .badge-pending { background-color: #fee2e2; color: #991b1b; }
            .badge-partially_paid { background-color: #fef3c7; color: #92400e; }
            .inv-meta { text-align: right; }
            .inv-num { font-size: 14px; font-weight: bold; margin-top: 6px; }
            .inv-date { font-size: 11px; color: #64748b; }
            .details-grid { display: flex; gap: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; }
            .details-col { flex: 1; }
            .col-title { font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
            .name-highlight { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
            .info-line { font-size: 12px; color: #334155; margin-bottom: 2px; }
            .info-label { font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #475569; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row td { font-weight: 900; font-size: 16px; border-top: 2px solid #0f172a; padding: 12px 10px; color: #2563eb; }
            .footer-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1; }
            .terms { font-size: 11px; color: #64748b; max-width: 380px; }
            .sign-box { text-align: center; }
            .sign-line { width: 180px; border-bottom: 1px solid #475569; height: 35px; margin-bottom: 4px; }
            @page { size: A4 portrait; margin: 12mm 15mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: #ffffff; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img src="/nivora-logo.png" alt="Nivora Care Hospital" style="height: 56px; width: 56px; object-fit: contain; border-radius: 8px;" />
              <div>
                <div class="hosp-title">NIVORA CARE HOSPITAL</div>
                <div class="hosp-subtitle">Care • Trust • Healing | Multi-Specialty Healthcare</div>
                <div class="hosp-contact">Outer Ring Road, Near AIIMS Metro, New Delhi - 110029, India</div>
                <div class="hosp-contact">Phone: +91 98765 43210 • Emergency: 108 / 112 • Email: billing@nivoracare.com</div>
                <div class="hosp-badges">
                  <span class="tag">NABH ACCREDITED (NABH-2023-0412)</span>
                  <span class="tag">GSTIN: 07AAAAA0000A1Z5</span>
                  <span class="tag">REG: DL-HOSP-2024-8891</span>
                </div>
              </div>
            </div>
            <div class="inv-meta">
              <span class="badge ${t.paymentStatus==="paid"?"badge-paid":t.paymentStatus==="partially_paid"?"badge-partially_paid":"badge-pending"}">
                ${t.paymentStatus==="paid"?"PAID INVOICE":"PAYMENT PENDING"}
              </span>
              <div class="inv-num">Tax Invoice #${l}</div>
              <div class="inv-date">Date: ${n(t.createdAt)}</div>
              ${t.paymentDate?`<div class="inv-date">Paid on: ${n(t.paymentDate)} (${t.paymentMethod?.toUpperCase()||"CASH"})</div>`:""}
            </div>
          </div>

          <div class="details-grid">
            <div class="details-col">
              <div class="col-title">Billed to (Patient Details)</div>
              <div class="name-highlight">${a.name||"—"}</div>
              ${a.abhaId?`<div class="info-line"><span class="info-label">ABHA ID:</span> <strong style="color:#0284c7;">${a.abhaId}</strong></div>`:""}
              <div class="info-line"><span class="info-label">Age / Gender:</span> ${a.age?`${a.age} yrs`:"—"} / ${a.gender||"—"}</div>
              <div class="info-line"><span class="info-label">Phone:</span> +91 ${a.contactNumber?String(a.contactNumber).replace(/^(\+91|91)/,""):"—"}</div>
              <div class="info-line"><span class="info-label">Email:</span> ${a.email||"—"}</div>
              ${a.address?`<div class="info-line"><span class="info-label">Address:</span> ${a.address}</div>`:""}
            </div>
            <div class="details-col">
              <div class="col-title">Consultation Details</div>
              <div class="name-highlight">${j(r,"Assigned Physician")}</div>
              <div class="info-line"><span class="info-label">Specialization:</span> ${r.specialization||"General"} (${r.department||"Medicine"})</div>
              <div class="info-line"><span class="info-label">Appointment Date:</span> ${n(i.appointmentDate)} ${i.timeSlot?`at ${i.timeSlot}`:""}</div>
              ${i.reasonForVisit?`<div class="info-line"><span class="info-label">Reason for visit:</span> ${i.reasonForVisit}</div>`:""}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">#</th>
                <th>Description / Procedure (SAC / HSN Code: 999312)</th>
                <th style="width: 140px;" class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${(t.itemizedCharges||[]).map((y,N)=>`
                <tr style="${N%2===0?"background:#fff;":"background:#f8fafc;"}">
                  <td class="text-center" style="color: #64748b;">${N+1}</td>
                  <td style="font-weight: 500;">${y.description}</td>
                  <td class="text-right" style="font-family: monospace; font-size: 13px;">₹${Number(y.cost||0).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2" class="text-right" style="color: #0f172a;">Total Amount Payable:</td>
                <td class="text-right" style="font-family: monospace;">₹${c}</td>
              </tr>
            </tfoot>
          </table>

          ${o}

          <div class="footer-flex">
            <div class="terms">
              <strong>Statutory Compliance & Payment Notes:</strong><br />
              • GST Exemption on Healthcare Services under Notification No. 12/2017-Central Tax (Rate).<br />
              • Accepted payment modes: UPI (BHIM, PhonePe, GPay, Paytm), RuPay / Cards, Net Banking, PM-JAY / CGHS / TPA Insurance, and Cash.<br />
              • This is an official computer-generated tax invoice issued by Nivora Care Hospital.
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div style="font-size: 11px; font-weight: bold; color: #334155;">Authorized Signatory</div>
              <div style="font-size: 10px; color: #64748b;">Accounts & Billing Department</div>
            </div>
          </div>
        </body>
      </html>
    `;await H(T,{title:`Tax Invoice - ${l}`})},D=async()=>{if(!a.email){x({type:"error",message:"This patient does not have an email address registered."});return}v(!0),x(null);try{const s=await E(t._id);x({type:"success",message:s.message||`Invoice emailed to ${a.email}!`,previewUrl:s.previewUrl})}catch(s){x({type:"error",message:s.response?.data?.message||"Failed to send invoice email."})}finally{v(!1)}};return e.jsx("div",{"aria-modal":"true",className:"fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto",role:"dialog",children:e.jsxs("div",{className:"relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl border border-slate-200/80 animate-pop-in",children:[e.jsxs("header",{className:"no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-6 py-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm",children:"📄"}),e.jsxs("h2",{className:"text-lg font-bold text-slate-800",children:["Medical Invoice #",l]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("button",{onClick:z,type:"button",className:"inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all active:scale-95 cursor-pointer",title:"Print or Save as PDF",children:[e.jsx("svg",{className:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"})}),"Print / PDF"]}),e.jsxs("button",{onClick:D,disabled:f||!a.email,type:"button",className:"inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition",title:a.email?`Send invoice to ${a.email}`:"No email registered",children:[e.jsx("svg",{className:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})}),f?"Sending...":"Send Email"]}),I?e.jsxs("a",{href:C,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition",title:`Send invoice via WhatsApp to +${m}`,children:[e.jsx("span",{className:"text-sm",children:"💬"}),"WhatsApp"]}):e.jsxs("button",{disabled:!0,type:"button",className:"inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed",title:"WhatsApp unavailable (no contact number)",children:[e.jsx("span",{children:"💬"})," WhatsApp (N/A)"]}),e.jsx("button",{onClick:w,type:"button",className:"rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition","aria-label":"Close modal",children:e.jsx("svg",{className:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M6 18L18 6M6 6l12 12"})})})]})]}),d&&e.jsxs("div",{className:`no-print mx-6 mt-4 rounded-lg p-3 text-xs flex items-center justify-between ${d.type==="success"?"bg-emerald-50 text-emerald-800 border border-emerald-200":"bg-red-50 text-red-800 border border-red-200"}`,children:[e.jsx("span",{children:d.message}),d.previewUrl&&e.jsx("a",{href:d.previewUrl,target:"_blank",rel:"noopener noreferrer",className:"ml-2 font-bold underline hover:text-emerald-950",children:"View Sent Email (Preview)"})]}),e.jsxs("div",{id:"printable-invoice",className:"p-8 text-slate-800",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-800 pb-6",children:[e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("img",{src:"/nivora-logo.png",alt:"Nivora Care Hospital",className:"h-14 w-14 rounded-xl border border-slate-200 bg-white p-1 object-contain shadow-xs flex-shrink-0"}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-black tracking-tight text-slate-900",children:"Nivora Care Hospital"}),e.jsx("p",{className:"mt-0.5 text-xs font-semibold text-teal-700 uppercase tracking-wide",children:"Care • trust • healing"}),e.jsx("p",{className:"mt-1 text-xs text-slate-600",children:"Outer Ring Road, Near AIIMS Metro, New Delhi - 110029, India"}),e.jsx("p",{className:"text-xs text-slate-600",children:"Phone: +91 98765 43210 • Emergency: 108 / 112 • Email: billing@nivoracare.com"}),e.jsxs("div",{className:"mt-2 flex flex-wrap gap-2",children:[e.jsx("span",{className:"rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800",children:"NABH ACCREDITED (NABH-2023-0412)"}),e.jsx("span",{className:"rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700",children:"GSTIN: 07AAAAA0000A1Z5"}),e.jsx("span",{className:"rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800",children:"ABDM CONNECTED"})]})]})]}),e.jsxs("div",{className:"mt-4 sm:mt-0 sm:text-right",children:[e.jsx("span",{className:`inline-block rounded-md px-3 py-1 text-xs font-bold ${t.paymentStatus==="paid"?"bg-emerald-100 text-emerald-800":t.paymentStatus==="partially_paid"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"}`,children:t.paymentStatus==="paid"?"Paid invoice":"Payment pending"}),e.jsxs("p",{className:"mt-3 text-sm font-bold text-slate-800",children:["Tax invoice: #",l]}),e.jsxs("p",{className:"text-xs text-slate-500",children:["Date: ",n(t.createdAt)]}),t.paymentDate&&e.jsxs("p",{className:"text-xs text-slate-500",children:["Paid on: ",n(t.paymentDate)," (",t.paymentMethod?.toUpperCase()||"CASH",")"]})]})]}),e.jsxs("div",{className:"mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-lg bg-slate-50 p-4 border border-slate-200",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-xs font-semibold text-slate-500 uppercase tracking-wider",children:"Billed to (patient details)"}),e.jsx("p",{className:"mt-1 text-base font-bold text-slate-900",children:a.name||"—"}),e.jsxs("div",{className:"mt-1 text-xs space-y-0.5 text-slate-600",children:[a.abhaId&&e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"ABHA ID:"})," ",e.jsx("span",{className:"font-bold text-blue-700",children:a.abhaId})]}),e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Age / gender:"})," ",a.age?`${a.age} yrs`:"—"," / ",a.gender||"—"]}),e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Contact:"})," ","+91 ",a.contactNumber?String(a.contactNumber).replace(/^(\+91|91)/,""):"—"]}),e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Email:"})," ",a.email||"—"]}),a.address&&e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Address:"})," ",a.address]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-xs font-semibold text-slate-500 uppercase tracking-wider",children:"Consultation details"}),e.jsx("p",{className:"mt-1 text-base font-bold text-slate-900",children:j(r)}),e.jsxs("div",{className:"mt-1 text-xs space-y-0.5 text-slate-600",children:[e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Specialization:"})," ",r.specialization||"General Medicine"," (",r.department||"OPD",")"]}),e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Appointment date:"})," ",n(i.appointmentDate)," ",i.timeSlot?`at ${i.timeSlot}`:""]}),i.reasonForVisit&&e.jsxs("p",{children:[e.jsx("span",{className:"font-semibold text-slate-700",children:"Reason for visit:"})," ",i.reasonForVisit]})]})]})]}),e.jsx("div",{className:"mt-6",children:e.jsxs("table",{className:"w-full border-collapse text-left text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-slate-300 bg-slate-100 text-xs font-semibold text-slate-600",children:[e.jsx("th",{className:"py-2.5 px-3 w-12 text-center",children:"#"}),e.jsx("th",{className:"py-2.5 px-4",children:"Description / procedure (SAC: 999312)"}),e.jsx("th",{className:"py-2.5 px-4 text-right w-36",children:"Amount (₹)"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-200",children:(t.itemizedCharges||[]).map((s,o)=>e.jsxs("tr",{className:o%2===0?"bg-white":"bg-slate-50/50",children:[e.jsx("td",{className:"py-2.5 px-3 text-center text-xs text-slate-500",children:o+1}),e.jsx("td",{className:"py-2.5 px-4 font-medium text-slate-800",children:s.description}),e.jsxs("td",{className:"py-2.5 px-4 text-right font-mono text-slate-800",children:["₹",Number(s.cost||0).toFixed(2)]})]},o))}),e.jsx("tfoot",{children:e.jsxs("tr",{className:"border-t-2 border-slate-800 font-bold",children:[e.jsx("td",{colSpan:"2",className:"py-3 px-4 text-right text-base text-slate-900",children:"Total amount payable:"}),e.jsxs("td",{className:"py-3 px-4 text-right text-lg font-black text-blue-600 font-mono",children:["₹",c]})]})})]})}),t.paymentStatus!=="paid"&&e.jsxs("div",{className:"mt-6 no-print rounded-2xl border border-teal-200 bg-teal-50/30 p-5 space-y-4",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-extrabold text-slate-800 flex items-center gap-2",children:[e.jsx("span",{children:"💳 Settle Invoice Online or at Counter"}),e.jsx("span",{className:"rounded-full bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5",children:"Instant Settlement"})]}),e.jsx("p",{className:"text-xs text-slate-500 mt-0.5",children:"Scan the UPI QR code below, launch Razorpay Checkout (Cards/NetBanking), or submit Health Insurance claim"})]}),e.jsx("div",{className:"flex items-center gap-2",children:e.jsxs("a",{href:`/pay/${t._id}`,target:"_blank",rel:"noreferrer",className:"inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition",children:[e.jsx("span",{children:"🔗 Open Secure Gateway"}),e.jsx("span",{children:"↗"})]})})]}),e.jsx(M,{billing:t,onPaymentSuccess:k,isPatient:A})]}),t.paymentStatus==="paid"&&e.jsxs("div",{className:"mt-6 no-print rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center space-y-1",children:[e.jsxs("span",{className:"inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800",children:[e.jsx("span",{children:"✓"}),e.jsxs("span",{children:["INVOICE FULLY SETTLED VIA ",(t.paymentMethod||"CASH").toUpperCase()]})]}),t.upiTransactionId&&e.jsxs("p",{className:"text-[11px] font-mono text-slate-600",children:["UTR: ",e.jsx("strong",{children:t.upiTransactionId})]})]}),e.jsxs("div",{className:"mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6",children:[e.jsxs("div",{className:"text-xs text-slate-500 max-w-sm",children:[e.jsx("p",{className:"font-semibold text-slate-700",children:"Statutory compliance & payment notes:"}),e.jsxs("p",{className:"mt-1",children:["• GST exemption on clinical healthcare services under Notification No. 12/2017-Central Tax (Rate).",e.jsx("br",{}),"• Accepted payment modes: UPI (BHIM, PhonePe, GPay, Paytm), RuPay / Cards, Net Banking, PM-JAY / CGHS / TPA Insurance, and Cash."]})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"h-12 w-44 border-b border-slate-400"}),e.jsx("p",{className:"mt-1 text-xs font-semibold text-slate-600",children:"Authorized signatory"}),e.jsx("p",{className:"text-[10px] text-slate-400",children:"Accounts & Billing Department"})]})]})]})]})})}export{O as I};

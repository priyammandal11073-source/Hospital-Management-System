import { useCallback, useEffect, useMemo, useState } from "react";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";

const RadiologyWorkbench = () => {
  const { openPrintPreview } = usePrintModal();
  const [studies, setStudies] = useState([]);
  const [activeStudy, setActiveStudy] = useState(null);
  const [filters, setFilters] = useState({ modality: "", priority: "", status: "", search: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [dictation, setDictation] = useState({ listening: false, transcript: "" });

  const handlePrintWorklist = () => {
    const html = generateGeneralHospitalReportHtml({
      title: "Department of Radiology & Imaging Study Worklist",
      subtitle: "DICOM Modality Worklist (MWL) & PACS Acquisition Queue",
      metrics: [
        { label: "Total Active Studies", value: `${stats.total}`, color: "#1e3a8a" },
        { label: "STAT Emergency", value: `${stats.stat}`, color: "#dc2626" },
        { label: "Urgent Priority", value: `${stats.urgent}`, color: "#d97706" },
        { label: "In Progress / Scanning", value: `${stats.inProgress}`, color: "#0284c7" },
      ],
      tables: [
        {
          title: "Active Modality Imaging Queue",
          headers: ["Accession #", "Patient Name", "Age/Sex", "Modality", "Anatomical Region", "Priority", "Requested By"],
          rows: filtered.map(s => [
            s.accession,
            s.patient,
            `${s.age}Y / ${s.gender}`,
            s.modality,
            s.bodyPart,
            s.priority?.toUpperCase(),
            s.requestedBy,
          ]),
        },
      ],
      notes: "Official PACS radiology worklist exported from Nivora Care Hospital Diagnostic Information System. Validated against DICOM worklist servers.",
    });

    openPrintPreview({
      title: "Radiology Study Worklist",
      htmlContent: html,
      refNumber: `RAD-WL-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`,
    });
  };

  const handlePrintLabel = (study) => {
    const html = generateGeneralHospitalReportHtml({
      title: "Radiology Diagnostic Specimen & Patient ID Slip",
      subtitle: `Department of Radio-Diagnosis & Medical Imaging • Accession: ${study.accession}`,
      metrics: [
        { label: "Modality", value: study.modality, color: "#1e3a8a" },
        { label: "Body Part", value: study.bodyPart, color: "#0f766e" },
        { label: "Priority", value: study.priority?.toUpperCase(), color: study.priority === "stat" ? "#dc2626" : "#0284c7" },
        { label: "Contrast", value: study.contrast ? "WITH CONTRAST" : "NON-CONTRAST", color: "#64748b" },
      ],
      tables: [
        {
          title: "Study Acquisition & Patient Identification",
          headers: ["Parameter", "Medical Record Value"],
          rows: [
            ["Patient Full Name", study.patient],
            ["Age / Gender", `${study.age} Years / ${study.gender}`],
            ["Accession Number", study.accession],
            ["Requested Modality", `${study.modality} - ${study.bodyPart}`],
            ["Referring Consultant", study.requestedBy],
            ["Clinical Indication", study.clinicalIndication],
            ["Order Scheduled At", study.requestedAt],
          ],
        },
      ],
      notes: "Affix to patient radiology jacket or ultrasound/CT acquisition docket. Verify 2-point patient identifier prior to radiation exposure.",
    });

    openPrintPreview({
      title: `Radiology Slip - ${study.accession}`,
      htmlContent: html,
      refNumber: study.accession,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      setStudies([
        { id: "STU001", accession: "ACC-2024-001234", patient: "Rahul Sharma", age: 45, gender: "M", modality: "CT", bodyPart: "Chest", priority: "stat", status: "scheduled", requestedBy: "Dr. Patel", requestedAt: "2024-01-15 08:30", clinicalIndication: "R/O pulmonary embolism", contrast: true, radiationDose: null, images: 120, radiologist: null, reportStatus: "pending" },
        { id: "STU002", accession: "ACC-2024-001235", patient: "Priya Patel", age: 32, gender: "F", modality: "MRI", bodyPart: "Brain", priority: "urgent", status: "in_progress", requestedBy: "Dr. Singh", requestedAt: "2024-01-15 09:15", clinicalIndication: "Headache, R/O mass", contrast: true, radiationDose: null, images: 240, radiologist: "Dr. Radiologist", reportStatus: "dictating" },
        { id: "STU003", accession: "ACC-2024-001236", patient: "Amit Singh", age: 67, gender: "M", modality: "XR", bodyPart: "Chest", priority: "routine", status: "completed", requestedBy: "Dr. Kumar", requestedAt: "2024-01-15 07:00", clinicalIndication: "Cough, fever", contrast: false, radiationDose: "0.1 mSv", images: 2, radiologist: "Dr. Radiologist", reportStatus: "final" },
        { id: "STU004", accession: "ACC-2024-001237", patient: "Sunita Devi", age: 28, gender: "F", modality: "US", bodyPart: "Abdomen", priority: "routine", status: "scheduled", requestedBy: "Dr. Gupta", requestedAt: "2024-01-15 10:00", clinicalIndication: "R/O gallstones", contrast: false, radiationDose: null, images: 0, radiologist: null, reportStatus: "pending" },
        { id: "STU005", accession: "ACC-2024-001238", patient: "Vikram Mehta", age: 55, gender: "M", modality: "CT", bodyPart: "Abdomen/Pelvis", priority: "urgent", status: "scheduled", requestedBy: "Dr. Mehta", requestedAt: "2024-01-15 09:45", clinicalIndication: "Flank pain, R/O stone", contrast: true, radiationDose: null, images: 0, radiologist: null, reportStatus: "pending" },
        { id: "STU006", accession: "ACC-2024-001239", patient: "Neha Gupta", age: 41, gender: "F", modality: "MR", bodyPart: "Spine Lumbar", priority: "urgent", status: "in_progress", requestedBy: "Dr. Joshi", requestedAt: "2024-01-15 08:00", clinicalIndication: "Back pain, radiculopathy", contrast: false, radiationDose: null, images: 180, radiologist: "Dr. Radiologist", reportStatus: "preliminary" },
        { id: "STU007", accession: "ACC-2024-001240", patient: "Rajesh Kumar", age: 72, gender: "M", modality: "XR", bodyPart: "Hip Bilateral", priority: "routine", status: "completed", requestedBy: "Dr. Reddy", requestedAt: "2024-01-15 06:30", clinicalIndication: "Hip pain, R/O fracture", contrast: false, radiationDose: "0.5 mSv", images: 4, radiologist: "Dr. Radiologist", reportStatus: "final" },
      ]);
      setIsLoading(false);
    }, 200);
  }, []);

  const priorityMeta = { stat: { label: "STAT", cls: "bg-rose-500 text-white animate-pulse" }, urgent: { label: "URGENT", cls: "bg-amber-500 text-white" }, routine: { label: "Routine", cls: "bg-slate-400 text-white" } };
  const statusMeta = { scheduled: { label: "Scheduled", cls: "bg-blue-50 text-blue-700" }, in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700" }, completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" } };
  const reportMeta = { pending: { label: "Pending", cls: "bg-slate-100 text-slate-600" }, dictating: { label: "Dictating", cls: "bg-blue-50 text-blue-700" }, preliminary: { label: "Preliminary", cls: "bg-amber-50 text-amber-700" }, final: { label: "Final", cls: "bg-emerald-50 text-emerald-700" }, amended: { label: "Amended", cls: "bg-violet-50 text-violet-700" } };

  const filtered = studies.filter(s => {
    if (filters.modality && s.modality !== filters.modality) return false;
    if (filters.priority && s.priority !== filters.priority) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return s.patient.toLowerCase().includes(q) || s.accession.toLowerCase().includes(q) || s.bodyPart.toLowerCase().includes(q);
    }
    return true;
  });

  const sortOrder = { stat: 0, urgent: 1, routine: 2 };
  const sorted = [...filtered].sort((a, b) => sortOrder[a.priority] - sortOrder[b.priority]);

  const stats = useMemo(() => {
    const total = studies.length;
    const stat = studies.filter(s => s.priority === "stat").length;
    const urgent = studies.filter(s => s.priority === "urgent").length;
    const inProgress = studies.filter(s => s.status === "in_progress").length;
    const pendingReport = studies.filter(s => s.reportStatus === "pending" || s.reportStatus === "dictating").length;
    const totalDose = studies.reduce((sum, s) => {
      const dose = parseFloat(s.radiationDose?.replace(" mSv", "") || "0");
      return sum + (isNaN(dose) ? 0 : dose);
    }, 0);
    return { total, stat, urgent, inProgress, pendingReport, totalDose };
  }, [studies]);

  const [sliceIndex, setSliceIndex] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [windowPreset, setWindowPreset] = useState("Default");
  const [cinePlaying, setCinePlaying] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [reportFields, setReportFields] = useState({
    technique: "",
    findings: "",
    impression: "",
    recommendations: "Clinical correlation recommended."
  });

  useEffect(() => {
    let timer;
    if (cinePlaying && activeStudy?.images > 1) {
      timer = setInterval(() => {
        setSliceIndex((prev) => (prev >= activeStudy.images ? 1 : prev + 1));
      }, 250);
    }
    return () => clearInterval(timer);
  }, [cinePlaying, activeStudy]);

  const handleSelect = (study) => {
    setActiveStudy(study);
    setSliceIndex(1);
    setCinePlaying(false);
    setDictation({ listening: false, transcript: "" });
    setReportFields({
      technique: `Technique: ${study.modality} ${study.bodyPart} performed ${study.contrast ? "with IV contrast" : "without contrast"}.`,
      findings: study.findings || "",
      impression: study.impression || "",
      recommendations: "Clinical correlation recommended."
    });
    setFeedbackMessage(null);
  };

  const handleCycleWindowPreset = () => {
    const presets = ["Default", "Bone", "Soft Tissue", "Lung"];
    const next = presets[(presets.indexOf(windowPreset) + 1) % presets.length];
    setWindowPreset(next);
  };

  const handleCycleZoom = () => {
    const zooms = [1, 1.25, 1.5, 2];
    const next = zooms[(zooms.indexOf(zoom) + 1) % zooms.length];
    setZoom(next);
  };

  const handleSaveToReport = () => {
    if (!dictation.transcript.trim()) {
      setFeedbackMessage({ type: "info", text: "Dictation transcript is empty. Type in the box or click Start Dictation." });
      return;
    }
    setReportFields(prev => ({
      ...prev,
      findings: prev.findings ? `${prev.findings}\n${dictation.transcript.trim()}` : dictation.transcript.trim()
    }));
    setDictation(d => ({ ...d, transcript: "" }));
    setFeedbackMessage({ type: "success", text: "Dictated notes appended to report findings." });
  };

  const handleClearDictation = () => {
    setDictation(d => ({ ...d, transcript: "" }));
    setFeedbackMessage({ type: "info", text: "Dictation transcript cleared." });
  };

  const handleSavePreliminary = () => {
    if (!activeStudy) return;
    const updated = { ...activeStudy, reportStatus: "preliminary" };
    setActiveStudy(updated);
    setStudies(prev => prev.map(s => s.id === updated.id ? updated : s));
    setFeedbackMessage({ type: "success", text: `Preliminary report saved for ${updated.accession}. Status updated.` });
  };

  const handleSignFinal = () => {
    if (!activeStudy) return;
    const updated = { ...activeStudy, reportStatus: "final", radiologist: activeStudy.radiologist || "Dr. Staff Radiologist" };
    setActiveStudy(updated);
    setStudies(prev => prev.map(s => s.id === updated.id ? updated : s));
    setFeedbackMessage({ type: "success", text: `Report finalized & digitally signed for ${updated.accession}. Dispatched to EHR.` });
  };

  const startDictation = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDictation(d => ({...d, transcript: d.transcript + transcript }));
    };
    recognition.onend = () => { setDictation(d => ({...d, listening: false})); };
    recognition.start();
    setDictation(d => ({...d, listening: true }));
  };

  const exportWorklist = () => {
    const csv = [
      ["Accession", "Patient", "Age", "Gender", "Modality", "Body Part", "Priority", "Status", "Requested By", "Requested At", "Clinical Indication", "Radiologist", "Report Status"].join(","),
      ...sorted.map(s => [s.accession, s.patient, s.age, s.gender, s.modality, s.bodyPart, s.priority, s.status, s.requestedBy, s.requestedAt, s.clinicalIndication, s.radiologist || "", s.reportStatus].map(v => `"${v}"`).join(","))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "radiology-worklist.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading radiology workbench...</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Radiology Workbench</h1>
          <p className="text-sm text-slate-600">Study worklist, PACS viewer, dictation, dose tracking, report management.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportWorklist} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">📥 Export CSV</button>
          <ActionMenu triggerLabel="Actions" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
            items={[
              { label: "Auto-assign Radiologist", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
              { label: "Print Worklist", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>, onClick: handlePrintWorklist },
            ]} align="right" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Studies", value: stats.total, icon: "📋", cls: "bg-slate-50 text-slate-700" },
          { label: "STAT", value: stats.stat, icon: "🚨", cls: "bg-rose-50 text-rose-700" },
          { label: "Urgent", value: stats.urgent, icon: "⚡", cls: "bg-amber-50 text-amber-700" },
          { label: "In Progress", value: stats.inProgress, icon: "🔄", cls: "bg-blue-50 text-blue-700" },
          { label: "Pending Report", value: stats.pendingReport, icon: "📝", cls: "bg-violet-50 text-violet-700" },
          { label: "Total Dose", value: `${stats.totalDose.toFixed(1)} mSv`, icon: "☢️", cls: "bg-orange-50 text-orange-700" },
        ].map((stat, i) => (
          <div key={i} className={`rounded-xl p-4 border ${stat.cls} border-current/20`}>
            <p className="text-2xl">{stat.icon}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <select value={filters.modality} onChange={e => setFilters(f => ({...f, modality: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-[140px]">
          <option value="">All Modalities</option>
          <option value="CT">CT</option>
          <option value="MRI">MRI</option>
          <option value="XR">X-Ray</option>
          <option value="US">Ultrasound</option>
          <option value="MR">MR</option>
          <option value="NM">Nuclear Medicine</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters(f => ({...f, priority: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-[140px]">
          <option value="">All Priorities</option>
          <option value="stat">STAT</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-[140px]">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <input placeholder="Search patient, accession, body part..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Worklist */}
        <div className="lg:col-span-2 space-y-3">
          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 font-semibold text-slate-700">No studies match filters</p>
            </div>
          ) : (
            sorted.map(study => (
              <div key={study.id} className={`rounded-xl border p-4 transition cursor-pointer ${activeStudy?.id === study.id ? "ring-2 ring-teal-500 bg-teal-50/30" : "hover:bg-slate-50/50"} ${study.priority === "stat" ? "border-rose-200 bg-rose-50/30" : study.priority === "urgent" ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`} onClick={() => handleSelect(study)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityMeta[study.priority].cls}`}>{priorityMeta[study.priority].label}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta[study.status].cls}`}>{statusMeta[study.status].label}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${reportMeta[study.reportStatus].cls}`}>{reportMeta[study.reportStatus].label}</span>
                      {study.contrast && <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-[10px] font-bold">Contrast</span>}
                    </div>
                    <p className="mt-1 font-bold text-slate-900">{study.patient}</p>
                    <p className="text-xs text-slate-500">{study.age}y {study.gender} · {study.modality} {study.bodyPart} · {getDoctorDisplayName({ name: study.requestedBy })}</p>
                    <p className="text-[11px] text-slate-400">{study.accession} · {study.requestedAt}</p>
                    <p className="text-[11px] text-slate-500 truncate">Indication: {study.clinicalIndication}</p>
                  </div>
                  <ActionMenu
                    triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                    items={[
                      { label: "Open in Viewer", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, primary: true, onClick: () => handleSelect(study) },
                      { label: "Assign Radiologist", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
                      { label: "Start Dictation", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h10m-4-4V5" /></svg>, disabled: study.status !== "in_progress" && study.status !== "completed", onClick: () => { handleSelect(study); startDictation(); } },
                      { label: "View Report", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, disabled: study.reportStatus === "pending" },
                      { divider: true },
                      { label: "Print Label", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>, onClick: () => handlePrintLabel(study) },
                    ]} align="right" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail / Dictation / PACS Panel */}
        <div className="lg:col-span-1 space-y-4">
          {!activeStudy ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center h-full">
              <p className="text-4xl">🖥️</p>
              <p className="mt-2 font-semibold text-slate-700">Select a study</p>
              <p className="text-sm text-slate-500">Viewer, dictation & dose details appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Study Header */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{activeStudy.patient}</p>
                    <p className="text-xs text-slate-500">{activeStudy.age}y {activeStudy.gender} · {activeStudy.accession}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityMeta[activeStudy.priority].cls}`}>{priorityMeta[activeStudy.priority].label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div><span className="text-slate-400">Modality:</span> {activeStudy.modality}</div>
                  <div><span className="text-slate-400">Body Part:</span> {activeStudy.bodyPart}</div>
                  <div><span className="text-slate-400">Status:</span> <span className="font-medium">{activeStudy.status}</span></div>
                  <div><span className="text-slate-400">Report:</span> <span className="font-medium">{activeStudy.reportStatus}</span></div>
                  <div><span className="text-slate-400">Dose:</span> <span className="font-medium font-mono">{activeStudy.radiationDose || "—"}</span></div>
                  <div><span className="text-slate-400">Images:</span> <span className="font-medium">{activeStudy.images}</span></div>
                  <div className="col-span-2"><span className="text-slate-400">Radiologist:</span> <span className="font-medium">{activeStudy.radiologist || "Unassigned"}</span></div>
                </div>
              </div>

              {/* Notification Feedback Banner */}
              {feedbackMessage && (
                <div
                  role="status"
                  className={`rounded-xl p-3 text-xs font-semibold flex items-center justify-between transition ${
                    feedbackMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : feedbackMessage.type === "error"
                      ? "bg-rose-50 border border-rose-200 text-rose-800"
                      : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {feedbackMessage.type === "success" ? "✓" : "ℹ"} {feedbackMessage.text}
                  </span>
                  <button
                    onClick={() => setFeedbackMessage(null)}
                    className="text-slate-400 hover:text-slate-700 ml-2 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* PACS DICOM Image Viewer */}
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 relative overflow-hidden text-slate-100 shadow-inner">
                {/* Viewer Top Toolbar */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-300">
                      DICOM 3.0 • {activeStudy.modality}
                    </span>
                    {cinePlaying && (
                      <span className="rounded bg-rose-900/80 border border-rose-600 px-1.5 py-0.2 text-[9px] font-mono text-rose-200 animate-pulse">
                        ▶ CINE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCycleWindowPreset}
                      title="Cycle Window / Level Presets"
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-mono text-slate-200 hover:bg-slate-700 transition"
                    >
                      WL: {windowPreset}
                    </button>
                    <button
                      type="button"
                      onClick={handleCycleZoom}
                      title="Cycle Zoom Factor"
                      className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-mono text-slate-200 hover:bg-slate-700 transition"
                    >
                      {zoom}x
                    </button>
                    <button
                      type="button"
                      onClick={() => setCinePlaying(c => !c)}
                      title={cinePlaying ? "Stop Cine Playback" : "Start Cine Playback"}
                      className={`rounded px-2.5 py-1 text-[10px] font-mono font-semibold transition ${
                        cinePlaying
                          ? "bg-rose-600 text-white"
                          : "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                      }`}
                    >
                      {cinePlaying ? "⏸ Pause" : "▶ Cine"}
                    </button>
                  </div>
                </div>

                {/* Simulated DICOM Acquisition Viewport */}
                <div
                  className="relative rounded-lg bg-black border border-slate-900 aspect-4/3 flex items-center justify-center overflow-hidden"
                  style={{
                    filter:
                      windowPreset === "Bone"
                        ? "contrast(180%) brightness(120%)"
                        : windowPreset === "Soft Tissue"
                        ? "contrast(110%) brightness(95%)"
                        : windowPreset === "Lung"
                        ? "contrast(200%) brightness(70%)"
                        : "none",
                  }}
                >
                  {/* Subtle Scan Matrix Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

                  {/* Anatomical Orientation Tags */}
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-teal-400/80 font-bold">
                    A (Anterior)
                  </span>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-teal-400/80 font-bold">
                    P (Posterior)
                  </span>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-teal-400/80 font-bold">
                    R
                  </span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-teal-400/80 font-bold">
                    L
                  </span>

                  {/* Scaled Center Anatomical Geometry */}
                  <div
                    className="relative flex flex-col items-center justify-center transition-transform duration-150"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    <div className="relative rounded-full border-2 border-teal-500/30 p-8 bg-radial from-slate-900/90 to-black">
                      <div className="h-28 w-28 rounded-full border border-teal-400/40 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full border border-dashed border-teal-300/40 flex items-center justify-center text-3xl select-none">
                          {activeStudy.modality === "CT" ? "🫁" : activeStudy.modality === "MRI" || activeStudy.modality === "MR" ? "🧠" : "🦴"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DICOM Overlay Readout Details */}
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 leading-tight select-none">
                    <p className="text-white font-bold">{activeStudy.patient}</p>
                    <p>{activeStudy.accession}</p>
                    <p>{activeStudy.modality} • {activeStudy.bodyPart}</p>
                  </div>

                  <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-400 text-right leading-tight select-none">
                    <p>kV: 120 / mA: 240</p>
                    <p>WL: {windowPreset}</p>
                    <p>Zoom: {zoom}x</p>
                  </div>

                  <div className="absolute bottom-2 left-2 text-[9px] font-mono text-teal-400 leading-tight select-none">
                    <p className="font-semibold">
                      Slice: {sliceIndex} / {activeStudy.images || 1}
                    </p>
                    <p className="text-slate-500">Thickness: 1.25mm</p>
                  </div>

                  <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400 text-right leading-tight select-none">
                    <p>FOV: 350mm</p>
                    <p className="text-slate-500">Nivora PACS v2.4</p>
                  </div>
                </div>

                {/* Slice Navigation Controls */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSliceIndex(s => Math.max(1, s - 1))}
                    disabled={sliceIndex <= 1}
                    className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Prior Slice
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 px-2 select-none">
                    {sliceIndex} of {activeStudy.images || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliceIndex(s => Math.min(activeStudy.images || 1, s + 1))}
                    disabled={sliceIndex >= (activeStudy.images || 1)}
                    className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next Slice →
                  </button>
                </div>
              </div>

              {/* Dictation */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">🎙️ Voice Dictation</h3>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${dictation.listening ? "bg-red-50 text-red-700 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                    {dictation.listening ? "🔴 Listening" : "🎤 Ready"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dictation.listening ? () => setDictation(d => ({ ...d, listening: false })) : startDictation}
                  className={`w-full rounded-lg px-4 py-3 font-semibold transition ${
                    dictation.listening
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {dictation.listening ? "🛑 Stop Recording" : "🎙️ Start Dictation"}
                </button>
                <textarea
                  value={dictation.transcript}
                  onChange={e => setDictation(d => ({ ...d, transcript: e.target.value }))}
                  placeholder="Dictated audio appears here in real-time... (or type clinical notes manually)"
                  className="rounded-lg border border-slate-300 p-3 text-sm min-h-[90px] resize-none font-mono text-xs w-full focus:border-blue-600 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveToReport}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    ✓ Save to Report
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDictation}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>

              {/* Report Template */}
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                <h3 className="font-bold text-slate-800">📝 Report Template</h3>
                <textarea
                  placeholder="Technique: ..."
                  className="rounded-lg border border-slate-300 p-2 text-sm min-h-[40px] resize-none w-full focus:border-blue-600 focus:outline-none font-mono text-xs"
                  value={reportFields.technique}
                  onChange={e => setReportFields(r => ({ ...r, technique: e.target.value }))}
                />
                <textarea
                  placeholder="Findings: Describe organ morphology, density, lesions..."
                  className="rounded-lg border border-slate-300 p-2 text-sm min-h-[60px] resize-none w-full focus:border-blue-600 focus:outline-none font-mono text-xs"
                  value={reportFields.findings}
                  onChange={e => setReportFields(r => ({ ...r, findings: e.target.value }))}
                />
                <textarea
                  placeholder="Impression: Primary diagnostic conclusions..."
                  className="rounded-lg border border-slate-300 p-2 text-sm min-h-[50px] resize-none w-full focus:border-blue-600 focus:outline-none font-mono text-xs"
                  value={reportFields.impression}
                  onChange={e => setReportFields(r => ({ ...r, impression: e.target.value }))}
                />
                <textarea
                  placeholder="Recommendations: Clinical correlation recommended..."
                  className="rounded-lg border border-slate-300 p-2 text-sm min-h-[40px] resize-none w-full focus:border-blue-600 focus:outline-none font-mono text-xs"
                  value={reportFields.recommendations}
                  onChange={e => setReportFields(r => ({ ...r, recommendations: e.target.value }))}
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePreliminary}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    💾 Save Preliminary
                  </button>
                  <button
                    type="button"
                    onClick={handleSignFinal}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    ✓ Sign Final
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RadiologyWorkbench;
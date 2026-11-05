import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyMedicalRecords } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

const RECORD_TYPES = ["All", "Consultation", "Prescription", "Lab Report", "Clinical Note", "Admission", "Discharge"];

export default function MyMedicalRecords() {
  const { openPrintPreview } = usePrintModal();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handlePrintSelectedRecord = (rec) => {
    if (!rec) return;

    const doctorName = rec.doctor ? formatDoctorName(rec.doctor.name) : (rec.doctorName ? formatDoctorName(rec.doctorName) : "Treating Physician");
    const dept = rec.doctor?.department || rec.department || "Clinical Care";

    const rows = [];
    if (rec.diagnosis) rows.push(["Primary Diagnosis / Findings", rec.diagnosis]);
    if (rec.summary) rows.push(["Clinical Summary", rec.summary]);
    if (rec.details?.complaint) rows.push(["Chief Complaint", rec.details.complaint]);
    if (rec.details?.clinicalFindings) rows.push(["Clinical Observations", rec.details.clinicalFindings]);
    if (rec.details?.treatmentPlan) rows.push(["Prescribed Treatment Plan", rec.details.treatmentPlan]);
    if (rec.details?.dischargeSummary) rows.push(["Discharge Notes", rec.details.dischargeSummary]);

    const html = generateGeneralHospitalReportHtml({
      reportTitle: `Medical Record: ${rec.title || rec.recordType}`,
      categoryBadge: rec.recordType,
      department: dept,
      attendingPhysician: doctorName,
      patientName: "Patient Record",
      sections: [
        {
          title: "Record Metadata",
          data: [
            ["Record Type", rec.recordType],
            ["Date Recorded", new Date(rec.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
            ["Attending Physician", doctorName],
            ["Hospital Division", dept],
          ],
        },
        {
          title: "Clinical Observations & Findings",
          data: rows.length > 0 ? rows : [["Summary", rec.summary || "No specific findings logged."]],
        },
      ],
      disclaimer: "This document is a certified copy from the Nivora Care Electronic Health Record (EHR) system.",
    });

    openPrintPreview({
      title: `Medical Record - ${rec.title || rec.recordType}`,
      htmlContent: html,
      documentType: "Medical Record",
    });
  };

  useEffect(() => {
    let isCurrent = true;
    const fetchRecords = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyMedicalRecords({
          category: category !== "All" ? category : undefined,
          search: search.trim() || undefined,
        });
        if (isCurrent) setRecords(data.records || []);
      } catch (err) {
        if (isCurrent) setError(err.response?.data?.message || "Failed to load medical records");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    fetchRecords();
    return () => { isCurrent = false; };
  }, [category, search]);

  const getRecordIcon = (type) => {
    switch (type) {
      case "Consultation": return "🩺";
      case "Prescription": return "💊";
      case "Lab Report": return "🧪";
      case "Clinical Note": return "📋";
      case "Admission": return "🛏️";
      case "Discharge": return "📤";
      default: return "📄";
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "Consultation": return "bg-teal-50 text-teal-800 border-teal-200/70";
      case "Prescription": return "bg-indigo-50 text-indigo-700 border-indigo-200/70";
      case "Lab Report": return "bg-teal-50 text-teal-800 border-teal-200/70";
      case "Clinical Note": return "bg-purple-50 text-purple-700 border-purple-200/70";
      case "Admission": return "bg-amber-50 text-amber-800 border-amber-200/70";
      case "Discharge": return "bg-emerald-50 text-emerald-800 border-emerald-200/70";
      default: return "bg-slate-50 text-slate-700 border-slate-200/70";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Medical Documentation", active: true },
        ]}
        title="My Medical Records"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            EHR Verified
          </span>
        }
        subtitle="Complete longitudinal health history including consultations, clinical notes, prescriptions, and lab tests."
        actions={
          <Link
            to="/patient/timeline"
            className="inline-flex items-center gap-2 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
          >
            <span>⏳ View Healthcare Timeline →</span>
          </Link>
        }
      />

      {/* Filter Toolbar */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search records by title, doctor, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
          />
        </div>

        {/* Record Type Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {RECORD_TYPES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                category === cat
                  ? "bg-teal-700 text-white shadow-xs font-bold"
                  : "bg-white/80 text-slate-600 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table / List */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent mx-auto" />
          <p className="mt-3 text-xs font-medium text-slate-500">Compiling personal medical records...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">{error}</div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <span className="text-3xl block mb-2">📁</span>
          <h3 className="text-sm font-bold text-slate-800">No medical records match your criteria</h3>
          <p className="mt-1 text-xs text-slate-500">Your completed consultations and clinical reports will appear here automatically.</p>
        </div>
      ) : (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Record & Event</th>
                  <th className="py-3 px-4">Date Recorded</th>
                  <th className="py-3 px-4">Attending Doctor / Dept</th>
                  <th className="py-3 px-4">Clinical Summary</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getRecordIcon(r.recordType)}</span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mb-0.5 liquid-glass-pill ${getBadgeColor(r.recordType)}`}>
                            {r.recordType}
                          </span>
                          <p className="font-bold text-slate-900 text-xs">{r.title}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{r.doctor}</p>
                      <p className="text-[11px] text-teal-800">{r.department}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      <p className="truncate">{r.summary}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="px-3 py-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 text-teal-800 hover:bg-teal-50 font-semibold text-xs transition shadow-2xs"
                      >
                        View Record →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl rounded-2xl liquid-glass-card border border-slate-200/80 bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto clinical-print-sheet printable-card print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRecordIcon(selectedRecord.recordType)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border liquid-glass-pill ${getBadgeColor(selectedRecord.recordType)}`}>
                      {selectedRecord.recordType}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(selectedRecord.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedRecord.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100 transition no-print print:hidden"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">Attending Physician / Staff</span>
                  <strong className="text-slate-900 text-xs mt-0.5 block">{selectedRecord.doctor}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">Department / Service</span>
                  <strong className="text-slate-900 text-xs mt-0.5 block">{selectedRecord.department}</strong>
                </div>
              </div>

              {/* Dynamic Details Rendering */}
              {selectedRecord.recordType === "Prescription" && selectedRecord.details?.medications && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Prescribed Medications</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    {selectedRecord.details.medications.map((m, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <strong className="text-teal-800 font-bold block">{m.name}</strong>
                          <span className="text-[11px] text-slate-500">{m.dosage} • {m.frequency} ({m.timing})</span>
                        </div>
                        <span className="text-slate-600 font-medium">{m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.recordType === "Lab Report" && selectedRecord.details?.results && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Investigation Parameters</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                    {selectedRecord.details.results.map((r, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{r.parameter}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">Ref: {r.referenceRange || "Standard"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.result} {r.unit}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold liquid-glass-pill ${
                            r.status === "critical" || r.status === "high" ? "bg-rose-50 text-rose-800 border-rose-200/70" : "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.recordType === "Consultation" && (
                <div className="space-y-2">
                  {selectedRecord.details?.diagnosis && (
                    <div className="rounded-xl bg-teal-50/50 border border-teal-200/70 p-3">
                      <span className="text-teal-800 font-bold uppercase text-[10px] block">Diagnosis</span>
                      <p className="text-slate-800 font-medium mt-0.5">{selectedRecord.details.diagnosis}</p>
                    </div>
                  )}
                  {selectedRecord.details?.clinicalSummary && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Summary & Advice</span>
                      <p className="text-slate-700 mt-0.5">{selectedRecord.details.clinicalSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRecord.recordType === "Clinical Note" && (
                <div className="space-y-2">
                  {selectedRecord.details?.chiefComplaint && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Chief Complaint</span>
                      <p className="text-slate-800 mt-0.5">{selectedRecord.details.chiefComplaint}</p>
                    </div>
                  )}
                  {selectedRecord.details?.assessment && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Assessment</span>
                      <p className="text-slate-800 mt-0.5">{selectedRecord.details.assessment}</p>
                    </div>
                  )}
                  {selectedRecord.details?.treatmentPlan && (
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Treatment Plan</span>
                      <p className="text-slate-800 mt-0.5">{selectedRecord.details.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedRecord.recordType === "Discharge" && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Discharge Summary</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {selectedRecord.details?.dischargeSummary || selectedRecord.summary}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between no-print print:hidden">
              <button
                type="button"
                onClick={() => handlePrintSelectedRecord(selectedRecord)}
                className="px-3.5 py-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
              >
                <span>🖨️</span> Print Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white transition shadow-sm shadow-teal-950/10 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

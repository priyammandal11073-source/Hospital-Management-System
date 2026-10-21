import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyMedicalRecords } from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";

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
    if (rec.details?.dischargeSummary) rows.push(["Discharge Course & Advice", rec.details.dischargeSummary]);

    const html = generateGeneralHospitalReportHtml({
      title: `Official Patient Health Record - ${rec.recordType || "Clinical Record"}`,
      subtitle: `${dept} • ${doctorName}`,
      metrics: [
        { label: "Record Type", value: rec.recordType || "General", color: "#1e3a8a" },
        { label: "Event Date", value: new Date(rec.recordDate).toLocaleDateString("en-IN"), color: "#0f766e" },
        { label: "Document Status", value: "FINAL VERIFIED", color: "#16a34a" },
        { label: "Reference Code", value: `REC-${String(rec._id).slice(-6).toUpperCase()}`, color: "#475569" },
      ],
      tables: [
        {
          title: "Clinical Details & Medical Information",
          headers: ["Clinical Parameter", "Medical Entry / Observation"],
          rows: rows.length > 0 ? rows : [["Summary", rec.summary || "No additional text"]],
        },
      ],
      notes: "Official clinical document excerpt from Nivora Care Hospital Health Informatics System. Protected under patient confidentiality regulations.",
    });

    openPrintPreview({
      title: `${rec.recordType || "Medical"} Record`,
      htmlContent: html,
      refNumber: `MR-${String(rec._id).slice(-6).toUpperCase()}`,
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
      case "Consultation": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Prescription": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Lab Report": return "bg-teal-50 text-teal-700 border-teal-200";
      case "Clinical Note": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Admission": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Discharge": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20 mb-2">
            <span>🛡️</span> Verified Hospital Health Documentation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            My Medical Records
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete longitudinal health history including consultations, clinical notes, prescriptions, and lab tests.
          </p>
        </div>

        <Link
          to="/patient/timeline"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs self-start sm:self-auto"
        >
          <span>⏳</span> View Healthcare Timeline →
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search records by title, doctor, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Record Type Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {RECORD_TYPES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                category === cat
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80"
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-3 text-xs font-medium text-slate-500 animate-pulse">Compiling personal medical records...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-2">📁</span>
          <h3 className="text-sm font-bold text-slate-800">No medical records match your criteria</h3>
          <p className="mt-1 text-xs text-slate-500">Your completed consultations and clinical reports will appear here automatically.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
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
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getRecordIcon(r.recordType)}</span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-0.5 ${getBadgeColor(r.recordType)}`}>
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
                      <p className="text-[11px] text-slate-500">{r.department}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      <p className="truncate">{r.summary}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs border border-blue-200 transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-slide-in max-h-[85vh] overflow-y-auto clinical-print-sheet printable-card print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRecordIcon(selectedRecord.recordType)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(selectedRecord.recordType)}`}>
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
                className="text-slate-400 hover:text-slate-700 text-xl font-bold no-print print:hidden"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 grid grid-cols-2 gap-2">
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
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedRecord.details.medications.map((m, i) => (
                      <div key={i} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <strong className="text-indigo-700 font-bold block">{m.name}</strong>
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
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedRecord.details.results.map((r, i) => (
                      <div key={i} className="p-2.5 bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{r.parameter}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">Ref: {r.referenceRange || "Standard"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.result} {r.unit}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "critical" || r.status === "high" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
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
                    <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3">
                      <span className="text-blue-700 font-bold uppercase text-[10px] block">Diagnosis</span>
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
                  <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedRecord.details?.dischargeSummary || selectedRecord.summary}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between no-print print:hidden">
              <button
                type="button"
                onClick={() => handlePrintSelectedRecord(selectedRecord)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <span>🖨️</span> Print Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
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

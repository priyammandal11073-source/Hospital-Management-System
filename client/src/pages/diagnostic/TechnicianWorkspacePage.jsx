import { useEffect, useState } from "react";
import {
  getDiagnosticRequests,
  enterDiagnosticResults,
  uploadDiagnosticMedicalFile,
} from "../../services/api.js";

export default function TechnicianWorkspacePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);

  // Form states for Pathology
  const [parameters, setParameters] = useState([
    { parameter: "Hemoglobin", result: "", unit: "g/dL", referenceRange: "13.0 - 17.0", status: "normal", flag: "" },
    { parameter: "RBC Count", result: "", unit: "million/uL", referenceRange: "4.5 - 5.9", status: "normal", flag: "" },
    { parameter: "WBC Count", result: "", unit: "/uL", referenceRange: "4000 - 11000", status: "normal", flag: "" },
    { parameter: "Platelet Count", result: "", unit: "/uL", referenceRange: "150000 - 450000", status: "normal", flag: "" },
  ]);

  // Form states for Radiology
  const [technique, setTechnique] = useState("Standard digital imaging protocol.");
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [radiationDose, setRadiationDose] = useState("0.02 mSv");
  const [contrastUsed, setContrastUsed] = useState("None");

  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWorklist = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticRequests({});
      if (res.success) {
        // Filter orders that are ready for technician processing
        const readyOrders = (res.data || []).filter(
          (o) =>
            o.status === "Sample Collected" ||
            o.status === "In Progress" ||
            o.status === "Scheduled" ||
            o.status === "Accepted"
        );
        setRequests(readyOrders);
      }
    } catch (err) {
      console.error("Failed to load technician worklist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorklist();
  }, []);

  const handleSelectOrder = (order) => {
    setActiveOrder(order);
    setUploadedFiles([]);
    setTechnicianNotes("");

    if (order.department === "Pathology") {
      // Preload test reference ranges if available
      const ranges = order.test?.referenceRanges || [];
      if (ranges.length > 0) {
        setParameters(
          ranges.map((r) => ({
            parameter: r.parameter,
            result: "",
            unit: r.unit || "",
            referenceRange: r.normalRange || "",
            lowCritical: r.lowCritical,
            highCritical: r.highCritical,
            status: "normal",
            flag: "",
          }))
        );
      } else {
        setParameters([
          { parameter: order.testName, result: "", unit: "", referenceRange: "Negative / Normal", status: "normal", flag: "" },
        ]);
      }
    } else {
      // Radiology defaults
      setTechnique(`High-resolution ${order.testName} performed in accordance with ALARA radiation principles.`);
      setFindings("");
      setImpression("");
      setRecommendations("Clinical correlation recommended.");
    }
  };

  // Auto-flagging logic for numerical parameters
  const handleParameterChange = (index, value) => {
    const next = [...parameters];
    const item = next[index];
    item.result = value;

    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (item.lowCritical !== undefined && num <= item.lowCritical) {
        item.status = "critical";
        item.flag = "CRITICAL LOW";
      } else if (item.highCritical !== undefined && num >= item.highCritical) {
        item.status = "critical";
        item.flag = "CRITICAL HIGH";
      } else if (item.referenceRange && item.referenceRange.includes("-")) {
        const parts = item.referenceRange.split("-").map((s) => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (num < parts[0]) {
            item.status = "low";
            item.flag = "L";
          } else if (num > parts[1]) {
            item.status = "high";
            item.flag = "H";
          } else {
            item.status = "normal";
            item.flag = "";
          }
        }
      }
    } else {
      item.status = "normal";
      item.flag = "";
    }
    setParameters(next);
  };

  const handleAddParameterRow = () => {
    setParameters([
      ...parameters,
      { parameter: "", result: "", unit: "", referenceRange: "", status: "normal", flag: "" },
    ]);
  };

  // External Object Storage Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", activeOrder.patient?._id || activeOrder.patient);
      formData.append("orderId", activeOrder._id);
      formData.append("testId", activeOrder.test?._id || activeOrder.test);
      formData.append("studyModality", activeOrder.department === "Radiology" ? "Radiology Study" : "Laboratory Micrograph");

      const res = await uploadDiagnosticMedicalFile(formData);
      if (res.success) {
        setUploadedFiles([...uploadedFiles, res.data]);
      }
    } catch (err) {
      alert("File upload to object storage failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      setSubmitting(true);
      const payload = {
        orderId: activeOrder._id,
        technicianNotes,
        attachedFiles: uploadedFiles.map((f) => ({
          fileId: f.fileId,
          originalName: f.originalName,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
          secureUrl: f.secureUrl,
          studyModality: f.studyModality,
        })),
      };

      if (activeOrder.department === "Pathology") {
        payload.testResults = parameters;
      } else {
        payload.radiologyStudy = {
          technique,
          findings,
          impression,
          recommendations,
          radiationDose,
          contrastUsed,
        };
      }

      await enterDiagnosticResults(payload);
      alert("Test results entered successfully and dispatched for Specialist Review!");
      setActiveOrder(null);
      fetchWorklist();
    } catch (err) {
      alert("Failed to submit results: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Technician Workbench & Data Entry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process laboratory parameters with automatic normal/critical range flagging and upload medical scans to external object storage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Test Worklist */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Assigned Worklist ({requests.length})</h3>
            <span className="text-[10px] font-semibold text-slate-400">Ready for Entry</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading worklist...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending orders ready for entry.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {requests.map((r) => {
                const isSelected = activeOrder?._id === r._id;
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => handleSelectOrder(r)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{r.orderNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        r.priority === "STAT" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs mt-1 truncate">{r.testName}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{r.patientName}</span>
                      <span className="font-semibold text-indigo-600">{r.department}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Entry Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          {!activeOrder ? (
            <div className="py-24 text-center text-slate-400">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-sm font-semibold text-slate-600">Select an order from the worklist to start data entry</p>
              <p className="text-xs text-slate-400 mt-1">Results entered here will be forwarded to Pathologists or Radiologists for verification</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitResults} className="space-y-5">
              {/* Order Context Banner */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-900 text-sm">{activeOrder.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {activeOrder.department}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{activeOrder.testName}</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{activeOrder.patientName}</strong> • Age: {activeOrder.patientAge || "Adult"} • Gender: {activeOrder.patientGender || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Status</span>
                  <span className="font-bold text-xs text-amber-700">{activeOrder.status}</span>
                </div>
              </div>

              {/* PATHOLOGY: Structured Parameters Entry */}
              {activeOrder.department === "Pathology" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Laboratory Parameter Values
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddParameterRow}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      + Add Parameter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {parameters.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 bg-slate-50/60 p-2 text-xs">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Parameter Name"
                            value={p.parameter}
                            onChange={(e) => {
                              const next = [...parameters];
                              next[idx].parameter = e.target.value;
                              setParameters(next);
                            }}
                            className="w-full bg-transparent font-semibold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Measured Value"
                            value={p.result}
                            onChange={(e) => handleParameterChange(idx, e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="col-span-2 text-slate-500 text-[11px]">
                          {p.unit} ({p.referenceRange || "Normal"})
                        </div>

                        <div className="col-span-3 text-right">
                          {p.status === "critical" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                              CRITICAL
                            </span>
                          ) : p.status === "high" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              HIGH (H)
                            </span>
                          ) : p.status === "low" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              LOW (L)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                              NORMAL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RADIOLOGY: Study Findings & Technique */}
              {activeOrder.department === "Radiology" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Radiology Examination Entry
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Radiation Dose</label>
                      <input
                        type="text"
                        value={radiationDose}
                        onChange={(e) => setRadiationDose(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Contrast Medium</label>
                      <input
                        type="text"
                        value={contrastUsed}
                        onChange={(e) => setContrastUsed(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Imaging Technique</label>
                    <input
                      type="text"
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Observations / Findings</label>
                    <textarea
                      rows={3}
                      placeholder="Describe parenchymal fields, osseous structures, mediastinal contours, etc."
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Impression / Provisional Diagnosis</label>
                    <input
                      type="text"
                      placeholder="e.g. Bilateral lower zone bronchopneumonia, cardiomegaly"
                      value={impression}
                      onChange={(e) => setImpression(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* EXTERNAL OBJECT STORAGE FILE ATTACHMENTS */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Medical File Attachments (External Object Storage)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Max 25MB • PNG, JPEG, PDF, DICOM</span>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 p-3 bg-slate-50 text-center">
                  <input
                    type="file"
                    id="medicalFileInput"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.dcm"
                  />
                  <label
                    htmlFor="medicalFileInput"
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 hover:border-indigo-500 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer transition shadow-2xs"
                  >
                    <span>📤 Upload Image / Scan to Object Storage</span>
                  </label>
                  {uploading && <p className="text-xs text-indigo-600 mt-2 font-semibold animate-pulse">Streaming to isolated medical storage...</p>}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">📎</span>
                          <span className="font-semibold text-slate-800 truncate">{f.originalName}</span>
                          <span className="text-[10px] text-slate-400">({Math.round(f.fileSize / 1024)} KB)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">Saved to Object Storage ✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technician Verification Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Technician Processing Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Specimen verified on Sysmex XN-1000. Controls calibrated."
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit for Specialist Verification →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

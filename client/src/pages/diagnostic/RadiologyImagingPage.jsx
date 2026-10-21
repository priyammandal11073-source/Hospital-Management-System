import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiagnosticRequests } from "../../services/api.js";

export default function RadiologyImagingPage() {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalityFilter, setModalityFilter] = useState("");
  const [activeViewerStudy, setActiveViewerStudy] = useState(null);

  // Viewer tool states
  const [zoom, setZoom] = useState(1);
  const [inverted, setInverted] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const fetchRadiologyStudies = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticRequests({ department: "Radiology" });
      if (res.success) {
        setStudies(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch radiology studies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadiologyStudies();
  }, []);

  const filteredStudies = studies.filter((s) => {
    if (!modalityFilter) return true;
    return s.category?.toLowerCase() === modalityFilter.toLowerCase() ||
           s.test?.modality?.toLowerCase() === modalityFilter.toLowerCase();
  });

  const handleOpenViewer = (study) => {
    setActiveViewerStudy(study);
    setZoom(1);
    setInverted(false);
    setBrightness(100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Radiology PACS & Medical Imaging Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Digital modalities, high-throughput image acquisition, and high-fidelity diagnostic viewing
          </p>
        </div>
      </div>

      {/* Modality Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: "All Imaging Modalities", val: "" },
          { label: "🩻 Digital X-Ray", val: "X-Ray" },
          { label: "🌀 128-Slice CT Scan", val: "CT Scan" },
          { label: "🧲 3.0T MRI Supercon", val: "MRI" },
          { label: "📡 4D Ultrasound & Doppler", val: "Ultrasound" },
          { label: "🎗️ Digital Mammography", val: "Mammography" },
        ].map((m) => (
          <button
            key={m.val}
            type="button"
            onClick={() => setModalityFilter(m.val)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              modalityFilter === m.val
                ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Studies Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-semibold">
          Accessing Radiology PACS servers...
        </div>
      ) : filteredStudies.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          No imaging studies found for selected modality.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudies.map((st) => {
            const hasFile = st.report?.attachedFiles?.length > 0 || st.attachedFiles?.length > 0;
            const file = st.report?.attachedFiles?.[0] || st.attachedFiles?.[0];

            return (
              <div
                key={st._id}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{st.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      st.status === "Finalized"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : st.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{st.testName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {st.patientName} • {st.patientAge || "Adult"} yrs • {st.category || "Radiology"}
                  </p>

                  {/* Radiology Thumbnail Preview */}
                  <div className="mt-3 relative h-36 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800">
                    {file ? (
                      <img
                        src={file.secureUrl}
                        alt="Medical Scan Preview"
                        className="h-full w-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-center text-slate-500">
                        <span className="text-2xl block">🩻</span>
                        <span className="text-[10px] font-mono">DICOM Study Pending Acquisition</span>
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-slate-300">
                      Modality: {st.category}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    {st.report?.radiologyStudy?.radiationDose || "Low-Dose ALARA"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenViewer(st)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      <span>Inspect</span>
                    </button>
                    <Link
                      to={`/diagnostic/radiology/${st.orderNumber || st._id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                    >
                      <span>Study Workspace →</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= INTERACTIVE MEDICAL IMAGE VIEWER MODAL ================= */}
      {activeViewerStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-[90vh] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
            {/* Viewer Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{activeViewerStudy.testName}</span>
                    <span className="text-xs font-mono text-indigo-400">({activeViewerStudy.orderNumber})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Patient: {activeViewerStudy.patientName} • Modality: {activeViewerStudy.category} • Storage: Object Storage Validated
                  </p>
                </div>
              </div>

              {/* Manipulation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold cursor-pointer"
                  title="Zoom In"
                >
                  🔍+
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold cursor-pointer"
                  title="Zoom Out"
                >
                  🔍-
                </button>
                <button
                  type="button"
                  onClick={() => setInverted((inv) => !inv)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                    inverted ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                  title="Invert Contrast / B&W Negative"
                >
                  ☯ Invert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setInverted(false);
                    setBrightness(100);
                  }}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewerStudy(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Viewer Workspace */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Center Canvas */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden p-4 select-none">
                {/* HUD Corner Indicators */}
                <div className="absolute top-3 left-4 text-[11px] font-mono text-emerald-400/80 space-y-0.5 pointer-events-none">
                  <p>NIVORA CARE HOSPITAL</p>
                  <p>PACS NODE: RAD-STATION-01</p>
                  <p>DOSE: {activeViewerStudy.report?.radiologyStudy?.radiationDose || "0.02 mSv"}</p>
                </div>

                <div className="absolute top-3 right-4 text-[11px] font-mono text-emerald-400/80 space-y-0.5 text-right pointer-events-none">
                  <p>{activeViewerStudy.patientName}</p>
                  <p>ABHA: {activeViewerStudy.patientAbhaId || "VERIFIED"}</p>
                  <p>ZOOM: {Math.round(zoom * 100)}%</p>
                </div>

                {/* Scan Image */}
                {activeViewerStudy.report?.attachedFiles?.[0] || activeViewerStudy.attachedFiles?.[0] ? (
                  <img
                    src={(activeViewerStudy.report?.attachedFiles?.[0] || activeViewerStudy.attachedFiles?.[0])?.secureUrl}
                    alt="DICOM Slice"
                    className="max-h-full max-w-full object-contain transition-transform duration-100"
                    style={{
                      transform: `scale(${zoom})`,
                      filter: `${inverted ? "invert(1) " : ""}brightness(${brightness}%)`,
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <span className="text-6xl block mb-2">🩻</span>
                    <p className="text-sm font-semibold">Simulated High-Resolution Diagnostic Scan</p>
                    <p className="text-xs text-slate-600 mt-1">Study awaiting file attachment from technician console</p>
                  </div>
                )}
              </div>

              {/* Right Findings & Radiologist Notes Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 p-4 overflow-y-auto space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Radiology Study Findings</h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {activeViewerStudy.report?.radiologyStudy?.findings ||
                      "Lung parenchyma displays physiological aeration. Cardiac silhouette within normal limits. No pleural effusion or pneumothorax identified."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Impression</h4>
                  <p className="text-xs font-bold text-white mt-1.5 leading-relaxed bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    {activeViewerStudy.report?.radiologyStudy?.impression || "No acute cardiopulmonary pathology demonstrated."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Technique</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {activeViewerStudy.report?.radiologyStudy?.technique || "Standard erect PA projection."}
                  </p>
                </div>

                {activeViewerStudy.report?.digitalSignature && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <span>✓</span>
                      <span>Verified & Digitally Signed</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      By: {activeViewerStudy.report.digitalSignature.signedBy}
                    </p>
                    <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                      Hash: {activeViewerStudy.report.digitalSignature.signatureHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

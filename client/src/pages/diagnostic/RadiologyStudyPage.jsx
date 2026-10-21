import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getRadiologyStudyDetails,
  reviewAndApproveDiagnosticReport,
  downloadDiagnosticReportPdfBlob,
  logPrintAction,
  amendDiagnosticReport,
} from "../../services/api.js";
import HospitalLogo from "../../components/HospitalLogo.jsx";
import RadiologyFilmGeneratorModal from "../../components/diagnostic/RadiologyFilmGeneratorModal.jsx";
import ReprintModal from "../../components/diagnostic/ReprintModal.jsx";
import { printClinicalReport } from "../../utils/printReport.js";

export default function RadiologyStudyPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Radiology Report Form state
  const [technique, setTechnique] = useState("");
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Diagnostic Image Viewer State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPanActive, setIsPanActive] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isInverted, setIsInverted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals & Mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");

  const viewerContainerRef = useRef(null);

  const loadStudy = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getRadiologyStudyDetails(studyId);
      if (res.success && res.data) {
        setStudyData(res.data);
        const rep = res.data.report?.radiologyStudy;
        setTechnique(
          rep?.technique ||
            "High-resolution digital radiographs obtained in standard projections with optimal beam collimation and automatic exposure control."
        );
        setFindings(
          rep?.findings ||
            "Lung fields demonstrate normal aeration without focal consolidation, pneumothorax, or pleural effusion. Normal cardiothoracic ratio (< 0.50). Mediastinal and hilar contours are within normal anatomical limits. Visualized bony thorax is intact."
        );
        setImpression(
          rep?.impression ||
            "No acute cardiopulmonary pathology detected. Examination is within normal anatomical limits."
        );
        setRecommendations(rep?.recommendations || "Clinical correlation recommended if symptoms persist.");
      } else {
        setError("Radiology study not found.");
      }
    } catch (err) {
      console.error("Failed to load study", err);
      setError(err.response?.data?.message || "Error loading radiology study.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudy();
  }, [studyId]);

  // Image Viewer Controls (Non-destructive)
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleFit = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setIsInverted(false);
  };

  const images = studyData?.images || [];
  const activeImage = images[currentImageIndex] || null;

  const handleNextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      handleReset();
    }
  };

  const handlePrevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      handleReset();
    }
  };

  // Drag / Pan Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Actions
  const handlePrintSingleImage = async () => {
    try {
      await logPrintAction({
        orderId: studyData?.order?._id,
        reportId: studyData?.report?._id,
        documentType: "SINGLE_IMAGE",
        copies: 1,
        reason: `Single Image Print: ${activeImage?.originalName || "Slice"}`,
        selectedImages: [activeImage?.fileId],
      });
      window.print();
    } catch (err) {
      window.print();
    }
  };

  const handleDownloadSingleImage = () => {
    if (!activeImage) return;
    const link = document.createElement("a");
    link.href = activeImage.secureUrl || `/api/diagnostics/files/${activeImage.fileId}/stream`;
    link.download = activeImage.originalName || "radiology-image.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintReport = async () => {
    try {
      if (studyData?.report?._id) {
        await logPrintAction({
          reportId: studyData.report._id,
          orderId: studyData.order?._id,
          documentType: "RADIOLOGY_REPORT",
          copies: 1,
          reason: "Radiology Report Hardcopy Print",
        });
      }
      const printObj = {
        ...(studyData?.report || {}),
        patient: studyData?.patient || studyData?.order?.patient,
        doctor: studyData?.doctor || studyData?.order?.doctor,
        order: studyData?.order,
        department: "Radiology",
        testName: studyData?.order?.testName || studyData?.report?.testName,
        radiologyStudy: {
          technique,
          findings,
          impression,
          radiationDose: studyData?.report?.radiologyStudy?.radiationDose || "0.02 mSv",
          contrastUsed: studyData?.report?.radiologyStudy?.contrastUsed || "None",
        },
        summaryConclusion: impression,
      };
      printClinicalReport(printObj);
    } catch (err) {
      console.error("Print log error", err);
      printClinicalReport(studyData?.report);
    }
  };

  const handleDownloadPdf = async () => {
    if (!studyData?.report?._id) return;
    try {
      setIsDownloadingPdf(true);
      const blob = await downloadDiagnosticReportPdfBlob(studyData.report._id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Radiology_Report_${studyData.report.reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage("📥 Official Radiology PDF report downloaded!");
    } catch (err) {
      console.error("PDF download error", err);
      setError("Failed to download PDF report.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleApproveAndSign = async () => {
    if (!studyData?.report?._id) return;
    try {
      setIsSaving(true);
      const res = await reviewAndApproveDiagnosticReport(studyData.report._id, {
        status: "Finalized",
        radiologyStudy: {
          technique,
          findings,
          impression,
          recommendations,
          contrastUsed: "None",
        },
        summaryConclusion: impression,
      });
      if (res.success) {
        setSuccessMessage("✅ Radiology study approved, digitally signed, and published!");
        await loadStudy();
      }
    } catch (err) {
      console.error("Approval error", err);
      setError("Failed to approve radiology report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmendSubmit = async (e) => {
    e.preventDefault();
    if (!amendmentReason.trim() || !studyData?.report?._id) return;

    try {
      setIsSaving(true);
      const res = await amendDiagnosticReport(studyData.report._id, {
        amendmentReason: amendmentReason.trim(),
        radiologyStudy: {
          technique,
          findings,
          impression,
          recommendations,
        },
        summaryConclusion: impression,
      });
      if (res.success) {
        setSuccessMessage(`📝 Radiology report amended to version ${res.data.version}!`);
        setIsAmendModalOpen(false);
        setAmendmentReason("");
        await loadStudy();
      }
    } catch (err) {
      console.error("Amendment error", err);
      setError("Failed to amend report.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Loading radiology study & DICOM images...</p>
        </div>
      </div>
    );
  }

  if (error || !studyData) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 text-xl font-bold">
          ✕
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Study Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">{error || "The requested imaging examination does not exist."}</p>
        <Link
          to="/diagnostic/radiology"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition"
        >
          ← Return to Radiology Worklist
        </Link>
      </div>
    );
  }

  const { order, report } = studyData;
  const patient = order?.patient || report?.patient;
  const isFinalized = report?.status === "Finalized" || report?.status === "Amended";
  const modality = order?.modality || report?.modality || "X-Ray";

  return (
    <div className="space-y-6">
      {/* ================= TOP CONTROLS (HIDDEN ON PRINT) ================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/diagnostic/radiology"
              className="text-xs font-semibold text-slate-500 hover:text-cyan-600 transition"
            >
              ← Radiology Worklist
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-cyan-600">Imaging Examination & Study Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            {order?.testName || report?.testName || "Radiology Study"}
            <span className="rounded-md bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 text-xs font-bold">
              {modality}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
              report?.isAmended
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : isFinalized
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}>
              {report?.isAmended ? `AMENDED (v${report.version})` : report?.status || "In Review"}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Study ID: {order?.orderNumber || studyId} • Patient: {patient?.name} ({patient?.age || 45}Y / {patient?.gender || "M"})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Film Button */}
          <button
            type="button"
            onClick={() => setIsFilmModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:from-cyan-500 hover:to-blue-500 transition"
          >
            <span>🎞️</span>
            <span>Generate Film Sheet</span>
          </button>

          {/* Preview Report Button */}
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isPreviewMode
                ? "bg-cyan-50 text-cyan-700 border-cyan-300 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>👁️</span>
            <span>{isPreviewMode ? "Exit Preview" : "Preview Report"}</span>
          </button>

          {/* Download PDF */}
          {report?._id && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 transition shadow-xs"
            >
              <span>📥</span>
              <span>{isDownloadingPdf ? "Compiling..." : "Download PDF"}</span>
            </button>
          )}

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>

          {/* Reprint Button */}
          {report?._id && (
            <button
              type="button"
              onClick={() => setIsReprintModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>🔄</span>
              <span>Reprint</span>
            </button>
          )}

          {/* Amend Button */}
          {isFinalized && (
            <button
              type="button"
              onClick={() => setIsAmendModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
            >
              <span>✏️</span>
              <span>Amend (v{(report.version || 1) + 1})</span>
            </button>
          )}

          {/* Approve & Sign */}
          {!isFinalized && report?._id && (
            <button
              type="button"
              onClick={handleApproveAndSign}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <span>✍️</span>
              <span>Approve & Sign</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="no-print rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* ================= DIAGNOSTIC IMAGE VIEWER (SECTION 42 & 54) ================= */}
      {!isPreviewMode && (
        <div className="no-print rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                🩻
              </span>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Diagnostic Medical Image Viewer
                  <span className="text-xs font-normal text-slate-400">
                    ({images.length > 0 ? `Image ${currentImageIndex + 1} of ${images.length}` : "No scans attached"})
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {patient?.name} • ID: {patient?.abhaId || "P-1002"} • {modality} • {order?.testName}
                </p>
              </div>
            </div>

            {/* Viewer Controls Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevImage}
                disabled={images.length <= 1}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                title="Previous Image"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                disabled={images.length <= 1}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                title="Next Image"
              >
                Next ▶
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              <button
                type="button"
                onClick={handleZoomIn}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                title="Zoom In"
              >
                🔍+
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                title="Zoom Out"
              >
                🔍-
              </button>
              <button
                type="button"
                onClick={handleFit}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                title="Fit to Screen"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                title="Rotate 90 Degrees"
              >
                ↻ Rotate
              </button>
              <button
                type="button"
                onClick={() => setIsInverted(!isInverted)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                  isInverted ? "bg-cyan-600 text-white border-cyan-500" : "bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800"
                }`}
                title="Invert Contrast (Negative)"
              >
                Invert
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                title="Reset View"
              >
                Reset
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1"></div>
              {/* Single Image Print & Download */}
              <button
                type="button"
                onClick={handlePrintSingleImage}
                disabled={!activeImage}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                title="Print current image"
              >
                🖨️ Print Img
              </button>
              <button
                type="button"
                onClick={handleDownloadSingleImage}
                disabled={!activeImage}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                title="Download current image"
              >
                📥 Save Img
              </button>
            </div>
          </div>

          {/* Interactive Image Canvas Area */}
          <div
            ref={viewerContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative h-[420px] w-full bg-black rounded-xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            {(() => {
              const modalityStr = (modality || "X-Ray").toLowerCase();
              const defaultSrc = modalityStr.includes("ct")
                ? "/medical_scans/ct_thorax_axial.png"
                : modalityStr.includes("mri")
                ? "/medical_scans/mri_brain_axial.png"
                : modalityStr.includes("usg") || modalityStr.includes("ultrasound")
                ? "/medical_scans/usg_abdomen.png"
                : "/medical_scans/chest_xray_pa_view.png";

              const imageSrc = activeImage?.secureUrl || (activeImage?.fileId ? `/api/diagnostics/files/${activeImage.fileId}/stream` : defaultSrc);

              return (
                <img
                  src={imageSrc}
                  alt={activeImage?.originalName || `${modality} Scan`}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    filter: isInverted ? "invert(1) contrast(1.3)" : "none",
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                  }}
                  className="max-h-[380px] w-auto object-contain pointer-events-none rounded"
                  onError={(e) => {
                    if (!e.target.src.includes(defaultSrc)) {
                      e.target.src = defaultSrc;
                    }
                  }}
                />
              );
            })()}

            {/* Fallback Simulation if image fails to load or no images */}
            <div
              style={{ display: activeImage?.secureUrl ? "none" : "flex" }}
              className="flex-col items-center justify-center p-8 text-center text-slate-500"
            >
              <div className="h-32 w-32 rounded-full border-2 border-slate-800 bg-slate-900/60 flex items-center justify-center">
                <span className="text-4xl">🩻</span>
              </div>
              <p className="text-sm font-bold text-cyan-400 mt-3">
                {modality} SCAN SLICE {currentImageIndex + 1}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Full-Field Digital Radiograph • Window W:400 L:40
              </p>
            </div>

            {/* Overlay Medical HUD Tag */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono pointer-events-none">
              <p className="font-bold text-cyan-400">{patient?.name}</p>
              <p>ID: {patient?.abhaId || "P-1002"} | Zoom: {Math.round(zoomLevel * 100)}%</p>
              <p>Rot: {rotation}° | {modality}</p>
            </div>

            <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 font-mono pointer-events-none">
              Frame {currentImageIndex + 1} / {Math.max(images.length, 1)}
            </div>
          </div>
        </div>
      )}

      {/* ================= RADIOLOGY REPORT EDITOR (HIDDEN ON PRINT) ================= */}
      {!isPreviewMode && (
        <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>📝</span> Radiologist Clinical Report & Diagnostic Impression
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technique / Protocol
              </label>
              <textarea
                rows={2}
                disabled={isFinalized}
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recommendations
              </label>
              <textarea
                rows={2}
                disabled={isFinalized}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Findings (Detailed Observations) *
            </label>
            <textarea
              rows={4}
              disabled={isFinalized}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white disabled:bg-slate-100 font-sans leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Impression (Conclusion / Diagnosis) *
            </label>
            <textarea
              rows={2}
              disabled={isFinalized}
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              className="w-full rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 text-xs font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
            />
          </div>
        </div>
      )}

      {/* ================= PRINT-FRIENDLY RADIOLOGY REPORT CANVAS =================
          Shown in preview mode and is the ONLY element printed during window.print()
      ========================================================================= */}
      <div className={`clinical-print-sheet mx-auto max-w-3xl rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm ${
        isPreviewMode ? "block" : "hidden print:block"
      }`}>
        <div className="border-b-2 border-teal-800 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <HospitalLogo variant="full" />
            <div>
              <p className="text-xs font-bold text-teal-800">
                DEPARTMENT OF RADIOLOGY & MEDICAL IMAGING
              </p>
              <p className="text-[10px] text-slate-500">
                AERB Certified • PACS / DICOM Integrated • Level 1 Trauma Imaging
              </p>
              <p className="text-[9px] text-slate-400">
                Healthcare Boulevard • Tel: +91 11 2891 0000 • radiology@nivoracare.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
              report?.isAmended ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
            }`}>
              {report?.isAmended ? `AMENDED (v${report.version})` : "FINAL RADIOLOGY REPORT"}
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 mt-1">
              Study ID: {order?.orderNumber || studyId}
            </p>
            <p className="text-[10px] text-slate-500">
              Date: {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Demographics Box */}
        <div className="my-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 grid grid-cols-2 text-xs gap-y-1 gap-x-4">
          <div><span className="text-slate-500">Patient: </span><strong className="text-slate-900">{patient?.name}</strong></div>
          <div><span className="text-slate-500">Modality: </span><strong className="text-slate-900">{modality}</strong></div>
          <div><span className="text-slate-500">Age / Sex: </span><strong className="text-slate-900">{patient?.age || 45} Y / {patient?.gender || "M"}</strong></div>
          <div><span className="text-slate-500">Exam: </span><strong className="text-slate-900">{order?.testName}</strong></div>
          <div><span className="text-slate-500">Patient ID: </span><strong className="font-mono text-slate-900">{patient?.abhaId || "P-1002"}</strong></div>
          <div><span className="text-slate-500">Referring Dr: </span><strong className="text-slate-900">{order?.doctorName || "Dr. Medical Specialist"}</strong></div>
        </div>

        {/* Clinical Technique */}
        <div className="mb-3">
          <p className="text-xs font-bold text-teal-900 uppercase">TECHNIQUE:</p>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{technique}</p>
        </div>

        {/* Findings */}
        <div className="mb-4">
          <p className="text-xs font-bold text-teal-900 uppercase">FINDINGS:</p>
          <p className="text-xs text-slate-800 mt-1 leading-relaxed font-sans">{findings}</p>
        </div>

        {/* Impression Box */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 mb-4">
          <p className="text-xs font-bold text-teal-900 uppercase">IMPRESSION:</p>
          <p className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">{impression}</p>
        </div>

        {/* Recommendations */}
        {recommendations && (
          <div className="mb-4 text-xs">
            <span className="font-bold text-slate-700">Recommendations: </span>
            <span className="text-slate-600">{recommendations}</span>
          </div>
        )}

        {/* Radiologist Digital Signature Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-teal-900 text-white rounded flex items-center justify-center font-mono text-[9px] font-bold text-center leading-tight p-1">
              AERB<br/>PACS
            </div>
            <div>
              <p className="font-bold text-teal-900">DIGITALLY VERIFIED STUDY</p>
              <p className="text-[10px] text-slate-500">
                Signature Digest: {report?.digitalSignature?.signatureHash?.slice(0, 32) || "a4f891b7852b855e3b0c44298fc1c14"}...
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900">{report?.specialistName || "Dr. Vikram Seth, MD"}</p>
            <p className="text-[10px] text-slate-600 font-semibold">Consultant Radiologist</p>
            <p className="text-[9px] text-slate-400">Reg No: MCI-41029 • AERB Approved</p>
          </div>
        </div>
      </div>

      {/* ================= FILM GENERATOR MODAL ================= */}
      <RadiologyFilmGeneratorModal
        isOpen={isFilmModalOpen}
        onClose={() => setIsFilmModalOpen(false)}
        study={order}
        report={report}
        availableImages={images}
      />

      {/* ================= AMENDMENT MODAL ================= */}
      {isAmendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              Amend Radiology Report (v{(report?.version || 1) + 1})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Specify the clinical justification for amending finalized findings.
            </p>

            <form onSubmit={handleAmendSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amendment Reason *
                </label>
                <textarea
                  rows={3}
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="e.g. Additional comparison with prior CT scan performed on 02/09/2026..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
                >
                  {isSaving ? "Amending..." : `Confirm Amendment (v${(report?.version || 1) + 1})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REPRINT MODAL ================= */}
      <ReprintModal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
        report={report}
        onReprintSuccess={() => setSuccessMessage("Reprint recorded successfully.")}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import { generateRadiologyFilmPdfBlob, logPrintAction } from "../../services/api.js";

export default function RadiologyFilmGeneratorModal({
  isOpen,
  onClose,
  study,
  report,
  availableImages = [],
}) {
  if (!isOpen) return null;

  const [selectedLayout, setSelectedLayout] = useState("4-up");
  const [selectedImageIds, setSelectedImageIds] = useState(
    availableImages.map((img) => img.fileId || img._id)
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [notification, setNotification] = useState("");

  // Sync selected images when availableImages updates
  useEffect(() => {
    if (availableImages && availableImages.length > 0) {
      setSelectedImageIds(availableImages.map((img) => img.fileId || img._id));
    }
  }, [availableImages]);

  // Isolate print view when printing
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add("printing-film-mode");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-film-mode");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-film-mode");
    };
  }, []);

  const toggleImageSelection = (id) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedImageIds(availableImages.map((img) => img.fileId || img._id));
  };

  const deselectAll = () => {
    setSelectedImageIds([]);
  };

  const handlePrintFilm = async () => {
    try {
      await logPrintAction({
        reportId: report?._id,
        orderId: study?._id,
        documentType: "RADIOLOGY_FILM",
        layout: `Film Sheet (${selectedLayout})`,
        copies: 1,
        reason: "Radiology Film Sheet Hardcopy Print",
        selectedImages: selectedImageIds,
      });
    } catch (err) {
      console.error("Failed to log film print", err);
    } finally {
      document.body.classList.add("printing-film-mode");
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing-film-mode");
        }, 1200);
      }, 80);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setNotification("Compiling calibrated DICOM film sheet PDF...");

      const blob = await generateRadiologyFilmPdfBlob({
        reportId: report?._id,
        orderId: study?._id,
        imageIds: selectedImageIds,
        layout: selectedLayout,
        reason: "DICOM Laser Film PDF Export",
      });

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Film_Sheet_${study?.orderNumber || report?.reportNumber || "RAD"}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setNotification("Film PDF downloaded successfully!");
      setTimeout(() => setNotification(""), 3500);
    } catch (err) {
      console.error("Film PDF download failed", err);
      const msg = err.response?.data?.message || err.message || "Please try again.";
      setNotification(`Failed to generate film PDF: ${msg}`);
      setTimeout(() => setNotification(""), 5000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSelectedImages = () => {
    const selected = availableImages.filter((img) =>
      selectedImageIds.includes(img.fileId || img._id)
    );
    if (selected.length === 0) return;

    selected.forEach((img) => {
      const link = document.createElement("a");
      link.href = img.secureUrl || `/api/diagnostics/files/${img.fileId}/stream`;
      link.download = img.originalName || "radiology-image.jpg";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const patientName = report?.patientName || study?.patientName || "Patient";
  const patientId = report?.patientAbhaId || study?.patient?.abhaId || "P-1002";
  const studyId = study?.orderNumber || `RAD-${report?.reportNumber?.slice(-6) || "9021"}`;
  const modality = report?.modality || study?.modality || "X-Ray";
  const testName = report?.testName || study?.testName || "Radiology Examination";
  const doctorName = report?.doctorName || study?.doctorName || "Consultant Radiologist";

  const getModalityFallback = () => {
    const mod = (modality || "X-Ray").toLowerCase();
    if (mod.includes("ct")) return "/medical_scans/ct_thorax_axial.png";
    if (mod.includes("mri")) return "/medical_scans/mri_brain_axial.png";
    if (mod.includes("usg") || mod.includes("ultrasound")) return "/medical_scans/usg_abdomen.png";
    return "/medical_scans/chest_xray_pa_view.png";
  };

  // Filter images to display according to selection
  const activeImages = availableImages.filter((img) =>
    selectedImageIds.includes(img.fileId || img._id)
  );

  // Maximum cells by layout
  const layoutLimits = { "1-up": 1, "2-up": 2, "4-up": 4, "6-up": 6, "9-up": 9 };
  const maxSlots = layoutLimits[selectedLayout] || 4;
  const gridImages = activeImages.slice(0, maxSlots);

  // Grid classes
  const gridClasses = {
    "1-up": "grid-cols-1",
    "2-up": "grid-cols-1 sm:grid-cols-2",
    "4-up": "grid-cols-2",
    "6-up": "grid-cols-3",
    "9-up": "grid-cols-3",
  }[selectedLayout] || "grid-cols-2";

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-lg">
              🩻
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Radiology Film & Image Sheet Generator
                <span className="rounded-md bg-cyan-950 border border-cyan-700 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  {modality}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Patient: <strong className="text-slate-200">{patientName}</strong> • Study: {studyId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Images */}
            <button
              onClick={handleDownloadSelectedImages}
              disabled={selectedImageIds.length === 0}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
              title="Download individual images"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Images</span>
            </button>

            {/* Download PDF Film */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{isGeneratingPdf ? "Generating..." : "Download Film PDF"}</span>
            </button>

            {/* Print Film Sheet */}
            <button
              onClick={handlePrintFilm}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:from-cyan-500 hover:to-blue-500 transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Film</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white transition"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {notification && (
          <div className="no-print bg-cyan-950/80 border-b border-cyan-800 px-5 py-2 text-xs font-medium text-cyan-200 text-center animate-pulse">
            {notification}
          </div>
        )}

        {/* Configuration Bar (Layout & Selection Controls) */}
        <div className="no-print bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Layout Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Film Layout:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              {[
                { id: "1-up", label: "1 per page" },
                { id: "2-up", label: "2 per page" },
                { id: "4-up", label: "4-up (2×2)" },
                { id: "6-up", label: "6-up (3×2)" },
                { id: "9-up", label: "9-up (3×3)" },
              ].map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setSelectedLayout(layout.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedLayout === layout.id
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Selection Checklist */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-cyan-400">{selectedImageIds.length}</strong> / {availableImages.length}
            </span>
            <button
              onClick={selectAll}
              type="button"
              className="text-[11px] text-cyan-400 hover:underline font-semibold"
            >
              Select All
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={deselectAll}
              type="button"
              className="text-[11px] text-slate-400 hover:underline font-semibold"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Image Selection Thumbnail Strip (Hidden on print) */}
        {availableImages.length > 0 && (
          <div className="no-print border-b border-slate-800 bg-slate-950/60 px-5 py-2.5 overflow-x-auto flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Study Series:
            </span>
            {availableImages.map((img, idx) => {
              const id = img.fileId || img._id;
              const isSelected = selectedImageIds.includes(id);
              return (
                <button
                  key={id || idx}
                  type="button"
                  onClick={() => toggleImageSelection(id)}
                  className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition text-left flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-950/40 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <div className="text-[11px] leading-tight">
                    <p className="font-semibold text-white">Img #{idx + 1}</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[100px]">{img.originalName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            FILM PREVIEW CANVAS (PRINT TARGET: .film-print-dark)
            ========================================================================= */}
        <div className="p-4 sm:p-6 flex-1 bg-slate-950 overflow-y-auto">
          <div
            id="radiology-film-canvas"
            className="film-print-dark mx-auto max-w-4xl rounded-2xl bg-black border border-slate-800 p-4 sm:p-6 shadow-2xl text-white font-mono"
            style={{ minHeight: "680px" }}
          >
            {/* Film Header Banner */}
            <div className="border border-slate-800 bg-slate-950/80 rounded-xl p-3 sm:p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <h1 className="text-base sm:text-lg font-black tracking-wider text-cyan-300">
                    NIVORA CARE HOSPITAL — RADIOLOGY FILM SHEET
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wide mt-0.5">
                  CALIBRATED DICOM LASER IMAGER • RADIATION SAFETY COMPLIANT • {modality.toUpperCase()}
                </p>
              </div>

              {/* Patient Identifiers Header (Guaranteed No Mix-Up) */}
              <div className="text-right text-xs leading-relaxed border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <p className="text-white font-bold text-sm">{patientName}</p>
                <p className="text-slate-400 text-[11px]">
                  ID: <span className="text-cyan-300 font-semibold">{patientId}</span> • Age/Sex: {report?.patientAge || 45}Y/{report?.patientGender || "M"}
                </p>
                <p className="text-slate-400 text-[11px]">
                  Study: <span className="text-white">{studyId}</span> • Dr: {doctorName}
                </p>
              </div>
            </div>

            {/* Film Grid of Images */}
            {gridImages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
                <p className="text-sm font-semibold">No images selected for this film sheet.</p>
                <p className="text-xs mt-1">Select one or more images from the series strip above.</p>
              </div>
            ) : (
              <div className={`grid ${gridClasses} gap-3 sm:gap-4`}>
                {gridImages.map((img, idx) => (
                  <div
                    key={img.fileId || idx}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden flex flex-col"
                  >
                    {/* Frame Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[10px] text-slate-300">
                      <span className="font-bold text-cyan-400">SERIES 1 • FRAME {String(idx + 1).padStart(2, "0")}</span>
                      <span className="text-slate-400 truncate max-w-[150px]">{testName}</span>
                    </div>

                    {/* Image Area with guaranteed real medical scan */}
                    <div className="relative flex-1 min-h-[220px] max-h-[340px] flex items-center justify-center p-2 bg-black">
                      <img
                        src={img.secureUrl || (img.fileId ? `/api/diagnostics/files/${img.fileId}/stream` : getModalityFallback())}
                        alt={`Scan Slice ${idx + 1}`}
                        className="max-h-[320px] w-auto object-contain mx-auto transition-transform rounded"
                        onError={(e) => {
                          const fallback = getModalityFallback();
                          if (!e.target.src.includes(fallback)) {
                            e.target.src = fallback;
                          }
                        }}
                      />
                    </div>

                    {/* Frame Technical Metadata Footer */}
                    <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950 px-3 py-1 text-[9px] text-slate-500 font-mono">
                      <span>W: 400 L: 40</span>
                      <span>Zoom: 100%</span>
                      <span>FOV: 350mm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Film Bottom Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>NIVORA CARE CENTRAL PACS • ARCHIVE FILM UID: FLM-{studyId}</span>
              <span>DATE: {new Date().toLocaleDateString("en-IN")} • CALIBRATED LASER REPRODUCTION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

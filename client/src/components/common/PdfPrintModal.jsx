import { useState, useRef, useEffect } from "react";
import { printHtml } from "../../utils/printUtils.js";

export default function PdfPrintModal({
  isOpen,
  onClose,
  title = "Hospital Clinical Document",
  htmlContent = "",
  refNumber = "",
}) {
  const [scale, setScale] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  // Sync content into preview iframe
  useEffect(() => {
    if (isOpen && iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [isOpen, htmlContent]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printHtml(htmlContent, { title });
    } catch (err) {
      console.error("Print failed:", err);
      // Fallback: print the preview iframe directly
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 1.6));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.6));
  const handleZoomReset = () => setScale(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Document PDF Viewer"
      className="fixed inset-0 z-[70] flex flex-col bg-slate-900/90 backdrop-blur-md animate-backdrop-fade"
    >
      {/* ================= PDF TOOLBAR ================= */}
      <header className="h-16 flex-shrink-0 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-white select-none z-10 shadow-lg">
        {/* Document Information */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            📄
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 truncate">{title}</h2>
              {refNumber && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                  {refNumber}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                A4 Official Format
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Nivora Care Hospital • Medical Information Management System
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-2 py-1 font-mono font-bold text-slate-300 hover:text-white"
              title="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom in"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Direct Print / Save as PDF Button */}
          <button
            type="button"
            disabled={isPrinting}
            onClick={handlePrint}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md hover:shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Print isolated document or save to PDF"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="hidden sm:inline">{isPrinting ? "Printing..." : "Print Document"}</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 p-2 text-slate-400 transition cursor-pointer"
            title="Close viewer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= A4 DOCUMENT PREVIEW CANVAS ================= */}
      <main className="flex-1 overflow-auto bg-slate-900/60 p-4 sm:p-8 flex justify-center items-start">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[840px] bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden min-h-[1140px] relative"
        >
          {/* Watermark / Print preview label (only on screen) */}
          <div className="absolute top-2 right-2 pointer-events-none bg-slate-100 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest z-10">
            Nivora Care Hardcopy Canvas
          </div>

          <iframe
            ref={iframeRef}
            title={title}
            className="w-full min-h-[1140px] border-0"
            style={{ display: "block", height: "100%", minHeight: "1140px" }}
          />
        </div>
      </main>
    </div>
  );
}

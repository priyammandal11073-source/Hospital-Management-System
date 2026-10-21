import { createContext, useContext, useState, useCallback } from "react";
import PdfPrintModal from "../components/common/PdfPrintModal.jsx";

const PrintModalContext = createContext({
  openPrintPreview: () => {},
  closePrintPreview: () => {},
});

export function PrintModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Clinical Document",
    htmlContent: "",
    refNumber: "",
  });

  const openPrintPreview = useCallback(({ title, htmlContent, refNumber = "" }) => {
    setModalState({
      isOpen: true,
      title: title || "Hospital Document",
      htmlContent: htmlContent || "",
      refNumber,
    });
  }, []);

  const closePrintPreview = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <PrintModalContext.Provider value={{ openPrintPreview, closePrintPreview }}>
      {children}
      <PdfPrintModal
        isOpen={modalState.isOpen}
        onClose={closePrintPreview}
        title={modalState.title}
        htmlContent={modalState.htmlContent}
        refNumber={modalState.refNumber}
      />
    </PrintModalContext.Provider>
  );
}

export function usePrintModal() {
  const context = useContext(PrintModalContext);
  if (!context) {
    throw new Error("usePrintModal must be used within a PrintModalProvider");
  }
  return context;
}

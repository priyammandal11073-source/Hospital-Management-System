/**
 * Unified Printing Utility for Hospital Management System
 * Handles all iframe-based printing with proper isolation, sizing, and timing
 */

// Default print styles to inject into iframes
const DEFAULT_PRINT_STYLES = `
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 16px; font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px 8px; border: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 700; color: #475569; text-align: left; }
    img { max-width: 100%; height: auto; }
    .no-print { display: none !important; }
  </style>
`;

/**
 * Creates a properly configured iframe for printing
 * @returns {HTMLIFrameElement} The configured iframe element
 */
function createPrintIframe() {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-hms-print", "true");
  iframe.setAttribute("title", "Hospital Document Print Canvas");
  iframe.setAttribute("aria-hidden", "true");
  
  // Use proper viewport size for rendering - positioned off-screen but VISIBLE
  iframe.style.cssText = `
    position: fixed !important;
    top: -9999px !important;
    left: -9999px !important;
    width: 1024px !important;
    height: 1440px !important;
    border: 0 !important;
    background: white !important;
    z-index: -1 !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: none !important;
  `;
  
  return iframe;
}

/**
 * Waits for iframe document to be ready
 * @param {HTMLIFrameElement} iframe 
 * @returns {Promise<Document>}
 */
function waitForIframeDocument(iframe) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Iframe document timeout"));
    }, 5000);
    
    const checkReady = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.readyState === "complete") {
          clearTimeout(timeout);
          resolve(doc);
        } else if (doc) {
          iframe.onload = checkReady;
        } else {
          setTimeout(checkReady, 50);
        }
      } catch (e) {
        setTimeout(checkReady, 50);
      }
    };
    
    checkReady();
  });
}

/**
 * Prints HTML content using a properly configured hidden iframe
 * @param {string} html - Complete HTML document to print
 * @param {object} options - Print options
 * @returns {Promise<void>}
 */
export async function printHtml(html, options = {}) {
  const { 
    title = "Hospital Document", 
    cleanupDelay = 3000,
    waitForImages = true 
  } = options;

  // Clean up any existing print iframes
  document.querySelectorAll("iframe[data-hms-print='true']").forEach(el => {
    try { el.remove(); } catch {}
  });

  const iframe = createPrintIframe();
  document.body.appendChild(iframe);

  try {
    const doc = await waitForIframeDocument(iframe);
    
    // Ensure we have a complete HTML document
    const fullHtml = html.includes("<!DOCTYPE html") ? html : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${DEFAULT_PRINT_STYLES}
        </head>
        <body>${html}</body>
      </html>
    `;

    // Set srcdoc and wait for iframe to reload with new content
    await new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      iframe.onload = done;
      iframe.srcdoc = fullHtml;

      // In many modern engines srcdoc readyState becomes complete immediately
      try {
        const currentDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (currentDoc && currentDoc.readyState === "complete") {
          setTimeout(done, 50);
        }
      } catch {}

      // Fallback in case onload doesn't fire
      setTimeout(done, 1500);
    });

    // Get document after srcdoc loads
    const newDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!newDoc) {
      throw new Error("Iframe document not accessible");
    }

    // Wait for images and content to load if requested
    if (waitForImages) {
      await new Promise(resolve => {
        const checkImages = () => {
          const images = newDoc.images;
          let loaded = 0;
          let total = 0;
          
          for (let i = 0; i < images.length; i++) {
            total++;
            if (images[i].complete) loaded++;
          }
          
          if (loaded === total) {
            resolve();
          } else {
            let remaining = total - loaded;
            const onLoad = () => {
              remaining--;
              if (remaining <= 0) {
                for (let i = 0; i < images.length; i++) {
                  images[i].removeEventListener("load", onLoad);
                  images[i].removeEventListener("error", onLoad);
                }
                resolve();
              }
            };
            for (let i = 0; i < images.length; i++) {
              if (!images[i].complete) {
                images[i].addEventListener("load", onLoad);
                images[i].addEventListener("error", onLoad);
              }
            }
            setTimeout(resolve, 2000);
          }
        };
        
        if (newDoc.readyState === "complete") {
          checkImages();
        } else {
          newDoc.addEventListener("readystatechange", () => {
            if (newDoc.readyState === "complete") checkImages();
          });
        }
      });
    }

    // Execute print
    const printWin = iframe.contentWindow;
    if (!printWin) {
      throw new Error("Iframe contentWindow not accessible");
    }
    
    printWin.focus();
    
    // Give browser time to render before printing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    printWin.print();

  } catch (error) {
    console.error("Print failed, falling back to popup:", error);
    // Fallback to popup
    fallbackPopupPrint(html, title);
  } finally {
    // Cleanup after delay
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {}
    }, options.cleanupDelay || 3000);
  }
}

/**
 * Fallback popup window print (for when iframe fails)
 * @param {string} html 
 * @param {string} title 
 */
export function fallbackPopupPrint(html, title = "Hospital Document") {
  try {
    const printWin = window.open("", "_blank", "width=1024,height=1440");
    if (printWin) {
      const fullHtml = html.includes("<!DOCTYPE") ? html : `<!DOCTYPE html><html><head><title>${title}</title>${DEFAULT_PRINT_STYLES}</head><body>${html}</body></html>`;
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        try { printWin.print(); } catch { window.print(); }
      }, 350);
    } else {
      // Popup blocked - last resort
      document.body.insertAdjacentHTML("beforeend", `<div style="display:none">${html}</div>`);
      window.print();
    }
  } catch {
    window.print();
  }
}

/**
 * Prints a specific element by ID using isolation
 * @param {string} elementId - ID of element to print
 * @param {string} title - Document title
 */
export function printElementById(elementId, title = "Document") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element ${elementId} not found for printing`);
    window.print();
    return;
  }
  
  const html = element.outerHTML;
  printHtml(html, { title });
}

/**
 * Generates a complete HTML document for printing receipts/invoices/reports
 * @param {object} data - Document data
 * @param {string} template - Template name or custom HTML
 * @returns {string} Complete HTML document
 */
export function generatePrintDocument(data, template) {
  return template(data);
}

/**
 * Opens a PDF blob in a new window for native printing
 * @param {Blob} blob - PDF blob
 * @param {string} filename - Filename for download fallback
 */
export function openPdfForPrint(blob, filename = "document.pdf") {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default {
  printHtml,
  fallbackPopupPrint,
  printElementById,
  generatePrintDocument,
  openPdfForPrint,
  DEFAULT_PRINT_STYLES
};
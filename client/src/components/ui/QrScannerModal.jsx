import { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";

export const QR_PAYLOAD_PREFIX = "NIVORA-CARE|V1|";

export const buildQrPatientPayload = (patientId) => `${QR_PAYLOAD_PREFIX}${patientId}`;

export const decodeQrPatientPayload = (raw) => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith(QR_PAYLOAD_PREFIX)) {
    return trimmed.slice(QR_PAYLOAD_PREFIX.length).trim() || null;
  }
  return null;
};

const QrScannerModal = ({ isOpen, onClose, onScanned }) => {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scannerRegionId = "qr-scanner-region";
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = isOpen;
    if (!isOpen) return undefined;

    let scanner = null;
    let active = true;

    const stopScanner = async () => {
      if (!scanner) return;
      try {
        await scanner.stop();
      } catch {
        // already stopped
      }
      try {
        scanner.clear();
      } catch {
        // nothing to clear
      }
      scanner = null;
    };

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!active) return;
        const html5QrCode = new Html5Qrcode(scannerRegionId);
        scanner = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (!active) return;
            const patientId = decodeQrPatientPayload(decodedText);
            if (!patientId) {
              setError("Not a recognized Nivora Care patient ID card.");
              return;
            }
            setError("");
            active = false;
            stopScanner().then(() => {
              if (mountedRef.current) onScanned?.(patientId);
            });
          },
          () => {
            // Per-frame decode misses are expected; ignore.
          }
        );
      } catch (err) {
        if (!active) return;
        const message = String(err?.message || err);
        if (message.includes("NotFoundError") || message.includes("no camera")) {
          setError("No camera detected. Use the patient search or QR card code instead.");
        } else if (message.includes("NotAllowedError")) {
          setError("Camera permission denied. Allow camera access and try again.");
        } else {
          setError("Unable to start camera. Try granting camera permission or use search.");
        }
        try {
          html5QrCode.clear();
        } catch {
          // ignore
        }
      }
    };

    setError("");
    setBusy(true);
    startScanner().finally(() => setBusy(false));

    return () => {
      active = false;
      stopScanner();
    };
  }, [isOpen, onScanned]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Patient QR ID" className="max-w-md">
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Position the patient&apos;s QR identity card inside the frame. The card-scan finds the
          record instantly at reception, wards, and billing.
        </p>
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center"
          style={{ aspectRatio: "1 / 1", maxHeight: 360 }}>
          <div id={scannerRegionId} className="w-full h-full" />
        </div>
        {busy && <p className="text-xs text-slate-400 text-center">Starting camera…</p>}
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold hover:bg-slate-900 transition-colors touch-target cursor-pointer"
        >
          Close Scanner
        </button>
      </div>
    </Modal>
  );
};

export default QrScannerModal;
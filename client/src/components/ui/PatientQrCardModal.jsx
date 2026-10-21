import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Modal from "./Modal.jsx";
import { buildQrPatientPayload } from "./QrScannerModal.jsx";

const PatientQrCardModal = ({ isOpen, onClose, patient }) => {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!isOpen || !patient?._id) return undefined;
    let cancelled = false;
    QRCode.toDataURL(buildQrPatientPayload(patient._id), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 260,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, patient?._id]);

  if (!isOpen) return null;

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `patient-qr-${patient._id}.png`;
    link.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient QR Identity Card" className="max-w-sm">
      <div className="space-y-3">
        <div className="rounded-3xl border border-slate-200 overflow-hidden bg-gradient-to-br from-white to-slate-50 shadow-sm">
          <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Nivora Care Hospital</span>
            <span className="text-teal-100 text-[10px] font-semibold uppercase tracking-wider">Patient ID</span>
          </div>
          <div className="p-4 flex gap-4 items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR identity for ${patient?.name || "patient"}`}
                className="h-28 w-28 rounded-xl border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="h-28 w-28 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-[10px] text-slate-400">
                Generating…
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-bold text-slate-900">{patient?.name || "Patient"}</p>
              <p className="text-[11px] text-slate-500">ID: {(patient?._id || "").slice(-8).toUpperCase()}</p>
              <div className="flex flex-wrap gap-1">
                {patient?.bloodGroup && (
                  <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                    {patient.bloodGroup}
                  </span>
                )}
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {patient?.gender || "—"} · {patient?.age || "—"}y
                </span>
              </div>
              {patient?.allergies?.length > 0 && (
                <p className="text-[10px] font-semibold text-amber-700 truncate">
                  ⚠ {patient.allergies.join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="px-4 pb-3 text-center">
            <p className="text-[9px] text-slate-400 font-mono">
              {buildQrPatientPayload(patient?._id || "")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadQr}
          disabled={!qrDataUrl}
          className="w-full rounded-xl bg-teal-700 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50 touch-target cursor-pointer"
        >
          Download QR Image
        </button>
        <p className="text-[11px] text-slate-500">
          Scan this card at any station (reception, wards, pharmacy, billing) to instantly open the
          patient&apos;s record.
        </p>
      </div>
    </Modal>
  );
};

export default PatientQrCardModal;
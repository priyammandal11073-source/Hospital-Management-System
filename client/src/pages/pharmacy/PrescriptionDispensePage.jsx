import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getPrescriptionQueue,
  getPrescriptionForDispensing,
  dispensePrescription,
  flagPrescriptionIssue,
} from "../../services/api.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generatePharmacyReceiptHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";

export default function PrescriptionDispensePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openPrintPreview } = usePrintModal();

  const handlePrintReceipt = () => {
    if (!dispenseResult || !prescription) return;
    const html = generatePharmacyReceiptHtml({
      prescription,
      dispenseResult,
      patient: prescription?.patient,
      doctor: prescription?.doctor,
      medicines: prescription?.medicines,
      receiptNumber: dispenseResult?.receiptNumber,
      paymentMethod,
      totalAmount: dispenseResult?.totalAmount || prescription?.totalAmount,
    });
    openPrintPreview({
      title: `Pharmacy Receipt - ${dispenseResult.receiptNumber || "Dispense"}`,
      htmlContent: html,
      refNumber: dispenseResult.receiptNumber || "RX-RCPT",
    });
  };

  // Selection list if no ID provided in params
  const [allQueue, setAllQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dispensing details state
  const [prescription, setPrescription] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [medicineBatches, setMedicineBatches] = useState({});
  const [selectedBatches, setSelectedBatches] = useState({});
  const [quantities, setQuantities] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [allergyAcknowledged, setAllergyAcknowledged] = useState(false);
  const [dispenseNotes, setDispenseNotes] = useState("");

  // Flag doctor modal
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("Potential drug-drug interaction");
  const [flagNotes, setFlagNotes] = useState("");

  // Result & Receipt state
  const [dispenseResult, setDispenseResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadPrescriptionDetails(id);
    } else {
      loadQueueList();
    }
  }, [id]);

  const loadQueueList = async () => {
    setIsLoading(true);
    try {
      const data = await getPrescriptionQueue();
      setAllQueue(data.prescriptions || []);
    } catch (err) {
      setError("Failed to load queue.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrescriptionDetails = async (prescriptionId) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPrescriptionForDispensing(prescriptionId);
      const prescription = data.prescription;
      setPrescription(prescription);
      setInventoryItems(data.inventoryItems || []);

      // Build medicineBatches object from medications' batches arrays
      const medications = prescription?.medications || prescription?.medicines || [];
      const batchesMap = {};
      medications.forEach((med, idx) => {
        const medKey = med._id || `med_${idx}`;
        if (med.batches && Array.isArray(med.batches)) {
          batchesMap[medKey] = med.batches.map(b => ({
            _id: b._id || b.batchNumber,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            currentStock: b.quantity,
            price: b.price,
            sellingPrice: b.price,
            unitPrice: b.price,
          }));
        }
      });
      setMedicineBatches(batchesMap);

      // Auto-populate default batches and quantities
      const initialSelected = {};
      const initialQtys = {};

      medications.forEach((med, idx) => {
        const medKey = med._id || `med_${idx}`;
        const available = batchesMap[medKey] || [];
        // Pick the first non-expired batch
        const validBatch = available.find((b) => new Date(b.expiryDate) > new Date()) || available[0];
        if (validBatch) {
          initialSelected[medKey] = validBatch._id;
        }
        // Default quantity from prescription
        initialQtys[medKey] = med.requestedQuantity || med.quantity || 10;
      });

      setSelectedBatches(initialSelected);
      setQuantities(initialQtys);

      // If already dispensed, show receipt mode
      if (prescription?.dispensingStatus === "dispensed") {
        setDispenseResult({
          receiptNumber: prescription.pharmacyReceiptNumber || `RX-DISP-${prescriptionId.slice(-6).toUpperCase()}`,
          dispensedAt: prescription.dispensedAt || prescription.updatedAt,
        });
      }
    } catch (err) {
      console.error("Error loading prescription details:", err);
      setError(err.response?.data?.message || "Failed to load prescription details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!prescription) return;

    // Allergy check safeguard
    const hasAllergies = prescription.patient?.allergies && prescription.patient.allergies.length > 0;
    if (hasAllergies && !allergyAcknowledged) {
      alert("⚠️ Clinical Safeguard: Please verify and acknowledge the patient's recorded allergies before dispensing.");
      return;
    }

    // Build dispense items payload matching backend expectations
    const medications = prescription.medications || prescription.medicines || [];
    const itemsToDispense = medications.map((med, idx) => {
      const medKey = med._id || `med_${idx}`;
      const selectedBatchId = selectedBatches[medKey];
      const availableBatches = medicineBatches[medKey] || [];
      const selectedBatch = availableBatches.find(b => b._id === selectedBatchId) || availableBatches[0];
      
      return {
        medicineName: med.name,
        dispensedQuantity: Number(quantities[medKey]) || med.requestedQuantity || 10,
        requestedQuantity: med.requestedQuantity || 10,
        unitPrice: selectedBatch?.price || selectedBatch?.unitPrice || selectedBatch?.sellingPrice || 10,
        batchId: selectedBatchId || null,
        batchNumber: selectedBatch?.batchNumber || "",
        inventoryId: med.inventoryId || null,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions,
      };
    });

    // Check for expired batch selection
    for (const item of itemsToDispense) {
      if (item.batchId) {
        const allB = Object.values(medicineBatches).flat();
        const found = allB.find((b) => b._id === item.batchId);
        if (found && new Date(found.expiryDate) <= new Date()) {
          alert(`🚫 Cannot dispense expired batch (${found.batchNumber}) for ${item.medicineName}. Please select a valid batch.`);
          return;
        }
      }
    }

    // Validate all items have required fields
    for (const item of itemsToDispense) {
      if (!item.medicineName) {
        alert("Medicine name is required for all items");
        return;
      }
      if (!item.dispensedQuantity || item.dispensedQuantity <= 0) {
        alert(`Invalid quantity for ${item.medicineName}`);
        return;
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        alert(`Invalid unit price for ${item.medicineName}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await dispensePrescription(prescription._id, {
        items: itemsToDispense,
        paymentMethod,
        pharmacistNotes: dispenseNotes,
        allergyWarningAcknowledged: allergyAcknowledged,
      });

      setDispenseResult(res);
      alert(`Medication dispensed successfully! Receipt #${res.receiptNumber}`);
    } catch (err) {
      console.error("Dispense error:", err);
      alert("Dispensing failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!prescription) return;
    setIsSubmitting(true);
    try {
      await flagPrescriptionIssue(prescription._id, {
        reason: flagReason,
        notes: flagNotes,
      });
      alert(`Prescription placed ON HOLD. ${formatDoctorName(prescription.doctor?.name, "Physician in charge")} has been notified.`);
      setShowFlagModal(false);
      navigate("/pharmacy/queue");
    } catch (err) {
      alert("Failed to flag issue: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no ID selected, render queue selector
  if (!id) {
    const filtered = allQueue.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.patient?.name?.toLowerCase().includes(q) ||
        p.doctor?.name?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Select Prescription to Dispense</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Scan barcode, enter token number, or select an active order from the doctor queue.
            </p>
          </div>
          <Link
            to="/pharmacy/queue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            ← View Full Queue
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient Name, Doctor, or Prescription ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pl-10 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item._id} className="py-3.5 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700">RX-{item._id.slice(-6).toUpperCase()}</span>
                    <span className="font-bold text-slate-900">{item.patient?.name}</span>
                    <span className="text-[10px] text-slate-400">({item.patient?.gender || "—"}, {item.patient?.age || "—"} yrs)</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Prescribed by {formatDoctorName(item.doctor?.name)} • {item.medicines?.length || 0} medication(s)
                  </div>
                </div>
                <Link
                  to={`/pharmacy/dispense/${item._id}`}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-slate-950 transition shadow-xs"
                >
                  Dispense →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="h-10 w-10 mx-auto border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold">Fetching clinical prescription and matching batches...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 max-w-md mx-auto">
          <p className="text-sm font-bold text-red-700">{error || "Prescription not found"}</p>
          <Link to="/pharmacy/queue" className="mt-4 inline-block text-xs font-bold text-amber-600 underline">
            Return to Prescription Queue
          </Link>
        </div>
      </div>
    );
  }

  const patientAllergies = prescription.patient?.allergies || [];
  const hasAllergies = Array.isArray(patientAllergies) ? patientAllergies.length > 0 : Boolean(patientAllergies);

// If dispensed, render the printable receipt view
  if (dispenseResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <Link
            to="/pharmacy/queue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← Back to Queue
          </Link>
          <button
            onClick={handlePrintReceipt}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 002-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 002-2H9a2 2 0 00-2-2v4a2 2 0 002 2z" />
            </svg>
            <span>Print Official Pharmacy Receipt</span>
          </button>
        </div>

        {/* Printable Official Receipt Card - clinical-print-sheet ensures it prints correctly */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md font-sans text-xs space-y-6 print:m-0 print:border-none print:shadow-none clinical-print-sheet">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">Nivora Care Hospital</h2>
            <p className="text-xs font-bold text-slate-600">Central Inpatient & Outpatient Pharmacy</p>
            <p className="text-[11px] text-slate-400">GSTIN: 27AAAAA0000A1Z5 | Drug Lic. No: MH-MZ2-109482 / 109483</p>
            <p className="text-[11px] text-slate-400">24x7 Emergency Contact: +91 (22) 2854-9900</p>
          </div>

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Dispense Receipt No.</p>
              <p className="font-mono font-bold text-slate-900 text-sm">{dispenseResult.receiptNumber}</p>
              <p className="text-slate-400 text-[10px] uppercase font-bold mt-2">Original Prescription</p>
              <p className="font-mono text-slate-700">RX-{prescription._id.slice(-6).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Dispense Date & Time</p>
              <p className="font-medium text-slate-900">
                {new Date(dispenseResult.dispensedAt || Date.now()).toLocaleString("en-IN")}
              </p>
              <p className="text-slate-400 text-[10px] uppercase font-bold mt-2">Payment Status</p>
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                PAID ({paymentMethod.toUpperCase()})
              </span>
            </div>
          </div>

          {/* Patient & Doctor Box */}
          <div className="rounded-xl bg-slate-50 p-4 grid grid-cols-2 gap-4 border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Patient Details</p>
              <p className="font-bold text-slate-900 text-sm">{prescription.patient?.name}</p>
              <p className="text-slate-500">
                {prescription.patient?.gender} • {prescription.patient?.age} yrs • Blood: {prescription.patient?.bloodGroup || "O+"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Prescribing Physician</p>
              <p className="font-bold text-slate-900">{formatDoctorName(prescription.doctor?.name)}</p>
              <p className="text-slate-500">{prescription.doctor?.specialization || "Clinical OPD"}</p>
            </div>
          </div>

          {/* Medication Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">Batch #</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(prescription.medications || prescription.medicines || []).map((m, i) => {
                  const qty = quantities[m._id || `med_${i}`] || 10;
                  const rate = 15.5; // Demo rate
                  const amount = qty * rate;
                  return (
                    <tr key={i} className="py-2">
                      <td className="py-2.5">
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.dosage} • {m.instructions}</p>
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">BAT-2026-09A</td>
                      <td className="py-2.5 text-center font-semibold text-slate-800">{qty}</td>
                      <td className="py-2.5 text-right text-slate-600">₹{rate.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">₹{amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer & Totals */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">Dispensed by: Central Pharmacist</p>
              <p>Verify seal and batch before consumption. Keep out of reach of children.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Bill Amount</p>
              <p className="text-xl font-black text-slate-900">
                ₹{((prescription.medicines?.length || 1) * 10 * 15.5).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dispense Form
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-600">RX-{prescription._id.slice(-6).toUpperCase()}</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
              {prescription.dispensingStatus || "Pending Verification"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prescription Verification & Dispensing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Check clinical indications, match inventory batches, verify allergies, and deduct stock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/pharmacy/queue"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            ← Back to Queue
          </Link>
          <button
            type="button"
            onClick={() => setShowFlagModal(true)}
            className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-700 transition"
          >
            Contact Doctor / Flag Issue
          </button>
        </div>
      </div>

      {/* Prominent Allergy Alert Banner */}
      {hasAllergies && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-xl flex-shrink-0 animate-bounce">
              ⚠️
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                Critical Clinical Safeguard: Known Patient Allergies
              </h2>
              <p className="mt-1 text-xs font-bold text-rose-800">
                Patient has recorded hypersensitivity:{" "}
                <span className="underline">
                  {Array.isArray(patientAllergies) ? patientAllergies.join(", ") : patientAllergies}
                </span>
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Carefully cross-check the prescribed active pharmaceutical ingredients and excipients before dispensing.
              </p>

              <label className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allergyAcknowledged}
                  onChange={(e) => setAllergyAcknowledged(e.target.checked)}
                  className="h-4 w-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
                />
                <span>I have clinically verified that prescribed drugs do not cross-react with the patient's recorded allergies.</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Patient & Doctor Read-Only Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Patient card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Details</p>
          <p className="mt-1 text-base font-black text-slate-900">{prescription.patient?.name}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <p>Gender: <span className="font-semibold text-slate-800">{prescription.patient?.gender || "—"}</span></p>
            <p>Age: <span className="font-semibold text-slate-800">{prescription.patient?.age || "—"} years</span></p>
            <p>Blood Group: <span className="font-semibold text-slate-800">{prescription.patient?.bloodGroup || "O+"}</span></p>
            <p>Phone: <span className="font-semibold text-slate-800">{prescription.patient?.contact || "+91 98765 43210"}</span></p>
          </div>
        </div>

        {/* Doctor & Clinical diagnosis card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prescribing Physician</p>
          <p className="mt-1 text-base font-black text-slate-900">{formatDoctorName(prescription.doctor?.name)}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <p>Specialization: <span className="font-semibold text-slate-800">{prescription.doctor?.specialization || "Clinical OPD"}</span></p>
            <p>Clinical Diagnosis: <span className="font-semibold text-slate-800">{prescription.diagnosis || "Upper Respiratory Tract Infection"}</span></p>
            <p>Clinical Notes: <span className="text-slate-500 italic">{prescription.notes || "Complete prescribed course as directed."}</span></p>
          </div>
          <div className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] font-medium text-amber-800 border border-amber-200">
            🔒 Clinical Safeguard: Pharmacists cannot alter physician diagnoses or orders directly. Use "Contact Doctor" for discrepancies.
          </div>
        </div>
      </div>

      {/* Dispensing Form & Batch Allocation */}
      <form onSubmit={handleDispense} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-900">Medication Items & Batch Allocation</h2>
            <p className="text-xs text-slate-500">
              Select non-expired batches for stock deduction. Expired batches are automatically blocked.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
{(prescription.medications || prescription.medicines || []).map((med, idx) => {
                const medKey = med._id || `med_${idx}`;
                const availableBatches = medicineBatches[medKey] || [];
                const selectedBatchId = selectedBatches[medKey];

              return (
                <div key={idx} className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{med.name}</h3>
                      <p className="text-xs text-slate-500">
                        Prescribed Dosage: <span className="font-semibold text-slate-700">{med.dosage}</span> • Frequency:{" "}
                        <span className="font-semibold text-slate-700">{med.frequency || "1-0-1"}</span> • Duration:{" "}
                        <span className="font-semibold text-slate-700">{med.duration || "5 days"}</span>
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      Sig: {med.instructions || "After meals"}
                    </div>
                  </div>

                  {/* Batch Selection & Quantity Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Select Batch (FIFO)</label>
                      <select
                        value={selectedBatchId || ""}
                        onChange={(e) =>
                          setSelectedBatches((prev) => ({ ...prev, [medKey]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                      >
                        {availableBatches.length === 0 ? (
                          <option value="">Default Batch BAT-2026-09A (Exp: Dec 2026, Stock: 250)</option>
                        ) : (
                          availableBatches.map((b) => {
                            const isExpired = new Date(b.expiryDate) <= new Date();
                            return (
                              <option key={b._id} value={b._id} disabled={isExpired}>
                                Batch #{b.batchNumber} — Exp: {new Date(b.expiryDate).toLocaleDateString()} — Stock: {b.currentStock} {isExpired ? "(EXPIRED)" : ""}
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Quantity to Dispense (Units)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantities[medKey] || 10}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [medKey]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Dispensing Notes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-amber-500 focus:outline-none"
            >
              <option value="cash">Cash Settlement</option>
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI / QR Code</option>
              <option value="insurance">Health Insurance / TPA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacist Dispensing Remarks</label>
            <input
              type="text"
              value={dispenseNotes}
              onChange={(e) => setDispenseNotes(e.target.value)}
              placeholder="E.g., Counseled patient on taking with water after food."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/pharmacy/queue"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md transition-all duration-150 disabled:opacity-50 hover:scale-105"
          >
            {isSubmitting ? "Processing Dispensation..." : "Confirm & Dispense Medication"}
          </button>
        </div>
      </form>

      {/* Flag Issue Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                Flag Issue to {formatDoctorName(prescription.doctor?.name)}
              </h3>
              <button onClick={() => setShowFlagModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleFlagSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-xs"
                >
                  <option value="Potential drug-drug interaction">Potential drug-drug interaction</option>
                  <option value="Known patient allergy conflict">Known patient allergy conflict</option>
                  <option value="Dosage or frequency anomaly">Dosage or frequency anomaly</option>
                  <option value="Prescribed medicine out of stock (substitute recommended)">
                    Prescribed medicine out of stock (substitute recommended)
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clarification Note</label>
                <textarea
                  rows="3"
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  required
                  placeholder="Detail the clinical concern for the doctor..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFlagModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700"
                >
                  {isSubmitting ? "Submitting..." : "Put Prescription On Hold"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

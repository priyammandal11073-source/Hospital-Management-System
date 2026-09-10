import { useEffect, useState } from "react";
import {
  getDiagnosticSamples,
  collectDiagnosticSample,
  updateDiagnosticSampleStatus,
} from "../../services/api.js";

export default function SampleCollectionPage() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeBarcodeSample, setActiveBarcodeSample] = useState(null);

  // Collection modal state
  const [collectingSample, setCollectingSample] = useState(null);
  const [location, setLocation] = useState("Phlebotomy Station 1");
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("Hemolyzed Specimen");

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getDiagnosticSamples(params);
      if (res.success) {
        setSamples(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load samples");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [statusFilter]);

  const handleConfirmCollection = async (e) => {
    e.preventDefault();
    if (!collectingSample) return;
    try {
      await collectDiagnosticSample({
        orderId: collectingSample.order?._id || collectingSample.order,
        collectionLocation: location,
        collectorNotes: "Specimen collected as per standard phlebotomy protocol.",
      });
      setCollectingSample(null);
      fetchSamples();
    } catch (err) {
      alert("Collection failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionModal) return;
    try {
      await updateDiagnosticSampleStatus(rejectionModal._id, {
        status: "Rejected",
        rejectionReason,
      });
      setRejectionModal(null);
      fetchSamples();
    } catch (err) {
      alert("Failed to reject sample: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAcceptInLab = async (sampleId) => {
    try {
      await updateDiagnosticSampleStatus(sampleId, { status: "In Lab" });
      fetchSamples();
    } catch (err) {
      alert("Failed to transfer to lab: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Phlebotomy & Sample Collection Station
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Specimen accessioning, vacutainer labeling, barcode tracking, and lab handover
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All Sample Statuses</option>
            <option value="Pending Collection">Pending Collection</option>
            <option value="Collected">Collected (Ready for Lab)</option>
            <option value="In Lab">In Lab Processing</option>
            <option value="Rejected">Rejected (Recollection)</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Loading phlebotomy specimen list...
          </div>
        ) : samples.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No specimen samples currently matching status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Sample ID / Barcode</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Investigation Test</th>
                  <th className="p-3.5">Specimen Type & Container</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {samples.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{s.sampleId}</span>
                        <button
                          type="button"
                          onClick={() => setActiveBarcodeSample(s)}
                          className="rounded p-1 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                          title="View Barcode Label"
                        >
                          🏷️
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Order: {s.order?.orderNumber || "Ref Order"}
                      </p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{s.patientName}</p>
                      <p className="text-[11px] text-slate-400">Station: {s.collectionLocation}</p>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{s.testName}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-700">{s.sampleType}</p>
                      <span className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
                        {s.containerType}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        s.status === "Completed" || s.status === "In Lab"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : s.status === "Collected"
                          ? "bg-teal-50 text-teal-700 border border-teal-200"
                          : s.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {s.status}
                      </span>
                      {s.status === "Rejected" && s.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate max-w-[140px]">
                          Reason: {s.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1.5">
                      {s.status === "Pending Collection" && (
                        <button
                          type="button"
                          onClick={() => setCollectingSample(s)}
                          className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Collect Sample
                        </button>
                      )}
                      {s.status === "Collected" && (
                        <button
                          type="button"
                          onClick={() => handleAcceptInLab(s._id)}
                          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        >
                          Accept In Lab
                        </button>
                      )}
                      {s.status !== "Completed" && s.status !== "Rejected" && (
                        <button
                          type="button"
                          onClick={() => setRejectionModal(s)}
                          className="rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 px-2 py-1 text-[11px] font-semibold cursor-pointer transition"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= BARCODE PREVIEW MODAL ================= */}
      {activeBarcodeSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-900">Specimen Barcode Tag</h4>
              <button
                type="button"
                onClick={() => setActiveBarcodeSample(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Label Simulation */}
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 bg-slate-50 text-center space-y-2">
              <p className="text-xs font-black text-slate-900 tracking-wider">
                NIVORA CARE CENTRAL LAB
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                {/* Simulated Barcode Stripes */}
                <div className="flex items-center justify-center gap-1 h-12 py-1 px-4 bg-slate-100 rounded">
                  {[4, 2, 6, 2, 4, 3, 2, 5, 2, 4, 6, 2, 3, 4, 2, 5, 2, 4, 3].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <p className="font-mono text-xs font-bold text-slate-800 tracking-widest mt-1">
                  *{activeBarcodeSample.sampleId}*
                </p>
              </div>

              <div className="text-left text-[11px] text-slate-600 space-y-0.5 pt-1">
                <p><strong className="text-slate-800">Patient:</strong> {activeBarcodeSample.patientName}</p>
                <p><strong className="text-slate-800">Test:</strong> {activeBarcodeSample.testName}</p>
                <p><strong className="text-slate-800">Container:</strong> {activeBarcodeSample.containerType}</p>
                <p><strong className="text-slate-800">Collected:</strong> {new Date(activeBarcodeSample.collectionTime || Date.now()).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => alert("Label sent to Zebra ZD420 Phlebotomy Barcode Printer!")}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold cursor-pointer transition shadow-sm"
              >
                🖨️ Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SAMPLE COLLECTION MODAL ================= */}
      {collectingSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Phlebotomy Collection</h3>
            <p className="text-xs text-slate-500 mb-4">
              Accession sample for <strong>{collectingSample.patientName}</strong>
            </p>

            <form onSubmit={handleConfirmCollection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  disabled
                  value={collectingSample.testName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Vacutainer</label>
                <input
                  type="text"
                  disabled
                  value={`${collectingSample.sampleType} — ${collectingSample.containerType}`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-indigo-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collection Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Phlebotomy Station 1">Phlebotomy Station 1 (OPD)</option>
                  <option value="Phlebotomy Station 2">Phlebotomy Station 2 (OPD)</option>
                  <option value="IPD Bedside Phlebotomy">IPD Bedside Phlebotomy</option>
                  <option value="Emergency Phlebotomy Bay">Emergency Phlebotomy Bay</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingSample(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 text-xs font-bold shadow-sm"
                >
                  Confirm Collection & Generate Barcode →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REJECTION MODAL ================= */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-900 mb-1">Reject Specimen (Request Recollection)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Rejecting sample {rejectionModal.sampleId} for {rejectionModal.patientName}
            </p>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 text-xs font-semibold text-rose-800 outline-none"
                >
                  <option value="Hemolyzed Specimen">Hemolyzed Specimen</option>
                  <option value="Insufficient Specimen Volume (QNS)">Insufficient Specimen Volume (QNS)</option>
                  <option value="Clotted EDTA Specimen">Clotted EDTA Specimen</option>
                  <option value="Incorrect Container Type Used">Incorrect Container Type Used</option>
                  <option value="Mislabeled / Missing Barcode">Mislabeled / Missing Barcode</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectionModal(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 text-xs font-bold shadow-sm"
                >
                  Reject & Flag Recollection →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

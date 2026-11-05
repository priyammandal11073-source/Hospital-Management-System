import { useEffect, useState } from "react";
import {
  getDiagnosticSamples,
  collectDiagnosticSample,
  updateDiagnosticSampleStatus,
} from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function SampleCollectionPage() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      toastError("Collection failed: " + (err.response?.data?.message || err.message));
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
      toastError("Failed to reject sample: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAcceptInLab = async (sampleId) => {
    try {
      await updateDiagnosticSampleStatus(sampleId, { status: "In Lab" });
      fetchSamples();
    } catch (err) {
      toastError("Failed to transfer to lab: " + (err.response?.data?.message || err.message));
    }
  };

  const toastError = (msg) => {
    const el = document.createElement("div");
    el.className = "fixed top-6 right-6 z-50 bg-rose-500 text-white px-4 py-2 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  };

  const statusColors = {
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "In Lab": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Collected: "bg-teal-50 text-teal-700 border border-teal-200",
    Rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    default: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  if (loading) {
    return <PageLoader message="Loading phlebotomy specimen list…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phlebotomy & Sample Collection Station"
        subtitle="Specimen accessioning, vacutainer labeling, barcode tracking, and lab handover"
        actions={[
          <Button key="filter" size="sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100"
            >
              <option value="">All Sample Statuses</option>
              <option value="Pending Collection">Pending Collection</option>
              <option value="Collected">Collected (Ready for Lab)</option>
              <option value="In Lab">In Lab Processing</option>
              <option value="Rejected">Rejected (Recollection)</option>
              <option value="Completed">Completed</option>
            </select>
          </Button>,
        ]}
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {samples.length === 0 ? (
          <EmptyStateCard
            icon="🧪"
            title="No specimen samples currently matching status."
            description="Adjust your status filter to view available specimens."
          />
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
                    <td className="p-3.5 pl-5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{s.sampleId}</span>
                        <button
                          type="button"
                          onClick={() => setCollectingSample(s)}
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
                      <Badge
                        status={
                          s.status === "Completed" || s.status === "In Lab"
                            ? "Completed"
                            : s.status === "Collected"
                            ? "Collected"
                            : s.status === "Rejected"
                            ? "Rejected"
                            : "Pending"
                        }
                      />
                      {s.status === "Rejected" && s.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate max-w-[140px]">
                          Reason: {s.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-1.5">
                      {s.status === "Pending Collection" && (
                        <Button variant="outline" size="sm" onClick={() => setCollectingSample(s)}>
                          Collect Sample
                        </Button>
                      )}
                      {s.status === "Collected" && (
                        <Button variant="outline" size="sm" onClick={() => handleAcceptInLab(s._id)}>
                          Accept In Lab
                        </Button>
                      )}
                      {s.status !== "Completed" && s.status !== "Rejected" && (
                        <Button variant="danger" size="sm" onClick={() => setRejectionModal(s)}>
                          Reject
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {collectingSample && (
        <Modal
          isOpen={Boolean(collectingSample)}
          onClose={() => setCollectingSample(null)}
          title="Confirm Phlebotomy Collection"
          subtitle={`Accession sample for ${collectingSample.patientName}`}
          className="max-w-md"
        >
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
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <Button variant="outline" size="sm" onClick={handleConfirmCollection} type="submit">
                Confirm Collection & Generate Barcode →
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {rejectionModal && (
        <Modal
          isOpen={Boolean(rejectionModal)}
          onClose={() => setRejectionModal(null)}
          title="Reject Specimen (Request Recollection)"
          subtitle={`Rejecting sample ${rejectionModal.sampleId} for ${rejectionModal.patientName}`}
          className="max-w-md"
        >
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
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <Button variant="danger" size="sm" type="submit">
                Reject & Flag Recollection →
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

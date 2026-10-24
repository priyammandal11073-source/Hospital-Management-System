import { useEffect, useState, useMemo } from "react";
import PrescriptionForm from "../components/PrescriptionForm.jsx";
import PrescriptionModal from "../components/PrescriptionModal.jsx";
import MedicationAdminModal from "../components/MedicationAdminModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getPrescriptions, getPrescriptionById, deletePrescription } from "../services/api.js";
import { getDoctorDisplayName, formatDoctorName } from "../utils/doctorName.js";
import { PageHeader, ConfirmDialog, SkeletonTable, ActionDropdown } from "../components/ui/index.js";
import { toast } from "../utils/toast.js";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Prescriptions() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const canDelete = ["admin", "doctor"].includes(user?.role);

  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prescriptionToEdit, setPrescriptionToEdit] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [administerRx, setAdministerRx] = useState(null);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPrescriptions({ search: searchQuery });
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load prescriptions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [searchQuery]);

  const handleOpenModal = async (rx) => {
    try {
      const full = await getPrescriptionById(rx._id);
      setSelectedPrescription(full.prescription);
    } catch (err) {
      setSelectedPrescription(rx);
    }
  };

  const handleEdit = async (rx) => {
    try {
      const full = await getPrescriptionById(rx._id);
      setPrescriptionToEdit(full.prescription);
    } catch (err) {
      setPrescriptionToEdit(rx);
    }
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    setPrescriptionToDelete(id);
  };

  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) return;
    setIsDeleting(true);
    setError("");
    try {
      await deletePrescription(prescriptionToDelete);
      setPrescriptions((prev) => prev.filter((p) => p._id !== prescriptionToDelete));
      setPrescriptionToDelete(null);
      setSuccessMessage("Prescription record deleted successfully.");
      toast.success("Prescription record deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 4500);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete prescription.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const totalMeds = prescriptions.reduce((acc, p) => acc + (p.medications?.length || 0), 0);
    const abhaLinked = prescriptions.filter((p) => p.patient?.abhaId).length;
    return { total, totalMeds, abhaLinked };
  }, [prescriptions]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={isDoctor ? "My Clinical Prescriptions (Rx)" : "Clinical Prescriptions (Rx)"}
        subtitle={
          isDoctor
            ? `Digital clinical prescriptions authored by ${formatDoctorName(user?.name, "Doctor")}`
            : "Generate, print, and share digital clinical prescriptions on official Nivora Care letterhead"
        }
        action={
          isDoctor ? (
            <button
              type="button"
              onClick={() => {
                setPrescriptionToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm shadow-teal-700/20 active:scale-98"
            >
              <span className="text-base font-black">℞</span>
              <span>Generate new prescription</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-600">
              🔒 Read-only directory (Physicians author Rx)
            </span>
          )
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total prescriptions</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1.5">{stats.total}</p>
          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Active digital records
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Medications prescribed</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-1.5">{stats.totalMeds}</p>
          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Dispensation orders
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs ring-1 ring-slate-200/60">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ABHA connected</p>
          <p className="text-3xl font-extrabold text-sky-700 mt-1.5">{stats.abhaLinked}</p>
          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              National health ID linked
            </span>
          </div>
        </div>
      </div>

      {/* Form Drawer / Container */}
      {isFormOpen && (
        <div className="my-6">
          <PrescriptionForm
            prescriptionToEdit={prescriptionToEdit}
            onSuccess={(newOrUpdated) => {
              const wasEdit = Boolean(prescriptionToEdit);
              setIsFormOpen(false);
              setPrescriptionToEdit(null);
              fetchPrescriptions();
              setSuccessMessage(wasEdit ? "Prescription updated successfully." : "New digital prescription issued and recorded.");
              setTimeout(() => setSuccessMessage(""), 4500);
              if (newOrUpdated) setSelectedPrescription(newOrUpdated);
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setPrescriptionToEdit(null);
            }}
          />
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-2xs"
        >
          <span className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-xs text-emerald-800">
              ✓
            </span>
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-600 hover:text-emerald-900 ml-2 font-bold"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Rx number, patient name, ABHA ID, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          type="button"
          onClick={fetchPrescriptions}
          className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Prescriptions List / Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs ring-1 ring-slate-200/60">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} cols={5} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs font-semibold text-rose-700 bg-rose-50 border-b border-rose-100">
            {error}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-black text-xl mb-3 border border-teal-200">
              ℞
            </div>
            <h3 className="text-sm font-bold text-slate-900">No prescriptions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Generate a clinical digital prescription for a patient or consultation.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
            >
              Generate first prescription
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rx number & date</th>
                  <th className="py-3.5 px-4">Patient details</th>
                  <th className="py-3.5 px-4">Consulting doctor</th>
                  <th className="py-3.5 px-4">Provisional diagnosis</th>
                  <th className="py-3.5 px-4">℞ Medications</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {prescriptions.map((rx) => {
                  const patient = rx.patient || {};
                  const doctor = rx.doctor || {};
                  const meds = rx.medications || [];

                  return (
                    <tr
                      key={rx._id}
                      className="hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-teal-800 text-xs px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                          {rx.prescriptionNumber}
                        </span>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          {formatDate(rx.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {patient.name || "Patient"}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"}
                        </div>
                        {patient.abhaId && (
                          <div className="inline-flex items-center gap-1 mt-0.5 font-mono text-[10px] text-emerald-700 font-semibold">
                            <span>ABHA:</span>
                            <span>{patient.abhaId}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {getDoctorDisplayName(doctor, "Consultant")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {doctor.specialization || doctor.department || "OPD"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={rx.diagnosis}>
                          {rx.diagnosis}
                        </div>
                        {rx.followUpDate && (
                          <div className="text-[11px] font-semibold text-teal-700 mt-0.5">
                            Follow-up: {formatDate(rx.followUpDate)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          <span className="font-black text-teal-700">℞</span>
                          {meds.length} {meds.length === 1 ? "medicine" : "medicines"}
                        </span>
                        <div className="text-[11px] text-slate-600 font-medium truncate max-w-[190px] mt-1" title={meds.map((m) => m.name).join(", ")}>
                          {meds.map((m) => m.name.split(" ")[0]).join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(rx)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.97] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                            title="View official prescription"
                          >
                            <span>View / Print</span>
                            <span className="text-slate-400">→</span>
                          </button>

                          <ActionDropdown
                            align="right"
                            items={[
                              {
                                label: "Administer eMAR Dose",
                                icon: "💊",
                                onClick: () => setAdministerRx(rx),
                              },
                              ...(isDoctor
                                ? [
                                    {
                                      label: "Edit Clinical Rx",
                                      icon: "✎",
                                      onClick: () => handleEdit(rx),
                                    },
                                  ]
                                : []),
                              ...(canDelete
                                ? [
                                    { divider: true },
                                    {
                                      label: "Delete Prescription Record",
                                      icon: "🗑",
                                      danger: true,
                                      onClick: () => handleDelete(rx._id),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription View / Print Modal */}
      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      {/* Medication Administration (eMAR) Modal */}
      {administerRx && (
        <MedicationAdminModal
          prescription={administerRx}
          onClose={() => setAdministerRx(null)}
          onUpdated={() => {
            fetchPrescriptions();
          }}
        />
      )}

      {/* Modern Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(prescriptionToDelete)}
        title="Delete Prescription"
        message="Are you sure you want to delete this prescription? This action cannot be undone."
        confirmText="Delete Prescription"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDeletePrescription}
        onCancel={() => setPrescriptionToDelete(null)}
      />
    </div>
  );
}

export default Prescriptions;

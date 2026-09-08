import { useEffect, useState, useMemo } from "react";
import PrescriptionForm from "../components/PrescriptionForm.jsx";
import PrescriptionModal from "../components/PrescriptionModal.jsx";
import { getPrescriptions, getPrescriptionById, deletePrescription } from "../services/api.js";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prescriptionToEdit, setPrescriptionToEdit] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

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
      // Fetch full details if needed
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prescription? This action cannot be undone.")) {
      return;
    }
    setIsDeletingId(id);
    try {
      await deletePrescription(id);
      setPrescriptions((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete prescription.");
    } finally {
      setIsDeletingId(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Clinical prescriptions (Rx)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate, print, and share digital clinical prescriptions on official Nivora Care letterhead
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPrescriptionToEdit(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-md shadow-teal-600/20"
        >
          <span className="text-base font-normal">℞</span>
          <span>Generate new prescription</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total prescriptions</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Active digital records</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Medications prescribed</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{stats.totalMeds}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Dispensation orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ABHA connected</p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{stats.abhaLinked}</p>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">National health ID linked</span>
        </div>
      </div>

      {/* Form Drawer / Container */}
      {isFormOpen && (
        <div className="my-6">
          <PrescriptionForm
            prescriptionToEdit={prescriptionToEdit}
            onSuccess={(newOrUpdated) => {
              setIsFormOpen(false);
              setPrescriptionToEdit(null);
              fetchPrescriptions();
              if (newOrUpdated) setSelectedPrescription(newOrUpdated);
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setPrescriptionToEdit(null);
            }}
          />
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
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-hidden"
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
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Refresh list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Prescriptions List / Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-r-transparent mr-2" />
            Loading prescriptions...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-black text-xl mb-3">
              ℞
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No prescriptions found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Generate a clinical digital prescription for a patient or consultation.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              Generate first prescription
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rx number & date</th>
                  <th className="py-3 px-4">Patient details</th>
                  <th className="py-3 px-4">Consulting doctor</th>
                  <th className="py-3 px-4">Provisional diagnosis</th>
                  <th className="py-3 px-4">℞ Medications</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {prescriptions.map((rx) => {
                  const patient = rx.patient || {};
                  const doctor = rx.doctor || {};
                  const meds = rx.medications || [];

                  return (
                    <tr
                      key={rx._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-300 text-xs px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/50">
                          {rx.prescriptionNumber}
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {formatDate(rx.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {patient.name || "Patient"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {patient.age ? `${patient.age}y` : "—"} / {patient.gender || "—"}
                        </div>
                        {patient.abhaId && (
                          <div className="inline-flex items-center gap-1 mt-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                            <span>ABHA:</span>
                            <span>{patient.abhaId}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          Dr. {doctor.name || "Consultant"}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {doctor.specialization || doctor.department || "OPD"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {rx.diagnosis}
                        </div>
                        {rx.followUpDate && (
                          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                            Follow-up: {formatDate(rx.followUpDate)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-teal-600 dark:text-teal-400">℞</span>
                          {meds.length} {meds.length === 1 ? "medicine" : "medicines"}
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5">
                          {meds.map((m) => m.name.split(" ")[0]).join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(rx)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
                            title="View official prescription"
                          >
                            View / Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(rx)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit prescription"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rx._id)}
                            disabled={isDeletingId === rx._id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
                            title="Delete prescription"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
    </div>
  );
}

export default Prescriptions;

import { useEffect, useState } from "react";
import PatientForm from "../components/PatientForm.jsx";
import AllocateBedModal from "../components/AllocateBedModal.jsx";
import VitalsTracker from "../components/VitalsTracker.jsx";
import { deletePatient, getPatientById, getPatients, getPatientVitals } from "../services/api.js";
import QrScannerModal from "../components/ui/QrScannerModal.jsx";
import PatientQrCardModal from "../components/ui/PatientQrCardModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDoctorName } from "../utils/doctorName.js";
import { PageHeader, ConfirmDialog } from "../components/ui/index.js";
import { toast } from "../utils/toast.js";

function Patients() {
  const { user } = useAuth();
  const isReceptionist = user?.role === "receptionist";
  const isDoctor = user?.role === "doctor";
  const canDelete = ["admin", "receptionist"].includes(user?.role);
  const canAdmitBed = ["admin", "receptionist", "nurse", "emergency"].includes(user?.role);

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [admittingPatient, setAdmittingPatient] = useState(null);
  const [vitalsPatient, setVitalsPatient] = useState(null);
  const [patientVitalsList, setPatientVitalsList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [view360Patient, setView360Patient] = useState(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrCardPatient, setQrCardPatient] = useState(null);
  const [qrError, setQrError] = useState("");
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Administrative Filters
  const [bloodGroupFilter, setBloodGroupFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [admissionFilter, setAdmissionFilter] = useState("All");

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchPatients = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getPatients(debouncedSearch, page);

        if (isCurrentRequest) {
          setPatients(data.patients);
          setPagination(data.pagination);
        }
      } catch (requestError) {
        if (isCurrentRequest) {
          setError(requestError.response?.data?.message || "Unable to load patients.");
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchPatients();

    return () => {
      isCurrentRequest = false;
    };
  }, [debouncedSearch, page, refreshKey]);

  const openAddForm = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const openEditForm = (patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  const handleFormSuccess = () => {
    const isUpdate = Boolean(selectedPatient);
    closeForm();
    const msg = isUpdate ? "Patient record updated successfully." : "New patient registered successfully.";
    setSuccessMessage(msg);
    toast.success(msg);
    setTimeout(() => setSuccessMessage(""), 5000);
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleDelete = (patient) => {
    setPatientToDelete(patient);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    setError("");

    try {
      const patientName = patientToDelete.name;
      await deletePatient(patientToDelete._id);
      setPatientToDelete(null);
      const msg = `Patient record for "${patientName}" was removed successfully.`;
      setSuccessMessage(msg);
      toast.success(msg);
      setTimeout(() => setSuccessMessage(""), 5000);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      const errMsg = requestError.response?.data?.message || "Unable to delete patient.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQrScanned = async (patientId) => {
    setQrError("");
    try {
      const payload = await getPatientById(patientId);
      if (!payload?.patient) {
        setQrError("Patient not found for this QR identity.");
        return;
      }
      setView360Patient(payload.patient);
    } catch (requestError) {
      setQrError(
        requestError?.response?.status === 404
          ? "No patient record matches this QR identity."
          : requestError.response?.data?.message || "Unable to open patient record from QR."
      );
    }
  };

  const displayPatients = patients.filter((p) => {
    const matchBlood = bloodGroupFilter === "All" || p.bloodGroup === bloodGroupFilter;
    const matchGender = genderFilter === "All" || p.gender?.toLowerCase() === genderFilter.toLowerCase();
    const matchAdmission = admissionFilter === "All"
      ? true
      : admissionFilter === "admitted"
      ? p.isAdmitted
      : !p.isAdmitted;
    return matchBlood && matchGender && matchAdmission;
  });

  return (
    <section>
      <PageHeader
        title={isDoctor ? "My Assigned Patients" : "Patients Directory"}
        subtitle={
          isDoctor
            ? `Patients under the clinical care and consultation of ${formatDoctorName(user?.name, "Doctor")}.`
            : "Institutional master patient index, digital health records, and admission status."
        }
        action={
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-sm"
              onClick={() => setIsQrScannerOpen(true)}
              type="button"
              title="Scan a patient QR identity card"
            >
              📷 Scan QR
            </button>
            <button
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm"
              onClick={openAddForm}
              type="button"
            >
              + Add New Patient
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="mb-4 rounded-xl bg-white p-3 ring-1 ring-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          aria-label="Search patients by name, mobile, or ABHA ID"
          className="w-full sm:flex-1 sm:min-w-[220px] rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 min-h-[40px] text-xs text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
          onChange={handleSearchChange}
          placeholder="Search by name, mobile (+91), or ABHA ID..."
          type="search"
          value={searchInput}
        />

        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center text-xs">
          <div>
            <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px] block sm:inline mr-1">Blood:</span>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 min-h-[36px] text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Blood</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px] block sm:inline mr-1">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 min-h-[36px] text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <span className="text-slate-400 font-semibold text-[10px] sm:text-[11px] block sm:inline mr-1">Admission:</span>
            <select
              value={admissionFilter}
              onChange={(e) => setAdmissionFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 min-h-[36px] text-xs text-slate-700 focus:outline-none"
            >
              <option value="All">All Care</option>
              <option value="admitted">Inpatient</option>
              <option value="outpatient">OPD</option>
            </select>
          </div>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-2xs"
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

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-r-transparent mb-2"></div>
          <p>Loading hospital patients...</p>
        </div>
      ) : displayPatients.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 text-xs shadow-xs ring-1 ring-slate-200/80">
          No patients match the specified criteria.
        </div>
      ) : (
        <>
          {/* Mobile Stacked Card View (< md) */}
          <div className="block md:hidden space-y-3">
            {displayPatients.map((patient) => (
              <div
                key={patient._id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 font-black text-sm ring-1 ring-purple-500/20 flex-shrink-0">
                      {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{patient.name}</h3>
                      <p className="text-xs text-slate-500">{patient.age} yrs • {patient.gender}</p>
                    </div>
                  </div>
                  <div>
                    {patient.isAdmitted ? (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-500/20">
                        🛏️ Inpatient
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        OPD Walk-in
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Contact</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {patient.contactNumber ? (patient.contactNumber.startsWith("+91") ? patient.contactNumber : `+91 ${patient.contactNumber}`) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Group</span>
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.2 text-[10px] font-bold text-rose-700 ring-1 ring-rose-300/60 mt-0.5">
                      {patient.bloodGroup || "—"}
                    </span>
                  </div>
                  {patient.abhaId && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">ABHA ID</span>
                      <span className="font-mono text-[11px] font-semibold text-sky-700">{patient.abhaId}</span>
                    </div>
                  )}
                </div>

                {/* Mobile Touch-Friendly Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => setView360Patient(patient)}
                    className="rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                    type="button"
                  >
                    👁️ 360 View
                  </button>
                  <button
                    aria-label={`Vitals for ${patient.name}`}
                    className="rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                    onClick={async () => {
                      setVitalsPatient(patient);
                      try {
                        const res = await getPatientVitals(patient._id);
                        setPatientVitalsList(res.vitals || []);
                      } catch (err) {
                        setPatientVitalsList([]);
                      }
                    }}
                    type="button"
                  >
                    📊 Vitals
                  </button>
                  {!patient.isAdmitted && canAdmitBed && (
                    <button
                      aria-label={`Admit ${patient.name}`}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => setAdmittingPatient(patient)}
                      type="button"
                    >
                      🛏️ Admit
                    </button>
                  )}
                  <button
                    aria-label={`Edit ${patient.name}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                    onClick={() => openEditForm(patient)}
                    type="button"
                  >
                    ✎ Edit
                  </button>
                  {canDelete && (
                    <button
                      aria-label={`Delete ${patient.name}`}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs touch-target flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => handleDelete(patient)}
                      type="button"
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-xl bg-white shadow-xs ring-1 ring-slate-200/80">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient & ABHA ID</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-bold text-xs ring-1 ring-teal-500/20 flex-shrink-0">
                          {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-bold text-slate-800">{patient.name}</p>
                            {patient.abhaId && (
                              <span className="rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-300 tabular-nums">
                                ABHA: {patient.abhaId}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{patient.email || "No email registered"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 tabular-nums">
                        {patient.age} yrs • {patient.gender}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 tabular-nums">
                        {patient.contactNumber ? (patient.contactNumber.startsWith("+91") ? patient.contactNumber : `+91 ${patient.contactNumber}`) : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-300/60">
                        {patient.bloodGroup || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {patient.isAdmitted ? (
                        <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 ring-1 ring-teal-500/20">
                          🛏️ Inpatient
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          OPD Walk-in
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setView360Patient(patient)}
                        className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                        title="Patient 360 Comprehensive View"
                        type="button"
                      >
                        👁️ 360 View
                      </button>
                      <button
                        aria-label={`QR identity card for ${patient.name}`}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                        onClick={() => setQrCardPatient(patient)}
                        title="Show QR identity card for scanning at any station"
                        type="button"
                      >
                        ▦ QR Card
                      </button>
                      <button
                        aria-label={`Vitals for ${patient.name}`}
                        className="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                        onClick={async () => {
                          setVitalsPatient(patient);
                          try {
                            const res = await getPatientVitals(patient._id);
                            setPatientVitalsList(res.vitals || []);
                          } catch (err) {
                            setPatientVitalsList([]);
                          }
                        }}
                        title="View & log health vitals"
                        type="button"
                      >
                        📊 Vitals
                      </button>
                      {!patient.isAdmitted && canAdmitBed && (
                        <button
                          aria-label={`Admit ${patient.name}`}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                          onClick={() => setAdmittingPatient(patient)}
                          title="Admit patient to bed"
                          type="button"
                        >
                          🛏️ Admit
                        </button>
                      )}
                      <button
                        aria-label={`Edit ${patient.name}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                        onClick={() => openEditForm(patient)}
                        title="Edit patient"
                        type="button"
                      >
                        ✎ Edit
                      </button>
                      {canDelete && (
                        <button
                          aria-label={`Delete ${patient.name}`}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition shadow-2xs"
                          onClick={() => handleDelete(patient)}
                          title="Delete patient"
                          type="button"
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <button
            className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="rounded border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      )}

      {isFormOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2.5 sm:p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="modal-viewport w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedPatient ? "Edit patient details" : "Register new patient"}
              </h2>
              <button
                aria-label="Close form"
                className="rounded-lg p-1.5 text-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition touch-target flex items-center justify-center cursor-pointer"
                onClick={closeForm}
                type="button"
              >
                ✕
              </button>
            </div>
            <PatientForm
              key={selectedPatient?._id || "new-patient"}
              onCancel={closeForm}
              onSuccess={handleFormSuccess}
              patient={selectedPatient}
            />
          </div>
        </div>
      )}

      {admittingPatient && (
        <AllocateBedModal
          initialPatient={admittingPatient}
          onClose={() => setAdmittingPatient(null)}
          onSuccess={() => {
            alert(`Patient ${admittingPatient.name} successfully admitted to bed.`);
            setAdmittingPatient(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {vitalsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col modal-viewport">
            <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Health Records & Vitals — {vitalsPatient.name}</h3>
                <p className="text-[11px] text-teal-100">
                  {vitalsPatient.gender}, {vitalsPatient.age} Y · Contact: {vitalsPatient.contactNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVitalsPatient(null)}
                className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xs cursor-pointer touch-target"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <VitalsTracker
                patientId={vitalsPatient._id}
                vitals={patientVitalsList}
                isPatient={false}
                onVitalsUpdated={async () => {
                  const res = await getPatientVitals(vitalsPatient._id);
                  setPatientVitalsList(res.vitals || []);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Patient QR Identity Card Modal */}
      {qrCardPatient && (
        <PatientQrCardModal
          isOpen={Boolean(qrCardPatient)}
          onClose={() => setQrCardPatient(null)}
          patient={qrCardPatient}
        />
      )}

      {/* Patient QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => {
          setIsQrScannerOpen(false);
          setQrError("");
        }}
        onScanned={handleQrScanned}
      />
      {qrError && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {qrError}
        </div>
      )}

      {/* Patient 360 Overview Modal */}
      {view360Patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2.5 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden flex flex-col modal-viewport">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-lg font-black uppercase text-white shadow-inner">
                  {view360Patient.name ? view360Patient.name.charAt(0) : "P"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{view360Patient.name}</span>
                    {view360Patient.abhaId && (
                      <span className="rounded bg-sky-400/30 px-2 py-0.5 text-[10px] font-mono text-sky-200 ring-1 ring-sky-300/40">
                        ABHA: {view360Patient.abhaId}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    {view360Patient.age} yrs • <span className="capitalize">{view360Patient.gender}</span> • Blood Group: <span className="font-bold text-rose-300">{view360Patient.bloodGroup || "Not recorded"}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setView360Patient(null)}
                className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Demographics & Contact Card */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-purple-700">
                  Demographics & Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-semibold block">Registered Phone:</span>
                    <span className="font-mono font-medium">{view360Patient.contactNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Email Address:</span>
                    <span>{view360Patient.email || "No email on record"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Residential Address:</span>
                    <span>{view360Patient.address || "New Delhi, India"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Emergency Contact:</span>
                    <span className="font-mono">{view360Patient.emergencyContact || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Clinical & Care Status */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-purple-700">
                  Inpatient Care & Medical Flags
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-semibold block">Admission Status:</span>
                    <span className="font-bold">
                      {view360Patient.isAdmitted ? (
                        <span className="text-purple-700">🛏️ Currently Inpatient (Admitted)</span>
                      ) : (
                        <span className="text-slate-600">Outpatient (Ambulatory)</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Documented Allergies:</span>
                    <span className="font-medium text-rose-700">
                      {view360Patient.allergies?.length > 0 ? view360Patient.allergies.join(", ") : "None reported (NKDA)"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold block">Medical History / Chronic Conditions:</span>
                    <span>{view360Patient.medicalHistory || "No chronic illnesses documented."}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    const p = view360Patient;
                    setView360Patient(null);
                    setVitalsPatient(p);
                    try {
                      const res = await getPatientVitals(p._id);
                      setPatientVitalsList(res.vitals || []);
                    } catch (err) {
                      setPatientVitalsList([]);
                    }
                  }}
                  className="rounded-xl bg-teal-600 px-3.5 py-2 font-bold text-white hover:bg-teal-700 transition"
                >
                  📊 Open Vitals Log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = view360Patient;
                    setView360Patient(null);
                    openEditForm(p);
                  }}
                  className="rounded-xl bg-purple-600 px-3.5 py-2 font-bold text-white hover:bg-purple-700 transition"
                >
                  ✎ Edit Patient Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(patientToDelete)}
        title="Delete Patient Record"
        message={
          patientToDelete
            ? `Are you sure you want to delete ${patientToDelete.name}'s medical record? This cannot be undone.`
            : ""
        }
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={confirmDeletePatient}
        onCancel={() => setPatientToDelete(null)}
      />
    </section>
  );
}

export default Patients;

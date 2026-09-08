import { useEffect, useState } from "react";
import PatientForm from "../components/PatientForm.jsx";
import { deletePatient, getPatients } from "../services/api.js";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    closeForm();
    setRefreshKey((currentKey) => currentKey + 1);
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleDelete = async (patient) => {
    const shouldDelete = window.confirm(`Delete ${patient.name}? This cannot be undone.`);

    if (!shouldDelete) return;

    setError("");

    try {
      await deletePatient(patient._id);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete patient.");
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Patients</h1>
          <p className="mt-1 text-sm text-slate-600">Manage hospital patient records.</p>
        </div>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={openAddForm}
          type="button"
        >
          + Add Patient
        </button>
      </div>

      <input
        aria-label="Search patients by name"
        className="mb-5 w-full max-w-md rounded-md border border-slate-300 px-3 py-2"
        onChange={handleSearchChange}
        placeholder="Search patients by name..."
        type="search"
        value={searchInput}
      />

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-center text-slate-600">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="p-6 text-center text-slate-600">No patients found.</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Blood group</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {patients.map((patient) => (
                <tr key={patient._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs ring-1 ring-blue-500/20 flex-shrink-0">
                        {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.email || "No email registered"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {patient.age} yrs • {patient.gender}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
                      {patient.contactNumber || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-300/60">
                      {patient.bloodGroup || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right space-x-2">
                    <button
                      aria-label={`Edit ${patient.name}`}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                      onClick={() => openEditForm(patient)}
                      title="Edit patient"
                      type="button"
                    >
                      ✎ Edit
                    </button>
                    <button
                      aria-label={`Delete ${patient.name}`}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition shadow-2xs"
                      onClick={() => handleDelete(patient)}
                      title="Delete patient"
                      type="button"
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedPatient ? "Edit Patient" : "Add Patient"}
              </h2>
              <button
                aria-label="Close form"
                className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100"
                onClick={closeForm}
                type="button"
              >
                ×
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
    </section>
  );
}

export default Patients;

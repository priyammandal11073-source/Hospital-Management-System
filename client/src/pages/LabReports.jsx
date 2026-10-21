import { useEffect, useState } from "react";
import {
  getLabReports,
  createLabReport,
  updateLabReport,
  deleteLabReport,
  getPatients,
  getDoctors,
} from "../services/api.js";
import { printClinicalReport } from "../utils/printReport.js";
import { formatDoctorName } from "../utils/doctorName.js";

const CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Pathology",
  "Microbiology",
  "Radiology / X-Ray",
  "Cardiology / ECG",
  "Urine Analysis",
  "Immunology",
  "General Lab",
];

const STATUS_CLASSES = {
  ordered: "bg-amber-50 text-amber-800 border-amber-200",
  sample_collected: "bg-sky-50 text-sky-800 border-sky-200",
  in_progress: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200",
};

export default function LabReports() {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patient: "",
    doctor: "",
    testName: "",
    category: "General Lab",
    technicianName: "Central Lab Tech",
    status: "ordered",
    summaryConclusion: "",
    attachmentName: "",
    attachmentUrl: "",
    isSharedWithPatient: true,
    testResults: [
      { parameter: "", result: "", unit: "", referenceRange: "", status: "normal" },
    ],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, patientsData, doctorsData] = await Promise.all([
        getLabReports({ search, category: categoryFilter, status: statusFilter }),
        getPatients("", 1, 100),
        getDoctors(),
      ]);
      setReports(reportsData.reports || []);
      setPatients(patientsData.patients || []);
      setDoctors(doctorsData.doctors || []);
    } catch (err) {
      setError("Unable to load lab reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAdd = () => {
    setSelectedReport(null);
    setForm({
      patient: "",
      doctor: "",
      testName: "",
      category: "General Lab",
      technicianName: "Central Lab Tech",
      status: "ordered",
      summaryConclusion: "",
      attachmentName: "",
      attachmentUrl: "",
      isSharedWithPatient: true,
      testResults: [
        { parameter: "Hemoglobin", result: "", unit: "g/dL", referenceRange: "13.0 - 17.0", status: "normal" },
      ],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (report) => {
    setSelectedReport(report);
    setForm({
      patient: report.patient?._id || "",
      doctor: report.doctor?._id || "",
      testName: report.testName || "",
      category: report.category || "General Lab",
      technicianName: report.technicianName || "Central Lab Tech",
      status: report.status || "ordered",
      summaryConclusion: report.summaryConclusion || "",
      attachmentName: report.attachmentName || "",
      attachmentUrl: report.attachmentUrl || "",
      isSharedWithPatient: report.isSharedWithPatient !== false,
      testResults:
        report.testResults && report.testResults.length > 0
          ? report.testResults
          : [{ parameter: "", result: "", unit: "", referenceRange: "", status: "normal" }],
    });
    setShowModal(true);
  };

  const handleAddTestParameter = () => {
    setForm((f) => ({
      ...f,
      testResults: [
        ...f.testResults,
        { parameter: "", result: "", unit: "", referenceRange: "", status: "normal" },
      ],
    }));
  };

  const handleRemoveTestParameter = (index) => {
    setForm((f) => ({
      ...f,
      testResults: f.testResults.filter((_, i) => i !== index),
    }));
  };

  const handleParameterChange = (index, field, value) => {
    setForm((f) => {
      const results = [...f.testResults];
      results[index] = { ...results[index], [field]: value };
      return { ...f, testResults: results };
    });
  };

  // Mock upload handler for file/PDF attachment
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((f) => ({
          ...f,
          attachmentName: file.name,
          attachmentUrl: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.testName) {
      alert("Patient and test name are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (selectedReport) {
        await updateLabReport(selectedReport._id, form);
      } else {
        await createLabReport(form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save lab report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this diagnostic report permanently?")) return;
    try {
      await deleteLabReport(id);
      fetchData();
    } catch (err) {
      alert("Unable to delete lab report.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🧪 Lab Reports & Diagnostics</span>
            <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
              Pathology & Imaging
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order tests, upload PDF investigation reports, and securely share findings with patients.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+ New Lab Investigation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search report # or test name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 focus:border-teal-600 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 bg-white font-semibold text-slate-700"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 bg-white font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ordered">Ordered</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Loading investigation reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <span className="text-4xl block">🧪</span>
            <p className="font-bold text-slate-700">No lab reports found.</p>
            <p>Click <strong>+ New Lab Investigation</strong> to order or upload a test report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Report ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Test & Category</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-black text-teal-800 whitespace-nowrap">
                      {report.reportNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{report.patient?.name || "—"}</p>
                      <span className="text-[10px] text-slate-400">
                        {report.patient?.contactNumber || ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{report.testName}</p>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold inline-block mt-0.5">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {report.doctor ? formatDoctorName(report.doctor.name) : "Central Lab"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          STATUS_CLASSES[report.status] || "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {report.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(report.testDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewReport(report)}
                        className="text-teal-700 hover:text-teal-900 font-bold"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => printClinicalReport(report)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                        title="Direct official print"
                      >
                        🖨️ Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(report)}
                        className="text-slate-600 hover:text-slate-900 font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(report._id)}
                        className="text-rose-600 hover:text-rose-800 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE / EDIT LAB REPORT ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-teal-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {selectedReport ? "Edit Lab Investigation" : "New Lab Investigation Report"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={form.patient}
                    onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:border-teal-600 focus:outline-none font-semibold"
                  >
                    <option value="">Choose Patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.contactNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Referring Doctor</label>
                  <select
                    value={form.doctor}
                    onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:border-teal-600 focus:outline-none font-semibold"
                  >
                    <option value="">Central Diagnostics / External</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {formatDoctorName(d.name)} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Investigation / Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC) / Lipid Profile"
                    value={form.testName}
                    onChange={(e) => setForm((f) => ({ ...f, testName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:border-teal-600 focus:outline-none font-semibold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Report Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:border-teal-600 focus:outline-none font-semibold"
                  >
                    <option value="ordered">Ordered</option>
                    <option value="sample_collected">Sample Collected</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Finalized)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Technician / Lab In-Charge</label>
                  <input
                    type="text"
                    value={form.technicianName}
                    onChange={(e) => setForm((f) => ({ ...f, technicianName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Test Parameters Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900">Test Parameters & Findings</label>
                  <button
                    type="button"
                    onClick={handleAddTestParameter}
                    className="text-teal-700 hover:text-teal-900 font-bold"
                  >
                    + Add Parameter
                  </button>
                </div>

                <div className="space-y-2">
                  {form.testResults.map((param, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Parameter (e.g. Platelets)"
                        value={param.parameter}
                        onChange={(e) => handleParameterChange(i, "parameter", e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Result (e.g. 2.4)"
                        value={param.result}
                        onChange={(e) => handleParameterChange(i, "result", e.target.value)}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 bg-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Unit (e.g. Lakhs/cu mm)"
                        value={param.unit}
                        onChange={(e) => handleParameterChange(i, "unit", e.target.value)}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Normal Range"
                        value={param.referenceRange}
                        onChange={(e) => handleParameterChange(i, "referenceRange", e.target.value)}
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTestParameter(i)}
                        className="text-rose-500 hover:text-rose-700 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload PDF / File */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Scanned PDF / Document Attachment
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-slate-50"
                />
                {form.attachmentName && (
                  <p className="text-[11px] text-teal-700 mt-1 font-semibold">
                    📎 Attached: {form.attachmentName}
                  </p>
                )}
              </div>

              {/* Summary Conclusion */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Summary / Clinical Conclusion</label>
                <textarea
                  rows={2}
                  placeholder="Doctor / Pathologist remarks or findings..."
                  value={form.summaryConclusion}
                  onChange={(e) => setForm((f) => ({ ...f, summaryConclusion: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 p-2 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="shared"
                  checked={form.isSharedWithPatient}
                  onChange={(e) => setForm((f) => ({ ...f, isSharedWithPatient: e.target.checked }))}
                  className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="shared" className="font-semibold text-slate-700">
                  Allow patient to view & download this report in their Patient Portal
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black py-2.5 shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Lab Investigation Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVIEW / PRINT REPORT ── */}
      {previewReport && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="printable-report-modal w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <h3 className="font-bold text-sm">Diagnostic Report Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printClinicalReport(previewReport)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-xs bg-white">
              {/* Header */}
              <div className="border-b-2 border-teal-800 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-teal-800">Nivora Care Hospital</h2>
                  <p className="text-slate-500 text-[11px]">Central Diagnostic & Pathology Department</p>
                  <p className="text-slate-500 text-[10px]">Outer Ring Road, AIIMS Metro, New Delhi · +91 9876543210</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-slate-900 text-sm">{previewReport.reportNumber}</p>
                  <p className="text-slate-500 text-[11px]">
                    Date: {new Date(previewReport.testDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Patient Name</p>
                  <p className="font-bold text-slate-900 text-sm">{previewReport.patient?.name}</p>
                  <p className="text-slate-500 text-[11px]">
                    Age/Gender: {previewReport.patient?.age} Y / {previewReport.patient?.gender}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase">Referring Doctor</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {previewReport.doctor ? formatDoctorName(previewReport.doctor.name) : "Central Lab"}
                  </p>
                  <p className="text-slate-500 text-[11px]">Category: {previewReport.category}</p>
                </div>
              </div>

              {/* Investigation Title */}
              <div>
                <h3 className="text-sm font-black text-slate-900 border-b pb-1">
                  Investigation: {previewReport.testName}
                </h3>
              </div>

              {/* Results Table */}
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="py-2 px-3">Test Parameter</th>
                    <th className="py-2 px-3">Observed Result</th>
                    <th className="py-2 px-3">Units</th>
                    <th className="py-2 px-3">Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewReport.testResults?.map((res, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{res.parameter}</td>
                      <td className="py-2 px-3 font-black text-teal-800">{res.result}</td>
                      <td className="py-2 px-3 text-slate-600">{res.unit}</td>
                      <td className="py-2 px-3 text-slate-500">{res.referenceRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Remarks */}
              {previewReport.summaryConclusion && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200">
                  <p className="font-bold text-teal-950 mb-0.5">Conclusion / Remarks:</p>
                  <p className="text-slate-700">{previewReport.summaryConclusion}</p>
                </div>
              )}

              {/* Attachment if present */}
              {previewReport.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={previewReport.attachmentUrl}
                    download={previewReport.attachmentName || "lab-report.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition"
                  >
                    <span>📎 Download Attached File ({previewReport.attachmentName || "Report"})</span>
                  </a>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-slate-500 text-[11px]">
                <div>
                  <p>Technician: {previewReport.technicianName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Dr. Senior Pathologist</p>
                  <p>Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

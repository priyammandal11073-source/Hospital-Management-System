import { useCallback, useEffect, useRef, useState } from "react";
import SkeletonTable from "../../components/ui/SkeletonTable.jsx";
import EmptyStateCard from "../../components/ui/EmptyStateCard.jsx";
import { useSearchParams, Link } from "react-router-dom";
import { getDiagnosticTests } from "../../services/api.js";

export default function DiagnosticCatalogPage() {
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  const debounceRef = useRef(null);

  const fetchCatalog = useCallback(async (overrideSearch) => {
    try {
      setLoading(true);
      const params = { limit: 150 };
      if (department) params.department = department;
      if (category) params.category = category;
      const searchTerm = overrideSearch !== undefined ? overrideSearch : search;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await getDiagnosticTests(params);
      if (res.success) {
        setTests(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load catalog", err);
    } finally {
      setLoading(false);
    }
  }, [department, category, search]);

  // Re-fetch immediately when department or category filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchCatalog();
  }, [department, category]);

  // Debounce the search text: wait 300ms after the last keystroke before firing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCatalog(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Central Diagnostic Test Catalog (369+ Standardized Investigations)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pathology laboratory profiles, radiological imaging modalities, reference ranges, specimen requirements, and pricing
          </p>
        </div>
        <Link
          to="/diagnostic/requests"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
        >
          <span>+ Order Investigation</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by test name, code (e.g., LAB-HEM-001, RAD-CT-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCatalog()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setCategory("");
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Departments</option>
          <option value="Pathology">Pathology / Laboratory (232 Tests)</option>
          <option value="Radiology">Radiology / Imaging (137 Tests)</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer max-w-[200px]"
        >
          <option value="">All Sub-Categories</option>
          {department !== "Radiology" && (
            <>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology & Serology</option>
              <option value="Immunology">Immunology</option>
              <option value="Histopathology">Histopathology</option>
              <option value="Cytopathology">Cytopathology</option>
              <option value="Molecular Diagnostics">Molecular Diagnostics</option>
              <option value="Blood Bank">Blood Banking</option>
              <option value="Clinical Pathology">Clinical Pathology (Urine/Body Fluids)</option>
              <option value="Coagulation">Coagulation & Thrombosis</option>
              <option value="Endocrinology">Endocrinology & Hormones</option>
              <option value="Tumor Markers">Tumor Markers</option>
              <option value="Therapeutic Drug Monitoring">Therapeutic Drug Monitoring</option>
            </>
          )}
          {department !== "Pathology" && (
            <>
              <option value="X-Ray">Digital X-Ray</option>
              <option value="CT Scan">CT Scan</option>
              <option value="MRI">3.0T MRI</option>
              <option value="Ultrasound">Ultrasound & Doppler</option>
              <option value="Mammography">Mammography</option>
              <option value="Interventional">Interventional Radiology & Fluoroscopy</option>
            </>
          )}
        </select>

        <button
          type="button"
          onClick={fetchCatalog}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold transition cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <SkeletonTable rows={6} cols={4} className="mt-2" />
      ) : tests.length === 0 ? (
        <EmptyStateCard
          icon="🔬"
          title="No tests match your search"
          description={search.trim() ? `No investigations found for "${search}". Try a different keyword, test code, or clear the filters.` : "No tests are available for the selected department or category filters."}
          actionText="Clear search"
          onActionClick={() => setSearch("")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700">{t.testCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.department === "Pathology"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {t.department}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-2">{t.testName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.category} • {t.subCategory || "General"}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specimen / Mode:</span>
                    <span className="font-semibold text-slate-800">{t.sampleType || "Direct Scan"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Container / Tube:</span>
                    <span className="font-semibold text-purple-700">{t.containerType || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Turnaround Time:</span>
                    <span className="font-semibold text-slate-800">{t.turnaroundTime || "2 hours"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">₹{t.price}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTestDetail(t)}
                  className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold transition cursor-pointer"
                >
                  Details & Ranges →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= TEST DETAILS & REFERENCE RANGES MODAL ================= */}
      {selectedTestDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">{selectedTestDetail.testCode}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTestDetail.testName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTestDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard Price</span>
                  <span className="text-base font-black text-slate-900">₹{selectedTestDetail.price}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Turnaround Time</span>
                  <span className="text-sm font-bold text-slate-800">{selectedTestDetail.turnaroundTime || "2 hours"}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">Patient Preparation Instructions</span>
                <p className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                  {selectedTestDetail.preparationInstructions || "No special fasting or prior dietary restriction required."}
                </p>
              </div>

              {/* Reference Ranges if available */}
              {selectedTestDetail.referenceRanges?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Standard Analyte Reference Ranges</span>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2 pl-3">Parameter</th>
                          <th className="p-2">Normal Range</th>
                          <th className="p-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedTestDetail.referenceRanges.map((r, idx) => (
                          <tr key={idx}>
                            <td className="p-2 pl-3 font-semibold text-slate-900">{r.parameter}</td>
                            <td className="p-2 text-slate-700">{r.normalRange}</td>
                            <td className="p-2 text-slate-500">{r.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedTestDetail(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

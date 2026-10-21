import { useCallback, useEffect, useMemo, useState } from "react";
import { getBeds } from "../services/api.js";
import { exportToCsv } from "../utils/csvExport.js";
import ActionMenu from "../components/ui/ActionMenu.jsx";
import { usePrintModal } from "../context/PrintModalContext.jsx";
import { generateWardBedMapHtml } from "../utils/printTemplates.js";
import { formatDoctorName } from "../utils/doctorName.js";

const STATUS_META = {
  available: { label: "Available", tile: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-400" },
  occupied: { label: "Occupied", tile: "border-rose-300 bg-rose-50", dot: "bg-rose-500" },
  cleaning: { label: "Cleaning", tile: "border-amber-300 bg-amber-50", dot: "bg-amber-400" },
  maintenance: { label: "Maintenance", tile: "border-slate-300 bg-slate-100", dot: "bg-slate-400" },
};

const WARD_ORDER = [
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

const WardMapPage = () => {
  const { openPrintPreview } = usePrintModal();
  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [wardFilter, setWardFilter] = useState("");

  const loadBeds = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getBeds();
      const list = Array.isArray(res.beds) ? res.beds : [];
      setBeds(list);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load ward map. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  const wards = useMemo(() => {
    const map = new Map();
    for (const ward of WARD_ORDER) map.set(ward, []);
    let filtered = beds;
    if (wardFilter) filtered = beds.filter((b) => b.ward === wardFilter);
    for (const bed of filtered) {
      const key = WARD_ORDER.includes(bed.ward) ? bed.ward : "General Ward";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(bed);
    }
    return Array.from(map.entries())
      .map(([ward, items]) => ({
        ward,
        items,
        stats: {
          total: beds.filter((b) => b.ward === ward).length,
          occupied: beds.filter((b) => b.ward === ward && b.status === "occupied").length,
          available: beds.filter((b) => b.ward === ward && b.status === "available").length,
        },
      }))
      .filter((w) => wardFilter ? w.items.length > 0 : w.items.length > 0);
  }, [beds, wardFilter]);

  const globalStats = useMemo(() => {
    const count = (status) => beds.filter((b) => b.status === status).length;
    return {
      total: beds.length,
      available: count("available"),
      occupied: count("occupied"),
      cleaning: count("cleaning"),
      maintenance: count("maintenance"),
    };
  }, [beds]);

  const selectedBed = selected ? beds.find((b) => b._id === selected || b.bedNumber === selected) : null;

  const handlePrintWardMap = () => {
    const wardsData = wards.map((wg) => ({
      name: wg.ward,
      beds: (wg.items || []).map((b) => ({
        bedNumber: b.bedNumber,
        bedType: b.ward,
        status: (b.status || "available").toUpperCase(),
        patient: b.currentAdmission?.patient,
        doctor: b.currentAdmission?.attendingDoctor,
      })),
    }));

    const html = generateWardBedMapHtml({
      wards: wardsData,
      stats: {
        total: beds.length,
        occupied: globalStats.occupied || 0,
        available: globalStats.available || 0,
      },
      selectedWard: wardFilter || "All Hospital Wards",
    });

    openPrintPreview({
      title: "Hospital Inpatient Ward Bed Map & Census",
      htmlContent: html,
      refNumber: `WARD-MAP-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ward Map</h1>
          <p className="mt-1 text-sm text-slate-600">
            Live visual view of every bed in the hospital. Tap any bed tile for patient & admission details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full sm:w-auto">
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-slate-200 px-2.5 py-1 text-slate-600">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}: {globalStats[key]}
              </span>
            ))}
          </div>
          <ActionMenu
            triggerLabel="Export"
            triggerIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
            items={[
              {
                label: "Print Ward Map",
                icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>,
                onClick: handlePrintWardMap,
              },
              {
                label: "Export All Beds (CSV)",
                icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                onClick: () => exportToCsv({
                  filename: `ward-map-beds.csv`,
                  headers: ["Bed #", "Ward", "Floor", "Status", "Patient", "Doctor", "Daily Rate", "Features"],
                  rows: beds.map((b) => [
                    b.bedNumber || "",
                    b.ward || "",
                    b.floor || "",
                    b.status || "",
                    b.currentAdmission?.patient?.name || "",
                    b.currentAdmission?.attendingDoctor?.name || "",
                    Number(b.dailyRate || 0).toFixed(2),
                    [
                      b.features?.hasOxygen ? "O₂" : "",
                      b.features?.hasVentilator ? "Vent" : "",
                      b.features?.hasMonitor ? "Mon" : "",
                      b.features?.isIsolation ? "Iso" : "",
                    ].filter(Boolean).join(", "),
                  ]),
                }),
              },
              {
                label: "Export Occupied Only (CSV)",
                icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                disabled: globalStats.occupied === 0,
                onClick: () => exportToCsv({
                  filename: `ward-map-occupied.csv`,
                  headers: ["Bed #", "Ward", "Floor", "Patient", "Doctor", "Admitted", "Daily Rate"],
                  rows: beds
                    .filter((b) => b.status === "occupied")
                    .map((b) => [
                      b.bedNumber || "",
                      b.ward || "",
                      b.floor || "",
                      b.currentAdmission?.patient?.name || "",
                      b.currentAdmission?.attendingDoctor?.name || "",
                      b.currentAdmission?.admittedAt ? new Date(b.currentAdmission.admittedAt).toLocaleDateString() : "",
                      Number(b.dailyRate || 0).toFixed(2),
                    ]),
                }),
              },
            ]}
            align="right"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setWardFilter("")}
          className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
            wardFilter === "" ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          All wards
        </button>
        {WARD_ORDER.map((ward) => (
          <button
            key={ward}
            type="button"
            onClick={() => setWardFilter(wardFilter === ward ? "" : ward)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition cursor-pointer ${
              wardFilter === ward ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {ward.replace(/ \(.*\)/, "")}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wards.map(({ ward, items, stats }) => (
            <div
              key={ward}
              className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-2xs ${
                selected && items.some((b) => (b._id || b.bedNumber) === selected) ? "ring-teal-400" : ""
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">{ward}</h2>
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {stats.available}/{stats.total} free
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {items.sort((a, b) => String(a.bedNumber).localeCompare(String(b.bedNumber))).map((bed) => {
                  const meta = STATUS_META[bed.status] || STATUS_META.available;
                  const isSelected = (bed._id || bed.bedNumber) === selected;
                  const patientName = bed.currentAdmission?.patient?.name;
                  return (
                    <button
                      key={bed._id || bed.bedNumber}
                      type="button"
                      onClick={() => setSelected(isSelected ? null : bed._id || bed.bedNumber)}
                      className={`relative rounded-xl border px-2 py-3 text-left transition hover:shadow-md cursor-pointer ${meta.tile} ${isSelected ? "ring-2 ring-teal-500" : ""}`}
                    >
                      <span className="font-mono text-[11px] font-bold text-slate-800">{bed.bedNumber}</span>
                      <span className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      {bed.status === "occupied" && (
                        <span className="mt-1 block truncate text-[10px] font-semibold text-rose-700">
                          {patientName}
                        </span>
                      )}
                      {bed.status === "cleaning" && (
                        <span className="mt-1 block text-[10px] font-semibold text-amber-700">Room prep</span>
                      )}
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <p className="col-span-3 py-4 text-center text-[11px] text-slate-400">No beds configured.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">{selectedBed.bedNumber}</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-xl text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <div className="mt-1 space-y-1 text-xs text-slate-600">
              <p><span className="text-slate-400">Ward:</span> {selectedBed.ward || "—"} · {selectedBed.floor || "—"}</p>
              <p><span className="text-slate-400">Daily rate:</span> ₹{Number(selectedBed.dailyRate || 0).toFixed(2)}</p>
              <p>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="font-bold capitalize">{selectedBed.status?.replace("_", " ")}</span>
              </p>
              {selectedBed.features && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedBed.features.hasOxygen !== undefined && (
                    <>
                      {selectedBed.features.hasOxygen && <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold">O₂ Oxygen</span>}
                      {selectedBed.features.hasVentilator && <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold">Ventilator</span>}
                      {selectedBed.features.hasMonitor && <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[10px] font-semibold">Monitor</span>}
                      {selectedBed.features.isIsolation && <span className="rounded-full bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 text-[10px] font-semibold">Isolation</span>}
                    </>
                  )}
                </div>
              )}
              {selectedBed.currentAdmission?.patient && (
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-100 p-3 text-rose-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Current admission</p>
                  <p className="mt-1 font-bold text-sm">{selectedBed.currentAdmission.patient.name}</p>
                  <p className="text-[11px]">
                    {selectedBed.currentAdmission.admissionReason || "Admitted"} · Admitted{" "}
                    {selectedBed.currentAdmission.admittedAt
                      ? new Date(selectedBed.currentAdmission.admittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "recently"}
                  </p>
                  {selectedBed.currentAdmission.attendingDoctor?.name && (
                    <p className="text-[11px]">{formatDoctorName(selectedBed.currentAdmission.attendingDoctor.name)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WardMapPage;
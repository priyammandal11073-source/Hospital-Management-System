import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyActiveMedicines } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

function MyMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyActiveMedicines();
        if (active) {
          setMedicines(res.medicines || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to fetch active medicines");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredMedicines = filter === "all"
    ? medicines
    : medicines.filter((m) => (filter === "active" ? m.isActive : !m.isActive));

  const formatSchedule = (freq = "") => {
    const f = freq.toLowerCase();
    const times = [];
    if (f.includes("morning") || f.includes("od") || f.includes("bd") || f.includes("tds") || f.includes("qid") || f.includes("1-")) {
      times.push({ label: "Morning", icon: "🌅", time: "8:00 AM" });
    }
    if (f.includes("afternoon") || f.includes("tds") || f.includes("qid") || f.includes("-1-")) {
      times.push({ label: "Afternoon", icon: "☀️", time: "1:30 PM" });
    }
    if (f.includes("night") || f.includes("bd") || f.includes("tds") || f.includes("qid") || f.includes("hs") || f.endsWith("-1")) {
      times.push({ label: "Night", icon: "🌙", time: "9:00 PM" });
    }
    return times.length > 0 ? times : [{ label: "As Directed", icon: "⏰", time: freq || "Per prescription" }];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Medications & Dosage", active: true },
        ]}
        title="My Medications & Dosage Guide"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Active Prescriptions
          </span>
        }
        subtitle="Clear, plain-language breakdown of all your prescribed medications, daily routines, and doctor instructions."
        actions={
          <Link
            to="/patient/prescriptions"
            className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            📄 View Original Prescriptions
          </Link>
        }
      />

      {/* Safety Pill Advice */}
      <div className="rounded-2xl liquid-glass-card border border-teal-200/80 bg-teal-50/50 p-4 sm:p-5 shadow-2xs flex items-start gap-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass-subtle text-teal-900 text-lg flex-shrink-0">
          💡
        </div>
        <div className="text-xs sm:text-sm text-teal-950 leading-relaxed">
          <p className="font-bold text-teal-950">Medication Safety Guidelines:</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-teal-900 text-xs">
            <li>Always complete the prescribed antibiotic course unless advised otherwise by your physician.</li>
            <li>Take medicines with a full glass of water. If you experience allergic reactions or severe dizziness, contact the 24/7 helpline immediately.</li>
          </ul>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: `All Medicines (${medicines.length})` },
          { key: "active", label: `Active Routine (${medicines.filter((m) => m.isActive).length})` },
          { key: "completed", label: `Completed Course (${medicines.filter((m) => !m.isActive).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === tab.key
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your dosage schedules...</p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-700 text-2xl mb-3">
            💊
          </div>
          <h3 className="text-sm font-bold text-slate-800">No medications found</h3>
          <p className="mt-1 text-xs text-slate-500">
            You do not currently have any active medicine routines under this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMedicines.map((m, idx) => {
            const scheduleTimes = formatSchedule(m.frequency);
            const isFoodBefore = (m.instructions || "").toLowerCase().includes("before food") || (m.instructions || "").toLowerCase().includes("empty stomach");

            return (
              <div
                key={m.id || idx}
                className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 shadow-2xs transition hover:border-slate-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-teal-800 border border-slate-200/80 font-bold text-lg shadow-2xs">
                        💊
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                        <p className="text-xs font-semibold text-teal-800">
                          {m.dosage} • {m.form || "Tablet/Capsule"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold liquid-glass-pill ${
                        m.isActive ? "bg-teal-50 text-teal-800 border-teal-200/70" : "bg-slate-50 text-slate-600 border-slate-200/70"
                      }`}
                    >
                      {m.isActive ? "Active Now" : "Course Finished"}
                    </span>
                  </div>

                  {/* Frequency / Time schedule */}
                  <div className="mt-4 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Daily Routine / Timing:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scheduleTimes.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
                        >
                          <span>{s.icon}</span>
                          <span className="font-bold text-slate-900">{s.label}</span>
                          <span className="text-[10px] text-slate-400">({s.time})</span>
                        </div>
                      ))}
                    </div>

                    {/* Meal instructions */}
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-500">Meal intake:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                          isFoodBefore
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        }`}
                      >
                        {isFoodBefore ? "🍽️ Before Food (Empty Stomach)" : "🍲 After Food / Meals"}
                      </span>
                    </div>
                  </div>

                  {/* Doctor notes or instructions */}
                  {m.instructions && (
                    <div className="mt-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Doctor instructions:</span>{" "}
                      <span>{m.instructions}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span>Prescribed by: </span>
                    <strong className="text-slate-700">{m.doctor || "Attending Physician"}</strong>
                  </div>
                  <span>Duration: {m.duration || "As prescribed"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyMedicines;

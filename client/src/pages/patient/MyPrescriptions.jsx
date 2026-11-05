import { useEffect, useState } from "react";
import PrescriptionModal from "../../components/PrescriptionModal.jsx";
import { getMyPrescriptions } from "../../services/api.js";
import { getDoctorDisplayName } from "../../utils/doctorName.js";
import { PageHeader } from "../../components/ui/index.js";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    let active = true;
    getMyPrescriptions()
      .then((d) => {
        if (active) setPrescriptions(d.prescriptions || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Unable to load prescriptions");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your prescriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-xs font-bold text-rose-800 shadow-2xs">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Digital Prescriptions", active: true },
        ]}
        title="My Prescriptions"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            ABDM Standard
          </span>
        }
        subtitle="View, download, and print your ABDM compliant digital prescriptions from Nivora Care Hospital."
      />

      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        {prescriptions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-slate-700 font-bold text-xl mb-3">
              ℞
            </div>
            <p className="text-sm font-bold text-slate-900">No prescriptions found</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any digital prescriptions on record yet. Prescriptions issued by your consulting doctor will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {prescriptions.map((rx) => {
              const doctor = rx.doctor || {};
              const meds = rx.medications || [];

              return (
                <li
                  key={rx._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-slate-50/60 rounded-xl px-3 transition-colors"
                >
                  {/* Left Side: Badge + Prescription Number + Doctor + Diagnosis */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl liquid-glass-subtle text-slate-900 border border-slate-200/80 font-black text-base shadow-2xs shrink-0 mt-0.5">
                      ℞
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {rx.prescriptionNumber}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-500 font-mono">
                          {formatDate(rx.createdAt)}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 mt-0.5 text-sm">
                        {getDoctorDisplayName(doctor, "Doctor")} — <span className="text-teal-800 font-semibold">{doctor.specialization || "General Medicine"}</span>
                      </p>

                      <p className="text-xs text-slate-700 mt-0.5">
                        <span className="font-semibold text-slate-800">Diagnosis:</span>{" "}
                        {rx.diagnosis}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {meds.slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full liquid-glass-pill bg-slate-50 border border-slate-200/70 text-slate-700"
                          >
                            {m.name.split(" ")[0]} ({m.frequency})
                          </span>
                        ))}
                        {meds.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            +{meds.length - 3} more
                          </span>
                        )}
                        {rx.followUpDate && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full liquid-glass-pill bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                            Follow-up: {formatDate(rx.followUpDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: View / Print Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPrescription(rx)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm shadow-teal-950/10 active:scale-95"
                    >
                      <span>℞ View & Print</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedPrescription && (
        <PrescriptionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </section>
  );
}

export default MyPrescriptions;

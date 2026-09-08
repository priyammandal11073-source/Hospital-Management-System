import { useEffect, useState } from "react";
import PrescriptionModal from "../../components/PrescriptionModal.jsx";
import { getMyPrescriptions } from "../../services/api.js";

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
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 py-6">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
        <span>Loading your prescriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">My prescriptions</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">
          View, download, and print your ABDM compliant digital prescriptions from Nivora Care Hospital.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/90 border border-slate-200">
        {prescriptions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold text-xl mb-2">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-slate-50/80 rounded-xl px-3 transition-colors"
                >
                  {/* Left Side: Badge + Prescription Number + Doctor + Diagnosis */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-black text-base ring-1 ring-teal-500/20 shrink-0 mt-0.5">
                      ℞
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-teal-800">
                          {rx.prescriptionNumber}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {formatDate(rx.createdAt)}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 mt-0.5">
                        Dr. {doctor.name || "Doctor"} — {doctor.specialization || "General Medicine"}
                      </p>

                      <p className="text-xs text-slate-700 mt-0.5">
                        <span className="font-bold text-slate-800">Diagnosis:</span>{" "}
                        {rx.diagnosis}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {meds.slice(0, 3).map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700"
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
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
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
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm shadow-teal-600/20"
                    >
                      <span>℞ View & print</span>
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

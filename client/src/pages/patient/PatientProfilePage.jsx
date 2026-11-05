import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

function PatientProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    contactNumber: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyProfile();
        if (active && res.patient) {
          setProfile(res.patient);
          setFormData({
            contactNumber: res.patient.contactNumber || "",
            address: res.patient.address || "",
            emergencyContactName: res.patient.emergencyContact?.name || "",
            emergencyContactPhone: res.patient.emergencyContact?.phone || "",
            emergencyContactRelation: res.patient.emergencyContact?.relationship || "",
          });
        }
      } catch (err) {
        if (active) setMessage({ type: "error", text: err.response?.data?.message || "Failed to load profile" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await updateMyProfile({
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation,
        },
      });
      setMessage({ type: "success", text: "Contact information updated successfully!" });
      if (res.patient) {
        setProfile(res.patient);
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your patient profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Health Identity & Profile", active: true },
        ]}
        title="My Health Identity & Profile"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Verified Patient
          </span>
        }
        subtitle="Manage your personal details, emergency contacts, and Ayushman Bharat ABHA credentials."
      />

      {message.text && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200/70"
              : "bg-rose-50 text-rose-800 border-rose-200/70"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ABHA & Health ID Card */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl font-bold text-slate-900 border border-slate-200/80 shadow-2xs">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full liquid-glass-pill bg-teal-50 border border-teal-200/70 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                  Ayushman Bharat ABDM
                </span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{profile?.name}</h2>
              <p className="font-mono text-xs text-slate-500 mt-0.5">
                ABHA ID: <span className="font-bold text-slate-800">{profile?.abhaId || "14-8891-2345-6789"}</span>
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-1 sm:border-l sm:border-slate-200/80 sm:pl-6">
            <p>Nivora Care UHID: <strong className="text-teal-800 font-mono font-bold">NC-{profile?._id?.toString().slice(-6).toUpperCase()}</strong></p>
            <p>Blood Group: <strong className="text-rose-700 font-bold">{profile?.bloodGroup || "O+"}</strong></p>
            <p>Age / Gender: <strong className="text-slate-800">{profile?.age} Yrs / {profile?.gender}</strong></p>
          </div>
        </div>
      </div>

      {/* Clinical Baseline Information (Read-only for clinical safety) */}
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">Clinical Baseline Information</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Medical history records verified by hospital medical administration.
        </p>

        <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5 font-mono">
              {profile?.dob
                ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "Not recorded"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Known Allergies</p>
            <p className="font-bold text-rose-700 text-xs mt-0.5">
              {profile?.allergies?.length ? profile.allergies.join(", ") : "No known drug allergies (NKDA)"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chronic Conditions</p>
            <p className="font-bold text-slate-800 text-xs mt-0.5">
              {profile?.chronicConditions?.length ? profile.chronicConditions.join(", ") : "None reported"}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Contact & Emergency Details Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Update Contact & Emergency Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep your phone number and emergency contact person updated to receive SMS appointment tokens and emergency notifications.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Primary Phone Number
            </label>
            <input
              type="text"
              required
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Residential Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              placeholder="City, State, PIN"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Emergency Contact Information
          </h4>

          <div className="mt-3 grid gap-3.5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Contact Person Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-700 focus:outline-hidden"
                placeholder="e.g. Spouse / Parent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Relationship</label>
              <input
                type="text"
                value={formData.emergencyContactRelation}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-700 focus:outline-hidden"
                placeholder="e.g. Mother, Brother"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Emergency Phone</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-teal-700 focus:outline-hidden font-mono"
                placeholder="+91 99999 88888"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold px-5 py-2 text-xs shadow-sm shadow-teal-950/10 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PatientProfilePage;

import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../../services/api.js";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
        <p className="mt-3 text-sm font-semibold text-slate-600">Loading your patient profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Health Identity & Profile</h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
            Verified Patient
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal details, emergency contacts, and Ayushman Bharat ABHA credentials.
        </p>
      </div>

      {message.text && (
        <div
          className={`rounded-2xl p-4 text-sm font-semibold border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ABHA & Health ID Card */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black backdrop-blur-xs border border-white/20">
              {profile?.name ? profile.name.charAt(0) : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-400/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                  Ayushman Bharat ABDM
                </span>
                <span className="text-xs text-emerald-400 font-semibold">● Active</span>
              </div>
              <h2 className="text-xl font-black mt-1">{profile?.name}</h2>
              <p className="font-mono text-sm text-blue-200 mt-0.5">
                ABHA ID: <span className="font-bold text-white">{profile?.abhaId || "14-8891-2345-6789"}</span>
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-blue-200 space-y-1">
            <p>Nivora Care UHID: <strong className="text-white font-mono">{profile?._id?.toString().slice(-8).toUpperCase()}</strong></p>
            <p>Blood Group: <strong className="text-rose-300 font-bold">{profile?.bloodGroup || "O+"}</strong></p>
            <p>Age / Gender: <strong className="text-white">{profile?.age} Yrs / {profile?.gender}</strong></p>
          </div>
        </div>
      </div>

      {/* Clinical Baseline Information (Read-only for clinical safety) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Clinical Baseline Information</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Medical history records verified by hospital medical administration.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">
              {profile?.dob
                ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "Not recorded"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Known Allergies</p>
            <p className="font-bold text-rose-700 text-sm mt-0.5">
              {profile?.allergies?.length ? profile.allergies.join(", ") : "No known drug allergies (NKDA)"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chronic Conditions</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">
              {profile?.chronicConditions?.length ? profile.chronicConditions.join(", ") : "None reported"}
            </p>
          </div>
        </div>
      </div>

      {/* Editable Contact & Emergency Details Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Update Contact & Emergency Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep your phone number and emergency contact person updated to receive SMS appointment tokens and emergency notifications.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Primary Phone Number
            </label>
            <input
              type="text"
              required
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Residential Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="City, State, PIN"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Emergency Contact Information
          </h4>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Contact Person Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Spouse / Parent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Relationship</label>
              <input
                type="text"
                value={formData.emergencyContactRelation}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Mother, Brother"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Emergency Phone</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                placeholder="+91 99999 88888"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PatientProfilePage;

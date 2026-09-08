import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminHospitalSettings, updateAdminHospitalSettings } from "../../services/api.js";

export default function HospitalSettingsPage() {
  const [settings, setSettings] = useState({
    hospitalName: "Nivora Care Hospital",
    tagline: "Excellence in Compassionate Healthcare",
    accreditation: "NABH Accredited & Ayushman Bharat (ABDM) Partner",
    emergencyHelpline: "108 / 112",
    hospitalPhone: "+91 11 2345 6789",
    hospitalEmail: "info@nivoracare.com",
    address: "Plot 12, Institutional Area, Health City",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    opdConsultationFee: 500,
    operatingHours: "24 Hours Continuous Emergency & Inpatient Care",
    tpaDeskContact: "+91 11 2345 6799",
    notificationEmailAlerts: true,
    systemMaintenanceMode: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await getAdminHospitalSettings();
        if (res.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load hospital settings.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await updateAdminHospitalSettings(settings);
      setSuccessMsg("Hospital institutional settings updated successfully.");
      if (res.settings) setSettings(res.settings);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save hospital settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading hospital settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Configuration</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Institutional Profile & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure hospital identification, emergency helplines, OPD consultation charges, and system preferences.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Hospital Identity */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500"></span>
              Institutional Identity & Accreditation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Appears on invoices, prescriptions, and public portals</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                value={settings.hospitalName || ""}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Accreditation / Affiliations</label>
            <input
              type="text"
              value={settings.accreditation || ""}
              onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Emergency & Helplines */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
              Emergency Helplines & Desks
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Displayed prominently in top navigation and patient emergency hubs</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">24/7 Emergency Number *</label>
              <input
                type="text"
                required
                value={settings.emergencyHelpline || ""}
                onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold text-rose-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TPA & Insurance Desk Phone</label>
              <input
                type="text"
                value={settings.tpaDeskContact || ""}
                onChange={(e) => setSettings({ ...settings, tpaDeskContact: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">General Reception Phone</label>
              <input
                type="text"
                value={settings.hospitalPhone || ""}
                onChange={(e) => setSettings({ ...settings, hospitalPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Administration Email</label>
              <input
                type="email"
                value={settings.hospitalEmail || ""}
                onChange={(e) => setSettings({ ...settings, hospitalEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Consultation Charges */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              Consultation & OPD Tariff Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Default fees applied for online patient appointment bookings</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base OPD Consultation Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={settings.opdConsultationFee || 500}
                onChange={(e) => setSettings({ ...settings, opdConsultationFee: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours Description</label>
              <input
                type="text"
                value={settings.operatingHours || ""}
                onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Physical Address */}
        <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
              Hospital Physical Location
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={settings.city || ""}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                value={settings.state || ""}
                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Postal / Pin Code</label>
              <input
                type="text"
                value={settings.postalCode || ""}
                onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isSaving ? "Saving Configuration..." : "Save Institutional Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPatient } from "../../services/api.js";
import HospitalLogo from "../../components/HospitalLogo.jsx";

function PatientRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    contactNumber: "",
    abhaId: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.age ||
      !formData.gender ||
      !formData.contactNumber.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPatient({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender,
        contactNumber: formData.contactNumber.trim(),
        abhaId: formData.abhaId.trim() || undefined,
      });
      navigate("/patient/login", {
        state: { message: "Registration successful! Please log in with your email and password." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center overflow-x-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

      {/* Patient Register Card */}
      <section className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Animated Hospital Branding Top Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" className="transition hover:opacity-95 cursor-pointer" title="Home page">
            <HospitalLogo variant="full" isDark={true} className="justify-center" />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            New patient registration
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Full legal name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Email address *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="rahul.sharma@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Password *
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Age *
              </label>
              <input
                name="age"
                type="number"
                min="0"
                required
                placeholder="32"
                value={formData.age}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Gender *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select</option>
                <option value="Male" className="bg-slate-900">Male</option>
                <option value="Female" className="bg-slate-900">Female</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Contact number (10-digit mobile) *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700/80 bg-slate-800/90 text-xs text-slate-400 font-mono">
                +91
              </span>
              <input
                name="contactNumber"
                required
                placeholder="98765 43210"
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full rounded-r-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono"
                type="tel"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              ABHA number (Ayushman Bharat, optional)
            </label>
            <input
              name="abhaId"
              placeholder="e.g. 14-8891-2345-6789 or username@abdm"
              value={formData.abhaId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono text-xs"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-800/50 bg-rose-950/60 p-3 text-xs font-medium text-rose-300" role="alert">
              <svg className="h-4 w-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Registering patient...
              </span>
            ) : (
              "Complete registration"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/patient/login" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
            Sign in to patient portal →
          </Link>
        </p>
      </section>
    </main>
  );
}

export default PatientRegister;

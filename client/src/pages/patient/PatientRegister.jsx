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
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.age ||
      !formData.gender ||
      !formData.contactNumber
    ) {
      setError("All fields are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPatient({ ...formData, age: Number(formData.age) });
      navigate("/patient/login");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

      {/* Patient Register Card */}
      <section className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Animated Hospital Branding Top Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <HospitalLogo variant="full" isDark={true} className="justify-center" />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            New Patient Registration
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Full Legal Name
            </label>
            <input
              name="name"
              required
              placeholder="Jane Doe"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="patient@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Password
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
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Age
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
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Gender
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Contact Number
            </label>
            <input
              name="contactNumber"
              required
              placeholder="+91 98765 43210"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-800/80 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              type="tel"
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
                Registering Patient...
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/patient/login" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
            Sign In to Patient Portal →
          </Link>
        </p>
      </section>
    </main>
  );
}

export default PatientRegister;

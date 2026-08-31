import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPatient } from "../../services/api.js";

function PatientRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", age: "", gender: "", contactNumber: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.name || !formData.email || !formData.password || !formData.age || !formData.gender || !formData.contactNumber) {
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-800">Patient Registration</h1>
        <p className="mt-2 text-sm text-slate-600">Create your patient portal account.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">Name <input name="name" required value={formData.name} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Email <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Password <input name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">Age <input name="age" type="number" min="0" required value={formData.age} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium text-slate-700">Gender <select name="gender" required value={formData.gender} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
          </div>
          <label className="block text-sm font-medium text-slate-700">Contact number <input name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="tel" /></label>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400" disabled={isSubmitting} type="submit">{isSubmitting ? "Registering..." : "Register"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">Already have an account? <Link to="/patient/login" className="font-medium text-blue-600 hover:underline">Login</Link></p>
      </section>
    </main>
  );
}

export default PatientRegister;

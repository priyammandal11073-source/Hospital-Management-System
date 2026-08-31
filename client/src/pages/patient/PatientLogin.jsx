import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext.jsx";

function PatientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = usePatientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <p className="p-6 text-center text-slate-600">Checking patient session...</p>;
  if (isAuthenticated) return <Navigate to="/patient/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/patient/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-800">Patient Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to access your patient portal.</p>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="p-email">Email address</label>
            <input id="p-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" autoComplete="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="p-password">Password</label>
            <input id="p-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" autoComplete="current-password" />
          </div>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          No account? <Link to="/patient/register" className="font-medium text-blue-600 hover:underline">Register</Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Staff? <Link to="/login" className="text-blue-600 hover:underline">Staff login</Link>
        </p>
      </section>
    </main>
  );
}

export default PatientLogin;

import { Navigate, Outlet } from "react-router-dom";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";

function PatientProtectedRoute() {
  const { isAuthenticated, loading } = usePatientAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading patient session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/patient/login" replace />;
  }
  return <Outlet />;
}

export default PatientProtectedRoute;

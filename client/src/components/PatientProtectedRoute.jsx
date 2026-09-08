import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";

function PatientProtectedRoute() {
  const { isAuthenticated: isUnifiedAuth, user, loading: unifiedLoading } = useAuth();
  const { isAuthenticated: isPatientAuth, loading: patientLoading } = usePatientAuth();

  if (unifiedLoading || patientLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-600">Loading patient session...</div>;
  }

  const isAuthed = isPatientAuth || (isUnifiedAuth && user?.role === "patient");

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default PatientProtectedRoute;

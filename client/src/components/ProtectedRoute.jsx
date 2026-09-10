import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Wait for localStorage to be read before deciding where to send the user.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Loading your session...
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Patient accounts cannot access any staff routes
  if (user.role === "patient") {
    return <Navigate to="/patient/dashboard" replace />;
  }

  const role = user.role;
  const path = location.pathname;

  const DIAGNOSTIC_ROLES = [
    "admin",
    "super_admin",
    "diagnostic_admin",
    "pathologist",
    "radiologist",
    "lab_technician",
    "radiology_technician",
  ];

  // Enforce role-based URL access control across specialized areas
  if (path.startsWith("/admin") && role !== "admin" && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/doctor") && role !== "doctor" && role !== "admin" && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/nurse") && role !== "nurse" && role !== "admin" && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/pharmacy") && role !== "pharmacist" && role !== "admin" && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/reception") && role !== "receptionist" && role !== "admin" && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/diagnostic") && !DIAGNOSTIC_ROLES.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

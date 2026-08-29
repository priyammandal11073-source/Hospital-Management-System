import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navLinkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-blue-600 text-white"
      : "text-slate-300 hover:bg-slate-700 hover:text-white"
  }`;

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="w-full bg-slate-900 p-4 text-white md:min-h-screen md:w-64">
        <h1 className="mb-8 text-xl font-bold">Hospital HMS</h1>

        <nav className="space-y-2" aria-label="Main navigation">
          <NavLink className={navLinkClass} to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className={navLinkClass} to="/patients">
            Patients
          </NavLink>
          {isAdmin && (
            <NavLink className={navLinkClass} to="/doctors">
              Doctors
            </NavLink>
          )}
          <NavLink className={navLinkClass} to="/appointments">
            Appointments
          </NavLink>
          <NavLink className={navLinkClass} to="/billing">
            Billing
          </NavLink>
          {isAdmin && (
            <NavLink className={navLinkClass} to="/reports">
              Reports
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="font-semibold text-slate-800">{user?.name || "Staff member"}</p>
            <p className="text-sm capitalize text-slate-500">{user?.role || "staff"}</p>
          </div>
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

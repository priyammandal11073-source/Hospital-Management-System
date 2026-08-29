import React from "react";
import { Navbar } from "../u";
import { Button } from "../u/button";
import { Badge } from "../u/badge";

const DashboardLayout = ({
  title = "Hospital Management",
  userRole = "receptionist",
  children,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar userRole={userRole} onLogout={onLogout} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
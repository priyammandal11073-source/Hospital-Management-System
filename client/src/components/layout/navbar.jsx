import React from "react";

const SidebarLink = ({
  href,
  children,
  isActive,
  onClick,
  ...props
}) => {
  return (
    <a
      href={href}
      className={`
        block px-3 py-2 rounded-md text-sm font-medium 
        ${isActive 
          ? "bg-primary-100 text-primary" 
          : "text-neutral-500 hover:text-primary hover:bg-primary-50"
        }
        ${props.className}
      `}
      {...props}
    >
      {children}
    </a>
  );
};

const Navbar = ({ userRole = "receptionist", onLogout }) => {
  const links = {
    admin: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/patients", label: "Patients" },
      { href: "/doctors", label: "Doctors" },
      { href: "/appointments", label: "Appointments" },
      { href: "/billing", label: "Billing" },
    ],
    doctor: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/appointments", label: "Appointments" },
    ],
    receptionist: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/patients", label: "Patients" },
      { href: "/appointments", label: "Appointments" },
      { href: "/billing", label: "Billing" },
    ],
  };

  const items = links[userRole] || links.receptionist;

  return (
    <div className="flex items-center gap-3">
      {items.map((item, index) => (
        <SidebarLink
          key={index}
          href={item.href}
          isActive={item.href === "/dashboard"}
          onClick={onLogout}
        >
          {item.label}
        </SidebarLink>
      ))}
      <span className="text-xs text-neutral-500">
        {userRole}
      </span>
    </div>
  );
};

export { Navbar, SidebarLink };
import React from "react";

/**
 * Apple macOS style Sidebar Toggle Icon (sidebar.leading / sidebar.left)
 * Pure, minimalist, borderless and background-less icon button.
 */
export function AppleSidebarToggleIcon({ collapsed, className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Outer macOS window container */}
      <rect x="3" y="4" width="18" height="16" rx="3.5" />
      {/* Vertical sidebar dividing line */}
      <line x1="9" y1="4" x2="9" y2="20" />
      {/* Directional chevron matching macOS behavior */}
      {collapsed ? (
        <path d="M13 9.5l2.5 2.5-2.5 2.5" />
      ) : (
        <path d="M15.5 9.5L13 12l2.5 2.5" />
      )}
    </svg>
  );
}

/**
 * Pure button with NO background, NO border, and NO shadow,
 * adhering to Emil Kowalski's tactile micro-interactions and the user's explicit request.
 */
export function SidebarCollapseButton({
  collapsed,
  onToggle,
  className = "",
  size = "md",
}) {
  const sizeClasses =
    size === "sm"
      ? "h-6 w-6"
      : "h-7 w-7";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center justify-center ${sizeClasses} bg-transparent hover:bg-transparent border-0 shadow-none text-slate-400 hover:text-slate-800 active:text-slate-950 transition-[transform,color] duration-120 ease-out active:scale-[0.90] cursor-pointer flex-shrink-0 touch-target ${className}`}
      title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
    >
      <AppleSidebarToggleIcon collapsed={collapsed} />
    </button>
  );
}

export default SidebarCollapseButton;

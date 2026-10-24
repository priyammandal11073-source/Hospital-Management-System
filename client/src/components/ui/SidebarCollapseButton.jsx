import React from "react";

/**
 * Apple macOS style Sidebar Toggle Button with precise SF Symbol iconography
 * (sidebar.leading / sidebar.left) and Emil Kowalski tactile press micro-interactions.
 */
export function AppleSidebarToggleIcon({ collapsed, className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
        <path d="M13 9l3 3-3 3" />
      ) : (
        <path d="M16 9l-3 3 3 3" />
      )}
    </svg>
  );
}

export function SidebarCollapseButton({
  collapsed,
  onToggle,
  className = "",
  size = "md",
}) {
  const sizeClasses =
    size === "sm"
      ? "h-7 w-7 rounded-lg"
      : "h-7 w-7 sm:h-8 sm:w-8 rounded-lg";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center justify-center ${sizeClasses} bg-slate-200/60 hover:bg-slate-200/95 active:bg-slate-300/80 text-slate-700 hover:text-slate-900 border border-slate-300/60 shadow-2xs transition-[transform,background-color,border-color] duration-120 ease-out active:scale-[0.92] cursor-pointer flex-shrink-0 touch-target ${className}`}
      title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
    >
      <AppleSidebarToggleIcon collapsed={collapsed} />
    </button>
  );
}

export default SidebarCollapseButton;

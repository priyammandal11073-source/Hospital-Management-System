import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

/**
 * ActionDropdown - Minimalist Liquid Glass Row Actions Menu
 * Built following Emil Kowalski's Design Engineering principles:
 * - Origin-aware entrance scaling from 0.95 (never 0)
 * - 160ms ease-out cubic-bezier transition
 * - Tactile active:scale-[0.95] feedback
 * - Liquid glass elevated material with crisp specular top rim
 * - Accessible keyboard & click-outside dismissal
 */
export default function ActionDropdown({
  items = [],
  triggerClassName = "",
  menuClassName = "",
  align = "right",
  label = "More actions",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  // Filter out falsy items (conditional actions)
  const validItems = items.filter(Boolean);

  if (validItems.length === 0) return null;

  const alignClass = align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right";

  return (
    <div ref={containerRef} className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={label}
        className={`liquid-glass-pill h-8 w-8 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-[0.95] transition-[transform,color,background-color] duration-150 cursor-pointer touch-target ${triggerClassName}`}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>

      {/* Origin-Aware Liquid Glass Dropdown Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            animation: "actionMenuEnter 160ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
          }}
          className={`absolute ${alignClass} mt-1.5 w-56 z-50 liquid-glass-elevated rounded-2xl p-1.5 shadow-xl ring-1 ring-slate-900/5 focus:outline-none ${menuClassName}`}
        >
          <div className="space-y-0.5">
            {validItems.map((item, index) => {
              const isDanger = item.variant === "danger";

              const itemClass = `group w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-[background-color,color,transform] duration-150 active:scale-[0.98] cursor-pointer ${
                item.disabled
                  ? "opacity-40 cursor-not-allowed pointer-events-none text-slate-400"
                  : isDanger
                  ? "text-rose-600 hover:bg-rose-50/80 active:bg-rose-100/80"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 active:bg-slate-200/60"
              } ${item.className || ""}`;

              const content = (
                <>
                  {item.icon && (
                    <span className="flex-shrink-0 text-sm leading-none flex items-center justify-center w-4 h-4">
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full liquid-glass-pill px-1.5 py-0.2 text-[9px] font-semibold text-slate-500">
                      {item.badge}
                    </span>
                  )}
                </>
              );

              return (
                <React.Fragment key={item.key || item.label || index}>
                  {item.dividerBefore && <div className="my-1 border-t border-slate-200/60" />}
                  {item.to ? (
                    <Link
                      to={item.to}
                      role="menuitem"
                      onClick={() => {
                        closeMenu();
                        if (item.onClick) item.onClick();
                      }}
                      className={itemClass}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                        if (item.onClick) item.onClick(e);
                      }}
                      className={itemClass}
                    >
                      {content}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

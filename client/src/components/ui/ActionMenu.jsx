import React, { useState, useRef, useEffect } from "react";

function ActionMenu({
  triggerLabel = "Actions",
  triggerIcon,
  items = [],
  className = "",
  triggerClassName = "",
  align = "right",
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    if (open && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [open, focusedIndex]);

  const nonDividerIndices = items
    .map((item, idx) => (!item.divider && !item.disabled ? idx : null))
    .filter((idx) => idx !== null);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        const currentPos = nonDividerIndices.indexOf(focusedIndex);
        const nextPos = (currentPos + 1) % nonDividerIndices.length;
        setFocusedIndex(nonDividerIndices[nextPos]);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (open) {
        const currentPos = nonDividerIndices.indexOf(focusedIndex);
        const prevPos = (currentPos - 1 + nonDividerIndices.length) % nonDividerIndices.length;
        setFocusedIndex(nonDividerIndices[prevPos]);
      }
    }
  };

  const handleItemClick = (item, event) => {
    event.preventDefault();
    if (!item.disabled && item.onClick) {
      item.onClick(event);
    }
    setOpen(false);
  };

  const dropdownOrigin = align === "left" ? "top left" : "top right";

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={menuRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-150 active:scale-95 shadow-2xs ${
          open
            ? "bg-slate-100 text-slate-700"
            : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50"
        } ${triggerClassName}`}
        aria-expanded={open}
        aria-haspopup="true"
        title={triggerLabel}
      >
        {triggerIcon || (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        )}
        {triggerLabel && <span>{triggerLabel}</span>}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-150 ease-out shrink-0 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          style={{ "--dropdown-origin": dropdownOrigin }}
          className={`absolute z-50 mt-1.5 min-w-[180px] rounded-xl bg-white/95 backdrop-blur-md shadow-md ring-1 ring-slate-200/80 py-1 animate-dropdown-in ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {items.map((item, idx) =>
            item.divider ? (
              <div
                key={`divider-${idx}`}
                className="border-t border-slate-100 my-1"
                role="separator"
              />
            ) : (
              <button
                key={item.label || idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                type="button"
                disabled={item.disabled}
                onClick={(e) => handleItemClick(item, e)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors duration-150 ${
                  item.danger
                    ? "text-rose-700 hover:bg-rose-50 active:bg-rose-100 focus:bg-rose-50"
                    : item.primary
                    ? "text-blue-700 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50"
                    : "text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:bg-slate-50"
                } ${item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} focus:outline-none`}
                role="menuitem"
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">
                    {item.shortcut}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
export { ActionMenu };
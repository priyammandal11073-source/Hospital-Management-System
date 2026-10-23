import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  isLoading = false,
  leftIcon = null,
  rightIcon = null,
  disabled = false,
  ...props
}) => {
  const variants = {
    default: "bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 focus-visible:ring-2 focus-visible:ring-teal-700/30 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    primary: "bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 focus-visible:ring-2 focus-visible:ring-teal-700/30 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    blue: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    secondary: "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    outline: "border border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-200 font-medium",
    ghost: "text-slate-700 hover:bg-slate-100/80 active:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300 shadow-none font-medium",
    link: "underline text-teal-700 hover:text-teal-900 p-0 h-auto shadow-none font-medium",
  };

  const sizes = {
    sm: "min-h-[32px] px-2.5 py-1 text-xs font-semibold gap-1.5 touch-target",
    md: "min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold gap-2 touch-target",
    lg: "min-h-[44px] px-4.5 py-2 text-sm font-semibold gap-2 touch-target",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`
        inline-flex items-center justify-center rounded-xl 
        focus-visible:outline-none select-none
        transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 ease-out
        active:scale-[0.97]
        ${variants[variant] || variants.default} 
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0 inline-flex items-center" aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0 inline-flex items-center" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
export { Button };

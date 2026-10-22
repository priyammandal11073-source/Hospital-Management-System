import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  ...props
}) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    primary: "bg-blue-600 text-white hover:bg-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    danger: "bg-rose-600 text-white hover:bg-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-1 disabled:opacity-50 shadow-2xs font-medium",
    outline: "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 font-medium",
    link: "underline text-blue-600 hover:text-blue-800 p-0 h-auto shadow-none font-medium",
  };

  const sizes = {
    sm: "min-h-[32px] px-2.5 py-1 text-xs font-semibold touch-target",
    md: "min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold touch-target",
    lg: "min-h-[44px] px-4.5 py-2 text-sm font-semibold touch-target",
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center rounded-xl 
        transition-all duration-150 focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer select-none
        active:scale-[0.97]
        ${variants[variant] || variants.default} 
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
export { Button };

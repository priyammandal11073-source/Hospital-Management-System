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
    default: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 shadow-2xs",
    primary: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 shadow-2xs",
    secondary: "bg-white/70 backdrop-blur-md border border-slate-300/80 text-slate-700 hover:bg-white hover:text-slate-900 focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:opacity-50 shadow-2xs",
    danger: "bg-rose-700 text-white hover:bg-rose-800 focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 disabled:opacity-50 shadow-2xs",
    success: "bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-50 shadow-2xs",
    outline: "border border-slate-300/80 text-slate-700 bg-white/40 backdrop-blur-md hover:bg-white/70 focus:ring-2 focus:ring-slate-300",
    link: "underline text-blue-700 hover:text-blue-900 p-0 h-auto shadow-none",
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
        inline-flex items-center justify-center rounded-lg 
        transition-all duration-150 focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-1 cursor-pointer select-none
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

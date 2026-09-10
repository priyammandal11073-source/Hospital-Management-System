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
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm",
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:opacity-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    link: "underline text-blue-600 hover:text-blue-800 p-0 h-auto shadow-none",
  };

  const sizes = {
    sm: "min-h-[36px] sm:min-h-[32px] px-3 py-1.5 text-xs sm:text-sm touch-target",
    md: "min-h-[44px] px-4 py-2 text-sm sm:text-base touch-target",
    lg: "min-h-[48px] px-6 py-2.5 text-base sm:text-lg touch-target",
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center rounded-xl 
        font-semibold transition-all duration-150 focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer select-none
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

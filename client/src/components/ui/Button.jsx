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
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center rounded-lg 
        font-medium transition-colors focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-2 
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

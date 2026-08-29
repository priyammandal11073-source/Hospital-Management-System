import React from "react";

const Button = ({
  children,
  variant = "default",
  size = "md",
  className,
  ...props
}) => {
  const variants = {
    default: "bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50",
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50",
    secondary: "bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-2 focus:ring-secondary-300 focus:ring-offset-1 disabled:opacity-50",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50",
    outline: "border border-primary text-primary hover:bg-primary-50 focus:ring-2 focus:ring-primary-50 focus:ring-offset-2",
    link: "underline text-primary hover:text-primary-dark",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-base",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md 
        font-medium transition-colors focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-offset-2 
        ${variants[variant]} 
        ${sizes[size]}
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
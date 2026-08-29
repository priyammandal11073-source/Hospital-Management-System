import React from "react";

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  disabled,
  className,
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full rounded-md border border-border px-3 py-2 
        text-sm focus:outline-none focus:ring-2 focus:ring-primary 
        focus:border-primary transition-colors 
        ${className}
      `}
      {...props}
    />
  );
};

export default Input;
export { Input };
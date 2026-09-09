import React from "react";

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  className = "",
  label,
  error,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full rounded-lg border border-slate-300 px-3 py-2 
          text-sm text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          disabled:bg-slate-50 disabled:text-slate-500 transition-colors 
          ${error ? "border-rose-500 focus:ring-rose-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
};

export default Input;
export { Input };

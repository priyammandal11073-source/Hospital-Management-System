import React, { useId } from "react";

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  disabled = false,
  className = "",
  label,
  error,
  id: customId,
  ...props
}) => {
  const generatedId = useId();
  const inputId = customId || (label ? generatedId : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`
          w-full rounded-xl border border-control bg-white px-3.5 py-2 min-h-11
          text-xs sm:text-sm text-slate-900 placeholder:text-slate-600
          focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 focus:border-teal-700
          disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-400 disabled:opacity-100
          read-only:bg-slate-100
          transition-[border-color,box-shadow,background-color] duration-150 ease-out
          ${error ? "border-rose-700 focus:ring-rose-700 focus:border-rose-700" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-700 animate-pop-in">{error}</p>}
    </div>
  );
};

export default Input;
export { Input };

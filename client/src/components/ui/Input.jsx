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
          w-full rounded-xl border border-slate-300/80 bg-white/85 backdrop-blur-md px-3.5 py-2 min-h-[38px]
          text-xs sm:text-sm text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-2 focus:border-sky-500
          disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200/50
          transition-[border-color,box-shadow,background-color] duration-150 ease-out
          ${error ? "border-rose-500 focus:ring-rose-500/40 focus:border-rose-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-rose-600 animate-pop-in">{error}</p>}
    </div>
  );
};

export default Input;
export { Input };

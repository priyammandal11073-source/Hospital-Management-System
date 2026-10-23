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
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
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
        className={`
          w-full rounded-xl border border-slate-300/80 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md px-3.5 py-2 min-h-[38px]
          text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 dark:focus:ring-teal-400/20 dark:focus:border-teal-400
          disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500
          transition-[border-color,box-shadow] duration-150
          ${error ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};

export default Input;
export { Input };

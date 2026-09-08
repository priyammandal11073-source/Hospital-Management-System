/**
 * PaymentMethodSelect – reusable payment method picker with icons.
 * Supports: cash, UPI, card, insurance
 */

const METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: "💵",
    description: "Pay at the counter",
  },
  {
    value: "upi",
    label: "UPI",
    icon: "📲",
    description: "PhonePe · GPay · Paytm",
  },
  {
    value: "card",
    label: "Card",
    icon: "💳",
    description: "Debit / Credit card",
  },
  {
    value: "insurance",
    label: "Insurance",
    icon: "🏥",
    description: "Health insurance claim",
  },
];

/**
 * @param {{
 *   value: string,
 *   onChange: (value: string) => void,
 *   label?: string,
 *   disabled?: boolean
 * }} props
 */
function PaymentMethodSelect({ value, onChange, label = "Payment Method", disabled = false }) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map((method) => {
          const isSelected = value === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={[
                "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 focus:outline-none",
                isSelected
                  ? "border-teal-500 bg-teal-50 shadow-md scale-105"
                  : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <span className="text-2xl">{method.icon}</span>
              <span
                className={`text-xs font-bold ${
                  isSelected ? "text-teal-700" : "text-slate-700"
                }`}
              >
                {method.label}
              </span>
              <span className="text-[10px] leading-tight text-slate-500">
                {method.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentMethodSelect;

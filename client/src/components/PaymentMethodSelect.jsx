/**
 * PaymentMethodSelect – comprehensive hospital payment method selector with icons.
 * Supports: cash, upi, card, insurance, netbanking, wallet, cheque
 */

const METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: "💵",
    description: "Counter cash payment",
  },
  {
    value: "upi",
    label: "Instant UPI",
    icon: "📲",
    description: "PhonePe · GPay · Paytm",
  },
  {
    value: "card",
    label: "Online Card",
    icon: "💳",
    description: "Debit / Credit card gateway",
  },
  {
    value: "insurance",
    label: "Health Insurance",
    icon: "🏥",
    description: "Cashless TPA & Ayushman",
  },
  {
    value: "netbanking",
    label: "Net Banking",
    icon: "🏦",
    description: "SBI · HDFC · ICICI · NEFT",
  },
  {
    value: "wallet",
    label: "Hospital Wallet",
    icon: "👛",
    description: "Prepaid patient deposit",
  },
  {
    value: "cheque",
    label: "Cheque / DD",
    icon: "📜",
    description: "Bank draft & CTS cheque",
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {METHODS.map((method) => {
          const isSelected = value === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={[
                "flex flex-col items-center justify-between gap-1 rounded-xl border-2 px-2.5 py-3 text-center transition-all duration-200 focus:outline-none min-h-[100px]",
                isSelected
                  ? "border-teal-600 bg-teal-50 shadow-md scale-102 ring-1 ring-teal-500"
                  : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/40",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <span className="text-2xl">{method.icon}</span>
              <span
                className={`text-xs font-bold ${
                  isSelected ? "text-teal-800" : "text-slate-800"
                }`}
              >
                {method.label}
              </span>
              <span className="text-[10px] leading-tight text-slate-500 line-clamp-1 font-medium">
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

/**
 * PaymentMethodSelect – comprehensive hospital payment method selector with icons.
 * Supports: razorpay, upi, card, insurance, netbanking, wallet, cheque, cash
 */

const METHODS = [
  {
    value: "razorpay",
    label: "Razorpay Online Gateway",
    icon: "💳",
    description: "UPI · Cards · NetBanking · Wallets",
    featured: true,
  },
  {
    value: "insurance",
    label: "Health Insurance",
    icon: "🏥",
    description: "Cashless TPA & Ayushman Desk",
  },
  {
    value: "cash",
    label: "Cash",
    icon: "💵",
    description: "Counter cash payment at desk",
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {METHODS.map((method) => {
          const isSelected = value === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={[
                "relative flex flex-col items-center justify-between gap-1.5 rounded-2xl border-2 p-4 text-center transition-all duration-200 focus:outline-none min-h-[105px]",
                isSelected
                  ? "border-teal-600 bg-gradient-to-b from-teal-50 to-white shadow-lg shadow-teal-700/10 ring-2 ring-teal-600/20"
                  : method.featured
                  ? "border-teal-200 bg-teal-50/30 hover:border-teal-400 hover:bg-teal-50/60"
                  : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {method.featured && (
                <span className="absolute -top-2.5 bg-teal-700 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider">
                  Razorpay Powered
                </span>
              )}
              <span className="text-2xl mt-0.5">{method.icon}</span>
              <span
                className={`text-xs font-black ${
                  isSelected ? "text-teal-950" : "text-slate-900"
                }`}
              >
                {method.label}
              </span>
              <span className="text-[10px] leading-tight text-slate-500 line-clamp-1 font-semibold">
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

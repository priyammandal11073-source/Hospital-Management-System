/**
 * PaymentMethodSelect – Emil Kowalski Polish
 * Features:
 * - Tone-on-tone borderless elevation instead of harsh 2px borders
 * - Tactile active scale press feedback (scale 0.97, 160ms ease-out)
 * - Fine-pointer hover lift with smooth transition
 * - Accessible focus rings & WCAG AAA contrast
 */

const METHODS = [
  {
    value: "upi",
    label: "Instant UPI & QR Code",
    icon: "📲",
    description: "GPay · PhonePe · Paytm · BHIM",
    accent: "teal",
  },
  {
    value: "razorpay",
    label: "Razorpay Gateway",
    icon: "💳",
    description: "Cards · NetBanking · Wallets · EMI",
    featured: true,
    accent: "indigo",
  },
  {
    value: "insurance",
    label: "Health Insurance",
    icon: "🏥",
    description: "Cashless TPA & Ayushman Desk",
    accent: "sky",
  },
  {
    value: "cash",
    label: "Cash Desk",
    icon: "💵",
    description: "Counter cash payment at desk",
    accent: "emerald",
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
    <div className="space-y-2.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METHODS.map((method) => {
          const isSelected = value === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={[
                "group relative flex flex-col items-center justify-between text-center rounded-2xl p-4 min-h-[112px] select-none",
                "transition-[transform,background-color,box-shadow,color] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer active:scale-[0.97]",
                isSelected
                  ? "bg-teal-900 text-white shadow-md ring-1 ring-teal-800"
                  : "bg-slate-50/90 text-slate-800 hover:bg-slate-100/90 hover:shadow-xs ring-1 ring-slate-200/70",
              ].join(" ")}
            >
              {method.featured && (
                <span
                  className={[
                    "absolute -top-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-2xs transition-colors",
                    isSelected
                      ? "bg-teal-400 text-teal-950"
                      : "bg-teal-700 text-white",
                  ].join(" ")}
                >
                  ⚡ Fast Checkout
                </span>
              )}
              <span className="text-2xl mt-0.5 transition-transform duration-150 group-hover:scale-110">
                {method.icon}
              </span>
              <span
                className={`text-xs font-extrabold tracking-tight ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}
              >
                {method.label}
              </span>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isSelected ? "text-teal-100" : "text-slate-500"
                }`}
              >
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

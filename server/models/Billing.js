import mongoose from "mongoose";

const itemizedChargeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Charge description is required"],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, "Charge cost is required"],
      min: [0, "Charge cost cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

const cardDetailsSchema = new mongoose.Schema(
  {
    cardLast4: { type: String, trim: true },
    cardBrand: { type: String, trim: true, default: "Visa" },
    transactionRef: { type: String, trim: true },
  },
  { _id: false }
);

const insuranceDetailsSchema = new mongoose.Schema(
  {
    providerName: { type: String, trim: true, default: "" },
    policyNumber: { type: String, trim: true, default: "" },
    claimId: { type: String, trim: true, default: "" },
    insuredMemberName: { type: String, trim: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending_verification", "approved", "rejected"],
      default: "pending_verification",
    },
  },
  { _id: false }
);

const netbankingDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, default: "" },
    transactionRef: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const walletDetailsSchema = new mongoose.Schema(
  {
    walletAccountId: { type: String, trim: true, default: "" },
    transactionRef: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const chequeDetailsSchema = new mongoose.Schema(
  {
    chequeNumber: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    micrCode: { type: String, trim: true, default: "" },
    transactionRef: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
    },
    diagnosticOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
    },
    itemizedCharges: {
      type: [itemizedChargeSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "partially_paid", "cancelled", "refunded"],
        message: "Please provide a valid payment status",
      },
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["cash", "card", "insurance", "upi", "netbanking", "wallet", "cheque", "razorpay"],
        message: "Please provide a valid payment method",
      },
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: "",
    },
    refundDetails: {
      reason: { type: String, trim: true, default: "" },
      amount: { type: Number, default: 0 },
      refundedAt: { type: Date },
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["Requested", "Approved", "Completed", "Rejected"],
        default: "Completed",
      },
    },
    upiTransactionId: {
      type: String,
      trim: true,
    },
    upiPayerVpa: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    cardDetails: {
      type: cardDetailsSchema,
      default: null,
    },
    insuranceDetails: {
      type: insuranceDetailsSchema,
      default: null,
    },
    netbankingDetails: {
      type: netbankingDetailsSchema,
      default: null,
    },
    walletDetails: {
      type: walletDetailsSchema,
      default: null,
    },
    chequeDetails: {
      type: chequeDetailsSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Keep the stored invoice total in sync with its itemized charges and assign invoiceNumber if absent.
// `pre('validate')` runs before required-field validation for totalAmount.
billingSchema.pre("validate", function calculateTotalAmount() {
  this.totalAmount = (this.itemizedCharges || []).reduce(
    (total, charge) => total + charge.cost,
    0
  );

  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.invoiceNumber = `INV-${year}-${randomSuffix}`;
  }
});

// Compound indexes for fast patient billing history, payment status queries, and references
billingSchema.index({ patient: 1, paymentStatus: 1, createdAt: -1 });
billingSchema.index({ paymentStatus: 1, createdAt: -1 });
billingSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });
billingSchema.index({ appointment: 1 }, { sparse: true });
billingSchema.index({ diagnosticOrder: 1 }, { sparse: true });

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;

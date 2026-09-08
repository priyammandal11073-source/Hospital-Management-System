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
        values: ["pending", "paid", "partially_paid"],
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
        values: ["cash", "card", "insurance", "upi"],
        message: "Please provide a valid payment method",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Keep the stored invoice total in sync with its itemized charges.
// `pre('validate')` runs before required-field validation for totalAmount.
billingSchema.pre("validate", function calculateTotalAmount() {
  this.totalAmount = this.itemizedCharges.reduce(
    (total, charge) => total + charge.cost,
    0
  );
});

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;

import mongoose from 'mongoose';

/**
 * Records each quote-credit purchase for invoice and history.
 * Created when a professional buys a plan or custom credits.
 */
const creditPurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    amountPounds: {
      type: Number,
      required: true,
      min: 0,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
      enum: ['Basic', 'Standard', 'Premium', 'Custom'],
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

creditPurchaseSchema.index({ userId: 1, purchasedAt: -1 });
creditPurchaseSchema.index({ invoiceNumber: 1 });

const CreditPurchase = mongoose.models?.CreditPurchase || mongoose.model('CreditPurchase', creditPurchaseSchema);
export default CreditPurchase;

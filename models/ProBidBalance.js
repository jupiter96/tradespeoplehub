import mongoose from 'mongoose';

/**
 * Per-professional quote credit balance (one credit consumed per quote sent).
 * - freeBidsRemaining: remaining free quote credits for the current period.
 * - freeBidsResetAt: start of next free-credit period (e.g. start of next month).
 * - purchasedBlocks: blocks of credits bought via packs; each expires after validityMonths.
 */
const purchasedBlockSchema = new mongoose.Schema(
  {
    bids: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const proBidBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    freeBidsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    freeBidsResetAt: {
      type: Date,
      default: null,
    },
    purchasedBlocks: {
      type: [purchasedBlockSchema],
      default: [],
    },
  },
  { timestamps: true }
);

proBidBalanceSchema.index({ userId: 1 });

/**
 * Ensure free quote credits are reset if we're past freeBidsResetAt (new month).
 * Call this when reading balance.
 */
proBidBalanceSchema.statics.ensureFreeBidsReset = async function (balance, settings) {
  if (!balance || !settings) return balance;
  const now = new Date();
  const resetAt = balance.freeBidsResetAt ? new Date(balance.freeBidsResetAt) : null;
  if (resetAt && now >= resetAt) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    balance.freeBidsRemaining = settings.freeBidsPerMonth ?? 0;
    balance.freeBidsResetAt = nextMonth;
    balance.purchasedBlocks = (balance.purchasedBlocks || []).filter(
      (b) => new Date(b.expiresAt) > now
    );
    await balance.save();
  }
  return balance;
};

const ProBidBalance = mongoose.model('ProBidBalance', proBidBalanceSchema);
export default ProBidBalance;

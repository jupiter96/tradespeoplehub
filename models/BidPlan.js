import mongoose from 'mongoose';

/**
 * Admin-created quote credit packs Pros can purchase (e.g. Basic £5/2 credits).
 * `bids` field = number of quote credits in the pack. amountPence: price in pence (e.g. 500 = £5).
 * validityMonths: how long purchased credits last (default 1).
 */
const bidPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bids: {
      type: Number,
      required: true,
      min: 1,
    },
    amountPence: {
      type: Number,
      required: true,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    validityMonths: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

const BidPlan = mongoose.model('BidPlan', bidPlanSchema);
export default BidPlan;

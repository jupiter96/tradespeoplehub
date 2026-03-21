import mongoose from 'mongoose';

/**
 * Legacy global settings (single document). Prefer PaymentSettings for quote credits.
 * freeBidsPerMonth: monthly free quote credits per professional (one credit per quote sent).
 */
const proBidSettingsSchema = new mongoose.Schema(
  {
    freeBidsPerMonth: {
      type: Number,
      default: 3,
      min: 0,
    },
  },
  { timestamps: true }
);

proBidSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ freeBidsPerMonth: 3 });
  }
  return settings;
};

const ProBidSettings = mongoose.model('ProBidSettings', proBidSettingsSchema);
export default ProBidSettings;

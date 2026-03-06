import mongoose from 'mongoose';

/**
 * Global Pro bid settings (single document, admin-editable).
 * freeBidsPerMonth: number of free bids each Pro gets every month.
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

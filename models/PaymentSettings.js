import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema(
  {
    // Stripe API Keys
    stripePublishableKey: {
      type: String,
      trim: true,
    },
    stripeSecretKey: {
      type: String,
      trim: true,
    },
    stripeWebhookSecret: {
      type: String,
      trim: true,
    },
    
    // Environment (test or live)
    environment: {
      type: String,
      enum: ['test', 'live'],
      default: 'test',
    },
    
    // Settings
    isActive: {
      type: Boolean,
      default: false,
    },
    
    // Minimum and maximum amounts
    minDepositAmount: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxDepositAmount: {
      type: Number,
      default: 10000,
      min: 0,
    },
    
    // Manual transfer settings
    manualTransferEnabled: {
      type: Boolean,
      default: true,
    },
    manualTransferInstructions: {
      type: String,
      trim: true,
    },
    bankAccountDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      sortCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
      iban: { type: String, trim: true },
      swift: { type: String, trim: true },
    },
    
    // Updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one payment settings document exists
paymentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);

export default PaymentSettings;


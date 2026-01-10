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
    
    // PayPal API Keys
    paypalPublicKey: {
      type: String,
      trim: true,
    },
    paypalSecretKey: {
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
      default: 1,
      min: 0,
    },
    maxDepositAmount: {
      type: Number,
      default: 10000,
      min: 0,
    },
    minWithdrawAmount: {
      type: Number,
      default: 1,
      min: 0,
    },
    maxWithdrawAmount: {
      type: Number,
      default: 5000,
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
    
    // Commission settings
    adminCommissionPercentage: {
      type: Number,
      default: 3.5,
      min: 0,
      max: 100,
    },
    stripeCommissionPercentage: {
      type: Number,
      default: 1.55,
      min: 0,
      max: 100,
    },
    stripeCommissionFixed: {
      type: Number,
      default: 0.29,
      min: 0,
    },
    paypalCommissionPercentage: {
      type: Number,
      default: 3.00,
      min: 0,
      max: 100,
    },
    paypalCommissionFixed: {
      type: Number,
      default: 0.30,
      min: 0,
    },
    bankProcessingFeePercentage: {
      type: Number,
      default: 2.00,
      min: 0,
      max: 100,
    },
    
    // Other settings
    creditAmountForChatBid: {
      type: Number,
      default: 2.50,
      min: 0,
    },
    closedProjectDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    waitingTimeInDays: {
      type: Number,
      default: 1,
      min: 0,
    },
    feedbackReviewValidityDays: {
      type: Number,
      default: 90,
      min: 0,
    },
    inviteToReview: {
      type: String,
      enum: ['Activated', 'Deactivated'],
      default: 'Activated',
    },
    waitingTimeToAcceptOffer: {
      type: Number,
      default: 2,
      min: 0,
    },
    stepInAmount: {
      type: Number,
      default: 5.00,
      min: 0,
    },
    stepInDays: {
      type: Number,
      default: 1,
      min: 0,
    },
    arbitrationFeeDeadlineDays: {
      type: Number,
      default: 1,
      min: 0,
    },
    searchApiKey: {
      type: String,
      trim: true,
    },
    serviceFees: {
      type: Number,
      default: 0,
      min: 0,
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


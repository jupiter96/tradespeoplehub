import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'payment', 'refund', 'manual_transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'card', 'manual_transfer', 'wallet'],
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
    stripeChargeId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    milestoneId: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, type: 1 });

const Wallet = mongoose.model('Wallet', walletTransactionSchema);

export default Wallet;


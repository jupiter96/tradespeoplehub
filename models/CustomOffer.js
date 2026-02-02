import mongoose from 'mongoose';

const customOfferSchema = new mongoose.Schema(
  {
    offerNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    chargePer: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    paymentType: {
      type: String,
      enum: ['single', 'milestone'],
      default: 'single',
    },
    milestones: [{
      name: String,
      description: String,
      // New per-milestone fields
      deliveryInDays: Number,
      price: Number,
      chargePer: String,
      noOf: Number,
      // Legacy (kept for backward compatibility)
      amount: Number,
      dueInDays: Number,
      hours: Number,
    }],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    responseDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    expiredAt: {
      type: Date,
    },
    // Order created when offer is accepted
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique offer number
customOfferSchema.statics.generateOfferNumber = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `OFFER-${timestamp}-${random}`;
};

// Index for finding expired offers
customOfferSchema.index({ status: 1, responseDeadline: 1 });

const CustomOffer = mongoose.models?.CustomOffer || mongoose.model('CustomOffer', customOfferSchema);

export default CustomOffer;

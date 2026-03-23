import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewerName: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    // Professional response to review (one-time only)
    response: {
      type: String,
      trim: true,
      default: null,
    },
    responseBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responseAt: {
      type: Date,
      default: null,
    },
    hasResponded: {
      type: Boolean,
      default: false,
      index: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// After deploying: drop the legacy Mongo index `order_1_service_1` if it still exists, then let Mongoose create these partial indexes (or create them manually).
// One review per (order, service) when tied to an order. Partial index avoids null collisions for job-only reviews.
reviewSchema.index(
  { order: 1, service: 1 },
  {
    unique: true,
    partialFilterExpression: { order: { $exists: true, $ne: null } },
  }
);
// One client review per job (milestones / marketplace jobs).
reviewSchema.index(
  { job: 1 },
  {
    unique: true,
    partialFilterExpression: { job: { $exists: true, $ne: null } },
  }
);

export default mongoose.model('Review', reviewSchema);



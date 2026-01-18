import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
      unique: true, // One review per order
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

export default mongoose.model('Review', reviewSchema);



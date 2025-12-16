import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);



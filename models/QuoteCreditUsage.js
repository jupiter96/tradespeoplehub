import mongoose from 'mongoose';

/**
 * One row per quote credit consumed when a professional submits a quote on a job.
 */
const quoteCreditUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobSlug: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    credits: { type: Number, default: 1, min: 1 },
    source: {
      type: String,
      enum: ['free', 'purchased'],
      required: true,
    },
  },
  { timestamps: true }
);

quoteCreditUsageSchema.index({ userId: 1, usedAt: -1 });

const QuoteCreditUsage =
  mongoose.models?.QuoteCreditUsage || mongoose.model('QuoteCreditUsage', quoteCreditUsageSchema);
export default QuoteCreditUsage;

import mongoose from 'mongoose';

const emailCategorySmtpSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        'verification',
        'listing',
        'orders',
        'notification',
        'support',
        'no-reply',
      ],
    },
    smtpUser: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
emailCategorySmtpSchema.index({ category: 1 }, { unique: true });

const EmailCategorySmtp = mongoose.model('EmailCategorySmtp', emailCategorySmtpSchema);

export default EmailCategorySmtp;


import mongoose from 'mongoose';

const emailCategorySmtpSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'verification',
        'listing',
        'orders',
        'notification',
        'support',
        'team',
      ],
    },
    smtpEmail: {
      type: String,
      required: true,
      trim: true,
    },
    smtpPassword: {
      type: String,
      required: true,
      // Password will be stored (consider encryption in production)
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


import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    emailFrom: {
      type: String,
      trim: true,
      // Email address to use for sending emails from this template category
      // If not set, will use default SMTP_USER or SMTP_USER_VERIFICATION based on category
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// category and type combination should be unique
emailTemplateSchema.index({ category: 1, type: 1 }, { unique: true });
emailTemplateSchema.index({ category: 1 });
emailTemplateSchema.index({ isActive: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;



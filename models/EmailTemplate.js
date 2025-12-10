import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'verification',
        'welcome',
        'reminder-verification',
        'reminder-identity',
        'fully-verified',
        'verification-approved',
        'verification-rejected',
      ],
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
  },
  {
    timestamps: true,
  }
);

// Indexes
// type field has unique index (defined below)
emailTemplateSchema.index({ type: 1 }, { unique: true });
emailTemplateSchema.index({ isActive: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;



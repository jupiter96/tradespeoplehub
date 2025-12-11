import mongoose from 'mongoose';

const smtpConfigSchema = new mongoose.Schema(
  {
    smtpHost: {
      type: String,
      required: true,
      trim: true,
    },
    smtpPort: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },
    smtpPass: {
      type: String,
      required: true,
      // Password will be stored (consider encryption in production)
    },
  },
  {
    timestamps: true,
  }
);

// Only one SMTP config should exist
smtpConfigSchema.index({}, { unique: true });

const SmtpConfig = mongoose.model('SmtpConfig', smtpConfigSchema);

export default SmtpConfig;


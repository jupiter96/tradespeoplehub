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
    smtpUser: {
      type: String,
      required: true,
      trim: true,
    },
    smtpPass: {
      type: String,
      required: true,
      // Password will be stored (consider encryption in production)
    },
    smtpUserVerification: {
      type: String,
      trim: true,
      // Optional: verification-specific SMTP user
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


import mongoose from 'mongoose';

const socialAuthErrorSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ['facebook', 'google'],
      index: true,
    },
    errorType: {
      type: String,
      required: true,
      // Types: 'auth_error', 'no_result', 'account_deleted', 'account_blocked', 'admin_not_allowed', 'verification_error', 'session_error', 'login_error'
    },
    errorMessage: {
      type: String,
      required: true,
    },
    errorStack: {
      type: String,
      default: null,
    },
    errorDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Store additional error information as JSON
    },
    // User information (if available)
    providerId: {
      type: String,
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: null,
      index: true,
    },
    // Request information
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Request URL and parameters
    requestUrl: {
      type: String,
      default: null,
    },
    queryParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Session information
    sessionId: {
      type: String,
      default: null,
    },
    // Additional context
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Store any additional context like profile data, etc.
    },
    // Resolved status (for tracking if error was investigated)
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
socialAuthErrorSchema.index({ provider: 1, createdAt: -1 });
socialAuthErrorSchema.index({ errorType: 1, createdAt: -1 });
socialAuthErrorSchema.index({ resolved: 1, createdAt: -1 });
socialAuthErrorSchema.index({ email: 1, createdAt: -1 });

const SocialAuthError =
  mongoose.models?.SocialAuthError ||
  mongoose.model('SocialAuthError', socialAuthErrorSchema);

export default SocialAuthError;


import mongoose from 'mongoose';

const pendingRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['client', 'professional'], required: true },
    passwordHash: { type: String, required: true },
    postcode: { type: String, required: true, trim: true },
    referralCode: { type: String, trim: true },
    tradingName: { type: String, trim: true },
    townCity: { type: String, trim: true },
    county: { type: String, trim: true },
    address: { type: String, trim: true },
    travelDistance: { type: String, trim: true },
    emailCodeHash: {
      type: String,
      trim: true,
    },
    emailCodeExpiresAt: {
      type: Date,
    },
    emailVerified: { type: Boolean, default: false },
    phoneCodeHash: {
      type: String,
      trim: true,
    },
    phoneCodeExpiresAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      expires: 0,
    },
  },
  { timestamps: true }
);

pendingRegistrationSchema.index({ email: 1 }, { unique: true });

const PendingRegistration =
  mongoose.models?.PendingRegistration ||
  mongoose.model('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;



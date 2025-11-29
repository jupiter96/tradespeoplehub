import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required() {
        return !this.googleId && !this.facebookId;
      },
    },
    role: {
      type: String,
      enum: ['client', 'professional', 'admin'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    postcode: {
      type: String,
      required: true,
      trim: true,
    },
    referralCode: {
      type: String,
      trim: true,
    },
    avatar: String,
    tradingName: String,
    townCity: String,
    address: String,
    travelDistance: String,
    sector: String,
    services: {
      type: [String],
      default: [],
    },
    aboutService: String,
    hasTradeQualification: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no',
    },
    hasPublicLiability: {
      type: String,
      enum: ['yes', 'no'],
      default: 'no',
    },
    // KYC Verification fields
    verification: {
      email: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        verifiedAt: Date,
      },
      phone: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        verifiedAt: Date,
      },
      address: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: String,
        documentName: String,
        rejectionReason: String,
        verifiedAt: Date,
      },
      idCard: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: String,
        documentName: String,
        rejectionReason: String,
        verifiedAt: Date,
      },
      paymentMethod: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        maskedCard: String,
        verifiedAt: Date,
      },
      publicLiabilityInsurance: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: String,
        documentName: String,
        rejectionReason: String,
        verifiedAt: Date,
      },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    googleId: {
      type: String,
      index: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      index: true,
      sparse: true,
    },
    // Block and moderation fields
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedAt: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    blockReason: String,
    blockReviewInvitation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const userObject = this.toObject({ versionKey: false });
  delete userObject.passwordHash;
  userObject.id = userObject._id.toString();
  userObject.name = `${userObject.firstName} ${userObject.lastName}`.trim();
  return userObject;
};

const User = mongoose.models?.User || mongoose.model('User', userSchema);

export default User;


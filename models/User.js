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
    permissions: {
      type: [String],
      default: [],
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
    sectors: {
      type: [String],
      default: [],
    },
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
    professionalIndemnityAmount: {
      type: Number,
      default: null,
    },
    insuranceExpiryDate: {
      type: Date,
      default: null,
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
    // Admin notes field
    adminNotes: {
      type: String,
      trim: true,
    },
    // Track if admin has viewed this new user
    viewedByAdmin: {
      type: Boolean,
      default: false,
    },
    // Public profile fields
    publicProfile: {
      bio: String,
      portfolio: [{
        image: String,
        title: String,
        description: String,
      }],
      publicProfileUrl: String, // Unique URL slug for public profile
      isPublic: {
        type: Boolean,
        default: true,
      },
      qualifications: String,
      certifications: String,
      companyDetails: String,
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
  // Include permissions for admin users
  if (userObject.role === 'admin' && this.permissions) {
    userObject.permissions = this.permissions;
  }
  return userObject;
};

const User = mongoose.models?.User || mongoose.model('User', userSchema);

export default User;


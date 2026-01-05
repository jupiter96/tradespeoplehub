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
      enum: ['client', 'professional', 'admin', 'subadmin'],
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      required() {
        // Admin and subadmin don't require phone
        return this.role !== 'admin' && this.role !== 'subadmin';
      },
      trim: true,
    },
    postcode: {
      type: String,
      required() {
        return this.role === 'client' || this.role === 'professional';
      },
      trim: true,
    },
    referralCode: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    tradingName: {
      type: String,
      required() {
        return this.role === 'professional';
      },
      trim: true,
    },
    townCity: {
      select: true,
      type: String,
      trim: true,
    },
    county: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required() {
        return this.role === 'client' || this.role === 'professional';
      },
      trim: true,
    },
    travelDistance: {
      type: String,
      trim: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    sectors: {
      type: [String],
      default: [],
    },
    services: {
      type: [String],
      default: [],
    },
    aboutService: {
      type: String,
      trim: true,
    },
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
      default: 0,
    },
    // Completed jobs/tasks count for public profile stats (incremented by business logic elsewhere)
    completedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    insuranceExpiryDate: {
      type: Date,
      default: null,
    },
    // KYC Verification fields
    verification: {
      select: true,
      type: Object,
      email: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        verifiedAt: {
          type: Date,
        },
      },
      phone: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        verifiedAt: {
          type: Date,
        },
      },
      address: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: {
          type: String,
          trim: true,
        },
        documentName: {
          type: String,
          trim: true,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
        verifiedAt: {
          type: Date,
        },
        uploadedAt: {
          type: Date,
        },
        viewedByAdmin: {
          type: Boolean,
          default: false,
        },
      },
      idCard: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: {
          type: String,
          trim: true,
        },
        documentName: {
          type: String,
          trim: true,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
        verifiedAt: {
          type: Date,
        },
        uploadedAt: {
          type: Date,
        },
        viewedByAdmin: {
          type: Boolean,
          default: false,
        },
      },
      paymentMethod: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: {
          type: String,
          trim: true,
        },
        documentName: {
          type: String,
          trim: true,
        },
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
        address: {
          type: String,
          trim: true,
        },
        sortCode: {
          type: String,
          trim: true,
        },
        accountNumber: {
          type: String,
          trim: true,
        },
        bankStatementDate: {
          type: Date,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
        verifiedAt: {
          type: Date,
        },
        uploadedAt: {
          type: Date,
        },
        viewedByAdmin: {
          type: Boolean,
          default: false,
        },
      },
      publicLiabilityInsurance: {
        status: {
          type: String,
          enum: ['not-started', 'pending', 'verified', 'rejected'],
          default: 'not-started',
        },
        documentUrl: {
          type: String,
          trim: true,
        },
        documentName: {
          type: String,
          trim: true,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
        verifiedAt: {
          type: Date,
        },
        uploadedAt: {
          type: Date,
        },
        viewedByAdmin: {
          type: Boolean,
          default: false,
        },
      },
    },
    passwordResetToken: {
      type: String,
      trim: true,
    },
    passwordResetExpires: {
      type: Date,
    },
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
    blockedAt: {
      type: Date,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    blockReason: {
      type: String,
      trim: true,
    },
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
    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    // Verification reminder tracking
    verificationReminder: {
      lastSentAt: {
        type: Date,
      },
      weeklyRemindersSent: {
        type: Number,
        default: 0,
      },
      monthlyRemindersSent: {
        type: Number,
        default: 0,
      },
      reminderStopped: {
        type: Boolean,
        default: false,
      },
    },
    // Public profile fields
    publicProfile: {
      bio: {
        type: String,
        trim: true,
      },
      coverImage: {
        type: String,
        trim: true,
      },
      portfolio: [{
        image: {
          type: String,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
      }],
      publicProfileUrl: {
        type: String,
        trim: true,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
      qualifications: {
        type: String,
        trim: true,
      },
      certifications: {
        type: String,
        trim: true,
      },
      companyDetails: {
        type: String,
        trim: true,
      },
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
  // Include permissions for admin and subadmin users
  if ((userObject.role === 'admin' || userObject.role === 'subadmin') && this.permissions) {
    userObject.permissions = this.permissions;
  }
  return userObject;
};

// Create unique sparse index on phone field (allows multiple null/undefined, but unique non-null values)
// This ensures one phone number per user, but allows admin/subadmin to have no phone
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

const User = mongoose.models?.User || mongoose.model('User', userSchema);

export default User;


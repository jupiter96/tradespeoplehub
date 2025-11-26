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


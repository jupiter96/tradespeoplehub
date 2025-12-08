import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: {
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
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'subadmin'],
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    // Track which dashboard cards have been viewed by this admin
    dashboardCardViews: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Method to return safe object (without password hash)
adminSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;






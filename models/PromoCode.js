import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['pro', 'admin'],
      required: true,
      index: true,
    },
    // For pro promo codes - the professional who created it
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.type === 'pro';
      },
      index: true,
    },
    // For admin promo codes - categories this promo applies to
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    }],
    // Discount amount
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Discount type: percentage or fixed amount
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    // Minimum order amount to apply this promo
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Maximum discount amount (for percentage discounts)
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    // Validity period
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Per-user usage limit
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Track users who used this code
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 1,
      },
      firstUsedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
    // Description
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promoCodeSchema.index({ code: 1, status: 1 });
promoCodeSchema.index({ professional: 1, status: 1 });
promoCodeSchema.index({ type: 1, status: 1 });
promoCodeSchema.index({ validFrom: 1, validUntil: 1 });

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function(userId = null) {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') {
    return { valid: false, reason: 'Promo code is not active' };
  }
  
  // Check validity period
  if (this.validFrom && now < this.validFrom) {
    return { valid: false, reason: 'Promo code is not yet valid' };
  }
  
  if (this.validUntil && now > this.validUntil) {
    return { valid: false, reason: 'Promo code has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Promo code usage limit reached' };
  }
  
  // Check per-user limit
  if (userId) {
    const userUsage = this.usedBy.find(u => u.user.toString() === userId.toString());
    if (userUsage && userUsage.count >= this.perUserLimit) {
      return { valid: false, reason: 'You have reached the usage limit for this promo code' };
    }
  }
  
  return { valid: true };
};

// Method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(subtotal) {
  if (this.discountType === 'percentage') {
    let discount = (subtotal * this.discount) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  } else {
    // Fixed amount
    return Math.min(this.discount, subtotal);
  }
};

// Method to record usage
promoCodeSchema.methods.recordUsage = async function(userId) {
  this.usedCount += 1;
  
  const userUsageIndex = this.usedBy.findIndex(
    u => u.user.toString() === userId.toString()
  );
  
  if (userUsageIndex >= 0) {
    this.usedBy[userUsageIndex].count += 1;
  } else {
    this.usedBy.push({
      user: userId,
      count: 1,
      firstUsedAt: new Date(),
    });
  }
  
  await this.save();
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;

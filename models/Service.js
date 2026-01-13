import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    serviceSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceSubCategory',
      default: null,
    },
    // Full nested subcategory path (one ID per level)
    serviceSubCategoryPath: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'ServiceSubCategory',
      default: [],
    },
    title: {
      type: String,
      required: false, // Optional for drafts
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // Allow null/undefined values but enforce uniqueness for non-null values
      index: true,
    },
    description: {
      type: String,
      required: false, // Optional for drafts
      trim: true,
      minlength: [35, 'Service description must be at least 35 characters long'],
    },
    // About Me section for the service
    aboutMe: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: false, // Optional for drafts
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    // Optional: discount/sale valid date range for the main price
    originalPriceValidFrom: {
      type: Date,
    },
    originalPriceValidUntil: {
      type: Date,
    },
    priceUnit: {
      type: String,
      default: 'fixed', // 'fixed', 'per hour', 'per day', 'per item', etc.
    },
    // Unified gallery array - images and videos in upload order
    gallery: {
      type: [{
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
        },
        duration: {
          type: Number, // in seconds (for videos)
        },
        size: {
          type: Number, // in bytes
        },
      }],
      default: [],
    },
    // Legacy fields - kept for backward compatibility
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [{
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
        },
        duration: {
          type: Number, // in seconds
        },
        size: {
          type: Number, // in bytes
        },
      }],
      default: [],
    },
    portfolioImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      // Unified service lifecycle status (admin + professional)
      // 'blocked' is used when the service owner's account is blocked by admin
      enum: ['draft', 'pending', 'required_modification', 'denied', 'paused', 'approved', 'inactive', 'blocked'],
      default: 'draft',
      index: true,
    },
    // Service packages for tiered pricing
    packages: {
      type: [{
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        price: {
          type: Number,
          required: false, // Not required for drafts, will be validated on publish
          min: 0,
          default: 0, // Default to 0 for drafts
        },
        originalPrice: {
          type: Number,
          min: 0,
        },
        // Optional: discount/sale valid date range for package price
        originalPriceValidFrom: {
          type: Date,
        },
        originalPriceValidUntil: {
          type: Date,
        },
        deliveryDays: {
          type: Number,
          default: 0,
        },
        revisions: {
          type: String,
        },
        features: {
          type: [String],
          default: [],
        },
        order: {
          type: Number,
          default: 0,
        },
      }],
      default: [],
    },
    // Service addons/extras
    addons: {
      type: [{
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        order: {
          type: Number,
          default: 0,
        },
      }],
      default: [],
    },
    // Service highlights
    highlights: {
      type: [String],
      default: [],
    },
    // Ideal for situations
    idealFor: {
      type: [String],
      default: [],
    },
    // FAQs shown on the service detail page
    faqs: {
      type: [
        {
          id: {
            type: String,
          },
          question: {
            type: String,
            trim: true,
          },
          answer: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
    // Delivery type
    deliveryType: {
      type: String,
      enum: ['same-day', 'standard'],
      default: 'standard',
    },
    // Response time
    responseTime: {
      type: String,
    },
    // Years of professional experience for this service
    experienceYears: {
      type: Number,
      min: 0,
    },
    // Weekly availability schedule (per day with time blocks)
    availability: {
      type: mongoose.Schema.Types.Mixed, // { monday: { enabled, blocks: [...] }, ... }
      default: {},
    },
    // Skills required
    skills: {
      type: [String],
      default: [],
    },
    // County/Borough/Council
    county: {
      type: String,
      trim: true,
    },
    // Badges
    badges: {
      type: [String],
      default: [],
    },
    // Rating and reviews (calculated fields)
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    // SEO
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    // Ordering
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // User can disable their own service
    isUserDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Modification reason from admin
    modificationReason: {
      type: String,
      trim: true,
    },
    // Admin who reviewed the service
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Review date
    reviewedAt: {
      type: Date,
    },
    // Blocked status fields (when owner account is blocked)
    blockedAt: {
      type: Date,
    },
    blockedReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
serviceSchema.index({ professional: 1, status: 1 });
serviceSchema.index({ serviceCategory: 1, status: 1, isActive: 1 });
serviceSchema.index({ serviceSubCategory: 1, status: 1, isActive: 1 });
serviceSchema.index({ status: 1, isActive: 1 });
// serviceSchema.index({ slug: 1 }, { unique: true, sparse: true });
serviceSchema.index({ isUserDisabled: 1, isActive: 1 });

// Auto-populate on find
serviceSchema.pre(/^find/, function(next) {
  if (this.getOptions().populate !== false) {
    this.populate({
      path: 'professional',
      select: 'firstName lastName tradingName avatar email phone postcode',
    });
    this.populate({
      path: 'serviceCategory',
      select: 'name slug icon bannerImage sector',
    });
    this.populate({
      path: 'serviceSubCategory',
      select: 'name slug icon',
    });
  }
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;


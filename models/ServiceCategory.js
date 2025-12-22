import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    sector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sector',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      // Auto-generate slug from name if not provided
      set: function(value) {
        if (!value && this.name) {
          return this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
        return value;
      },
    },
    question: {
      type: String,
      trim: true,
      // Category question (e.g., "What type of service do you need?")
    },
    order: {
      type: Number,
      default: 0,
      // Display order within the sector (lower numbers appear first)
    },
    description: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
      // SEO meta title
    },
    metaDescription: {
      type: String,
      trim: true,
      // SEO meta description
    },
    icon: {
      type: String,
      trim: true,
      // Icon name or path (e.g., "imgGarden2" or "/icons/garden.svg" or Cloudinary URL)
    },
    bannerImage: {
      type: String,
      trim: true,
      // URL to banner image for category detail page (Cloudinary URL)
    },
    // Attributes for this category
    attributes: {
      type: [{
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      }],
      default: [],
    },
    // Service ideal for options for this category
    serviceIdealFor: {
      type: [{
        name: {
          type: String,
          required: true,
          trim: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      }],
      default: [],
    },
    // Extra services for this category
    extraServices: {
      type: [{
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        days: {
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
    // Price per unit configuration
    pricePerUnit: {
      enabled: {
        type: Boolean,
        default: false,
      },
      units: {
        type: [{
          name: {
            type: String,
            required: true,
            trim: true,
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
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Level system: 3-7 levels (Level 1 = Main Category, Level 2 = Sub Category are fixed)
    level: {
      type: Number,
      min: 3,
      max: 7,
      default: 3,
      // Number of levels selected by admin (3-7)
    },
    // Category Level Mapping: defines which attribute type is used for each level (3-7)
    // Each level has its own thumbnail, icon, metadata, title, and attribute
    categoryLevelMapping: {
      type: [{
        level: {
          type: Number,
          required: true,
          min: 3,
          max: 7,
        },
        attributeType: {
          type: String,
          enum: ['serviceType', 'size', 'frequency', 'make', 'model', 'brand'],
          required: true,
        },
        title: {
          type: String,
          trim: true,
          // Display title for this level (e.g., "Service Type", "Size")
        },
        thumbnail: {
          type: String,
          trim: true,
          // Thumbnail image URL for this level
        },
        icon: {
          type: String,
          trim: true,
          // Icon URL or name for this level
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          // Additional metadata for this level (can store any JSON data)
        },
      }],
      default: [],
      // Array of level mappings with full metadata: [{ level: 3, attributeType: 'serviceType', title: 'Service Type', thumbnail: '...', icon: '...', metadata: {...} }, ...]
    },
  },
  { timestamps: true }
);

// Indexes
// Ensure unique order within a sector
serviceCategorySchema.index({ sector: 1, order: 1 }, { unique: true });
// Ensure unique category name within a sector (this also creates the index)
serviceCategorySchema.index({ sector: 1, name: 1 }, { unique: true });
serviceCategorySchema.index({ slug: 1 });
serviceCategorySchema.index({ isActive: 1 });

const ServiceCategory =
  mongoose.models?.ServiceCategory ||
  mongoose.model('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;


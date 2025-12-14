import mongoose from 'mongoose';

const serviceSubCategorySchema = new mongoose.Schema(
  {
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: function() {
        return !this.parentSubCategory;
      },
    },
    parentSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceSubCategory',
      default: null,
      required: function() {
        // Level 3-7 must have a parentSubCategory
        return this.level >= 3 && this.level <= 7;
      },
      // If parentSubCategory is set, serviceCategory is not required
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 7,
      // Level 1 = direct child of ServiceCategory, Level 2-7 = nested subcategories
    },
    // Attribute type for level 1 subcategories (from categoryLevelMapping level 3)
    attributeType: {
      type: String,
      enum: ['serviceType', 'size', 'frequency', 'make', 'model', 'brand'],
      default: null,
      // Only set for level 1 subcategories to indicate which tab/attribute type they belong to
    },
    // Category level from categoryLevelMapping (2 for Sub Category, 3-6 for other tabs)
    categoryLevel: {
      type: Number,
      min: 2,
      max: 6,
      default: null,
      // Level 2 = Sub Category tab, Level 3-6 = other tabs (Service Type, Size, etc.)
      // Used for sorting and filtering within tabs
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
    description: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    bannerImage: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      // Display order within the category (lower numbers appear first)
    },
    icon: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Titles for each level (Level 3-7)
    titles: {
      type: [{
        level: {
          type: Number,
          required: true,
          min: 3,
          max: 7,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
      }],
      default: [],
      // Array of titles: [{ level: 3, title: 'Service Type' }, ...]
    },
    // Attributes for each level (Level 3-7)
    attributes: {
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
        values: {
          type: [{
            label: {
              type: String,
              required: true,
              trim: true,
            },
            value: {
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
      }],
      default: [],
      // Array of attributes: [{ level: 3, attributeType: 'serviceType', values: [{ label: 'Black', value: 'black', order: 1 }, ...] }, ...]
    },
  },
  { timestamps: true }
);

// Indexes
serviceSubCategorySchema.index({ serviceCategory: 1, order: 1 });
serviceSubCategorySchema.index({ parentSubCategory: 1, order: 1 });
// Ensure unique subcategory name within a category or parent subcategory
serviceSubCategorySchema.index({ serviceCategory: 1, name: 1 }, { unique: true, partialFilterExpression: { parentSubCategory: null } });
serviceSubCategorySchema.index({ parentSubCategory: 1, name: 1 }, { unique: true, partialFilterExpression: { parentSubCategory: { $ne: null } } });
serviceSubCategorySchema.index({ slug: 1 });
serviceSubCategorySchema.index({ isActive: 1 });
serviceSubCategorySchema.index({ level: 1 });

const ServiceSubCategory =
  mongoose.models?.ServiceSubCategory ||
  mongoose.model('ServiceSubCategory', serviceSubCategorySchema);

export default ServiceSubCategory;


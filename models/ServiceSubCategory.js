import mongoose from 'mongoose';

const serviceSubCategorySchema = new mongoose.Schema(
  {
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
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
    description: {
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
// Ensure unique subcategory name within a category
serviceSubCategorySchema.index({ serviceCategory: 1, name: 1 }, { unique: true });
serviceSubCategorySchema.index({ slug: 1 });
serviceSubCategorySchema.index({ isActive: 1 });

const ServiceSubCategory =
  mongoose.models?.ServiceSubCategory ||
  mongoose.model('ServiceSubCategory', serviceSubCategorySchema);

export default ServiceSubCategory;


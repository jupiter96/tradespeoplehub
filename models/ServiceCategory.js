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
    isActive: {
      type: Boolean,
      default: true,
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


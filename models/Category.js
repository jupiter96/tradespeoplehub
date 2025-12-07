import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
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
      // Category question (e.g., "What type of plumbing service do you need?")
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
categorySchema.index({ sector: 1, order: 1 }, { unique: true });
// Ensure unique category name within a sector (this also creates the index)
categorySchema.index({ sector: 1, name: 1 }, { unique: true });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

const Category =
  mongoose.models?.Category ||
  mongoose.model('Category', categorySchema);

export default Category;


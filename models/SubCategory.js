import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
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
      index: true,
      unique: true,
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
  },
  { timestamps: true }
);

// Indexes
subCategorySchema.index({ category: 1, order: 1 });
// Ensure unique subcategory name within a category
subCategorySchema.index({ category: 1, name: 1 }, { unique: true });
// subCategorySchema.index({ slug: 1 });
subCategorySchema.index({ isActive: 1 });

const SubCategory =
  mongoose.models?.SubCategory ||
  mongoose.model('SubCategory', subCategorySchema);

export default SubCategory;










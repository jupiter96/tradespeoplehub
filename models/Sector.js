import mongoose from 'mongoose';

const sectorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
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
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      // Icon name or path (e.g., "imgGarden2" or "/icons/garden.svg")
    },
    bannerImage: {
      type: String,
      trim: true,
      // URL to banner image for sector detail page
    },
    displayName: {
      type: String,
      trim: true,
      // Display name in UI (e.g., "Home &" for split display)
    },
    subtitle: {
      type: String,
      trim: true,
      // Subtitle for split display (e.g., "Garden")
    },
    order: {
      type: Number,
      default: 0,
      unique: true,
      // Display order (lower numbers appear first) - must be unique
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
// Note: slug already has unique: true in field definition, so we don't need to index it again
sectorSchema.index({ order: 1 }, { unique: true });
sectorSchema.index({ isActive: 1 });

const Sector =
  mongoose.models?.Sector ||
  mongoose.model('Sector', sectorSchema);

export default Sector;


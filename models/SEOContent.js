import mongoose from 'mongoose';

const seoContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['homepage', 'blog', 'cost-guide'],
    required: true,
    unique: true,
  },
  // Homepage Content
  title: {
    type: String,
    default: '',
  },
  metaKeywords: {
    type: String,
    default: '',
  },
  metaDescription: {
    type: String,
    default: '',
  },
  // Open Graph Tags
  ogTitle: {
    type: String,
    default: '',
  },
  ogDescription: {
    type: String,
    default: '',
  },
  ogImage: {
    type: String,
    default: '',
  },
  ogUrl: {
    type: String,
    default: '',
  },
  ogType: {
    type: String,
    default: 'website',
  },
  ogSiteName: {
    type: String,
    default: '',
  },
  // Twitter Card Tags
  twitterCard: {
    type: String,
    default: 'summary_large_image',
  },
  twitterTitle: {
    type: String,
    default: '',
  },
  twitterDescription: {
    type: String,
    default: '',
  },
  twitterImage: {
    type: String,
    default: '',
  },
  // Additional SEO
  canonicalUrl: {
    type: String,
    default: '',
  },
  robots: {
    type: String,
    default: 'index, follow',
  },
  // Script Management (for homepage)
  headerScript: {
    type: String,
    default: '',
  },
  bodyScript: {
    type: String,
    default: '',
  },
  // Blog & Cost Guide Content
  description: {
    type: String,
    default: '',
  },
  metaTitle: {
    type: String,
    default: '',
  },
  metaKey: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Update updatedAt before save
seoContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SEOContent = mongoose.models.SEOContent || mongoose.model('SEOContent', seoContentSchema);

export default SEOContent;


import mongoose from 'mongoose';

const jobQuoteSchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    professionalName: { type: String, required: true, trim: true },
    professionalAvatar: { type: String, trim: true },
    professionalRating: { type: Number, default: 0 },
    professionalReviews: { type: Number, default: 0 },
    price: { type: Number, required: true },
    deliveryTime: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'awarded'],
      default: 'pending',
    },
  },
  { _id: true }
);

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: 'Milestone' },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['awaiting-accept', 'in-progress', 'released', 'disputed', 'cancelled'],
      default: 'awaiting-accept',
    },
    releasedAt: { type: Date, default: null },
    disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDispute', default: null },
    // Cancel request (client or pro requests to cancel; other party can accept/reject)
    cancelRequestedAt: { type: Date, default: null },
    cancelRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelRequestReason: { type: String, trim: true, default: null },
    cancelRequestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: null,
    },
    // Release request (pro requests client to release; client can accept/reject)
    releaseRequestedAt: { type: Date, default: null },
    releaseRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    releaseRequestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: null,
    },
  },
  { _id: true, timestamps: true }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    // Reference to Sector document (authoritative key for matching with professionals)
    sector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sector',
      required: true,
    },
    sectorSlug: { type: String, required: true, trim: true, lowercase: true },
    sectorName: { type: String, required: true, trim: true },
    categorySlugs: { type: [String], default: [] },
    categoryLabels: { type: [String], default: [] },
    postcode: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    timing: {
      type: String,
      enum: ['urgent', 'flexible', 'specific'],
      default: 'flexible',
    },
    specificDate: { type: Date, default: null },
    budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    budgetAmount: { type: Number, required: true },
    budgetMin: { type: Number, default: null },
    budgetMax: { type: Number, default: null },
    status: {
      type: String,
      enum: ['active', 'awaiting-accept', 'in-progress', 'completed', 'cancelled'],
      default: 'active',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postedAt: { type: Date, default: Date.now },
    quotes: { type: [jobQuoteSchema], default: [] },
    awardedProfessionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    milestones: { type: [milestoneSchema], default: [] },
    slug: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

function slugify(title) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'job';
}

function randomDigits(len = 6) {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

jobSchema.pre('save', async function (next) {
  if (this.isNew && !this.slug) {
    let base = slugify(this.title).slice(0, 40);
    let slug = `${base}-${randomDigits(6)}`;
    let exists = await mongoose.model('Job').exists({ slug });
    while (exists) {
      slug = `${base}-${randomDigits(8)}`;
      exists = await mongoose.model('Job').exists({ slug });
    }
    this.slug = slug;
  }
  next();
});

jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ status: 1, sector: 1 });
jobSchema.index({ status: 1, sectorSlug: 1 });
jobSchema.index({ postedAt: -1 });
jobSchema.index({ slug: 1 }, { unique: true, sparse: true });

const Job = mongoose.models?.Job || mongoose.model('Job', jobSchema);
export { slugify, randomDigits };
export default Job;

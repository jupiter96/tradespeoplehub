import mongoose from 'mongoose';

const jobBudgetRangeSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure max >= min
jobBudgetRangeSchema.pre('save', function (next) {
  if (this.max < this.min) {
    const t = this.min;
    this.min = this.max;
    this.max = t;
  }
  next();
});

const JobBudgetRange = mongoose.model('JobBudgetRange', jobBudgetRangeSchema);
export default JobBudgetRange;

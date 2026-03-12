import mongoose from 'mongoose';

const jobReportSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterRole: { type: String, enum: ['client', 'professional'], trim: true },
    reason: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

jobReportSchema.index({ jobId: 1, createdAt: -1 });

const JobReport = mongoose.models?.JobReport || mongoose.model('JobReport', jobReportSchema);
export default JobReport;

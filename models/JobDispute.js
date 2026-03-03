import mongoose from 'mongoose';

const jobDisputeMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isTeamResponse: { type: Boolean, default: false },
  },
  { _id: true }
);

const jobDisputeSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    milestoneId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    evidence: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    messages: { type: [jobDisputeMessageSchema], default: [] },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobDisputeSchema.index({ jobId: 1, createdAt: -1 });
jobDisputeSchema.index({ claimantId: 1, status: 1 });
jobDisputeSchema.index({ respondentId: 1, status: 1 });

const JobDispute = mongoose.models?.JobDispute || mongoose.model('JobDispute', jobDisputeSchema);
export default JobDispute;

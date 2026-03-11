import mongoose from 'mongoose';

const jobDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

jobDraftSchema.index({ userId: 1 }, { unique: true });

const JobDraft = mongoose.models?.JobDraft || mongoose.model('JobDraft', jobDraftSchema);
export default JobDraft;

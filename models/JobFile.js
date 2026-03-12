import mongoose from 'mongoose';

const jobFileSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobFileSchema.index({ jobId: 1, createdAt: -1 });

const JobFile = mongoose.models?.JobFile || mongoose.model('JobFile', jobFileSchema);
export default JobFile;

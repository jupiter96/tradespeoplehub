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
    requirements: { type: String, trim: true, default: '' },
    unmetRequirements: { type: String, trim: true, default: '' },
    evidence: { type: String, trim: true, default: null },
    evidenceFiles: { type: [String], default: [] },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['open', 'negotiation', 'admin_arbitration', 'closed'],
      default: 'open',
      index: true,
    },
    responseDeadline: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    negotiationDeadline: { type: Date, default: null },
    messages: { type: [jobDisputeMessageSchema], default: [] },
    milestoneIndices: { type: [Number], default: undefined },
    offers: {
      clientOffer: { type: Number, default: null },
      professionalOffer: { type: Number, default: null },
    },
    offerHistory: {
      type: [
        {
          role: { type: String, enum: ['client', 'professional'], required: true },
          amount: { type: Number, required: true },
          offeredAt: { type: Date, default: Date.now },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ],
      default: [],
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acceptedByRole: { type: String, enum: ['client', 'professional'], default: null },
    acceptedAt: { type: Date, default: null },
    finalAmount: { type: Number, default: null },
    lastOfferRejectedAt: { type: Date, default: null },
    lastOfferRejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastOfferRejectedByRole: { type: String, enum: ['client', 'professional'], default: null },
    lastRejectedOfferAmount: { type: Number, default: null },
    arbitrationRequested: { type: Boolean, default: false },
    arbitrationRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    arbitrationRequestedAt: { type: Date, default: null },
    arbitrationFeeAmount: { type: Number, default: null },
    arbitrationFeeDeadline: { type: Date, default: null },
    arbitrationPayments: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          amount: { type: Number, required: true },
          paidAt: { type: Date, default: Date.now },
          paymentMethod: { type: String, enum: ['wallet', 'card', 'paypal'], default: 'wallet' },
          paymentIntentId: { type: String, default: null },
          paypalOrderId: { type: String, default: null },
          transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null },
        },
      ],
      default: [],
    },
    pendingPayPalArbitration: {
      paypalOrderId: { type: String, default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      amount: { type: Number, default: null },
      createdAt: { type: Date, default: null },
    },
    closedAt: { type: Date, default: null },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    loserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminDecision: { type: Boolean, default: false },
    decisionNotes: { type: String, default: null },
    autoClosed: { type: Boolean, default: false },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

jobDisputeSchema.index({ jobId: 1, createdAt: -1 });
jobDisputeSchema.index({ claimantId: 1, status: 1 });
jobDisputeSchema.index({ respondentId: 1, status: 1 });

const JobDispute = mongoose.models?.JobDispute || mongoose.model('JobDispute', jobDisputeSchema);
export default JobDispute;

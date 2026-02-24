import mongoose from 'mongoose';

const disputeMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isTeamResponse: {
    type: Boolean,
    default: false,
  },
  inFavorOfName: {
    type: String,
    default: null,
  },
  inFavorOfId: {
    type: String,
    default: null,
  },
  attachments: [{
    url: String,
    fileName: String,
    fileType: {
      type: String,
      enum: ['image', 'video', 'other'],
    },
  }],
}, { _id: false });

const disputeSchema = new mongoose.Schema(
  {
    disputeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    // Dispute 기본 정보
    status: {
      type: String,
      enum: ['open', 'responded', 'negotiation', 'admin_arbitration', 'closed'],
      default: 'open',
      index: true,
    },
    // Dispute 생성 정보
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Claimant and Respondent
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    respondentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Dispute 내용
    requirements: {
      type: String,
      required: true,
    },
    unmetRequirements: {
      type: String,
      required: true,
    },
    evidenceFiles: [{
      type: String,
    }],
    // Dispute 타임라인
    responseDeadline: {
      type: Date,
      required: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    negotiationDeadline: {
      type: Date,
      default: null,
    },
    // Dispute 메시지 (채팅)
    messages: [disputeMessageSchema],
    // Dispute Offer (제안 금액)
    offers: {
      clientOffer: {
        type: Number,
        default: null,
      },
      professionalOffer: {
        type: Number,
        default: null,
      },
    },
    // Offer history (각 제안 기록)
    offerHistory: [
      {
        role: { type: String, enum: ['client', 'professional'] },
        amount: { type: Number },
        offeredAt: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    // Arbitration 정보
    arbitrationRequested: {
      type: Boolean,
      default: false,
    },
    arbitrationRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    arbitrationRequestedAt: {
      type: Date,
      default: null,
    },
    arbitrationFeeAmount: {
      type: Number,
      default: null,
    },
    arbitrationFeeDeadline: {
      type: Date,
      default: null,
    },
    arbitrationPayments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      paidAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      paymentMethod: {
        type: String,
        enum: ['wallet', 'card', 'paypal'],
        required: true,
      },
      paymentIntentId: {
        type: String,
        default: null,
      },
      paypalOrderId: {
        type: String,
        default: null,
      },
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        default: null,
      },
    }],
    // Pending PayPal arbitration fee (set when user chooses PayPal; cleared after capture)
    pendingPayPalArbitration: {
      paypalOrderId: { type: String, default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      amount: { type: Number, default: null },
      createdAt: { type: Date, default: null },
    },
    // Dispute 해결 정보
    closedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedByRole: {
      type: String,
      enum: ['client', 'professional'],
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    loserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminDecision: {
      type: Boolean,
      default: false,
    },
    decisionNotes: {
      type: String,
      default: null,
    },
    autoClosed: {
      type: Boolean,
      default: false,
    },
    // 최종 합의 금액
    finalAmount: {
      type: Number,
      default: null,
    },
    // For milestone custom-offer orders: indices of disputed milestones (0-based)
    milestoneIndices: {
      type: [Number],
      default: undefined,
    },
    // Disputed amount: for milestone disputes = sum of selected milestones; otherwise = order refundable amount
    amount: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
disputeSchema.index({ order: 1, createdAt: -1 });
disputeSchema.index({ claimantId: 1, createdAt: -1 });
disputeSchema.index({ respondentId: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ disputeId: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;

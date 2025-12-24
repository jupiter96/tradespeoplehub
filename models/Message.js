import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'order', 'system'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    // For order messages
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    orderDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Read status
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ read: 1 });

const Message = mongoose.models?.Message || mongoose.model('Message', messageSchema);

export default Message;


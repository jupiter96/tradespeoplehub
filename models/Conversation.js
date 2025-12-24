import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // The user who initiated the conversation (client)
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Last message for quick access
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Unread count per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    // Soft delete - participants can archive conversations
    archivedBy: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ initiatedBy: 1 });

const Conversation = mongoose.models?.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;


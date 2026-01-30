import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'account_verified',
        'listing_approved',
        'listing_rejected',
        'listing_requires_modification',
        'message_received',
        'chat_message_received',
        'bank_transfer_approved',
        'bank_transfer_rejected',
        'order_received',
        'order_created',
        'order_completed',
        'extension_request_sent',
        'extension_request_approved',
        'extension_request_rejected',
        'review_received',
        'payment_received',
        'abandoned_cart',
        'system',
        'cancellation_requested',
        'cancellation_accepted',
        'cancellation_rejected',
        'cancellation_withdrawn',
        'cancellation_reminder',
        'order_delivered',
        'order_delivery_rejected',
        'order_delivery_approved',
        'order_delivery_reminder',
        'review_reminder',
        'dispute_initiated',
        'dispute_responded',
        'dispute_resolved',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    // Reference to related entity
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Service', 'User', 'Wallet', 'Conversation', 'Message', 'Order', 'Review'],
    },
    // Link to navigate when notification is clicked
    link: {
      type: String,
      trim: true,
    },
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedModel,
  link,
  metadata,
}) {
  const notification = new this({
    userId,
    type,
    title,
    message,
    relatedId,
    relatedModel,
    link,
    metadata,
  });
  await notification.save();
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to mark one as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

import Notification from '../models/Notification.js';
import { getIO } from './socket.js';

/**
 * Notification Service
 * Creates notifications for various events in the system
 * Sends real-time notifications via Socket.io
 */

// Helper function to emit notification to user via Socket.io
async function emitNotificationToUser(userId, notification) {
  try {
    const io = getIO();
    if (io) {
      const userIdStr = userId.toString();
      // Get unread count
      const unreadCount = await Notification.getUnreadCount(userId);
      
      // Emit new notification event
      io.to(`user:${userIdStr}`).emit('notification:new', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          link: notification.link,
          createdAt: notification.createdAt,
        },
        unreadCount,
      });
      
      console.log(`📢 Real-time notification sent to user ${userIdStr}`);
    }
  } catch (error) {
    console.error('Error emitting notification via socket:', error);
  }
}

// Account verified notification
export async function notifyAccountVerified(userId) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'account_verified',
      title: 'Account Verified',
      message: 'Congratulations! Your account has been verified. You can now access all features.',
      link: '/account',
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating account verified notification:', error);
  }
}

// Listing approved notification
export async function notifyListingApproved(userId, serviceId, serviceName) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'listing_approved',
      title: 'Listing Approved',
      message: `Your listing "${serviceName}" has been approved and is now live.`,
      relatedId: serviceId,
      relatedModel: 'Service',
      link: `/services/${serviceId}`,
      metadata: { serviceName },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating listing approved notification:', error);
  }
}

// Listing rejected notification
export async function notifyListingRejected(userId, serviceId, serviceName, reason) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'listing_rejected',
      title: 'Listing Rejected',
      message: `Your listing "${serviceName}" has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      relatedId: serviceId,
      relatedModel: 'Service',
      link: '/account?tab=services',
      metadata: { serviceName, reason },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating listing rejected notification:', error);
  }
}

// Listing requires modification notification
export async function notifyListingRequiresModification(userId, serviceId, serviceName, reason) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'listing_requires_modification',
      title: 'Listing Requires Changes',
      message: `Your listing "${serviceName}" requires modifications.${reason ? ` Reason: ${reason}` : ''}`,
      relatedId: serviceId,
      relatedModel: 'Service',
      link: '/account?tab=services',
      metadata: { serviceName, reason },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating listing requires modification notification:', error);
  }
}

// Message received notification (for general messages/inquiries)
export async function notifyMessageReceived(userId, senderId, senderName, conversationId, messagePreview) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'message_received',
      title: 'New Message',
      message: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
      relatedId: conversationId,
      relatedModel: 'Conversation',
      link: '/account?tab=messenger',
      metadata: { senderId, senderName },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating message received notification:', error);
  }
}

// Chat message received notification
export async function notifyChatMessageReceived(userId, senderId, senderName, conversationId, messagePreview) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'chat_message_received',
      title: 'New Chat Message',
      message: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
      relatedId: conversationId,
      relatedModel: 'Conversation',
      link: '/account?tab=messenger',
      metadata: { senderId, senderName },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating chat message received notification:', error);
  }
}

// Bank transfer approved notification
export async function notifyBankTransferApproved(userId, transactionId, amount) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'bank_transfer_approved',
      title: 'Bank Transfer Approved',
      message: `Your bank transfer of £${amount.toFixed(2)} has been approved and credited to your wallet.`,
      relatedId: transactionId,
      relatedModel: 'Wallet',
      link: '/account?tab=billing',
      metadata: { amount },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating bank transfer approved notification:', error);
  }
}

// Bank transfer rejected notification
export async function notifyBankTransferRejected(userId, transactionId, amount, reason) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'bank_transfer_rejected',
      title: 'Bank Transfer Rejected',
      message: `Your bank transfer of £${amount.toFixed(2)} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      relatedId: transactionId,
      relatedModel: 'Wallet',
      link: '/account?tab=billing',
      metadata: { amount, reason },
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating bank transfer rejected notification:', error);
  }
}

// Generic system notification
export async function notifySystem(userId, title, message, link = null) {
  try {
    const notification = await Notification.createNotification({
      userId,
      type: 'system',
      title,
      message,
      link,
    });
    
    // Send real-time notification
    await emitNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}

export default {
  notifyAccountVerified,
  notifyListingApproved,
  notifyListingRejected,
  notifyListingRequiresModification,
  notifyMessageReceived,
  notifyChatMessageReceived,
  notifyBankTransferApproved,
  notifyBankTransferRejected,
  notifySystem,
};

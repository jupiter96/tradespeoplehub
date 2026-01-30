import cron from 'node-cron';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { sendTemplatedEmail } from './notifier.js';
import { getIO } from './socket.js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

async function emitNotificationToUser(userId, notification) {
  try {
    const io = getIO();
    if (!io) return;
    const userIdStr = userId.toString();
    const unreadCount = await Notification.getUnreadCount(userId);
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
  } catch (err) {
    console.error('[Order Status Scheduler] Failed to emit notification:', err);
  }
}

const DELIVERY_REMINDER_HOURS_AFTER = 24;

/**
 * Send reminder to client to respond to delivered work (approve or request revision).
 * Runs once per delivered order when reminder not yet sent, at least DELIVERY_REMINDER_HOURS_AFTER after delivery.
 */
async function processDeliveryReminders() {
  try {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() - DELIVERY_REMINDER_HOURS_AFTER * 60 * 60 * 1000);

    const orders = await Order.find({
      deliveryStatus: 'delivered',
      status: 'delivered',
      deliveredDate: { $lte: reminderThreshold },
      $or: [
        { 'metadata.deliveryReminderSentAt': null },
        { 'metadata.deliveryReminderSentAt': { $exists: false } },
      ],
    }).populate('client');

    for (const order of orders) {
      try {
        const client = order.client;
        if (!client || !client.email) continue;

        const orderNumber = order.orderNumber;
        const serviceName = (order.items && order.items[0] && order.items[0].title) ? order.items[0].title : 'Your order';
        const orderLink = `${CLIENT_ORIGIN}/account?tab=orders`;

        const n = await Notification.createNotification({
          userId: client._id,
          type: 'order_delivery_reminder',
          title: 'Reminder: Review delivery',
          message: `Order ${orderNumber} has been delivered and is waiting for your review. Please approve or request a revision.`,
          relatedId: order._id,
          relatedModel: 'Order',
          link: '/account?tab=orders',
          metadata: { orderNumber },
        });
        await emitNotificationToUser(client._id, n);

        await sendTemplatedEmail(
          client.email,
          'order-delivery-reminder',
          {
            firstName: client.firstName || 'there',
            orderNumber,
            serviceName,
            orderLink,
          },
          'orders'
        );

        if (!order.metadata) order.metadata = {};
        order.metadata.deliveryReminderSentAt = new Date();
        await order.save();
      } catch (orderErr) {
        console.error(`[Order Status Scheduler] Error sending delivery reminder for order ${order.orderNumber}:`, orderErr);
      }
    }
  } catch (error) {
    console.error('[Order Status Scheduler] Error in processDeliveryReminders:', error);
  }
}

const REVIEW_REMINDER_HOURS_AFTER = 24;

/**
 * Send reminder to client to leave a review/rating for a completed order.
 * Runs once per completed order when no review exists yet, at least REVIEW_REMINDER_HOURS_AFTER after completion.
 */
async function processReviewReminders() {
  try {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() - REVIEW_REMINDER_HOURS_AFTER * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'Completed',
      completedDate: { $lte: reminderThreshold },
      $or: [
        { 'metadata.reviewReminderSentAt': null },
        { 'metadata.reviewReminderSentAt': { $exists: false } },
      ],
    }).populate('client');

    for (const order of orders) {
      try {
        const hasReview = await Review.findOne({ order: order._id });
        if (hasReview) continue;

        const client = order.client;
        if (!client || !client.email) continue;

        const orderNumber = order.orderNumber;
        const serviceName = (order.items && order.items[0] && order.items[0].title) ? order.items[0].title : 'Your order';
        const orderLink = `${CLIENT_ORIGIN}/account?tab=orders`;

        const n = await Notification.createNotification({
          userId: client._id,
          type: 'review_reminder',
          title: 'Leave a review',
          message: `Order ${orderNumber} is complete. How was your experience? Leave a rating and review.`,
          relatedId: order._id,
          relatedModel: 'Order',
          link: '/account?tab=orders',
          metadata: { orderNumber },
        });
        await emitNotificationToUser(client._id, n);

        await sendTemplatedEmail(
          client.email,
          'order-review-reminder',
          {
            firstName: client.firstName || 'there',
            orderNumber,
            serviceName,
            orderLink,
          },
          'orders'
        );

        if (!order.metadata) order.metadata = {};
        order.metadata.reviewReminderSentAt = new Date();
        await order.save();
      } catch (orderErr) {
        console.error(`[Order Status Scheduler] Error sending review reminder for order ${order.orderNumber}:`, orderErr);
      }
    }
  } catch (error) {
    console.error('[Order Status Scheduler] Error in processReviewReminders:', error);
  }
}

/**
 * Check orders waiting on booking time
 * Activate delivery status when booking time is reached
 */
async function processOrderStatusUpdates() {
  try {
    const now = new Date();
    
    // Find all orders that are waiting to start
    const orders = await Order.find({
      status: 'In Progress',
      deliveryStatus: 'pending',
      paymentMethod: { $ne: 'bank_transfer' },
      'items.booking.date': { $exists: true, $ne: null },
      'items.booking.starttime': { $exists: true, $ne: null },
    });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        // Get booking info from first item
        const booking = order.items?.[0]?.booking;
        if (!booking || !booking.date || !booking.starttime) {
          skippedCount++;
          continue;
        }

        // Parse booking date and time
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.starttime.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes)) {
          skippedCount++;
          continue;
        }

        bookingDate.setHours(hours, minutes, 0, 0);

        // Check if booking time has passed
        if (now >= bookingDate) {
          // Update delivery status to active if not already set
          if (!order.deliveryStatus || order.deliveryStatus === 'pending') {
            order.deliveryStatus = 'active';
          }

          await order.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (orderError) {
        console.error(`[Order Status Scheduler] Error processing order ${order.orderNumber}:`, orderError);
        skippedCount++;
      }
    }
  } catch (error) {
    console.error('[Order Status Scheduler] Error in processOrderStatusUpdates:', error);
  }
}

/**
 * Initialize the order status scheduler
 * Runs every minute to check if any orders need status updates
 */
export function startOrderStatusScheduler() {
  // Run every minute to check for orders that need status update
  cron.schedule('* * * * *', async () => {
    await processOrderStatusUpdates();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
  // Run every hour to send delivery review reminders to clients
  cron.schedule('0 * * * *', async () => {
    await processDeliveryReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
  // Run every hour to send review/rating reminders to clients (after order completed)
  cron.schedule('5 * * * *', async () => {
    await processReviewReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
}

/**
 * Manually trigger status update processing (for testing or admin use)
 */
export async function triggerOrderStatusUpdate() {
  await processOrderStatusUpdates();
}

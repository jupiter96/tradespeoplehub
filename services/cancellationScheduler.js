import cron from 'node-cron';
import Order from '../models/Order.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Notification from '../models/Notification.js';
import { sendTemplatedEmail } from './notifier.js';
import { getIO } from './socket.js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const REMINDER_HOURS_BEFORE_DEADLINE = 12;

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
    console.error('[Cancellation Scheduler] Failed to emit notification:', err);
  }
}

/**
 * Send reminder notification and email to the user who must accept/reject
 * a pending cancellation request (once per request, when within REMINDER_HOURS_BEFORE_DEADLINE of deadline).
 */
async function processCancellationReminders() {
  try {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + REMINDER_HOURS_BEFORE_DEADLINE * 60 * 60 * 1000);

    const orders = await Order.find({
      'cancellationRequest.status': 'pending',
      'cancellationRequest.responseDeadline': { $lte: reminderThreshold, $gt: now },
      $or: [
        { 'cancellationRequest.reminderSentAt': null },
        { 'cancellationRequest.reminderSentAt': { $exists: false } },
      ],
    }).populate('client professional');

    for (const order of orders) {
      try {
        const requestedById = order.cancellationRequest.requestedBy?.toString?.() || order.cancellationRequest.requestedBy?.toString?.();
        const clientId = order.client?._id?.toString?.() || order.client?.toString?.();
        const professionalId = order.professional?._id?.toString?.() || order.professional?.toString?.();
        const responderId = requestedById === clientId ? professionalId : clientId;
        if (!responderId) continue;

        const responder = requestedById === clientId ? order.professional : order.client;
        if (!responder || !responder.email) continue;

        const orderNumber = order.orderNumber;
        const serviceName = (order.items && order.items[0] && order.items[0].title) ? order.items[0].title : 'Your order';
        const responseDeadline = order.cancellationRequest.responseDeadline
          ? new Date(order.cancellationRequest.responseDeadline).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '';
        const orderLink = `${CLIENT_ORIGIN}/account?tab=orders`;

        const n = await Notification.createNotification({
          userId: responder._id,
          type: 'cancellation_reminder',
          title: 'Reminder: Accept or reject cancellation',
          message: `A cancellation request for order ${orderNumber} is still pending. Please accept or reject it by the deadline.`,
          relatedId: order._id,
          relatedModel: 'Order',
          link: '/account?tab=orders',
          metadata: { orderNumber },
        });
        await emitNotificationToUser(responder._id, n);

        await sendTemplatedEmail(
          responder.email,
          'cancellation-reminder',
          {
            firstName: responder.firstName || responder.tradingName || 'there',
            orderNumber,
            serviceName,
            responseDeadline,
            orderLink,
          },
          'orders'
        );

        if (!order.cancellationRequest) order.cancellationRequest = {};
        order.cancellationRequest.reminderSentAt = new Date();
        await order.save();
      } catch (orderErr) {
        console.error(`[Cancellation Scheduler] Error sending reminder for order ${order.orderNumber}:`, orderErr);
      }
    }
  } catch (error) {
    console.error('[Cancellation Scheduler] Error in processCancellationReminders:', error);
  }
}

/**
 * Automatically cancel orders with pending cancellation requests
 * that have passed the response deadline
 */
async function processAutomaticCancellations() {
  try {
    const now = new Date();
    
    // Find all orders with pending cancellation requests that have passed the deadline
    const orders = await Order.find({
      'cancellationRequest.status': 'pending',
      'cancellationRequest.responseDeadline': { $lte: now },
      $and: [
        { status: { $ne: 'Cancelled' } }, // Not already cancelled
        { status: { $ne: 'Completed' } }, // Not completed
        { 
          $or: [
            { deliveryStatus: { $exists: false } },
            { deliveryStatus: { $ne: 'delivered' } },
            { deliveryStatus: { $ne: 'completed' } }
          ]
        }
      ]
    });

    let cancelledCount = 0;

    for (const order of orders) {
      try {
        // Automatically cancel the order
        order.status = 'Cancelled';
        order.cancellationRequest.status = 'approved';
        order.cancellationRequest.respondedAt = now;
        // respondedBy is null for automatic cancellation

        await order.save();
        cancelledCount++;

        // TODO: Implement refund logic based on payment method
        // Refund should be processed here if payment was made
      } catch (orderError) {
        console.error(`[Cancellation Scheduler] Error processing order ${order.orderNumber}:`, orderError);
      }
    }

    if (cancelledCount > 0) {
      console.log(`[Cancellation Scheduler] Automatically cancelled ${cancelledCount} order(s)`);
    }
  } catch (error) {
    console.error('[Cancellation Scheduler] Error in processAutomaticCancellations:', error);
  }
}

/**
 * Initialize the cancellation scheduler
 * Runs every minute to check for orders with expired cancellation deadlines
 */
export function startCancellationScheduler() {
  // Run every minute to check for orders that need automatic cancellation
  cron.schedule('* * * * *', async () => {
    await processAutomaticCancellations();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
  // Run every hour to send pending cancellation reminders
  cron.schedule('0 * * * *', async () => {
    await processCancellationReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
}

/**
 * Manually trigger cancellation processing (for testing or admin use)
 */
export async function triggerAutomaticCancellation() {
  await processAutomaticCancellations();
}

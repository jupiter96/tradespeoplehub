import cron from 'node-cron';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import PaymentSettings from '../models/PaymentSettings.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import CustomOffer from '../models/CustomOffer.js';
import Message from '../models/Message.js';
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
      status: 'delivered',
      deliveredDate: { $lte: reminderThreshold },
      $and: [
        {
          $or: [
            { deliveryStatus: 'delivered' },
            { deliveryStatus: { $exists: false } },
            { deliveryStatus: null },
          ],
        },
        {
          $or: [
            { 'metadata.deliveryReminderSentAt': null },
            { 'metadata.deliveryReminderSentAt': { $exists: false } },
          ],
        },
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

const REVIEW_REMINDER_DAYS = [7, 30, 89]; // Reminder waves: 7d, 30d, 89d after completion (immediate sent on completion)
const REVIEW_CUTOFF_DAYS = 90; // After this many days, no more reminders and no review/rating allowed

/** Send "Leave a review" email + notification to client (used on completion and by processReviewReminders). */
async function sendReviewInvitationToClient(order, clientUser) {
  if (!clientUser || !clientUser.email) return;
  try {
    const orderNumber = order.orderNumber;
    const serviceName = (order.items && order.items[0] && order.items[0].title) ? order.items[0].title : 'Your order';
    const orderLink = `${CLIENT_ORIGIN}/account?tab=orders`;
    const n = await Notification.createNotification({
      userId: clientUser._id,
      type: 'review_reminder',
      title: 'Leave a review',
      message: `Order ${orderNumber} is complete. How was your experience? Leave a rating and review.`,
      relatedId: order._id,
      relatedModel: 'Order',
      link: '/account?tab=orders',
      metadata: { orderNumber },
    });
    await emitNotificationToUser(clientUser._id, n);
    await sendTemplatedEmail(
      clientUser.email,
      'order-review-reminder',
      {
        firstName: clientUser.firstName || 'there',
        orderNumber,
        serviceName,
        orderLink,
      },
      'orders'
    );
  } catch (err) {
    console.error('[Order Status Scheduler] Error sending review invitation:', err);
  }
}

/**
 * Send reminder to client to leave a review for a completed order.
 * Only at 7, 30, 89 days after completion (immediate is sent on completion in orders route).
 * Tracks wave in metadata.reviewReminderWave: 0 = immediate sent, 1 = 7d sent, 2 = 30d sent, 3 = 89d sent.
 */
async function processReviewReminders() {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - REVIEW_CUTOFF_DAYS * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      status: 'Completed',
      completedDate: { $exists: true, $ne: null, $gt: cutoffDate },
      $or: [
        { 'metadata.reviewReminderWave': { $exists: false } },
        { 'metadata.reviewReminderWave': null },
        { 'metadata.reviewReminderWave': { $lt: 3 } },
      ],
    }).populate('client');

    for (const order of orders) {
      try {
        const hasReview = await Review.findOne({ order: order._id });
        if (hasReview) continue;

        const client = order.client;
        if (!client || !client.email) continue;

        const completedAt = new Date(order.completedDate);
        const wave = typeof order.metadata?.reviewReminderWave === 'number' ? order.metadata.reviewReminderWave : 0;

        let nextWave = null;
        if (wave < 1) {
          const at7 = new Date(completedAt.getTime() + REVIEW_REMINDER_DAYS[0] * 24 * 60 * 60 * 1000);
          if (now >= at7) nextWave = 1;
        }
        if (nextWave === null && wave < 2) {
          const at30 = new Date(completedAt.getTime() + REVIEW_REMINDER_DAYS[1] * 24 * 60 * 60 * 1000);
          if (now >= at30) nextWave = 2;
        }
        if (nextWave === null && wave < 3) {
          const at89 = new Date(completedAt.getTime() + REVIEW_REMINDER_DAYS[2] * 24 * 60 * 60 * 1000);
          if (now >= at89) nextWave = 3;
        }

        if (nextWave === null) continue;

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
        order.metadata.reviewReminderWave = nextWave;
        order.markModified('metadata');
        await order.save();
      } catch (orderErr) {
        console.error(`[Order Status Scheduler] Error sending review reminder for order ${order.orderNumber}:`, orderErr);
      }
    }
  } catch (error) {
    console.error('[Order Status Scheduler] Error in processReviewReminders:', error);
  }
}

async function processAutoCompleteDeliveredOrders() {
  try {
    const settings = await PaymentSettings.getSettings();
    // Use delivered work response time (hours); fallback to days*24, then default 48
    const responseTimeHours = typeof settings.deliveredWorkResponseTimeHours === 'number' && settings.deliveredWorkResponseTimeHours > 0
      ? settings.deliveredWorkResponseTimeHours
      : (typeof settings.deliveredWorkResponseTimeDays === 'number' && settings.deliveredWorkResponseTimeDays >= 0
        ? settings.deliveredWorkResponseTimeDays * 24
        : 48);
    const effectiveResponseHours = responseTimeHours > 0 ? responseTimeHours : 48;

    const now = new Date();
    const threshold = new Date(now.getTime() - effectiveResponseHours * 60 * 60 * 1000);

    // ---- 1) Regular orders (and milestone orders with all delivered): status delivered, deadline passed
    // Deadline = deliveredDate (or professionalCompleteRequest.requestedAt) + deliveredWorkResponseTime
    const deliveredOrders = await Order.find({
      status: { $in: ['delivered', 'Delivered'] },
      $and: [
        {
          $or: [
            { deliveryStatus: 'delivered' },
            { deliveryStatus: { $exists: false } },
            { deliveryStatus: null },
          ],
        },
        {
          $or: [
            { deliveredDate: { $exists: true, $ne: null, $lte: threshold } },
            {
              $and: [
                { $or: [ { deliveredDate: { $exists: false } }, { deliveredDate: null } ] },
                { 'metadata.professionalCompleteRequest.requestedAt': { $lte: threshold } },
              ],
            },
          ],
        },
      ],
    });

    for (const order of deliveredOrders) {
      try {
        if (order.status === 'Completed' || order.deliveryStatus === 'completed') continue;
        const disputeStatus = order.metadata?.disputeStatus;
        if (disputeStatus === 'open' || disputeStatus === 'negotiation' || disputeStatus === 'admin_arbitration') continue;
        if (order.status === 'Revision') continue;

        const revisionRequests = order.revisionRequest
          ? (Array.isArray(order.revisionRequest) ? order.revisionRequest : [order.revisionRequest])
          : [];
        const hasActiveRevision = revisionRequests.some(rr => rr && (rr.status === 'pending' || rr.status === 'in_progress'));
        if (hasActiveRevision) continue;

        const professional = await User.findById(order.professional);
        if (!professional) continue;

        const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;
        if (professionalPayoutAmount > 0) {
          professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
          await professional.save();

          const payoutTransaction = new Wallet({
            userId: professional._id,
            type: 'deposit',
            amount: professionalPayoutAmount,
            balance: professional.walletBalance,
            status: 'completed',
            paymentMethod: 'wallet',
            orderId: order._id,
            description: `Auto-approved payment for Order ${order.orderNumber}`,
            metadata: {
              orderNumber: order.orderNumber,
              orderSubtotal: order.subtotal,
              discount: order.discount || 0,
              promoCode: order.promoCode || null,
              promoCodeType: order.metadata?.promoCodeType || null,
              autoApproved: true,
            },
          });
          await payoutTransaction.save();
        }

        if (!order.metadata) order.metadata = {};
        const baseDate = order.deliveredDate
          ? new Date(order.deliveredDate)
          : (order.metadata?.professionalCompleteRequest?.requestedAt ? new Date(order.metadata.professionalCompleteRequest.requestedAt) : new Date());
        const deadlineDate = new Date(baseDate.getTime() + effectiveResponseHours * 60 * 60 * 1000);

        order.status = 'Completed';
        order.deliveryStatus = 'completed';
        order.completedDate = new Date();
        order.metadata.autoApprovedAt = new Date();
        order.metadata.autoApprovedDeadlineAt = deadlineDate;
        order.metadata.autoApprovedReason = 'no_client_response';
        order.markModified('metadata');
        await order.save();

        order.metadata.reviewReminderWave = 0;
        order.markModified('metadata');
        await order.save();
        const clientForReview = await User.findById(order.client);
        if (clientForReview) await sendReviewInvitationToClient(order, clientForReview);

        if (order.metadata?.fromCustomOffer && order.metadata?.customOfferId) {
          try {
            const customOffer = await CustomOffer.findById(order.metadata.customOfferId);
            if (customOffer?.message) {
              const message = await Message.findById(customOffer.message);
              if (message?.orderDetails) {
                message.orderDetails.status = 'completed';
                message.markModified('orderDetails');
                await message.save();
              }
            }
          } catch (syncErr) {
            console.error(`[Order Status Scheduler] Failed to sync custom offer message for order ${order.orderNumber}:`, syncErr);
          }
        }
      } catch (orderErr) {
        console.error(`[Order Status Scheduler] Error auto-completing order ${order.orderNumber}:`, orderErr);
      }
    }

    // ---- 2) Milestone orders (partially delivered): auto-approve each milestone whose deliveredAt is past threshold
    const milestoneOrders = await Order.find({
      status: 'In Progress',
      'metadata.paymentType': 'milestone',
      'metadata.milestones.0': { $exists: true },
      'metadata.milestoneDeliveries': { $exists: true, $ne: [] },
    });

    for (const order of milestoneOrders) {
      try {
        if (order.status === 'Completed') continue;
        const disputeStatus = order.metadata?.disputeStatus;
        if (disputeStatus === 'open' || disputeStatus === 'negotiation' || disputeStatus === 'admin_arbitration') continue;

        const milestones = order.metadata?.milestones || [];
        const milestoneDeliveries = order.metadata?.milestoneDeliveries || [];
        const disputeResolved = order.metadata?.disputeResolvedMilestoneIndices || [];

        let anyUpdated = false;
        for (const d of milestoneDeliveries) {
          if (d.approvedAt) continue;
          const deliveredAt = d.deliveredAt ? new Date(d.deliveredAt) : null;
          if (!deliveredAt || deliveredAt > threshold) continue;
          d.approvedAt = new Date();
          anyUpdated = true;
        }

        if (!anyUpdated) continue;

        order.markModified('metadata');

        // If all milestones are now delivered and approved (or dispute-resolved), complete the order
        const allComplete = Array.isArray(milestones) && milestones.length > 0 &&
          milestones.every((_, idx) =>
            disputeResolved.includes(idx) ||
            milestoneDeliveries.some((d) => d.milestoneIndex === idx && d.approvedAt)
          );

        if (allComplete) {
          const professional = await User.findById(order.professional);
          if (professional) {
            const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;
            if (professionalPayoutAmount > 0) {
              professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
              await professional.save();
              const payoutTransaction = new Wallet({
                userId: professional._id,
                type: 'deposit',
                amount: professionalPayoutAmount,
                balance: professional.walletBalance,
                status: 'completed',
                paymentMethod: 'wallet',
                orderId: order._id,
                description: `Auto-approved payment for Order ${order.orderNumber}`,
                metadata: {
                  orderNumber: order.orderNumber,
                  orderSubtotal: order.subtotal,
                  discount: order.discount || 0,
                  promoCode: order.promoCode || null,
                  promoCodeType: order.metadata?.promoCodeType || null,
                  autoApproved: true,
                },
              });
              await payoutTransaction.save();
            }
          }
          order.status = 'Completed';
          order.deliveryStatus = 'completed';
          order.completedDate = new Date();
          if (!order.metadata) order.metadata = {};
          order.metadata.autoApprovedAt = new Date();
          order.metadata.autoApprovedReason = 'no_client_response';
          // Deadline = last milestone delivery time + response time (for client/pro message)
          const lastDeliveredAt = Math.max(
            ...(order.metadata.milestoneDeliveries || [])
              .filter((d) => d.deliveredAt)
              .map((d) => new Date(d.deliveredAt).getTime())
          );
          if (Number.isFinite(lastDeliveredAt)) {
            order.metadata.autoApprovedDeadlineAt = new Date(lastDeliveredAt + effectiveResponseHours * 60 * 60 * 1000);
          }
          order.metadata.reviewReminderWave = 0;
        }

        await order.save();

        if (order.status === 'Completed') {
          const clientForReview = await User.findById(order.client);
          if (clientForReview) await sendReviewInvitationToClient(order, clientForReview);
        }

        if (order.status === 'Completed' && order.metadata?.fromCustomOffer && order.metadata?.customOfferId) {
          try {
            const customOffer = await CustomOffer.findById(order.metadata.customOfferId);
            if (customOffer?.message) {
              const message = await Message.findById(customOffer.message);
              if (message?.orderDetails) {
                message.orderDetails.status = 'completed';
                message.markModified('orderDetails');
                await message.save();
              }
            }
          } catch (syncErr) {
            console.error(`[Order Status Scheduler] Failed to sync custom offer message for order ${order.orderNumber}:`, syncErr);
          }
        }
      } catch (orderErr) {
        console.error(`[Order Status Scheduler] Error auto-completing milestone order ${order.orderNumber}:`, orderErr);
      }
    }
  } catch (error) {
    console.error('[Order Status Scheduler] Error in processAutoCompleteDeliveredOrders:', error);
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
  // Run every minute so orders complete at correct time (deliveredDate + delivered work response time)
  cron.schedule('* * * * *', async () => {
    await processAutoCompleteDeliveredOrders();
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

/**
 * Manually trigger auto-complete of delivered orders (for testing or admin use)
 */
export async function triggerAutoCompleteDeliveredOrders() {
  await processAutoCompleteDeliveredOrders();
}

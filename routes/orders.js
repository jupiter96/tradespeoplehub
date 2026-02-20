import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import PaymentSettings from '../models/PaymentSettings.js';
import PromoCode from '../models/PromoCode.js';
import Review from '../models/Review.js';
import { updateServiceReviewStats } from '../utils/reviewService.js';
import Dispute from '../models/Dispute.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import CustomOffer from '../models/CustomOffer.js';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import { sendTemplatedEmail } from '../services/notifier.js';
import { getIO } from '../services/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function runBackgroundTask(task, label) {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(`[Orders] Background task failed${label ? ` (${label})` : ''}:`, error);
    });
}

/**
 * Sync order status to the associated custom offer message in chat.
 * Maps order.status to a lowercase status string stored in message.orderDetails.status.
 */
async function syncCustomOfferMessageStatus(order) {
  if (!order?.metadata?.fromCustomOffer || !order.metadata.customOfferId) return;
  try {
    const customOffer = await CustomOffer.findById(order.metadata.customOfferId);
    if (!customOffer?.message) return;
    const message = await Message.findById(customOffer.message);
    if (!message || !message.orderDetails) return;

    // Map order status to message status
    const statusMap = {
      'offer created': 'pending',
      'offer expired': 'expired',
      'In Progress': 'in progress',
      'delivered': 'delivered',
      'Revision': 'revision',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
      'Cancellation Pending': 'cancellation pending',
      'disputed': 'disputed',
    };
    const newStatus = statusMap[order.status] || order.status.toLowerCase();
    message.orderDetails.status = newStatus;
    message.markModified('orderDetails');
    await message.save();
  } catch (err) {
    console.error('[Orders] Failed to sync custom offer message status:', err);
  }
}

// Helper function to emit notification to user via Socket.io
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
  } catch (error) {
    console.error('[Orders] Error emitting notification:', error);
  }
}

async function applyDisputeSettlement({ order, dispute, agreedAmount }) {
  const totalPaidRaw = Number(order.total ?? 0);
  const totalPaid = Number.isFinite(totalPaidRaw) ? totalPaidRaw : 0;
  const agreedRaw = Number(agreedAmount ?? 0);
  const normalizedAgreedAmount = Number.isFinite(agreedRaw) ? agreedRaw : 0;
  const payoutAmount = Math.max(0, Math.min(normalizedAgreedAmount, totalPaid));
  const refundAmount = Math.max(0, totalPaid - payoutAmount);

  if (!order.metadata) order.metadata = {};
  if (order.metadata.disputePayoutProcessed) return;

  const client = await User.findById(order.client?._id || order.client);
  const professional = await User.findById(order.professional?._id || order.professional);

  if (client && refundAmount > 0) {
    client.walletBalance = (client.walletBalance || 0) + refundAmount;
    await client.save();
    const refundTransaction = new Wallet({
      userId: client._id,
      type: 'deposit',
      amount: refundAmount,
      balance: client.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      orderId: order._id,
      description: `Dispute Refund - Order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        disputeId: dispute?.disputeId || order.disputeId,
        reason: 'Dispute resolved by settlement offer',
      },
    });
    await refundTransaction.save();
  }

  if (professional && payoutAmount > 0) {
    professional.walletBalance = (professional.walletBalance || 0) + payoutAmount;
    await professional.save();
    const payoutTransaction = new Wallet({
      userId: professional._id,
      type: 'deposit',
      amount: payoutAmount,
      balance: professional.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      orderId: order._id,
      description: `Dispute Payout - Order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        disputeId: dispute?.disputeId || order.disputeId,
        reason: 'Dispute resolved by settlement offer',
      },
    });
    await payoutTransaction.save();
  }

  order.metadata.disputePayoutProcessed = true;
  order.metadata.disputePayoutProcessedAt = new Date();
  order.metadata.disputeSettlementAgreedAmount = payoutAmount;
  order.metadata.disputeSettlementRefundAmount = refundAmount;
}

async function sendOrderNotifications({ order, clientUser, professionalUser }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = order.items?.[0]?.title || 'Service Order';
    const orderTotal = typeof order.total === 'number' ? order.total : Number(order.total || 0);
    const orderLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/account?tab=orders`;

    if (clientUser) {
      const clientNotification = await Notification.createNotification({
        userId: clientUser._id,
        type: 'order_created',
        title: 'Order created',
        message: `Your order ${orderNumber} has been created successfully.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber, serviceName },
      });
      await emitNotificationToUser(clientUser._id, clientNotification);
      if (clientUser.email) {
        await sendTemplatedEmail(
          clientUser.email,
          'order-created-client',
          {
            firstName: clientUser.firstName || 'there',
            orderNumber,
            serviceName,
            orderTotal: orderTotal.toFixed(2),
            orderLink,
          },
          'orders'
        );
      }
    }

    if (professionalUser) {
      const professionalNotification = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'order_received',
        title: 'New order received',
        message: `You received a new order (${orderNumber}) for "${serviceName}".`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber, serviceName },
      });
      await emitNotificationToUser(professionalUser._id, professionalNotification);
      if (professionalUser.email) {
        await sendTemplatedEmail(
          professionalUser.email,
          'order-received-professional',
          {
            firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
            orderNumber,
            serviceName,
            orderTotal: orderTotal.toFixed(2),
            orderLink,
          },
          'orders'
        );
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send order notifications/emails:', error);
  }
}

const orderLinkBase = () => `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/account?tab=orders`;

async function sendExtensionRequestNotifications({ order, clientUser, professionalUser }) {
  try {
    const orderNumber = order.orderNumber;
    const ext = order.extensionRequest || {};
    const newDeliveryDate = ext.newDeliveryDate
      ? new Date(ext.newDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    const reason = ext.reason || 'No reason provided';
    const link = orderLinkBase();

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'extension_request_sent',
        title: 'Time extension requested',
        message: `The professional requested a time extension for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'extension-request-sent-client', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          newDeliveryDate,
          reason,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'extension_request_sent',
        title: 'Extension request submitted',
        message: `Your time extension request for order ${orderNumber} was submitted.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'extension-request-sent-professional', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          newDeliveryDate,
          reason,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send extension request notifications/emails:', error);
  }
}

async function sendExtensionResponseNotifications({ order, clientUser, professionalUser, action }) {
  try {
    const orderNumber = order.orderNumber;
    const link = orderLinkBase();
    const isApproved = action === 'approve';

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: isApproved ? 'extension_request_approved' : 'extension_request_rejected',
        title: isApproved ? 'Extension approved' : 'Extension rejected',
        message: isApproved
          ? `You approved the time extension for order ${orderNumber}.`
          : `You rejected the time extension for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(
          clientUser.email,
          isApproved ? 'extension-request-approved-client' : 'extension-request-rejected-client',
          { firstName: clientUser.firstName || 'there', orderNumber, orderLink: link },
          'orders'
        );
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: isApproved ? 'extension_request_approved' : 'extension_request_rejected',
        title: isApproved ? 'Extension approved' : 'Extension rejected',
        message: isApproved
          ? `The client approved your time extension for order ${orderNumber}.`
          : `The client rejected your time extension for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(
          professionalUser.email,
          isApproved ? 'extension-request-approved-professional' : 'extension-request-rejected-professional',
          { firstName: professionalUser.firstName || professionalUser.tradingName || 'there', orderNumber, orderLink: link },
          'orders'
        );
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send extension response notifications/emails:', error);
  }
}

function getOrderServiceName(order) {
  return (order.items && order.items[0] && order.items[0].title) ? order.items[0].title : 'Your order';
}

async function sendCancellationRequestNotifications({ order, clientUser, professionalUser, requestedByUserId }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const requestedByClient = order.client._id.toString() === requestedByUserId.toString();
    const requestedByRole = requestedByClient ? 'client' : 'professional';
    const responseDeadline = order.cancellationRequest?.responseDeadline
      ? new Date(order.cancellationRequest.responseDeadline).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    if (clientUser) {
      const isRequester = clientUser._id.toString() === requestedByUserId.toString();
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'cancellation_requested',
        title: isRequester ? 'Cancellation request submitted' : 'Cancellation requested',
        message: isRequester
          ? `Your cancellation request for order ${orderNumber} was submitted.`
          : `The ${requestedByRole} has requested to cancel order ${orderNumber}. Please accept or reject.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(
          clientUser.email,
          isRequester ? 'cancellation-requested-requester' : 'cancellation-requested-responder',
          {
            firstName: clientUser.firstName || 'there',
            orderNumber,
            serviceName,
            ...(isRequester ? {} : { requestedByRole, responseDeadline }),
            orderLink: link,
          },
          'orders'
        );
      }
    }

    if (professionalUser) {
      const isRequester = professionalUser._id.toString() === requestedByUserId.toString();
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'cancellation_requested',
        title: isRequester ? 'Cancellation request submitted' : 'Cancellation requested',
        message: isRequester
          ? `Your cancellation request for order ${orderNumber} was submitted.`
          : `The ${requestedByRole} has requested to cancel order ${orderNumber}. Please accept or reject.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(
          professionalUser.email,
          isRequester ? 'cancellation-requested-requester' : 'cancellation-requested-responder',
          {
            firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
            orderNumber,
            serviceName,
            ...(isRequester ? {} : { requestedByRole, responseDeadline }),
            orderLink: link,
          },
          'orders'
        );
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send cancellation request notifications/emails:', error);
  }
}

async function sendCancellationResponseNotifications({ order, clientUser, professionalUser, action }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const isApproved = action === 'approve';
    const type = isApproved ? 'cancellation_accepted' : 'cancellation_rejected';
    const title = isApproved ? 'Cancellation accepted' : 'Cancellation rejected';
    const message = isApproved
      ? `The cancellation request for order ${orderNumber} has been accepted.`
      : `The cancellation request for order ${orderNumber} has been rejected.`;

    const emailTemplate = isApproved ? 'cancellation-accepted' : 'cancellation-rejected';
    const emailVars = (user) => ({
      firstName: user.firstName || user.tradingName || 'there',
      orderNumber,
      serviceName,
      orderLink: link,
    });

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type,
        title,
        message,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, emailTemplate, emailVars(clientUser), 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type,
        title,
        message,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, emailTemplate, emailVars(professionalUser), 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send cancellation response notifications/emails:', error);
  }
}

async function sendCancellationWithdrawnNotifications({ order, clientUser, professionalUser, withdrawnByUserId }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const withdrawnByClient = order.client._id.toString() === withdrawnByUserId.toString();
    const withdrawnByRole = withdrawnByClient ? 'client' : 'professional';

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'cancellation_withdrawn',
        title: 'Cancellation request withdrawn',
        message: `The ${withdrawnByRole} has withdrawn the cancellation request for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'cancellation-withdrawn', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          serviceName,
          withdrawnByRole,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'cancellation_withdrawn',
        title: 'Cancellation request withdrawn',
        message: `The ${withdrawnByRole} has withdrawn the cancellation request for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'cancellation-withdrawn', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          serviceName,
          withdrawnByRole,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send cancellation withdrawn notifications/emails:', error);
  }
}

async function sendOrderDeliveredNotifications({ order, clientUser, professionalUser }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'order_delivered',
        title: 'Order delivered',
        message: `Order ${orderNumber} has been delivered. Please review and approve or request a revision.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'order-delivered-client', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          serviceName,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'order_delivered',
        title: 'Order marked as delivered',
        message: `You marked order ${orderNumber} as delivered. The client will be notified to review.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'order-delivered-professional', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          serviceName,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send order delivered notifications/emails:', error);
  }
}

async function sendOrderDeliveryRejectedNotifications({ order, clientUser, professionalUser, reason }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const reasonText = reason || 'No reason provided';

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'order_delivery_rejected',
        title: 'Revision requested',
        message: `You requested a revision (rejected delivery) for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'order-delivery-rejected-client', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          serviceName,
          reason: reasonText,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'order_delivery_rejected',
        title: 'Client requested revision',
        message: `The client requested a revision (rejected delivery) for order ${orderNumber}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'order-delivery-rejected-professional', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          serviceName,
          reason: reasonText,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send order delivery rejected notifications/emails:', error);
  }
}

async function sendOrderDeliveryApprovedNotifications({ order, clientUser, professionalUser }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'order_delivery_approved',
        title: 'Order completed',
        message: `You approved the delivery for order ${orderNumber}. The order is now completed.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'order-delivery-approved', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          serviceName,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'order_delivery_approved',
        title: 'Delivery approved',
        message: `The client approved the delivery for order ${orderNumber}. The order is completed.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'order-delivery-approved', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          serviceName,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send order delivery approved notifications/emails:', error);
  }
}

async function sendDisputeInitiatedNotifications({ order, clientUser, professionalUser, claimantId, responseDeadline }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const responseDeadlineStr = responseDeadline
      ? new Date(responseDeadline).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    const emailVars = { orderNumber, serviceName, responseDeadline: responseDeadlineStr, orderLink: link };

    if (clientUser) {
      const isClaimant = clientUser._id.toString() === claimantId.toString();
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'dispute_initiated',
        title: isClaimant ? 'Dispute opened' : 'Dispute opened – please respond',
        message: isClaimant
          ? `You opened a dispute for order ${orderNumber}. The other party can respond by the deadline.`
          : `A dispute was opened for order ${orderNumber}. Please respond by the deadline.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(
          clientUser.email,
          isClaimant ? 'dispute-initiated-claimant' : 'dispute-initiated-respondent',
          { firstName: clientUser.firstName || 'there', ...emailVars },
          'orders'
        );
      }
    }

    if (professionalUser) {
      const isClaimant = professionalUser._id.toString() === claimantId.toString();
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'dispute_initiated',
        title: isClaimant ? 'Dispute opened' : 'Dispute opened – please respond',
        message: isClaimant
          ? `You opened a dispute for order ${orderNumber}. The other party can respond by the deadline.`
          : `A dispute was opened for order ${orderNumber}. Please respond by the deadline.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(
          professionalUser.email,
          isClaimant ? 'dispute-initiated-claimant' : 'dispute-initiated-respondent',
          { firstName: professionalUser.firstName || professionalUser.tradingName || 'there', ...emailVars },
          'orders'
        );
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send dispute initiated notifications/emails:', error);
  }
}

async function sendDisputeRespondedNotifications({ order, clientUser, professionalUser, respondentId }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();

    if (clientUser) {
      const isRespondent = clientUser._id.toString() === respondentId.toString();
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'dispute_responded',
        title: isRespondent ? 'Dispute response submitted' : 'Dispute response received',
        message: isRespondent
          ? `Your response to the dispute for order ${orderNumber} was submitted. The dispute is now in negotiation.`
          : `The other party responded to the dispute for order ${orderNumber}. The dispute is now in negotiation.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(
          clientUser.email,
          isRespondent ? 'dispute-responded-respondent' : 'dispute-responded-claimant',
          {
            firstName: clientUser.firstName || 'there',
            orderNumber,
            serviceName,
            orderLink: link,
          },
          'orders'
        );
      }
    }

    if (professionalUser) {
      const isRespondent = professionalUser._id.toString() === respondentId.toString();
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'dispute_responded',
        title: isRespondent ? 'Dispute response submitted' : 'Dispute response received',
        message: isRespondent
          ? `Your response to the dispute for order ${orderNumber} was submitted. The dispute is now in negotiation.`
          : `The other party responded to the dispute for order ${orderNumber}. The dispute is now in negotiation.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(
          professionalUser.email,
          isRespondent ? 'dispute-responded-respondent' : 'dispute-responded-claimant',
          {
            firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
            orderNumber,
            serviceName,
            orderLink: link,
          },
          'orders'
        );
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send dispute responded notifications/emails:', error);
  }
}

async function sendDisputeResolvedNotifications({ order, clientUser, professionalUser, agreedAmount }) {
  try {
    const orderNumber = order.orderNumber;
    const serviceName = getOrderServiceName(order);
    const link = orderLinkBase();
    const agreedAmountStr = (agreedAmount != null && agreedAmount !== '') ? Number(agreedAmount).toFixed(2) : '0.00';

    if (clientUser) {
      const n = await Notification.createNotification({
        userId: clientUser._id,
        type: 'dispute_resolved',
        title: 'Dispute resolved',
        message: `The dispute for order ${orderNumber} has been resolved. Agreed amount: £${agreedAmountStr}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(clientUser._id, n);
      if (clientUser.email) {
        await sendTemplatedEmail(clientUser.email, 'dispute-resolved', {
          firstName: clientUser.firstName || 'there',
          orderNumber,
          serviceName,
          agreedAmount: agreedAmountStr,
          orderLink: link,
        }, 'orders');
      }
    }

    if (professionalUser) {
      const n = await Notification.createNotification({
        userId: professionalUser._id,
        type: 'dispute_resolved',
        title: 'Dispute resolved',
        message: `The dispute for order ${orderNumber} has been resolved. Agreed amount: £${agreedAmountStr}.`,
        relatedId: order._id,
        relatedModel: 'Order',
        link: '/account?tab=orders',
        metadata: { orderNumber },
      });
      await emitNotificationToUser(professionalUser._id, n);
      if (professionalUser.email) {
        await sendTemplatedEmail(professionalUser.email, 'dispute-resolved', {
          firstName: professionalUser.firstName || professionalUser.tradingName || 'there',
          orderNumber,
          serviceName,
          agreedAmount: agreedAmountStr,
          orderLink: link,
        }, 'orders');
      }
    }
  } catch (error) {
    console.error('[Orders] Failed to send dispute resolved notifications/emails:', error);
  }
}

// Helper function to build order query that handles both orderNumber and _id
async function buildOrderQuery(orderId, additionalFilters = {}) {
  const mongoose = (await import('mongoose')).default;
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24;
  
  const query = { ...additionalFilters };
  
  if (isObjectId) {
    query.$or = [{ orderNumber: orderId }, { _id: orderId }];
  } else {
    query.orderNumber = orderId;
  }
  
  return query;
}

// Configure multer for delivery file uploads (images/videos)
const deliveryDir = path.join(__dirname, '..', 'uploads', 'deliveries');
// Create delivery directory if it doesn't exist
fs.mkdir(deliveryDir, { recursive: true }).catch(() => {});

// Configure multer for revision request attachments
const revisionDir = path.join(__dirname, '..', 'uploads', 'revisions');
fs.mkdir(revisionDir, { recursive: true }).catch(() => {});

const deliveryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, deliveryDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const deliveryUpload = multer({
  storage: deliveryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (PNG, JPG, GIF, WEBP) and videos (MP4, MPEG, MOV, AVI, WEBM) are allowed.'));
    }
  }
});

const revisionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, revisionDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const revisionUpload = multer({
  storage: revisionStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, or documents are allowed.'));
    }
  }
});

// Configure multer for dispute evidence files
const disputeDir = path.join(__dirname, '..', 'uploads', 'disputes');
fs.mkdir(disputeDir, { recursive: true }).catch(() => {});

const disputeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, disputeDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: disputeStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, or documents are allowed.'));
    }
  }
});

// Configure multer for cancellation request attachments
const cancellationDir = path.join(__dirname, '..', 'uploads', 'cancellations');
fs.mkdir(cancellationDir, { recursive: true }).catch(() => {});

const cancellationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cancellationDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const cancellationUpload = multer({
  storage: cancellationStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Images, videos, or documents only.'));
    }
  }
});

// Helper function to get Stripe instance
function getStripeInstance(settings) {
  const isLive = settings?.stripeLiveMode === true;
  const secretKey = isLive ? (settings?.stripeLiveSecretKey || settings?.stripeSecretKey) : (settings?.stripeTestSecretKey || settings?.stripeSecretKey);
  
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

// Helper function to get PayPal client
function getPayPalClient(settings) {
  const isLive = settings?.paypalLiveMode === true;
  
  if (isLive) {
    return new paypal.core.LiveEnvironment(
      settings.paypalLiveClientId || settings.paypalClientId || settings.paypalPublicKey,
      settings.paypalLiveSecretKey || settings.paypalSecretKey
    );
  } else {
    return new paypal.core.SandboxEnvironment(
      settings.paypalSandboxClientId || settings.paypalClientId || settings.paypalPublicKey,
      settings.paypalSandboxSecretKey || settings.paypalSecretKey
    );
  }
}

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Create order
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    
    const { items, address, skipAddress, paymentMethod, paymentMethodId, total, subtotal, discount = 0, serviceFee = 0, promoCode, walletAmount = 0, remainderAmount = 0 } = req.body;

    if (!items || items.length === 0) {
      console.error('[Server] No items provided');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!paymentMethod || !['card', 'paypal', 'account_balance'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only card, paypal, and account_balance are allowed.' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    // Get user first (needed for wallet balance validation)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate wallet and remainder amounts
    const calculatedWalletAmount = Math.min(user.walletBalance || 0, total);
    const calculatedRemainderAmount = Math.max(0, total - (user.walletBalance || 0));
    
    // Validate amounts match
    if (Math.abs(walletAmount - calculatedWalletAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Wallet amount mismatch',
        expected: calculatedWalletAmount,
        received: walletAmount 
      });
    }
    
    if (Math.abs(remainderAmount - calculatedRemainderAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Remainder amount mismatch',
        expected: calculatedRemainderAmount,
        received: remainderAmount 
      });
    }
    
    // Validate wallet balance is sufficient
    if (walletAmount > (user.walletBalance || 0)) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        required: walletAmount,
        current: user.walletBalance || 0 
      });
    }
    
    // If remainder > 0, payment method must be provided
    if (remainderAmount > 0 && !paymentMethodId && paymentMethod === 'card') {
      return res.status(400).json({ error: 'Payment method ID is required for card payments when remainder > 0' });
    }
    
    // If remainder is 0, payment method should be account_balance
    if (remainderAmount === 0 && paymentMethod !== 'account_balance') {
      return res.status(400).json({ error: 'Payment method must be account_balance when remainder is 0' });
    }

    // Get professional from first item (assuming all items are from same professional)
    const firstItem = items[0];
    // Use serviceId if available, otherwise fall back to id (for backward compatibility)
    const firstItemServiceId = firstItem.serviceId || firstItem.id;
    if (!firstItem || !firstItemServiceId) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    // Find professional from service
    // The serviceId might be a numeric string or MongoDB ObjectId
    // Try to find service by ObjectId first, then by slug if it's not a valid ObjectId
    const Service = (await import('../models/Service.js')).default;
    
    let service = null;
    let professionalId = null;
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (firstItemServiceId.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(firstItemServiceId);
    } else {
      // If not a valid ObjectId, try to find by slug
      service = await Service.findOne({ slug: firstItemServiceId });
      
      // If still not found and it's a numeric string, try to find professional by seller name
      if (!service && firstItem.seller) {
        const User = (await import('../models/User.js')).default;
        const professional = await User.findOne({ 
          tradingName: firstItem.seller,
          role: 'professional'
        });
        if (professional) {
          // Use the professional ID directly as fallback
          professionalId = professional._id;
        }
      }
    }
    
    // If service was found, get professional ID from service
    if (service) {
      professionalId = service.professional;
    }
    
    // If we still don't have a professional ID, return error
    if (!professionalId) {
      return res.status(404).json({ 
        error: 'Service not found',
        details: `Could not find service with ID: ${firstItemServiceId} or professional with seller name: ${firstItem.seller}`
      });
    }

    // Get payment settings to retrieve service fee
    const settings = await PaymentSettings.getSettings();
    const serviceFeeAmount = settings.serviceFees || 0;
    const serviceFeeThreshold = settings.serviceFeeThreshold || 0;
    
    // Calculate actual service fee based on threshold
    // If subtotal is equal to or above threshold, service fee is 0
    const actualServiceFee = (serviceFeeThreshold > 0 && subtotal >= serviceFeeThreshold) ? 0 : serviceFeeAmount;

    // Validate service fee if provided
    if (serviceFee !== undefined && serviceFee !== actualServiceFee) {
      return res.status(400).json({ 
        error: 'Service fee mismatch', 
        expected: actualServiceFee,
        received: serviceFee 
      });
    }

    // Handle promo code if provided
    let promoCodeData = null;
    if (promoCode && promoCode.code) {
      const promoCodeDoc = await PromoCode.findOne({ 
        code: promoCode.code.toUpperCase().trim(),
        status: 'active'
      });
      
      if (promoCodeDoc) {
        // Record usage
        await promoCodeDoc.recordUsage(user._id);
        
        promoCodeData = {
          code: promoCodeDoc.code,
          type: promoCodeDoc.type,
          discount: discount,
          discountType: promoCodeDoc.discountType,
        };
      }
    }

    // Recalculate total to include service fee (if not already included)
    const calculatedTotal = subtotal - discount + actualServiceFee;

    // Validate total matches calculated total
    if (Math.abs(total - calculatedTotal) > 0.01) {
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        expected: calculatedTotal,
        received: total,
        breakdown: {
          subtotal,
          discount,
          serviceFee: actualServiceFee,
        }
      });
    }

    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Calculate professional payout amount based on promo code type
    // For Pro promo: professional receives (subtotal - discount)
    // For Admin promo: professional receives full subtotal
    let professionalPayoutAmount = subtotal;
    if (promoCodeData && promoCodeData.type === 'pro') {
      professionalPayoutAmount = subtotal - discount;
    }

    // Handle split payment: wallet first, then payment method
    let walletTransactionId = null;
    let paymentTransactionId = null;
    let newBalance = user.walletBalance || 0;
    const Wallet = (await import('../models/Wallet.js')).default;

    // Step 1: Deduct from wallet if walletAmount > 0
    if (walletAmount > 0) {
      newBalance = (user.walletBalance || 0) - walletAmount;
      user.walletBalance = newBalance;
      await user.save();
      
      // Create wallet transaction record
      const walletTransaction = new Wallet({
        userId: user._id,
        type: 'payment',
        amount: walletAmount,
        balance: newBalance,
        description: `Order payment - ${orderNumber}`,
        status: 'completed',
        paymentMethod: 'wallet',
        orderId: null, // Will be updated after order creation
      });
      await walletTransaction.save();
      walletTransactionId = walletTransaction._id;
    }

    // Step 2: Process remainder payment if remainderAmount > 0
    if (remainderAmount > 0) {
      if (paymentMethod === 'card') {
        if (!paymentMethodId) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(400).json({ error: 'Payment method ID is required for card payments' });
        }

        try {
          const settings = await PaymentSettings.getSettings();
          const stripe = getStripeInstance(settings);

          // Calculate Stripe fees on remainder amount only
          const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
          const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
          const stripeCommission = (remainderAmount * stripeCommissionPercentage / 100) + stripeCommissionFixed;
          const totalChargeAmount = remainderAmount + stripeCommission;

          // Create payment intent for remainder amount
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalChargeAmount * 100),
            currency: 'gbp',
            payment_method: paymentMethodId,
            customer: user.stripeCustomerId,
            confirm: true,
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            metadata: {
              userId: user._id.toString(),
              type: 'order_payment',
              orderNumber,
              walletAmount: walletAmount.toString(),
              remainderAmount: remainderAmount.toString(),
            },
          });

          if (paymentIntent.status !== 'succeeded') {
            // Rollback wallet deduction if card payment fails
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ 
              error: 'Payment failed',
              status: paymentIntent.status,
              requiresAction: paymentIntent.status === 'requires_action',
            });
          }

          paymentTransactionId = paymentIntent.id;
        } catch (error) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(500).json({ error: error.message || 'Failed to process card payment' });
        }
      } else if (paymentMethod === 'paypal') {
        // PayPal payment: Create order first, then return approval URL
        // Order will be in 'pending_payment' status until PayPal payment is captured
        
        // Process items for order creation
        const processedItemsForPaypal = items.map((item, index) => {
          const orderItem = {
            serviceId: item.serviceId || item.id,
            title: item.title,
            seller: item.seller,
            price: item.price,
            image: item.image,
            rating: item.rating,
            quantity: item.quantity,
            addons: item.addons || [],
            packageType: item.packageType,
          };
          
          if (item.booking && (item.booking.date || item.booking.starttime || item.booking.time)) {
            orderItem.booking = {
              date: item.booking.date,
              starttime: item.booking.starttime || item.booking.time || '',
              endtime: item.booking.endtime || item.booking.endTime || item.booking.starttime || item.booking.time || '',
              timeSlot: item.booking.timeSlot || undefined,
            };
          }
          
          return orderItem;
        });

        // Create order with pending_payment status
        const paypalOrder = new Order({
          orderNumber,
          client: user._id,
          professional: professionalId,
          items: processedItemsForPaypal,
          address: address ? {
            postcode: address.postcode,
            address: address.address,
            city: address.city,
            county: address.county,
            phone: address.phone,
          } : undefined,
          skipAddress: skipAddress || false,
          paymentMethod: 'paypal',
          total,
          subtotal,
          discount,
          promoCode: promoCodeData,
          serviceFee: actualServiceFee,
          status: 'Pending Payment',
          deliveryStatus: 'pending',
          paymentStatus: 'pending',
          walletTransactionId,
          metadata: {
            createdAt: new Date(),
            professionalPayoutAmount,
            promoCodeType: promoCodeData?.type || null,
            walletAmount,
            remainderAmount,
            ...(service && firstItem && {
              serviceDescription: service.description || undefined,
              attributes: (() => {
                const pkg = firstItem.packageType && service.packages?.find(p => p.name === firstItem.packageType || p.name?.toUpperCase() === firstItem.packageType?.toUpperCase());
                return (pkg?.features || service.highlights || [])?.filter(Boolean) || undefined;
              })(),
              idealFor: service.idealFor?.length ? service.idealFor : undefined,
              chargePer: firstItem.packageType || service.priceUnit || undefined,
            }),
          },
        });
        
        await paypalOrder.save();
        
        // Update wallet transaction with order ID
        if (walletTransactionId) {
          await Wallet.findByIdAndUpdate(walletTransactionId, { orderId: paypalOrder._id });
        }

        try {
          const settings = await PaymentSettings.getSettings();
          const environment = getPayPalClient(settings);
          const client = new paypal.core.PayPalHttpClient(environment);

          // Calculate PayPal fees on remainder amount only
          const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
          const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
          const paypalCommission = (remainderAmount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
          const totalChargeAmount = remainderAmount + paypalCommission;

          // Create PayPal order for remainder amount
          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
              amount: {
                currency_code: "GBP",
                value: totalChargeAmount.toFixed(2),
              },
              description: `Order Payment - ${orderNumber} - Remainder: £${remainderAmount.toFixed(2)}${walletAmount > 0 ? `, Wallet: £${walletAmount.toFixed(2)}` : ''}`,
              custom_id: orderNumber,
            }],
            application_context: {
              return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
              cancel_url: `${req.headers.origin || 'http://localhost:5000'}/cart`,
              brand_name: "Sortars UK",
              locale: "en-GB",
            },
          });

          const paypalApiOrder = await client.execute(request);

          if (paypalApiOrder.statusCode !== 201) {
            // Rollback: delete order and restore wallet
            await Order.findByIdAndDelete(paypalOrder._id);
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ error: 'Failed to create PayPal order' });
          }

          // Store PayPal order ID in our order
          paypalOrder.paypalOrderId = paypalApiOrder.result.id;
          await paypalOrder.save();

          // Return PayPal approval URL for client to redirect
          const approveUrl = paypalApiOrder.result.links.find(link => link.rel === 'approve')?.href;

          return res.json({
            orderId: orderNumber,
            orderIds: [orderNumber],
            paypalOrderId: paypalApiOrder.result.id,
            approveUrl,
            requiresApproval: true,
            walletAmount,
            remainderAmount,
            newBalance,
            walletTransactionId: walletTransactionId?.toString(),
            message: 'Please approve PayPal payment to complete order',
          });
        } catch (error) {
          // Rollback: delete order and restore wallet
          await Order.findByIdAndDelete(paypalOrder._id);
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
        }
      }
    }

    const processedItems = items.map((item, index) => {
      const orderItem = {
        serviceId: item.serviceId || item.id, // Use serviceId if available, otherwise fall back to id
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons || [],
        packageType: item.packageType,
      };
      
      // Explicitly include booking if it exists
      if (item.booking && (item.booking.date || item.booking.starttime || item.booking.time)) {
        orderItem.booking = {
          date: item.booking.date,
          starttime: item.booking.starttime || item.booking.time || '',
          endtime: item.booking.endtime || item.booking.endTime || item.booking.starttime || item.booking.time || '',
          timeSlot: item.booking.timeSlot || undefined,
        };
      } else {
        console.log(`[Server] Item ${index + 1} has NO booking info`);
      }
      
      return orderItem;
    });
    

    // Get deliveryDays from service package (for online services)
    let deliveryDays = null;
    let scheduledDate = null;
    if (service && firstItem.packageType) {
      // Find the package with matching name/type
      const selectedPackage = service.packages?.find(pkg => 
        pkg.name === firstItem.packageType || 
        pkg.name?.toUpperCase() === firstItem.packageType?.toUpperCase()
      );
      if (selectedPackage && selectedPackage.deliveryDays) {
        deliveryDays = selectedPackage.deliveryDays;
        // Calculate scheduled date from order creation + delivery days
        const createdDate = new Date();
        scheduledDate = new Date(createdDate);
        scheduledDate.setDate(scheduledDate.getDate() + deliveryDays);
        scheduledDate.setHours(23, 59, 59, 999); // Set to end of day
      }
    }

    const isPaidOrder = true; // All orders are paid (wallet + card/paypal)
    const order = new Order({
      orderNumber,
      client: user._id,
      professional: professionalId,
      items: processedItems,
      address: address ? {
        postcode: address.postcode,
        address: address.address,
        city: address.city,
        county: address.county,
        phone: address.phone,
      } : undefined,
      skipAddress: skipAddress || false,
      paymentMethod: walletAmount > 0 && remainderAmount > 0 ? paymentMethod : (walletAmount > 0 ? 'account_balance' : paymentMethod),
      paymentMethodId: remainderAmount > 0 && paymentMethod === 'card' ? paymentMethodId : undefined,
      total,
      subtotal,
      discount,
      promoCode: promoCodeData,
      serviceFee: actualServiceFee,
      status: 'In Progress',
      deliveryStatus: isPaidOrder ? 'active' : 'pending',
      walletTransactionId,
      paymentTransactionId,
      metadata: {
        createdAt: new Date(),
        professionalPayoutAmount, // Store professional payout amount
        promoCodeType: promoCodeData?.type || null,
        deliveryDays: deliveryDays, // Store delivery days for countdown calculation
        onlineDeliveryDays: service?.onlineDeliveryDays || undefined,
        scheduledDate: scheduledDate, // Store calculated delivery deadline
        ...(service && {
          serviceDescription: service.description || undefined,
          attributes: (() => {
            const pkg = firstItem.packageType && service.packages?.find(p => p.name === firstItem.packageType || p.name?.toUpperCase() === firstItem.packageType?.toUpperCase());
            return (pkg?.features || service.highlights || [])?.filter(Boolean) || undefined;
          })(),
          idealFor: service.idealFor?.length ? service.idealFor : undefined,
          chargePer: firstItem.packageType || service.priceUnit || undefined,
        }),
      },
    });
    
    await order.save();
    
    const savedOrder = await Order.findById(order._id);
    // Create Wallet transaction for card payment (so it appears in billing history)
    if (remainderAmount > 0 && paymentMethod === 'card' && paymentTransactionId) {
      const cardPaymentTx = await Wallet.create({
        userId: user._id,
        type: 'payment',
        amount: remainderAmount,
        balance: newBalance,
        status: 'completed',
        paymentMethod: 'card',
        stripePaymentIntentId: paymentTransactionId,
        description: `Order payment - ${orderNumber}`,
        orderId: order._id,
        metadata: { orderNumber },
      });
      paymentTransactionId = cardPaymentTx._id.toString();
    }
    // Update wallet transaction with order ID (for wallet-only or split)
    if (walletTransactionId) {
      await Wallet.findByIdAndUpdate(walletTransactionId, { orderId: order._id });
    }

    // Populate professional and client info for response
    await order.populate([
      { path: 'client', select: 'firstName lastName email phone' },
      { path: 'professional', select: 'firstName lastName tradingName email phone' },
    ]);

    // Notifications + emails (client + professional)
    const professionalUser = await User.findById(professionalId);
    runBackgroundTask(
      () => sendOrderNotifications({
        order,
        clientUser: user,
        professionalUser,
      }),
      'order-created'
    );

    const responseData = {
      orderId: order.orderNumber,
      order: order.toObject(),
      newBalance,
      walletAmount,
      remainderAmount,
      walletTransactionId: walletTransactionId?.toString(),
      paymentTransactionId: paymentTransactionId?.toString(),
      message: 'Order created successfully',
    };
    
    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Create multiple orders at once (one order per item)
router.post('/bulk', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orders: orderRequests, paymentMethod, paymentMethodId, totalAmount, walletAmount = 0, remainderAmount = 0, address, skipAddress, additionalInformation } = req.body;


    if (!orderRequests || orderRequests.length === 0) {
      return res.status(400).json({ error: 'At least one order is required' });
    }

    if (!paymentMethod || !['card', 'paypal', 'account_balance'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only card, paypal, and account_balance are allowed.' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate wallet and remainder amounts
    const calculatedWalletAmount = Math.min(user.walletBalance || 0, totalAmount);
    const calculatedRemainderAmount = Math.max(0, totalAmount - (user.walletBalance || 0));
    
    // Validate amounts match
    if (Math.abs(walletAmount - calculatedWalletAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Wallet amount mismatch',
        expected: calculatedWalletAmount,
        received: walletAmount 
      });
    }
    
    if (Math.abs(remainderAmount - calculatedRemainderAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Remainder amount mismatch',
        expected: calculatedRemainderAmount,
        received: remainderAmount 
      });
    }
    
    // Validate wallet balance is sufficient
    if (walletAmount > (user.walletBalance || 0)) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        required: walletAmount,
        current: user.walletBalance || 0 
      });
    }
    
    // If remainder > 0, payment method must be provided
    if (remainderAmount > 0 && !paymentMethodId && paymentMethod === 'card') {
      return res.status(400).json({ error: 'Payment method ID is required for card payments when remainder > 0' });
    }
    
    // If remainder is 0, payment method should be account_balance
    if (remainderAmount === 0 && paymentMethod !== 'account_balance') {
      return res.status(400).json({ error: 'Payment method must be account_balance when remainder is 0' });
    }

    // Get payment settings
    const settings = await PaymentSettings.getSettings();
    const serviceFeeAmount = settings.serviceFees || 0;
    const serviceFeeThreshold = settings.serviceFeeThreshold || 0;

    // Calculate total from all orders
    let calculatedSubtotal = 0;
    let totalDiscount = 0;
    for (const orderReq of orderRequests) {
      calculatedSubtotal += orderReq.subtotal;
      totalDiscount += (orderReq.discount || 0);
    }
    
    // Calculate actual service fee based on threshold
    // If subtotal is equal to or above threshold, service fee is 0
    const actualServiceFee = (serviceFeeThreshold > 0 && calculatedSubtotal >= serviceFeeThreshold) ? 0 : serviceFeeAmount;
    
    const calculatedTotal = calculatedSubtotal - totalDiscount + actualServiceFee;

    // Validate total (allow small floating point differences)
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      console.error('[Server] Total amount mismatch:', {
        received: totalAmount,
        expected: calculatedTotal,
        subtotal: calculatedSubtotal,
        discount: totalDiscount,
        serviceFee: actualServiceFee,
      });
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        expected: calculatedTotal,
        received: totalAmount,
        breakdown: {
          subtotal: calculatedSubtotal,
          discount: totalDiscount,
          serviceFee: actualServiceFee,
        }
      });
    }

    // Handle split payment: wallet first, then payment method
    let newBalance = user.walletBalance || 0;
    let walletTransactionId = null;
    let paymentTransactionId = null;

    // Step 1: Deduct from wallet if walletAmount > 0
    if (walletAmount > 0) {
      newBalance = (user.walletBalance || 0) - walletAmount;
      user.walletBalance = newBalance;
      await user.save();
      
      // Create wallet transaction record
      const Wallet = (await import('../models/Wallet.js')).default;
      walletTransactionId = (await Wallet.create({
        userId: user._id,
        type: 'payment',
        amount: walletAmount,
        balance: newBalance,
        description: `Order payment (${orderRequests.length} order${orderRequests.length > 1 ? 's' : ''})`,
        status: 'completed',
        paymentMethod: 'wallet',
        orderId: null, // Will be updated after orders are created
      }))._id;
    }

    // Step 2: Process remainder payment if remainderAmount > 0
    if (remainderAmount > 0) {
      if (paymentMethod === 'card') {
        if (!paymentMethodId) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(400).json({ error: 'Payment method ID is required for card payments' });
        }

        try {
          const stripe = getStripeInstance(settings);
          const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
          const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
          const stripeCommission = (remainderAmount * stripeCommissionPercentage / 100) + stripeCommissionFixed;
          const totalChargeAmount = remainderAmount + stripeCommission;

          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalChargeAmount * 100),
            currency: 'gbp',
            payment_method: paymentMethodId,
            customer: user.stripeCustomerId,
            confirm: true,
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            metadata: {
              userId: user._id.toString(),
              type: 'bulk_order_payment',
              orderCount: orderRequests.length.toString(),
              walletAmount: walletAmount.toString(),
              remainderAmount: remainderAmount.toString(),
            },
          });

          if (paymentIntent.status !== 'succeeded') {
            // Rollback wallet deduction if card payment fails
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ 
              error: 'Payment failed',
              status: paymentIntent.status,
            });
          }

          paymentTransactionId = paymentIntent.id;
        } catch (error) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          console.error('[Server] Card payment error:', error);
          return res.status(500).json({ error: error.message || 'Failed to process card payment' });
        }
      } else if (paymentMethod === 'paypal') {
        // For PayPal bulk orders, create orders first with pending status, then return approval URL
        const Service = (await import('../models/Service.js')).default;
        const createdPendingOrders = [];
        const orderNumbers = [];
        const bulkOrderId = `BULK-${Date.now()}`;

        // Create all orders with pending payment status
        for (const orderReq of orderRequests) {
          const { item, booking, subtotal, discount = 0, additionalInformation: orderAdditionalInfo } = orderReq;

          // Find service and professional
          const serviceId = item.serviceId || item.id;
          let service = null;
          let professionalId = null;

          if (serviceId.match(/^[0-9a-fA-F]{24}$/)) {
            service = await Service.findById(serviceId);
          } else {
            service = await Service.findOne({ slug: serviceId });
          }

          if (service) {
            professionalId = service.professional;
          } else if (item.seller) {
            const professional = await User.findOne({ 
              tradingName: item.seller,
              role: 'professional'
            });
            if (professional) {
              professionalId = professional._id;
            }
          }

          if (!professionalId) {
            console.error(`[Server] Could not find professional for service: ${serviceId}`);
            continue;
          }

          const orderNumber = generateOrderNumber();
          orderNumbers.push(orderNumber);

          // Create order item with booking
          const processedItem = {
            serviceId: serviceId,
            title: item.title,
            seller: item.seller,
            price: item.price,
            image: item.image,
            rating: item.rating,
            quantity: item.quantity,
            addons: item.addons || [],
            packageType: item.packageType,
          };

          if (booking && booking.date) {
            processedItem.booking = {
              date: booking.date,
              starttime: booking.starttime || booking.time || '',
              endtime: booking.endtime || booking.endTime || booking.starttime || booking.time || '',
              timeSlot: booking.timeSlot || '',
            };
          }

          const orderTotal = subtotal - discount;

          // Prepare additional information
          const infoToUse = orderAdditionalInfo || additionalInformation;
          let additionalInfo = undefined;
          if (infoToUse && (infoToUse.message?.trim() || (infoToUse.files && infoToUse.files.length > 0))) {
            const additionalFiles = [];
            if (infoToUse.files && Array.isArray(infoToUse.files)) {
              for (const file of infoToUse.files) {
                let fileType = file.fileType;
                if (!fileType || !['image', 'video', 'document'].includes(fileType)) {
                  if (file.url && (file.url.includes('.jpg') || file.url.includes('.jpeg') || file.url.includes('.png') || file.url.includes('.gif') || file.url.includes('.webp'))) {
                    fileType = 'image';
                  } else if (file.url && (file.url.includes('.mp4') || file.url.includes('.webm') || file.url.includes('.mov') || file.url.includes('.avi'))) {
                    fileType = 'video';
                  } else {
                    fileType = 'document';
                  }
                }
                additionalFiles.push({
                  url: file.url,
                  fileName: file.fileName,
                  fileType: fileType,
                  uploadedAt: new Date(),
                });
              }
            }
            additionalInfo = {
              message: infoToUse.message?.trim() || '',
              files: additionalFiles,
              submittedAt: new Date(),
            };
          }

          const pendingOrder = new Order({
            orderNumber,
            client: user._id,
            professional: professionalId,
            items: [processedItem],
            address: address ? {
              postcode: address.postcode,
              address: address.address,
              city: address.city,
              county: address.county,
              phone: address.phone,
            } : undefined,
            skipAddress: skipAddress || false,
            paymentMethod: 'paypal',
            total: orderTotal,
            subtotal,
            discount,
            serviceFee: createdPendingOrders.length === 0 ? actualServiceFee : 0, // Service fee applied to first order only
            status: 'Pending Payment',
            deliveryStatus: 'pending',
            paymentStatus: 'pending',
            walletTransactionId,
            additionalInformation: additionalInfo,
            metadata: {
              createdAt: new Date(),
              bulkOrderId,
              professionalPayoutAmount: subtotal - discount,
              walletAmount,
              remainderAmount,
              onlineDeliveryDays: service?.onlineDeliveryDays || undefined,
            },
          });

          await pendingOrder.save();
          
          // Update wallet transaction with order ID (for first order)
          if (walletTransactionId && createdPendingOrders.length === 0) {
            await Wallet.findByIdAndUpdate(walletTransactionId, { orderId: pendingOrder._id });
          }
          
          createdPendingOrders.push(pendingOrder);
        }

        if (createdPendingOrders.length === 0) {
          // Rollback wallet if no orders created
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(400).json({ error: 'Failed to create any orders' });
        }

        // Now create PayPal order
        try {
          const environment = getPayPalClient(settings);
          const client = new paypal.core.PayPalHttpClient(environment);

          const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
          const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
          const paypalCommission = (remainderAmount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
          const totalChargeAmount = remainderAmount + paypalCommission;

          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
              amount: {
                currency_code: "GBP",
                value: totalChargeAmount.toFixed(2),
              },
              description: `Bulk Order Payment (${createdPendingOrders.length} orders) - Remainder: £${remainderAmount.toFixed(2)}${walletAmount > 0 ? `, Wallet: £${walletAmount.toFixed(2)}` : ''}`,
              custom_id: orderNumbers.join(','), // Store all order numbers for capture
            }],
            application_context: {
              return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
              cancel_url: `${req.headers.origin || 'http://localhost:5000'}/cart`,
              brand_name: "Sortars UK",
              locale: "en-GB",
            },
          });

          const paypalApiOrder = await client.execute(request);

          if (paypalApiOrder.statusCode !== 201) {
            // Rollback: delete orders and restore wallet
            for (const order of createdPendingOrders) {
              await Order.findByIdAndDelete(order._id);
            }
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ error: 'Failed to create PayPal order' });
          }

          // Update all orders with PayPal order ID
          for (const order of createdPendingOrders) {
            order.paypalOrderId = paypalApiOrder.result.id;
            await order.save();
          }

          const approveUrl = paypalApiOrder.result.links.find(link => link.rel === 'approve')?.href;

          return res.json({
            orderIds: orderNumbers,
            paypalOrderId: paypalApiOrder.result.id,
            approveUrl,
            requiresApproval: true,
            walletAmount,
            remainderAmount,
            newBalance,
            walletTransactionId: walletTransactionId?.toString(),
            message: 'Please approve PayPal payment to complete orders',
          });
        } catch (error) {
          // Rollback: delete orders and restore wallet
          for (const order of createdPendingOrders) {
            await Order.findByIdAndDelete(order._id);
          }
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          console.error('[Server] PayPal order creation error:', error);
          return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
        }
      }
    }

    // Create orders (for non-PayPal payments)
    const Service = (await import('../models/Service.js')).default;
    const createdOrders = [];

    for (const orderReq of orderRequests) {
      const { item, booking, subtotal, discount = 0, additionalInformation: orderAdditionalInfo } = orderReq;

      // Find service and professional
      const serviceId = item.serviceId || item.id;
      let service = null;
      let professionalId = null;

      if (serviceId.match(/^[0-9a-fA-F]{24}$/)) {
        service = await Service.findById(serviceId);
      } else {
        service = await Service.findOne({ slug: serviceId });
      }

      if (service) {
        professionalId = service.professional;
      } else if (item.seller) {
        const professional = await User.findOne({ 
          tradingName: item.seller,
          role: 'professional'
        });
        if (professional) {
          professionalId = professional._id;
        }
      }

      if (!professionalId) {
        console.error(`[Server] Could not find professional for service: ${serviceId}`);
        continue; // Skip this order
      }

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order item with booking
      const processedItem = {
        serviceId: serviceId,
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons || [],
        packageType: item.packageType,
      };

      if (booking && booking.date) {
        processedItem.booking = {
          date: booking.date,
          starttime: booking.starttime || booking.time || '',
          endtime: booking.endtime || booking.endTime || booking.starttime || booking.time || '',
          timeSlot: booking.timeSlot || '',
        };
      }

      // Calculate order total (item subtotal - discount, no service fee per order)
      const orderTotal = subtotal - discount;

      const isPaidOrder = true; // All orders are paid (wallet + card/paypal)
      
      // Prepare additional information - use per-order info if available, otherwise fall back to global
      const infoToUse = orderAdditionalInfo || additionalInformation;
      let additionalInfo = undefined;
      if (infoToUse && (infoToUse.message?.trim() || (infoToUse.files && infoToUse.files.length > 0))) {
        const additionalFiles = [];
        if (infoToUse.files && Array.isArray(infoToUse.files)) {
          for (const file of infoToUse.files) {
            // Ensure fileType is one of the allowed values
            let fileType = file.fileType;
            if (!fileType || !['image', 'video', 'document'].includes(fileType)) {
              // Try to determine from URL or default to document
              if (file.url && (file.url.includes('.jpg') || file.url.includes('.jpeg') || file.url.includes('.png') || file.url.includes('.gif') || file.url.includes('.webp'))) {
                fileType = 'image';
              } else if (file.url && (file.url.includes('.mp4') || file.url.includes('.webm') || file.url.includes('.mov') || file.url.includes('.avi'))) {
                fileType = 'video';
              } else {
                fileType = 'document';
              }
            }
            
            additionalFiles.push({
              url: file.url,
              fileName: file.fileName,
              fileType: fileType,
              uploadedAt: new Date(),
            });
          }
        }
        
        additionalInfo = {
          message: infoToUse.message?.trim() || '',
          files: additionalFiles,
          submittedAt: new Date(),
        };
      }
      
      const order = new Order({
        orderNumber,
        client: user._id,
        professional: professionalId,
        items: [processedItem],
        address: address ? {
          postcode: address.postcode,
          address: address.address,
          city: address.city,
          county: address.county,
          phone: address.phone,
        } : undefined,
        skipAddress: skipAddress || false,
        paymentMethod: walletAmount > 0 && remainderAmount > 0 ? paymentMethod : (walletAmount > 0 ? 'account_balance' : paymentMethod),
        total: orderTotal,
        subtotal,
        discount,
        serviceFee: createdOrders.length === 0 ? actualServiceFee : 0, // Service fee applied to first order only
        status: 'In Progress',
        deliveryStatus: 'active', // All orders are paid (wallet + card/paypal)
        additionalInformation: additionalInfo,
        metadata: {
          createdAt: new Date(),
          bulkOrderId: `BULK-${Date.now()}`,
          professionalPayoutAmount: subtotal - discount,
          onlineDeliveryDays: service?.onlineDeliveryDays || undefined,
        },
      });

      await order.save();

      // Populate for response
      await order.populate([
        { path: 'client', select: 'firstName lastName email phone' },
        { path: 'professional', select: 'firstName lastName tradingName email phone' },
      ]);

      const professionalUser = await User.findById(professionalId);
      runBackgroundTask(
        () => sendOrderNotifications({
          order,
          clientUser: user,
          professionalUser,
        }),
        'order-created-bulk'
      );

      createdOrders.push(order.toObject());
    }

    // Create Wallet transaction for card payment (so it appears in billing history)
    if (remainderAmount > 0 && paymentMethod === 'card' && paymentTransactionId && createdOrders.length > 0) {
      const firstOrderId = createdOrders[0]._id;
      const cardPaymentTx = await Wallet.create({
        userId: user._id,
        type: 'payment',
        amount: remainderAmount,
        balance: newBalance,
        status: 'completed',
        paymentMethod: 'card',
        stripePaymentIntentId: paymentTransactionId,
        description: `Order payment (${createdOrders.length} order${createdOrders.length > 1 ? 's' : ''})`,
        orderId: firstOrderId,
        metadata: { bulkOrderCount: createdOrders.length, orderNumbers: createdOrders.map(o => o.orderNumber) },
      });
      paymentTransactionId = cardPaymentTx._id.toString();
    }

    // Update wallet transaction with first order ID (for wallet-only or split payments)
    if (walletTransactionId && createdOrders.length > 0) {
      await Wallet.findByIdAndUpdate(walletTransactionId, { orderId: createdOrders[0]._id });
    }

    return res.json({
      orders: createdOrders,
      orderIds: createdOrders.map(o => o.orderNumber),
      newBalance,
      walletAmount,
      remainderAmount,
      walletTransactionId: walletTransactionId?.toString(),
      paymentTransactionId: paymentTransactionId?.toString(),
      newBalance,
      message: `Successfully created ${createdOrders.length} order(s)`,
    });
  } catch (error) {
    console.error('[Server] Bulk order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create orders' });
  }
});

// Capture PayPal payment for order (called after user approves PayPal payment)
router.post('/paypal/capture', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { paypalOrderId, orderNumber } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({ error: 'PayPal order ID is required' });
    }

    // Get settings first to set up PayPal client
    const settings = await PaymentSettings.getSettings();
    const environment = getPayPalClient(settings);
    const client = new paypal.core.PayPalHttpClient(environment);

    // First, find orders by PayPal order ID (stored during order creation)
    let orders = await Order.find({ 
      paypalOrderId: paypalOrderId,
      client: req.user.id
    });

    // If not found by paypalOrderId, try to get from custom_id after capture
    if (orders.length === 0) {
      // We need to capture first to get the custom_id
      const captureRequest = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      captureRequest.requestBody({});

      const capture = await client.execute(captureRequest);

      if (capture.statusCode !== 201) {
        return res.status(400).json({ error: 'Failed to capture PayPal payment' });
      }

      const customId = capture.result.purchase_units[0].custom_id;
      const extractedOrderNumber = orderNumber || customId;

      if (!extractedOrderNumber) {
        return res.status(400).json({ error: 'Could not determine order number from PayPal payment' });
      }

      // Find order(s) - could be single order or multiple orders (comma-separated)
      const orderNumbers = extractedOrderNumber.includes(',') 
        ? extractedOrderNumber.split(',').map(n => n.trim())
        : [extractedOrderNumber];
      
      orders = await Order.find({ 
        orderNumber: { $in: orderNumbers },
        client: req.user.id
      });

      if (orders.length === 0) {
        return res.status(404).json({ error: 'Order(s) not found' });
      }

      const captureId = capture.result.purchase_units[0].payments.captures[0].id;
      const captureAmount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount?.value || 0);

      // Get user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update all orders - activate them since payment is complete
      for (const order of orders) {
        order.status = 'In Progress';
        order.deliveryStatus = 'active';
        order.paymentStatus = 'completed';
        order.paypalCaptureId = captureId;
        await order.save();
        const professionalUser = await User.findById(order.professional);
        runBackgroundTask(
          () => sendOrderNotifications({
            order,
            clientUser: user,
            professionalUser,
          }),
          'order-created-paypal'
        );
      }

      // Create Wallet transaction for billing history
      if (captureAmount > 0 && orders.length > 0) {
        await Wallet.create({
          userId: user._id,
          type: 'payment',
          amount: captureAmount,
          balance: user.walletBalance || 0,
          status: 'completed',
          paymentMethod: 'paypal',
          paypalOrderId: paypalOrderId,
          paypalCaptureId: captureId,
          description: `Order payment (${orders.length} order${orders.length > 1 ? 's' : ''})`,
          orderId: orders[0]._id,
          metadata: { orderCount: orders.length, orderNumbers: orders.map(o => o.orderNumber) },
        });
      }

      return res.json({
        orderId: orderNumbers[0],
        orderIds: orderNumbers,
        newBalance: user.walletBalance || 0,
        message: 'PayPal payment captured and order(s) completed',
      });
    }

    // Orders found by paypalOrderId - capture and update
    // Check if already captured (to prevent double capture)
    const firstOrder = orders[0];
    if (firstOrder.paymentStatus === 'completed') {
      // Already captured, just return success
      const user = await User.findById(req.user.id);
      return res.json({
        orderId: firstOrder.orderNumber,
        orderIds: orders.map(o => o.orderNumber),
        newBalance: user?.walletBalance || 0,
        message: 'Payment already captured',
      });
    }

    // Capture PayPal payment
    const captureRequest = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    captureRequest.requestBody({});

    const capture = await client.execute(captureRequest);

    if (capture.statusCode !== 201) {
      return res.status(400).json({ error: 'Failed to capture PayPal payment' });
    }

    const captureId = capture.result.purchase_units[0].payments.captures[0].id;
    const captureAmount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount?.value || 0);

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update all orders - activate them since payment is complete
    for (const order of orders) {
      order.status = 'In Progress';
      order.deliveryStatus = 'active';
      order.paymentStatus = 'completed';
      order.paypalCaptureId = captureId;
      await order.save();
      const professionalUser = await User.findById(order.professional);
      runBackgroundTask(
        () => sendOrderNotifications({
          order,
          clientUser: user,
          professionalUser,
        }),
        'order-created-paypal-capture'
      );
    }

    // Create Wallet transaction for billing history
    if (captureAmount > 0 && orders.length > 0) {
      await Wallet.create({
        userId: user._id,
        type: 'payment',
        amount: captureAmount,
        balance: user.walletBalance || 0,
        status: 'completed',
        paymentMethod: 'paypal',
        paypalOrderId: paypalOrderId,
        paypalCaptureId: captureId,
        description: `Order payment (${orders.length} order${orders.length > 1 ? 's' : ''})`,
        orderId: orders[0]._id,
        metadata: { orderCount: orders.length, orderNumbers: orders.map(o => o.orderNumber) },
      });
    }

    return res.json({
      orderId: orders[0].orderNumber,
      orderIds: orders.map(o => o.orderNumber),
      newBalance: user.walletBalance || 0,
      message: 'PayPal payment captured and order(s) completed',
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
  }
});

// Get user's orders
router.get('/', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter orders based on user role
    if (userRole === 'client') {
      query = { client: req.user.id };
    } else if (userRole === 'professional') {
      query = { professional: req.user.id };
    }

    // Get orders with populated data
    const orders = await Order.find(query)
      .populate([
        { path: 'client', select: 'firstName lastName email phone avatar' },
        { path: 'professional', select: 'firstName lastName tradingName email phone avatar' },
      ])
      .sort({ createdAt: -1 })
      .lean();

    // Fetch reviews for all orders (may be multiple per order when order has multiple services)
    const orderIds = orders.map(o => o._id);
    const reviews = await Review.find({ order: { $in: orderIds } })
      .populate('reviewer', 'firstName lastName tradingName avatar')
      .populate('responseBy', 'firstName lastName tradingName avatar')
      .lean();

    // Map orderId -> review: prefer the review for the order's primary service (first item)
    const reviewMap = {};
    orders.forEach(order => {
      const primaryServiceId = order.items?.[0]?.serviceId?.toString?.();
      const match = reviews.find(
        r => r.order.toString() === order._id.toString() &&
          (!primaryServiceId ? !r.service : r.service && r.service.toString() === primaryServiceId)
      );
      if (match) reviewMap[order._id.toString()] = match;
    });
    reviews.forEach(review => {
      const oid = review.order.toString();
      if (!reviewMap[oid]) reviewMap[oid] = review;
    });

    // Fetch disputes for all orders
    const disputes = await Dispute.find({ order: { $in: orderIds } })
      .populate('claimantId', 'firstName lastName tradingName avatar')
      .populate('respondentId', 'firstName lastName tradingName avatar')
      .lean();
    
    // Create a map of orderId to dispute
    const disputeMap = {};
    disputes.forEach(dispute => {
      disputeMap[dispute.order.toString()] = dispute;
    });

    // Transform orders to match frontend format
    const transformedOrders = orders.map(order => {
      const review = reviewMap[order._id.toString()];
      const dispute = disputeMap[order._id.toString()];
      const client = order.client;
      const professional = order.professional;
      
      // Determine service name from first item
      const serviceName = order.items?.[0]?.title || 'Service Order';
      
      // Amount: client sees total WITH service fee; professional sees total WITHOUT service fee
      const totalWithServiceFee = (order.subtotal || 0) - (order.discount || 0) + (order.serviceFee || 0);
      const totalWithoutServiceFee = (order.subtotal || 0) - (order.discount || 0);
      const displayTotal = userRole === 'professional' ? totalWithoutServiceFee : totalWithServiceFee;
      const amount = `£${displayTotal.toFixed(2)}`;
      
      // Map status
      let status = order.status || 'In Progress';
      if (status === 'pending') status = 'In Progress';
      if (status === 'in_progress' || status === 'In Progress') status = 'In Progress';
      if (status === 'delivered' || status === 'Delivered') status = 'delivered';
      if (status === 'completed' || status === 'Completed') status = 'Completed';
      if (status === 'cancelled' || status === 'Cancelled') status = 'Cancelled';
      if (status === 'Cancellation Pending' || status === 'cancellation_pending') status = 'Cancellation Pending';
      if (status === 'rejected' || status === 'Rejected') status = 'Cancelled';
      if (status === 'disputed') status = 'disputed';
      if (status === 'offer created') status = 'offer created';

      // Ensure closed disputes are reflected in order status
      if (dispute && dispute.status === 'closed') {
        const winnerIdRaw = dispute.winnerId?._id || dispute.winnerId;
        const winnerId = winnerIdRaw ? winnerIdRaw.toString() : null;
        const clientId = client?._id?.toString() || client?.toString();
        const professionalId = professional?._id?.toString() || professional?.toString();
        if (winnerId && professionalId && winnerId === professionalId) {
          status = 'Completed';
        } else if (winnerId && clientId && winnerId === clientId) {
          status = 'Completed';
        }
      }
      
      // Map delivery status
      let deliveryStatus = order.deliveryStatus || 'active';
      if (deliveryStatus === 'pending') deliveryStatus = 'pending';
      if (deliveryStatus === 'active') deliveryStatus = 'active';
      if (deliveryStatus === 'delivered') deliveryStatus = 'delivered';
      if (deliveryStatus === 'completed') deliveryStatus = 'completed';
      if (deliveryStatus === 'cancelled') deliveryStatus = 'cancelled';
      if (deliveryStatus === 'dispute') deliveryStatus = 'dispute';
      if (dispute && dispute.status === 'closed') {
        const winnerIdRaw = dispute.winnerId?._id || dispute.winnerId;
        const winnerId = winnerIdRaw ? winnerIdRaw.toString() : null;
        const clientId = client?._id?.toString() || client?.toString();
        const professionalId = professional?._id?.toString() || professional?.toString();
        if (winnerId && professionalId && winnerId === professionalId) {
          deliveryStatus = 'completed';
        } else if (winnerId && clientId && winnerId === clientId) {
          deliveryStatus = 'completed';
        }
      }
      
      // Format dates
      const date = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate).toISOString().split('T')[0] : undefined;
      const completedDate = order.completedDate ? new Date(order.completedDate).toISOString() : undefined;
      const deliveredDate = order.deliveredDate ? new Date(order.deliveredDate).toISOString() : undefined;
      
      // Get booking info from first item
      const booking = order.items?.[0]?.booking;
      
      // Transform address
      const address = order.address ? {
        name: `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Client',
        addressLine1: order.address.address || '',
        addressLine2: '',
        city: order.address.city || '',
        postcode: order.address.postcode || '',
        phone: order.address.phone || client?.phone || '',
      } : undefined;

      return {
        id: order.orderNumber || order._id.toString(),
        items: order.items.map(item => ({
          id: item.serviceId,
          title: item.title,
          seller: item.seller || professional?.tradingName || 'Professional',
          price: item.price,
          image: item.image || '',
          rating: item.rating,
          quantity: item.quantity,
          addons: item.addons || [],
          booking: item.booking,
          packageType: item.packageType,
        })),
        service: serviceName,
        date,
        status,
        amount,
        amountValue: displayTotal,
        professional: professional?.tradingName || 'Professional',
        professionalId: professional?._id ? professional._id.toString() : undefined,
        clientId: client?._id ? client._id.toString() : undefined,
        professionalAvatar: professional?.avatar || '',
        professionalPhone: professional?.phone || '',
        professionalEmail: professional?.email || '',
        client: userRole === 'professional' ? (client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : 'Client') : undefined,
        clientAvatar: userRole === 'professional' ? (client?.avatar || '') : undefined,
        clientPhone: userRole === 'professional' ? (client?.phone || '') : undefined,
        clientEmail: userRole === 'professional' ? (client?.email || '') : undefined,
        address,
        description: order.items?.[0]?.title || 'Service Order',
        scheduledDate: order.metadata?.scheduledDate || scheduledDate,
        completedDate,
        deliveredDate,
        rating: order.rating || null,
        metadata: {
          fromCustomOffer: order.metadata?.fromCustomOffer,
          deliveryDays: order.metadata?.deliveryDays,
          onlineDeliveryDays: order.metadata?.onlineDeliveryDays,
          scheduledDate: order.metadata?.scheduledDate,
          customOfferId: order.metadata?.customOfferId?.toString?.() || order.metadata?.customOfferId,
          customOfferStatus: order.metadata?.customOfferStatus,
          customOfferRejectedAt: order.metadata?.customOfferRejectedAt,
          customOfferRejectedBy: order.metadata?.customOfferRejectedBy,
          sourceServiceId: order.metadata?.sourceServiceId || undefined,
          responseDeadline: order.metadata?.responseDeadline,
          paymentType: order.metadata?.paymentType || undefined,
          milestones: order.metadata?.milestones || undefined,
          milestoneDeliveries: order.metadata?.milestoneDeliveries || undefined,
          disputeResolvedMilestoneIndices: order.metadata?.disputeResolvedMilestoneIndices || undefined,
          serviceDescription: order.metadata?.serviceDescription || undefined,
          attributes: order.metadata?.attributes || undefined,
          idealFor: order.metadata?.idealFor || undefined,
          promoCode: order.metadata?.promoCode || order.promoCode?.code || undefined,
          promoCodeType: order.metadata?.promoCodeType || order.promoCode?.type || undefined,
          chargePer: order.metadata?.chargePer || undefined,
        },
        review: order.review || undefined,
        professionalResponse: order.professionalResponse || undefined,
        professionalResponseDate: order.professionalResponseDate ? new Date(order.professionalResponseDate).toISOString() : undefined,
        professionalReview: order.metadata?.buyerReview ? {
          rating: order.metadata.buyerReview.rating,
          comment: order.metadata.buyerReview.comment || undefined,
          reviewedAt: order.metadata.buyerReview.reviewedAt ? new Date(order.metadata.buyerReview.reviewedAt).toISOString() : undefined,
        } : undefined,
        deliveryStatus,
        booking,
        disputeId: order.disputeId || dispute?.disputeId || undefined,
        expectedDelivery: (order.metadata?.expectedDelivery ? new Date(order.metadata.expectedDelivery).toISOString() : null) || (order.extensionRequest?.status === 'approved' && order.extensionRequest?.newDeliveryDate ? new Date(order.extensionRequest.newDeliveryDate).toISOString() : null) || (order.expectedDelivery ? new Date(order.expectedDelivery).toISOString() : undefined),
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        serviceFee: order.serviceFee || 0,
        extensionRequest: order.extensionRequest ? {
          status: order.extensionRequest.status,
          requestedDate: order.extensionRequest.requestedDate ? new Date(order.extensionRequest.requestedDate).toISOString() : undefined,
          newDeliveryDate: order.extensionRequest.newDeliveryDate ? new Date(order.extensionRequest.newDeliveryDate).toISOString() : undefined,
          reason: order.extensionRequest.reason,
          requestedAt: order.extensionRequest.requestedAt ? new Date(order.extensionRequest.requestedAt).toISOString() : undefined,
          respondedAt: order.extensionRequest.respondedAt ? new Date(order.extensionRequest.respondedAt).toISOString() : undefined,
        } : undefined,
        deliveryFiles: order.deliveryFiles ? order.deliveryFiles.map(file => ({
          url: file.url,
          fileName: file.fileName,
          fileType: file.fileType,
          uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
          deliveryNumber: file.deliveryNumber || 1,
          milestoneIndex: file.milestoneIndex != null ? file.milestoneIndex : undefined,
        })) : [],
        deliveryMessage: order.deliveryMessage || undefined,
        cancellationRequest: order.cancellationRequest ? {
          status: order.cancellationRequest.status,
          requestedBy: order.cancellationRequest.requestedBy ? order.cancellationRequest.requestedBy.toString() : undefined,
          reason: order.cancellationRequest.reason,
          files: order.cancellationRequest.files ? order.cancellationRequest.files.map(f => ({
            url: f.url,
            fileName: f.fileName,
            fileType: f.fileType,
            uploadedAt: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : undefined,
          })) : [],
          requestedAt: order.cancellationRequest.requestedAt ? new Date(order.cancellationRequest.requestedAt).toISOString() : undefined,
          responseDeadline: order.cancellationRequest.responseDeadline ? new Date(order.cancellationRequest.responseDeadline).toISOString() : undefined,
          respondedAt: order.cancellationRequest.respondedAt ? new Date(order.cancellationRequest.respondedAt).toISOString() : undefined,
          respondedBy: order.cancellationRequest.respondedBy ? order.cancellationRequest.respondedBy.toString() : undefined,
        } : undefined,
        acceptedByProfessional: order.acceptedByProfessional || false,
        acceptedAt: order.acceptedAt ? new Date(order.acceptedAt).toISOString() : undefined,
        rejectedAt: order.rejectedAt ? new Date(order.rejectedAt).toISOString() : undefined,
        rejectionReason: order.rejectionReason || undefined,
        revisionRequest: order.revisionRequest && Array.isArray(order.revisionRequest) && order.revisionRequest.length > 0
          ? order.revisionRequest.map(rr => ({
              index: rr.index || 0,
              status: rr.status,
              reason: rr.reason || undefined,
              clientMessage: rr.clientMessage || undefined,
              clientFiles: rr.clientFiles ? rr.clientFiles.map(file => ({
                url: file.url,
                fileName: file.fileName,
                fileType: file.fileType,
                uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
              })) : [],
              requestedAt: rr.requestedAt ? new Date(rr.requestedAt).toISOString() : undefined,
              respondedAt: rr.respondedAt ? new Date(rr.respondedAt).toISOString() : undefined,
              additionalNotes: rr.additionalNotes || undefined,
            }))
          : (order.revisionRequest && !Array.isArray(order.revisionRequest)
            ? [{
                index: 1,
                status: order.revisionRequest.status,
                reason: order.revisionRequest.reason || undefined,
                clientMessage: order.revisionRequest.clientMessage || undefined,
                clientFiles: order.revisionRequest.clientFiles ? order.revisionRequest.clientFiles.map(file => ({
                  url: file.url,
                  fileName: file.fileName,
                  fileType: file.fileType,
                  uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
                })) : [],
                requestedAt: order.revisionRequest.requestedAt ? new Date(order.revisionRequest.requestedAt).toISOString() : undefined,
                respondedAt: order.revisionRequest.respondedAt ? new Date(order.revisionRequest.respondedAt).toISOString() : undefined,
                additionalNotes: order.revisionRequest.additionalNotes || undefined,
              }]
            : undefined),
        additionalInformation: order.additionalInformation ? {
          message: order.additionalInformation.message || '',
          files: order.additionalInformation.files ? order.additionalInformation.files.map(file => ({
            url: file.url,
            fileName: file.fileName,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
          })) : [],
          submittedAt: order.additionalInformation.submittedAt ? new Date(order.additionalInformation.submittedAt).toISOString() : undefined,
        } : undefined,
        metadata: order.metadata || {},
        // Refundable amount (subtotal - discount); dispute max is this, service fee is not refundable
        refundableAmount: totalWithoutServiceFee,
        disputeInfo: dispute ? {
          id: dispute.disputeId || undefined,
          status: dispute.status,
          amount: totalWithoutServiceFee,
          requirements: dispute.requirements || undefined,
          unmetRequirements: dispute.unmetRequirements || undefined,
          evidenceFiles: dispute.evidenceFiles || [],
          claimantId: dispute.claimantId ? (dispute.claimantId._id || dispute.claimantId).toString() : undefined,
          respondentId: dispute.respondentId ? (dispute.respondentId._id || dispute.respondentId).toString() : undefined,
          claimantName: dispute.claimantId ? (
            dispute.claimantId._id ? (
              dispute.claimantId._id.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                dispute.claimantId.tradingName || 'Professional'
            ) : (
              dispute.claimantId.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                professional?.tradingName || 'Professional'
            )
          ) : undefined,
          respondentName: dispute.respondentId ? (
            dispute.respondentId._id ? (
              dispute.respondentId._id.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                dispute.respondentId.tradingName || 'Professional'
            ) : (
              dispute.respondentId.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                professional?.tradingName || 'Professional'
            )
          ) : undefined,
          claimantAvatar: dispute.claimantId ? (
            dispute.claimantId._id ? dispute.claimantId.avatar || '' : 
            (dispute.claimantId.toString() === client?._id?.toString() ? client.avatar || '' : professional?.avatar || '')
          ) : undefined,
          respondentAvatar: dispute.respondentId ? (
            dispute.respondentId._id ? dispute.respondentId.avatar || '' : 
            (dispute.respondentId.toString() === client?._id?.toString() ? client.avatar || '' : professional?.avatar || '')
          ) : undefined,
          messages: dispute.messages ? dispute.messages.map(msg => ({
            id: msg.id,
            userId: msg.userId.toString(),
            userName: msg.userName,
            userAvatar: msg.userAvatar,
            message: msg.message,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined,
            isTeamResponse: msg.isTeamResponse || false,
            attachments: msg.attachments ? msg.attachments.map((att) => ({
              url: att.url,
              fileName: att.fileName,
              fileType: att.fileType,
            })) : [],
          })) : [],
          clientOffer: dispute.offers?.clientOffer !== null && dispute.offers?.clientOffer !== undefined ? dispute.offers.clientOffer : undefined,
          professionalOffer: dispute.offers?.professionalOffer !== null && dispute.offers?.professionalOffer !== undefined ? dispute.offers.professionalOffer : undefined,
          responseDeadline: dispute.responseDeadline ? new Date(dispute.responseDeadline).toISOString() : undefined,
          respondedAt: dispute.respondedAt ? new Date(dispute.respondedAt).toISOString() : undefined,
          negotiationDeadline: dispute.negotiationDeadline ? new Date(dispute.negotiationDeadline).toISOString() : undefined,
          arbitrationRequested: dispute.arbitrationRequested || false,
          arbitrationRequestedBy: dispute.arbitrationRequestedBy ? dispute.arbitrationRequestedBy.toString() : undefined,
          arbitrationRequestedAt: dispute.arbitrationRequestedAt ? new Date(dispute.arbitrationRequestedAt).toISOString() : undefined,
          arbitrationFeeAmount: dispute.arbitrationFeeAmount || undefined,
          arbitrationFeeDeadline: dispute.arbitrationFeeDeadline ? new Date(dispute.arbitrationFeeDeadline).toISOString() : undefined,
          arbitrationPayments: dispute.arbitrationPayments ? dispute.arbitrationPayments.map((p) => ({
            userId: p.userId?.toString(),
            amount: p.amount,
            paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : undefined,
            paymentMethod: p.paymentMethod,
          })) : [],
          createdAt: dispute.createdAt ? new Date(dispute.createdAt).toISOString() : undefined,
          closedAt: dispute.closedAt ? new Date(dispute.closedAt).toISOString() : undefined,
          acceptedBy: dispute.acceptedBy ? dispute.acceptedBy.toString() : undefined,
          acceptedByRole: dispute.acceptedByRole || undefined,
          acceptedAt: dispute.acceptedAt ? new Date(dispute.acceptedAt).toISOString() : undefined,
          winnerId: dispute.winnerId ? dispute.winnerId.toString() : undefined,
          loserId: dispute.loserId ? dispute.loserId.toString() : undefined,
          adminDecision: dispute.adminDecision || false,
          decisionNotes: dispute.decisionNotes || undefined,
          autoClosed: dispute.autoClosed || false,
        } : undefined,
        reviewInfo: review ? {
          id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
          reviewerName: review.reviewerName,
          reviewer: review.reviewer ? {
            id: review.reviewer._id.toString(),
            name: review.reviewerName,
            avatar: review.reviewer.avatar || '',
          } : {
            name: review.reviewerName,
          },
          response: review.response || undefined,
          responseBy: review.responseBy ? {
            id: review.responseBy._id.toString(),
            name: review.responseBy.tradingName || 'Professional',
            avatar: review.responseBy.avatar || '',
          } : undefined,
          responseAt: review.responseAt ? new Date(review.responseAt).toISOString() : undefined,
          hasResponded: review.hasResponded || false,
          createdAt: new Date(review.createdAt).toISOString(),
        } : undefined,
      };
    });

    return res.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

// Professional: Request delivery extension
router.post('/:orderId/extension-request', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newDeliveryDate, reason } = req.body;

    if (!newDeliveryDate) {
      return res.status(400).json({ error: 'New delivery date is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in progress (can only request extension for active orders)
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Can only request extension for orders in progress' });
    }

    // Check if there's already a pending extension request
    if (order.extensionRequest && order.extensionRequest.status === 'pending') {
      return res.status(400).json({ error: 'There is already a pending extension request' });
    }

    // Update extension request
    order.extensionRequest = {
      status: 'pending',
      requestedDate: new Date(),
      newDeliveryDate: new Date(newDeliveryDate),
      reason: reason || '',
      requestedAt: new Date(),
      respondedAt: null,
    };

    await order.save();

    const clientUser = await User.findById(order.client).select('firstName lastName email').lean();
    const professionalUser = await User.findById(order.professional).select('firstName lastName tradingName email').lean();
    runBackgroundTask(
      () => sendExtensionRequestNotifications({
        order,
        clientUser: clientUser ? { _id: order.client, ...clientUser } : null,
        professionalUser: professionalUser ? { _id: order.professional, ...professionalUser } : null,
      }),
      'extension-request'
    );

    res.json({ 
      message: 'Extension request submitted successfully',
      extensionRequest: order.extensionRequest
    });
  } catch (error) {
    console.error('Extension request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request extension' });
  }
});

// Client: Approve or reject extension request
router.put('/:orderId/extension-request', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.extensionRequest || order.extensionRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending extension request found' });
    }

    if (action === 'approve') {
      // Update scheduled date and expected delivery when extension is approved
      if (order.extensionRequest.newDeliveryDate) {
        const newDate = order.extensionRequest.newDeliveryDate;
        if (order.metadata && typeof order.metadata === 'object') {
          order.metadata.scheduledDate = newDate;
          order.metadata.expectedDelivery = newDate;
        } else {
          order.metadata = { scheduledDate: newDate, expectedDelivery: newDate };
        }
      }

      order.extensionRequest.status = 'approved';
    } else {
      order.extensionRequest.status = 'rejected';
    }

    order.extensionRequest.respondedAt = new Date();

    await order.save();

    const clientUser = await User.findById(order.client).select('firstName lastName email').lean();
    const professionalUser = await User.findById(order.professional).select('firstName lastName tradingName email').lean();
    runBackgroundTask(
      () => sendExtensionResponseNotifications({
        order,
        clientUser: clientUser ? { _id: order.client, ...clientUser } : null,
        professionalUser: professionalUser ? { _id: order.professional, ...professionalUser } : null,
        action,
      }),
      'extension-response'
    );

    res.json({ 
      message: `Extension request ${action}d successfully`,
      extensionRequest: order.extensionRequest
    });
  } catch (error) {
    console.error('Extension request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to extension request' });
  }
});

// Optional multipart middleware: use multer only for multipart/form-data
function optionalCancellationUpload(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return cancellationUpload.array('files', 10)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'File upload failed' });
      next();
    });
  }
  next();
}

// Request cancellation (both client and professional can request); optional files via multipart
router.post('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), optionalCancellationUpload, async (req, res) => {
  try {
    const { orderId } = req.params;
    const reason = (req.body?.reason != null ? String(req.body.reason) : '') || '';

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(404).json({ error: 'Order not found' });
    }

    const isClient = order.client._id.toString() === req.user.id.toString();
    const isProfessional = order.professional._id.toString() === req.user.id.toString();

    if (!isClient && !isProfessional) {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(403).json({ error: 'Not authorized to request cancellation for this order' });
    }

    if (order.status === 'Completed' || order.deliveryStatus === 'delivered' || order.deliveryStatus === 'completed') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Cannot cancel order that has been delivered. Please initiate a dispute instead.' });
    }

    if (order.status === 'Cancelled') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Order is already cancelled.' });
    }

    if (order.cancellationRequest && order.cancellationRequest.status === 'pending') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'There is already a pending cancellation request' });
    }

    // Get cancellation response time from payment settings
    const PaymentSettings = (await import('../models/PaymentSettings.js')).default;
    const paymentSettings = await PaymentSettings.findOne({});
    const responseTimeHours = paymentSettings?.cancellationResponseTimeHours || 24;

    // Calculate response deadline
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + responseTimeHours);

    // Store current status before cancellation request for potential restoration
    if (!order.metadata) order.metadata = {};
    if (!order.metadata.statusBeforeCancellationRequest) {
      order.metadata.statusBeforeCancellationRequest = order.status;
    }

    const cancellationFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';
        cancellationFiles.push({
          url: `/api/orders/cancellations/${file.filename}`,
          fileName: file.originalname,
          fileType,
          uploadedAt: new Date(),
        });
      }
    }

    order.cancellationRequest = {
      status: 'pending',
      requestedBy: req.user.id,
      reason: reason || '',
      files: cancellationFiles,
      requestedAt: new Date(),
      responseDeadline: responseDeadline,
      respondedAt: null,
      respondedBy: null,
    };

    order.status = 'Cancellation Pending';

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendCancellationRequestNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        requestedByUserId: req.user.id,
      }),
      'cancellation-request'
    );

    const cr = order.cancellationRequest.toObject ? order.cancellationRequest.toObject() : order.cancellationRequest;
    res.json({ 
      message: 'Cancellation request submitted successfully',
      cancellationRequest: { ...cr, files: cr.files || cancellationFiles },
      responseDeadline: responseDeadline,
      orderStatus: order.status
    });
  } catch (error) {
    if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
    console.error('Cancellation request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request cancellation' });
  }
});

// Respond to cancellation request (approve or reject)
router.put('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body; // 'approve' or 'reject', reason is optional

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending cancellation request found' });
    }

    // Check if user is authorized (must be the other party, not the one who requested)
    const isClient = order.client._id.toString() === req.user.id.toString();
    const isProfessional = order.professional._id.toString() === req.user.id.toString();
    const requestedBy = order.cancellationRequest.requestedBy.toString();

    // Cannot respond to own request
    if (req.user.id.toString() === requestedBy) {
      return res.status(400).json({ error: 'Cannot respond to your own cancellation request' });
    }

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'Not authorized to respond to this cancellation request' });
    }

    if (action === 'approve') {
      // Cancel the order – professional accepted; status becomes Cancelled immediately
      order.status = 'Cancelled';
      order.deliveryStatus = 'cancelled';
      order.cancellationRequest.status = 'approved';
      
      // Handle refund if payment was made
      // TODO: Implement refund logic here based on payment method
      
    } else {
      // Reject cancellation – restore order status and continue
      order.cancellationRequest.status = 'rejected';
      order.status = order.metadata?.statusBeforeCancellationRequest || 'In Progress';
      if (reason && reason.trim()) {
        order.cancellationRequest.rejectionReason = reason.trim();
      }
    }

    order.cancellationRequest.respondedAt = new Date();
    order.cancellationRequest.respondedBy = req.user.id;

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendCancellationResponseNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        action,
      }),
      'cancellation-response'
    );

    res.json({ 
      message: `Cancellation request ${action}d successfully`,
      cancellationRequest: {
        ...order.cancellationRequest.toObject(),
        rejectionReason: order.cancellationRequest.rejectionReason || undefined,
      },
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Cancellation request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to cancellation request' });
  }
});

// Withdraw cancellation request
router.delete('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending cancellation request to withdraw' });
    }

    // Check if user is the one who requested cancellation
    if (order.cancellationRequest.requestedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to withdraw this cancellation request' });
    }

    // Store the previous status before cancellation request (for restoration)
    const previousStatus = order.metadata?.statusBeforeCancellationRequest || 'In Progress';
    
    // Withdraw cancellation request – order returns to processing
    order.cancellationRequest.status = 'withdrawn';
    order.status = previousStatus;

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendCancellationWithdrawnNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        withdrawnByUserId: req.user.id,
      }),
      'cancellation-withdrawn'
    );

    res.json({ 
      message: 'Cancellation request withdrawn successfully',
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Cancellation request withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Failed to withdraw cancellation request' });
  }
});

// Professional: Accept order
router.post('/:orderId/accept', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in progress
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order can only be accepted when it is in progress' });
    }

    // Check if already accepted
    if (order.acceptedByProfessional) {
      return res.status(400).json({ error: 'Order has already been accepted' });
    }

    // Accept order - status remains in progress
    order.acceptedByProfessional = true;
    order.acceptedAt = new Date();
    order.rejectedAt = null;
    order.rejectionReason = null;

    await order.save();

    res.json({ 
      message: 'Order accepted successfully',
      order: {
        status: order.status,
        acceptedByProfessional: order.acceptedByProfessional,
        acceptedAt: order.acceptedAt,
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept order' });
  }
});

// Professional: Reject order
router.post('/:orderId/reject', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in progress
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order can only be rejected when it is in progress' });
    }

    // Check if already accepted
    if (order.acceptedByProfessional) {
      return res.status(400).json({ error: 'Cannot reject an order that has already been accepted' });
    }

    // Reject order - change status to Cancelled
    order.status = 'Cancelled';
    order.deliveryStatus = 'cancelled';
    order.acceptedByProfessional = false;
    order.rejectedAt = new Date();
    order.rejectionReason = reason || '';

    // TODO: Handle refund if payment was made
    // TODO: Notify client about rejection

    await order.save();
    await syncCustomOfferMessageStatus(order);

    res.json({ 
      message: 'Order rejected successfully',
      order: {
        status: order.status,
        rejectedAt: order.rejectedAt,
        rejectionReason: order.rejectionReason,
      }
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject order' });
  }
});

// Professional: Mark order as delivered (completed) with files
router.post('/:orderId/deliver', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id })).populate('client professional');

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Milestone orders must use per-milestone delivery (deliver-milestone endpoint)
    const isMilestoneOrder = order.metadata?.paymentType === 'milestone' &&
      Array.isArray(order.metadata?.milestones) &&
      order.metadata.milestones.length > 0;
    if (isMilestoneOrder) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
        });
      }
      return res.status(400).json({ error: 'This order uses milestones. Please deliver work for each milestone from the Created Milestones table.' });
    }

    // Check if order is in progress or revision (status 'In Progress', 'Revision' or deliveryStatus 'active', 'revision')
    const isInProgress = order.status === 'In Progress' || 
                         order.status === 'in_progress' ||
                         order.status === 'Revision' ||
                         order.deliveryStatus === 'active' ||
                         order.deliveryStatus === 'revision' ||
                         (order.acceptedByProfessional && order.status !== 'Completed' && order.status !== 'Cancelled');
    
    if (!isInProgress) {
      // Clean up uploaded files if order is not in progress or revision
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Order must be in progress or revision before marking as delivered' });
    }

    // Mark order as delivered
    order.status = 'delivered'; // Set status to delivered when work is delivered
    order.deliveryStatus = 'delivered';
    order.deliveredDate = new Date();
    
    // Store delivery files and message - append new files to existing ones
    // Calculate delivery number based on existing delivery messages
    // Each delivery is independent - count existing deliveries by [Delivery #N] markers
    let deliveryNumber = 1;
    if (order.deliveryMessage) {
      // Count existing delivery markers
      const deliveryMatches = order.deliveryMessage.match(/\[Delivery #\d+\]/g);
      if (deliveryMatches && deliveryMatches.length > 0) {
        // Extract the highest delivery number
        const deliveryNumbers = deliveryMatches.map(match => {
          const numMatch = match.match(/\d+/);
          return numMatch ? parseInt(numMatch[0], 10) : 0;
        });
        deliveryNumber = Math.max(...deliveryNumbers) + 1;
      } else {
        // If there's a message but no marker, it's the first delivery
        deliveryNumber = 2;
      }
    } else if (order.deliveryFiles && order.deliveryFiles.length > 0) {
      // If there are files but no message, this is the second delivery
      deliveryNumber = 2;
    }
    
    // Process uploaded files with delivery number
    const deliveryFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        deliveryFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
          deliveryNumber: deliveryNumber, // Store delivery number with each file
        });
      }
    }
    
    if (deliveryFiles.length > 0) {
      order.deliveryFiles = order.deliveryFiles ? [...order.deliveryFiles, ...deliveryFiles] : deliveryFiles;
    }
    if (deliveryMessage && deliveryMessage.trim()) {
      // Append new message to existing one with separator, or set if none exists
      if (order.deliveryMessage) {
        order.deliveryMessage = `${order.deliveryMessage}\n\n[Delivery #${deliveryNumber}]\n${deliveryMessage.trim()}`;
      } else {
        order.deliveryMessage = `[Delivery #${deliveryNumber}]\n${deliveryMessage.trim()}`;
      }
    }

    // When pro delivers, mark any pending or in_progress revision as completed
    if (order.revisionRequest && Array.isArray(order.revisionRequest)) {
      const active = order.revisionRequest.filter(rr => rr && (rr.status === 'pending' || rr.status === 'in_progress'));
      active.forEach(rr => {
        rr.status = 'completed';
        rr.respondedAt = new Date();
      });
    } else if (order.revisionRequest && (order.revisionRequest.status === 'pending' || order.revisionRequest.status === 'in_progress')) {
      order.revisionRequest.status = 'completed';
      order.revisionRequest.respondedAt = new Date();
    }

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendOrderDeliveredNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
      }),
      'order-delivered'
    );

    res.json({ 
      message: 'Order marked as delivered successfully',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        deliveredDate: order.deliveredDate,
        deliveryFiles: order.deliveryFiles,
        deliveryMessage: order.deliveryMessage,
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Deliver order error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark order as delivered' });
  }
});

// Professional: Deliver work for a single milestone (milestone custom offers only)
router.post('/:orderId/deliver-milestone', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMessage, milestoneIndex: rawMilestoneIndex } = req.body;

    const milestoneIndex = rawMilestoneIndex !== undefined && rawMilestoneIndex !== null
      ? parseInt(String(rawMilestoneIndex), 10)
      : -1;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id })).populate('client professional');

    if (!order) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    const milestones = order.metadata?.milestones || [];
    if (order.metadata?.paymentType !== 'milestone' || !Array.isArray(milestones) || milestones.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => { if (file.path) fs.unlink(file.path).catch(() => {}); });
      }
      return res.status(400).json({ error: 'This order does not use milestones' });
    }

    if (isNaN(milestoneIndex) || milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => { if (file.path) fs.unlink(file.path).catch(() => {}); });
      }
      return res.status(400).json({ error: 'Invalid milestone index' });
    }

    const milestoneDeliveries = order.metadata?.milestoneDeliveries || [];
    if (milestoneDeliveries.some(d => d.milestoneIndex === milestoneIndex)) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => { if (file.path) fs.unlink(file.path).catch(() => {}); });
      }
      return res.status(400).json({ error: 'This milestone has already been delivered' });
    }

    const isInProgress = order.status === 'In Progress' || order.status === 'in_progress' ||
      order.deliveryStatus === 'active' || order.deliveryStatus === 'pending';
    if (!isInProgress) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => { if (file.path) fs.unlink(file.path).catch(() => {}); });
      }
      return res.status(400).json({ error: 'Order must be in progress to deliver a milestone' });
    }

    const deliveryFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        deliveryFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType,
          uploadedAt: new Date(),
          deliveryNumber: milestoneIndex + 1,
          milestoneIndex,
        });
      }
    }

    if (deliveryFiles.length > 0) {
      order.deliveryFiles = order.deliveryFiles ? [...order.deliveryFiles, ...deliveryFiles] : deliveryFiles;
    }

    const newDelivery = {
      milestoneIndex,
      deliveredAt: new Date(),
      deliveryMessage: (deliveryMessage && String(deliveryMessage).trim()) || '',
    };
    if (!order.metadata) order.metadata = {};
    order.metadata.milestoneDeliveries = order.metadata.milestoneDeliveries || [];
    order.metadata.milestoneDeliveries.push(newDelivery);
    order.markModified('metadata');

    const allDelivered = milestones.length === order.metadata.milestoneDeliveries.length;
    if (allDelivered) {
      order.status = 'delivered';
      order.deliveryStatus = 'delivered';
      order.deliveredDate = new Date();
      if (order.deliveryMessage) {
        order.deliveryMessage = `${order.deliveryMessage}\n\n[All milestones delivered]\n${order.metadata.milestoneDeliveries.map((d, i) => `Milestone ${i + 1}: ${d.deliveryMessage || '(no message)'}`).join('\n')}`.trim();
      } else {
        order.deliveryMessage = `[All milestones delivered]\n${order.metadata.milestoneDeliveries.map((d, i) => `Milestone ${i + 1}: ${d.deliveryMessage || '(no message)'}`).join('\n')}`;
      }
    }

    await order.save();
    await syncCustomOfferMessageStatus(order);

    if (allDelivered) {
      runBackgroundTask(
        () => sendOrderDeliveredNotifications({
          order,
          clientUser: order.client,
          professionalUser: order.professional,
        }),
        'order-delivered'
      );
    }

    res.json({
      message: allDelivered
        ? 'All milestones delivered. Order is now delivered for client approval.'
        : 'Milestone delivered successfully.',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        deliveredDate: order.deliveredDate,
        deliveryFiles: order.deliveryFiles,
        deliveryMessage: order.deliveryMessage,
        milestoneDeliveries: order.metadata?.milestoneDeliveries,
      },
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try { unlinkSync(file.path); } catch (err) { console.error('Error deleting file:', err); }
        }
      });
    }
    console.error('Deliver milestone error:', error);
    res.status(500).json({ error: error.message || 'Failed to deliver milestone' });
  }
});

// Serve delivery files
router.get('/deliveries/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(deliveryDir, filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve delivery file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Serve cancellation request attachment files
router.get('/cancellations/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(cancellationDir, filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve cancellation file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Serve revision request files
router.get('/revisions/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(revisionDir, filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve revision file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Client: Request revision (modification) for delivered order
const maybeRevisionUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return revisionUpload.array('files', 10)(req, res, next);
  }
  return next();
};

router.post('/:orderId/revision-request', authenticateToken, requireRole(['client']), maybeRevisionUpload, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, message } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Revision reason is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id })).populate('client professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is delivered
    // Revision can only be requested when:
    // 1. Delivery files exist (professional has sent delivery result), OR
    // 2. Status is 'delivered', OR
    // 3. DeliveryStatus is 'delivered'
    const hasDeliveryFiles = order.deliveryFiles && order.deliveryFiles.length > 0;
    const isDeliveredStatus = order.status === 'delivered' || order.status === 'Delivered';
    const isDeliveredDeliveryStatus = order.deliveryStatus === 'delivered';
    
    if (!hasDeliveryFiles && !isDeliveredStatus && !isDeliveredDeliveryStatus) {
      return res.status(400).json({ error: 'Revision can only be requested for delivered orders' });
    }

    // Check if there's already a pending or in_progress revision request
    const activeRevisionRequest = order.revisionRequest && Array.isArray(order.revisionRequest)
      ? order.revisionRequest.find(rr => rr.status === 'pending' || rr.status === 'in_progress')
      : (order.revisionRequest && (order.revisionRequest.status === 'pending' || order.revisionRequest.status === 'in_progress') ? order.revisionRequest : null);
    
    if (activeRevisionRequest) {
      return res.status(400).json({ error: 'There is already an active revision request' });
    }

    // Process uploaded files
    const revisionFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';
        revisionFiles.push({
          url: `/api/orders/revisions/${file.filename}`,
          fileName: file.originalname,
          fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Initialize revisionRequest as array if it doesn't exist or is not an array
    if (!order.revisionRequest || !Array.isArray(order.revisionRequest)) {
      order.revisionRequest = [];
    }

    // Calculate next index
    const nextIndex = order.revisionRequest.length > 0 
      ? Math.max(...order.revisionRequest.map(rr => rr.index || 0)) + 1
      : 1;

    // Create new revision request and add to array
    const newRevisionRequest = {
      index: nextIndex,
      status: 'pending',
      reason: reason.trim(),
      clientMessage: message && message.trim() ? message.trim() : null,
      clientFiles: revisionFiles.length > 0 ? revisionFiles : [],
      requestedAt: new Date(),
      respondedAt: null,
      additionalNotes: null,
    };
    
    order.revisionRequest.push(newRevisionRequest);

    // Update order status - when revision is requested, change status to "Revision"
    order.status = 'Revision';
    order.deliveryStatus = 'revision';

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendOrderDeliveryRejectedNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        reason: reason.trim(),
      }),
      'order-delivery-rejected'
    );

    res.json({ 
      message: 'Revision request submitted successfully',
      revisionRequest: order.revisionRequest
    });
  } catch (error) {
    console.error('Revision request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request revision' });
  }
});

// Professional: Respond to revision request (accept and start work, or reject)
router.put('/:orderId/revision-request', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, additionalNotes } = req.body; // action: 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "accept" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the latest pending revision request
    let latestRevisionRequest = null;
    if (order.revisionRequest && Array.isArray(order.revisionRequest)) {
      // Find the latest pending revision request (highest index with pending status)
      const pendingRequests = order.revisionRequest.filter(rr => rr.status === 'pending');
      if (pendingRequests.length > 0) {
        latestRevisionRequest = pendingRequests.reduce((latest, current) => 
          (current.index || 0) > (latest.index || 0) ? current : latest
        );
      }
    } else if (order.revisionRequest && order.revisionRequest.status === 'pending') {
      // Legacy format - convert to array format
      order.revisionRequest = [{
        index: 1,
        ...order.revisionRequest
      }];
      latestRevisionRequest = order.revisionRequest[0];
    }

    if (!latestRevisionRequest) {
      return res.status(400).json({ error: 'No pending revision request found' });
    }

    if (action === 'accept') {
      // Accept revision request - mark as in_progress
      latestRevisionRequest.status = 'in_progress';
      latestRevisionRequest.additionalNotes = additionalNotes || null;
      latestRevisionRequest.respondedAt = new Date();

      // Resume work: move order back to in-progress state
      order.status = 'In Progress';
      order.deliveryStatus = 'active';
    } else {
      // Reject revision request
      latestRevisionRequest.status = 'rejected';
      latestRevisionRequest.respondedAt = new Date();
      latestRevisionRequest.additionalNotes = additionalNotes || null;
    }

    await order.save();

    res.json({ 
      message: `Revision request ${action}ed successfully`,
      revisionRequest: order.revisionRequest,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Revision request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to revision request' });
  }
});

// Professional: Complete revision and re-deliver
router.post('/:orderId/revision-complete', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            try {
              unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the latest in_progress revision request
    let latestRevisionRequest = null;
    if (order.revisionRequest && Array.isArray(order.revisionRequest)) {
      // Find the latest in_progress revision request (highest index with in_progress status)
      const inProgressRequests = order.revisionRequest.filter(rr => rr.status === 'in_progress');
      if (inProgressRequests.length > 0) {
        latestRevisionRequest = inProgressRequests.reduce((latest, current) => 
          (current.index || 0) > (latest.index || 0) ? current : latest
        );
      }
    } else if (order.revisionRequest && order.revisionRequest.status === 'in_progress') {
      // Legacy format - convert to array format
      order.revisionRequest = [{
        index: 1,
        ...order.revisionRequest
      }];
      latestRevisionRequest = order.revisionRequest[0];
    }

    if (!latestRevisionRequest) {
      // Clean up uploaded files if no active revision
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            try {
              unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }
        });
      }
      return res.status(400).json({ error: 'No active revision request found' });
    }

    // Mark revision as completed
    latestRevisionRequest.status = 'completed';
    latestRevisionRequest.respondedAt = new Date();

    // Re-deliver the order
    order.status = 'delivered'; // Set status to delivered when revision is re-delivered
    order.deliveryStatus = 'delivered';
    order.deliveredDate = new Date();
    
    // Update or append delivery files and message
    // Calculate delivery number based on existing delivery messages
    // Each delivery is independent - count existing deliveries by [Delivery #N] markers
    let deliveryNumber = 1;
    if (order.deliveryMessage) {
      // Count existing delivery markers
      const deliveryMatches = order.deliveryMessage.match(/\[Delivery #\d+\]/g);
      if (deliveryMatches && deliveryMatches.length > 0) {
        // Extract the highest delivery number
        const deliveryNumbers = deliveryMatches.map(match => {
          const numMatch = match.match(/\d+/);
          return numMatch ? parseInt(numMatch[0], 10) : 0;
        });
        deliveryNumber = Math.max(...deliveryNumbers) + 1;
      } else {
        // If there's a message but no marker, it's the first delivery
        deliveryNumber = 2;
      }
    } else if (order.deliveryFiles && order.deliveryFiles.length > 0) {
      // If there are files but no message, this is the second delivery
      deliveryNumber = 2;
    }
    
    // Process uploaded files (if any) with delivery number
    const deliveryFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        deliveryFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
          deliveryNumber: deliveryNumber, // Store delivery number with each file
        });
      }
    }
    
    if (deliveryFiles.length > 0) {
      // Append new files to existing ones or replace if none exist
      order.deliveryFiles = order.deliveryFiles ? [...order.deliveryFiles, ...deliveryFiles] : deliveryFiles;
    }
    if (deliveryMessage && deliveryMessage.trim()) {
      // Update delivery message or append to existing one with delivery number
      order.deliveryMessage = order.deliveryMessage 
        ? `${order.deliveryMessage}\n\n[Delivery #${deliveryNumber}]\n${deliveryMessage.trim()}` 
        : `[Delivery #${deliveryNumber}]\n${deliveryMessage.trim()}`;
    }

    await order.save();
    await syncCustomOfferMessageStatus(order);

    res.json({ 
      message: 'Revision completed and order re-delivered successfully',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        deliveredDate: order.deliveredDate,
        deliveryFiles: order.deliveryFiles,
        deliveryMessage: order.deliveryMessage,
        revisionRequest: order.revisionRequest,
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Revision complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete revision' });
  }
});

// Professional: Mark order as complete with verification data
router.post('/:orderId/professional-complete', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completionMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is delivered
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      // Clean up uploaded files if order is not delivered
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Order must be delivered before marking as complete' });
    }

    // Check if already marked as complete by professional
    if (order.metadata?.professionalCompleteRequest) {
      return res.status(400).json({ error: 'Completion request already submitted. Waiting for client approval.' });
    }

    // Process uploaded files (verification data)
    const completionFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        completionFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Store completion request in metadata
    if (!order.metadata) order.metadata = {};
    order.metadata.professionalCompleteRequest = {
      requestedAt: new Date(),
      completionMessage: completionMessage || '',
      completionFiles: completionFiles,
    };

    await order.save();

    res.json({ 
      message: 'Completion request submitted successfully. Waiting for client approval.',
      completionRequest: order.metadata.professionalCompleteRequest
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Professional complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit completion request' });
  }
});

// Client: Accept delivery and release funds to professional
router.post('/:orderId/complete', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body; // Optional rating and review

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id })).populate('professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Milestone vs non-milestone orders have slightly different completion rules.
    const isMilestoneOrder =
      order.metadata?.fromCustomOffer &&
      order.metadata?.paymentType === 'milestone' &&
      Array.isArray(order.metadata?.milestones) &&
      order.metadata.milestones.length > 0;

    if (isMilestoneOrder) {
      // For milestone custom offers: all milestones must be delivered or resolved by dispute
      // before the client can mark the order as completed.
      const milestones = order.metadata?.milestones || [];
      const milestoneDeliveries = order.metadata?.milestoneDeliveries || [];
      const disputeResolved = order.metadata?.disputeResolvedMilestoneIndices || [];
      const allMilestonesComplete =
        Array.isArray(milestones) &&
        milestones.length > 0 &&
        milestones.every(
          (_, idx) =>
            milestoneDeliveries.some((d) => d.milestoneIndex === idx) || disputeResolved.includes(idx)
        );

      if (!allMilestonesComplete) {
        return res.status(400).json({
          error: 'All milestones must be delivered or resolved before completing this order',
        });
      }
    } else {
      // Non-milestone orders: keep existing delivered checks
      const isDelivered =
        order.deliveryStatus === 'delivered' ||
        (order.deliveryFiles && order.deliveryFiles.length > 0) ||
        order.deliveryMessage ||
        order.metadata?.professionalCompleteRequest;

      if (!isDelivered && order.status !== 'In Progress') {
        return res.status(400).json({ error: 'Order must be delivered before completing' });
      }
    }

    // Get professional user
    const professional = await User.findById(order.professional);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Get client user
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get professional payout amount from order metadata
    const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;

    // Check if funds have already been released
    if (order.status === 'Completed') {
      return res.status(400).json({ error: 'Order has already been completed and funds released' });
    }

    // Release funds to professional's wallet
    professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
    await professional.save();

    // Create wallet transaction for professional payout
    const payoutTransaction = new Wallet({
      userId: professional._id,
      type: 'deposit', // Deposit to professional's wallet
      amount: professionalPayoutAmount,
      balance: professional.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet', // Internal transfer
      orderId: order._id,
      description: `Payment for Order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        orderSubtotal: order.subtotal,
        discount: order.discount || 0,
        promoCode: order.promoCode || null,
        promoCodeType: order.metadata?.promoCodeType || null,
      },
    });

    await payoutTransaction.save();

    // Update order status to completed
    order.status = 'Completed';
    order.deliveryStatus = 'completed';
    order.completedDate = new Date();
    
    // Store rating and review in order (for backward compatibility)
    if (rating !== undefined) {
      order.rating = rating;
    }
    if (review !== undefined) {
      order.review = review;
    }

    await order.save();

    // Create review if rating and/or review is provided (saved per service)
    const primaryServiceId = order.items?.[0]?.serviceId ? (typeof order.items[0].serviceId === 'string' ? order.items[0].serviceId : order.items[0].serviceId.toString()) : null;
    let reviewDoc = null;
    if (rating !== undefined || (review && review.trim())) {
      const serviceObjId = primaryServiceId ? new mongoose.Types.ObjectId(primaryServiceId) : null;
      reviewDoc = await Review.findOne(serviceObjId ? { order: order._id, service: serviceObjId } : { order: order._id, service: null });

      if (reviewDoc) {
        if (rating !== undefined) reviewDoc.rating = rating;
        if (review !== undefined) reviewDoc.comment = review.trim() || '';
        reviewDoc.reviewer = client._id;
        reviewDoc.reviewerName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous';
        if (serviceObjId) reviewDoc.service = serviceObjId;
      } else {
        reviewDoc = new Review({
          professional: professional._id,
          order: order._id,
          service: serviceObjId,
          reviewer: client._id,
          reviewerName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous',
          rating: rating || 0,
          comment: review?.trim() || '',
        });
      }
      await reviewDoc.save();
      if (primaryServiceId) await updateServiceReviewStats(primaryServiceId);
    }

    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendOrderDeliveryApprovedNotifications({
        order,
        clientUser: client,
        professionalUser: professional,
      }),
      'order-delivery-approved'
    );

    res.json({ 
      message: 'Order completed successfully. Funds have been released to the professional.',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        completedDate: order.completedDate,
      },
      professionalPayoutAmount: professionalPayoutAmount,
      professionalNewBalance: professional.walletBalance,
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete order' });
  }
});

// Professional: Respond to review (one-time only)
router.post('/reviews/:reviewId/respond', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const review = await Review.findById(reviewId).populate('professional');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if review belongs to the professional
    const professionalId = review.professional?._id || review.professional;
    if (professionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only respond to reviews for your own services' });
    }

    // Check if already responded
    if (review.hasResponded) {
      return res.status(400).json({ error: 'You have already responded to this review' });
    }

    // Update review with response
    review.response = response.trim();
    review.responseBy = req.user.id;
    review.responseAt = new Date();
    review.hasResponded = true;

    await review.save();

    res.json({ 
      message: 'Response added successfully',
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        response: review.response,
        responseAt: review.responseAt,
        hasResponded: review.hasResponded,
      }
    });
  } catch (error) {
    console.error('Review response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to review' });
  }
});

// Client: Submit review for a completed order
router.post('/:orderId/review', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment, communicationRating, serviceAsDescribedRating, buyAgainRating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }))
      .populate('professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'Completed' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Get client user
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Primary service for this order (review is stored per service)
    const primaryServiceId = order.items?.[0]?.serviceId ? (typeof order.items[0].serviceId === 'string' ? order.items[0].serviceId : order.items[0].serviceId.toString()) : null;
    const serviceObjId = primaryServiceId ? new mongoose.Types.ObjectId(primaryServiceId) : null;

    // Check if review already exists for this order + service
    let reviewDoc = await Review.findOne(serviceObjId ? { order: order._id, service: serviceObjId } : { order: order._id, service: null });

    if (reviewDoc) {
      reviewDoc.rating = rating;
      reviewDoc.comment = comment?.trim() || '';
      reviewDoc.reviewer = client._id;
      reviewDoc.reviewerName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous';
      if (serviceObjId) reviewDoc.service = serviceObjId;
    } else {
      const professionalId = order.professional?._id || order.professional;
      reviewDoc = new Review({
        professional: professionalId,
        order: order._id,
        service: serviceObjId,
        reviewer: client._id,
        reviewerName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous',
        rating: rating,
        comment: comment?.trim() || '',
      });
    }

    await reviewDoc.save();
    if (primaryServiceId) await updateServiceReviewStats(primaryServiceId);

    // Update order with rating
    order.rating = rating;
    order.review = comment?.trim() || '';
    await order.save();

    res.json({ 
      message: 'Review submitted successfully',
      review: {
        id: reviewDoc._id,
        rating: reviewDoc.rating,
        comment: reviewDoc.comment,
        reviewerName: reviewDoc.reviewerName,
        createdAt: reviewDoc.createdAt,
      }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// Professional: Submit review for buyer (client)
router.post('/:orderId/buyer-review', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }))
      .populate('client');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'Completed' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Get professional user
    const professional = await User.findById(req.user.id);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Store buyer review in order metadata
    if (!order.metadata) order.metadata = {};
    order.metadata.buyerReview = {
      rating: rating,
      comment: comment?.trim() || '',
      reviewedBy: req.user.id,
      reviewerName: professional.tradingName || 'Professional',
      reviewedAt: new Date(),
    };
	    // NOTE: `metadata` is a Mixed type in the Order schema, so we must mark it modified
	    // otherwise Mongoose may not persist nested changes like `metadata.buyerReview`.
	    order.markModified('metadata');
    
    await order.save();

    res.json({ 
      message: 'Buyer review submitted successfully',
      buyerReview: order.metadata.buyerReview,
    });
  } catch (error) {
    console.error('Submit buyer review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit buyer review' });
  }
});

// Professional: Respond to client review (one-time only)
// Saves to Review table (response, responseBy, responseAt, hasResponded) for service detail page display
router.post('/:orderId/respond-to-review', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'Completed' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only respond to reviews for completed orders' });
    }

    // Find the Review document for this order (client's review of the service)
    const primaryServiceId = order.items?.[0]?.serviceId ? (typeof order.items[0].serviceId === 'string' ? order.items[0].serviceId : order.items[0].serviceId.toString()) : null;
    const serviceObjId = primaryServiceId ? new mongoose.Types.ObjectId(primaryServiceId) : null;
    let reviewDoc = await Review.findOne(serviceObjId ? { order: order._id, service: serviceObjId } : { order: order._id, service: null });

    if (!reviewDoc) {
      // Fallback: try without service (legacy orders)
      reviewDoc = await Review.findOne({ order: order._id, service: null });
    }

    if (!reviewDoc) {
      return res.status(400).json({ error: 'No client review found for this order' });
    }

    if (reviewDoc.hasResponded) {
      return res.status(400).json({ error: 'You have already responded to this review' });
    }

    // Save to Review table (canonical storage for service detail page)
    reviewDoc.response = response.trim();
    reviewDoc.responseBy = req.user.id;
    reviewDoc.responseAt = new Date();
    reviewDoc.hasResponded = true;
    await reviewDoc.save();

    // Also update Order for order detail page compatibility
    order.professionalResponse = response.trim();
    order.professionalResponseDate = new Date();
    await order.save();

    res.json({
      message: 'Response submitted successfully',
      professionalResponse: reviewDoc.response,
      professionalResponseDate: reviewDoc.responseAt,
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit response' });
  }
});

// Get review for an order (includes both client review and professional's buyer review)
router.get('/:orderId/review', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId, {
      $or: [{ client: req.user.id }, { professional: req.user.id }]
    }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const primaryServiceId = order.items?.[0]?.serviceId;
    const serviceObjId = primaryServiceId ? new mongoose.Types.ObjectId(primaryServiceId.toString()) : null;
    let review = await Review.findOne(
      serviceObjId ? { order: order._id, service: serviceObjId } : { order: order._id, service: null }
    )
      .populate('reviewer', 'firstName lastName tradingName avatar')
      .populate('responseBy', 'firstName lastName tradingName avatar');
    if (!review && serviceObjId) {
      review = await Review.findOne({ order: order._id, service: null })
        .populate('reviewer', 'firstName lastName tradingName avatar')
        .populate('responseBy', 'firstName lastName tradingName avatar');
    }

    if (!review) {
      return res.json({ 
        review: null,
        buyerReview: order.metadata?.buyerReview || null,
      });
    }

    res.json({ 
      review: {
        id: review._id,
        professional: review.professional.toString(),
        order: review.order.toString(),
        reviewer: review.reviewer ? {
          id: review.reviewer._id.toString(),
          name: review.reviewerName,
          avatar: review.reviewer.avatar,
        } : {
          name: review.reviewerName,
        },
        rating: review.rating,
        comment: review.comment,
        response: review.response,
        responseBy: review.responseBy ? {
          id: review.responseBy._id.toString(),
          name: `${review.responseBy.firstName || ''} ${review.responseBy.lastName || ''}`.trim() || review.responseBy.tradingName,
          avatar: review.responseBy.avatar,
        } : null,
        responseAt: review.responseAt ? new Date(review.responseAt).toISOString() : undefined,
        hasResponded: review.hasResponded,
        createdAt: new Date(review.createdAt).toISOString(),
      },
      buyerReview: order.metadata?.buyerReview || null,
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message || 'Failed to get review' });
  }
});

// Create dispute for an order
router.post('/:orderId/dispute', authenticateToken, upload.array('evidenceFiles', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { requirements, unmetRequirements, offerAmount, milestoneIndices: rawMilestoneIndices } = req.body;

    // Validate required fields
    if (!requirements || !requirements.trim()) {
      return res.status(400).json({ error: 'Please describe what the requirements were for the order' });
    }

    if (!unmetRequirements || !unmetRequirements.trim()) {
      return res.status(400).json({ error: 'Please describe which requirements were not completed' });
    }

    if (offerAmount === undefined || offerAmount === null || offerAmount === '') {
      return res.status(400).json({ error: 'Offer amount is required' });
    }

    const parsedOfferAmount = parseFloat(offerAmount);
    if (isNaN(parsedOfferAmount) || parsedOfferAmount < 0) {
      return res.status(400).json({ error: 'Offer amount cannot be negative' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName email')
      .populate('professional', 'firstName lastName tradingName email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isMilestoneOrder = order.metadata?.fromCustomOffer &&
      order.metadata?.paymentType === 'milestone' &&
      Array.isArray(order.metadata?.milestones) &&
      order.metadata.milestones.length > 0;
    const milestones = (order.metadata?.milestones || []).map(m => ({
      price: m.price ?? m.amount ?? 0,
      noOf: m.noOf ?? 1,
    }));

    let milestoneIndices = null;
    if (rawMilestoneIndices !== undefined && rawMilestoneIndices !== null && rawMilestoneIndices !== '') {
      let arr = rawMilestoneIndices;
      if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch { arr = []; }
      }
      milestoneIndices = Array.isArray(arr)
        ? arr.map(i => parseInt(i, 10)).filter(n => !isNaN(n))
        : [];
      if (isMilestoneOrder && milestoneIndices.length > 0) {
        const invalid = milestoneIndices.some(i => i < 0 || i >= milestones.length);
        if (invalid) {
          return res.status(400).json({ error: 'Invalid milestone selection' });
        }
        const maxAmount = milestoneIndices.reduce((sum, i) => sum + milestones[i].price * milestones[i].noOf, 0);
        if (parsedOfferAmount > maxAmount) {
          return res.status(400).json({ error: `Offer amount cannot exceed the total of selected milestones (£${maxAmount.toFixed(2)})` });
        }
      } else if (isMilestoneOrder && milestoneIndices.length === 0) {
        return res.status(400).json({ error: 'Please select at least one milestone to dispute' });
      }
    }

    if (!milestoneIndices || milestoneIndices.length === 0) {
      // Refundable amount only (exclude service fee - not refundable)
      const refundableAmount = (order.subtotal || 0) - (order.discount || 0);
      if (parsedOfferAmount > refundableAmount) {
        return res.status(400).json({ error: `Offer amount cannot exceed the refundable order amount (£${refundableAmount.toFixed(2)})` });
      }
    }

    // Check if order has been delivered or is in revision
    // Disputes can be opened when deliveryStatus is 'delivered' or status is 'Revision' or 'delivered'
    console.log('[Dispute Check] Order status:', order.status, 'deliveryStatus:', order.deliveryStatus);
    
    const statusLower = (order.status || '').toLowerCase();
    const deliveryStatusLower = (order.deliveryStatus || '').toLowerCase();
    
    const canOpenDispute = deliveryStatusLower === 'delivered' || 
                          statusLower === 'delivered' ||
                          statusLower === 'revision' || 
                          statusLower === 'in progress';
    
    console.log('[Dispute Check] canOpenDispute:', canOpenDispute);
    
    if (!canOpenDispute) {
      return res.status(400).json({ 
        error: 'Disputes can only be opened for delivered orders or orders in revision',
        debug: { status: order.status, deliveryStatus: order.deliveryStatus }
      });
    }

    // Check if user is either the client or professional for this order
    const isClient = order.client?.toString() === req.user.id || (order.client?._id && order.client._id.toString() === req.user.id);
    const isProfessional = order.professional?.toString() === req.user.id || (order.professional?._id && order.professional._id.toString() === req.user.id);

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'You are not authorized to create a dispute for this order' });
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ order: order._id });
    if (existingDispute || order.disputeId) {
      return res.status(400).json({ error: 'A dispute already exists for this order' });
    }

    // Get dispute response time from payment settings (in hours; supports decimals e.g. 0.5 = 30 mins)
    const settings = await PaymentSettings.getSettings();
    const responseTimeHoursRaw = typeof settings.disputeResponseTimeHours === 'number'
      ? settings.disputeResponseTimeHours
      : parseFloat(settings.disputeResponseTimeHours || '0');
    const responseTimeHours = Number.isFinite(responseTimeHoursRaw) && responseTimeHoursRaw > 0
      ? responseTimeHoursRaw
      : 48;

    // Calculate response deadline using milliseconds to correctly handle fractional hours
    const responseDeadline = new Date(Date.now() + responseTimeHours * 60 * 60 * 1000);

    // Determine claimant and respondent
    const claimantId = req.user.id;
    const respondentId = isClient ? (order.professional?._id || order.professional) : (order.client?._id || order.client);

    // Generate dispute ID
    const disputeId = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process evidence files
    const evidenceFiles = req.files ? req.files.map(file => file.path) : [];

    // Initialize dispute messages with initial claim
    const claimantUser = isClient ? order.client : order.professional;
    const initialMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: claimantId,
      userName: isClient ? 
        `${claimantUser?.firstName || ''} ${claimantUser?.lastName || ''}`.trim() : 
        (claimantUser?.tradingName || 'Professional'),
      userAvatar: claimantUser?.avatar || '',
      message: `**Requirements:** ${requirements}\n\n**Unmet Requirements:** ${unmetRequirements}`,
      timestamp: new Date(),
      isTeamResponse: false,
    };

    // Create dispute document
    const dispute = new Dispute({
      disputeId: disputeId,
      order: order._id,
      orderNumber: order.orderNumber,
      status: 'open',
      createdBy: claimantId,
      createdAt: new Date(),
      claimantId: claimantId,
      respondentId: respondentId,
      requirements: requirements,
      unmetRequirements: unmetRequirements,
      evidenceFiles: evidenceFiles,
      responseDeadline: responseDeadline,
      respondedAt: null,
      negotiationDeadline: null,
      messages: [initialMessage],
      offers: {
        clientOffer: isClient ? parsedOfferAmount : null,
        professionalOffer: isClient ? null : parsedOfferAmount,
      },
      arbitrationRequested: false,
      arbitrationRequestedBy: null,
      arbitrationRequestedAt: null,
      arbitrationFeeAmount: null,
      closedAt: null,
      winnerId: null,
      loserId: null,
      adminDecision: false,
      decisionNotes: null,
      autoClosed: false,
      finalAmount: null,
      ...(milestoneIndices && milestoneIndices.length > 0 && { milestoneIndices }),
    });

    await dispute.save();

    // Update order status and metadata so cancel/arbitration/cancel flow work for both client- and pro-initiated disputes
    order.status = 'disputed';
    order.deliveryStatus = 'dispute';
    order.disputeId = disputeId;
    if (!order.metadata) order.metadata = {};
    order.metadata.disputeStatus = 'open';
    order.metadata.disputeClaimantId = claimantId;
    order.metadata.disputeRespondentId = respondentId?.toString?.() || respondentId;
    order.metadata.disputeResponseDeadline = responseDeadline;
    order.metadata.disputeRespondedAt = null;
    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendDisputeInitiatedNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        claimantId: req.user.id,
        responseDeadline,
      }),
      'dispute-initiated'
    );

    res.json({ 
      message: 'Dispute created successfully',
      disputeId: disputeId,
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        disputeId: order.disputeId,
      },
      dispute: {
        id: disputeId,
        responseDeadline: responseDeadline.toISOString(),
        claimantId: claimantId,
        respondentId: respondentId.toString(),
      }
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to create dispute' });
  }
});

// Respond to dispute
router.post('/:orderId/dispute/respond', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body; // Optional message/response

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client', 'firstName lastName tradingName email').populate('professional', 'firstName lastName tradingName email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is still open
    if (dispute.status !== 'open') {
      return res.status(400).json({ error: 'This dispute is no longer open' });
    }

    // Check if user is the respondent
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isRespondent) {
      return res.status(403).json({ error: 'Only the respondent can respond to this dispute' });
    }

    // Check if already responded
    if (dispute.respondedAt) {
      return res.status(400).json({ error: 'You have already responded to this dispute' });
    }

    // Check if response deadline has passed
    if (dispute.responseDeadline && new Date(dispute.responseDeadline) < new Date()) {
      return res.status(400).json({ error: 'The response deadline has passed' });
    }

    // Get negotiation time from payment settings (step-in in hours, or days converted to hours)
    const settings = await PaymentSettings.getSettings();
    const stepInHours = typeof settings.stepInHours === 'number' && settings.stepInHours >= 0
      ? settings.stepInHours
      : (typeof settings.stepInDays === 'number' && settings.stepInDays > 0 ? settings.stepInDays * 24 : null);
    const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;

    const negotiationDeadline = new Date();
    if (typeof stepInHours === 'number' && stepInHours > 0) {
      negotiationDeadline.setTime(negotiationDeadline.getTime() + stepInHours * 60 * 60 * 1000);
    } else {
      negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);
    }

    // Get respondent user info
    const respondentUser = await User.findById(req.user.id);
    const isClient = order.client?.toString() === req.user.id || order.client?._id?.toString() === req.user.id;
    
    // Add response message if provided
    if (message && message.trim()) {
      const responseMessage = {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userName: isClient ? 
          `${respondentUser.firstName || ''} ${respondentUser.lastName || ''}`.trim() : 
          (respondentUser.tradingName || 'Professional'),
        userAvatar: respondentUser.avatar || '',
        message: message.trim(),
        timestamp: new Date(),
        isTeamResponse: false,
      };
      dispute.messages.push(responseMessage);
    }
    
    // Mark dispute as responded and enter negotiation phase
    dispute.status = 'negotiation';
    dispute.respondedAt = new Date();
    dispute.negotiationDeadline = negotiationDeadline;
    // Arbitration fee is always driven by admin's "step in amount"
    dispute.arbitrationFeeAmount = typeof settings.stepInAmount === 'number'
      ? settings.stepInAmount
      : dispute.arbitrationFeeAmount;

    await dispute.save();

    // Keep order.metadata in sync for cancel/arbitration flows
    if (!order.metadata) order.metadata = {};
    order.metadata.disputeStatus = 'negotiation';
    order.metadata.disputeRespondedAt = dispute.respondedAt;
    await order.save();

    runBackgroundTask(
      () => sendDisputeRespondedNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        respondentId: req.user.id,
      }),
      'dispute-responded'
    );

    res.json({
      message: 'Dispute response submitted successfully',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        respondedAt: dispute.respondedAt ? new Date(dispute.respondedAt).toISOString() : undefined,
        negotiationDeadline: dispute.negotiationDeadline ? new Date(dispute.negotiationDeadline).toISOString() : undefined,
      },
    });
  } catch (error) {
    console.error('Respond to dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to dispute' });
  }
});

// Add message to dispute
router.post('/:orderId/dispute/message', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    if ((!message || !message.trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Message or attachment is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName avatar')
      .populate('professional', 'firstName lastName tradingName avatar');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to message in this dispute' });
    }

    // Get user info
    const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;
    const user = isClient ? order.client : order.professional;

    // If this is the respondent's first message, treat as initial response: enforce deadline and transition to negotiation
    if (isRespondent && !dispute.respondedAt) {
      if (dispute.responseDeadline && new Date(dispute.responseDeadline) < new Date()) {
        return res.status(400).json({ error: 'The response deadline has passed. You must respond before the dispute initial response time.' });
      }
      const settings = await PaymentSettings.getSettings();
      const stepInHours = typeof settings.stepInHours === 'number' && settings.stepInHours >= 0
        ? settings.stepInHours
        : (typeof settings.stepInDays === 'number' && settings.stepInDays > 0 ? settings.stepInDays * 24 : null);
      const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;
      const negotiationDeadline = new Date();
      if (typeof stepInHours === 'number' && stepInHours > 0) {
        negotiationDeadline.setTime(negotiationDeadline.getTime() + stepInHours * 60 * 60 * 1000);
      } else {
        negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);
      }
      dispute.status = 'negotiation';
      dispute.respondedAt = new Date();
      dispute.negotiationDeadline = negotiationDeadline;
      // Arbitration fee is always driven by admin's "step in amount"
      dispute.arbitrationFeeAmount = typeof settings.stepInAmount === 'number'
        ? settings.stepInAmount
        : dispute.arbitrationFeeAmount;
      runBackgroundTask(
        () => sendDisputeRespondedNotifications({
          order,
          clientUser: order.client,
          professionalUser: order.professional,
          respondentId: req.user.id,
        }),
        'dispute-responded-via-message'
      );
    }

    // Process attachments
    const attachments = req.files ? req.files.map((file) => ({
      url: file.path,
      fileName: file.originalname,
      fileType: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'other',
    })) : [];

    // Add message to dispute
    const newMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      userName: isClient ? 
        `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
        (user.tradingName || 'Professional'),
      userAvatar: user.avatar || '',
      message: message ? message.trim() : '',
      timestamp: new Date(),
      isTeamResponse: false,
      attachments: attachments,
    };
    dispute.messages.push(newMessage);

    await dispute.save();

    // If we transitioned to negotiation (respondent's first message), keep order.metadata in sync
    if (dispute.status === 'negotiation') {
      if (!order.metadata) order.metadata = {};
      order.metadata.disputeStatus = 'negotiation';
      order.metadata.disputeRespondedAt = dispute.respondedAt;
      await order.save();
    }

    const responsePayload = {
      message: 'Message added successfully',
      disputeMessage: {
        ...newMessage,
        attachments: attachments.map(att => ({
          url: att.url,
          fileName: att.fileName,
          fileType: att.fileType,
        })),
      },
    };

    // When we transitioned to negotiation, return updated dispute so client can reset timer to step-in deadline
    if (dispute.status === 'negotiation' && dispute.respondedAt && dispute.negotiationDeadline) {
      responsePayload.dispute = {
        status: dispute.status,
        respondedAt: dispute.respondedAt ? new Date(dispute.respondedAt).toISOString() : undefined,
        negotiationDeadline: dispute.negotiationDeadline ? new Date(dispute.negotiationDeadline).toISOString() : undefined,
        messages: dispute.messages ? dispute.messages.map(msg => ({
          id: msg.id,
          userId: msg.userId.toString(),
          userName: msg.userName,
          userAvatar: msg.userAvatar,
          message: msg.message,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined,
          isTeamResponse: msg.isTeamResponse || false,
          attachments: msg.attachments || [],
        })) : [],
      };
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ error: error.message || 'Failed to add message' });
  }
});

// Submit dispute offer
router.post('/:orderId/dispute/offer', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Offer amount is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Invalid offer amount' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName')
      .populate('professional', 'firstName lastName tradingName');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'Cannot submit offer for a closed dispute' });
    }

    // Validate offer amount does not exceed refundable amount (exclude service fee - not refundable)
    const refundableAmount = (order.subtotal || 0) - (order.discount || 0);
    if (parsedAmount > refundableAmount) {
      return res.status(400).json({ error: `Offer amount cannot exceed the refundable order amount (£${refundableAmount.toFixed(2)})` });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to submit an offer for this dispute' });
    }

    // Determine if user is client or professional
    const isClient = order.client?.toString() === req.user.id || order.client?._id?.toString() === req.user.id;

    // Validate offer doesn't decrease from previous offer
    if (isClient) {
      const previousOffer = dispute.offers.clientOffer;
      if (previousOffer !== null && previousOffer !== undefined && parsedAmount < previousOffer) {
        return res.status(400).json({ error: `You cannot decrease your offer. Your current offer is £${previousOffer.toFixed(2)}` });
      }
      dispute.offers.clientOffer = parsedAmount;
    } else {
      const previousOffer = dispute.offers.professionalOffer;
      if (previousOffer !== null && previousOffer !== undefined && parsedAmount > previousOffer) {
        return res.status(400).json({ error: `You cannot increase your offer. Your current offer is £${previousOffer.toFixed(2)}` });
      }
      dispute.offers.professionalOffer = parsedAmount;
    }

    // Check if offers match - if so, resolve the dispute automatically
    const clientOffer = dispute.offers.clientOffer;
    const professionalOffer = dispute.offers.professionalOffer;
    
    if (clientOffer !== null && clientOffer !== undefined && 
        professionalOffer !== null && professionalOffer !== undefined && 
        clientOffer === professionalOffer) {
      // Offers match - resolve dispute
      const getDisplayName = (user) => {
        if (!user) return 'Unknown';
        if (user.tradingName) return user.tradingName;
        if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return 'Unknown';
      };
      const clientName = getDisplayName(order.client);
      const professionalName = getDisplayName(order.professional);
      const resolutionMessage = `Dispute resolved as ${clientName} and ${professionalName} both agreed on a settlement amount of £${clientOffer.toFixed(2)}.`;

      dispute.status = 'closed';
      dispute.closedAt = new Date();
      dispute.finalAmount = clientOffer;
      dispute.decisionNotes = resolutionMessage;
      order.status = 'Completed';
      order.deliveryStatus = 'completed';
      
      await applyDisputeSettlement({ order, dispute, agreedAmount: clientOffer });
    }

    await dispute.save();
    await order.save();
    await syncCustomOfferMessageStatus(order);

    res.json({ 
      message: 'Offer submitted successfully',
      offer: {
        clientOffer: dispute.offers.clientOffer,
        professionalOffer: dispute.offers.professionalOffer,
        isResolved: dispute.status === 'closed',
      }
    });
  } catch (error) {
    console.error('Submit dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit offer' });
  }
});

// Accept dispute offer and close dispute
router.post('/:orderId/dispute/accept', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName email walletBalance')
      .populate('professional', 'firstName lastName tradingName email walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is already closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to accept this dispute offer' });
    }

    // Determine if user is client or professional (handle populated or id)
    const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;

    // Get the other party's offer
    const otherPartyOffer = isClient ? 
      dispute.offers?.professionalOffer : 
      dispute.offers?.clientOffer;

    if (otherPartyOffer === null || otherPartyOffer === undefined) {
      return res.status(400).json({ error: 'The other party has not made an offer yet' });
    }

    // Accept the offer and resolve dispute
    const agreedAmount = otherPartyOffer;
    
    // Get names for the resolution message
    const getDisplayName = (user) => {
      if (!user) return 'Unknown';
      if (user.tradingName) return user.tradingName;
      if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return 'Unknown';
    };
    const accepterName = isClient ? getDisplayName(order.client) : getDisplayName(order.professional);
    const offererName = isClient ? getDisplayName(order.professional) : getDisplayName(order.client);
    
    // Store detailed resolution notes with specific names and amount
    const resolutionMessage = `Dispute resolved as ${accepterName} accepted the £${agreedAmount.toFixed(2)} offer from ${offererName}.`;

    dispute.status = 'closed';
    dispute.closedAt = new Date();
    dispute.acceptedBy = req.user.id;
    dispute.acceptedByRole = isClient ? 'client' : 'professional';
    dispute.acceptedAt = new Date();
    dispute.finalAmount = agreedAmount;
    dispute.decisionNotes = resolutionMessage;

    const isMilestoneOrder = order.metadata?.milestones?.length > 0;
    const disputedIndices = dispute.milestoneIndices && Array.isArray(dispute.milestoneIndices) ? dispute.milestoneIndices : [];

    if (isMilestoneOrder && disputedIndices.length > 0) {
      // Milestone dispute: only the disputed milestone(s) are resolved by this dispute
      if (!order.metadata) order.metadata = {};
      const resolved = order.metadata.disputeResolvedMilestoneIndices || [];
      disputedIndices.forEach((idx) => {
        if (!resolved.includes(idx)) resolved.push(idx);
      });
      order.metadata.disputeResolvedMilestoneIndices = resolved;
      order.markModified('metadata');

      const milestones = order.metadata.milestones || [];
      const milestoneDeliveries = order.metadata.milestoneDeliveries || [];
      const allMilestonesComplete = milestones.length > 0 && milestones.every((_, idx) =>
        milestoneDeliveries.some((d) => d.milestoneIndex === idx) || resolved.includes(idx)
      );
      if (allMilestonesComplete) {
        order.status = 'Completed';
        order.deliveryStatus = 'completed';
      }
      // Otherwise leave order status as is (e.g. In Progress) until all milestones are delivered or dispute-resolved
    } else {
      // Full order dispute or non-milestone order: mark entire order completed
      order.status = 'Completed';
      order.deliveryStatus = 'completed';
    }

    await applyDisputeSettlement({ order, dispute, agreedAmount });

    await dispute.save();
    await order.save();
    await syncCustomOfferMessageStatus(order);

    runBackgroundTask(
      () => sendDisputeResolvedNotifications({
        order,
        clientUser: order.client,
        professionalUser: order.professional,
        agreedAmount,
      }),
      'dispute-resolved'
    );

    res.json({ 
      message: 'Dispute resolved successfully',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        agreedAmount: agreedAmount,
        closedAt: dispute.closedAt,
      }
    });
  } catch (error) {
    console.error('Accept dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept dispute offer' });
  }
});

// Reject dispute offer
router.post('/:orderId/dispute/reject', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body; // Optional message explaining rejection

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName avatar')
      .populate('professional', 'firstName lastName tradingName avatar');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is already closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to reject this dispute offer' });
    }

    // Add rejection message if provided
    if (message && message.trim()) {
      const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;
      const user = isClient ? order.client : order.professional;
      
      const rejectionMessage = {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userName: isClient ? 
          `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
          (user.tradingName || 'Professional'),
        userAvatar: user.avatar || '',
        message: `Rejected offer. ${message.trim()}`,
        timestamp: new Date(),
        isTeamResponse: false,
      };
      dispute.messages.push(rejectionMessage);
    }

    await dispute.save();

    res.json({ 
      message: 'Offer rejected',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
      }
    });
  } catch (error) {
    console.error('Reject dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject dispute offer' });
  }
});

// Request admin arbitration (requires fee payment)
router.post('/:orderId/dispute/request-arbitration', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, paymentMethodId } = req.body || {};

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute exists and is in negotiation phase
    if (dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'Dispute must be in negotiation phase to request arbitration' });
    }

    // Check if user is either claimant or respondent (use dispute doc when metadata missing)
    const claimantId = order.metadata?.disputeClaimantId ?? dispute.claimantId?.toString?.() ?? dispute.claimantId;
    const respondentId = order.metadata?.disputeRespondentId ?? dispute.respondentId?.toString?.() ?? dispute.respondentId;
    const isClaimant = claimantId?.toString() === req.user.id;
    const isRespondent = respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'Only parties involved in the dispute can request arbitration' });
    }

    if (!paymentMethod || !['account_balance', 'card', 'paypal'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only card, paypal, and account_balance are allowed.' });
    }

    // Get arbitration fee from settings: always use admin's "step in amount"
    const settings = await PaymentSettings.getSettings();
    const arbitrationFee = typeof settings.stepInAmount === 'number'
      ? settings.stepInAmount
      : 0;
    const feeDeadlineHoursRaw = typeof settings.arbitrationFeeDeadlineHours === 'number'
      ? settings.arbitrationFeeDeadlineHours
      : parseFloat(settings.arbitrationFeeDeadlineHours || '0');
    const fallbackDaysRaw = typeof settings.arbitrationFeeDeadlineDays === 'number'
      ? settings.arbitrationFeeDeadlineDays
      : parseFloat(settings.arbitrationFeeDeadlineDays || '1');
    const feeDeadlineHours = Number.isFinite(feeDeadlineHoursRaw) && feeDeadlineHoursRaw >= 0
      ? feeDeadlineHoursRaw
      : ((Number.isFinite(fallbackDaysRaw) ? fallbackDaysRaw : 1) * 24);

    // Requesting user is the current user (claimant or respondent)
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent duplicate payment by same user
    const existingPayment = (dispute.arbitrationPayments || []).find((p) => p.userId?.toString() === req.user.id);
    if (existingPayment) {
      return res.status(400).json({ error: 'You have already paid the arbitration fee for this dispute' });
    }

    let feeTransaction = null;
    let paymentIntentId = null;
    const isClientPayer = (order.client?._id || order.client)?.toString() === requestingUser._id.toString();
    const payerRoleLabel = isClientPayer ? 'Client' : 'Professional';
    const arbitrationFeeDescription = `Dispute Arbitration Fee (${payerRoleLabel}) - Order ${order.orderNumber}`;

    if (paymentMethod === 'account_balance') {
      if ((requestingUser.walletBalance || 0) < arbitrationFee) {
        return res.status(400).json({ 
          error: `Insufficient balance. Arbitration fee is £${arbitrationFee.toFixed(2)}. Please add funds to your wallet.`,
          requiredAmount: arbitrationFee,
          currentBalance: requestingUser.walletBalance || 0,
        });
      }
      requestingUser.walletBalance = (requestingUser.walletBalance || 0) - arbitrationFee;
      await requestingUser.save();

      feeTransaction = new Wallet({
        userId: requestingUser._id,
        type: 'payment',
        amount: arbitrationFee,
        balance: requestingUser.walletBalance,
        status: 'completed',
        paymentMethod: 'wallet',
        orderId: order._id,
        description: arbitrationFeeDescription,
        metadata: {
          orderNumber: order.orderNumber,
          disputeId: order.disputeId,
          reason: 'Dispute arbitration fee payment',
          payerRole: payerRoleLabel,
          paymentMethod: 'wallet',
        },
      });
      await feeTransaction.save();
    } else if (paymentMethod === 'card') {
      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required for card payments' });
      }
      try {
        const stripe = getStripeInstance(settings);
        const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
        const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
        const stripeCommission = (arbitrationFee * stripeCommissionPercentage / 100) + stripeCommissionFixed;
        const totalChargeAmount = arbitrationFee + stripeCommission;

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalChargeAmount * 100),
          currency: 'gbp',
          payment_method: paymentMethodId,
          customer: requestingUser.stripeCustomerId,
          confirm: true,
          return_url: `${req.headers.origin || 'http://localhost:5000'}/account`,
          metadata: {
            userId: requestingUser._id.toString(),
            type: 'arbitration_fee',
            disputeId: order.disputeId,
            orderNumber: order.orderNumber,
          },
        });

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            error: 'Payment failed',
            status: paymentIntent.status,
            requiresAction: paymentIntent.status === 'requires_action',
          });
        }

        paymentIntentId = paymentIntent.id;
        feeTransaction = new Wallet({
          userId: requestingUser._id,
          type: 'payment',
          amount: arbitrationFee,
          balance: requestingUser.walletBalance || 0,
          status: 'completed',
          paymentMethod: 'card',
          orderId: order._id,
          description: arbitrationFeeDescription,
          metadata: {
            orderNumber: order.orderNumber,
            disputeId: order.disputeId,
            reason: 'Dispute arbitration fee payment',
            payerRole: payerRoleLabel,
            paymentMethod: 'card',
            paymentIntentId,
          },
        });
        await feeTransaction.save();
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to process card payment' });
      }
    } else if (paymentMethod === 'paypal') {
      // Create PayPal order for arbitration fee; capture happens in separate endpoint after user approves
      try {
        const environment = getPayPalClient(settings);
        const client = new paypal.core.PayPalHttpClient(environment);
        const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
        const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
        const paypalCommission = (arbitrationFee * paypalCommissionPercentage / 100) + paypalCommissionFixed;
        const totalChargeAmount = arbitrationFee + paypalCommission;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        const origin = req.headers.origin || 'http://localhost:5000';
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'GBP',
              value: totalChargeAmount.toFixed(2),
            },
            description: arbitrationFeeDescription,
            custom_id: `dispute-arbitration-${order.orderNumber}-${req.user.id}`,
          }],
          application_context: {
            return_url: `${origin}/dispute/${dispute.disputeId}?paypalCapture=1&orderId=${encodeURIComponent(order.orderNumber || order._id.toString())}`,
            cancel_url: `${origin}/dispute/${dispute.disputeId}`,
            brand_name: 'Sortars UK',
            locale: 'en-GB',
          },
        });

        const paypalApiOrder = await client.execute(request);
        if (paypalApiOrder.statusCode !== 201) {
          return res.status(400).json({ error: 'Failed to create PayPal order' });
        }

        const paypalOrderId = paypalApiOrder.result.id;
        const approveUrl = paypalApiOrder.result.links.find(link => link.rel === 'approve')?.href;
        if (!approveUrl) {
          return res.status(400).json({ error: 'Failed to get PayPal approval URL' });
        }

        dispute.pendingPayPalArbitration = {
          paypalOrderId,
          userId: requestingUser._id,
          amount: arbitrationFee,
          createdAt: new Date(),
        };
        await dispute.save();

        return res.json({
          message: 'Redirect to PayPal to complete arbitration fee payment.',
          requiresRedirect: true,
          approveUrl,
          paypalOrderId,
        });
      } catch (error) {
        console.error('PayPal arbitration order error:', error);
        return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
      }
    }

    if (!dispute.arbitrationPayments) dispute.arbitrationPayments = [];
    dispute.arbitrationFeeAmount = arbitrationFee;
    dispute.arbitrationPayments.push({
      userId: requestingUser._id,
      amount: arbitrationFee,
      paidAt: new Date(),
      paymentMethod: paymentMethod === 'account_balance' ? 'wallet' : 'card',
      paymentIntentId: paymentIntentId || null,
      transactionId: feeTransaction?._id || null,
    });

    if (!dispute.arbitrationFeeDeadline && dispute.arbitrationPayments.length === 1) {
      const feeDeadline = new Date();
      feeDeadline.setTime(feeDeadline.getTime() + feeDeadlineHours * 60 * 60 * 1000);
      dispute.arbitrationFeeDeadline = feeDeadline;
    }

    const paidUserIds = new Set(dispute.arbitrationPayments.map((p) => p.userId?.toString()));
    const bothPaid = paidUserIds.has(claimantId?.toString()) && paidUserIds.has(respondentId?.toString());

    if (!order.metadata) order.metadata = {};
    if (order.metadata.disputeClaimantId == null) order.metadata.disputeClaimantId = claimantId?.toString?.() ?? claimantId;
    if (order.metadata.disputeRespondentId == null) order.metadata.disputeRespondentId = respondentId?.toString?.() ?? respondentId;

    if (bothPaid) {
      dispute.status = 'admin_arbitration';
      dispute.arbitrationRequested = true;
      dispute.arbitrationRequestedBy = req.user.id;
      dispute.arbitrationRequestedAt = new Date();
      dispute.arbitrationFeeDeadline = null;
      order.metadata.disputeStatus = 'admin_arbitration';
      order.metadata.disputeArbitrationRequested = true;
      order.metadata.disputeArbitrationRequestedBy = req.user.id;
      order.metadata.disputeArbitrationRequestedAt = new Date();
    } else {
      order.metadata.disputeStatus = 'negotiation';
    }

    order.metadata.disputeArbitrationFeeAmount = arbitrationFee;
    order.metadata.disputeArbitrationFeeDeadline = dispute.arbitrationFeeDeadline;

    await dispute.save();
    await order.save();

    res.json({ 
      message: bothPaid
        ? 'Arbitration requested successfully. Admin will review the case.'
        : 'Arbitration fee paid. Waiting for the other party to pay.',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        arbitrationRequestedAt: dispute.arbitrationRequestedAt,
        arbitrationFeeDeadline: dispute.arbitrationFeeDeadline,
        arbitrationFeeAmount: dispute.arbitrationFeeAmount,
        arbitrationPayments: dispute.arbitrationPayments,
      },
      newBalance: requestingUser.walletBalance,
    });
  } catch (error) {
    console.error('Request arbitration error:', error);
    res.status(500).json({ error: error.message || 'Failed to request arbitration' });
  }
});

// Capture PayPal arbitration fee (after user approves on PayPal)
router.post('/:orderId/dispute/capture-paypal-arbitration', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paypalOrderId } = req.body || {};

    if (!paypalOrderId) {
      return res.status(400).json({ error: 'PayPal order ID is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    const pending = dispute.pendingPayPalArbitration;
    if (!pending || !pending.paypalOrderId || pending.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({ error: 'No pending PayPal arbitration payment found for this order' });
    }
    if (pending.userId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to capture this payment' });
    }

    const settings = await PaymentSettings.getSettings();
    const environment = getPayPalClient(settings);
    const client = new paypal.core.PayPalHttpClient(environment);
    const captureRequest = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    captureRequest.requestBody({});

    const captureResponse = await client.execute(captureRequest);
    if (captureResponse.statusCode !== 201) {
      return res.status(400).json({ error: 'Failed to capture PayPal payment' });
    }

    const claimantId = order.metadata?.disputeClaimantId ?? dispute.claimantId?.toString?.() ?? dispute.claimantId;
    const respondentId = order.metadata?.disputeRespondentId ?? dispute.respondentId?.toString?.() ?? dispute.respondentId;
    const isClientPayer = (order.client?._id || order.client)?.toString() === req.user.id;
    const payerRoleLabel = isClientPayer ? 'Client' : 'Professional';
    const arbitrationFeeDescription = `Dispute Arbitration Fee (${payerRoleLabel}) - Order ${order.orderNumber}`;

    if (!dispute.arbitrationPayments) dispute.arbitrationPayments = [];
    dispute.arbitrationPayments.push({
      userId: req.user.id,
      amount: pending.amount,
      paidAt: new Date(),
      paymentMethod: 'paypal',
      paypalOrderId: paypalOrderId,
      transactionId: null,
    });

    const feeDeadlineHoursRaw = typeof settings.arbitrationFeeDeadlineHours === 'number'
      ? settings.arbitrationFeeDeadlineHours
      : parseFloat(settings.arbitrationFeeDeadlineHours || '0');
    const fallbackDaysRaw = typeof settings.arbitrationFeeDeadlineDays === 'number'
      ? settings.arbitrationFeeDeadlineDays
      : parseFloat(settings.arbitrationFeeDeadlineDays || '1');
    const feeDeadlineHours = Number.isFinite(feeDeadlineHoursRaw) && feeDeadlineHoursRaw >= 0
      ? feeDeadlineHoursRaw
      : ((Number.isFinite(fallbackDaysRaw) ? fallbackDaysRaw : 1) * 24);
    if (dispute.arbitrationPayments.length === 1) {
      const feeDeadline = new Date();
      feeDeadline.setTime(feeDeadline.getTime() + feeDeadlineHours * 60 * 60 * 1000);
      dispute.arbitrationFeeDeadline = feeDeadline;
    }

    const paidUserIds = new Set(dispute.arbitrationPayments.map((p) => p.userId?.toString()));
    const bothPaid = paidUserIds.has(claimantId?.toString()) && paidUserIds.has(respondentId?.toString());

    dispute.pendingPayPalArbitration = undefined;
    dispute.arbitrationFeeAmount = pending.amount;

    if (!order.metadata) order.metadata = {};
    if (order.metadata.disputeClaimantId == null) order.metadata.disputeClaimantId = claimantId?.toString?.() ?? claimantId;
    if (order.metadata.disputeRespondentId == null) order.metadata.disputeRespondentId = respondentId?.toString?.() ?? respondentId;

    if (bothPaid) {
      dispute.status = 'admin_arbitration';
      dispute.arbitrationRequested = true;
      dispute.arbitrationRequestedBy = req.user.id;
      dispute.arbitrationRequestedAt = new Date();
      dispute.arbitrationFeeDeadline = null;
      order.metadata.disputeStatus = 'admin_arbitration';
      order.metadata.disputeArbitrationRequested = true;
      order.metadata.disputeArbitrationRequestedBy = req.user.id;
      order.metadata.disputeArbitrationRequestedAt = new Date();
    } else {
      order.metadata.disputeStatus = 'negotiation';
    }

    order.metadata.disputeArbitrationFeeAmount = pending.amount;
    order.metadata.disputeArbitrationFeeDeadline = dispute.arbitrationFeeDeadline;

    await dispute.save();
    await order.save();

    res.json({
      message: bothPaid
        ? 'Arbitration requested successfully. Admin will review the case.'
        : 'Arbitration fee paid. Waiting for the other party to pay.',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        arbitrationRequestedAt: dispute.arbitrationRequestedAt,
        arbitrationFeeDeadline: dispute.arbitrationFeeDeadline,
        arbitrationFeeAmount: dispute.arbitrationFeeAmount,
        arbitrationPayments: dispute.arbitrationPayments,
      },
    });
  } catch (error) {
    console.error('Capture PayPal arbitration error:', error);
    res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
  }
});

// Admin: Decide dispute (arbitration)
router.post('/:orderId/dispute/admin-decide', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { winnerId, decisionNotes } = req.body;

    if (!winnerId) {
      return res.status(400).json({ error: 'Winner ID is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is in admin arbitration
    const disputeStatusForOrder = order.metadata?.disputeStatus ?? dispute.status;
    if (disputeStatusForOrder !== 'admin_arbitration' || dispute.status !== 'admin_arbitration') {
      return res.status(400).json({ error: 'Dispute must be in admin arbitration phase' });
    }

    const paidUserIds = new Set((dispute.arbitrationPayments || []).map((p) => p.userId?.toString()));
    if (!paidUserIds.has(dispute.claimantId?.toString()) || !paidUserIds.has(dispute.respondentId?.toString())) {
      return res.status(400).json({ error: 'Both parties must pay the arbitration fee before a decision can be made' });
    }

    const claimantId = order.metadata?.disputeClaimantId ?? dispute.claimantId?.toString?.() ?? dispute.claimantId;
    const respondentId = order.metadata?.disputeRespondentId ?? dispute.respondentId?.toString?.() ?? dispute.respondentId;
    const loserId = winnerId === claimantId?.toString() ? respondentId?.toString() : claimantId?.toString();

    if (winnerId !== claimantId?.toString() && winnerId !== respondentId?.toString()) {
      return res.status(400).json({ error: 'Winner must be either the claimant or respondent' });
    }

    const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;
    const orderTotal = order.total;
    const arbitrationFee = order.metadata.disputeArbitrationFeeAmount || 0;

    // Determine winner and loser
    const isWinnerClient = order.client?._id?.toString() === winnerId || order.client?.toString() === winnerId;
    const isLoserClient = order.client?._id?.toString() === loserId || order.client?.toString() === loserId;

    // Winner gets order amount
    // Loser loses both arbitration fee and order amount
    if (isWinnerClient) {
      // Client wins - refund order amount
      const client = await User.findById(order.client?._id || order.client);
      if (client) {
        client.walletBalance = (client.walletBalance || 0) + orderTotal;
        await client.save();

        const refundTransaction = new Wallet({
          userId: client._id,
          type: 'deposit',
          amount: orderTotal,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          orderId: order._id,
          description: `Dispute Resolution - Order ${order.orderNumber}`,
          metadata: {
            orderNumber: order.orderNumber,
            disputeId: order.disputeId,
            reason: 'Admin arbitration decision - client won',
          },
        });
        await refundTransaction.save();
      }

      // Professional (loser) loses arbitration fee (already deducted when paid, but we record it)
      // Professional doesn't receive payout
    } else {
      // Professional wins - gets payout
      const professional = await User.findById(order.professional?._id || order.professional);
      if (professional) {
        // Check if funds were already released
        const fundsReleased = order.status === 'Completed';
        
        if (!fundsReleased) {
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
            description: `Dispute Resolution - Order ${order.orderNumber}`,
            metadata: {
              orderNumber: order.orderNumber,
              disputeId: order.disputeId,
              reason: 'Admin arbitration decision - professional won',
            },
          });
          await payoutTransaction.save();
        }
      }

      // Client (loser) loses arbitration fee (already deducted from their wallet, but we record it)
      // Client doesn't get refund
    }

    // Update order metadata
    order.metadata.disputeStatus = 'closed';
    order.metadata.disputeClosedAt = new Date();
    order.metadata.disputeWinnerId = winnerId;
    order.metadata.disputeLoserId = loserId;
    order.metadata.disputeAdminDecision = true;
    order.metadata.disputeDecisionNotes = decisionNotes || '';
    order.metadata.disputeDecidedBy = req.user.id;
    order.metadata.disputeDecidedAt = new Date();
    order.status = 'Completed';
    order.deliveryStatus = 'completed';

    await order.save();
    await syncCustomOfferMessageStatus(order);

    res.json({ 
      message: 'Dispute decided successfully',
      dispute: {
        id: order.disputeId,
        status: order.metadata.disputeStatus,
        winnerId: winnerId,
        loserId: loserId,
        decidedAt: order.metadata.disputeDecidedAt,
      }
    });
  } catch (error) {
    console.error('Admin decide dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to decide dispute' });
  }
});

// Cancel/Withdraw dispute
router.delete('/:orderId/dispute', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute by order reference (order.disputeId may be missing e.g. legacy or sync issue)
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Keep order.disputeId in sync for refund metadata and cleanup
    if (!order.disputeId) {
      order.disputeId = dispute.disputeId;
    }

    const disputeStatus = order.metadata?.disputeStatus ?? dispute.status;
    const claimantId = order.metadata?.disputeClaimantId ?? dispute.claimantId?.toString?.() ?? dispute.claimantId;
    const respondentId = order.metadata?.disputeRespondentId ?? dispute.respondentId?.toString?.() ?? dispute.respondentId;

    // Check if dispute is in a cancellable state (open, negotiation, or admin_arbitration)
    const cancellableStatuses = ['open', 'negotiation', 'admin_arbitration'];
    if (!cancellableStatuses.includes(disputeStatus)) {
      return res.status(400).json({ error: 'Dispute cannot be cancelled in its current state' });
    }

    // Check if user is either claimant or respondent
    const isClaimant = claimantId?.toString() === req.user.id;
    const isRespondent = respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'Only parties involved in the dispute can cancel it' });
    }

    // If arbitration was requested and fee was paid, we might want to refund it
    // For now, we'll just clear the dispute and restore the order to delivered status
    const arbitrationFeePaid = order.metadata?.disputeArbitrationFeePaid;
    const arbitrationFeeAmount = order.metadata?.disputeArbitrationFeeAmount;

    // Refund arbitration fee if it was paid (to the person who requested it)
    if (arbitrationFeePaid && arbitrationFeeAmount) {
      const arbitrationRequesterId = order.metadata?.disputeArbitrationRequestedBy;
      const requester = await User.findById(arbitrationRequesterId);
      
      if (requester) {
        requester.walletBalance = (requester.walletBalance || 0) + arbitrationFeeAmount;
        await requester.save();

        // Create refund transaction
        const refundTransaction = new Wallet({
          userId: requester._id,
          type: 'deposit',
          amount: arbitrationFeeAmount,
          balance: requester.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          orderId: order._id,
          description: `Dispute Cancellation - Arbitration Fee Refund - Order ${order.orderNumber}`,
          metadata: {
            orderNumber: order.orderNumber,
            disputeId: order.disputeId,
            reason: 'Dispute cancelled - arbitration fee refunded',
          },
        });
        await refundTransaction.save();
      }
    }

    // Clear dispute information and restore order to delivered status
    const previousDisputeId = order.disputeId;
    order.disputeId = null;
    order.status = 'In Progress'; // Restore to In Progress (which allows delivery)
    order.deliveryStatus = 'delivered'; // Restore to delivered status

    // Remove dispute document so order no longer shows as disputed
    await Dispute.deleteOne({ order: order._id });

    // Clear dispute metadata
    if (order.metadata) {
      delete order.metadata.disputeReason;
      delete order.metadata.disputeEvidence;
      delete order.metadata.disputeCreatedBy;
      delete order.metadata.disputeCreatedAt;
      delete order.metadata.disputeClaimantId;
      delete order.metadata.disputeRespondentId;
      delete order.metadata.disputeResponseDeadline;
      delete order.metadata.disputeRespondedAt;
      delete order.metadata.disputeResponseMessage;
      delete order.metadata.disputeNegotiationDeadline;
      delete order.metadata.disputeArbitrationRequested;
      delete order.metadata.disputeArbitrationRequestedBy;
      delete order.metadata.disputeArbitrationRequestedAt;
      delete order.metadata.disputeArbitrationFeePaid;
      delete order.metadata.disputeArbitrationFeeAmount;
      delete order.metadata.disputeArbitrationFeeTransactionId;
      delete order.metadata.disputeStatus;
      delete order.metadata.disputeClosedAt;
      delete order.metadata.disputeWinnerId;
      delete order.metadata.disputeLoserId;
      delete order.metadata.disputeAdminDecision;
      delete order.metadata.disputeDecisionNotes;
      delete order.metadata.disputeDecidedBy;
      delete order.metadata.disputeDecidedAt;
      delete order.metadata.disputeAutoClosed;
    }

    await order.save();
    await syncCustomOfferMessageStatus(order);

    res.json({ 
      message: 'Dispute cancelled successfully. Order restored to delivered status.',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        disputeId: null,
      }
    });
  } catch (error) {
    console.error('Cancel dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel dispute' });
  }
});

// Configure multer for additional info file uploads
const additionalInfoDir = path.join(__dirname, '..', 'uploads', 'attachments');
// Create attachments directory if it doesn't exist
fs.mkdir(additionalInfoDir, { recursive: true }).catch(() => {});

const additionalInfoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, additionalInfoDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const additionalInfoUpload = multer({
  storage: additionalInfoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Serve additional info attachment files
router.get('/attachments/:filename', (req, res) => {
  const filePath = path.join(additionalInfoDir, req.params.filename);
  if (existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Upload attachment file (for additional information before order creation)
router.post('/upload-attachment', authenticateToken, requireRole(['client']), additionalInfoUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileUrl = `/api/orders/attachments/${req.file.filename}`;
    
    // Determine file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype === 'application/pdf' || 
               req.file.mimetype === 'application/msword' ||
               req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               req.file.mimetype === 'text/plain') {
      fileType = 'document';
    }
    
    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: fileType
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
    }
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload attachment' });
  }
});

// Client: Submit additional information for order
router.post('/:orderId/additional-info', authenticateToken, requireRole(['client']), additionalInfoUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if additional info already submitted
    if (order.additionalInformation && order.additionalInformation.submittedAt) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Additional information has already been submitted for this order' });
    }

    const additionalFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        additionalFiles.push({
          url: `/api/orders/attachments/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Update order with additional information
    order.additionalInformation = {
      message: message || '',
      files: additionalFiles,
      submittedAt: new Date(),
    };

    await order.save();

    res.json({
      message: 'Additional information submitted successfully',
      additionalInformation: order.additionalInformation
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Additional info submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit additional information' });
  }
});

export default router;

import cron from 'node-cron';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendTemplatedEmail } from './notifier.js';
import { getIO } from './socket.js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const ABANDONED_CART_HOURS = parseInt(process.env.ABANDONED_CART_HOURS || '24', 10);

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
    console.error('[Abandoned Cart] Failed to emit notification:', error);
  }
}

function buildCartItemsHtml(items) {
  const listItems = items
    .slice(0, 5)
    .map((item) => `<li><strong>${item.title}</strong> × ${item.quantity}</li>`)
    .join('');
  const moreCount = items.length > 5 ? items.length - 5 : 0;
  const moreLine = moreCount > 0 ? `<li>And ${moreCount} more item(s)...</li>` : '';
  return `<ul>${listItems}${moreLine}</ul>`;
}

async function processAbandonedCarts() {
  try {
    const threshold = new Date(Date.now() - ABANDONED_CART_HOURS * 60 * 60 * 1000);

    const carts = await Cart.find({
      'items.0': { $exists: true },
      updatedAt: { $lte: threshold },
    }).populate('userId', 'firstName lastName email role isBlocked');

    for (const cart of carts) {
      const user = cart.userId;
      if (!user || user.role !== 'client' || user.isBlocked) continue;

      const updatedAt = cart.updatedAt ? new Date(cart.updatedAt) : null;
      const lastNotifiedFor = cart.abandonedCart?.lastNotifiedCartUpdatedAt
        ? new Date(cart.abandonedCart.lastNotifiedCartUpdatedAt)
        : null;

      if (updatedAt && lastNotifiedFor && updatedAt.getTime() === lastNotifiedFor.getTime()) {
        continue;
      }

      const itemCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const cartLink = `${CLIENT_ORIGIN}/cart`;
      const cartItemsHtml = buildCartItemsHtml(cart.items);

      const notification = await Notification.createNotification({
        userId: user._id,
        type: 'abandoned_cart',
        title: 'You left items in your cart',
        message: `You have ${itemCount} item${itemCount === 1 ? '' : 's'} waiting in your cart.`,
        link: '/cart',
        metadata: {
          itemCount,
          updatedAt: cart.updatedAt,
        },
      });

      await emitNotificationToUser(user._id, notification);

      await sendTemplatedEmail(
        user.email,
        'abandoned-cart',
        {
          firstName: user.firstName || 'there',
          cartItems: cartItemsHtml,
          cartLink,
        },
        'notification'
      );

      cart.abandonedCart = {
        lastNotifiedAt: new Date(),
        lastNotifiedCartUpdatedAt: cart.updatedAt,
      };
      await cart.save();
    }
  } catch (error) {
    console.error('[Abandoned Cart] Error processing abandoned carts:', error);
  }
}

export function startAbandonedCartScheduler() {
  cron.schedule('0 * * * *', async () => {
    await processAbandonedCarts();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
}

export async function triggerAbandonedCartCheck() {
  await processAbandonedCarts();
}

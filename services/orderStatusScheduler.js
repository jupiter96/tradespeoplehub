import cron from 'node-cron';
import Order from '../models/Order.js';

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
      'items.booking.time': { $exists: true, $ne: null },
    });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        // Get booking info from first item
        const booking = order.items?.[0]?.booking;
        if (!booking || !booking.date || !booking.time) {
          skippedCount++;
          continue;
        }

        // Parse booking date and time
        const bookingDate = new Date(booking.date);
        const [hours, minutes] = booking.time.split(':').map(Number);
        
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
}

/**
 * Manually trigger status update processing (for testing or admin use)
 */
export async function triggerOrderStatusUpdate() {
  await processOrderStatusUpdates();
}

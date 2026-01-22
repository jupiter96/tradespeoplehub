import cron from 'node-cron';
import Order from '../models/Order.js';
import PaymentSettings from '../models/PaymentSettings.js';

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
}

/**
 * Manually trigger cancellation processing (for testing or admin use)
 */
export async function triggerAutomaticCancellation() {
  await processAutomaticCancellations();
}

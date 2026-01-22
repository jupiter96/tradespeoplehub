import cron from 'node-cron';
import Order from '../models/Order.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';

async function processAutomaticDisputeClosures() {
  try {
    const now = new Date();
    
    // Find disputes that have passed their response deadline and are still open (not responded)
    const orders = await Order.find({
      status: 'disputed',
      'metadata.disputeStatus': 'open',
      'metadata.disputeResponseDeadline': { $lte: now },
      'metadata.disputeRespondedAt': null,
    }).populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    let closedCount = 0;
    for (const order of orders) {
      try {
        const claimantId = order.metadata.disputeClaimantId;
        const respondentId = order.metadata.disputeRespondentId;
        
        // Determine who won (the claimant, since respondent didn't respond)
        const winnerId = claimantId;
        const loserId = respondentId;

        // Get professional payout amount from order metadata
        const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;
        const orderTotal = order.total;

        // If claimant is the client, refund the order amount
        // If claimant is the professional, they keep the payout
        const isClaimantClient = order.client?._id?.toString() === claimantId || order.client?.toString() === claimantId;
        
        if (isClaimantClient) {
          // Client wins - refund the order amount to client
          const client = await User.findById(order.client?._id || order.client);
          if (client) {
            client.walletBalance = (client.walletBalance || 0) + orderTotal;
            await client.save();

            // Create refund transaction
            const refundTransaction = new Wallet({
              userId: client._id,
              type: 'deposit',
              amount: orderTotal,
              balance: client.walletBalance,
              status: 'completed',
              paymentMethod: 'wallet',
              orderId: order._id,
              description: `Dispute Refund - Order ${order.orderNumber}`,
              metadata: {
                orderNumber: order.orderNumber,
                disputeId: order.disputeId,
                reason: 'Dispute resolved in favor of client (no response from professional)',
              },
            });
            await refundTransaction.save();
          }

          // Professional doesn't receive payout (already handled if funds weren't released)
          // If funds were already released, we would need to deduct from professional
          // For now, we assume funds weren't released yet (order was delivered but not completed)
        } else {
          // Professional wins - they keep the payout (if not already released, release it)
          const professional = await User.findById(order.professional?._id || order.professional);
          if (professional) {
            // Check if funds were already released
            const fundsReleased = order.status === 'Completed';
            
            if (!fundsReleased) {
              // Release funds to professional
              professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
              await professional.save();

              // Create payout transaction
              const payoutTransaction = new Wallet({
                userId: professional._id,
                type: 'deposit',
                amount: professionalPayoutAmount,
                balance: professional.walletBalance,
                status: 'completed',
                paymentMethod: 'wallet',
                orderId: order._id,
                description: `Dispute Payout - Order ${order.orderNumber}`,
                metadata: {
                  orderNumber: order.orderNumber,
                  disputeId: order.disputeId,
                  reason: 'Dispute resolved in favor of professional (no response from client)',
                },
              });
              await payoutTransaction.save();
            }
          }
        }

        // Update order metadata
        order.metadata.disputeStatus = 'closed';
        order.metadata.disputeClosedAt = now;
        order.metadata.disputeWinnerId = winnerId;
        order.metadata.disputeAutoClosed = true;
        order.status = 'Cancelled'; // Mark order as cancelled after dispute closure
        order.deliveryStatus = 'cancelled';

        await order.save();
        closedCount++;
      } catch (orderError) {
        console.error(`[Dispute Scheduler] Error processing order ${order.orderNumber}:`, orderError);
      }
    }
    
    if (closedCount > 0) {
      console.log(`[Dispute Scheduler] Automatically closed ${closedCount} dispute(s)`);
    }
  } catch (error) {
    console.error('[Dispute Scheduler] Error in processAutomaticDisputeClosures:', error);
  }
}

export function startDisputeScheduler() {
  cron.schedule('* * * * *', async () => {
    await processAutomaticDisputeClosures();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });
}

export async function triggerAutomaticDisputeClosure() {
  await processAutomaticDisputeClosures();
}

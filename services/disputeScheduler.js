import cron from 'node-cron';
import Order from '../models/Order.js';
import Dispute from '../models/Dispute.js';
import Job from '../models/Job.js';
import JobDispute from '../models/JobDispute.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';

async function processAutomaticDisputeClosures() {
  try {
    const now = new Date();
    // Job disputes: response deadline passed with no response
    const jobOpenExpired = await JobDispute.find({
      status: 'open',
      responseDeadline: { $lte: now },
      respondedAt: null,
    });
    for (const dispute of jobOpenExpired) {
      try {
        const job = await Job.findById(dispute.jobId);
        if (!job) continue;
        const winnerId = dispute.claimantId?.toString();
        const loserId = dispute.respondentId?.toString();
        const milestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
        const amount = Number(milestone?.amount ?? dispute.amount ?? 0);
        const isWinnerClient = job.clientId?.toString() === winnerId;
        if (amount > 0) {
          const winner = await User.findById(winnerId).select('walletBalance');
          if (winner) {
            winner.walletBalance = (winner.walletBalance || 0) + amount;
            await winner.save();
            await Wallet.create({
              userId: winner._id,
              type: 'deposit',
              amount,
              balance: winner.walletBalance,
              status: 'completed',
              paymentMethod: 'wallet',
              jobId: job._id,
              milestoneId: dispute.milestoneId?.toString(),
              description: `Dispute auto-close ${isWinnerClient ? 'refund' : 'payout'} - ${job.title || 'Job'}`,
              metadata: { source: 'job_dispute_auto_close', disputeId: dispute._id.toString(), reason: 'No response before deadline' },
            });
          }
        }
        if (milestone) {
          milestone.status = 'cancelled';
          milestone.disputeId = dispute._id;
          job.markModified('milestones');
          await job.save();
        }
        dispute.messages = dispute.messages || [];
        dispute.messages.push({
          userId: dispute.claimantId,
          userName: 'Dispute team',
          userAvatar: '',
          message: 'Dispute resolved automatically due to no response before deadline.',
          timestamp: now,
          isTeamResponse: true,
        });
        dispute.status = 'closed';
        dispute.closedAt = now;
        dispute.winnerId = winnerId;
        dispute.loserId = loserId;
        dispute.autoClosed = true;
        dispute.decisionNotes = 'Auto-closed due to no response before deadline.';
        await dispute.save();
      } catch (jobErr) {
        console.error('[Dispute Scheduler] Error processing job dispute response deadline:', jobErr);
      }
    }

    // Job disputes: arbitration fee deadline passed and only one side paid
    const jobArbExpired = await JobDispute.find({
      status: 'negotiation',
      arbitrationFeeDeadline: { $lte: now },
      'arbitrationPayments.0': { $exists: true },
    });
    for (const dispute of jobArbExpired) {
      try {
        const paidUserIds = new Set((dispute.arbitrationPayments || []).map((p) => p.userId?.toString()));
        if (paidUserIds.size !== 1) continue;
        const winnerId = Array.from(paidUserIds)[0];
        const loserId = winnerId === dispute.claimantId?.toString() ? dispute.respondentId?.toString() : dispute.claimantId?.toString();
        const job = await Job.findById(dispute.jobId);
        if (!job) continue;
        const milestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
        const amount = Number(milestone?.amount ?? dispute.amount ?? 0);
        if (amount > 0) {
          const winner = await User.findById(winnerId).select('walletBalance');
          if (winner) {
            winner.walletBalance = (winner.walletBalance || 0) + amount;
            await winner.save();
            await Wallet.create({
              userId: winner._id,
              type: 'deposit',
              amount,
              balance: winner.walletBalance,
              status: 'completed',
              paymentMethod: 'wallet',
              jobId: job._id,
              milestoneId: dispute.milestoneId?.toString(),
              description: `Dispute auto-close payout - ${job.title || 'Job'}`,
              metadata: { source: 'job_dispute_auto_close', disputeId: dispute._id.toString(), reason: 'Other party did not pay arbitration fee' },
            });
          }
        }
        if (milestone) {
          milestone.status = 'cancelled';
          milestone.disputeId = dispute._id;
          job.markModified('milestones');
          await job.save();
        }
        dispute.messages = dispute.messages || [];
        dispute.messages.push({
          userId: dispute.claimantId,
          userName: 'Dispute team',
          userAvatar: '',
          message: 'Dispute resolved automatically because one party did not pay arbitration fee before deadline.',
          timestamp: now,
          isTeamResponse: true,
        });
        dispute.status = 'closed';
        dispute.closedAt = now;
        dispute.winnerId = winnerId;
        dispute.loserId = loserId;
        dispute.autoClosed = true;
        dispute.decisionNotes = 'Auto-closed due to unpaid arbitration fee.';
        await dispute.save();
      } catch (jobErr) {
        console.error('[Dispute Scheduler] Error processing job dispute arbitration deadline:', jobErr);
      }
    }

    
    // Find disputes that have passed their response deadline and are still open (not responded)
    const disputes = await Dispute.find({
      status: 'open',
      responseDeadline: { $lte: now },
      respondedAt: null,
    }).populate('order');

    let closedCount = 0;
    const processedOrderIds = new Set();
    for (const dispute of disputes) {
      try {
        const order = await Order.findById(dispute.order)
          .populate('client', 'walletBalance')
          .populate('professional', 'walletBalance');
        if (!order) {
          continue;
        }
        processedOrderIds.add(order._id.toString());
        const claimantId = dispute.claimantId?.toString();
        const respondentId = dispute.respondentId?.toString();
        
        // Determine who won (the claimant, since respondent didn't respond)
        const winnerId = claimantId;
        const loserId = respondentId;

        // Get professional payout amount from order metadata
        const refundableAmount = (order.subtotal || 0) - (order.discount || 0);
        const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || refundableAmount;
        const orderTotal = refundableAmount;

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

        // Get respondent name for the message
        const respondentName = dispute.respondentId === dispute.claimantId 
          ? (order.client?.firstName || order.client?.tradingName || 'the claimant')
          : (order.professional?.tradingName || order.professional?.firstName || 'the respondent');

        // Add resolution message to dispute messages
        const resolutionMessage = `Dispute resolved as ${respondentName} failed to respond within four days.`;
        dispute.messages.push({
          id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: dispute.claimantId,
          userName: 'Dispute team',
          userAvatar: '',
          message: resolutionMessage,
          timestamp: now,
          isTeamResponse: true,
          attachments: [],
        });

        // Update dispute
        dispute.status = 'closed';
        dispute.closedAt = now;
        dispute.winnerId = winnerId || null;
        dispute.loserId = loserId || null;
        dispute.autoClosed = true;
        dispute.decisionNotes = resolutionMessage;
        await dispute.save();

        // Update order metadata
        if (!order.metadata) order.metadata = {};
        order.metadata.disputeStatus = 'closed';
        order.metadata.disputeClosedAt = now;
        order.metadata.disputeWinnerId = winnerId;
        order.metadata.disputeAutoClosed = true;
        order.status = 'Completed';
        order.deliveryStatus = 'completed';

        await order.save();
        closedCount++;
      } catch (orderError) {
        console.error(`[Dispute Scheduler] Error processing dispute ${dispute.disputeId}:`, orderError);
      }
    }

    // Legacy fallback: close disputes stored only in order metadata
    const legacyOrders = await Order.find({
      status: 'disputed',
      'metadata.disputeStatus': 'open',
      'metadata.disputeResponseDeadline': { $lte: now },
      'metadata.disputeRespondedAt': null,
      _id: { $nin: Array.from(processedOrderIds) },
    }).populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    for (const order of legacyOrders) {
      try {
        const claimantId = order.metadata.disputeClaimantId;
        const respondentId = order.metadata.disputeRespondentId;

        const winnerId = claimantId;
        const loserId = respondentId;

        const refundableAmount = (order.subtotal || 0) - (order.discount || 0);
        const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || refundableAmount;
        const orderTotal = refundableAmount;

        const isClaimantClient = order.client?._id?.toString() === claimantId || order.client?.toString() === claimantId;

        if (isClaimantClient) {
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
              description: `Dispute Refund - Order ${order.orderNumber}`,
              metadata: {
                orderNumber: order.orderNumber,
                disputeId: order.disputeId,
                reason: 'Dispute resolved in favor of client (no response from professional)',
              },
            });
            await refundTransaction.save();
          }
        } else {
          const professional = await User.findById(order.professional?._id || order.professional);
          if (professional) {
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

        if (!order.metadata) order.metadata = {};
        order.metadata.disputeStatus = 'closed';
        order.metadata.disputeClosedAt = now;
        order.metadata.disputeWinnerId = winnerId;
        order.metadata.disputeAutoClosed = true;
        order.status = 'Completed';
        order.deliveryStatus = 'completed';

        // If a Dispute doc exists, update it too
        const existingDispute = await Dispute.findOne({ order: order._id });
        if (existingDispute) {
          // Get respondent name for the message
          const respondentName = isClaimantClient
            ? (order.professional?.tradingName || order.professional?.firstName || 'the respondent')
            : (order.client?.firstName || order.client?.tradingName || 'the respondent');

          // Add resolution message to dispute messages
          const resolutionMessage = `Dispute resolved as ${respondentName} failed to respond within four days.`;
          existingDispute.messages.push({
            id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: existingDispute.claimantId,
            userName: 'Dispute team',
            userAvatar: '',
            message: resolutionMessage,
            timestamp: now,
            isTeamResponse: true,
            attachments: [],
          });

          existingDispute.status = 'closed';
          existingDispute.closedAt = now;
          existingDispute.winnerId = winnerId || null;
          existingDispute.loserId = loserId || null;
          existingDispute.autoClosed = true;
          existingDispute.decisionNotes = resolutionMessage;
          await existingDispute.save();
        }

        await order.save();
        closedCount++;
      } catch (orderError) {
        console.error(`[Dispute Scheduler] Error processing legacy dispute for order ${order.orderNumber}:`, orderError);
      }
    }

    // Arbitration fee deadline: auto-close if only one party paid
    const arbitrationPending = await Dispute.find({
      status: 'negotiation',
      arbitrationFeeDeadline: { $lte: now },
      'arbitrationPayments.0': { $exists: true },
    }).populate('order');

    for (const dispute of arbitrationPending) {
      try {
        const order = await Order.findById(dispute.order)
          .populate('client', 'walletBalance')
          .populate('professional', 'walletBalance');
        if (!order) continue;

        const paidUserIds = new Set((dispute.arbitrationPayments || []).map((p) => p.userId?.toString()));
        if (paidUserIds.size !== 1) continue;

        const payerId = Array.from(paidUserIds)[0];
        const claimantId = dispute.claimantId?.toString();
        const respondentId = dispute.respondentId?.toString();
        if (payerId !== claimantId && payerId !== respondentId) continue;

        const winnerId = payerId;
        const loserId = payerId === claimantId ? respondentId : claimantId;

        const refundableAmount = (order.subtotal || 0) - (order.discount || 0);
        const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || refundableAmount;
        const orderTotal = refundableAmount;
        const isWinnerClient = order.client?._id?.toString() === winnerId || order.client?.toString() === winnerId;

        if (isWinnerClient) {
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
              description: `Dispute Refund - Order ${order.orderNumber}`,
              metadata: {
                orderNumber: order.orderNumber,
                disputeId: order.disputeId,
                reason: 'Dispute auto-closed due to unpaid arbitration fee by other party',
              },
            });
            await refundTransaction.save();
          }
        } else {
          const professional = await User.findById(order.professional?._id || order.professional);
          if (professional) {
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
                description: `Dispute Payout - Order ${order.orderNumber}`,
                metadata: {
                  orderNumber: order.orderNumber,
                  disputeId: order.disputeId,
                  reason: 'Dispute auto-closed due to unpaid arbitration fee by other party',
                },
              });
              await payoutTransaction.save();
            }
          }
        }

        // Get loser name for the message
        const loserName = loserId === claimantId
          ? (order.client?.firstName || order.client?.tradingName || 'the claimant')
          : (order.professional?.tradingName || order.professional?.firstName || 'the respondent');

        // Add resolution message to dispute messages
        const resolutionMessage = `Dispute resolved as ${loserName} failed to pay the arbitration fee within the deadline.`;
        dispute.messages.push({
          id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: dispute.claimantId,
          userName: 'Dispute team',
          userAvatar: '',
          message: resolutionMessage,
          timestamp: now,
          isTeamResponse: true,
          attachments: [],
        });

        dispute.status = 'closed';
        dispute.closedAt = now;
        dispute.winnerId = winnerId || null;
        dispute.loserId = loserId || null;
        dispute.autoClosed = true;
        dispute.decisionNotes = resolutionMessage;
        await dispute.save();

        if (!order.metadata) order.metadata = {};
        order.metadata.disputeStatus = 'closed';
        order.metadata.disputeClosedAt = now;
        order.metadata.disputeWinnerId = winnerId;
        order.metadata.disputeAutoClosed = true;
        order.status = 'Completed';
        order.deliveryStatus = 'completed';

        await order.save();
        closedCount++;
      } catch (orderError) {
        console.error(`[Dispute Scheduler] Error processing arbitration fee deadline for dispute ${dispute.disputeId}:`, orderError);
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

import cron from 'node-cron';
import mongoose from 'mongoose';
import CustomOffer from '../models/CustomOffer.js';
import Message from '../models/Message.js';
import Order from '../models/Order.js';

async function processExpiredCustomOffers() {
  try {
    const now = new Date();

    // Find offers that have passed their response deadline and are still pending
    const expiredOffers = await CustomOffer.find({
      status: 'pending',
      responseDeadline: { $lte: now },
    });

    let expiredCount = 0;
    for (const offer of expiredOffers) {
      try {
        // Update offer status
        offer.status = 'expired';
        offer.expiredAt = new Date();
        await offer.save();

        // Update message (chat preview card)
        const message = await Message.findById(offer.message);
        if (message && message.orderDetails) {
          message.orderDetails.status = 'expired';
          message.markModified('orderDetails');
          await message.save();
        }

        // Update related order status to "offer expired"
        // Prefer direct relation via offer.order, then metadata by ObjectId, then by string id.
        let order = null;
        if (offer.order) {
          order = await Order.findById(offer.order);
        }
        if (!order) {
          order = await Order.findOne({
            'metadata.fromCustomOffer': true,
            'metadata.customOfferId': offer._id,
          });
        }
        if (!order && offer._id) {
          order = await Order.findOne({
            'metadata.fromCustomOffer': true,
            'metadata.customOfferId': offer._id.toString(),
          });
        }
        if (order) {
          order.status = 'offer expired';
          if (!order.metadata) order.metadata = {};
          order.metadata.customOfferStatus = 'expired';
          order.markModified('metadata');
          await order.save();
          expiredCount++;
        } else {
          console.warn(`Custom offer ${offer._id}: no related order found (order ref: ${offer.order})`);
        }
      } catch (error) {
        console.error(`Error processing expired offer ${offer._id}:`, error);
      }
    }

    // Fallback: expire orders that are still "offer created" but responseDeadline has passed
    // (covers orders where CustomOffer link is missing, or metadata.responseDeadline is stored as string)
    const ordersToCheck = await Order.find({
      status: 'offer created',
      'metadata.fromCustomOffer': true,
      'metadata.responseDeadline': { $exists: true, $ne: null },
    });
    for (const order of ordersToCheck) {
      try {
        const rd = order.metadata?.responseDeadline;
        const deadline = rd ? new Date(rd) : null;
        if (!deadline || isNaN(deadline.getTime())) continue;
        if (deadline.getTime() <= now.getTime()) {
          order.status = 'offer expired';
          if (!order.metadata) order.metadata = {};
          order.metadata.customOfferStatus = 'expired';
          order.markModified('metadata');
          await order.save();
          expiredCount++;
          // Optionally sync CustomOffer if we have the id
          const offerId = order.metadata?.customOfferId;
          if (offerId && mongoose.Types.ObjectId.isValid(offerId)) {
            const co = await CustomOffer.findById(offerId);
            if (co && co.status === 'pending') {
              co.status = 'expired';
              co.expiredAt = new Date();
              await co.save();
            }
          }
        }
      } catch (err) {
        console.error(`Error expiring order ${order._id}:`, err);
      }
    }

    if (expiredCount > 0) {
      console.log(`✅ Processed ${expiredCount} expired custom offer(s) / order(s)`);
    }
  } catch (error) {
    console.error('❌ Error processing expired custom offers:', error);
  }
}

export function startCustomOfferScheduler() {
  // Run every 5 minutes to check for expired offers
  cron.schedule('*/5 * * * *', async () => {
    await processExpiredCustomOffers();
  });
  
  // Run immediately on startup
  processExpiredCustomOffers();
}

import cron from 'node-cron';
import CustomOffer from '../models/CustomOffer.js';
import Message from '../models/Message.js';

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

        // Update message
        const message = await Message.findById(offer.message);
        if (message && message.orderDetails) {
          message.orderDetails.status = 'expired';
          await message.save();
        }

        expiredCount++;
      } catch (error) {
        console.error(`Error processing expired offer ${offer._id}:`, error);
      }
    }

    if (expiredCount > 0) {
      console.log(`✅ Processed ${expiredCount} expired custom offer(s)`);
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

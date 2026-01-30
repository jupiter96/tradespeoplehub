/**
 * One-time migration for review-by-service:
 * 1. Drops old unique index on Review.order if it exists (so compound order+service unique works).
 * 2. Optionally backfills Review.service from order.items[0].serviceId for reviews with service null.
 *
 * Run once: node --experimental-vm-modules utils/migrateReviewService.js
 * Or require from server after DB connect and call runMigrateReviewService().
 */
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { updateServiceReviewStats } from './reviewService.js';

export async function runMigrateReviewService(options = {}) {
  const { backfillService = true } = options;
  const conn = mongoose.connection;
  if (conn.readyState !== 1) {
    throw new Error('Database not connected');
  }

  try {
    const coll = conn.collection('reviews');
    const indexes = await coll.indexes();
    const orderOnlyUnique = indexes.find(
      (i) => i.key && i.key.order === 1 && Object.keys(i.key).length === 1 && i.unique
    );
    if (orderOnlyUnique) {
      await coll.dropIndex('order_1');
      console.log('Dropped old unique index on order');
    }

    if (backfillService) {
      const withNull = await Review.find({ service: null }).lean();
      for (const rev of withNull) {
        const order = await Order.findById(rev.order).select('items').lean();
        const serviceId = order?.items?.[0]?.serviceId;
        if (serviceId) {
          await Review.updateOne(
            { _id: rev._id },
            { $set: { service: typeof serviceId === 'string' ? new mongoose.Types.ObjectId(serviceId) : serviceId } }
          );
          await updateServiceReviewStats(serviceId.toString());
        }
      }
      console.log(`Backfilled service for ${withNull.length} reviews`);
    }
  } catch (err) {
    console.error('migrateReviewService error', err);
    throw err;
  }
}

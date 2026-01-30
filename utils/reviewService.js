import Review from '../models/Review.js';
import mongoose from 'mongoose';

/**
 * Recalculate and update Service.rating and Service.reviewCount from reviews
 * for the given service. Call after creating/updating/deleting a review.
 * @param {mongoose.Types.ObjectId} serviceId - Service _id
 */
export async function updateServiceReviewStats(serviceId) {
  if (!serviceId) return;
  const Service = (await import('../models/Service.js')).default;
  const stats = await Review.aggregate([
    { $match: { service: new mongoose.Types.ObjectId(serviceId), isHidden: { $ne: true } } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  const rating = stats[0] ? (stats[0].avgRating || 0) : 0;
  const reviewCount = stats[0] ? (stats[0].reviewCount || 0) : 0;
  await Service.findByIdAndUpdate(serviceId, {
    rating: Math.round(rating * 10) / 10,
    reviewCount,
  });
}

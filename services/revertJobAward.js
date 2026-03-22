import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

/**
 * Undo an awaiting-accept award: refund escrow milestones to client wallet, set job to open,
 * clear award state (same behaviour as professional reject-award).
 *
 * @param {import('mongoose').Document} job - Job document (awaiting-accept)
 * @param {{ walletMetadataSource?: string, refundDescription?: string }} [options]
 */
export async function revertJobAwardToOpen(job, options = {}) {
  const walletMetadataSource = options.walletMetadataSource || 'job_award_rejected';
  const refundDescription =
    options.refundDescription ||
    (walletMetadataSource === 'job_award_expired'
      ? `Job award expired - refund - ${job.title || 'Job'}`
      : `Job award rejected - refund - ${job.title || 'Job'}`);

  const proId = job.awardedProfessionalId?.toString?.();
  const refundTotal = (job.milestones || []).reduce((sum, m) => sum + (m.amount || 0), 0);
  if (refundTotal > 0) {
    const client = await User.findById(job.clientId).select('walletBalance');
    if (client) {
      client.walletBalance = (client.walletBalance || 0) + refundTotal;
      await client.save();
      await Wallet.create({
        userId: job.clientId,
        type: 'refund',
        amount: refundTotal,
        balance: client.walletBalance,
        status: 'completed',
        paymentMethod: 'wallet',
        description: refundDescription,
        metadata: { jobId: job._id.toString(), source: walletMetadataSource },
      });
    }
  }
  job.status = 'open';
  job.awardedProfessionalId = null;
  job.awardPendingAt = null;
  const awardedQuote = (job.quotes || []).find(
    (q) => q.professionalId && q.professionalId.toString() === proId
  );
  if (awardedQuote) awardedQuote.status = 'pending';
  job.milestones = [];
  job.requestedMilestonePlan = [];
  job.markModified('quotes');
  job.markModified('milestones');
  job.markModified('requestedMilestonePlan');
}

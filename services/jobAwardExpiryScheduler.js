import cron from 'node-cron';
import Job from '../models/Job.js';
import PaymentSettings from '../models/PaymentSettings.js';
import { getIO } from './socket.js';
import { revertJobAwardToOpen } from './revertJobAward.js';

function emitJobUpdated(job) {
  try {
    const io = getIO();
    const jobId = job._id.toString();
    const clientId = job.clientId?.toString?.();
    if (clientId) io.to(`user:${clientId}`).emit('job:updated', { jobId });
    (job.quotes || []).forEach((q) => {
      const proId = q.professionalId?.toString?.();
      if (proId) io.to(`user:${proId}`).emit('job:updated', { jobId });
    });
  } catch (_) {}
}

async function processExpiredJobAwards() {
  try {
    const settings = await PaymentSettings.getSettings();
    const hours = settings.waitingTimeToAcceptJobAwardHours ?? 0;
    if (hours <= 0) return;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const candidates = await Job.find({
      status: 'awaiting-accept',
      awardPendingAt: { $ne: null, $lte: cutoff },
    });

    for (const job of candidates) {
      try {
        await revertJobAwardToOpen(job, {
          walletMetadataSource: 'job_award_expired',
        });
        await job.save();
        emitJobUpdated(job);
      } catch (e) {
        console.error(`[Job Award Expiry] Failed for job ${job._id}:`, e);
      }
    }
    if (candidates.length > 0) {
      console.log(`[Job Award Expiry] Processed ${candidates.length} expired award(s)`);
    }
  } catch (error) {
    console.error('[Job Award Expiry] Error in processExpiredJobAwards:', error);
  }
}

export function startJobAwardExpiryScheduler() {
  cron.schedule('*/10 * * * *', async () => {
    await processExpiredJobAwards();
  });
  console.log('[Job Award Expiry] Started (runs every 10 minutes)');
}

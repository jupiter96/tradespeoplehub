import cron from 'node-cron';
import Job from '../models/Job.js';
import PaymentSettings from '../models/PaymentSettings.js';

/**
 * Close open jobs that are older than the configured closedJobDays.
 * Closed jobs no longer accept new quotes.
 */
async function processClosedJobs() {
  try {
    const settings = await PaymentSettings.getSettings();
    const closedJobDays = settings.closedJobDays ?? 30;
    if (closedJobDays <= 0) return;

    const cutoff = new Date(Date.now() - closedJobDays * 24 * 60 * 60 * 1000);
    const result = await Job.updateMany(
      { status: 'open', postedAt: { $lt: cutoff } },
      { $set: { status: 'closed' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Job Closed Scheduler] Automatically closed ${result.modifiedCount} job(s) (older than ${closedJobDays} days)`);
    }
  } catch (error) {
    console.error('[Job Closed Scheduler] Error in processClosedJobs:', error);
  }
}

export function startJobClosedScheduler() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await processClosedJobs();
  });
  console.log('[Job Closed Scheduler] Started (runs hourly)');
}

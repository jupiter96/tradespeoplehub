import cron from 'node-cron';
import User from '../models/User.js';
import { sendTemplatedEmail } from './notifier.js';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

/**
 * Check if professional needs verification reminder
 * Returns true if:
 * - User is professional
 * - Not blocked
 * - Missing ID, address, or insurance verification
 * - Within 4 months of signup
 * - Hasn't exceeded reminder limits
 */
function needsVerificationReminder(user) {
  if (user.role !== 'professional') return false;
  if (user.isBlocked) return false;
  if (user.verificationReminder?.reminderStopped) return false;

  // Check if user is missing required verifications
  const missingVerifications = [];
  
  // Check ID card
  if (!user.verification?.idCard?.documentUrl || 
      user.verification?.idCard?.status !== 'verified') {
    missingVerifications.push('ID');
  }
  
  // Check address
  if (!user.verification?.address?.documentUrl || 
      user.verification?.address?.status !== 'verified') {
    missingVerifications.push('address');
  }
  
  // Check insurance (if they have public liability)
  if (user.hasPublicLiability === 'yes' && 
      (!user.verification?.publicLiabilityInsurance?.documentUrl || 
       user.verification?.publicLiabilityInsurance?.status !== 'verified')) {
    missingVerifications.push('insurance');
  }

  // If all verifications are complete, no reminder needed
  if (missingVerifications.length === 0) return false;

  // Check if within 4 months of signup
  const signupDate = new Date(user.createdAt);
  const now = new Date();
  const fourMonthsAgo = new Date(now);
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
  
  if (signupDate < fourMonthsAgo) {
    // Stop reminders after 4 months
    user.verificationReminder = user.verificationReminder || {};
    user.verificationReminder.reminderStopped = true;
    user.save().catch(err => console.error('Failed to stop reminders:', err));
    return false;
  }

  // Check reminder limits
  const reminder = user.verificationReminder || {};
  const weeklyReminders = reminder.weeklyRemindersSent || 0;
  const monthlyReminders = reminder.monthlyRemindersSent || 0;

  // First month: max 4 weekly reminders
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  if (signupDate >= oneMonthAgo) {
    // Still in first month - check weekly limit
    if (weeklyReminders >= 4) return false;
    
    // Check if it's been at least 1 week since signup
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (signupDate > oneWeekAgo) return false;
    
    // Check if it's been at least 1 week since last reminder
    if (reminder.lastSentAt) {
      const lastSent = new Date(reminder.lastSentAt);
      const oneWeekSinceLastSent = new Date(lastSent);
      oneWeekSinceLastSent.setDate(oneWeekSinceLastSent.getDate() + 7);
      if (now < oneWeekSinceLastSent) return false;
    }
    
    return true;
  } else {
    // After first month - check monthly limit
    if (monthlyReminders >= 3) return false;
    
    // Check if it's been at least 1 month since last reminder
    if (reminder.lastSentAt) {
      const lastSent = new Date(reminder.lastSentAt);
      const oneMonthSinceLastSent = new Date(lastSent);
      oneMonthSinceLastSent.setMonth(oneMonthSinceLastSent.getMonth() + 1);
      if (now < oneMonthSinceLastSent) return false;
    } else {
      // First monthly reminder - should be sent 1 month after signup
      const oneMonthAfterSignup = new Date(signupDate);
      oneMonthAfterSignup.setMonth(oneMonthAfterSignup.getMonth() + 1);
      if (now < oneMonthAfterSignup) return false;
    }
    
    return true;
  }
}

/**
 * Send verification reminder email to a user
 */
async function sendVerificationReminder(user) {
  try {
    const verificationLink = `${CLIENT_ORIGIN}/account`;
    
    // Send verification reminder email (category: verification -> SMTP_USER_VERIFICATION)
    await sendTemplatedEmail(user.email, 'reminder-identity', {
      firstName: user.firstName,
      verificationLink: verificationLink,
    }, 'verification'); // Category: verification -> Uses SMTP_USER_VERIFICATION

    // Update reminder tracking
    const reminder = user.verificationReminder || {};
    reminder.lastSentAt = new Date();
    
    // Determine if this is weekly or monthly reminder
    const signupDate = new Date(user.createdAt);
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    if (signupDate >= oneMonthAgo) {
      // First month - weekly reminder
      reminder.weeklyRemindersSent = (reminder.weeklyRemindersSent || 0) + 1;
    } else {
      // After first month - monthly reminder
      reminder.monthlyRemindersSent = (reminder.monthlyRemindersSent || 0) + 1;
    }
    
    user.verificationReminder = reminder;
    await user.save();
    
    // console.log(`[Verification Reminder] Sent to ${user.email} (${user.firstName} ${user.lastName})`);
    return true;
  } catch (error) {
    // console.error(`[Verification Reminder] Failed to send to ${user.email}:`, error);
    return false;
  }
}

/**
 * Process verification reminders for all eligible professionals
 * This function is called by the cron job
 */
async function processVerificationReminders() {
  try {
    // console.log('[Verification Reminder] Starting reminder processing...');
    
    // Find all professional users
    const professionals = await User.find({
      role: 'professional',
      isBlocked: { $ne: true },
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of professionals) {
      if (needsVerificationReminder(user)) {
        const sent = await sendVerificationReminder(user);
        if (sent) {
          sentCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    // console.log(`[Verification Reminder] Processed ${professionals.length} professionals. Sent: ${sentCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    // console.error('[Verification Reminder] Error processing reminders:', error);
  }
}

/**
 * Initialize the verification reminder scheduler
 * Runs every Monday at 9 AM
 */
export function startVerificationReminderScheduler() {
  // Run every Monday at 9:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // '0 9 * * 1' = 9:00 AM every Monday
  cron.schedule('0 9 * * 1', async () => {
    // console.log('[Verification Reminder] Weekly cron job triggered');
    await processVerificationReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  // Also run on the 1st of every month at 9:00 AM for monthly reminders
  cron.schedule('0 9 1 * *', async () => {
    // console.log('[Verification Reminder] Monthly cron job triggered');
    await processVerificationReminders();
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  // console.log('[Verification Reminder] Scheduler started');
  // console.log('[Verification Reminder] Weekly reminders: Every Monday at 9:00 AM UTC');
  // console.log('[Verification Reminder] Monthly reminders: 1st of every month at 9:00 AM UTC');
}

/**
 * Manually trigger reminder processing (for testing or admin use)
 */
export async function triggerVerificationReminders() {
  await processVerificationReminders();
}




import ProBidBalance from '../models/ProBidBalance.js';
import PaymentSettings from '../models/PaymentSettings.js';

/**
 * Get or create balance for a professional and ensure free quote credits reset each month.
 * Uses PaymentSettings.freeBidsPerMonth for the monthly free credit allowance (one credit per quote).
 */
export async function getOrCreateBalance(userId) {
  const paymentSettings = await PaymentSettings.getSettings();
  const settings = { freeBidsPerMonth: paymentSettings.freeBidsPerMonth ?? 3 };
  let balance = await ProBidBalance.findOne({ userId });
  const now = new Date();
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (!balance) {
    balance = await ProBidBalance.create({
      userId,
      freeBidsRemaining: settings.freeBidsPerMonth ?? 0,
      freeBidsResetAt: startOfNextMonth,
      purchasedBlocks: [],
    });
  } else {
    await ProBidBalance.ensureFreeBidsReset(balance, settings);
    balance = await ProBidBalance.findOne({ userId });
  }

  const free = balance.freeBidsRemaining ?? 0;
  const blocks = balance.purchasedBlocks || [];
  const validBlocks = blocks.filter((b) => new Date(b.expiresAt) > now);
  const purchasedTotal = validBlocks.reduce((sum, b) => sum + (b.bids || 0), 0);
  const totalAvailable = free + purchasedTotal;

  return {
    balance,
    totalAvailable,
    freeBidsRemaining: free,
    purchasedTotal,
    freeBidsResetAt: balance.freeBidsResetAt,
    purchasedBlocks: validBlocks,
  };
}

/**
 * Deduct one bid from the professional's balance (free first, then oldest purchased block).
 * @returns {{ ok: false } | { ok: true, source: 'free' | 'purchased' }}
 */
export async function deductBid(professionalId) {
  const { balance, totalAvailable } = await getOrCreateBalance(professionalId);
  if (totalAvailable < 1) return { ok: false };

  const free = balance.freeBidsRemaining ?? 0;
  const now = new Date();

  if (free >= 1) {
    balance.freeBidsRemaining = free - 1;
    await balance.save();
    return { ok: true, source: 'free' };
  }

  const blocks = (balance.purchasedBlocks || []).filter((b) => new Date(b.expiresAt) > now);
  if (blocks.length === 0) return { ok: false };
  const first = blocks[0];
  const idx = balance.purchasedBlocks.findIndex(
    (b) => b.expiresAt && b.expiresAt.getTime && b.expiresAt.getTime() === first.expiresAt.getTime()
  );
  if (idx === -1) return { ok: false };
  balance.purchasedBlocks[idx].bids -= 1;
  if (balance.purchasedBlocks[idx].bids <= 0) {
    balance.purchasedBlocks = balance.purchasedBlocks.filter(
      (b, i) => i !== idx && new Date(b.expiresAt) > now
    );
  }
  balance.markModified('purchasedBlocks');
  await balance.save();
  return { ok: true, source: 'purchased' };
}

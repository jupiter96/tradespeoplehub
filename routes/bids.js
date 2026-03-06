import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import ProBidBalance from '../models/ProBidBalance.js';
import User from '../models/User.js';
import { getOrCreateBalance, deductBid } from '../services/bids.js';

const router = express.Router();

const PLAN_SLUGS = ['basic', 'standard', 'premium'];

function getPlansFromPaymentSettings(ps) {
  return [
    { id: 'basic', name: 'Basic', price: ps.basicPlanPrice ?? 5, bids: ps.basicPlanBids ?? 2 },
    { id: 'standard', name: 'Standard', price: ps.standardPlanPrice ?? 10, bids: ps.standardPlanBids ?? 5 },
    { id: 'premium', name: 'Premium', price: ps.premiumPlanPrice ?? 15, bids: ps.premiumPlanBids ?? 15 },
  ];
}

/**
 * GET /api/bids/balance
 * Professional only. Returns current bid balance (free + purchased), reset date, and purchased blocks.
 */
router.get('/balance', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { balance, totalAvailable, freeBidsRemaining, purchasedTotal, freeBidsResetAt, purchasedBlocks } =
      await getOrCreateBalance(req.user.id);
    return res.json({
      freeBidsRemaining,
      purchasedTotal,
      totalAvailable,
      freeBidsResetAt: freeBidsResetAt || balance.freeBidsResetAt,
      purchasedBlocks: (purchasedBlocks || []).map((b) => ({
        bids: b.bids,
        expiresAt: b.expiresAt,
      })),
    });
  } catch (err) {
    console.error('[Bids] Balance error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get bid balance' });
  }
});

/**
 * GET /api/bids/plans
 * List bid plans from Payment Settings (Basic, Standard, Premium) and pricePerBid for custom quantity.
 */
router.get('/plans', async (req, res) => {
  try {
    const ps = await PaymentSettings.getSettings();
    const plans = getPlansFromPaymentSettings(ps);
    const planList = plans.map((p) => ({
      id: p.id,
      name: p.name,
      bids: p.bids,
      amountPence: Math.round((p.price || 0) * 100),
      amountFormatted: `£${(p.price ?? 0).toFixed(2)}`,
      validityMonths: 1,
    }));
    return res.json({
      plans: planList,
      pricePerBid: ps.pricePerBid ?? 2.5,
    });
  } catch (err) {
    console.error('[Bids] Plans list error:', err);
    return res.status(500).json({ error: err.message || 'Failed to list plans' });
  }
});

/**
 * POST /api/bids/purchase
 * Professional only. Body: { planId }. Deducts from pro's wallet and adds a bid block (valid 1 month).
 */
router.post('/purchase', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plan ID is required' });

    const slug = String(planId).toLowerCase();
    if (!PLAN_SLUGS.includes(slug)) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const ps = await PaymentSettings.getSettings();
    const plans = getPlansFromPaymentSettings(ps);
    const plan = plans.find((p) => p.id === slug);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const amountPounds = plan.price ?? 0;
    const user = await User.findById(req.user.id).select('walletBalance').lean();
    const walletBalance = user?.walletBalance ?? 0;
    if (walletBalance < amountPounds) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        requiredFormatted: `£${amountPounds.toFixed(2)}`,
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { walletBalance: -amountPounds } },
      { new: true }
    );

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    let proBalance = await ProBidBalance.findOne({ userId: req.user.id });
    const paymentSettings = await PaymentSettings.getSettings();
    const freeBids = paymentSettings.freeBidsPerMonth ?? 3;
    const now = new Date();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (!proBalance) {
      proBalance = await ProBidBalance.create({
        userId: req.user.id,
        freeBidsRemaining: freeBids,
        freeBidsResetAt: startOfNextMonth,
        purchasedBlocks: [{ bids: plan.bids, expiresAt }],
      });
    } else {
      proBalance.purchasedBlocks = proBalance.purchasedBlocks || [];
      proBalance.purchasedBlocks.push({ bids: plan.bids, expiresAt });
      proBalance.markModified('purchasedBlocks');
      await proBalance.save();
    }

    const { totalAvailable, freeBidsRemaining, purchasedTotal } = await getOrCreateBalance(req.user.id);
    return res.json({
      message: 'Plan purchased',
      plan: { name: plan.name, bids: plan.bids },
      balance: { totalAvailable, freeBidsRemaining, purchasedTotal },
    });
  } catch (err) {
    console.error('[Bids] Purchase error:', err);
    return res.status(500).json({ error: err.message || 'Failed to purchase plan' });
  }
});

/**
 * POST /api/bids/purchase-custom
 * Professional only. Body: { quantity } (number of bids). Total = quantity * pricePerBid from PaymentSettings.
 */
router.post('/purchase-custom', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const quantity = typeof req.body.quantity === 'number' ? req.body.quantity : parseInt(req.body.quantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    const maxQuantity = 500;
    if (quantity > maxQuantity) {
      return res.status(400).json({ error: `Quantity cannot exceed ${maxQuantity}` });
    }

    const ps = await PaymentSettings.getSettings();
    const pricePerBid = ps.pricePerBid ?? 2.5;
    const amountPounds = quantity * pricePerBid;

    const user = await User.findById(req.user.id).select('walletBalance').lean();
    const walletBalance = user?.walletBalance ?? 0;
    if (walletBalance < amountPounds) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        requiredFormatted: `£${amountPounds.toFixed(2)}`,
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { walletBalance: -amountPounds } },
      { new: true }
    );

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    let proBalance = await ProBidBalance.findOne({ userId: req.user.id });
    const freeBids = ps.freeBidsPerMonth ?? 3;
    const now = new Date();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (!proBalance) {
      proBalance = await ProBidBalance.create({
        userId: req.user.id,
        freeBidsRemaining: freeBids,
        freeBidsResetAt: startOfNextMonth,
        purchasedBlocks: [{ bids: quantity, expiresAt }],
      });
    } else {
      proBalance.purchasedBlocks = proBalance.purchasedBlocks || [];
      proBalance.purchasedBlocks.push({ bids: quantity, expiresAt });
      proBalance.markModified('purchasedBlocks');
      await proBalance.save();
    }

    const { totalAvailable, freeBidsRemaining, purchasedTotal } = await getOrCreateBalance(req.user.id);
    return res.json({
      message: `${quantity} bid${quantity !== 1 ? 's' : ''} purchased`,
      quantity,
      totalPaid: amountPounds,
      balance: { totalAvailable, freeBidsRemaining, purchasedTotal },
    });
  } catch (err) {
    console.error('[Bids] Purchase-custom error:', err);
    return res.status(500).json({ error: err.message || 'Failed to purchase bids' });
  }
});

export { deductBid };
export default router;

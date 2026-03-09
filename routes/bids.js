import express from 'express';
import crypto from 'crypto';
import { createRequire } from 'module';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import ProBidBalance from '../models/ProBidBalance.js';
import User from '../models/User.js';
import CreditPurchase from '../models/CreditPurchase.js';
import { getOrCreateBalance, deductBid } from '../services/bids.js';

const requirePdf = createRequire(import.meta.url);
const PDFDocument = requirePdf('pdfkit');

const CURRENCY_RATES = { GBP: 1, USD: 1 / 0.75, EUR: 0.87 / 0.75 };
const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€' };
function formatAmountInCurrency(gbpAmount, currencyCode = 'GBP') {
  const code = ['GBP', 'USD', 'EUR'].includes(currencyCode) ? currencyCode : 'GBP';
  const rate = CURRENCY_RATES[code];
  const symbol = CURRENCY_SYMBOLS[code];
  const value = (Number(gbpAmount) * rate).toFixed(2);
  return `${symbol}${value}`;
}

function generateInvoiceNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-CRED-${date}-${rand}`;
}

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

    const planName = (plan.name || 'Basic').trim();
    const invoiceNumber = generateInvoiceNumber();
    await CreditPurchase.create({
      userId: req.user.id,
      purchasedAt: new Date(),
      credits: plan.bids,
      amountPounds,
      planName: ['Basic', 'Standard', 'Premium'].includes(planName) ? planName : 'Basic',
      invoiceNumber,
    });

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

    const invoiceNumber = generateInvoiceNumber();
    await CreditPurchase.create({
      userId: req.user.id,
      purchasedAt: new Date(),
      credits: quantity,
      amountPounds,
      planName: 'Custom',
      invoiceNumber,
    });

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

/**
 * GET /api/bids/history
 * Professional only. Returns all credit purchases for the current user (newest first).
 */
router.get('/history', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const list = await CreditPurchase.find({ userId: req.user.id })
      .sort({ purchasedAt: -1 })
      .lean();
    const history = list.map((doc) => ({
      id: doc._id.toString(),
      purchasedAt: doc.purchasedAt,
      credits: doc.credits,
      amountPounds: doc.amountPounds,
      planName: doc.planName,
      invoiceNumber: doc.invoiceNumber,
    }));
    return res.json({ history });
  } catch (err) {
    console.error('[Bids] History error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get history' });
  }
});

/**
 * GET /api/bids/invoice/:id
 * Professional only. Returns PDF invoice for the given credit purchase id.
 */
router.get('/invoice/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const purchase = await CreditPurchase.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();
    if (!purchase) return res.status(404).json({ error: 'Invoice not found' });

    const currency = ['GBP', 'USD', 'EUR'].includes(req.query.currency) ? req.query.currency : 'GBP';
    const user = await User.findById(req.user.id)
      .select('firstName lastName tradingName address postcode townCity county')
      .lean();
    const proName = (user?.tradingName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Professional').trim();
    const addressParts = [user?.address, user?.townCity, user?.county, user?.postcode].filter(Boolean);
    const proAddress = addressParts.length > 0 ? addressParts.join(', ') : '';

    const invoiceDate = new Date(purchase.purchasedAt).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const description = purchase.planName === 'Custom'
      ? `Quote credits – Custom (${purchase.credits} credits)`
      : `Quote credits – ${purchase.planName} plan (${purchase.credits} credits)`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${purchase.invoiceNumber}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e');
    doc.text('Sortars.com', 50, 50);
    doc.moveDown(0.5);

    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('INVOICE', 400, 50, { width: 150, align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b6b6b');
    doc.text(`Invoice # ${purchase.invoiceNumber}`, 400, 78, { width: 150, align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 400, 92, { width: 150, align: 'right' });
    doc.text(`Currency: ${currency}`, 400, 106, { width: 150, align: 'right' });

    let y = 120;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Bill To', 50, y);
    doc.font('Helvetica').fillColor('#333');
    doc.text(proName, 50, y + 14);
    if (proAddress) doc.text(proAddress, 50, y + 28, { width: 260 });

    doc.font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Service Provider', 320, y);
    doc.font('Helvetica').fillColor('#333');
    doc.text('Sortars', 320, y + 14);
    y += 60;

    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 20;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Description', 50, y);
    doc.text('Amount', 450, y, { width: 95, align: 'right' });
    y += 22;
    doc.strokeColor('#e0e0e0').lineWidth(0.3).moveTo(50, y).lineTo(545, y).stroke();
    y += 12;

    doc.font('Helvetica').fillColor('#333');
    doc.text(description, 50, y, { width: 390 });
    doc.text(formatAmountInCurrency(purchase.amountPounds || 0, currency), 450, y, { width: 95, align: 'right' });
    y += 24;

    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 16;

    doc.font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Total', 50, y);
    doc.text(formatAmountInCurrency(purchase.amountPounds || 0, currency), 450, y, { width: 95, align: 'right' });
    y += 30;

    doc.font('Helvetica').fontSize(9).fillColor('#6b6b6b');
    doc.text('This invoice is for quote credits purchased on Sortars. Thank you for your business.', 50, y, { width: 495 });

    doc.end();
  } catch (err) {
    console.error('[Bids] Invoice PDF error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to generate invoice' });
  }
});

export { deductBid };
export default router;

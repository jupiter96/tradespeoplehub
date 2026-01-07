import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Stripe from 'stripe';

const router = express.Router();

// Get payment settings (admin only)
router.get('/admin/payment-settings', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Update payment settings (admin only)
router.put('/admin/payment-settings', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    
    // Update settings
    Object.keys(req.body).forEach(key => {
      if (key === 'bankAccountDetails') {
        settings.bankAccountDetails = {
          ...settings.bankAccountDetails,
          ...req.body.bankAccountDetails,
        };
      } else if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        settings[key] = req.body[key];
      }
    });
    
    settings.updatedBy = req.user.id;
    await settings.save();
    
    res.json({ message: 'Payment settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// Get user wallet balance
router.get('/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ balance: user.walletBalance || 0 });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get wallet transactions
router.get('/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await Wallet.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Wallet.countDocuments({ userId: req.user.id });
    
    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

// Create Stripe payment intent for wallet funding
router.post('/wallet/fund/stripe', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const settings = await PaymentSettings.getSettings();
    
    if (!settings.isActive || !settings.stripeSecretKey) {
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    if (amount < settings.minDepositAmount || amount > settings.maxDepositAmount) {
      return res.status(400).json({ 
        error: `Amount must be between £${settings.minDepositAmount} and £${settings.maxDepositAmount}` 
      });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      metadata: {
        userId: req.user.id.toString(),
        type: 'wallet_funding',
      },
    });
    
    // Create pending wallet transaction
    const transaction = new Wallet({
      userId: req.user.id,
      type: 'deposit',
      amount,
      balance: 0, // Will be updated after payment confirmation
      status: 'pending',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      description: `Wallet funding via Stripe - £${amount}`,
    });
    await transaction.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm Stripe payment and update wallet
router.post('/wallet/fund/stripe/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, transactionId } = req.body;
    
    if (!paymentIntentId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const settings = await PaymentSettings.getSettings();
    if (!settings.stripeSecretKey) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Verify transaction belongs to user
    const transaction = await Wallet.findById(transactionId);
    if (!transaction || transaction.userId.toString() !== req.user.id.toString()) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.json({ message: 'Transaction already processed', transaction });
    }
    
    // Update user wallet balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.walletBalance = (user.walletBalance || 0) + transaction.amount;
    await user.save();
    
    // Update transaction
    transaction.status = 'completed';
    transaction.balance = user.walletBalance;
    transaction.stripeChargeId = paymentIntent.latest_charge;
    await transaction.save();
    
    res.json({ 
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      transaction,
    });
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Create manual transfer request
router.post('/wallet/fund/manual', authenticateToken, async (req, res) => {
  try {
    const { amount, reference } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const settings = await PaymentSettings.getSettings();
    
    if (!settings.manualTransferEnabled) {
      return res.status(400).json({ error: 'Manual transfers are not enabled' });
    }
    
    if (amount < settings.minDepositAmount || amount > settings.maxDepositAmount) {
      return res.status(400).json({ 
        error: `Amount must be between £${settings.minDepositAmount} and £${settings.maxDepositAmount}` 
      });
    }
    
    // Create pending transaction
    const transaction = new Wallet({
      userId: req.user.id,
      type: 'deposit',
      amount,
      balance: 0, // Will be updated after admin approval
      status: 'pending',
      paymentMethod: 'manual_transfer',
      description: `Manual transfer request - £${amount}${reference ? ` (Ref: ${reference})` : ''}`,
    });
    await transaction.save();
    
    res.json({ 
      message: 'Manual transfer request created. Please transfer funds and wait for admin approval.',
      transaction,
      bankDetails: settings.bankAccountDetails,
      instructions: settings.manualTransferInstructions,
    });
  } catch (error) {
    console.error('Error creating manual transfer request:', error);
    res.status(500).json({ error: 'Failed to create manual transfer request' });
  }
});

// Admin: Approve manual transfer
router.post('/admin/wallet/approve/:transactionId', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { adminNotes } = req.body;
    
    const transaction = await Wallet.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction is not pending' });
    }
    
    // Update user wallet balance
    const user = await User.findById(transaction.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.walletBalance = (user.walletBalance || 0) + transaction.amount;
    await user.save();
    
    // Update transaction
    transaction.status = 'completed';
    transaction.balance = user.walletBalance;
    transaction.processedBy = req.user.id;
    transaction.processedAt = new Date();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }
    await transaction.save();
    
    res.json({ 
      message: 'Manual transfer approved successfully',
      transaction,
    });
  } catch (error) {
    console.error('Error approving manual transfer:', error);
    res.status(500).json({ error: 'Failed to approve manual transfer' });
  }
});

// Admin: Reject manual transfer
router.post('/admin/wallet/reject/:transactionId', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { adminNotes } = req.body;
    
    const transaction = await Wallet.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction is not pending' });
    }
    
    transaction.status = 'failed';
    transaction.processedBy = req.user.id;
    transaction.processedAt = new Date();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }
    await transaction.save();
    
    res.json({ 
      message: 'Manual transfer rejected',
      transaction,
    });
  } catch (error) {
    console.error('Error rejecting manual transfer:', error);
    res.status(500).json({ error: 'Failed to reject manual transfer' });
  }
});

// Admin: Get pending manual transfers
router.get('/admin/wallet/pending-transfers', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const transactions = await Wallet.find({
      type: 'deposit',
      paymentMethod: 'manual_transfer',
      status: 'pending',
    })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching pending transfers:', error);
    res.status(500).json({ error: 'Failed to fetch pending transfers' });
  }
});

// Stripe webhook handler
router.post('/wallet/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    if (!settings.stripeWebhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, settings.stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Find transaction by payment intent ID
      const transaction = await Wallet.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      
      if (transaction && transaction.status === 'pending') {
        // Update user wallet balance
        const user = await User.findById(transaction.userId);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + transaction.amount;
          await user.save();
          
          transaction.status = 'completed';
          transaction.balance = user.walletBalance;
          transaction.stripeChargeId = paymentIntent.latest_charge;
          await transaction.save();
        }
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;


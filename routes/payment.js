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

// Get publishable key (for clients to add payment methods)
router.get('/payment/publishable-key', authenticateToken, async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    if (!settings.isActive || !settings.stripePublishableKey) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }
    res.json({ publishableKey: settings.stripePublishableKey });
  } catch (error) {
    console.error('Error fetching publishable key:', error);
    res.status(500).json({ error: 'Failed to fetch publishable key' });
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
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (type) query.type = type;
    
    const sort = {};
    sort[sortBy] = sortOrder;
    
    const transactions = await Wallet.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip);
    
    const total = await Wallet.countDocuments(query);
    
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

// Create setup intent for adding payment method
router.post('/payment-methods/create-setup-intent', authenticateToken, async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    if (!settings.isActive || !settings.stripeSecretKey) {
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    
    res.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Get user's saved payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods stripeCustomerId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      paymentMethods: user.paymentMethods || [],
      stripeCustomerId: user.stripeCustomerId,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Setup payment method (create Stripe customer and attach payment method)
router.post('/payment-methods/setup', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    const settings = await PaymentSettings.getSettings();
    if (!settings.isActive || !settings.stripeSecretKey) {
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Save payment method to user
    const cardInfo = {
      paymentMethodId: paymentMethod.id,
      type: 'card',
      card: {
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '',
        expMonth: paymentMethod.card?.exp_month || 0,
        expYear: paymentMethod.card?.exp_year || 0,
      },
      isDefault: (user.paymentMethods || []).length === 0, // First card is default
      createdAt: new Date(),
    };
    
    if (!user.paymentMethods) {
      user.paymentMethods = [];
    }
    user.paymentMethods.push(cardInfo);
    await user.save();
    
    res.json({ 
      message: 'Payment method saved successfully',
      paymentMethod: cardInfo,
    });
  } catch (error) {
    console.error('Error setting up payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to setup payment method' });
  }
});

// Set default payment method
router.post('/payment-methods/set-default', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user || !user.paymentMethods) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Set all to false, then set selected one to true
    user.paymentMethods.forEach(pm => {
      pm.isDefault = pm.paymentMethodId === paymentMethodId;
    });
    
    await user.save();
    
    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

// Delete payment method
router.delete('/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    
    const settings = await PaymentSettings.getSettings();
    const stripe = new Stripe(settings.stripeSecretKey);
    const user = await User.findById(req.user.id);
    
    if (!user || !user.paymentMethods) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method from Stripe:', error);
    }
    
    // Remove from user
    user.paymentMethods = user.paymentMethods.filter(
      pm => pm.paymentMethodId !== paymentMethodId
    );
    
    // If deleted was default and there are other cards, set first one as default
    if (user.paymentMethods.length > 0 && !user.paymentMethods.some(pm => pm.isDefault)) {
      user.paymentMethods[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Create Stripe payment intent for wallet funding (requires saved payment method)
router.post('/wallet/fund/stripe', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;
    
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
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has saved payment methods
    if (!user.paymentMethods || user.paymentMethods.length === 0) {
      return res.status(400).json({ error: 'Please add a payment method first' });
    }
    
    // Use provided payment method or default
    const selectedPaymentMethod = paymentMethodId 
      ? user.paymentMethods.find(pm => pm.paymentMethodId === paymentMethodId)
      : user.paymentMethods.find(pm => pm.isDefault) || user.paymentMethods[0];
    
    if (!selectedPaymentMethod) {
      return res.status(400).json({ error: 'Payment method not found' });
    }
    
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer not found. Please add a payment method first.' });
    }
    
    const stripe = new Stripe(settings.stripeSecretKey);
    
    // Create payment intent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      customer: user.stripeCustomerId,
      payment_method: selectedPaymentMethod.paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      return_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/account?tab=billing`,
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
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge,
      description: `Wallet funding via Stripe - £${amount}`,
    });
    
    // If payment succeeded immediately, update balance
    if (paymentIntent.status === 'succeeded') {
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save();
      transaction.balance = user.walletBalance;
      transaction.status = 'completed';
    }
    
    await transaction.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      balance: paymentIntent.status === 'succeeded' ? user.walletBalance : null,
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
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
      const user = await User.findById(req.user.id);
      return res.json({ 
        message: 'Transaction already processed', 
        transaction,
        balance: user?.walletBalance || 0,
      });
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

// Admin: Get all wallet transactions
router.get('/admin/wallet/transactions', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const userId = req.query.userId;
    const search = req.query.search; // Email search
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.userId = userId;
    
    const sort = {};
    sort[sortBy] = sortOrder;
    
    let transactionsQuery = Wallet.find(query);
    
    // If search is provided, find users by email first
    if (search) {
      const users = await User.find({
        email: { $regex: search, $options: 'i' }
      }).select('_id');
      const userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      } else {
        // No users found, return empty result
        return res.json({
          transactions: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
      transactionsQuery = Wallet.find(query);
    }
    
    const transactions = await transactionsQuery
      .populate('userId', 'firstName lastName email')
      .populate('processedBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit)
      .skip(skip);
    
    // Re-count with search filter if applicable
    let countQuery = {};
    if (status) countQuery.status = status;
    if (type) countQuery.type = type;
    if (userId) countQuery.userId = userId;
    if (search) {
      const users = await User.find({
        email: { $regex: search, $options: 'i' }
      }).select('_id');
      const userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        countQuery.userId = { $in: userIds };
      } else {
        countQuery.userId = { $in: [] }; // Empty array to return 0
      }
    }
    
    const total = await Wallet.countDocuments(countQuery);
    
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
    console.error('Error fetching admin transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
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


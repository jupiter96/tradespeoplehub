import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

const router = express.Router();

// Helper function to get Stripe keys based on environment
function getStripeKeys(settings) {
  const environment = settings.stripeEnvironment || settings.environment || 'test';
  
  
  let keys;
  if (environment === 'live') {
    keys = {
      publishableKey: settings.stripeLivePublishableKey || settings.stripePublishableKey || null,
      secretKey: settings.stripeLiveSecretKey || settings.stripeSecretKey || null,
      webhookSecret: settings.stripeLiveWebhookSecret || settings.stripeWebhookSecret || null,
    };
  } else {
    keys = {
      publishableKey: settings.stripeTestPublishableKey || settings.stripePublishableKey || null,
      secretKey: settings.stripeTestSecretKey || settings.stripeSecretKey || null,
      webhookSecret: settings.stripeTestWebhookSecret || settings.stripeWebhookSecret || null,
    };
  }
  
  // Log key presence and full keys (for debugging)
  
  return keys;
}

// Helper function to get PayPal keys based on environment
function getPayPalKeys(settings) {
  const environment = settings.paypalEnvironment || 'sandbox';
  
  
  let keys;
  if (environment === 'live') {
    keys = {
      clientId: settings.paypalLiveClientId || settings.paypalClientId || settings.paypalPublicKey || null,
      secretKey: settings.paypalLiveSecretKey || settings.paypalSecretKey || null,
      environment: 'live',
    };
  } else {
    keys = {
      clientId: settings.paypalSandboxClientId || settings.paypalClientId || settings.paypalPublicKey || null,
      secretKey: settings.paypalSandboxSecretKey || settings.paypalSecretKey || null,
      environment: 'sandbox',
    };
  }
  
  // Log key presence and full keys (for debugging)
  
  return keys;
}

// Get payment settings (for clients to see available payment methods)
router.get('/payment/publishable-key', authenticateToken, async (req, res) => {
  
  try {
    const settings = await PaymentSettings.getSettings();
    
    const stripeKeys = getStripeKeys(settings);
    
    const paypalKeys = getPayPalKeys(settings);
    
    const stripeEnvironment = settings.stripeEnvironment || settings.environment || 'test';
    
    // Debug logs (can be removed in production)
    
    // Return all payment settings - each payment method enabled based on toggle only
    const response = { 
      // Stripe settings (based on environment)
      publishableKey: stripeKeys.publishableKey,
      stripeEnabled: Boolean(settings.isActive),
      stripeEnvironment: stripeEnvironment,
      stripeCommissionPercentage: settings.stripeCommissionPercentage || 1.55,
      stripeCommissionFixed: settings.stripeCommissionFixed || 0.29,
      
      // PayPal settings (based on environment)
      paypalClientId: paypalKeys.clientId,
      paypalEnabled: Boolean(settings.paypalEnabled),
      paypalEnvironment: paypalKeys.environment,
      paypalCommissionPercentage: settings.paypalCommissionPercentage || 3.00,
      paypalCommissionFixed: settings.paypalCommissionFixed || 0.30,
      
      // Bank Transfer settings
      bankAccountDetails: settings.bankAccountDetails || {},
      manualTransferEnabled: Boolean(settings.manualTransferEnabled),
      bankProcessingFeePercentage: settings.bankProcessingFeePercentage || 2.00,
      
      // Service Fee
      serviceFees: settings.serviceFees || 0,
      serviceFeeThreshold: settings.serviceFeeThreshold || 0,
    };
    
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Get user wallet balance
router.get('/wallet/balance', authenticateToken, async (req, res) => {
  try {
    // Use user object from middleware if available, otherwise fetch from DB
    let user;
    if (req.user.userObject && req.user.userObject.walletBalance !== undefined) {
      user = req.user.userObject;
    } else {
      user = await User.findById(req.user.id).select('walletBalance');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
      }
    }
    
    res.json({ balance: user.walletBalance || 0 });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

// Create setup intent for adding payment method
router.post('/payment-methods/create-setup-intent', authenticateToken, async (req, res) => {
  
  try {
    console.log('[create-setup-intent] request', {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    const settings = await PaymentSettings.getSettings();
    
    const stripeKeys = getStripeKeys(settings);
    const stripeEnvironment = settings.stripeEnvironment || settings.environment || 'test';
    console.log('[create-setup-intent] settings', {
      stripeEnvironment,
      isActive: Boolean(settings.isActive),
      hasSecretKey: Boolean(stripeKeys.secretKey),
    });
    
    if (!settings.isActive || !stripeKeys.secretKey) {
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }

    // Ensure the key matches the selected environment
    const expectsLiveKey = stripeEnvironment === 'live';
    const hasLiveKey = stripeKeys.secretKey.startsWith('sk_live_');
    const hasTestKey = stripeKeys.secretKey.startsWith('sk_test_');
    if ((expectsLiveKey && !hasLiveKey) || (!expectsLiveKey && !hasTestKey)) {
      return res.status(400).json({
        error: `Stripe secret key does not match ${stripeEnvironment} environment.`,
      });
    }
    
    const stripe = new Stripe(stripeKeys.secretKey);
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      console.log('[create-setup-intent] creating stripe customer');
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
    console.log('[create-setup-intent] creating setup intent', {
      customerId,
    });
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    
    res.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe setup intent error:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      stack: error?.stack,
    });
    res.status(500).json({ error: error?.message || 'Failed to create setup intent' });
  }
});

// Get user's saved payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods stripeCustomerId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate payment methods against current Stripe environment
    const settings = await PaymentSettings.getSettings();
    const stripeKeys = getStripeKeys(settings);
    let validPaymentMethods = [];
    const invalidPaymentMethodIds = [];
    
    if (user.paymentMethods && user.paymentMethods.length > 0 && stripeKeys.secretKey) {
      const stripe = new Stripe(stripeKeys.secretKey);
      
      for (const pm of user.paymentMethods) {
        try {
          await stripe.paymentMethods.retrieve(pm.paymentMethodId);
          validPaymentMethods.push(pm);
        } catch (error) {
          invalidPaymentMethodIds.push(pm.paymentMethodId);
        }
      }
      
      // Remove invalid payment methods from user's saved methods
      if (invalidPaymentMethodIds.length > 0) {
        user.paymentMethods = user.paymentMethods.filter(
          pm => !invalidPaymentMethodIds.includes(pm.paymentMethodId)
        );
        // If default was removed, set first valid one as default
        if (validPaymentMethods.length > 0 && !validPaymentMethods.some(pm => pm.isDefault)) {
          validPaymentMethods[0].isDefault = true;
        }
        await user.save();
      }
    } else {
      validPaymentMethods = user.paymentMethods || [];
    }
    
    res.json({ 
      paymentMethods: validPaymentMethods,
      stripeCustomerId: user.stripeCustomerId,
    });
  } catch (error) {
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
    
    const stripeKeys = getStripeKeys(settings);
    
    if (!settings.isActive || !stripeKeys.secretKey) {
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    const stripe = new Stripe(stripeKeys.secretKey);
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
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

// Delete payment method
router.delete('/payment-methods/:paymentMethodId', authenticateToken, async (req, res) => {
  
  try {
    const { paymentMethodId } = req.params;
    
    const settings = await PaymentSettings.getSettings();
    
    const stripeKeys = getStripeKeys(settings);
    
    const stripe = new Stripe(stripeKeys.secretKey);
    const user = await User.findById(req.user.id);
    
    if (!user || !user.paymentMethods) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
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
    
    const stripeKeys = getStripeKeys(settings);
    
    const stripeEnvironment = settings.stripeEnvironment || settings.environment || 'test';
    
    const stripe = new Stripe(stripeKeys.secretKey);
    
    // Verify payment method exists in current Stripe environment
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(selectedPaymentMethod.paymentMethodId);
    } catch (error) {
      
      // Remove invalid payment method from user's saved methods
      user.paymentMethods = user.paymentMethods.filter(
        pm => pm.paymentMethodId !== selectedPaymentMethod.paymentMethodId
      );
      await user.save();
      
      return res.status(400).json({ 
        error: 'The selected payment method is no longer valid. Please add a new payment method.',
        code: 'INVALID_PAYMENT_METHOD',
        removedPaymentMethod: true
      });
    }
    
    // Calculate Stripe commission (fee is taken separately, full amount is deposited)
    const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
    const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
    const stripeCommission = (amount * stripeCommissionPercentage / 100) + stripeCommissionFixed;
    
    
    // Create payment intent with saved payment method (charge full amount)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence - charge full amount user entered
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
    
    
    // Create pending wallet transaction (full amount deposited, fee stored separately)
    const transaction = new Wallet({
      userId: req.user.id,
      type: 'deposit',
      amount: amount, // Full amount user entered (deposited to balance)
      balance: 0, // Will be updated after payment confirmation
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      paymentMethod: 'card',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge,
      description: `Card Deposit - Charged £${(amount + stripeCommission).toFixed(2)}`,
      metadata: {
        depositAmount: amount, // Full amount deposited to user balance
        fee: stripeCommission, // Fee taken by platform (separate)
        feePercentage: stripeCommissionPercentage,
        feeFixed: stripeCommissionFixed,
      },
    });
    
    // If payment succeeded immediately, deposit full amount to balance
    if (paymentIntent.status === 'succeeded') {
      user.walletBalance = (user.walletBalance || 0) + amount; // Deposit full amount
      await user.save();
      transaction.balance = user.walletBalance;
      transaction.status = 'completed';
      
      // Send email notification when card transaction is successful
      if (user.email) {
        try {
          const { sendTemplatedEmail } = await import('../services/notifier.js');
          await sendTemplatedEmail(
            user.email,
            'card-transaction-successful',
            {
              firstName: user.firstName || 'User',
              lastName: user.lastName || '',
              depositAmount: amount.toFixed(2),
              fee: stripeCommission.toFixed(2),
              totalAmount: (amount + stripeCommission).toFixed(2),
              transactionId: transaction._id.toString(),
              walletBalance: user.walletBalance.toFixed(2),
              paymentDate: new Date().toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
            },
            'no-reply'
          );
        } catch (emailError) {
          // Don't fail the request if email fails
        }
      }
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'canceled') {
      // Send email notification when card transaction fails
      if (user.email) {
        try {
          const { sendTemplatedEmail } = await import('../services/notifier.js');
          await sendTemplatedEmail(
            user.email,
            'card-transaction-failed',
            {
              firstName: user.firstName || 'User',
              lastName: user.lastName || '',
              amount: amount.toFixed(2),
              transactionId: transaction._id.toString(),
              failedDate: new Date().toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              failureReason: paymentIntent.last_payment_error?.message || 'Your payment could not be processed. Please check your payment method and try again.',
            },
            'no-reply'
          );
        } catch (emailError) {
          // Don't fail the request if email fails
        }
      }
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
    
    const stripeKeys = getStripeKeys(settings);
    
    if (!stripeKeys.secretKey) {
      return res.status(400).json({ error: 'Stripe is not configured' });
    }
    
    const stripe = new Stripe(stripeKeys.secretKey);
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
    
    // Send email notification when card transaction is successful
    if (user.email) {
      try {
        const { sendTemplatedEmail } = await import('../services/notifier.js');
        const settings = await PaymentSettings.getSettings();
        const stripeCommission = (transaction.amount * (settings.stripeCommissionPercentage || 1.55) / 100) + (settings.stripeCommissionFixed || 0.29);
        
        await sendTemplatedEmail(
          user.email,
          'card-transaction-successful',
          {
            firstName: user.firstName || 'User',
            lastName: user.lastName || '',
            depositAmount: transaction.amount.toFixed(2),
            fee: stripeCommission.toFixed(2),
            totalAmount: (transaction.amount + stripeCommission).toFixed(2),
            transactionId: transaction._id.toString(),
            walletBalance: user.walletBalance.toFixed(2),
            paymentDate: new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          },
          'no-reply'
        );
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }
    
    res.json({ 
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get user reference ID and generate deposit reference for manual transfer
router.get('/wallet/fund/manual/reference', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.referenceId) {
      return res.status(400).json({ error: 'User reference ID not found. Please contact support.' });
    }

    // Generate deposit reference: {emailPrefix}-{referenceId}
    const emailPrefix = user.email.split('@')[0];
    const reference = `${emailPrefix}-${user.referenceId}`;

    res.json({ 
      reference,
      referenceId: user.referenceId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate deposit reference' });
  }
});

// Create manual transfer request
router.post('/wallet/fund/manual', authenticateToken, async (req, res) => {
  try {
    const { amount, fullName } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
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
    
    // Calculate bank processing fee
    // amount = deposit amount (what user wants in their wallet)
    // fee = commission taken by platform
    // totalAmount = deposit amount + fee (what user should transfer)
    const bankProcessingFeePercentage = settings.bankProcessingFeePercentage || 2.00;
    const depositAmount = amount; // Amount user wants deposited to their wallet
    const fee = (depositAmount * bankProcessingFeePercentage / 100);
    const totalAmount = depositAmount + fee; // Total amount user should transfer
    
    // Create pending transaction (amount = totalAmount, depositAmount and fee stored separately)
    const transaction = new Wallet({
      userId: req.user.id,
      type: 'deposit',
      amount: totalAmount, // Total amount (deposit amount + fee)
      balance: 0, // Will be updated after admin approval
      status: 'pending',
      paymentMethod: 'manual_transfer',
      description: `Bank Transfer - Charged £${totalAmount.toFixed(2)}`,
      metadata: {
        depositAmount: depositAmount, // Amount to be deposited to user balance
        fee: fee, // Fee taken by platform (separate)
        feePercentage: bankProcessingFeePercentage,
        fullName: fullName.trim(),
      },
    });
    await transaction.save();
    
    // Send email notification when bank transfer is initiated
    const user = await User.findById(req.user.id);
    if (user?.email) {
      try {
        const { sendTemplatedEmail } = await import('../services/notifier.js');
        await sendTemplatedEmail(
          user.email,
          'bank-transfer-initiated',
          {
            firstName: user.firstName || 'User',
            lastName: user.lastName || '',
            depositAmount: depositAmount.toFixed(2),
            fee: fee.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            referenceNumber: user.referenceId || 'N/A',
            requestDate: new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          },
          'no-reply'
        );
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }
    
    res.json({ 
      message: 'Manual transfer request created. Please transfer funds and wait for admin approval.',
      transaction,
      bankDetails: settings.bankAccountDetails,
      instructions: settings.manualTransferInstructions,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create manual transfer request' });
  }
});

// Helper function to create PayPal client
function createPayPalClient(settings) {
  const paypalKeys = getPayPalKeys(settings);
  
  // Validate keys before creating client
  if (!paypalKeys.clientId || !paypalKeys.secretKey) {
    throw new Error('PayPal credentials are missing. Please configure PayPal Client ID and Secret Key in payment settings.');
  }
  
  // PayPal environment: sandbox or live
  const paypalEnvironment = paypalKeys.environment === 'live' 
    ? new paypal.core.LiveEnvironment(paypalKeys.clientId, paypalKeys.secretKey)
    : new paypal.core.SandboxEnvironment(paypalKeys.clientId, paypalKeys.secretKey);
  
  const environment = paypalEnvironment;
  
  const client = new paypal.core.PayPalHttpClient(environment);
  
  return client;
}

// Create PayPal order for wallet funding
router.post('/wallet/fund/paypal', authenticateToken, async (req, res) => {
  
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const settings = await PaymentSettings.getSettings();
    
    // Check for PayPal credentials (prefer paypalClientId, fallback to paypalPublicKey for legacy)
    const paypalClientId = settings.paypalClientId || settings.paypalPublicKey;
    
    if (!paypalClientId || !settings.paypalSecretKey) {
      return res.status(400).json({ error: 'PayPal is not configured' });
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
    
    // Calculate PayPal commission (fee is taken separately, full amount is deposited)
    const paypalCommissionPercentage = settings.paypalCommissionPercentage || 3.00;
    const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
    const paypalCommission = (amount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
    const totalAmount = amount + paypalCommission; // Total amount to charge
    
    
    // Create PayPal client
    const client = createPayPalClient(settings);
    
    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    const requestBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'GBP',
          value: totalAmount.toFixed(2), // Total amount including fee
        },
        description: `PayPal Deposit - Charged £${totalAmount.toFixed(2)}`,
      }],
      application_context: {
        brand_name: 'Sortars',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/account?tab=billing&paypal=success`,
        cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/account?tab=billing&paypal=cancel`,
      },
    };
    request.requestBody(requestBody);
    
    const order = await client.execute(request);
    
    // Create pending wallet transaction
    const transaction = new Wallet({
      userId: req.user.id,
      type: 'deposit',
      amount: amount, // Full amount user entered (deposited to balance)
      balance: 0, // Will be updated after payment confirmation
      status: 'pending',
      paymentMethod: 'paypal',
      paypalOrderId: order.result.id,
      description: `PayPal Deposit - Charged £${totalAmount.toFixed(2)}`,
      metadata: {
        depositAmount: amount, // Full amount deposited to user balance
        fee: paypalCommission, // Fee taken by platform (separate)
        feePercentage: paypalCommissionPercentage,
        feeFixed: paypalCommissionFixed,
        totalAmount: totalAmount, // Total amount charged
      },
    });
    
    await transaction.save();
    
    const approvalUrl = order.result.links.find(link => link.rel === 'approve')?.href;
    
    const response = {
      orderId: order.result.id,
      transactionId: transaction._id,
      approvalUrl: approvalUrl,
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
  }
});

// Capture PayPal payment and update wallet
router.post('/wallet/fund/paypal/capture', authenticateToken, async (req, res) => {
  
  try {
    const { orderId, transactionId } = req.body;
    
    if (!orderId || !transactionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const settings = await PaymentSettings.getSettings();
    
    const paypalKeys = getPayPalKeys(settings);
    
    if (!paypalKeys.clientId || !paypalKeys.secretKey) {
      return res.status(400).json({ error: 'PayPal is not configured' });
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
    
    // Create PayPal client
    const client = createPayPalClient(settings);
    
    // Capture the order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    const capture = await client.execute(request);
    
    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Update user wallet balance (deposit full amount, fee was already charged)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const depositAmount = transaction.metadata?.depositAmount || transaction.amount;
    
    const previousBalance = user.walletBalance || 0;
    user.walletBalance = previousBalance + depositAmount;
    await user.save();
    
    // Update transaction
    transaction.status = 'completed';
    transaction.balance = user.walletBalance;
    transaction.paypalCaptureId = capture.result.id;
    await transaction.save();
    
    // Send email notification when PayPal transaction is successful
    if (user.email) {
      try {
        const { sendTemplatedEmail } = await import('../services/notifier.js');
        const paypalCommission = transaction.metadata?.fee || 
          ((depositAmount * (settings.paypalCommissionPercentage || 3.00) / 100) + (settings.paypalCommissionFixed || 0.30));
        const totalAmount = depositAmount + paypalCommission;
        
        await sendTemplatedEmail(
          user.email,
          'paypal-transaction-successful',
          {
            firstName: user.firstName || 'User',
            lastName: user.lastName || '',
            depositAmount: depositAmount.toFixed(2),
            fee: paypalCommission.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            transactionId: transaction._id.toString(),
            paypalOrderId: orderId || transaction.paypalOrderId || 'N/A',
            walletBalance: user.walletBalance.toFixed(2),
            paymentDate: new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          },
          'no-reply'
        );
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }
    
    const response = { 
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      transaction,
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
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
    
    // Get fee information from metadata (already calculated when request was created)
    // transaction.amount = totalAmount (depositAmount + fee)
    // metadata.depositAmount = amount to deposit to user balance
    // metadata.fee = commission taken by platform
    const settings = await PaymentSettings.getSettings();
    const depositAmount = transaction.metadata?.depositAmount || (transaction.amount / (1 + ((transaction.metadata?.feePercentage || settings.bankProcessingFeePercentage || 2.00) / 100)));
    const fee = transaction.metadata?.fee || (transaction.amount - depositAmount);
    
    // Deposit only depositAmount to user balance (fee is taken separately by platform)
    user.walletBalance = (user.walletBalance || 0) + depositAmount;
    await user.save();
    
    // Update transaction status (amount already contains totalAmount = depositAmount + fee)
    transaction.status = 'completed';
    transaction.balance = user.walletBalance;
    transaction.processedBy = req.user.id;
    transaction.processedAt = new Date();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }
    // Ensure fee information is in metadata
    if (!transaction.metadata) {
      transaction.metadata = {};
    }
    transaction.metadata.depositAmount = depositAmount;
    transaction.metadata.fee = fee;
    transaction.metadata.feePercentage = settings.bankProcessingFeePercentage || 2.00;
    await transaction.save();
    
    // Send email notification when bank transfer is approved
    if (user.email) {
      try {
        const { sendTemplatedEmail } = await import('../services/notifier.js');
        await sendTemplatedEmail(
          user.email,
          'bank-transfer-approved',
          {
            firstName: user.firstName || 'User',
            lastName: user.lastName || '',
            depositAmount: depositAmount.toFixed(2),
            fee: fee.toFixed(2),
            totalAmount: transaction.amount.toFixed(2),
            referenceNumber: transaction.metadata?.reference || 'N/A',
            walletBalance: user.walletBalance.toFixed(2),
            approvedDate: new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
          },
          'no-reply'
        );
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }
    
    // Create in-app notification
    try {
      const { notifyBankTransferApproved } = await import('../services/notificationService.js');
      await notifyBankTransferApproved(user._id, transaction._id, depositAmount);
    } catch (notifError) {
    }
    
    res.json({ 
      message: 'Manual transfer approved successfully',
      transaction,
    });
  } catch (error) {
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
    
    transaction.status = 'rejected';
    transaction.processedBy = req.user.id;
    transaction.processedAt = new Date();
    if (adminNotes) {
      transaction.adminNotes = adminNotes;
    }
    await transaction.save();
    
    // Send email notification when bank transfer is rejected
    const user = await User.findById(transaction.userId);
    if (user?.email) {
      try {
        const { sendTemplatedEmail } = await import('../services/notifier.js');
        await sendTemplatedEmail(
          user.email,
          'bank-transfer-rejected',
          {
            firstName: user.firstName || 'User',
            lastName: user.lastName || '',
            totalAmount: transaction.amount.toFixed(2),
            referenceNumber: transaction.metadata?.reference || 'N/A',
            rejectedDate: new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            rejectionReason: adminNotes || 'Your bank transfer request could not be approved. Please contact support for more information.',
          },
          'no-reply'
        );
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }
    
    // Create in-app notification
    try {
      const { notifyBankTransferRejected } = await import('../services/notificationService.js');
      await notifyBankTransferRejected(user._id, transaction._id, transaction.amount, adminNotes);
    } catch (notifError) {
    }
    
    res.json({ 
      message: 'Manual transfer rejected',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject manual transfer' });
  }
});

// Admin: Get bank transfer requests (with search, filter, sort)
router.get('/admin/bank-transfer-requests', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    const status = req.query.status; // 'all', 'pending', 'completed', 'rejected'
    const search = req.query.search; // Search by user name, email, or reference
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const query = {
      type: 'deposit',
      paymentMethod: 'manual_transfer',
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder;
    
    // If search is provided, find users by name, email, or reference
    if (search) {
      const users = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);
      
      // Also search in metadata.reference
      const referenceMatches = await Wallet.find({
        type: 'deposit',
        paymentMethod: 'manual_transfer',
        'metadata.reference': { $regex: search, $options: 'i' }
      }).select('_id');
      const referenceIds = referenceMatches.map(t => t._id);
      
      if (userIds.length > 0 || referenceIds.length > 0) {
        query.$or = [
          { userId: { $in: userIds } },
          { _id: { $in: referenceIds } }
        ];
      } else {
        // No matches found, return empty result
        return res.json({
          requests: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
    }
    
    const transactions = await Wallet.find(query)
      .populate('userId', 'firstName lastName email townCity referenceId')
      .populate('processedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Wallet.countDocuments(query);
    
    // Format transactions for frontend
    // t.amount = totalAmount (depositAmount + fee)
    // t.metadata.depositAmount = amount to deposit to user balance
    // t.metadata.fee = commission taken by platform
    const formattedRequests = transactions.map((t) => {
      const depositAmount = t.metadata?.depositAmount || (t.amount / (1 + ((t.metadata?.feePercentage || 2.00) / 100)));
      const fee = t.metadata?.fee || (t.amount - depositAmount);
      
      return {
        _id: t._id,
        id: t._id.toString(),
        userId: t.userId?._id || null,
        user: t.userId ? {
          firstName: t.userId.firstName || '',
          lastName: t.userId.lastName || '',
          email: t.userId.email || '',
          name: `${t.userId.firstName || ''} ${t.userId.lastName || ''}`.trim() || t.userId.email,
          referenceId: t.userId.referenceId || '',
        } : null,
        amount: t.amount, // Total amount (depositAmount + fee)
        commission: fee, // Fee taken by platform
        userAmount: depositAmount, // Amount deposited to user balance
        city: t.userId?.townCity || '',
        bankAccountName: t.metadata?.fullName || '',
        referenceNumber: t.userId?.referenceId || '',
        status: t.status,
        createdAt: t.createdAt,
        processedBy: t.processedBy ? {
          firstName: t.processedBy.firstName || '',
          lastName: t.processedBy.lastName || '',
          name: `${t.processedBy.firstName || ''} ${t.processedBy.lastName || ''}`.trim(),
        } : null,
        processedAt: t.processedAt,
        adminNotes: t.adminNotes,
      };
    });
    
    res.json({
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank transfer requests' });
  }
});

// Admin: Get pending manual transfers (kept for backward compatibility)
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
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Stripe webhook handler
router.post('/wallet/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const settings = await PaymentSettings.getSettings();
    const stripeKeys = getStripeKeys(settings);
    if (!stripeKeys.webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }
    
    const stripe = new Stripe(stripeKeys.secretKey);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeKeys.webhookSecret);
    } catch (err) {
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
          
          // Send email notification when card transaction is successful (via webhook)
          if (user.email) {
            try {
              const { sendTemplatedEmail } = await import('../services/notifier.js');
              const settings = await PaymentSettings.getSettings();
              const stripeCommission = (transaction.amount * (settings.stripeCommissionPercentage || 1.55) / 100) + (settings.stripeCommissionFixed || 0.29);
              
              await sendTemplatedEmail(
                user.email,
                'card-transaction-successful',
                {
                  firstName: user.firstName || 'User',
                  lastName: user.lastName || '',
                  depositAmount: transaction.amount.toFixed(2),
                  fee: stripeCommission.toFixed(2),
                  totalAmount: (transaction.amount + stripeCommission).toFixed(2),
                  transactionId: transaction._id.toString(),
                  walletBalance: user.walletBalance.toFixed(2),
                  paymentDate: new Date().toLocaleDateString('en-GB', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                },
                'no-reply'
              );
            } catch (emailError) {
              // Don't fail the request if email fails
            }
          }
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      // Find transaction by payment intent ID
      const transaction = await Wallet.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      
      if (transaction && transaction.status === 'pending') {
        // Update transaction status to failed
        transaction.status = 'failed';
        await transaction.save();
        
        // Send email notification when card transaction fails
        const user = await User.findById(transaction.userId);
        if (user?.email) {
          try {
            const { sendTemplatedEmail } = await import('../services/notifier.js');
            await sendTemplatedEmail(
              user.email,
              'card-transaction-failed',
              {
                firstName: user.firstName || 'User',
                lastName: user.lastName || '',
                amount: transaction.amount.toFixed(2),
                transactionId: transaction._id.toString(),
                failedDate: new Date().toLocaleDateString('en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                failureReason: paymentIntent.last_payment_error?.message || 'Your payment could not be processed. Please check your payment method and try again.',
              },
              'no-reply'
            );
          } catch (emailError) {
            // Don't fail the request if email fails
          }
        }
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;


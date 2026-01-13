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
  
  console.log('[Payment Keys] getStripeKeys called');
  console.log('[Payment Keys] Stripe environment setting:', environment);
  console.log('[Payment Keys] stripeEnvironment field:', settings.stripeEnvironment);
  console.log('[Payment Keys] environment field (legacy):', settings.environment);
  
  let keys;
  if (environment === 'live') {
    console.log('[Payment Keys] Using LIVE mode Stripe keys');
    keys = {
      publishableKey: settings.stripeLivePublishableKey || settings.stripePublishableKey || null,
      secretKey: settings.stripeLiveSecretKey || settings.stripeSecretKey || null,
      webhookSecret: settings.stripeLiveWebhookSecret || settings.stripeWebhookSecret || null,
    };
    console.log('[Payment Keys] Live publishable key source:', 
      settings.stripeLivePublishableKey ? 'stripeLivePublishableKey' : 
      (settings.stripePublishableKey ? 'stripePublishableKey (legacy)' : 'null'));
    console.log('[Payment Keys] Live secret key source:', 
      settings.stripeLiveSecretKey ? 'stripeLiveSecretKey' : 
      (settings.stripeSecretKey ? 'stripeSecretKey (legacy)' : 'null'));
    console.log('[Payment Keys] Live webhook secret source:', 
      settings.stripeLiveWebhookSecret ? 'stripeLiveWebhookSecret' : 
      (settings.stripeWebhookSecret ? 'stripeWebhookSecret (legacy)' : 'null'));
  } else {
    console.log('[Payment Keys] Using TEST mode Stripe keys');
    keys = {
      publishableKey: settings.stripeTestPublishableKey || settings.stripePublishableKey || null,
      secretKey: settings.stripeTestSecretKey || settings.stripeSecretKey || null,
      webhookSecret: settings.stripeTestWebhookSecret || settings.stripeWebhookSecret || null,
    };
    console.log('[Payment Keys] Test publishable key source:', 
      settings.stripeTestPublishableKey ? 'stripeTestPublishableKey' : 
      (settings.stripePublishableKey ? 'stripePublishableKey (legacy)' : 'null'));
    console.log('[Payment Keys] Test secret key source:', 
      settings.stripeTestSecretKey ? 'stripeTestSecretKey' : 
      (settings.stripeSecretKey ? 'stripeSecretKey (legacy)' : 'null'));
    console.log('[Payment Keys] Test webhook secret source:', 
      settings.stripeTestWebhookSecret ? 'stripeTestWebhookSecret' : 
      (settings.stripeWebhookSecret ? 'stripeWebhookSecret (legacy)' : 'null'));
  }
  
  // Log key presence and full keys (for debugging)
  console.log('[Payment Keys] Publishable key present:', keys.publishableKey ? 'Yes' : 'No');
  console.log('[Payment Keys] Publishable key value:', keys.publishableKey || 'null');
  console.log('[Payment Keys] Secret key present:', keys.secretKey ? 'Yes' : 'No');
  console.log('[Payment Keys] Secret key value:', keys.secretKey || 'null');
  console.log('[Payment Keys] Webhook secret present:', keys.webhookSecret ? 'Yes' : 'No');
  console.log('[Payment Keys] Webhook secret value:', keys.webhookSecret || 'null');
  console.log('[Payment Keys] Full keys object:', JSON.stringify(keys, null, 2));
  
  return keys;
}

// Helper function to get PayPal keys based on environment
function getPayPalKeys(settings) {
  const environment = settings.paypalEnvironment || 'sandbox';
  
  console.log('[Payment Keys] getPayPalKeys called');
  console.log('[Payment Keys] PayPal environment setting:', environment);
  console.log('[Payment Keys] paypalEnvironment field:', settings.paypalEnvironment);
  
  let keys;
  if (environment === 'live') {
    console.log('[Payment Keys] Using LIVE mode PayPal keys');
    keys = {
      clientId: settings.paypalLiveClientId || settings.paypalClientId || settings.paypalPublicKey || null,
      secretKey: settings.paypalLiveSecretKey || settings.paypalSecretKey || null,
      environment: 'live',
    };
    console.log('[Payment Keys] Live client ID source:', 
      settings.paypalLiveClientId ? 'paypalLiveClientId' : 
      (settings.paypalClientId ? 'paypalClientId (legacy)' : 
      (settings.paypalPublicKey ? 'paypalPublicKey (legacy)' : 'null')));
    console.log('[Payment Keys] Live secret key source:', 
      settings.paypalLiveSecretKey ? 'paypalLiveSecretKey' : 
      (settings.paypalSecretKey ? 'paypalSecretKey (legacy)' : 'null'));
  } else {
    console.log('[Payment Keys] Using SANDBOX mode PayPal keys');
    keys = {
      clientId: settings.paypalSandboxClientId || settings.paypalClientId || settings.paypalPublicKey || null,
      secretKey: settings.paypalSandboxSecretKey || settings.paypalSecretKey || null,
      environment: 'sandbox',
    };
    console.log('[Payment Keys] Sandbox client ID source:', 
      settings.paypalSandboxClientId ? 'paypalSandboxClientId' : 
      (settings.paypalClientId ? 'paypalClientId (legacy)' : 
      (settings.paypalPublicKey ? 'paypalPublicKey (legacy)' : 'null')));
    console.log('[Payment Keys] Sandbox secret key source:', 
      settings.paypalSandboxSecretKey ? 'paypalSandboxSecretKey' : 
      (settings.paypalSecretKey ? 'paypalSecretKey (legacy)' : 'null'));
  }
  
  // Log key presence and full keys (for debugging)
  console.log('[Payment Keys] PayPal client ID present:', keys.clientId ? 'Yes' : 'No');
  console.log('[Payment Keys] PayPal client ID value:', keys.clientId || 'null');
  console.log('[Payment Keys] PayPal secret key present:', keys.secretKey ? 'Yes' : 'No');
  console.log('[Payment Keys] PayPal secret key value:', keys.secretKey || 'null');
  console.log('[Payment Keys] PayPal environment:', keys.environment);
  console.log('[Payment Keys] Full PayPal keys object:', JSON.stringify(keys, null, 2));
  
  return keys;
}

// Get payment settings (for clients to see available payment methods)
router.get('/payment/publishable-key', authenticateToken, async (req, res) => {
  console.log('[Payment Settings] GET /payment/publishable-key - Request received');
  console.log('[Payment Settings] User ID:', req.user.id);
  
  try {
    console.log('[Payment Settings] Fetching payment settings from database...');
    const settings = await PaymentSettings.getSettings();
    console.log('[Payment Settings] Payment settings loaded from database');
    
    console.log('[Payment Settings] Retrieving Stripe keys...');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Payment Settings] Stripe keys retrieved');
    
    console.log('[Payment Settings] Retrieving PayPal keys...');
    const paypalKeys = getPayPalKeys(settings);
    console.log('[Payment Settings] PayPal keys retrieved');
    
    const stripeEnvironment = settings.stripeEnvironment || settings.environment || 'test';
    console.log('[Payment Settings] Stripe environment:', stripeEnvironment);
    console.log('[Payment Settings] PayPal environment:', paypalKeys.environment);
    
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
    };
    
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
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
  console.log('[Stripe Setup Intent] POST /payment-methods/create-setup-intent - Request received');
  console.log('[Stripe Setup Intent] User ID:', req.user.id);
  
  try {
    console.log('[Stripe Setup Intent] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[Stripe Setup Intent] Payment settings loaded');
    
    console.log('[Stripe Setup Intent] Retrieving Stripe keys...');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Stripe Setup Intent] Stripe keys retrieved');
    
    if (!settings.isActive || !stripeKeys.secretKey) {
      console.error('[Stripe Setup Intent] Stripe payments not configured or secret key missing');
      console.error('[Stripe Setup Intent] isActive:', settings.isActive);
      console.error('[Stripe Setup Intent] secretKey present:', !!stripeKeys.secretKey);
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    console.log('[Stripe Setup Intent] Creating Stripe instance with secret key');
    const stripe = new Stripe(stripeKeys.secretKey);
    console.log('[Stripe Setup Intent] Stripe instance created');
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
          console.log(`[Stripe Backend] PaymentMethod ${pm.paymentMethodId} is invalid in current environment, removing from list`);
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
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Setup payment method (create Stripe customer and attach payment method)
router.post('/payment-methods/setup', authenticateToken, async (req, res) => {
  console.log('[Stripe Setup] POST /payment-methods/setup - Request received');
  console.log('[Stripe Setup] User ID:', req.user.id);
  console.log('[Stripe Setup] Request body:', req.body);
  
  try {
    const { paymentMethodId } = req.body;
    console.log('[Stripe Setup] Payment method ID:', paymentMethodId);
    
    if (!paymentMethodId) {
      console.error('[Stripe Setup] Payment method ID is missing');
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    console.log('[Stripe Setup] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[Stripe Setup] Payment settings loaded');
    
    console.log('[Stripe Setup] Retrieving Stripe keys...');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Stripe Setup] Stripe keys retrieved');
    
    if (!settings.isActive || !stripeKeys.secretKey) {
      console.error('[Stripe Setup] Stripe payments not configured or secret key missing');
      console.error('[Stripe Setup] isActive:', settings.isActive);
      console.error('[Stripe Setup] secretKey present:', !!stripeKeys.secretKey);
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    console.log('[Stripe Setup] Creating Stripe instance with secret key');
    const stripe = new Stripe(stripeKeys.secretKey);
    console.log('[Stripe Setup] Stripe instance created');
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
  console.log('[Stripe Delete] DELETE /payment-methods/:paymentMethodId - Request received');
  console.log('[Stripe Delete] User ID:', req.user.id);
  console.log('[Stripe Delete] Payment method ID:', req.params.paymentMethodId);
  
  try {
    const { paymentMethodId } = req.params;
    
    console.log('[Stripe Delete] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[Stripe Delete] Payment settings loaded');
    
    console.log('[Stripe Delete] Retrieving Stripe keys...');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Stripe Delete] Stripe keys retrieved');
    
    console.log('[Stripe Delete] Creating Stripe instance with secret key');
    const stripe = new Stripe(stripeKeys.secretKey);
    console.log('[Stripe Delete] Stripe instance created');
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
  console.log('[Stripe Backend] ========== POST /wallet/fund/stripe ==========');
  console.log('[Stripe Backend] Request received at:', new Date().toISOString());
  console.log('[Stripe Backend] Full request object:', JSON.stringify(req, null, 2));
  console.log('[Stripe Backend] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[Stripe Backend] User ID:', req.user.id);
  console.log('[Stripe Backend] User object:', JSON.stringify(req.user, null, 2));
  
  try {
    console.log('[Stripe Backend] Step 1: Extracting request body values');
    const { amount, paymentMethodId } = req.body;
    console.log('[Stripe Backend] Step 1 Complete: Values extracted');
    console.log('[Stripe Backend] Request body values:');
    console.log('  - amount:', amount, '(type:', typeof amount, ')');
    console.log('  - paymentMethodId:', paymentMethodId, '(type:', typeof paymentMethodId, ')');
    
    if (!amount || amount <= 0) {
      console.error('[Stripe Backend] Step 1 Failed: Invalid amount');
      console.error('[Stripe Backend] Amount value:', amount);
      console.error('[Stripe Backend] Amount type:', typeof amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    console.log('[Stripe Backend] Step 2: Fetching payment settings from database');
    const settings = await PaymentSettings.getSettings();
    console.log('[Stripe Backend] Step 2 Complete: Payment settings loaded');
    console.log('[Stripe Backend] Full settings object:', JSON.stringify(settings, null, 2));
    console.log('[Stripe Backend] Settings values:');
    console.log('  - isActive:', settings.isActive);
    console.log('  - stripeEnvironment:', settings.stripeEnvironment);
    console.log('  - environment (legacy):', settings.environment);
    console.log('  - stripeTestPublishableKey:', settings.stripeTestPublishableKey);
    console.log('  - stripeTestSecretKey:', settings.stripeTestSecretKey);
    console.log('  - stripeLivePublishableKey:', settings.stripeLivePublishableKey);
    console.log('  - stripeLiveSecretKey:', settings.stripeLiveSecretKey);
    console.log('  - stripeSecretKey (legacy):', settings.stripeSecretKey);
    console.log('  - minDepositAmount:', settings.minDepositAmount);
    console.log('  - maxDepositAmount:', settings.maxDepositAmount);
    
    if (!settings.isActive || !settings.stripeSecretKey) {
      console.error('[Stripe Backend] Step 2 Failed: Stripe payments are not configured');
      console.error('[Stripe Backend] isActive:', settings.isActive);
      console.error('[Stripe Backend] stripeSecretKey present:', !!settings.stripeSecretKey);
      return res.status(400).json({ error: 'Stripe payments are not configured' });
    }
    
    console.log('[Stripe Backend] Step 3: Validating amount range');
    console.log('[Stripe Backend] Amount validation:');
    console.log('  - amount:', amount);
    console.log('  - minDepositAmount:', settings.minDepositAmount);
    console.log('  - maxDepositAmount:', settings.maxDepositAmount);
    console.log('  - amount >= minDepositAmount:', amount >= settings.minDepositAmount);
    console.log('  - amount <= maxDepositAmount:', amount <= settings.maxDepositAmount);
    
    if (amount < settings.minDepositAmount || amount > settings.maxDepositAmount) {
      console.error('[Stripe Backend] Step 3 Failed: Amount out of range');
      console.error('[Stripe Backend] Amount:', amount, 'Min:', settings.minDepositAmount, 'Max:', settings.maxDepositAmount);
      return res.status(400).json({ 
        error: `Amount must be between £${settings.minDepositAmount} and £${settings.maxDepositAmount}` 
      });
    }
    console.log('[Stripe Backend] Step 3 Complete: Amount validation passed');
    
    console.log('[Stripe Backend] Step 4: Fetching user from database');
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('[Stripe Backend] Step 4 Failed: User not found');
      console.error('[Stripe Backend] User ID:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[Stripe Backend] Step 4 Complete: User found');
    console.log('[Stripe Backend] User values:');
    console.log('  - email:', user.email);
    console.log('  - stripeCustomerId:', user.stripeCustomerId);
    console.log('  - paymentMethods count:', user.paymentMethods?.length || 0);
    console.log('  - Full user payment methods:', JSON.stringify(user.paymentMethods, null, 2));
    
    // Check if user has saved payment methods
    if (!user.paymentMethods || user.paymentMethods.length === 0) {
      console.error('[Stripe Backend] Step 4 Failed: User has no payment methods');
      return res.status(400).json({ error: 'Please add a payment method first' });
    }
    
    console.log('[Stripe Backend] Step 5: Selecting payment method');
    // Use provided payment method or default
    const selectedPaymentMethod = paymentMethodId 
      ? user.paymentMethods.find(pm => pm.paymentMethodId === paymentMethodId)
      : user.paymentMethods.find(pm => pm.isDefault) || user.paymentMethods[0];
    
    console.log('[Stripe Backend] Step 5 Complete: Payment method selected');
    console.log('[Stripe Backend] Selected payment method:', JSON.stringify(selectedPaymentMethod, null, 2));
    console.log('[Stripe Backend] Selected payment method ID:', selectedPaymentMethod?.paymentMethodId);
    
    if (!selectedPaymentMethod) {
      console.error('[Stripe Backend] Step 5 Failed: Payment method not found');
      return res.status(400).json({ error: 'Payment method not found' });
    }
    
    if (!user.stripeCustomerId) {
      console.error('[Stripe Backend] Step 5 Failed: Stripe customer not found');
      return res.status(400).json({ error: 'Stripe customer not found. Please add a payment method first.' });
    }
    console.log('[Stripe Backend] Stripe customer ID:', user.stripeCustomerId);
    
    console.log('[Stripe Backend] Step 6: Retrieving Stripe keys');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Stripe Backend] Step 6 Complete: Stripe keys retrieved');
    
    const stripeEnvironment = settings.stripeEnvironment || settings.environment || 'test';
    console.log('[Stripe Backend] Stripe environment:', stripeEnvironment);
    console.log('[Stripe Backend] Using Stripe keys for environment:', stripeEnvironment);
    console.log('[Stripe Backend] Stripe secret key to use:', stripeKeys.secretKey);
    
    console.log('[Stripe Backend] Step 7: Creating Stripe instance');
    const stripe = new Stripe(stripeKeys.secretKey);
    console.log('[Stripe Backend] Step 7 Complete: Stripe instance created');
    
    // Verify payment method exists in current Stripe environment
    console.log('[Stripe Backend] Verifying payment method:', selectedPaymentMethod.paymentMethodId);
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(selectedPaymentMethod.paymentMethodId);
      console.log('[Stripe Backend] PaymentMethod verified successfully:', paymentMethod.id);
      console.log('[Stripe Backend] PaymentMethod type:', paymentMethod.type);
      console.log('[Stripe Backend] PaymentMethod card:', paymentMethod.card?.brand, paymentMethod.card?.last4);
    } catch (error) {
      console.error('[Stripe Backend] PaymentMethod verification failed:', error.message);
      console.error('[Stripe Backend] Error code:', error.code);
      console.error('[Stripe Backend] Error type:', error.type);
      
      // Remove invalid payment method from user's saved methods
      console.log('[Stripe Backend] Removing invalid payment method from user account');
      user.paymentMethods = user.paymentMethods.filter(
        pm => pm.paymentMethodId !== selectedPaymentMethod.paymentMethodId
      );
      await user.save();
      console.log('[Stripe Backend] Invalid payment method removed from user account');
      
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
    
    console.log('[Stripe Backend] Commission calculation:');
    console.log('[Stripe Backend]   - Deposit amount:', amount);
    console.log('[Stripe Backend]   - Commission percentage:', stripeCommissionPercentage + '%');
    console.log('[Stripe Backend]   - Commission fixed:', stripeCommissionFixed);
    console.log('[Stripe Backend]   - Commission total:', stripeCommission);
    console.log('[Stripe Backend]   - Total amount to charge:', amount + stripeCommission);
    
    // Create payment intent with saved payment method (charge full amount)
    console.log('[Stripe Backend] Creating payment intent...');
    console.log('[Stripe Backend] Payment intent parameters:', {
      amount: Math.round(amount * 100),
      currency: 'gbp',
      customer: user.stripeCustomerId,
      payment_method: selectedPaymentMethod.paymentMethodId,
    });
    
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
    
    console.log('[Stripe Backend] Payment intent created successfully');
    console.log('[Stripe Backend] Payment intent ID:', paymentIntent.id);
    console.log('[Stripe Backend] Payment intent status:', paymentIntent.status);
    console.log('[Stripe Backend] Payment intent amount:', paymentIntent.amount);
    console.log('[Stripe Backend] Payment intent currency:', paymentIntent.currency);
    
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
          console.error('Failed to send card transaction successful email:', emailError);
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
          console.error('Failed to send card transaction failed email:', emailError);
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
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

// Confirm Stripe payment and update wallet
router.post('/wallet/fund/stripe/confirm', authenticateToken, async (req, res) => {
  console.log('[Stripe Confirm] POST /wallet/fund/stripe/confirm - Request received');
  console.log('[Stripe Confirm] User ID:', req.user.id);
  console.log('[Stripe Confirm] Request body:', req.body);
  
  try {
    const { paymentIntentId, transactionId } = req.body;
    console.log('[Stripe Confirm] Payment intent ID:', paymentIntentId);
    console.log('[Stripe Confirm] Transaction ID:', transactionId);
    
    if (!paymentIntentId || !transactionId) {
      console.error('[Stripe Confirm] Missing required parameters');
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log('[Stripe Confirm] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[Stripe Confirm] Payment settings loaded');
    
    console.log('[Stripe Confirm] Retrieving Stripe keys...');
    const stripeKeys = getStripeKeys(settings);
    console.log('[Stripe Confirm] Stripe keys retrieved');
    
    if (!stripeKeys.secretKey) {
      console.error('[Stripe Confirm] Stripe secret key is missing');
      return res.status(400).json({ error: 'Stripe is not configured' });
    }
    
    console.log('[Stripe Confirm] Creating Stripe instance with secret key');
    const stripe = new Stripe(stripeKeys.secretKey);
    console.log('[Stripe Confirm] Stripe instance created');
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
        console.error('Failed to send card transaction successful email:', emailError);
      }
    }
    
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
    console.error('Error generating deposit reference:', error);
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
        console.error('Failed to send bank transfer initiated email:', emailError);
      }
    }
    
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

// Helper function to create PayPal client
function createPayPalClient(settings) {
  console.log('[PayPal Backend] createPayPalClient called');
  const paypalKeys = getPayPalKeys(settings);
  console.log('[PayPal Backend] PayPal keys retrieved from getPayPalKeys');
  console.log('[PayPal Backend] PayPal Client ID present:', paypalKeys.clientId ? `Yes (${paypalKeys.clientId.substring(0, 20)}...)` : 'No');
  console.log('[PayPal Backend] PayPal Secret Key present:', paypalKeys.secretKey ? `Yes (${paypalKeys.secretKey.substring(0, 20)}...)` : 'No');
  console.log('[PayPal Backend] PayPal Environment:', paypalKeys.environment);
  
  // Validate keys before creating client
  if (!paypalKeys.clientId || !paypalKeys.secretKey) {
    console.error('[PayPal Backend] PayPal credentials are missing');
    console.error('[PayPal Backend] Client ID missing:', !paypalKeys.clientId);
    console.error('[PayPal Backend] Secret Key missing:', !paypalKeys.secretKey);
    throw new Error('PayPal credentials are missing. Please configure PayPal Client ID and Secret Key in payment settings.');
  }
  
  // PayPal environment: sandbox or live
  const paypalEnvironment = paypalKeys.environment === 'live' 
    ? new paypal.core.LiveEnvironment(paypalKeys.clientId, paypalKeys.secretKey)
    : new paypal.core.SandboxEnvironment(paypalKeys.clientId, paypalKeys.secretKey);
  
  console.log(`[PayPal Backend] Creating ${paypalKeys.environment === 'live' ? 'Live' : 'Sandbox'}Environment`);
  console.log(`[PayPal Backend] Using PayPal ${paypalKeys.environment === 'live' ? 'Live' : 'Sandbox'} mode`);
  const environment = paypalEnvironment;
  
  console.log('[PayPal Backend] Creating PayPalHttpClient');
  const client = new paypal.core.PayPalHttpClient(environment);
  console.log('[PayPal Backend] PayPal client created successfully');
  
  return client;
}

// Create PayPal order for wallet funding
router.post('/wallet/fund/paypal', authenticateToken, async (req, res) => {
  console.log('[PayPal Backend] POST /wallet/fund/paypal - Request received');
  console.log('[PayPal Backend] Request body:', req.body);
  console.log('[PayPal Backend] User ID:', req.user.id);
  
  try {
    const { amount } = req.body;
    console.log('[PayPal Backend] Amount received:', amount);
    
    if (!amount || amount <= 0) {
      console.error('[PayPal Backend] Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    console.log('[PayPal Backend] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[PayPal Backend] Payment settings loaded');
    
    // Check for PayPal credentials (prefer paypalClientId, fallback to paypalPublicKey for legacy)
    const paypalClientId = settings.paypalClientId || settings.paypalPublicKey;
    console.log('[PayPal Backend] PayPal Client ID:', paypalClientId ? 'Present' : 'Missing');
    console.log('[PayPal Backend] PayPal Secret Key:', settings.paypalSecretKey ? 'Present' : 'Missing');
    
    if (!paypalClientId || !settings.paypalSecretKey) {
      console.error('[PayPal Backend] PayPal is not configured');
      return res.status(400).json({ error: 'PayPal is not configured' });
    }
    
    if (amount < settings.minDepositAmount || amount > settings.maxDepositAmount) {
      console.error('[PayPal Backend] Amount out of range:', amount, 'Min:', settings.minDepositAmount, 'Max:', settings.maxDepositAmount);
      return res.status(400).json({ 
        error: `Amount must be between £${settings.minDepositAmount} and £${settings.maxDepositAmount}` 
      });
    }
    
    console.log('[PayPal Backend] Fetching user...');
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('[PayPal Backend] User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[PayPal Backend] User found:', user.email);
    
    // Calculate PayPal commission (fee is taken separately, full amount is deposited)
    const paypalCommissionPercentage = settings.paypalCommissionPercentage || 3.00;
    const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
    const paypalCommission = (amount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
    const totalAmount = amount + paypalCommission; // Total amount to charge
    
    console.log('[PayPal Backend] Commission calculation:');
    console.log('[PayPal Backend]   - Deposit amount:', amount);
    console.log('[PayPal Backend]   - Commission percentage:', paypalCommissionPercentage + '%');
    console.log('[PayPal Backend]   - Commission fixed:', paypalCommissionFixed);
    console.log('[PayPal Backend]   - Commission total:', paypalCommission);
    console.log('[PayPal Backend]   - Total amount to charge:', totalAmount);
    
    // Create PayPal client
    console.log('[PayPal Backend] Creating PayPal client...');
    const client = createPayPalClient(settings);
    console.log('[PayPal Backend] PayPal client created successfully');
    
    // Create PayPal order
    console.log('[PayPal Backend] Creating PayPal order request...');
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
    console.log('[PayPal Backend] Order request body:', JSON.stringify(requestBody, null, 2));
    
    console.log('[PayPal Backend] Executing PayPal order request...');
    const order = await client.execute(request);
    console.log('[PayPal Backend] PayPal order created successfully');
    console.log('[PayPal Backend] Order ID:', order.result.id);
    console.log('[PayPal Backend] Order status:', order.result.status);
    console.log('[PayPal Backend] Order links:', order.result.links);
    
    // Create pending wallet transaction
    console.log('[PayPal Backend] Creating wallet transaction...');
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
    console.log('[PayPal Backend] Wallet transaction created:', transaction._id);
    
    const approvalUrl = order.result.links.find(link => link.rel === 'approve')?.href;
    console.log('[PayPal Backend] Approval URL:', approvalUrl);
    
    const response = {
      orderId: order.result.id,
      transactionId: transaction._id,
      approvalUrl: approvalUrl,
    };
    console.log('[PayPal Backend] Sending response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('[PayPal Backend] Error creating PayPal order:', error);
    console.error('[PayPal Backend] Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
  }
});

// Capture PayPal payment and update wallet
router.post('/wallet/fund/paypal/capture', authenticateToken, async (req, res) => {
  console.log('[PayPal Backend] POST /wallet/fund/paypal/capture - Request received');
  console.log('[PayPal Backend] Request body:', req.body);
  console.log('[PayPal Backend] User ID:', req.user.id);
  
  try {
    const { orderId, transactionId } = req.body;
    console.log('[PayPal Backend] Order ID:', orderId);
    console.log('[PayPal Backend] Transaction ID:', transactionId);
    
    if (!orderId || !transactionId) {
      console.error('[PayPal Backend] Missing required parameters');
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log('[PayPal Backend] Fetching payment settings...');
    const settings = await PaymentSettings.getSettings();
    console.log('[PayPal Backend] Payment settings loaded');
    
    console.log('[PayPal Backend] Retrieving PayPal keys...');
    const paypalKeys = getPayPalKeys(settings);
    console.log('[PayPal Backend] PayPal keys retrieved');
    
    if (!paypalKeys.clientId || !paypalKeys.secretKey) {
      console.error('[PayPal Backend] PayPal is not configured');
      console.error('[PayPal Backend] Client ID missing:', !paypalKeys.clientId);
      console.error('[PayPal Backend] Secret Key missing:', !paypalKeys.secretKey);
      return res.status(400).json({ error: 'PayPal is not configured' });
    }
    
    // Verify transaction belongs to user
    console.log('[PayPal Backend] Fetching transaction from database...');
    const transaction = await Wallet.findById(transactionId);
    if (!transaction || transaction.userId.toString() !== req.user.id.toString()) {
      console.error('[PayPal Backend] Transaction not found or does not belong to user');
      return res.status(404).json({ error: 'Transaction not found' });
    }
    console.log('[PayPal Backend] Transaction found:', transaction._id);
    console.log('[PayPal Backend] Transaction status:', transaction.status);
    console.log('[PayPal Backend] Transaction amount:', transaction.amount);
    console.log('[PayPal Backend] Transaction metadata:', transaction.metadata);
    
    if (transaction.status === 'completed') {
      console.log('[PayPal Backend] Transaction already completed');
      const user = await User.findById(req.user.id);
      return res.json({ 
        message: 'Transaction already processed', 
        transaction,
        balance: user?.walletBalance || 0,
      });
    }
    
    // Create PayPal client
    console.log('[PayPal Backend] Creating PayPal client...');
    const client = createPayPalClient(settings);
    console.log('[PayPal Backend] PayPal client created successfully');
    
    // Capture the order
    console.log('[PayPal Backend] Creating capture request for order:', orderId);
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    
    console.log('[PayPal Backend] Executing PayPal capture request...');
    const capture = await client.execute(request);
    console.log('[PayPal Backend] Capture response received');
    console.log('[PayPal Backend] Capture status:', capture.result.status);
    console.log('[PayPal Backend] Capture ID:', capture.result.id);
    console.log('[PayPal Backend] Capture result:', JSON.stringify(capture.result, null, 2));
    
    if (capture.result.status !== 'COMPLETED') {
      console.error('[PayPal Backend] Payment not completed. Status:', capture.result.status);
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // Update user wallet balance (deposit full amount, fee was already charged)
    console.log('[PayPal Backend] Fetching user...');
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('[PayPal Backend] User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('[PayPal Backend] User found:', user.email);
    console.log('[PayPal Backend] Current wallet balance:', user.walletBalance);
    
    const depositAmount = transaction.metadata?.depositAmount || transaction.amount;
    console.log('[PayPal Backend] Deposit amount:', depositAmount);
    
    const previousBalance = user.walletBalance || 0;
    user.walletBalance = previousBalance + depositAmount;
    await user.save();
    console.log('[PayPal Backend] Wallet balance updated');
    console.log('[PayPal Backend] Previous balance:', previousBalance);
    console.log('[PayPal Backend] New balance:', user.walletBalance);
    
    // Update transaction
    console.log('[PayPal Backend] Updating transaction status...');
    transaction.status = 'completed';
    transaction.balance = user.walletBalance;
    transaction.paypalCaptureId = capture.result.id;
    await transaction.save();
    console.log('[PayPal Backend] Transaction updated successfully');
    
    const response = { 
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      transaction,
    };
    console.log('[PayPal Backend] Sending response:', { ...response, transaction: { ...response.transaction.toObject(), _id: response.transaction._id } });
    
    res.json(response);
  } catch (error) {
    console.error('[PayPal Backend] Error capturing PayPal payment:', error);
    console.error('[PayPal Backend] Error stack:', error.stack);
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
        console.error('Failed to send bank transfer approved email:', emailError);
      }
    }
    
    // Create in-app notification
    try {
      const { notifyBankTransferApproved } = await import('../services/notificationService.js');
      await notifyBankTransferApproved(user._id, transaction._id, depositAmount);
    } catch (notifError) {
      console.error('Failed to create bank transfer approved notification:', notifError);
    }
    
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
        console.error('Failed to send bank transfer rejected email:', emailError);
      }
    }
    
    // Create in-app notification
    try {
      const { notifyBankTransferRejected } = await import('../services/notificationService.js');
      await notifyBankTransferRejected(user._id, transaction._id, transaction.amount, adminNotes);
    } catch (notifError) {
      console.error('Failed to create bank transfer rejected notification:', notifError);
    }
    
    res.json({ 
      message: 'Manual transfer rejected',
      transaction,
    });
  } catch (error) {
    console.error('Error rejecting manual transfer:', error);
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
    console.error('Error fetching bank transfer requests:', error);
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
              console.error('Failed to send card transaction successful email:', emailError);
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
            console.error('Failed to send card transaction failed email:', emailError);
          }
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


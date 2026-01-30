import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import CustomOffer from '../models/CustomOffer.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Order from '../models/Order.js';
import PaymentSettings from '../models/PaymentSettings.js';
import User from '../models/User.js';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

const router = express.Router();

// Helper function to get Stripe instance
function getStripeInstance(settings) {
  const isLive = settings?.stripeLiveMode === true;
  const secretKey = isLive ? (settings?.stripeLiveSecretKey || settings?.stripeSecretKey) : (settings?.stripeTestSecretKey || settings?.stripeSecretKey);
  
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

// Helper function to get PayPal client
function getPayPalClient(settings) {
  const isLive = settings?.paypalLiveMode === true;
  
  if (isLive) {
    return new paypal.core.LiveEnvironment(
      settings.paypalLiveClientId || settings.paypalClientId || settings.paypalPublicKey,
      settings.paypalLiveSecretKey || settings.paypalSecretKey
    );
  } else {
    return new paypal.core.SandboxEnvironment(
      settings.paypalSandboxClientId || settings.paypalClientId || settings.paypalPublicKey,
      settings.paypalSandboxSecretKey || settings.paypalSecretKey
    );
  }
}

// Generate unique offer number
function generateOfferNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `OFFER-${timestamp}-${random}`;
}

// Professional: Create custom offer
router.post('/', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { conversationId, serviceName, price, deliveryDays, description, paymentType, milestones } = req.body;

    if (!conversationId || !serviceName || !price || !deliveryDays) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (price <= 0 || deliveryDays <= 0) {
      return res.status(400).json({ error: 'Price and delivery days must be greater than 0' });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to create offer in this conversation' });
    }

    // Get the other participant (client)
    const clientId = conversation.participants.find(
      p => p.toString() !== req.user.id.toString()
    );
    if (!clientId) {
      return res.status(400).json({ error: 'Client not found in conversation' });
    }

    // Validate milestones if milestone payment
    if (paymentType === 'milestone' && milestones) {
      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
      if (Math.abs(totalMilestoneAmount - price) > 0.01) {
        return res.status(400).json({ 
          error: `Total milestone amount (${totalMilestoneAmount}) must equal offer price (${price})` 
        });
      }
    }

    // Get response time from payment settings
    const settings = await PaymentSettings.getSettings();
    const responseTimeHours = settings.customOfferResponseTimeHours || 48;

    // Calculate response deadline
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + responseTimeHours);

    const offerNumber = generateOfferNumber();

    // Create message first (CustomOffer schema requires message ref)
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      text: `Custom offer: ${serviceName} - £${price.toFixed(2)}`,
      type: 'custom_offer',
      orderDetails: {
        serviceName,
        service: serviceName,
        amount: `£${price.toFixed(2)}`,
        price,
        deliveryDays,
        description: description || '',
        paymentType: paymentType || 'single',
        milestones: paymentType === 'milestone' ? milestones : undefined,
        status: 'pending',
        offerNumber,
        responseDeadline: responseDeadline.toISOString(),
      },
      read: false,
    });
    await message.save();

    // Create custom offer with message ID (required by schema)
    const customOffer = new CustomOffer({
      offerNumber,
      conversation: conversationId,
      professional: req.user.id,
      client: clientId,
      message: message._id,
      serviceName,
      price,
      deliveryDays,
      description: description || '',
      paymentType: paymentType || 'single',
      milestones: paymentType === 'milestone' ? milestones : undefined,
      status: 'pending',
      responseDeadline,
    });
    await customOffer.save();

    // Attach offerId to message orderDetails for client display
    message.orderDetails = message.orderDetails || {};
    message.orderDetails.offerId = customOffer._id.toString();
    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for client
    const clientIdStr = clientId.toString();
    const currentUnread = conversation.unreadCount.get(clientIdStr) || 0;
    conversation.unreadCount.set(clientIdStr, currentUnread + 1);
    await conversation.save();

    // Populate for response
    await customOffer.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar' },
      { path: 'client', select: 'firstName lastName avatar' },
    ]);

    res.json({
      message: 'Custom offer created successfully',
      offer: {
        id: customOffer._id.toString(),
        offerNumber: customOffer.offerNumber,
        serviceName: customOffer.serviceName,
        price: customOffer.price,
        deliveryDays: customOffer.deliveryDays,
        description: customOffer.description,
        paymentType: customOffer.paymentType,
        milestones: customOffer.milestones,
        status: customOffer.status,
        responseDeadline: customOffer.responseDeadline,
        createdAt: customOffer.createdAt,
      },
      messageId: message._id.toString(),
    });
  } catch (error) {
    console.error('Create custom offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create custom offer' });
  }
});

// Client: Accept custom offer (creates order)
router.post('/:offerId/accept', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { offerId } = req.params;
    const { address, skipAddress, paymentMethod, paymentMethodId } = req.body;

    const customOffer = await CustomOffer.findById(offerId)
      .populate('professional', 'firstName lastName tradingName')
      .populate('client', 'firstName lastName');

    if (!customOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Verify user is the client
    if (customOffer.client._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to accept this offer' });
    }

    // Check if offer is still pending
    if (customOffer.status !== 'pending') {
      return res.status(400).json({ 
        error: `Offer has already been ${customOffer.status}` 
      });
    }

    // Check if offer has expired
    if (new Date() > customOffer.responseDeadline) {
      customOffer.status = 'expired';
      customOffer.expiredAt = new Date();
      await customOffer.save();
      return res.status(400).json({ error: 'This offer has expired' });
    }

    // Get payment settings
    const settings = await PaymentSettings.getSettings();
    const serviceFeeAmount = settings.serviceFees || 0;

    // Calculate totals
    const subtotal = customOffer.price;
    const serviceFee = serviceFeeAmount;
    const total = subtotal + serviceFee;

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle payment (similar to regular order creation)
    let walletTransactionId = null;
    let paymentTransactionId = null;
    let newBalance = user.walletBalance || 0;

    if (paymentMethod === 'account_balance') {
      if ((user.walletBalance || 0) < total) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          required: total,
          current: user.walletBalance || 0,
        });
      }
      newBalance = (user.walletBalance || 0) - total;
      user.walletBalance = newBalance;
      await user.save();

      const Wallet = (await import('../models/Wallet.js')).default;
      const paymentTransaction = new Wallet({
        userId: user._id,
        type: 'payment',
        amount: total,
        balance: newBalance,
        status: 'completed',
        paymentMethod: 'wallet',
        description: `Custom Order Payment - ${customOffer.offerNumber}`,
        orderId: null,
        metadata: {
          offerNumber: customOffer.offerNumber,
        },
      });
      await paymentTransaction.save();
      paymentTransactionId = paymentTransaction._id;
    } else if (paymentMethod === 'card') {
      // Card payment: fund wallet first, then deduct
      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required for card payments' });
      }

      try {
        const stripe = getStripeInstance(settings);

        // Calculate Stripe fees
        const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
        const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
        const stripeCommission = (total * stripeCommissionPercentage / 100) + stripeCommissionFixed;
        const totalChargeAmount = total + stripeCommission;

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalChargeAmount * 100), // Convert to pence
          currency: 'gbp',
          payment_method: paymentMethodId,
          customer: user.stripeCustomerId, // Include customer ID
          confirm: true,
          return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
          metadata: {
            userId: user._id.toString(),
            type: 'custom_offer_payment',
            offerNumber: customOffer.offerNumber,
          },
        });

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            error: 'Payment failed',
            status: paymentIntent.status,
            requiresAction: paymentIntent.status === 'requires_action',
          });
        }

        // Fund wallet with order amount (before deducting)
        newBalance = (user.walletBalance || 0) + total;
        user.walletBalance = newBalance;
        await user.save();

        const Wallet = (await import('../models/Wallet.js')).default;
        // Create deposit transaction
        const depositTransaction = new Wallet({
          userId: user._id,
          type: 'deposit',
          amount: total,
          balance: newBalance,
          status: 'completed',
          paymentMethod: 'card',
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge,
          description: `Card Deposit - Custom Offer ${customOffer.offerNumber}`,
          metadata: {
            depositAmount: total,
            fee: stripeCommission,
            feePercentage: stripeCommissionPercentage,
            feeFixed: stripeCommissionFixed,
            offerNumber: customOffer.offerNumber,
          },
        });
        await depositTransaction.save();
        walletTransactionId = depositTransaction._id;

        // Deduct from wallet for order payment
        newBalance = newBalance - total;
        user.walletBalance = newBalance;
        await user.save();

        // Create payment transaction
        const paymentTransaction = new Wallet({
          userId: user._id,
          type: 'payment',
          amount: total,
          balance: newBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Custom Order Payment - ${customOffer.offerNumber}`,
          orderId: null, // Will be updated after order creation
          metadata: {
            offerNumber: customOffer.offerNumber,
            depositTransactionId: depositTransaction._id.toString(),
          },
        });
        await paymentTransaction.save();
        paymentTransactionId = paymentTransaction._id;
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to process card payment' });
      }
    } else if (paymentMethod === 'paypal') {
      // PayPal payment: fund wallet first, then deduct
      try {
        const environment = getPayPalClient(settings);
        const client = new paypal.core.PayPalHttpClient(environment);

        // Calculate PayPal fees
        const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
        const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
        const paypalCommission = (total * paypalCommissionPercentage / 100) + paypalCommissionFixed;
        const totalChargeAmount = total + paypalCommission;

        // Create PayPal order
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "GBP",
              value: totalChargeAmount.toFixed(2),
            },
            description: `Custom Order Payment - ${customOffer.offerNumber}`,
            custom_id: customOffer.offerNumber,
          }],
          application_context: {
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            cancel_url: `${req.headers.origin || 'http://localhost:5000'}/account?tab=messenger`,
            brand_name: "Sortars UK",
            locale: "en-GB",
          },
        });

        const order = await client.execute(request);

        if (order.statusCode !== 201) {
          return res.status(400).json({ error: 'Failed to create PayPal order' });
        }

        // Return PayPal approval URL for client to redirect
        const approveUrl = order.result.links.find(link => link.rel === 'approve')?.href;

        return res.json({
          offerId: customOffer._id.toString(),
          paypalOrderId: order.result.id,
          approveUrl,
          requiresApproval: true,
          message: 'Please approve PayPal payment to complete offer acceptance',
        });
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
      }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create order from offer
    const order = new Order({
      orderNumber,
      client: customOffer.client._id,
      professional: customOffer.professional._id,
      items: [{
        serviceId: `custom-${customOffer.offerNumber}`,
        title: customOffer.serviceName,
        seller: customOffer.professional.tradingName || `${customOffer.professional.firstName} ${customOffer.professional.lastName}`,
        price: customOffer.price,
        quantity: 1,
        booking: undefined,
      }],
      address: address ? {
        postcode: address.postcode,
        address: address.address,
        city: address.city,
        county: address.county,
        phone: address.phone,
      } : undefined,
      skipAddress: skipAddress || false,
      paymentMethod: paymentMethod || 'account_balance',
      paymentMethodId: paymentMethod === 'card' ? paymentMethodId : undefined,
      total,
      subtotal,
      discount: 0,
      serviceFee,
      status: 'In Progress',
      deliveryStatus: 'active',
      walletTransactionId,
      paymentTransactionId,
      metadata: {
        createdAt: new Date(),
        professionalPayoutAmount: subtotal,
        fromCustomOffer: true,
        customOfferId: customOffer._id,
      },
    });
    await order.save();

    // Update custom offer
    customOffer.status = 'accepted';
    customOffer.acceptedAt = new Date();
    customOffer.order = order._id;
    await customOffer.save();

    // Update message
    const message = await Message.findById(customOffer.message);
    if (message) {
      if (message.orderDetails) {
        message.orderDetails.status = 'accepted';
        message.orderDetails.orderId = order.orderNumber;
        await message.save();
      }
    }

    // Update payment transaction with order ID if exists
    if (paymentTransactionId) {
      const Wallet = (await import('../models/Wallet.js')).default;
      await Wallet.findByIdAndUpdate(paymentTransactionId, { orderId: order._id });
    }

    res.json({
      message: 'Offer accepted and order created successfully',
      order: {
        orderNumber: order.orderNumber,
        id: order._id.toString(),
        status: order.status,
        total: order.total,
      },
      offer: {
        id: customOffer._id.toString(),
        status: customOffer.status,
        acceptedAt: customOffer.acceptedAt,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Accept custom offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept custom offer' });
  }
});

// Client: Reject custom offer
router.post('/:offerId/reject', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { offerId } = req.params;

    const customOffer = await CustomOffer.findById(offerId);

    if (!customOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Verify user is the client
    if (customOffer.client.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to reject this offer' });
    }

    // Check if offer is still pending
    if (customOffer.status !== 'pending') {
      return res.status(400).json({ 
        error: `Offer has already been ${customOffer.status}` 
      });
    }

    // Update offer
    customOffer.status = 'rejected';
    customOffer.rejectedAt = new Date();
    await customOffer.save();

    // Update message
    const message = await Message.findById(customOffer.message);
    if (message && message.orderDetails) {
      message.orderDetails.status = 'rejected';
      await message.save();
    }

    res.json({
      message: 'Offer rejected successfully',
      offer: {
        id: customOffer._id.toString(),
        status: customOffer.status,
        rejectedAt: customOffer.rejectedAt,
      },
    });
  } catch (error) {
    console.error('Reject custom offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject custom offer' });
  }
});

// Capture PayPal payment for custom offer (called after user approves PayPal payment)
router.post('/paypal/capture', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { paypalOrderId, offerId } = req.body;

    if (!paypalOrderId || !offerId) {
      return res.status(400).json({ error: 'PayPal order ID and offer ID are required' });
    }

    // Find offer
    const customOffer = await CustomOffer.findById(offerId)
      .populate('professional', 'firstName lastName tradingName')
      .populate('client', 'firstName lastName');

    if (!customOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Verify offer belongs to user
    if (customOffer.client._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'You can only capture payments for your own offers' });
    }

    // Check if offer is still pending
    if (customOffer.status !== 'pending') {
      return res.status(400).json({ 
        error: `Offer has already been ${customOffer.status}` 
      });
    }

    // Get settings
    const settings = await PaymentSettings.getSettings();
    const environment = getPayPalClient(settings);
    const client = new paypal.core.PayPalHttpClient(environment);

    // Capture PayPal payment
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await client.execute(request);

    if (capture.statusCode !== 201) {
      return res.status(400).json({ error: 'Failed to capture PayPal payment' });
    }

    const captureId = capture.result.purchase_units[0].payments.captures[0].id;
    const totalAmount = parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value);

    // Calculate fees and actual deposit amount
    const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
    const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
    const paypalCommission = (customOffer.price * paypalCommissionPercentage / 100) + paypalCommissionFixed;
    const depositAmount = customOffer.price; // Amount to deposit to wallet
    const serviceFee = settings.serviceFees || 0;
    const total = depositAmount + serviceFee;

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fund wallet with order amount (before deducting)
    let newBalance = (user.walletBalance || 0) + depositAmount;
    user.walletBalance = newBalance;
    await user.save();

    const Wallet = (await import('../models/Wallet.js')).default;
    // Create deposit transaction
    const depositTransaction = new Wallet({
      userId: user._id,
      type: 'deposit',
      amount: depositAmount,
      balance: newBalance,
      status: 'completed',
      paymentMethod: 'paypal',
      paypalOrderId: paypalOrderId,
      paypalCaptureId: captureId,
      description: `PayPal Deposit - Custom Offer ${customOffer.offerNumber}`,
      metadata: {
        depositAmount,
        fee: paypalCommission,
        feePercentage: paypalCommissionPercentage,
        feeFixed: paypalCommissionFixed,
        offerNumber: customOffer.offerNumber,
      },
    });
    await depositTransaction.save();
    const walletTransactionId = depositTransaction._id;

    // Deduct from wallet for order payment
    newBalance = newBalance - total;
    user.walletBalance = newBalance;
    await user.save();

    // Create payment transaction
    const paymentTransaction = new Wallet({
      userId: user._id,
      type: 'payment',
      amount: total,
      balance: newBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      description: `Custom Order Payment - ${customOffer.offerNumber}`,
      orderId: null, // Will be updated after order creation
      metadata: {
        offerNumber: customOffer.offerNumber,
        depositTransactionId: depositTransaction._id.toString(),
      },
    });
    await paymentTransaction.save();
    const paymentTransactionId = paymentTransaction._id;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create order from offer
    const order = new Order({
      orderNumber,
      client: customOffer.client._id,
      professional: customOffer.professional._id,
      items: [{
        serviceId: `custom-${customOffer.offerNumber}`,
        title: customOffer.serviceName,
        seller: customOffer.professional.tradingName || `${customOffer.professional.firstName} ${customOffer.professional.lastName}`,
        price: customOffer.price,
        quantity: 1,
        booking: undefined,
      }],
      address: undefined, // Can be added later
      skipAddress: true,
      paymentMethod: 'paypal',
      total,
      subtotal: customOffer.price,
      discount: 0,
      serviceFee,
      status: 'In Progress',
      deliveryStatus: 'active',
      walletTransactionId,
      paymentTransactionId,
      metadata: {
        createdAt: new Date(),
        professionalPayoutAmount: customOffer.price,
        fromCustomOffer: true,
        customOfferId: customOffer._id,
      },
    });
    await order.save();

    // Update custom offer
    customOffer.status = 'accepted';
    customOffer.acceptedAt = new Date();
    customOffer.order = order._id;
    await customOffer.save();

    // Update message
    const message = await Message.findById(customOffer.message);
    if (message && message.orderDetails) {
      message.orderDetails.status = 'accepted';
      message.orderDetails.orderId = order.orderNumber;
      await message.save();
    }

    // Update payment transaction with order ID
    await Wallet.findByIdAndUpdate(paymentTransactionId, { orderId: order._id });

    return res.json({
      message: 'PayPal payment captured and order created successfully',
      order: {
        orderNumber: order.orderNumber,
        id: order._id.toString(),
        status: order.status,
        total: order.total,
      },
      offer: {
        id: customOffer._id.toString(),
        status: customOffer.status,
        acceptedAt: customOffer.acceptedAt,
      },
      newBalance,
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
  }
});

// Get custom offers for a conversation
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const offers = await CustomOffer.find({ conversation: conversationId })
      .populate('professional', 'firstName lastName tradingName avatar')
      .populate('client', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    const formattedOffers = offers.map(offer => ({
      id: offer._id.toString(),
      offerNumber: offer.offerNumber,
      serviceName: offer.serviceName,
      price: offer.price,
      deliveryDays: offer.deliveryDays,
      description: offer.description,
      paymentType: offer.paymentType,
      milestones: offer.milestones,
      status: offer.status,
      responseDeadline: offer.responseDeadline,
      acceptedAt: offer.acceptedAt,
      rejectedAt: offer.rejectedAt,
      expiredAt: offer.expiredAt,
      order: offer.order ? offer.order.toString() : undefined,
      createdAt: offer.createdAt,
      professional: {
        id: offer.professional._id.toString(),
        name: offer.professional.tradingName || `${offer.professional.firstName} ${offer.professional.lastName}`,
        avatar: offer.professional.avatar,
      },
      client: {
        id: offer.client._id.toString(),
        name: `${offer.client.firstName} ${offer.client.lastName}`,
        avatar: offer.client.avatar,
      },
    }));

    res.json({ offers: formattedOffers });
  } catch (error) {
    console.error('Get custom offers error:', error);
    res.status(500).json({ error: error.message || 'Failed to get custom offers' });
  }
});

export default router;

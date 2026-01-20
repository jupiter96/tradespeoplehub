import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import PaymentSettings from '../models/PaymentSettings.js';
import PromoCode from '../models/PromoCode.js';
import Review from '../models/Review.js';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to build order query that handles both orderNumber and _id
async function buildOrderQuery(orderId, additionalFilters = {}) {
  const mongoose = (await import('mongoose')).default;
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId) && orderId.length === 24;
  
  const query = { ...additionalFilters };
  
  if (isObjectId) {
    query.$or = [{ orderNumber: orderId }, { _id: orderId }];
  } else {
    query.orderNumber = orderId;
  }
  
  return query;
}

// Configure multer for delivery file uploads (images/videos)
const deliveryDir = path.join(__dirname, '..', 'uploads', 'deliveries');
// Create delivery directory if it doesn't exist
fs.mkdir(deliveryDir, { recursive: true }).catch(() => {});

const deliveryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, deliveryDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const deliveryUpload = multer({
  storage: deliveryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (PNG, JPG, GIF, WEBP) and videos (MP4, MPEG, MOV, AVI, WEBM) are allowed.'));
    }
  }
});

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

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Create order
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    
    const { items, address, skipAddress, paymentMethod, paymentMethodId, total, subtotal, discount = 0, serviceFee = 0, promoCode } = req.body;

    if (!items || items.length === 0) {
      console.error('[Server] No items provided');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!paymentMethod || !['account_balance', 'card', 'paypal', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get professional from first item (assuming all items are from same professional)
    const firstItem = items[0];
    // Use serviceId if available, otherwise fall back to id (for backward compatibility)
    const firstItemServiceId = firstItem.serviceId || firstItem.id;
    if (!firstItem || !firstItemServiceId) {
      return res.status(400).json({ error: 'Invalid order items' });
    }

    // Find professional from service
    // The serviceId might be a numeric string or MongoDB ObjectId
    // Try to find service by ObjectId first, then by slug if it's not a valid ObjectId
    const Service = (await import('../models/Service.js')).default;
    
    let service = null;
    let professionalId = null;
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    if (firstItemServiceId.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(firstItemServiceId);
    } else {
      // If not a valid ObjectId, try to find by slug
      service = await Service.findOne({ slug: firstItemServiceId });
      
      // If still not found and it's a numeric string, try to find professional by seller name
      if (!service && firstItem.seller) {
        const User = (await import('../models/User.js')).default;
        const professional = await User.findOne({ 
          tradingName: firstItem.seller,
          role: 'professional'
        });
        if (professional) {
          // Use the professional ID directly as fallback
          professionalId = professional._id;
        }
      }
    }
    
    // If service was found, get professional ID from service
    if (service) {
      professionalId = service.professional;
    }
    
    // If we still don't have a professional ID, return error
    if (!professionalId) {
      return res.status(404).json({ 
        error: 'Service not found',
        details: `Could not find service with ID: ${firstItemServiceId} or professional with seller name: ${firstItem.seller}`
      });
    }

    // Get payment settings to retrieve service fee
    const settings = await PaymentSettings.getSettings();
    const serviceFeeAmount = settings.serviceFees || 0;

    // Validate service fee if provided
    if (serviceFee !== undefined && serviceFee !== serviceFeeAmount) {
      return res.status(400).json({ 
        error: 'Service fee mismatch', 
        expected: serviceFeeAmount,
        received: serviceFee 
      });
    }

    // Handle promo code if provided
    let promoCodeData = null;
    if (promoCode && promoCode.code) {
      const promoCodeDoc = await PromoCode.findOne({ 
        code: promoCode.code.toUpperCase().trim(),
        status: 'active'
      });
      
      if (promoCodeDoc) {
        // Record usage
        await promoCodeDoc.recordUsage(user._id);
        
        promoCodeData = {
          code: promoCodeDoc.code,
          type: promoCodeDoc.type,
          discount: discount,
          discountType: promoCodeDoc.discountType,
        };
      }
    }

    // Recalculate total to include service fee (if not already included)
    const calculatedTotal = subtotal - discount + serviceFeeAmount;

    // Validate total matches calculated total
    if (Math.abs(total - calculatedTotal) > 0.01) {
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        expected: calculatedTotal,
        received: total,
        breakdown: {
          subtotal,
          discount,
          serviceFee: serviceFeeAmount,
        }
      });
    }

    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Calculate professional payout amount based on promo code type
    // For Pro promo: professional receives (subtotal - discount)
    // For Admin promo: professional receives full subtotal
    let professionalPayoutAmount = subtotal;
    if (promoCodeData && promoCodeData.type === 'pro') {
      professionalPayoutAmount = subtotal - discount;
    }

    // Handle payment based on method
    let walletTransactionId = null;
    let paymentTransactionId = null;
    let newBalance = user.walletBalance || 0;

    if (paymentMethod === 'account_balance') {
      // Check if balance is sufficient
      if ((user.walletBalance || 0) < total) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          required: total,
          current: user.walletBalance || 0,
          shortfall: total - (user.walletBalance || 0),
        });
      }

      // Deduct from wallet balance
      newBalance = (user.walletBalance || 0) - total;
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
        description: `Order Payment - ${orderNumber}`,
        orderId: null, // Will be updated after order creation
        metadata: {
          orderNumber,
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
        const settings = await PaymentSettings.getSettings();
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
          confirm: true,
          return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
          metadata: {
            userId: user._id.toString(),
            type: 'order_payment',
            orderNumber,
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
          description: `Card Deposit - Order ${orderNumber}`,
          metadata: {
            depositAmount: total,
            fee: stripeCommission,
            feePercentage: stripeCommissionPercentage,
            feeFixed: stripeCommissionFixed,
            orderNumber,
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
          description: `Order Payment - ${orderNumber}${promoCodeData ? ` (Promo: ${promoCodeData.code})` : ''}`,
          orderId: null, // Will be updated after order creation
          metadata: {
            orderNumber,
            depositTransactionId: depositTransaction._id.toString(),
            promoCode: promoCodeData ? {
              code: promoCodeData.code,
              type: promoCodeData.type,
              discount: discount,
            } : null,
            professionalPayoutAmount,
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
        const settings = await PaymentSettings.getSettings();
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
            description: `Order Payment - ${orderNumber}`,
            custom_id: orderNumber,
          }],
          application_context: {
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            cancel_url: `${req.headers.origin || 'http://localhost:5000'}/cart`,
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
          orderId: orderNumber, // Temporary order number
          paypalOrderId: order.result.id,
          approveUrl,
          requiresApproval: true,
          message: 'Please approve PayPal payment to complete order',
        });
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
      }
    } else if (paymentMethod === 'bank_transfer') {
      // Bank transfer: create pending transaction
      // For bank transfer, we create the order but it will be pending until admin approves the transfer
      
      // Create pending deposit transaction
      const depositTransaction = new Wallet({
        userId: user._id,
        type: 'deposit',
        amount: total,
        balance: user.walletBalance || 0, // Balance unchanged until approved
        status: 'pending',
        paymentMethod: 'manual_transfer',
        description: `Bank Transfer Deposit - Order ${orderNumber}`,
        metadata: {
          orderNumber,
          pendingOrder: true,
        },
      });
      await depositTransaction.save();
      walletTransactionId = depositTransaction._id;

      // Order will be created with pending status
      // When admin approves the bank transfer, the wallet will be funded and then deducted
    }

    const processedItems = items.map((item, index) => {
      const orderItem = {
        serviceId: item.serviceId || item.id, // Use serviceId if available, otherwise fall back to id
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons || [],
        packageType: item.packageType,
      };
      
      // Explicitly include booking if it exists
      if (item.booking && (item.booking.date || item.booking.time)) {
        orderItem.booking = {
          date: item.booking.date,
          time: item.booking.time || '',
          timeSlot: item.booking.timeSlot || undefined,
        };
      } else {
        console.log(`[Server] Item ${index + 1} has NO booking info`);
      }
      
      return orderItem;
    });
    

    const order = new Order({
      orderNumber,
      client: user._id,
      professional: professionalId,
      items: processedItems,
      address: address ? {
        postcode: address.postcode,
        address: address.address,
        city: address.city,
        county: address.county,
        phone: address.phone,
      } : undefined,
      skipAddress: skipAddress || false,
      paymentMethod,
      paymentMethodId: paymentMethod === 'card' ? paymentMethodId : undefined,
      total,
      subtotal,
      discount,
      promoCode: promoCodeData,
      serviceFee: serviceFeeAmount,
      status: 'placed', // New orders start with 'placed' status awaiting professional response
      walletTransactionId,
      paymentTransactionId,
      metadata: {
        createdAt: new Date(),
        professionalPayoutAmount, // Store professional payout amount
        promoCodeType: promoCodeData?.type || null,
      },
    });
    
    await order.save();
    
    const savedOrder = await Order.findById(order._id);
    // Update payment transaction with order ID if exists
    if (paymentTransactionId) {
      await Wallet.findByIdAndUpdate(paymentTransactionId, { orderId: order._id });
    }

    // Populate professional and client info for response
    await order.populate([
      { path: 'client', select: 'firstName lastName email phone' },
      { path: 'professional', select: 'firstName lastName tradingName email phone' },
    ]);

    const responseData = {
      orderId: order.orderNumber,
      order: order.toObject(),
      newBalance,
      message: 'Order created successfully',
    };
    
    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Capture PayPal payment for order (called after user approves PayPal payment)
router.post('/paypal/capture', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { paypalOrderId, orderNumber } = req.body;

    if (!paypalOrderId || !orderNumber) {
      return res.status(400).json({ error: 'PayPal order ID and order number are required' });
    }

    // Find order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.client.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'You can only capture payments for your own orders' });
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
    const paypalCommission = (order.total * paypalCommissionPercentage / 100) + paypalCommissionFixed;
    const depositAmount = order.total; // Amount to deposit to wallet

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fund wallet with order amount (before deducting)
    let newBalance = (user.walletBalance || 0) + depositAmount;
    user.walletBalance = newBalance;
    await user.save();

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
      description: `PayPal Deposit - Order ${order.orderNumber}`,
      metadata: {
        depositAmount,
        fee: paypalCommission,
        feePercentage: paypalCommissionPercentage,
        feeFixed: paypalCommissionFixed,
        orderNumber: order.orderNumber,
      },
    });
    await depositTransaction.save();

    // Deduct from wallet for order payment
    newBalance = newBalance - order.total;
    user.walletBalance = newBalance;
    await user.save();

    // Create payment transaction
    const paymentTransaction = new Wallet({
      userId: user._id,
      type: 'payment',
      amount: order.total,
      balance: newBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      description: `Order Payment - ${order.orderNumber}`,
      orderId: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        depositTransactionId: depositTransaction._id.toString(),
      },
    });
    await paymentTransaction.save();

    // Update order
    order.walletTransactionId = depositTransaction._id;
    order.paymentTransactionId = paymentTransaction._id;
    await order.save();

    return res.json({
      orderId: order.orderNumber,
      newBalance,
      message: 'PayPal payment captured and order completed',
    });
  } catch (error) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: error.message || 'Failed to capture PayPal payment' });
  }
});

// Get user's orders
router.get('/', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter orders based on user role
    if (userRole === 'client') {
      query = { client: req.user.id };
    } else if (userRole === 'professional') {
      query = { professional: req.user.id };
    }

    // Get orders with populated data
    const orders = await Order.find(query)
      .populate([
        { path: 'client', select: 'firstName lastName email phone avatar' },
        { path: 'professional', select: 'firstName lastName tradingName email phone avatar' },
      ])
      .sort({ createdAt: -1 })
      .lean();

    // Fetch reviews for all orders
    const orderIds = orders.map(o => o._id);
    const reviews = await Review.find({ order: { $in: orderIds } })
      .populate('reviewer', 'firstName lastName tradingName avatar')
      .populate('responseBy', 'firstName lastName tradingName avatar')
      .lean();
    
    // Create a map of orderId to review
    const reviewMap = {};
    reviews.forEach(review => {
      reviewMap[review.order.toString()] = review;
    });

    // Transform orders to match frontend format
    const transformedOrders = orders.map(order => {
      const review = reviewMap[order._id.toString()];
      const client = order.client;
      const professional = order.professional;
      
      // Determine service name from first item
      const serviceName = order.items?.[0]?.title || 'Service Order';
      
      // Format amount
      const amount = `£${order.total.toFixed(2)}`;
      
      // Map status
      let status = order.status || 'placed';
      if (status === 'pending') status = 'placed';
      if (status === 'placed') status = 'placed';
      if (status === 'in_progress' || status === 'In Progress') status = 'In Progress';
      if (status === 'completed' || status === 'Completed') status = 'Completed';
      if (status === 'cancelled' || status === 'Cancelled') status = 'Cancelled';
      if (status === 'rejected' || status === 'Rejected') status = 'Cancelled';
      if (status === 'disputed') status = 'disputed';
      
      // Map delivery status
      let deliveryStatus = order.deliveryStatus || 'active';
      if (deliveryStatus === 'pending') deliveryStatus = 'pending';
      if (deliveryStatus === 'active') deliveryStatus = 'active';
      if (deliveryStatus === 'delivered') deliveryStatus = 'delivered';
      if (deliveryStatus === 'completed') deliveryStatus = 'completed';
      if (deliveryStatus === 'cancelled') deliveryStatus = 'cancelled';
      if (deliveryStatus === 'dispute') deliveryStatus = 'dispute';
      
      // Format dates
      const date = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate).toISOString().split('T')[0] : undefined;
      const completedDate = order.completedDate ? new Date(order.completedDate).toISOString().split('T')[0] : undefined;
      const deliveredDate = order.deliveredDate ? new Date(order.deliveredDate).toISOString().split('T')[0] : undefined;
      
      // Get booking info from first item
      const booking = order.items?.[0]?.booking;
      
      // Transform address
      const address = order.address ? {
        name: `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Client',
        addressLine1: order.address.address || '',
        addressLine2: '',
        city: order.address.city || '',
        postcode: order.address.postcode || '',
        phone: order.address.phone || client?.phone || '',
      } : undefined;

      return {
        id: order.orderNumber || order._id.toString(),
        items: order.items.map(item => ({
          id: item.serviceId,
          title: item.title,
          seller: item.seller || (professional?.tradingName || `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim()),
          price: item.price,
          image: item.image || '',
          rating: item.rating,
          quantity: item.quantity,
          addons: item.addons || [],
          booking: item.booking,
          packageType: item.packageType,
        })),
        service: serviceName,
        date,
        status,
        amount,
        amountValue: order.total,
        professional: professional?.tradingName || `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim() || 'Professional',
        professionalId: professional?._id ? professional._id.toString() : undefined,
        professionalAvatar: professional?.avatar || '',
        professionalPhone: professional?.phone || '',
        professionalEmail: professional?.email || '',
        client: userRole === 'professional' ? (client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : 'Client') : undefined,
        clientAvatar: userRole === 'professional' ? (client?.avatar || '') : undefined,
        clientPhone: userRole === 'professional' ? (client?.phone || '') : undefined,
        clientEmail: userRole === 'professional' ? (client?.email || '') : undefined,
        address,
        description: order.items?.[0]?.title || 'Service Order',
        scheduledDate,
        completedDate,
        deliveredDate,
        rating: order.rating || null,
        review: order.review || undefined,
        deliveryStatus,
        booking,
        disputeId: order.disputeId || undefined,
        expectedDelivery: order.expectedDelivery || undefined,
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        serviceFee: order.serviceFee || 0,
        extensionRequest: order.extensionRequest ? {
          status: order.extensionRequest.status,
          requestedDate: order.extensionRequest.requestedDate ? new Date(order.extensionRequest.requestedDate).toISOString() : undefined,
          newDeliveryDate: order.extensionRequest.newDeliveryDate ? new Date(order.extensionRequest.newDeliveryDate).toISOString() : undefined,
          reason: order.extensionRequest.reason,
          requestedAt: order.extensionRequest.requestedAt ? new Date(order.extensionRequest.requestedAt).toISOString() : undefined,
          respondedAt: order.extensionRequest.respondedAt ? new Date(order.extensionRequest.respondedAt).toISOString() : undefined,
        } : undefined,
        deliveryFiles: order.deliveryFiles ? order.deliveryFiles.map(file => ({
          url: file.url,
          fileName: file.fileName,
          fileType: file.fileType,
          uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
        })) : [],
        deliveryMessage: order.deliveryMessage || undefined,
        cancellationRequest: order.cancellationRequest ? {
          status: order.cancellationRequest.status,
          requestedBy: order.cancellationRequest.requestedBy ? order.cancellationRequest.requestedBy.toString() : undefined,
          reason: order.cancellationRequest.reason,
          requestedAt: order.cancellationRequest.requestedAt ? new Date(order.cancellationRequest.requestedAt).toISOString() : undefined,
          responseDeadline: order.cancellationRequest.responseDeadline ? new Date(order.cancellationRequest.responseDeadline).toISOString() : undefined,
          respondedAt: order.cancellationRequest.respondedAt ? new Date(order.cancellationRequest.respondedAt).toISOString() : undefined,
          respondedBy: order.cancellationRequest.respondedBy ? order.cancellationRequest.respondedBy.toString() : undefined,
        } : undefined,
        acceptedByProfessional: order.acceptedByProfessional || false,
        acceptedAt: order.acceptedAt ? new Date(order.acceptedAt).toISOString() : undefined,
        rejectedAt: order.rejectedAt ? new Date(order.rejectedAt).toISOString() : undefined,
        rejectionReason: order.rejectionReason || undefined,
        revisionRequest: order.revisionRequest ? {
          status: order.revisionRequest.status,
          reason: order.revisionRequest.reason,
          requestedAt: order.revisionRequest.requestedAt ? new Date(order.revisionRequest.requestedAt).toISOString() : undefined,
          respondedAt: order.revisionRequest.respondedAt ? new Date(order.revisionRequest.respondedAt).toISOString() : undefined,
          additionalNotes: order.revisionRequest.additionalNotes || undefined,
        } : undefined,
        additionalInformation: order.additionalInformation ? {
          message: order.additionalInformation.message || '',
          files: order.additionalInformation.files ? order.additionalInformation.files.map(file => ({
            url: file.url,
            fileName: file.fileName,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
          })) : [],
          submittedAt: order.additionalInformation.submittedAt ? new Date(order.additionalInformation.submittedAt).toISOString() : undefined,
        } : undefined,
        metadata: order.metadata || {},
        disputeInfo: order.metadata?.disputeStatus ? {
          id: order.disputeId || undefined,
          status: order.metadata.disputeStatus,
          reason: order.metadata.disputeReason || undefined,
          evidence: order.metadata.disputeEvidence || undefined,
          claimantId: order.metadata.disputeClaimantId ? order.metadata.disputeClaimantId.toString() : undefined,
          respondentId: order.metadata.disputeRespondentId ? order.metadata.disputeRespondentId.toString() : undefined,
          responseDeadline: order.metadata.disputeResponseDeadline ? new Date(order.metadata.disputeResponseDeadline).toISOString() : undefined,
          respondedAt: order.metadata.disputeRespondedAt ? new Date(order.metadata.disputeRespondedAt).toISOString() : undefined,
          negotiationDeadline: order.metadata.disputeNegotiationDeadline ? new Date(order.metadata.disputeNegotiationDeadline).toISOString() : undefined,
          arbitrationRequested: order.metadata.disputeArbitrationRequested || false,
          arbitrationRequestedBy: order.metadata.disputeArbitrationRequestedBy ? order.metadata.disputeArbitrationRequestedBy.toString() : undefined,
          arbitrationRequestedAt: order.metadata.disputeArbitrationRequestedAt ? new Date(order.metadata.disputeArbitrationRequestedAt).toISOString() : undefined,
          arbitrationFeeAmount: order.metadata.disputeArbitrationFeeAmount || undefined,
          createdAt: order.metadata.disputeCreatedAt ? new Date(order.metadata.disputeCreatedAt).toISOString() : undefined,
          closedAt: order.metadata.disputeClosedAt ? new Date(order.metadata.disputeClosedAt).toISOString() : undefined,
          winnerId: order.metadata.disputeWinnerId ? order.metadata.disputeWinnerId.toString() : undefined,
          loserId: order.metadata.disputeLoserId ? order.metadata.disputeLoserId.toString() : undefined,
          adminDecision: order.metadata.disputeAdminDecision || false,
          decisionNotes: order.metadata.disputeDecisionNotes || undefined,
          autoClosed: order.metadata.disputeAutoClosed || false,
        } : undefined,
        reviewInfo: review ? {
          id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
          reviewerName: review.reviewerName,
          reviewer: review.reviewer ? {
            id: review.reviewer._id.toString(),
            name: review.reviewerName,
            avatar: review.reviewer.avatar || '',
          } : {
            name: review.reviewerName,
          },
          response: review.response || undefined,
          responseBy: review.responseBy ? {
            id: review.responseBy._id.toString(),
            name: `${review.responseBy.firstName || ''} ${review.responseBy.lastName || ''}`.trim() || review.responseBy.tradingName,
            avatar: review.responseBy.avatar || '',
          } : undefined,
          responseAt: review.responseAt ? new Date(review.responseAt).toISOString() : undefined,
          hasResponded: review.hasResponded || false,
          createdAt: new Date(review.createdAt).toISOString(),
        } : undefined,
      };
    });

    return res.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

// Professional: Request delivery extension
router.post('/:orderId/extension-request', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newDeliveryDate, reason } = req.body;

    if (!newDeliveryDate) {
      return res.status(400).json({ error: 'New delivery date is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in progress (can only request extension for active orders)
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Can only request extension for orders in progress' });
    }

    // Check if there's already a pending extension request
    if (order.extensionRequest && order.extensionRequest.status === 'pending') {
      return res.status(400).json({ error: 'There is already a pending extension request' });
    }

    // Update extension request
    order.extensionRequest = {
      status: 'pending',
      requestedDate: new Date(),
      newDeliveryDate: new Date(newDeliveryDate),
      reason: reason || '',
      requestedAt: new Date(),
      respondedAt: null,
    };

    await order.save();

    res.json({ 
      message: 'Extension request submitted successfully',
      extensionRequest: order.extensionRequest
    });
  } catch (error) {
    console.error('Extension request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request extension' });
  }
});

// Client: Approve or reject extension request
router.put('/:orderId/extension-request', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.extensionRequest || order.extensionRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending extension request found' });
    }

    if (action === 'approve') {
      // Update scheduled date if exists in metadata
      if (order.extensionRequest.newDeliveryDate) {
        if (order.metadata && typeof order.metadata === 'object') {
          order.metadata.scheduledDate = order.extensionRequest.newDeliveryDate;
        } else {
          order.metadata = { scheduledDate: order.extensionRequest.newDeliveryDate };
        }
      }

      order.extensionRequest.status = 'approved';
    } else {
      order.extensionRequest.status = 'rejected';
    }

    order.extensionRequest.respondedAt = new Date();

    await order.save();

    res.json({ 
      message: `Extension request ${action}d successfully`,
      extensionRequest: order.extensionRequest
    });
  } catch (error) {
    console.error('Extension request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to extension request' });
  }
});

// Request cancellation (both client and professional can request)
router.post('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is authorized (must be client or professional for this order)
    const isClient = order.client._id.toString() === req.user.id.toString();
    const isProfessional = order.professional._id.toString() === req.user.id.toString();

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'Not authorized to request cancellation for this order' });
    }

    // Can't request cancellation if order has been delivered
    if (order.status === 'Completed' || order.deliveryStatus === 'delivered' || order.deliveryStatus === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel order that has been delivered. Please initiate a dispute instead.' });
    }

    // If order is "In Progress" and client is requesting cancellation, require professional approval
    if (order.status === 'In Progress' && isClient) {
      // This will create a cancellation request that requires professional approval
      // The logic below will handle this
    }

    // Check if there's already a pending cancellation request
    if (order.cancellationRequest && order.cancellationRequest.status === 'pending') {
      return res.status(400).json({ error: 'There is already a pending cancellation request' });
    }

    // Get cancellation response time from payment settings
    const PaymentSettings = (await import('../models/PaymentSettings.js')).default;
    const paymentSettings = await PaymentSettings.findOne({});
    const responseTimeHours = paymentSettings?.cancellationResponseTimeHours || 24;

    // Calculate response deadline
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + responseTimeHours);

    // Store current status before cancellation request for potential restoration
    if (!order.metadata) order.metadata = {};
    if (!order.metadata.statusBeforeCancellationRequest) {
      order.metadata.statusBeforeCancellationRequest = order.status;
    }

    // Update cancellation request
    order.cancellationRequest = {
      status: 'pending',
      requestedBy: req.user.id,
      reason: reason || '',
      requestedAt: new Date(),
      responseDeadline: responseDeadline,
      respondedAt: null,
      respondedBy: null,
    };

    await order.save();

    res.json({ 
      message: 'Cancellation request submitted successfully',
      cancellationRequest: order.cancellationRequest,
      responseDeadline: responseDeadline
    });
  } catch (error) {
    console.error('Cancellation request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request cancellation' });
  }
});

// Respond to cancellation request (approve or reject)
router.put('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending cancellation request found' });
    }

    // Check if user is authorized (must be the other party, not the one who requested)
    const isClient = order.client._id.toString() === req.user.id.toString();
    const isProfessional = order.professional._id.toString() === req.user.id.toString();
    const requestedBy = order.cancellationRequest.requestedBy.toString();

    // Cannot respond to own request
    if (req.user.id.toString() === requestedBy) {
      return res.status(400).json({ error: 'Cannot respond to your own cancellation request' });
    }

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'Not authorized to respond to this cancellation request' });
    }

    if (action === 'approve') {
      // Cancel the order
      order.status = 'Cancelled';
      order.deliveryStatus = 'cancelled';
      order.cancellationRequest.status = 'approved';
      
      // Handle refund if payment was made
      // TODO: Implement refund logic here based on payment method
      
    } else {
      // Reject cancellation - order continues
      order.cancellationRequest.status = 'rejected';
    }

    order.cancellationRequest.respondedAt = new Date();
    order.cancellationRequest.respondedBy = req.user.id;

    await order.save();

    res.json({ 
      message: `Cancellation request ${action}d successfully`,
      cancellationRequest: order.cancellationRequest,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Cancellation request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to cancellation request' });
  }
});

// Withdraw cancellation request
router.delete('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending cancellation request to withdraw' });
    }

    // Check if user is the one who requested cancellation
    if (order.cancellationRequest.requestedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to withdraw this cancellation request' });
    }

    // Store the previous status before cancellation request (for restoration)
    const previousStatus = order.metadata?.statusBeforeCancellationRequest || order.status;
    
    // Withdraw cancellation request - order returns to processing
    order.cancellationRequest.status = 'withdrawn';
    
    // Restore order status to previous status (before cancellation request)
    // If status was 'placed' or 'In Progress', restore it
    if (previousStatus === 'placed' || previousStatus === 'In Progress') {
      order.status = previousStatus;
    } else if (order.status === 'Cancelled') {
      // If order was already cancelled, restore to previous status
      order.status = previousStatus;
    }

    await order.save();

    res.json({ 
      message: 'Cancellation request withdrawn successfully',
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Cancellation request withdrawal error:', error);
    res.status(500).json({ error: error.message || 'Failed to withdraw cancellation request' });
  }
});

// Professional: Accept order
router.post('/:orderId/accept', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in placed status
    if (order.status !== 'placed') {
      return res.status(400).json({ error: 'Order can only be accepted when it is in placed status' });
    }

    // Check if already accepted
    if (order.acceptedByProfessional) {
      return res.status(400).json({ error: 'Order has already been accepted' });
    }

    // Accept order - status remains 'placed' until booking time
    order.acceptedByProfessional = true;
    order.acceptedAt = new Date();
    order.rejectedAt = null;
    order.rejectionReason = null;

    await order.save();

    res.json({ 
      message: 'Order accepted successfully',
      order: {
        status: order.status,
        acceptedByProfessional: order.acceptedByProfessional,
        acceptedAt: order.acceptedAt,
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept order' });
  }
});

// Professional: Reject order
router.post('/:orderId/reject', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in placed status
    if (order.status !== 'placed') {
      return res.status(400).json({ error: 'Order can only be rejected when it is in placed status' });
    }

    // Check if already accepted
    if (order.acceptedByProfessional) {
      return res.status(400).json({ error: 'Cannot reject an order that has already been accepted' });
    }

    // Reject order - change status to Cancelled
    order.status = 'Cancelled';
    order.deliveryStatus = 'cancelled';
    order.acceptedByProfessional = false;
    order.rejectedAt = new Date();
    order.rejectionReason = reason || '';

    // TODO: Handle refund if payment was made
    // TODO: Notify client about rejection

    await order.save();

    res.json({ 
      message: 'Order rejected successfully',
      order: {
        status: order.status,
        rejectedAt: order.rejectedAt,
        rejectionReason: order.rejectionReason,
      }
    });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject order' });
  }
});

// Professional: Mark order as delivered (completed) with files
router.post('/:orderId/deliver', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in progress
    if (order.status !== 'In Progress') {
      // Clean up uploaded files if order is not in progress
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Order must be in progress before marking as delivered' });
    }

    // Process uploaded files
    const deliveryFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        deliveryFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Mark order as delivered
    order.status = 'In Progress'; // Keep status as In Progress
    order.deliveryStatus = 'delivered';
    order.deliveredDate = new Date();
    
    // Store delivery files and message
    if (deliveryFiles.length > 0) {
      order.deliveryFiles = deliveryFiles;
    }
    if (deliveryMessage && deliveryMessage.trim()) {
      order.deliveryMessage = deliveryMessage.trim();
    }

    await order.save();

    res.json({ 
      message: 'Order marked as delivered successfully',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        deliveredDate: order.deliveredDate,
        deliveryFiles: order.deliveryFiles,
        deliveryMessage: order.deliveryMessage,
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Deliver order error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark order as delivered' });
  }
});

// Serve delivery files
router.get('/deliveries/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(deliveryDir, filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve delivery file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Client: Request revision (modification) for delivered order
router.post('/:orderId/revision-request', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Revision reason is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is delivered
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Revision can only be requested for delivered orders' });
    }

    // Check if there's already a pending or in_progress revision request
    if (order.revisionRequest && (order.revisionRequest.status === 'pending' || order.revisionRequest.status === 'in_progress')) {
      return res.status(400).json({ error: 'There is already an active revision request' });
    }

    // Create revision request
    order.revisionRequest = {
      status: 'pending',
      reason: reason.trim(),
      requestedAt: new Date(),
      respondedAt: null,
      additionalNotes: null,
    };

    // Update order status - keep delivery status but mark that revision is requested
    // Order remains in "delivered" status but revision is pending

    await order.save();

    res.json({ 
      message: 'Revision request submitted successfully',
      revisionRequest: order.revisionRequest
    });
  } catch (error) {
    console.error('Revision request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request revision' });
  }
});

// Professional: Respond to revision request (accept and start work, or reject)
router.put('/:orderId/revision-request', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, additionalNotes } = req.body; // action: 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "accept" or "reject"' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.revisionRequest || order.revisionRequest.status !== 'pending') {
      return res.status(400).json({ error: 'No pending revision request found' });
    }

    if (action === 'accept') {
      // Accept revision request - mark as in_progress
      order.revisionRequest.status = 'in_progress';
      order.revisionRequest.additionalNotes = additionalNotes || null;
      order.revisionRequest.respondedAt = new Date();
      
      // Order status remains "In Progress" but revision is in progress
      // Delivery status remains "delivered" but we track revision separately
    } else {
      // Reject revision request
      order.revisionRequest.status = 'rejected';
      order.revisionRequest.respondedAt = new Date();
      order.revisionRequest.additionalNotes = additionalNotes || null;
    }

    await order.save();

    res.json({ 
      message: `Revision request ${action}ed successfully`,
      revisionRequest: order.revisionRequest,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Revision request response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to revision request' });
  }
});

// Professional: Complete revision and re-deliver
router.post('/:orderId/revision-complete', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            try {
              unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if there's an active revision request
    if (!order.revisionRequest || order.revisionRequest.status !== 'in_progress') {
      // Clean up uploaded files if no active revision
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            try {
              unlinkSync(file.path);
            } catch (err) {
              console.error('Error deleting file:', err);
            }
          }
        });
      }
      return res.status(400).json({ error: 'No active revision request found' });
    }

    // Process uploaded files (if any)
    const deliveryFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        deliveryFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Mark revision as completed
    order.revisionRequest.status = 'completed';
    order.revisionRequest.respondedAt = new Date();

    // Re-deliver the order
    order.deliveryStatus = 'delivered';
    order.deliveredDate = new Date();
    
    // Update or append delivery files and message
    if (deliveryFiles.length > 0) {
      // Append new files to existing ones or replace if none exist
      order.deliveryFiles = order.deliveryFiles ? [...order.deliveryFiles, ...deliveryFiles] : deliveryFiles;
    }
    if (deliveryMessage && deliveryMessage.trim()) {
      // Update delivery message or append to existing one
      order.deliveryMessage = order.deliveryMessage 
        ? `${order.deliveryMessage}\n\n[Revision] ${deliveryMessage.trim()}` 
        : deliveryMessage.trim();
    }

    await order.save();

    res.json({ 
      message: 'Revision completed and order re-delivered successfully',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        deliveredDate: order.deliveredDate,
        deliveryFiles: order.deliveryFiles,
        deliveryMessage: order.deliveryMessage,
        revisionRequest: order.revisionRequest,
      }
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Revision complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete revision' });
  }
});

// Professional: Mark order as complete with verification data
router.post('/:orderId/professional-complete', authenticateToken, requireRole(['professional']), deliveryUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { completionMessage } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is delivered
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      // Clean up uploaded files if order is not delivered
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Order must be delivered before marking as complete' });
    }

    // Check if already marked as complete by professional
    if (order.metadata?.professionalCompleteRequest) {
      return res.status(400).json({ error: 'Completion request already submitted. Waiting for client approval.' });
    }

    // Process uploaded files (verification data)
    const completionFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        completionFiles.push({
          url: `/api/orders/deliveries/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Store completion request in metadata
    if (!order.metadata) order.metadata = {};
    order.metadata.professionalCompleteRequest = {
      requestedAt: new Date(),
      completionMessage: completionMessage || '',
      completionFiles: completionFiles,
    };

    await order.save();

    res.json({ 
      message: 'Completion request submitted successfully. Waiting for client approval.',
      completionRequest: order.metadata.professionalCompleteRequest
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Professional complete error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit completion request' });
  }
});

// Client: Accept delivery and release funds to professional
router.post('/:orderId/complete', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body; // Optional rating and review

    const order = await Order.findOne({ 
      $or: [{ orderNumber: orderId }, { _id: orderId }],
      client: req.user.id 
    }).populate('professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in delivered status
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order must be delivered before completing' });
    }

    // Check if professional has submitted completion request
    if (!order.metadata?.professionalCompleteRequest) {
      return res.status(400).json({ error: 'Professional must submit completion request first' });
    }

    // Get professional user
    const professional = await User.findById(order.professional);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Get client user
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get professional payout amount from order metadata
    const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;

    // Check if funds have already been released
    if (order.status === 'Completed') {
      return res.status(400).json({ error: 'Order has already been completed and funds released' });
    }

    // Release funds to professional's wallet
    professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
    await professional.save();

    // Create wallet transaction for professional payout
    const payoutTransaction = new Wallet({
      userId: professional._id,
      type: 'deposit', // Deposit to professional's wallet
      amount: professionalPayoutAmount,
      balance: professional.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet', // Internal transfer
      orderId: order._id,
      description: `Payment for Order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        orderSubtotal: order.subtotal,
        discount: order.discount || 0,
        promoCode: order.promoCode || null,
        promoCodeType: order.metadata?.promoCodeType || null,
      },
    });

    await payoutTransaction.save();

    // Update order status to completed
    order.status = 'Completed';
    order.deliveryStatus = 'completed';
    order.completedDate = new Date();
    
    // Store rating and review in order (for backward compatibility)
    if (rating !== undefined) {
      order.rating = rating;
    }
    if (review !== undefined) {
      order.review = review;
    }

    await order.save();

    // Create review if rating and/or review is provided
    let reviewDoc = null;
    if (rating !== undefined || (review && review.trim())) {
      // Check if review already exists for this order
      reviewDoc = await Review.findOne({ order: order._id });
      
      if (reviewDoc) {
        // Update existing review
        if (rating !== undefined) reviewDoc.rating = rating;
        if (review !== undefined) reviewDoc.comment = review.trim() || '';
        reviewDoc.reviewer = client._id;
        reviewDoc.reviewerName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous';
      } else {
        // Create new review
        reviewDoc = new Review({
          professional: professional._id,
          order: order._id,
          reviewer: client._id,
          reviewerName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous',
          rating: rating || 0,
          comment: review?.trim() || '',
        });
      }
      await reviewDoc.save();
    }

    await order.save();

    res.json({ 
      message: 'Order completed successfully. Funds have been released to the professional.',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        completedDate: order.completedDate,
      },
      professionalPayoutAmount: professionalPayoutAmount,
      professionalNewBalance: professional.walletBalance,
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete order' });
  }
});

// Professional: Respond to review (one-time only)
router.post('/reviews/:reviewId/respond', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const review = await Review.findById(reviewId).populate('professional');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if review belongs to the professional
    const professionalId = review.professional?._id || review.professional;
    if (professionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only respond to reviews for your own services' });
    }

    // Check if already responded
    if (review.hasResponded) {
      return res.status(400).json({ error: 'You have already responded to this review' });
    }

    // Update review with response
    review.response = response.trim();
    review.responseBy = req.user.id;
    review.responseAt = new Date();
    review.hasResponded = true;

    await review.save();

    res.json({ 
      message: 'Response added successfully',
      review: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        response: review.response,
        responseAt: review.responseAt,
        hasResponded: review.hasResponded,
      }
    });
  } catch (error) {
    console.error('Review response error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to review' });
  }
});

// Get review for an order
router.get('/:orderId/review', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId, {
      $or: [{ client: req.user.id }, { professional: req.user.id }]
    }));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const review = await Review.findOne({ order: order._id })
      .populate('reviewer', 'firstName lastName tradingName avatar')
      .populate('responseBy', 'firstName lastName tradingName avatar');

    if (!review) {
      return res.json({ review: null });
    }

    res.json({ 
      review: {
        id: review._id,
        professional: review.professional.toString(),
        order: review.order.toString(),
        reviewer: review.reviewer ? {
          id: review.reviewer._id.toString(),
          name: review.reviewerName,
          avatar: review.reviewer.avatar,
        } : {
          name: review.reviewerName,
        },
        rating: review.rating,
        comment: review.comment,
        response: review.response,
        responseBy: review.responseBy ? {
          id: review.responseBy._id.toString(),
          name: `${review.responseBy.firstName || ''} ${review.responseBy.lastName || ''}`.trim() || review.responseBy.tradingName,
          avatar: review.responseBy.avatar,
        } : null,
        responseAt: review.responseAt ? new Date(review.responseAt).toISOString() : undefined,
        hasResponded: review.hasResponded,
        createdAt: new Date(review.createdAt).toISOString(),
      }
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message || 'Failed to get review' });
  }
});

// Create dispute for an order
router.post('/:orderId/dispute', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, evidence } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Dispute reason is required' });
    }

    const order = await Order.findOne({ 
      $or: [{ orderNumber: orderId }, { _id: orderId }]
    }).populate('client', 'firstName lastName tradingName')
      .populate('professional', 'firstName lastName tradingName');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order has been delivered
    if (order.deliveryStatus !== 'delivered' && order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Disputes can only be opened for delivered orders' });
    }

    // Check if user is either the client or professional for this order
    const isClient = order.client?.toString() === req.user.id || (order.client?._id && order.client._id.toString() === req.user.id);
    const isProfessional = order.professional?.toString() === req.user.id || (order.professional?._id && order.professional._id.toString() === req.user.id);

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'You are not authorized to create a dispute for this order' });
    }

    // Check if dispute already exists
    if (order.disputeId) {
      return res.status(400).json({ error: 'A dispute already exists for this order' });
    }

    // Get dispute response time from payment settings
    const settings = await PaymentSettings.getSettings();
    const responseTimeHours = settings.disputeResponseTimeHours || 48;

    // Calculate response deadline
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + responseTimeHours);

    // Determine claimant and respondent
    const claimantId = req.user.id;
    const respondentId = isClient ? (order.professional?._id || order.professional) : (order.client?._id || order.client);

    // Generate dispute ID
    const disputeId = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update order status to disputed
    order.status = 'disputed';
    order.deliveryStatus = 'dispute';
    order.disputeId = disputeId;

    // Store dispute info in metadata
    if (!order.metadata) order.metadata = {};
    order.metadata.disputeReason = reason;
    order.metadata.disputeEvidence = evidence || '';
    order.metadata.disputeCreatedBy = claimantId;
    order.metadata.disputeCreatedAt = new Date();
    order.metadata.disputeClaimantId = claimantId;
    order.metadata.disputeRespondentId = respondentId;
    order.metadata.disputeResponseDeadline = responseDeadline;
    order.metadata.disputeRespondedAt = null;
    order.metadata.disputeStatus = 'open'; // open, responded, closed

    await order.save();

    res.json({ 
      message: 'Dispute created successfully',
      disputeId: disputeId,
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        disputeId: order.disputeId,
      },
      dispute: {
        id: disputeId,
        responseDeadline: responseDeadline.toISOString(),
        claimantId: claimantId,
        respondentId: respondentId.toString(),
      }
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to create dispute' });
  }
});

// Respond to dispute
router.post('/:orderId/dispute/respond', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body; // Optional message/response

    const order = await Order.findOne(await buildOrderQuery(orderId));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if dispute exists
    if (!order.disputeId || !order.metadata?.disputeStatus) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is still open
    if (order.metadata.disputeStatus !== 'open') {
      return res.status(400).json({ error: 'This dispute is no longer open' });
    }

    // Check if user is the respondent
    const respondentId = order.metadata.disputeRespondentId;
    const isRespondent = respondentId?.toString() === req.user.id;

    if (!isRespondent) {
      return res.status(403).json({ error: 'Only the respondent can respond to this dispute' });
    }

    // Check if already responded
    if (order.metadata.disputeRespondedAt) {
      return res.status(400).json({ error: 'You have already responded to this dispute' });
    }

    // Check if response deadline has passed
    const responseDeadline = order.metadata.disputeResponseDeadline;
    if (responseDeadline && new Date(responseDeadline) < new Date()) {
      return res.status(400).json({ error: 'The response deadline has passed' });
    }

    // Get negotiation time from payment settings
    const settings = await PaymentSettings.getSettings();
    const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;

    // Calculate negotiation deadline
    const negotiationDeadline = new Date();
    negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);

    // Mark dispute as responded and enter negotiation phase
    order.metadata.disputeStatus = 'negotiation';
    order.metadata.disputeRespondedAt = new Date();
    order.metadata.disputeNegotiationDeadline = negotiationDeadline;
    order.metadata.disputeArbitrationRequested = false;
    order.metadata.disputeArbitrationRequestedBy = null;
    order.metadata.disputeArbitrationFeePaid = false;
    if (message && message.trim()) {
      order.metadata.disputeResponseMessage = message.trim();
    }

    await order.save();

    res.json({ 
      message: 'Dispute response submitted successfully',
      dispute: {
        id: order.disputeId,
        status: order.metadata.disputeStatus,
        respondedAt: order.metadata.disputeRespondedAt,
      }
    });
  } catch (error) {
    console.error('Respond to dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to dispute' });
  }
});

// Request admin arbitration (requires fee payment)
router.post('/:orderId/dispute/request-arbitration', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      $or: [{ orderNumber: orderId }, { _id: orderId }]
    }).populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if dispute exists and is in negotiation phase
    if (!order.disputeId || order.metadata?.disputeStatus !== 'negotiation') {
      return res.status(400).json({ error: 'Dispute must be in negotiation phase to request arbitration' });
    }

    // Check if user is either claimant or respondent
    const claimantId = order.metadata.disputeClaimantId;
    const respondentId = order.metadata.disputeRespondentId;
    const isClaimant = claimantId?.toString() === req.user.id;
    const isRespondent = respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'Only parties involved in the dispute can request arbitration' });
    }

    // Check if arbitration already requested
    if (order.metadata.disputeArbitrationRequested) {
      return res.status(400).json({ error: 'Arbitration has already been requested for this dispute' });
    }

    // Get arbitration fee from settings
    const settings = await PaymentSettings.getSettings();
    const arbitrationFee = settings.arbitrationFee || 50;

    // Get the user requesting arbitration
    const requestingUser = isClaimant 
      ? await User.findById(order.client?._id || order.client)
      : await User.findById(order.professional?._id || order.professional);

    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has sufficient balance
    if ((requestingUser.walletBalance || 0) < arbitrationFee) {
      return res.status(400).json({ 
        error: `Insufficient balance. Arbitration fee is £${arbitrationFee.toFixed(2)}. Please add funds to your wallet.`,
        requiredAmount: arbitrationFee,
        currentBalance: requestingUser.walletBalance || 0,
      });
    }

    // Deduct arbitration fee from user's wallet
    requestingUser.walletBalance = (requestingUser.walletBalance || 0) - arbitrationFee;
    await requestingUser.save();

    // Create fee transaction
    const feeTransaction = new Wallet({
      userId: requestingUser._id,
      type: 'payment',
      amount: arbitrationFee,
      balance: requestingUser.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      orderId: order._id,
      description: `Arbitration Fee - Dispute ${order.disputeId}`,
      metadata: {
        orderNumber: order.orderNumber,
        disputeId: order.disputeId,
        reason: 'Admin arbitration fee payment',
      },
    });
    await feeTransaction.save();

    // Update dispute metadata
    order.metadata.disputeStatus = 'admin_arbitration';
    order.metadata.disputeArbitrationRequested = true;
    order.metadata.disputeArbitrationRequestedBy = req.user.id;
    order.metadata.disputeArbitrationRequestedAt = new Date();
    order.metadata.disputeArbitrationFeePaid = true;
    order.metadata.disputeArbitrationFeeAmount = arbitrationFee;
    order.metadata.disputeArbitrationFeeTransactionId = feeTransaction._id;

    await order.save();

    res.json({ 
      message: 'Arbitration requested successfully. Admin will review the case.',
      dispute: {
        id: order.disputeId,
        status: order.metadata.disputeStatus,
        arbitrationRequestedAt: order.metadata.disputeArbitrationRequestedAt,
        feePaid: arbitrationFee,
      },
      newBalance: requestingUser.walletBalance,
    });
  } catch (error) {
    console.error('Request arbitration error:', error);
    res.status(500).json({ error: error.message || 'Failed to request arbitration' });
  }
});

// Admin: Decide dispute (arbitration)
router.post('/:orderId/dispute/admin-decide', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { winnerId, decisionNotes } = req.body;

    if (!winnerId) {
      return res.status(400).json({ error: 'Winner ID is required' });
    }

    const order = await Order.findOne({ 
      $or: [{ orderNumber: orderId }, { _id: orderId }]
    }).populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if dispute is in admin arbitration
    if (order.metadata?.disputeStatus !== 'admin_arbitration') {
      return res.status(400).json({ error: 'Dispute must be in admin arbitration phase' });
    }

    const claimantId = order.metadata.disputeClaimantId;
    const respondentId = order.metadata.disputeRespondentId;
    const loserId = winnerId === claimantId?.toString() ? respondentId?.toString() : claimantId?.toString();

    if (winnerId !== claimantId?.toString() && winnerId !== respondentId?.toString()) {
      return res.status(400).json({ error: 'Winner must be either the claimant or respondent' });
    }

    const professionalPayoutAmount = order.metadata?.professionalPayoutAmount || order.subtotal;
    const orderTotal = order.total;
    const arbitrationFee = order.metadata.disputeArbitrationFeeAmount || 0;

    // Determine winner and loser
    const isWinnerClient = order.client?._id?.toString() === winnerId || order.client?.toString() === winnerId;
    const isLoserClient = order.client?._id?.toString() === loserId || order.client?.toString() === loserId;

    // Winner gets order amount
    // Loser loses both arbitration fee and order amount
    if (isWinnerClient) {
      // Client wins - refund order amount
      const client = await User.findById(order.client?._id || order.client);
      if (client) {
        client.walletBalance = (client.walletBalance || 0) + orderTotal;
        await client.save();

        const refundTransaction = new Wallet({
          userId: client._id,
          type: 'deposit',
          amount: orderTotal,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          orderId: order._id,
          description: `Dispute Resolution - Order ${order.orderNumber}`,
          metadata: {
            orderNumber: order.orderNumber,
            disputeId: order.disputeId,
            reason: 'Admin arbitration decision - client won',
          },
        });
        await refundTransaction.save();
      }

      // Professional (loser) loses arbitration fee (already deducted when paid, but we record it)
      // Professional doesn't receive payout
    } else {
      // Professional wins - gets payout
      const professional = await User.findById(order.professional?._id || order.professional);
      if (professional) {
        // Check if funds were already released
        const fundsReleased = order.status === 'Completed';
        
        if (!fundsReleased) {
          professional.walletBalance = (professional.walletBalance || 0) + professionalPayoutAmount;
          await professional.save();

          const payoutTransaction = new Wallet({
            userId: professional._id,
            type: 'deposit',
            amount: professionalPayoutAmount,
            balance: professional.walletBalance,
            status: 'completed',
            paymentMethod: 'wallet',
            orderId: order._id,
            description: `Dispute Resolution - Order ${order.orderNumber}`,
            metadata: {
              orderNumber: order.orderNumber,
              disputeId: order.disputeId,
              reason: 'Admin arbitration decision - professional won',
            },
          });
          await payoutTransaction.save();
        }
      }

      // Client (loser) loses arbitration fee (already deducted from their wallet, but we record it)
      // Client doesn't get refund
    }

    // Update order metadata
    order.metadata.disputeStatus = 'closed';
    order.metadata.disputeClosedAt = new Date();
    order.metadata.disputeWinnerId = winnerId;
    order.metadata.disputeLoserId = loserId;
    order.metadata.disputeAdminDecision = true;
    order.metadata.disputeDecisionNotes = decisionNotes || '';
    order.metadata.disputeDecidedBy = req.user.id;
    order.metadata.disputeDecidedAt = new Date();
    order.status = 'Cancelled';
    order.deliveryStatus = 'cancelled';

    await order.save();

    res.json({ 
      message: 'Dispute decided successfully',
      dispute: {
        id: order.disputeId,
        status: order.metadata.disputeStatus,
        winnerId: winnerId,
        loserId: loserId,
        decidedAt: order.metadata.disputeDecidedAt,
      }
    });
  } catch (error) {
    console.error('Admin decide dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to decide dispute' });
  }
});

// Cancel/Withdraw dispute
router.delete('/:orderId/dispute', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if dispute exists
    if (!order.disputeId || !order.metadata?.disputeStatus) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is in a cancellable state (open, negotiation, or admin_arbitration)
    const cancellableStatuses = ['open', 'negotiation', 'admin_arbitration'];
    if (!cancellableStatuses.includes(order.metadata.disputeStatus)) {
      return res.status(400).json({ error: 'Dispute cannot be cancelled in its current state' });
    }

    // Check if user is either claimant or respondent
    const claimantId = order.metadata.disputeClaimantId;
    const respondentId = order.metadata.disputeRespondentId;
    const isClaimant = claimantId?.toString() === req.user.id;
    const isRespondent = respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'Only parties involved in the dispute can cancel it' });
    }

    // If arbitration was requested and fee was paid, we might want to refund it
    // For now, we'll just clear the dispute and restore the order to delivered status
    const arbitrationFeePaid = order.metadata.disputeArbitrationFeePaid;
    const arbitrationFeeAmount = order.metadata.disputeArbitrationFeeAmount;

    // Refund arbitration fee if it was paid (to the person who requested it)
    if (arbitrationFeePaid && arbitrationFeeAmount) {
      const arbitrationRequesterId = order.metadata.disputeArbitrationRequestedBy;
      const requester = await User.findById(arbitrationRequesterId);
      
      if (requester) {
        requester.walletBalance = (requester.walletBalance || 0) + arbitrationFeeAmount;
        await requester.save();

        // Create refund transaction
        const refundTransaction = new Wallet({
          userId: requester._id,
          type: 'deposit',
          amount: arbitrationFeeAmount,
          balance: requester.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          orderId: order._id,
          description: `Dispute Cancellation - Arbitration Fee Refund - Order ${order.orderNumber}`,
          metadata: {
            orderNumber: order.orderNumber,
            disputeId: order.disputeId,
            reason: 'Dispute cancelled - arbitration fee refunded',
          },
        });
        await refundTransaction.save();
      }
    }

    // Clear dispute information and restore order to delivered status
    const previousDisputeId = order.disputeId;
    order.disputeId = null;
    order.status = 'In Progress'; // Restore to In Progress (which allows delivery)
    order.deliveryStatus = 'delivered'; // Restore to delivered status
    
    // Clear dispute metadata
    if (order.metadata) {
      delete order.metadata.disputeReason;
      delete order.metadata.disputeEvidence;
      delete order.metadata.disputeCreatedBy;
      delete order.metadata.disputeCreatedAt;
      delete order.metadata.disputeClaimantId;
      delete order.metadata.disputeRespondentId;
      delete order.metadata.disputeResponseDeadline;
      delete order.metadata.disputeRespondedAt;
      delete order.metadata.disputeResponseMessage;
      delete order.metadata.disputeNegotiationDeadline;
      delete order.metadata.disputeArbitrationRequested;
      delete order.metadata.disputeArbitrationRequestedBy;
      delete order.metadata.disputeArbitrationRequestedAt;
      delete order.metadata.disputeArbitrationFeePaid;
      delete order.metadata.disputeArbitrationFeeAmount;
      delete order.metadata.disputeArbitrationFeeTransactionId;
      delete order.metadata.disputeStatus;
      delete order.metadata.disputeClosedAt;
      delete order.metadata.disputeWinnerId;
      delete order.metadata.disputeLoserId;
      delete order.metadata.disputeAdminDecision;
      delete order.metadata.disputeDecisionNotes;
      delete order.metadata.disputeDecidedBy;
      delete order.metadata.disputeDecidedAt;
      delete order.metadata.disputeAutoClosed;
    }

    await order.save();

    res.json({ 
      message: 'Dispute cancelled successfully. Order restored to delivered status.',
      order: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        disputeId: null,
      }
    });
  } catch (error) {
    console.error('Cancel dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel dispute' });
  }
});

// Configure multer for additional info file uploads
const additionalInfoDir = path.join(__dirname, '..', 'uploads', 'attachments');
// Create attachments directory if it doesn't exist
fs.mkdir(additionalInfoDir, { recursive: true }).catch(() => {});

const additionalInfoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, additionalInfoDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const additionalInfoUpload = multer({
  storage: additionalInfoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Serve additional info attachment files
router.get('/attachments/:filename', (req, res) => {
  const filePath = path.join(additionalInfoDir, req.params.filename);
  if (existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Client: Submit additional information for order
router.post('/:orderId/additional-info', authenticateToken, requireRole(['client']), additionalInfoUpload.array('files', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }));

    if (!order) {
      // Clean up uploaded files if order not found
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if additional info already submitted
    if (order.additionalInformation && order.additionalInformation.submittedAt) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (file.path) {
            fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
          }
        });
      }
      return res.status(400).json({ error: 'Additional information has already been submitted for this order' });
    }

    const additionalFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }
        additionalFiles.push({
          url: `/api/orders/attachments/${file.filename}`,
          fileName: file.originalname,
          fileType: fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Update order with additional information
    order.additionalInformation = {
      message: message || '',
      files: additionalFiles,
      submittedAt: new Date(),
    };

    await order.save();

    res.json({
      message: 'Additional information submitted successfully',
      additionalInformation: order.additionalInformation
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          try {
            unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      });
    }
    console.error('Additional info submission error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit additional information' });
  }
});

export default router;

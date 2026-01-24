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
import Dispute from '../models/Dispute.js';
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

// Configure multer for revision request attachments
const revisionDir = path.join(__dirname, '..', 'uploads', 'revisions');
fs.mkdir(revisionDir, { recursive: true }).catch(() => {});

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

const revisionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, revisionDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const revisionUpload = multer({
  storage: revisionStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, or documents are allowed.'));
    }
  }
});

// Configure multer for dispute evidence files
const disputeDir = path.join(__dirname, '..', 'uploads', 'disputes');
fs.mkdir(disputeDir, { recursive: true }).catch(() => {});

const disputeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, disputeDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: disputeStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, or documents are allowed.'));
    }
  }
});

// Configure multer for cancellation request attachments
const cancellationDir = path.join(__dirname, '..', 'uploads', 'cancellations');
fs.mkdir(cancellationDir, { recursive: true }).catch(() => {});

const cancellationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cancellationDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const cancellationUpload = multer({
  storage: cancellationStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Images, videos, or documents only.'));
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
    
    const { items, address, skipAddress, paymentMethod, paymentMethodId, total, subtotal, discount = 0, serviceFee = 0, promoCode, walletAmount = 0, remainderAmount = 0 } = req.body;

    if (!items || items.length === 0) {
      console.error('[Server] No items provided');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!paymentMethod || !['card', 'paypal', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only card and paypal are allowed.' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    // Get user first (needed for wallet balance validation)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate wallet and remainder amounts
    const calculatedWalletAmount = Math.min(user.walletBalance || 0, total);
    const calculatedRemainderAmount = Math.max(0, total - (user.walletBalance || 0));
    
    // Validate amounts match
    if (Math.abs(walletAmount - calculatedWalletAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Wallet amount mismatch',
        expected: calculatedWalletAmount,
        received: walletAmount 
      });
    }
    
    if (Math.abs(remainderAmount - calculatedRemainderAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Remainder amount mismatch',
        expected: calculatedRemainderAmount,
        received: remainderAmount 
      });
    }
    
    // Validate wallet balance is sufficient
    if (walletAmount > (user.walletBalance || 0)) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        required: walletAmount,
        current: user.walletBalance || 0 
      });
    }
    
    // If remainder > 0, payment method must be provided
    if (remainderAmount > 0 && !paymentMethodId && paymentMethod === 'card') {
      return res.status(400).json({ error: 'Payment method ID is required for card payments when remainder > 0' });
    }
    
    // If remainder is 0, payment method should be wallet
    if (remainderAmount === 0 && paymentMethod !== 'wallet') {
      return res.status(400).json({ error: 'Payment method must be wallet when remainder is 0' });
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
    const serviceFeeThreshold = settings.serviceFeeThreshold || 0;
    
    // Calculate actual service fee based on threshold
    // If subtotal is equal to or above threshold, service fee is 0
    const actualServiceFee = (serviceFeeThreshold > 0 && subtotal >= serviceFeeThreshold) ? 0 : serviceFeeAmount;

    // Validate service fee if provided
    if (serviceFee !== undefined && serviceFee !== actualServiceFee) {
      return res.status(400).json({ 
        error: 'Service fee mismatch', 
        expected: actualServiceFee,
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
    const calculatedTotal = subtotal - discount + actualServiceFee;

    // Validate total matches calculated total
    if (Math.abs(total - calculatedTotal) > 0.01) {
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        expected: calculatedTotal,
        received: total,
        breakdown: {
          subtotal,
          discount,
          serviceFee: actualServiceFee,
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

    // Handle split payment: wallet first, then payment method
    let walletTransactionId = null;
    let paymentTransactionId = null;
    let newBalance = user.walletBalance || 0;
    const Wallet = (await import('../models/WalletTransaction.js')).default;

    // Step 1: Deduct from wallet if walletAmount > 0
    if (walletAmount > 0) {
      newBalance = (user.walletBalance || 0) - walletAmount;
      user.walletBalance = newBalance;
      await user.save();
      
      // Create wallet transaction record
      const walletTransaction = new Wallet({
        user: user._id,
        type: 'debit',
        amount: walletAmount,
        description: `Order payment - ${orderNumber}`,
        status: 'completed',
        orderId: null, // Will be updated after order creation
      });
      await walletTransaction.save();
      walletTransactionId = walletTransaction._id;
    }

    // Step 2: Process remainder payment if remainderAmount > 0
    if (remainderAmount > 0) {
      if (paymentMethod === 'card') {
        if (!paymentMethodId) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(400).json({ error: 'Payment method ID is required for card payments' });
        }

        try {
          const settings = await PaymentSettings.getSettings();
          const stripe = getStripeInstance(settings);

          // Calculate Stripe fees on remainder amount only
          const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
          const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
          const stripeCommission = (remainderAmount * stripeCommissionPercentage / 100) + stripeCommissionFixed;
          const totalChargeAmount = remainderAmount + stripeCommission;

          // Create payment intent for remainder amount
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalChargeAmount * 100),
            currency: 'gbp',
            payment_method: paymentMethodId,
            customer: user.stripeCustomerId,
            confirm: true,
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            metadata: {
              userId: user._id.toString(),
              type: 'order_payment',
              orderNumber,
              walletAmount: walletAmount.toString(),
              remainderAmount: remainderAmount.toString(),
            },
          });

          if (paymentIntent.status !== 'succeeded') {
            // Rollback wallet deduction if card payment fails
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ 
              error: 'Payment failed',
              status: paymentIntent.status,
              requiresAction: paymentIntent.status === 'requires_action',
            });
          }

          paymentTransactionId = paymentIntent.id;
        } catch (error) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(500).json({ error: error.message || 'Failed to process card payment' });
        }
      } else if (paymentMethod === 'paypal') {
        // PayPal payment: return approval URL for remainder amount
        try {
          const settings = await PaymentSettings.getSettings();
          const environment = getPayPalClient(settings);
          const client = new paypal.core.PayPalHttpClient(environment);

          // Calculate PayPal fees on remainder amount only
          const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
          const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
          const paypalCommission = (remainderAmount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
          const totalChargeAmount = remainderAmount + paypalCommission;

          // Create PayPal order for remainder amount
          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
              amount: {
                currency_code: "GBP",
                value: totalChargeAmount.toFixed(2),
              },
              description: `Order Payment - ${orderNumber} - Remainder: £${remainderAmount.toFixed(2)}${walletAmount > 0 ? `, Wallet: £${walletAmount.toFixed(2)}` : ''}`,
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
            // Rollback wallet deduction if PayPal order creation fails
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await Wallet.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ error: 'Failed to create PayPal order' });
          }

          // Return PayPal approval URL for client to redirect
          const approveUrl = order.result.links.find(link => link.rel === 'approve')?.href;

          return res.json({
            orderId: orderNumber,
            paypalOrderId: order.result.id,
            approveUrl,
            requiresApproval: true,
            walletAmount,
            remainderAmount,
            walletTransactionId: walletTransactionId?.toString(),
            message: 'Please approve PayPal payment to complete order',
          });
        } catch (error) {
          // Rollback wallet deduction if PayPal order creation fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await Wallet.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
        }
      }
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
          endTime: item.booking.endTime || '',
          timeSlot: item.booking.timeSlot || undefined,
        };
      } else {
        console.log(`[Server] Item ${index + 1} has NO booking info`);
      }
      
      return orderItem;
    });
    

    const isPaidOrder = true; // All orders are paid (wallet + card/paypal)
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
      paymentMethod: walletAmount > 0 && remainderAmount > 0 ? 'split' : (walletAmount > 0 ? 'wallet' : paymentMethod),
      paymentMethodId: remainderAmount > 0 && paymentMethod === 'card' ? paymentMethodId : undefined,
      total,
      subtotal,
      discount,
      promoCode: promoCodeData,
      serviceFee: serviceFeeAmount,
      status: 'In Progress',
      deliveryStatus: isPaidOrder ? 'active' : 'pending',
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
      walletAmount,
      remainderAmount,
      walletTransactionId: walletTransactionId?.toString(),
      paymentTransactionId: paymentTransactionId?.toString(),
      message: 'Order created successfully',
    };
    
    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Create multiple orders at once (one order per item)
router.post('/bulk', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orders: orderRequests, paymentMethod, paymentMethodId, totalAmount, walletAmount = 0, remainderAmount = 0, address, skipAddress, additionalInformation } = req.body;


    if (!orderRequests || orderRequests.length === 0) {
      return res.status(400).json({ error: 'At least one order is required' });
    }

    if (!paymentMethod || !['card', 'paypal', 'wallet'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Only card and paypal are allowed.' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate wallet and remainder amounts
    const calculatedWalletAmount = Math.min(user.walletBalance || 0, totalAmount);
    const calculatedRemainderAmount = Math.max(0, totalAmount - (user.walletBalance || 0));
    
    // Validate amounts match
    if (Math.abs(walletAmount - calculatedWalletAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Wallet amount mismatch',
        expected: calculatedWalletAmount,
        received: walletAmount 
      });
    }
    
    if (Math.abs(remainderAmount - calculatedRemainderAmount) > 0.01) {
      return res.status(400).json({ 
        error: 'Remainder amount mismatch',
        expected: calculatedRemainderAmount,
        received: remainderAmount 
      });
    }
    
    // Validate wallet balance is sufficient
    if (walletAmount > (user.walletBalance || 0)) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        required: walletAmount,
        current: user.walletBalance || 0 
      });
    }
    
    // If remainder > 0, payment method must be provided
    if (remainderAmount > 0 && !paymentMethodId && paymentMethod === 'card') {
      return res.status(400).json({ error: 'Payment method ID is required for card payments when remainder > 0' });
    }
    
    // If remainder is 0, payment method should be wallet
    if (remainderAmount === 0 && paymentMethod !== 'wallet') {
      return res.status(400).json({ error: 'Payment method must be wallet when remainder is 0' });
    }

    // Get payment settings
    const settings = await PaymentSettings.getSettings();
    const serviceFeeAmount = settings.serviceFees || 0;
    const serviceFeeThreshold = settings.serviceFeeThreshold || 0;

    // Calculate total from all orders
    let calculatedSubtotal = 0;
    let totalDiscount = 0;
    for (const orderReq of orderRequests) {
      calculatedSubtotal += orderReq.subtotal;
      totalDiscount += (orderReq.discount || 0);
    }
    
    // Calculate actual service fee based on threshold
    // If subtotal is equal to or above threshold, service fee is 0
    const actualServiceFee = (serviceFeeThreshold > 0 && calculatedSubtotal >= serviceFeeThreshold) ? 0 : serviceFeeAmount;
    
    const calculatedTotal = calculatedSubtotal - totalDiscount + actualServiceFee;

    // Validate total (allow small floating point differences)
    if (Math.abs(totalAmount - calculatedTotal) > 0.01) {
      console.error('[Server] Total amount mismatch:', {
        received: totalAmount,
        expected: calculatedTotal,
        subtotal: calculatedSubtotal,
        discount: totalDiscount,
        serviceFee: actualServiceFee,
      });
      return res.status(400).json({ 
        error: 'Total amount mismatch',
        expected: calculatedTotal,
        received: totalAmount,
        breakdown: {
          subtotal: calculatedSubtotal,
          discount: totalDiscount,
          serviceFee: actualServiceFee,
        }
      });
    }

    // Handle split payment: wallet first, then payment method
    let newBalance = user.walletBalance || 0;
    let walletTransactionId = null;
    let paymentTransactionId = null;

    // Step 1: Deduct from wallet if walletAmount > 0
    if (walletAmount > 0) {
      newBalance = (user.walletBalance || 0) - walletAmount;
      user.walletBalance = newBalance;
      await user.save();
      
      // Create wallet transaction record
      const WalletTransaction = (await import('../models/WalletTransaction.js')).default;
      walletTransactionId = (await WalletTransaction.create({
        user: user._id,
        type: 'debit',
        amount: walletAmount,
        description: `Order payment (${orderRequests.length} order${orderRequests.length > 1 ? 's' : ''})`,
        status: 'completed',
        orderId: null, // Will be updated after orders are created
      }))._id;
    }

    // Step 2: Process remainder payment if remainderAmount > 0
    if (remainderAmount > 0) {
      if (paymentMethod === 'card') {
        if (!paymentMethodId) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await WalletTransaction.findByIdAndDelete(walletTransactionId);
            }
          }
          return res.status(400).json({ error: 'Payment method ID is required for card payments' });
        }

        try {
          const stripe = getStripeInstance(settings);
          const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
          const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
          const stripeCommission = (remainderAmount * stripeCommissionPercentage / 100) + stripeCommissionFixed;
          const totalChargeAmount = remainderAmount + stripeCommission;

          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalChargeAmount * 100),
            currency: 'gbp',
            payment_method: paymentMethodId,
            customer: user.stripeCustomerId,
            confirm: true,
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            metadata: {
              userId: user._id.toString(),
              type: 'bulk_order_payment',
              orderCount: orderRequests.length.toString(),
              walletAmount: walletAmount.toString(),
              remainderAmount: remainderAmount.toString(),
            },
          });

          if (paymentIntent.status !== 'succeeded') {
            // Rollback wallet deduction if card payment fails
            if (walletAmount > 0) {
              user.walletBalance = (user.walletBalance || 0) + walletAmount;
              await user.save();
              if (walletTransactionId) {
                await WalletTransaction.findByIdAndDelete(walletTransactionId);
              }
            }
            return res.status(400).json({ 
              error: 'Payment failed',
              status: paymentIntent.status,
            });
          }

          paymentTransactionId = paymentIntent.id;
        } catch (error) {
          // Rollback wallet deduction if card payment fails
          if (walletAmount > 0) {
            user.walletBalance = (user.walletBalance || 0) + walletAmount;
            await user.save();
            if (walletTransactionId) {
              await WalletTransaction.findByIdAndDelete(walletTransactionId);
            }
          }
          console.error('[Server] Card payment error:', error);
          return res.status(500).json({ error: error.message || 'Failed to process card payment' });
        }
      } else if (paymentMethod === 'paypal') {
        // For PayPal, return approval URL (similar to single order)
        const environment = getPayPalClient(settings);
        const client = new paypal.core.PayPalHttpClient(environment);

        const paypalCommissionPercentage = settings.paypalCommissionPercentage || 2.9;
        const paypalCommissionFixed = settings.paypalCommissionFixed || 0.30;
        const paypalCommission = (remainderAmount * paypalCommissionPercentage / 100) + paypalCommissionFixed;
        const totalChargeAmount = remainderAmount + paypalCommission;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "GBP",
              value: totalChargeAmount.toFixed(2),
            },
            description: `Bulk Order Payment (${orderRequests.length} orders) - Remainder: £${remainderAmount.toFixed(2)}${walletAmount > 0 ? `, Wallet: £${walletAmount.toFixed(2)}` : ''}`,
          }],
          application_context: {
            return_url: `${req.headers.origin || 'http://localhost:5000'}/thank-you`,
            cancel_url: `${req.headers.origin || 'http://localhost:5000'}/cart`,
            brand_name: "Sortars UK",
            locale: "en-GB",
          },
        });

        const order = await client.execute(request);
        const approveUrl = order.result.links.find(link => link.rel === 'approve')?.href;

        return res.json({
          paypalOrderId: order.result.id,
          approveUrl,
          requiresApproval: true,
          orderRequests, // Return order requests for later processing
          walletAmount,
          remainderAmount,
          walletTransactionId: walletTransactionId?.toString(),
          message: 'Please approve PayPal payment to complete orders',
        });
      }
    }

    // Create orders
    const Service = (await import('../models/Service.js')).default;
    const createdOrders = [];

    for (const orderReq of orderRequests) {
      const { item, booking, subtotal, discount = 0, additionalInformation: orderAdditionalInfo } = orderReq;

      // Find service and professional
      const serviceId = item.serviceId || item.id;
      let service = null;
      let professionalId = null;

      if (serviceId.match(/^[0-9a-fA-F]{24}$/)) {
        service = await Service.findById(serviceId);
      } else {
        service = await Service.findOne({ slug: serviceId });
      }

      if (service) {
        professionalId = service.professional;
      } else if (item.seller) {
        const professional = await User.findOne({ 
          tradingName: item.seller,
          role: 'professional'
        });
        if (professional) {
          professionalId = professional._id;
        }
      }

      if (!professionalId) {
        console.error(`[Server] Could not find professional for service: ${serviceId}`);
        continue; // Skip this order
      }

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Create order item with booking
      const processedItem = {
        serviceId: serviceId,
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons || [],
        packageType: item.packageType,
      };

      if (booking && booking.date) {
        processedItem.booking = {
          date: booking.date,
          time: booking.time || '',
          endTime: booking.endTime || '',
          timeSlot: booking.timeSlot || '',
        };
      }

      // Calculate order total (item subtotal - discount, no service fee per order)
      const orderTotal = subtotal - discount;

      const isPaidOrder = true; // All orders are paid (wallet + card/paypal)
      
      // Prepare additional information - use per-order info if available, otherwise fall back to global
      const infoToUse = orderAdditionalInfo || additionalInformation;
      let additionalInfo = undefined;
      if (infoToUse && (infoToUse.message?.trim() || (infoToUse.files && infoToUse.files.length > 0))) {
        const additionalFiles = [];
        if (infoToUse.files && Array.isArray(infoToUse.files)) {
          for (const file of infoToUse.files) {
            // Ensure fileType is one of the allowed values
            let fileType = file.fileType;
            if (!fileType || !['image', 'video', 'document'].includes(fileType)) {
              // Try to determine from URL or default to document
              if (file.url && (file.url.includes('.jpg') || file.url.includes('.jpeg') || file.url.includes('.png') || file.url.includes('.gif') || file.url.includes('.webp'))) {
                fileType = 'image';
              } else if (file.url && (file.url.includes('.mp4') || file.url.includes('.webm') || file.url.includes('.mov') || file.url.includes('.avi'))) {
                fileType = 'video';
              } else {
                fileType = 'document';
              }
            }
            
            additionalFiles.push({
              url: file.url,
              fileName: file.fileName,
              fileType: fileType,
              uploadedAt: new Date(),
            });
          }
        }
        
        additionalInfo = {
          message: infoToUse.message?.trim() || '',
          files: additionalFiles,
          submittedAt: new Date(),
        };
      }
      
      const order = new Order({
        orderNumber,
        client: user._id,
        professional: professionalId,
        items: [processedItem],
        address: address ? {
          postcode: address.postcode,
          address: address.address,
          city: address.city,
          county: address.county,
          phone: address.phone,
        } : undefined,
        skipAddress: skipAddress || false,
        paymentMethod: walletAmount > 0 && remainderAmount > 0 ? 'split' : (walletAmount > 0 ? 'wallet' : paymentMethod),
        total: orderTotal,
        subtotal,
        discount,
        serviceFee: 0, // Service fee is applied once to the total, not per order
        status: 'In Progress',
        deliveryStatus: 'active', // All orders are paid (wallet + card/paypal)
        additionalInformation: additionalInfo,
        metadata: {
          createdAt: new Date(),
          bulkOrderId: `BULK-${Date.now()}`,
          professionalPayoutAmount: subtotal - discount,
        },
      });

      await order.save();

      // Populate for response
      await order.populate([
        { path: 'client', select: 'firstName lastName email phone' },
        { path: 'professional', select: 'firstName lastName tradingName email phone' },
      ]);

      createdOrders.push(order.toObject());
    }

    return res.json({
      orders: createdOrders,
      orderIds: createdOrders.map(o => o.orderNumber),
      newBalance,
      walletAmount,
      remainderAmount,
      walletTransactionId: walletTransactionId?.toString(),
      paymentTransactionId: paymentTransactionId?.toString(),
      newBalance,
      message: `Successfully created ${createdOrders.length} order(s)`,
    });
  } catch (error) {
    console.error('[Server] Bulk order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create orders' });
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

    // Fetch disputes for all orders
    const disputes = await Dispute.find({ order: { $in: orderIds } })
      .populate('claimantId', 'firstName lastName tradingName avatar')
      .populate('respondentId', 'firstName lastName tradingName avatar')
      .lean();
    
    // Create a map of orderId to dispute
    const disputeMap = {};
    disputes.forEach(dispute => {
      disputeMap[dispute.order.toString()] = dispute;
    });

    // Transform orders to match frontend format
    const transformedOrders = orders.map(order => {
      const review = reviewMap[order._id.toString()];
      const dispute = disputeMap[order._id.toString()];
      const client = order.client;
      const professional = order.professional;
      
      // Determine service name from first item
      const serviceName = order.items?.[0]?.title || 'Service Order';
      
      // Format amount
      const amount = `£${order.total.toFixed(2)}`;
      
      // Map status
      let status = order.status || 'In Progress';
      if (status === 'pending') status = 'In Progress';
      if (status === 'in_progress' || status === 'In Progress') status = 'In Progress';
      if (status === 'completed' || status === 'Completed') status = 'Completed';
      if (status === 'cancelled' || status === 'Cancelled') status = 'Cancelled';
      if (status === 'Cancellation Pending' || status === 'cancellation_pending') status = 'Cancellation Pending';
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
      const completedDate = order.completedDate ? new Date(order.completedDate).toISOString() : undefined;
      const deliveredDate = order.deliveredDate ? new Date(order.deliveredDate).toISOString() : undefined;
      
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
        clientId: client?._id ? client._id.toString() : undefined,
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
        disputeId: order.disputeId || dispute?.disputeId || undefined,
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
          files: order.cancellationRequest.files ? order.cancellationRequest.files.map(f => ({
            url: f.url,
            fileName: f.fileName,
            fileType: f.fileType,
            uploadedAt: f.uploadedAt ? new Date(f.uploadedAt).toISOString() : undefined,
          })) : [],
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
          clientMessage: order.revisionRequest.clientMessage || undefined,
          clientFiles: order.revisionRequest.clientFiles ? order.revisionRequest.clientFiles.map(file => ({
            url: file.url,
            fileName: file.fileName,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt ? new Date(file.uploadedAt).toISOString() : undefined,
          })) : [],
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
        disputeInfo: dispute ? {
          id: dispute.disputeId || undefined,
          status: dispute.status,
          requirements: dispute.requirements || undefined,
          unmetRequirements: dispute.unmetRequirements || undefined,
          evidenceFiles: dispute.evidenceFiles || [],
          claimantId: dispute.claimantId ? dispute.claimantId.toString() : undefined,
          respondentId: dispute.respondentId ? dispute.respondentId.toString() : undefined,
          claimantName: dispute.claimantId ? (
            dispute.claimantId._id ? (
              dispute.claimantId._id.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                dispute.claimantId.tradingName || `${dispute.claimantId.firstName || ''} ${dispute.claimantId.lastName || ''}`.trim() || 'Professional'
            ) : (
              dispute.claimantId.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                professional?.tradingName || `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim() || 'Professional'
            )
          ) : undefined,
          respondentName: dispute.respondentId ? (
            dispute.respondentId._id ? (
              dispute.respondentId._id.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                dispute.respondentId.tradingName || `${dispute.respondentId.firstName || ''} ${dispute.respondentId.lastName || ''}`.trim() || 'Professional'
            ) : (
              dispute.respondentId.toString() === client?._id?.toString() ? 
                `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client' :
                professional?.tradingName || `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim() || 'Professional'
            )
          ) : undefined,
          claimantAvatar: dispute.claimantId ? (
            dispute.claimantId._id ? dispute.claimantId.avatar || '' : 
            (dispute.claimantId.toString() === client?._id?.toString() ? client.avatar || '' : professional?.avatar || '')
          ) : undefined,
          respondentAvatar: dispute.respondentId ? (
            dispute.respondentId._id ? dispute.respondentId.avatar || '' : 
            (dispute.respondentId.toString() === client?._id?.toString() ? client.avatar || '' : professional?.avatar || '')
          ) : undefined,
          messages: dispute.messages ? dispute.messages.map(msg => ({
            id: msg.id,
            userId: msg.userId.toString(),
            userName: msg.userName,
            userAvatar: msg.userAvatar,
            message: msg.message,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined,
            isTeamResponse: msg.isTeamResponse || false,
            attachments: msg.attachments ? msg.attachments.map((att) => ({
              url: att.url,
              fileName: att.fileName,
              fileType: att.fileType,
            })) : [],
          })) : [],
          clientOffer: dispute.offers?.clientOffer !== null && dispute.offers?.clientOffer !== undefined ? dispute.offers.clientOffer : undefined,
          professionalOffer: dispute.offers?.professionalOffer !== null && dispute.offers?.professionalOffer !== undefined ? dispute.offers.professionalOffer : undefined,
          responseDeadline: dispute.responseDeadline ? new Date(dispute.responseDeadline).toISOString() : undefined,
          respondedAt: dispute.respondedAt ? new Date(dispute.respondedAt).toISOString() : undefined,
          negotiationDeadline: dispute.negotiationDeadline ? new Date(dispute.negotiationDeadline).toISOString() : undefined,
          arbitrationRequested: dispute.arbitrationRequested || false,
          arbitrationRequestedBy: dispute.arbitrationRequestedBy ? dispute.arbitrationRequestedBy.toString() : undefined,
          arbitrationRequestedAt: dispute.arbitrationRequestedAt ? new Date(dispute.arbitrationRequestedAt).toISOString() : undefined,
          arbitrationFeeAmount: dispute.arbitrationFeeAmount || undefined,
          createdAt: dispute.createdAt ? new Date(dispute.createdAt).toISOString() : undefined,
          closedAt: dispute.closedAt ? new Date(dispute.closedAt).toISOString() : undefined,
          winnerId: dispute.winnerId ? dispute.winnerId.toString() : undefined,
          loserId: dispute.loserId ? dispute.loserId.toString() : undefined,
          adminDecision: dispute.adminDecision || false,
          decisionNotes: dispute.decisionNotes || undefined,
          autoClosed: dispute.autoClosed || false,
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

// Optional multipart middleware: use multer only for multipart/form-data
function optionalCancellationUpload(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return cancellationUpload.array('files', 10)(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'File upload failed' });
      next();
    });
  }
  next();
}

// Request cancellation (both client and professional can request); optional files via multipart
router.post('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), optionalCancellationUpload, async (req, res) => {
  try {
    const { orderId } = req.params;
    const reason = (req.body?.reason != null ? String(req.body.reason) : '') || '';

    const order = await Order.findOne(await buildOrderQuery(orderId)).populate('client professional');

    if (!order) {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(404).json({ error: 'Order not found' });
    }

    const isClient = order.client._id.toString() === req.user.id.toString();
    const isProfessional = order.professional._id.toString() === req.user.id.toString();

    if (!isClient && !isProfessional) {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(403).json({ error: 'Not authorized to request cancellation for this order' });
    }

    if (order.status === 'Completed' || order.deliveryStatus === 'delivered' || order.deliveryStatus === 'completed') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Cannot cancel order that has been delivered. Please initiate a dispute instead.' });
    }

    if (order.status === 'Cancelled') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Order is already cancelled.' });
    }

    if (order.cancellationRequest && order.cancellationRequest.status === 'pending') {
      if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
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

    const cancellationFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';
        cancellationFiles.push({
          url: `/api/orders/cancellations/${file.filename}`,
          fileName: file.originalname,
          fileType,
          uploadedAt: new Date(),
        });
      }
    }

    order.cancellationRequest = {
      status: 'pending',
      requestedBy: req.user.id,
      reason: reason || '',
      files: cancellationFiles,
      requestedAt: new Date(),
      responseDeadline: responseDeadline,
      respondedAt: null,
      respondedBy: null,
    };

    order.status = 'Cancellation Pending';

    await order.save();

    const cr = order.cancellationRequest.toObject ? order.cancellationRequest.toObject() : order.cancellationRequest;
    res.json({ 
      message: 'Cancellation request submitted successfully',
      cancellationRequest: { ...cr, files: cr.files || cancellationFiles },
      responseDeadline: responseDeadline,
      orderStatus: order.status
    });
  } catch (error) {
    if (req.files?.length) req.files.forEach(f => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
    console.error('Cancellation request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request cancellation' });
  }
});

// Respond to cancellation request (approve or reject)
router.put('/:orderId/cancellation-request', authenticateToken, requireRole(['client', 'professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, reason } = req.body; // 'approve' or 'reject', reason is optional

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
      // Cancel the order – professional accepted; status becomes Cancelled immediately
      order.status = 'Cancelled';
      order.deliveryStatus = 'cancelled';
      order.cancellationRequest.status = 'approved';
      
      // Handle refund if payment was made
      // TODO: Implement refund logic here based on payment method
      
    } else {
      // Reject cancellation – restore order status and continue
      order.cancellationRequest.status = 'rejected';
      order.status = order.metadata?.statusBeforeCancellationRequest || 'In Progress';
      if (reason && reason.trim()) {
        order.cancellationRequest.rejectionReason = reason.trim();
      }
    }

    order.cancellationRequest.respondedAt = new Date();
    order.cancellationRequest.respondedBy = req.user.id;

    await order.save();

    res.json({ 
      message: `Cancellation request ${action}d successfully`,
      cancellationRequest: {
        ...order.cancellationRequest.toObject(),
        rejectionReason: order.cancellationRequest.rejectionReason || undefined,
      },
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
    const previousStatus = order.metadata?.statusBeforeCancellationRequest || 'In Progress';
    
    // Withdraw cancellation request – order returns to processing
    order.cancellationRequest.status = 'withdrawn';
    order.status = previousStatus;

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

    // Check if order is in progress
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order can only be accepted when it is in progress' });
    }

    // Check if already accepted
    if (order.acceptedByProfessional) {
      return res.status(400).json({ error: 'Order has already been accepted' });
    }

    // Accept order - status remains in progress
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

    // Check if order is in progress
    if (order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order can only be rejected when it is in progress' });
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

    // Check if order is in progress (status 'In Progress' or deliveryStatus 'active')
    const isInProgress = order.status === 'In Progress' || 
                         order.status === 'in_progress' || 
                         order.deliveryStatus === 'active' ||
                         (order.acceptedByProfessional && order.status !== 'Completed' && order.status !== 'Cancelled');
    
    if (!isInProgress) {
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

// Serve cancellation request attachment files
router.get('/cancellations/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(cancellationDir, filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve cancellation file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Serve revision request files
router.get('/revisions/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(revisionDir, filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve revision file error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Client: Request revision (modification) for delivered order
const maybeRevisionUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return revisionUpload.array('files', 10)(req, res, next);
  }
  return next();
};

router.post('/:orderId/revision-request', authenticateToken, requireRole(['client']), maybeRevisionUpload, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, message } = req.body;

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

    // Process uploaded files
    const revisionFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) fileType = 'image';
        else if (file.mimetype.startsWith('video/')) fileType = 'video';
        revisionFiles.push({
          url: `/api/orders/revisions/${file.filename}`,
          fileName: file.originalname,
          fileType,
          uploadedAt: new Date(),
        });
      }
    }

    // Create revision request
    order.revisionRequest = {
      status: 'pending',
      reason: reason.trim(),
      clientMessage: message && message.trim() ? message.trim() : null,
      clientFiles: revisionFiles.length > 0 ? revisionFiles : [],
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

      // Resume work: move order back to in-progress state
      order.status = 'In Progress';
      order.deliveryStatus = 'active';
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

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id })).populate('professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is in delivered status or has delivery files/message
    const isDelivered = order.deliveryStatus === 'delivered' || 
                        (order.deliveryFiles && order.deliveryFiles.length > 0) ||
                        order.deliveryMessage ||
                        order.metadata?.professionalCompleteRequest;
    
    if (!isDelivered && order.status !== 'In Progress') {
      return res.status(400).json({ error: 'Order must be delivered before completing' });
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

// Client: Submit review for a completed order
router.post('/:orderId/review', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment, communicationRating, serviceAsDescribedRating, buyAgainRating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { client: req.user.id }))
      .populate('professional');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'Completed' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Get client user
    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if review already exists
    let reviewDoc = await Review.findOne({ order: order._id });
    
    if (reviewDoc) {
      // Update existing review
      reviewDoc.rating = rating;
      reviewDoc.comment = comment?.trim() || '';
      reviewDoc.reviewer = client._id;
      reviewDoc.reviewerName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous';
    } else {
      // Create new review
      const professionalId = order.professional?._id || order.professional;
      reviewDoc = new Review({
        professional: professionalId,
        order: order._id,
        reviewer: client._id,
        reviewerName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous',
        rating: rating,
        comment: comment?.trim() || '',
      });
    }
    
    await reviewDoc.save();

    // Update order with rating
    order.rating = rating;
    order.review = comment?.trim() || '';
    await order.save();

    res.json({ 
      message: 'Review submitted successfully',
      review: {
        id: reviewDoc._id,
        rating: reviewDoc.rating,
        comment: reviewDoc.comment,
        reviewerName: reviewDoc.reviewerName,
        createdAt: reviewDoc.createdAt,
      }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// Professional: Submit review for buyer (client)
router.post('/:orderId/buyer-review', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId, { professional: req.user.id }))
      .populate('client');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'Completed' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Get professional user
    const professional = await User.findById(req.user.id);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Store buyer review in order metadata
    if (!order.metadata) order.metadata = {};
    order.metadata.buyerReview = {
      rating: rating,
      comment: comment?.trim() || '',
      reviewedBy: req.user.id,
      reviewerName: `${professional.firstName || ''} ${professional.lastName || ''}`.trim() || professional.tradingName || 'Professional',
      reviewedAt: new Date(),
    };
    
    await order.save();

    res.json({ 
      message: 'Buyer review submitted successfully',
      buyerReview: order.metadata.buyerReview,
    });
  } catch (error) {
    console.error('Submit buyer review error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit buyer review' });
  }
});

// Get review for an order (includes both client review and professional's buyer review)
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
      return res.json({ 
        review: null,
        buyerReview: order.metadata?.buyerReview || null,
      });
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
      },
      buyerReview: order.metadata?.buyerReview || null,
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message || 'Failed to get review' });
  }
});

// Create dispute for an order
router.post('/:orderId/dispute', authenticateToken, upload.array('evidenceFiles', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { requirements, unmetRequirements, offerAmount } = req.body;

    // Validate required fields
    if (!requirements || !requirements.trim()) {
      return res.status(400).json({ error: 'Please describe what the requirements were for the order' });
    }

    if (!unmetRequirements || !unmetRequirements.trim()) {
      return res.status(400).json({ error: 'Please describe which requirements were not completed' });
    }

    if (offerAmount === undefined || offerAmount === null || offerAmount === '') {
      return res.status(400).json({ error: 'Offer amount is required' });
    }

    const parsedOfferAmount = parseFloat(offerAmount);
    if (isNaN(parsedOfferAmount) || parsedOfferAmount < 0) {
      return res.status(400).json({ error: 'Offer amount cannot be negative' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName')
      .populate('professional', 'firstName lastName tradingName');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate offer amount does not exceed order amount
    if (parsedOfferAmount > order.totalAmount) {
      return res.status(400).json({ error: `Offer amount cannot exceed the order amount (£${order.totalAmount.toFixed(2)})` });
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
    const existingDispute = await Dispute.findOne({ order: order._id });
    if (existingDispute || order.disputeId) {
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

    // Process evidence files
    const evidenceFiles = req.files ? req.files.map(file => file.path) : [];

    // Initialize dispute messages with initial claim
    const claimantUser = isClient ? order.client : order.professional;
    const initialMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: claimantId,
      userName: isClient ? 
        `${claimantUser?.firstName || ''} ${claimantUser?.lastName || ''}`.trim() : 
        (claimantUser?.tradingName || `${claimantUser?.firstName || ''} ${claimantUser?.lastName || ''}`.trim()),
      userAvatar: claimantUser?.avatar || '',
      message: `**Requirements:** ${requirements}\n\n**Unmet Requirements:** ${unmetRequirements}`,
      timestamp: new Date(),
      isTeamResponse: false,
    };

    // Create dispute document
    const dispute = new Dispute({
      disputeId: disputeId,
      order: order._id,
      orderNumber: order.orderNumber,
      status: 'open',
      createdBy: claimantId,
      createdAt: new Date(),
      claimantId: claimantId,
      respondentId: respondentId,
      requirements: requirements,
      unmetRequirements: unmetRequirements,
      evidenceFiles: evidenceFiles,
      responseDeadline: responseDeadline,
      respondedAt: null,
      negotiationDeadline: null,
      messages: [initialMessage],
      offers: {
        clientOffer: isClient ? parsedOfferAmount : null,
        professionalOffer: isClient ? null : parsedOfferAmount,
      },
      arbitrationRequested: false,
      arbitrationRequestedBy: null,
      arbitrationRequestedAt: null,
      arbitrationFeeAmount: null,
      closedAt: null,
      winnerId: null,
      loserId: null,
      adminDecision: false,
      decisionNotes: null,
      autoClosed: false,
      finalAmount: null,
    });

    await dispute.save();

    // Update order status to disputed
    order.status = 'disputed';
    order.deliveryStatus = 'dispute';
    order.disputeId = disputeId;
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

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is still open
    if (dispute.status !== 'open') {
      return res.status(400).json({ error: 'This dispute is no longer open' });
    }

    // Check if user is the respondent
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isRespondent) {
      return res.status(403).json({ error: 'Only the respondent can respond to this dispute' });
    }

    // Check if already responded
    if (dispute.respondedAt) {
      return res.status(400).json({ error: 'You have already responded to this dispute' });
    }

    // Check if response deadline has passed
    if (dispute.responseDeadline && new Date(dispute.responseDeadline) < new Date()) {
      return res.status(400).json({ error: 'The response deadline has passed' });
    }

    // Get negotiation time from payment settings
    const settings = await PaymentSettings.getSettings();
    const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;

    // Calculate negotiation deadline
    const negotiationDeadline = new Date();
    negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);

    // Get respondent user info
    const respondentUser = await User.findById(req.user.id);
    const isClient = order.client?.toString() === req.user.id || order.client?._id?.toString() === req.user.id;
    
    // Add response message if provided
    if (message && message.trim()) {
      const responseMessage = {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userName: isClient ? 
          `${respondentUser.firstName || ''} ${respondentUser.lastName || ''}`.trim() : 
          (respondentUser.tradingName || `${respondentUser.firstName || ''} ${respondentUser.lastName || ''}`.trim()),
        userAvatar: respondentUser.avatar || '',
        message: message.trim(),
        timestamp: new Date(),
        isTeamResponse: false,
      };
      dispute.messages.push(responseMessage);
    }
    
    // Mark dispute as responded and enter negotiation phase
    dispute.status = 'negotiation';
    dispute.respondedAt = new Date();
    dispute.negotiationDeadline = negotiationDeadline;

    await dispute.save();

    res.json({ 
      message: 'Dispute response submitted successfully',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        respondedAt: dispute.respondedAt,
      }
    });
  } catch (error) {
    console.error('Respond to dispute error:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to dispute' });
  }
});

// Add message to dispute
router.post('/:orderId/dispute/message', authenticateToken, upload.array('attachments', 10), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    if ((!message || !message.trim()) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Message or attachment is required' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName avatar')
      .populate('professional', 'firstName lastName tradingName avatar');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to message in this dispute' });
    }

    // Get user info
    const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;
    const user = isClient ? order.client : order.professional;

    // Process attachments
    const attachments = req.files ? req.files.map((file) => ({
      url: file.path,
      fileName: file.originalname,
      fileType: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'other',
    })) : [];

    // Add message to dispute
    const newMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      userName: isClient ? 
        `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
        (user.tradingName || `${user.firstName || ''} ${user.lastName || ''}`.trim()),
      userAvatar: user.avatar || '',
      message: message ? message.trim() : '',
      timestamp: new Date(),
      isTeamResponse: false,
      attachments: attachments,
    };
    dispute.messages.push(newMessage);

    await dispute.save();

    res.json({ 
      message: 'Message added successfully',
      disputeMessage: {
        ...newMessage,
        attachments: attachments.map(att => ({
          url: att.url,
          fileName: att.fileName,
          fileType: att.fileType,
        })),
      }
    });
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ error: error.message || 'Failed to add message' });
  }
});

// Submit dispute offer
router.post('/:orderId/dispute/offer', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Offer amount is required' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Invalid offer amount' });
    }

    const order = await Order.findOne(await buildOrderQuery(orderId));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'Cannot submit offer for a closed dispute' });
    }

    // Validate offer amount does not exceed order amount
    if (parsedAmount > order.total) {
      return res.status(400).json({ error: `Offer amount cannot exceed the order amount (£${order.total.toFixed(2)})` });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to submit an offer for this dispute' });
    }

    // Determine if user is client or professional
    const isClient = order.client?.toString() === req.user.id || order.client?._id?.toString() === req.user.id;

    // Validate offer doesn't decrease from previous offer
    if (isClient) {
      const previousOffer = dispute.offers.clientOffer;
      if (previousOffer !== null && previousOffer !== undefined && parsedAmount < previousOffer) {
        return res.status(400).json({ error: `You cannot decrease your offer. Your current offer is £${previousOffer.toFixed(2)}` });
      }
      dispute.offers.clientOffer = parsedAmount;
    } else {
      const previousOffer = dispute.offers.professionalOffer;
      if (previousOffer !== null && previousOffer !== undefined && parsedAmount > previousOffer) {
        return res.status(400).json({ error: `You cannot increase your offer. Your current offer is £${previousOffer.toFixed(2)}` });
      }
      dispute.offers.professionalOffer = parsedAmount;
    }

    // Check if offers match - if so, resolve the dispute automatically
    const clientOffer = dispute.offers.clientOffer;
    const professionalOffer = dispute.offers.professionalOffer;
    
    if (clientOffer !== null && clientOffer !== undefined && 
        professionalOffer !== null && professionalOffer !== undefined && 
        clientOffer === professionalOffer) {
      // Offers match - resolve dispute
      dispute.status = 'closed';
      dispute.closedAt = new Date();
      dispute.finalAmount = clientOffer;
      order.status = 'Completed';
      order.deliveryStatus = 'completed';
      
      // Process refund if needed
      if (clientOffer < order.total) {
        const refundAmount = order.total - clientOffer;
        // Add refund logic here if needed
      }
    }

    await dispute.save();
    await order.save();

    res.json({ 
      message: 'Offer submitted successfully',
      offer: {
        clientOffer: dispute.offers.clientOffer,
        professionalOffer: dispute.offers.professionalOffer,
        isResolved: dispute.status === 'closed',
      }
    });
  } catch (error) {
    console.error('Submit dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit offer' });
  }
});

// Accept dispute offer and close dispute
router.post('/:orderId/dispute/accept', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'walletBalance')
      .populate('professional', 'walletBalance');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is already closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to accept this dispute offer' });
    }

    // Determine if user is client or professional
    const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;

    // Get the other party's offer
    const otherPartyOffer = isClient ? 
      dispute.offers?.professionalOffer : 
      dispute.offers?.clientOffer;

    if (otherPartyOffer === null || otherPartyOffer === undefined) {
      return res.status(400).json({ error: 'The other party has not made an offer yet' });
    }

    // Accept the offer and resolve dispute
    const agreedAmount = otherPartyOffer;
    dispute.status = 'closed';
    dispute.closedAt = new Date();
    dispute.finalAmount = agreedAmount;
    order.status = 'Completed';
    order.deliveryStatus = 'completed';

    // Process payment/refund if needed
    if (agreedAmount < order.total) {
      const refundAmount = order.total - agreedAmount;
      // Refund to client's wallet
      const clientWallet = await Wallet.findOne({ user: order.client });
      if (clientWallet) {
        clientWallet.balance += refundAmount;
        await clientWallet.save();
      }
      
      // Transfer agreed amount to professional's wallet
      const professionalWallet = await Wallet.findOne({ user: order.professional });
      if (professionalWallet) {
        professionalWallet.balance += agreedAmount;
        await professionalWallet.save();
      }
    } else {
      // Transfer full amount to professional
      const professionalWallet = await Wallet.findOne({ user: order.professional });
      if (professionalWallet) {
        professionalWallet.balance += agreedAmount;
        await professionalWallet.save();
      }
    }

    await dispute.save();
    await order.save();

    res.json({ 
      message: 'Dispute resolved successfully',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
        agreedAmount: agreedAmount,
        closedAt: dispute.closedAt,
      }
    });
  } catch (error) {
    console.error('Accept dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to accept dispute offer' });
  }
});

// Reject dispute offer
router.post('/:orderId/dispute/reject', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body; // Optional message explaining rejection

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'firstName lastName tradingName avatar')
      .populate('professional', 'firstName lastName tradingName avatar');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find dispute
    const dispute = await Dispute.findOne({ order: order._id });
    if (!dispute) {
      return res.status(400).json({ error: 'No dispute found for this order' });
    }

    // Check if dispute is open or in negotiation
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is already closed' });
    }

    // Check if user is involved in the dispute
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;

    if (!isClaimant && !isRespondent) {
      return res.status(403).json({ error: 'You are not authorized to reject this dispute offer' });
    }

    // Add rejection message if provided
    if (message && message.trim()) {
      const isClient = order.client?._id?.toString() === req.user.id || order.client?.toString() === req.user.id;
      const user = isClient ? order.client : order.professional;
      
      const rejectionMessage = {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
        userName: isClient ? 
          `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
          (user.tradingName || `${user.firstName || ''} ${user.lastName || ''}`.trim()),
        userAvatar: user.avatar || '',
        message: `Rejected offer. ${message.trim()}`,
        timestamp: new Date(),
        isTeamResponse: false,
      };
      dispute.messages.push(rejectionMessage);
    }

    await dispute.save();

    res.json({ 
      message: 'Offer rejected',
      dispute: {
        id: dispute.disputeId,
        status: dispute.status,
      }
    });
  } catch (error) {
    console.error('Reject dispute offer error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject dispute offer' });
  }
});

// Request admin arbitration (requires fee payment)
router.post('/:orderId/dispute/request-arbitration', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'walletBalance')
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

    const order = await Order.findOne(await buildOrderQuery(orderId))
      .populate('client', 'walletBalance')
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

// Upload attachment file (for additional information before order creation)
router.post('/upload-attachment', authenticateToken, requireRole(['client']), additionalInfoUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileUrl = `/api/orders/attachments/${req.file.filename}`;
    
    // Determine file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else if (req.file.mimetype === 'application/pdf' || 
               req.file.mimetype === 'application/msword' ||
               req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               req.file.mimetype === 'text/plain') {
      fileType = 'document';
    }
    
    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: fileType
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
    }
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload attachment' });
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

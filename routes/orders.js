import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import PaymentSettings from '../models/PaymentSettings.js';
import PromoCode from '../models/PromoCode.js';
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

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Create order
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    console.log('========== SERVER - Order Creation Request ==========');
    console.log('[Server] Request body keys:', Object.keys(req.body));
    console.log('[Server] Items count:', req.body.items?.length);
    console.log('[Server] Items with booking info:', req.body.items?.map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      title: item.title,
      hasBooking: !!item.booking,
      booking: item.booking,
      bookingType: typeof item.booking,
    })));
    
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

    // Create order
    console.log('[Server] ===== PROCESSING ORDER ITEMS =====');
    console.log('[Server] Processing', items.length, 'items');
    
    const processedItems = items.map((item, index) => {
      console.log(`[Server] Processing item ${index + 1}/${items.length}:`, {
        id: item.id,
        serviceId: item.serviceId,
        title: item.title,
        rawBooking: item.booking,
        bookingType: typeof item.booking,
        hasBooking: !!item.booking,
      });
      
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
        console.log(`[Server] Item ${index + 1} has booking info:`, item.booking);
        orderItem.booking = {
          date: item.booking.date,
          time: item.booking.time || '',
          timeSlot: item.booking.timeSlot || undefined,
        };
        console.log(`[Server] Item ${index + 1} booking added to orderItem:`, orderItem.booking);
      } else {
        console.log(`[Server] Item ${index + 1} has NO booking info`);
      }
      
      return orderItem;
    });
    
    console.log('[Server] Processed items with booking:', processedItems.map((item) => ({
      title: item.title,
      hasBooking: !!item.booking,
      booking: item.booking,
    })));

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
      status: paymentMethod === 'bank_transfer' ? 'Pending' : 'Pending',
      walletTransactionId,
      paymentTransactionId,
      metadata: {
        createdAt: new Date(),
        professionalPayoutAmount, // Store professional payout amount
        promoCodeType: promoCodeData?.type || null,
      },
    });

    console.log('[Server] Saving order to database...');
    console.log('[Server] Order items before save:', order.items.map((item) => ({
      title: item.title,
      booking: item.booking,
      hasBooking: !!item.booking,
    })));
    
    await order.save();
    
    console.log('[Server] ===== ORDER SAVED TO DATABASE =====');
    console.log('[Server] Order ID:', order._id);
    console.log('[Server] Order Number:', order.orderNumber);
    const savedOrder = await Order.findById(order._id);
    console.log('[Server] Saved order items from DB:', savedOrder?.items?.map((item) => ({
      title: item.title,
      booking: item.booking,
      hasBooking: !!item.booking,
      bookingDate: item.booking?.date,
      bookingTime: item.booking?.time,
    })));

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
    
    console.log('[Server] Response data - order items booking:', responseData.order.items?.map((item) => ({
      title: item.title,
      booking: item.booking,
      hasBooking: !!item.booking,
    })));
    console.log('==================================================');
    
    return res.json(responseData);
  } catch (error) {
    console.error('Create order error:', error);
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

    // Transform orders to match frontend format
    const transformedOrders = orders.map(order => {
      const client = order.client;
      const professional = order.professional;
      
      // Determine service name from first item
      const serviceName = order.items?.[0]?.title || 'Service Order';
      
      // Format amount
      const amount = `£${order.total.toFixed(2)}`;
      
      // Map status
      let status = order.status || 'Pending';
      if (status === 'pending') status = 'Pending';
      if (status === 'in_progress') status = 'In Progress';
      if (status === 'completed') status = 'Completed';
      if (status === 'cancelled') status = 'Cancelled';
      
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
      };
    });

    return res.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

export default router;

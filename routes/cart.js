import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import Cart from '../models/Cart.js';
import Service from '../models/Service.js';

const router = express.Router();

// Helper function to generate item key for uniqueness
function generateItemKey(item) {
  const parts = [item.serviceId || item.id];
  if (item.packageType) {
    parts.push(item.packageType);
  }
  if (item.addons && item.addons.length > 0) {
    const addonsKey = item.addons
      .sort((a, b) => a.id - b.id)
      .map(a => `${a.id}-${a.price}`)
      .join(',');
    parts.push(addonsKey);
  }
  return parts.join('|');
}

// Get user's cart
router.get('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
      await cart.save();
    }

    console.log('🛒 [Cart API] Fetching cart with', cart.items.length, 'items');

    // Map cart items to frontend format and fetch priceUnit if missing
    const items = await Promise.all(cart.items.map(async (item) => {
      let priceUnit = item.priceUnit;
      
      // If priceUnit is missing or 'fixed', try to fetch from service
      if (!priceUnit || priceUnit === 'fixed') {
        try {
          const service = await Service.findById(item.serviceId);
          if (service && service.priceUnit) {
            priceUnit = service.priceUnit;
            console.log('✅ [Cart API] Fetched priceUnit for', item.title, ':', priceUnit);
          }
        } catch (err) {
          console.log('⚠️ [Cart API] Could not fetch service details:', err.message);
        }
      }

      console.log('📋 [Cart API] Item:', item.title, '- priceUnit:', priceUnit);

      return {
        id: item.itemKey || item.serviceId, // Use itemKey for uniqueness
        serviceId: item.serviceId, // Actual MongoDB service ID
        title: item.title,
        seller: item.seller,
        price: item.price,
        image: item.image,
        rating: item.rating,
        quantity: item.quantity,
        addons: item.addons || [],
        booking: item.booking,
        packageType: item.packageType,
        thumbnailVideo: item.thumbnailVideo || undefined,
        priceUnit: priceUnit || 'fixed',
      };
    }));

    console.log('✅ [Cart API] Returning', items.length, 'items');

    return res.json({ items });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/items', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { item, quantity = 1 } = req.body;

    console.log('📦 [Cart API] Add to cart request:', {
      serviceId: item.serviceId || item.id,
      title: item.title,
      priceUnit: item.priceUnit
    });

    if (!item || !item.id) {
      return res.status(400).json({ error: 'Item data is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
    }

    const itemKey = generateItemKey(item);
    
    // Check if item with same key already exists
    const existingItemIndex = cart.items.findIndex(i => i.itemKey === itemKey);

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      // Use serviceId if provided, otherwise use id (for backward compatibility)
      const serviceId = item.serviceId || item.id;
      
      // Fetch service details to get priceUnit if not provided
      let priceUnit = item.priceUnit;
      if (!priceUnit || priceUnit === 'fixed') {
        try {
          const service = await Service.findById(serviceId);
          if (service && service.priceUnit) {
            priceUnit = service.priceUnit;
            console.log('✅ [Cart API] Fetched priceUnit from service:', priceUnit);
          }
        } catch (err) {
          console.log('⚠️ [Cart API] Could not fetch service details:', err.message);
        }
      }
      
      console.log('💾 [Cart API] Saving item with priceUnit:', priceUnit);
      
      cart.items.push({
        serviceId: serviceId,
        title: item.title || '',
        seller: item.seller || '',
        price: item.price || 0,
        image: item.image || '',
        rating: item.rating,
        quantity: quantity,
        addons: item.addons || [],
        booking: item.booking,
        packageType: item.packageType,
        thumbnailVideo: item.thumbnailVideo || undefined,
        priceUnit: priceUnit || 'fixed',
        itemKey: itemKey,
      });
    }

    await cart.save();

    // Map cart items to frontend format
    const items = cart.items.map(i => ({
      id: i.itemKey, // Item key for uniqueness
      serviceId: i.serviceId, // Actual MongoDB service ID
      title: i.title,
      seller: i.seller,
      price: i.price,
      image: i.image,
      rating: i.rating,
      quantity: i.quantity,
      addons: i.addons || [],
      booking: i.booking,
      packageType: i.packageType,
      thumbnailVideo: i.thumbnailVideo || undefined,
      priceUnit: i.priceUnit || 'fixed',
    }));

    return res.json({ items, message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update item quantity or other properties
router.put('/items/:itemKey', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { itemKey } = req.params;
    const { quantity, booking, ...otherUpdates } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(i => i.itemKey === itemKey);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    // Update booking if provided
    if (booking !== undefined) {
      cart.items[itemIndex].booking = booking;
    }

    // Update thumbnailVideo if provided
    if (otherUpdates.thumbnailVideo !== undefined) {
      cart.items[itemIndex].thumbnailVideo = otherUpdates.thumbnailVideo;
    }

    // Update other properties if provided (excluding thumbnailVideo which is already handled)
    const { thumbnailVideo, ...restUpdates } = otherUpdates || {};
    if (restUpdates && Object.keys(restUpdates).length > 0) {
      Object.assign(cart.items[itemIndex], restUpdates);
    }

    await cart.save();

    // Map cart items to frontend format
    const items = cart.items.map(i => ({
      id: i.itemKey, // Item key for uniqueness
      serviceId: i.serviceId, // Actual MongoDB service ID
      title: i.title,
      seller: i.seller,
      price: i.price,
      image: i.image,
      rating: i.rating,
      quantity: i.quantity,
      addons: i.addons || [],
      booking: i.booking,
      packageType: i.packageType,
      thumbnailVideo: i.thumbnailVideo || undefined,
      priceUnit: i.priceUnit || 'fixed',
    }));

    return res.json({ items, message: 'Cart item updated' });
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/items/:itemKey', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { itemKey } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(i => i.itemKey !== itemKey);
    await cart.save();

    // Map cart items to frontend format
    const items = cart.items.map(i => ({
      id: i.itemKey, // Item key for uniqueness
      serviceId: i.serviceId, // Actual MongoDB service ID
      title: i.title,
      seller: i.seller,
      price: i.price,
      image: i.image,
      rating: i.rating,
      quantity: i.quantity,
      addons: i.addons || [],
      booking: i.booking,
      packageType: i.packageType,
      thumbnailVideo: i.thumbnailVideo || undefined,
      priceUnit: i.priceUnit || 'fixed',
    }));

    return res.json({ items, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.json({ items: [], message: 'Cart is already empty' });
    }

    cart.items = [];
    await cart.save();

    return res.json({ items: [], message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;

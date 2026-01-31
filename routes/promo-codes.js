import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Validate and get promo code details
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code, subtotal, items } = req.body;
    
    
    if (!code || !subtotal) {
      return res.status(400).json({ error: 'Code and subtotal are required' });
    }
    
    // Find promo code
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase().trim(),
      status: 'active'
    });
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }
    
    // For pro promo codes, first check if items belong to the professional who created the code
    // This allows us to skip validFrom check if the services belong to the promo code creator
    let servicesBelongToPro = false;
    if (promoCode.type === 'pro' && promoCode.professional && items && items.length > 0) {
      const Service = (await import('../models/Service.js')).default;
      const itemServiceIds = items.map(item => item.serviceId || item.id).filter(Boolean);
      
      const services = await Service.find({
        _id: { $in: itemServiceIds }
      }).select('professional title').lean();
      
      // Extract professional IDs properly
      const servicesWithOwnerIds = services.map(s => {
        let ownerId = null;
        
        if (s.professional) {
          // If it's an ObjectId instance
          if (s.professional.constructor && s.professional.constructor.name === 'ObjectId') {
            ownerId = s.professional.toString();
          }
          // If it's an object with _id
          else if (typeof s.professional === 'object' && s.professional._id) {
            const proId = s.professional._id;
            ownerId = proId.toString ? proId.toString() : String(proId);
          }
          // If it's already a string
          else if (typeof s.professional === 'string') {
            ownerId = s.professional;
          }
          // Fallback: try toString
          else if (s.professional.toString && typeof s.professional.toString === 'function') {
            ownerId = s.professional.toString();
          }
          // Last resort: convert to string
          else {
            ownerId = String(s.professional);
          }
        }
        
        return {
          serviceId: s._id.toString(),
          ownerId: ownerId,
          title: s.title
        };
      });
      
      // Extract promo professional ID properly
      let promoProId = null;
      if (promoCode.professional) {
        if (promoCode.professional.constructor && promoCode.professional.constructor.name === 'ObjectId') {
          promoProId = promoCode.professional.toString();
        } else if (typeof promoCode.professional === 'object' && promoCode.professional._id) {
          promoProId = promoCode.professional._id.toString ? promoCode.professional._id.toString() : String(promoCode.professional._id);
        } else if (typeof promoCode.professional === 'string') {
          promoProId = promoCode.professional;
        } else if (promoCode.professional.toString) {
          promoProId = promoCode.professional.toString();
        } else {
          promoProId = String(promoCode.professional);
        }
      }
      
      const allServicesBelongToPro = services.length > 0 && servicesWithOwnerIds.every(serviceWithOwner => {
        return serviceWithOwner.ownerId === promoProId;
      });
      
      servicesBelongToPro = allServicesBelongToPro;
      
    }
    
    // Check validity - for pro promo codes on their own services, skip validFrom check
    let validation = promoCode.isValid(req.user?.id);
    
    // If it's a pro promo code and services belong to the pro, allow even if validFrom is in future
    if (!validation.valid && validation.reason === 'Promo code is not yet valid' && 
        promoCode.type === 'pro' && servicesBelongToPro) {
      // Create a custom validation that skips validFrom check
      const now = new Date();
      
      // Check status
      if (promoCode.status !== 'active') {
        validation = { valid: false, reason: 'Promo code is not active' };
      }
      // Skip validFrom check for pro's own services
      else if (promoCode.validUntil && now > promoCode.validUntil) {
        validation = { valid: false, reason: 'Promo code has expired' };
      }
      // Check usage limit
      else if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        validation = { valid: false, reason: 'Promo code usage limit reached' };
      }
      // Check per-user limit
      else if (req.user?.id) {
        const userUsage = promoCode.usedBy?.find(u => u.user.toString() === req.user.id.toString());
        if (userUsage && userUsage.count >= promoCode.perUserLimit) {
          validation = { valid: false, reason: 'You have reached the usage limit for this promo code' };
        } else {
          validation = { valid: true };
        }
      } else {
        validation = { valid: true };
      }
    }
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }
    
    // Check minimum order amount
    if (promoCode.minOrderAmount && subtotal < promoCode.minOrderAmount) {
      return res.status(400).json({ 
        error: `Minimum order amount of £${promoCode.minOrderAmount.toFixed(2)} required` 
      });
    }
    
    // For pro promo codes, check if items belong to the professional who created the code (if not already checked)
    if (promoCode.type === 'pro' && promoCode.professional) {
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items are required for professional promo codes' });
      }
      
      // Only check again if we didn't already check above
      let services;
      if (!servicesBelongToPro) {
        // Get services from items and check if they belong to the professional
        const Service = (await import('../models/Service.js')).default;
        const itemServiceIds = items.map(item => item.serviceId || item.id).filter(Boolean);
        
        services = await Service.find({
          _id: { $in: itemServiceIds }
        }).select('professional serviceCategory title');
        
        // Check if all services belong to the professional who created the promo code
        const allServicesBelongToPro = services.every(service => {
          const serviceProId = service.professional?.toString ? service.professional.toString() : String(service.professional);
          const promoProId = promoCode.professional.toString ? promoCode.professional.toString() : String(promoCode.professional);
          return serviceProId === promoProId;
        });
        
        if (!allServicesBelongToPro) {
          return res.status(400).json({ 
            error: 'This promo code can only be used for services from the professional who created it' 
          });
        }
      } else {
        // We already checked above, but we need services for category check
        const Service = (await import('../models/Service.js')).default;
        const itemServiceIds = items.map(item => item.serviceId || item.id).filter(Boolean);
        
        services = await Service.find({
          _id: { $in: itemServiceIds }
        }).select('professional serviceCategory title').lean();
      }
      
      
      // If pro promo code has categories, also check if items match those categories
      if (promoCode.categories && promoCode.categories.length > 0) {
        // Extract category IDs from services
        const serviceCategoryIds = services
          .map(s => {
            if (!s.serviceCategory) return null;
            
            // Check if it's a Mongoose ObjectId
            if (s.serviceCategory.constructor && s.serviceCategory.constructor.name === 'ObjectId') {
              return s.serviceCategory.toString();
            }
            
            // If it's an object with _id property (populated or already an object)
            if (typeof s.serviceCategory === 'object') {
              // Check if it has _id property (populated object)
              if (s.serviceCategory._id) {
                const id = s.serviceCategory._id;
                // Handle both ObjectId and string _id
                return id.toString ? id.toString() : String(id);
              }
              // If it's a plain object representation, try to extract _id value
              const idStr = s.serviceCategory._id?.toString() || s.serviceCategory._id;
              if (idStr) return String(idStr);
            }
            
            // Fallback: try toString if it exists
            if (typeof s.serviceCategory.toString === 'function') {
              const str = s.serviceCategory.toString();
              // If toString returns object representation, try JSON parsing
              if (str.startsWith('{')) {
                try {
                  const parsed = JSON.parse(str);
                  if (parsed._id) return String(parsed._id);
                } catch (e) {
                  // Ignore parse errors
                }
              }
              return str;
            }
            
            // Last resort: convert to string
            return String(s.serviceCategory);
          })
          .filter(Boolean)
          .map(id => {
            // Extract just the ID if it looks like a MongoDB ObjectId string
            const match = String(id).match(/(?:ObjectId\(['"]|['"])?([0-9a-fA-F]{24})(?:['"]\))?/);
            return match ? match[1] : id;
          });
        
        // Check if any item's category matches promo code categories
        const promoCategoryIds = promoCode.categories.map(c => c.toString());
        const hasMatchingCategory = serviceCategoryIds.some(catId => 
          promoCategoryIds.includes(catId)
        );
        if (!hasMatchingCategory) {
          return res.status(400).json({ 
            error: 'This promo code is not applicable to the selected services' 
          });
        }
      }
    }
    
    // For admin promo codes, check if items match categories
    if (promoCode.type === 'admin' && promoCode.categories && promoCode.categories.length > 0) {
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Items are required for category-based promo codes' });
      }
      
      // Get service categories from items
      const Service = (await import('../models/Service.js')).default;
      const itemServiceIds = items.map(item => item.serviceId || item.id).filter(Boolean);
      
      const services = await Service.find({
        _id: { $in: itemServiceIds }
      }).select('serviceCategory title');
      
      // Extract category IDs properly
      // serviceCategory should be ObjectId, but handle both cases
      const serviceCategoryIds = services
        .map(s => {
          if (!s.serviceCategory) return null;
          
          // Check if it's a Mongoose ObjectId
          if (s.serviceCategory.constructor && s.serviceCategory.constructor.name === 'ObjectId') {
            return s.serviceCategory.toString();
          }
          
          // If it's an object with _id property (populated or already an object)
          if (typeof s.serviceCategory === 'object') {
            // Check if it has _id property (populated object)
            if (s.serviceCategory._id) {
              const id = s.serviceCategory._id;
              // Handle both ObjectId and string _id
              return id.toString ? id.toString() : String(id);
            }
            // If it's a plain object representation, try to extract _id value
            // This handles cases where MongoDB returns the object structure
            const idStr = s.serviceCategory._id?.toString() || s.serviceCategory._id;
            if (idStr) return String(idStr);
          }
          
          // Fallback: try toString if it exists
          if (typeof s.serviceCategory.toString === 'function') {
            const str = s.serviceCategory.toString();
            // If toString returns object representation, try JSON parsing
            if (str.startsWith('{')) {
              try {
                const parsed = JSON.parse(str);
                if (parsed._id) return String(parsed._id);
              } catch (e) {
                // Ignore parse errors
              }
            }
            return str;
          }
          
          // Last resort: convert to string
          return String(s.serviceCategory);
        })
        .filter(Boolean)
        .map(id => {
          // Extract just the ID if it looks like a MongoDB ObjectId string
          // Handle cases like "69493710e81fd1f80727bd30" or "ObjectId('69493710e81fd1f80727bd30')"
          const match = String(id).match(/(?:ObjectId\(['"]|['"])?([0-9a-fA-F]{24})(?:['"]\))?/);
          return match ? match[1] : id;
        });
      
      // Check if any item's category matches promo code categories
      const promoCategoryIds = promoCode.categories.map(c => c.toString());
      const hasMatchingCategory = serviceCategoryIds.some(catId => 
        promoCategoryIds.includes(catId)
      );
      
      if (!hasMatchingCategory) {
        return res.status(400).json({ 
          error: 'This promo code is not applicable to the selected services' 
        });
      }
      
    }
    
    // Calculate discount
    const discountAmount = promoCode.calculateDiscount(subtotal);
    
    // Return professional ID for pro promo codes for frontend validation
    const responseData = {
      valid: true,
      promoCode: {
        id: promoCode._id,
        code: promoCode.code,
        type: promoCode.type,
        discount: discountAmount,
        discountType: promoCode.discountType,
        originalDiscount: promoCode.discount,
      },
    };
    
    // Add professional ID for pro promo codes
    if (promoCode.type === 'pro' && promoCode.professional) {
      responseData.promoCode.professionalId = promoCode.professional.toString ? promoCode.professional.toString() : String(promoCode.professional);
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

// Create promo code (Pro)
router.post('/', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const {
      code,
      discount,
      discountType,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      description,
    } = req.body;
    
    if (!code || !discount || !discountType) {
      return res.status(400).json({ error: 'Code, discount, and discountType are required' });
    }
    
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'Invalid discountType' });
    }
    
    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    
    const promoCode = new PromoCode({
      code: code.toUpperCase().trim(),
      type: 'pro',
      professional: req.user.id,
      discount: parseFloat(discount),
      discountType,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
      description: description?.trim() || '',
      status: 'active',
    });
    
    await promoCode.save();
    
    res.status(201).json({ promoCode });
  } catch (error) {
    console.error('Error creating promo code:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to create promo code' });
  }
});

// Get available promo codes for cart items (by service IDs)
router.post('/available-by-services', authenticateToken, async (req, res) => {
  try {
    const { items, subtotal } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ promoCodes: [] });
    }
    
    // Get service IDs from items
    const Service = (await import('../models/Service.js')).default;
    const itemServiceIds = items.map(item => item.serviceId || item.id).filter(Boolean);
    
    // Get services and their professionals
    const services = await Service.find({
      _id: { $in: itemServiceIds }
    }).select('professional serviceCategory').lean();
    
    // Get unique professional IDs and convert to ObjectId
    const mongoose = (await import('mongoose')).default;
    const professionalIds = [...new Set(services.map(s => {
      if (!s.professional) return null;
      
      // If it's already an ObjectId, return it
      if (s.professional.constructor && s.professional.constructor.name === 'ObjectId') {
        return s.professional;
      }
      
      // If it's an object with _id, use that
      if (typeof s.professional === 'object' && s.professional._id) {
        return s.professional._id;
      }
      
      // If it's a string, convert to ObjectId
      if (typeof s.professional === 'string') {
        try {
          return new mongoose.Types.ObjectId(s.professional);
        } catch (e) {
          console.error('[Promo Code] Invalid professional ID:', s.professional);
          return null;
        }
      }
      
      // Fallback: try toString and convert
      try {
        const proIdStr = s.professional.toString ? s.professional.toString() : String(s.professional);
        return new mongoose.Types.ObjectId(proIdStr);
      } catch (e) {
        console.error('[Promo Code] Failed to convert professional ID:', s.professional);
        return null;
      }
    }).filter(Boolean))];
    
    if (professionalIds.length === 0) {
      return res.json({ promoCodes: [] });
    }
    
    // Get active promo codes from these professionals
    const now = new Date();
    const promoCodes = await PromoCode.find({
      type: 'pro',
      professional: { $in: professionalIds },
      status: 'active',
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: { $lte: now } }
          ]
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: now } }
          ]
        }
      ]
    }).populate('professional', 'firstName lastName tradingName').lean();
    
      // Filter promo codes that are valid and applicable to the cart
      const validPromoCodes = [];
      const currentDate = new Date();
      
      for (const promoCode of promoCodes) {
      if (promoCode.status !== 'active') {
        continue;
      }
      
      if (promoCode.validFrom && now < promoCode.validFrom) {
        continue;
      }
      
      if (promoCode.validUntil && now > promoCode.validUntil) {
        continue;
      }
      
      if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
        continue;
      }
      
      if (promoCode.perUserLimit && req.user?.id) {
        const userUsage = promoCode.usedBy?.find(u => 
          u.user.toString() === req.user.id.toString()
        );
        if (userUsage && userUsage.count >= promoCode.perUserLimit) {
          continue;
        }
      }
      
      // Check minimum order amount
      if (promoCode.minOrderAmount && subtotal && subtotal < promoCode.minOrderAmount) {
        continue;
      }
      
      // Check if promo code applies to services in cart
      const promoProId = promoCode.professional?.toString ? promoCode.professional.toString() : String(promoCode.professional);
      const relevantServices = services.filter(s => {
        const serviceProId = s.professional?.toString ? s.professional.toString() : String(s.professional);
        return serviceProId === promoProId;
      });
      
      if (relevantServices.length === 0) {
        continue;
      }
      
      // If promo code has categories, check if any service matches
      if (promoCode.categories && promoCode.categories.length > 0) {
        const serviceCategoryIds = relevantServices
          .map(s => {
            if (!s.serviceCategory) return null;
            const catId = s.serviceCategory?.toString ? s.serviceCategory.toString() : String(s.serviceCategory);
            return catId;
          })
          .filter(Boolean);
        
        const promoCategoryIds = promoCode.categories.map(c => 
          c.toString ? c.toString() : String(c)
        );
        
        const hasMatchingCategory = serviceCategoryIds.some(catId => 
          promoCategoryIds.includes(catId)
        );
        
        if (!hasMatchingCategory) {
          continue;
        }
      }
      
      // Calculate discount
      let discountAmount = 0;
      if (promoCode.discountType === 'percentage') {
        discountAmount = (subtotal || 0) * promoCode.discount / 100;
        if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
          discountAmount = promoCode.maxDiscountAmount;
        }
      } else {
        discountAmount = Math.min(promoCode.discount, subtotal || 0);
      }
      
      discountAmount = Math.round(discountAmount * 100) / 100;
      
      validPromoCodes.push({
        id: promoCode._id,
        code: promoCode.code,
        type: promoCode.type,
        discount: discountAmount,
        discountType: promoCode.discountType,
        originalDiscount: promoCode.discount,
        professional: promoCode.professional?.tradingName || 'Professional',
        description: promoCode.description
      });
    }
    
    res.json({ promoCodes: validPromoCodes });
  } catch (error) {
    console.error('Error fetching available promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch available promo codes' });
  }
});

// Get promo codes (Pro - their own codes)
router.get('/pro', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({ 
      professional: req.user.id,
      type: 'pro'
    }).sort({ createdAt: -1 });
    
    res.json({ promoCodes });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Update promo code (Pro)
router.put('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    if (promoCode.professional.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this promo code' });
    }
    
    const {
      discount,
      discountType,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      description,
      status,
    } = req.body;
    
    if (discount !== undefined) promoCode.discount = parseFloat(discount);
    if (discountType) promoCode.discountType = discountType;
    if (minOrderAmount !== undefined) promoCode.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscountAmount !== undefined) promoCode.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    if (validFrom) promoCode.validFrom = new Date(validFrom);
    if (validUntil) promoCode.validUntil = validUntil ? new Date(validUntil) : null;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (perUserLimit !== undefined) promoCode.perUserLimit = parseInt(perUserLimit);
    if (description !== undefined) promoCode.description = description?.trim() || '';
    if (status) promoCode.status = status;
    
    await promoCode.save();
    
    res.json({ promoCode });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete promo code (Pro)
router.delete('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    if (promoCode.professional.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this promo code' });
    }
    
    await PromoCode.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Admin routes
// Create admin promo code
router.post('/admin', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      code,
      discount,
      discountType,
      categories,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      description,
    } = req.body;
    
    if (!code || !discount || !discountType) {
      return res.status(400).json({ error: 'Code, discount, and discountType are required' });
    }
    
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'Invalid discountType' });
    }
    
    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    
    // Validate categories if provided
    if (categories && categories.length > 0) {
      const validCategories = await ServiceCategory.find({
        _id: { $in: categories }
      });
      if (validCategories.length !== categories.length) {
        return res.status(400).json({ error: 'Invalid category IDs' });
      }
    }
    
    const promoCode = new PromoCode({
      code: code.toUpperCase().trim(),
      type: 'admin',
      categories: categories || [],
      discount: parseFloat(discount),
      discountType,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
      description: description?.trim() || '',
      status: 'active',
    });
    
    await promoCode.save();
    
    await promoCode.populate('categories', 'name slug');
    
    res.status(201).json({ promoCode });
  } catch (error) {
    console.error('Error creating admin promo code:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to create admin promo code' });
  }
});

// Get all admin promo codes
router.get('/admin', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({ type: 'admin' })
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 });
    
    res.json({ promoCodes });
  } catch (error) {
    console.error('Error fetching admin promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch admin promo codes' });
  }
});

// Update admin promo code
router.put('/admin/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    if (promoCode.type !== 'admin') {
      return res.status(400).json({ error: 'Not an admin promo code' });
    }
    
    const {
      discount,
      discountType,
      categories,
      minOrderAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      description,
      status,
    } = req.body;
    
    if (discount !== undefined) promoCode.discount = parseFloat(discount);
    if (discountType) promoCode.discountType = discountType;
    if (categories !== undefined) {
      if (categories.length > 0) {
        const validCategories = await ServiceCategory.find({
          _id: { $in: categories }
        });
        if (validCategories.length !== categories.length) {
          return res.status(400).json({ error: 'Invalid category IDs' });
        }
      }
      promoCode.categories = categories;
    }
    if (minOrderAmount !== undefined) promoCode.minOrderAmount = parseFloat(minOrderAmount);
    if (maxDiscountAmount !== undefined) promoCode.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
    if (validFrom) promoCode.validFrom = new Date(validFrom);
    if (validUntil) promoCode.validUntil = validUntil ? new Date(validUntil) : null;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (perUserLimit !== undefined) promoCode.perUserLimit = parseInt(perUserLimit);
    if (description !== undefined) promoCode.description = description?.trim() || '';
    if (status) promoCode.status = status;
    
    await promoCode.save();
    await promoCode.populate('categories', 'name slug');
    
    res.json({ promoCode });
  } catch (error) {
    console.error('Error updating admin promo code:', error);
    res.status(500).json({ error: 'Failed to update admin promo code' });
  }
});

// Delete admin promo code
router.delete('/admin/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    
    if (promoCode.type !== 'admin') {
      return res.status(400).json({ error: 'Not an admin promo code' });
    }
    
    await PromoCode.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Admin promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin promo code:', error);
    res.status(500).json({ error: 'Failed to delete admin promo code' });
  }
});

export default router;

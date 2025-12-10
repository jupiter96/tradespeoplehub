import express from 'express';
import Sector from '../models/Sector.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

const router = express.Router();

// Get all sectors (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      activeOnly = 'true', 
      includeCategories = 'false', 
      includeSubCategories = 'false',
      search = '',
      sortBy = 'order',
      sortOrder = 'asc',
      page = '1',
      limit = '20'
    } = req.query;
    
    const query = activeOnly === 'true' ? { isActive: true } : {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Parse pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Build sort object
    const sortObj = {};
    const sortField = sortBy || 'order';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sortObj[sortField] = sortDirection;
    // Secondary sort by name if not already sorting by it
    if (sortField !== 'name') {
      sortObj.name = 1;
    }
    
    // Get total count for pagination
    const total = await Sector.countDocuments(query);
    
    let sectors = await Sector.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Include categories if requested
    if (includeCategories === 'true') {
      sectors = await Promise.all(
        sectors.map(async (sector) => {
          const categories = await Category.find({
            sector: sector._id,
            isActive: activeOnly === 'true' ? true : { $exists: true }
          })
            .sort({ createdAt: 1, name: 1 })
            .lean();
          
          // Include subcategories if requested
          if (includeSubCategories === 'true') {
            const categoriesWithSubCategories = await Promise.all(
              categories.map(async (category) => {
                const subCategories = await SubCategory.find({
                  category: category._id,
                  isActive: activeOnly === 'true' ? true : { $exists: true }
                })
                  .sort({ createdAt: 1, name: 1 })
                  .lean();
                return { ...category, subCategories };
              })
            );
            return { ...sector, categories: categoriesWithSubCategories };
          }
          
          return { ...sector, categories };
        })
      );
    }
    
    return res.json({ 
      sectors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get sectors error', error);
    return res.status(500).json({ error: 'Failed to fetch sectors' });
  }
});

// Get single sector by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeCategories = 'false', includeSubCategories = 'false', activeOnly = 'true' } = req.query;
    
    // Try to find by ID first, then by slug
    let sector;
    const query = {};
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = identifier;
    } else {
      query.slug = identifier;
    }
    
    // Only return active sectors for frontend (unless explicitly requested)
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    sector = await Sector.findOne(query);
    
    if (!sector) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    
    const sectorData = sector.toObject();
    
    // Include categories if requested
    if (includeCategories === 'true') {
      const categories = await Category.find({ 
        sector: sector._id,
        isActive: true 
      })
        .sort({ order: 1, name: 1 })
        .lean();
      
      // Include subcategories if requested
      if (includeSubCategories === 'true') {
        const categoriesWithSubCategories = await Promise.all(
          categories.map(async (category) => {
            const subCategories = await SubCategory.find({
              category: category._id,
              isActive: true
            })
              .sort({ order: 1, name: 1 })
              .lean();
            return { ...category, subCategories };
          })
        );
        sectorData.categories = categoriesWithSubCategories;
      } else {
        sectorData.categories = categories;
      }
    }
    
    return res.json({ sector: sectorData });
  } catch (error) {
    console.error('Get sector error', error);
    return res.status(500).json({ error: 'Failed to fetch sector' });
  }
});

// Create new sector (Admin only - add auth middleware later)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      metaTitle,
      metaDescription,
      icon,
      bannerImage,
      displayName,
      subtitle,
      order,
      isActive,
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Sector name is required' });
    }
    
    // Generate slug if not provided
    const sectorSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingSector = await Sector.findOne({ slug: sectorSlug });
    if (existingSector) {
      return res.status(409).json({ error: 'Sector with this slug already exists' });
    }
    
    // Find next available order if provided order is taken or not provided
    let finalOrder = order !== undefined ? order : 0;
    if (order !== undefined) {
      const existingOrder = await Sector.findOne({ order });
      if (existingOrder) {
        // Find next available order
        const allSectors = await Sector.find({}).sort({ order: 1 }).select('order').lean();
        const existingOrders = allSectors.map(s => s.order).sort((a, b) => a - b);
        // Find first gap or use max + 1
        finalOrder = existingOrders.length;
        for (let i = 0; i < existingOrders.length; i++) {
          if (existingOrders[i] !== i) {
            finalOrder = i;
            break;
          }
        }
        if (finalOrder === existingOrders.length && existingOrders.length > 0) {
          finalOrder = existingOrders[existingOrders.length - 1] + 1;
        }
      }
    } else {
      // If no order provided, find next available
      const allSectors = await Sector.find({}).sort({ order: 1 }).select('order').lean();
      const existingOrders = allSectors.map(s => s.order).sort((a, b) => a - b);
      finalOrder = existingOrders.length;
      for (let i = 0; i < existingOrders.length; i++) {
        if (existingOrders[i] !== i) {
          finalOrder = i;
          break;
        }
      }
      if (finalOrder === existingOrders.length && existingOrders.length > 0) {
        finalOrder = existingOrders[existingOrders.length - 1] + 1;
      }
    }
    
    const sector = await Sector.create({
      name,
      slug: sectorSlug,
      description,
      metaTitle,
      metaDescription,
      icon,
      bannerImage,
      order: finalOrder,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    return res.status(201).json({ sector });
  } catch (error) {
    console.error('Create sector error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.order) {
        return res.status(409).json({ error: `Sector with order ${order} already exists. Order must be unique.` });
      }
      return res.status(409).json({ error: 'Sector with this name or slug already exists' });
    }
    return res.status(500).json({ error: 'Failed to create sector' });
  }
});

// Update sector (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      metaTitle,
      metaDescription,
      icon,
      bannerImage,
      order,
      isActive,
    } = req.body;
    
    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    
    // Check if slug is being changed and if it conflicts
    if (slug && slug !== sector.slug) {
      const existingSector = await Sector.findOne({ slug, _id: { $ne: id } });
      if (existingSector) {
        return res.status(409).json({ error: 'Sector with this slug already exists' });
      }
    }
    
    // Check if order is being changed and if it conflicts
    if (order !== undefined && order !== sector.order) {
      const existingOrder = await Sector.findOne({ order, _id: { $ne: id } });
      if (existingOrder) {
        return res.status(409).json({ error: `Sector with order ${order} already exists. Order must be unique.` });
      }
    }
    
    // Update fields
    if (name !== undefined) sector.name = name;
    if (slug !== undefined) sector.slug = slug;
    if (description !== undefined) sector.description = description;
    if (metaTitle !== undefined) sector.metaTitle = metaTitle;
    if (metaDescription !== undefined) sector.metaDescription = metaDescription;
    if (icon !== undefined) sector.icon = icon;
    if (bannerImage !== undefined) sector.bannerImage = bannerImage;
    if (order !== undefined) sector.order = order;
    if (isActive !== undefined) sector.isActive = isActive;
    
    await sector.save();
    
    return res.json({ sector });
  } catch (error) {
    console.error('Update sector error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.order) {
        return res.status(409).json({ error: `Sector with order ${order} already exists. Order must be unique.` });
      }
      return res.status(409).json({ error: 'Sector with this name or slug already exists' });
    }
    return res.status(500).json({ error: 'Failed to update sector' });
  }
});

// Bulk update sector order
router.put('/bulk/order', async (req, res) => {
  try {
    console.log('=== Bulk Update Sector Order Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { sectors } = req.body; // Array of { id, order }
    
    if (!Array.isArray(sectors)) {
      console.error('Error: sectors is not an array. Received:', typeof sectors, sectors);
      return res.status(400).json({ error: 'Sectors must be an array' });
    }
    
    console.log(`Processing ${sectors.length} sector order updates`);
    
    // Validate each sector update
    const validatedUpdates = [];
    for (let i = 0; i < sectors.length; i++) {
      const { id, order } = sectors[i];
      
      if (!id) {
        console.error(`Error at index ${i}: Missing id`, sectors[i]);
        return res.status(400).json({ error: `Sector at index ${i} is missing id` });
      }
      
      if (typeof order !== 'number' || isNaN(order)) {
        console.error(`Error at index ${i}: Invalid order`, sectors[i]);
        return res.status(400).json({ error: `Sector at index ${i} has invalid order value` });
      }
      
      validatedUpdates.push({ id, order });
      console.log(`  - Sector ${id}: order = ${order}`);
    }
    
    // Update sectors using a transaction-like approach to avoid unique constraint conflicts
    // Strategy: Find max order value, use values above max as temporary, then set final values
    const results = [];
    
    // Find the maximum order value in the database to use as offset for temporary values
    const maxOrderResult = await Sector.findOne({}).sort({ order: -1 }).select('order').lean();
    const maxOrder = maxOrderResult?.order || 0;
    const tempOffset = Math.max(maxOrder + 1000, 10000); // Use values well above current max
    
    console.log(`Max order in database: ${maxOrder}, using temp offset: ${tempOffset}`);
    
    // First pass: Set all orders to temporary values (above max) to free up order slots
    console.log('Step 1: Setting temporary orders...');
    for (const { id, order } of validatedUpdates) {
      try {
        const tempOrder = tempOffset + order; // Use values above max as temporary
        await Sector.findByIdAndUpdate(id, { order: tempOrder }, { runValidators: false });
        console.log(`  ✓ Set temporary order for sector ${id}: ${tempOrder}`);
      } catch (err) {
        console.error(`Error setting temporary order for sector ${id}:`, err);
        throw err;
      }
    }
    
    // Second pass: Set final order values
    console.log('Step 2: Setting final orders...');
    for (const { id, order } of validatedUpdates) {
      try {
        const updated = await Sector.findByIdAndUpdate(
          id, 
          { order }, 
          { new: true, runValidators: true }
        );
        
        if (!updated) {
          console.error(`Warning: Sector with id ${id} not found`);
          throw new Error(`Sector with id ${id} not found`);
        }
        
        console.log(`  ✓ Updated sector ${id} to order ${order}`);
        results.push(updated);
      } catch (err) {
        console.error(`Error updating sector ${id} to order ${order}:`, err);
        throw err;
      }
    }
    
    console.log(`Successfully updated ${results.length} sectors`);
    console.log('=== Bulk Update Complete ===');
    
    return res.json({ 
      message: 'Sector orders updated',
      updatedCount: results.length
    });
  } catch (error) {
    console.error('=== Bulk update sector order error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      error: 'Failed to update sector orders',
      details: error.message 
    });
  }
});

// Delete sector (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;
    
    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    
    if (hardDelete === 'true') {
      // Hard delete - also delete associated categories
      await Category.deleteMany({ sector: id });
      await Sector.findByIdAndDelete(id);
      return res.json({ message: 'Sector and associated categories deleted' });
    } else {
      // Soft delete
      sector.isActive = false;
      await sector.save();
      
      // Also deactivate associated categories
      await Category.updateMany({ sector: id }, { isActive: false });
      
      return res.json({ message: 'Sector deactivated', sector });
    }
  } catch (error) {
    console.error('Delete sector error', error);
    return res.status(500).json({ error: 'Failed to delete sector' });
  }
});

export default router;


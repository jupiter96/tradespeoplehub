import express from 'express';
import Category from '../models/Category.js';
import Sector from '../models/Sector.js';
import SubCategory from '../models/SubCategory.js';

const router = express.Router();

// Get all categories (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      sectorId, 
      sectorSlug,
      activeOnly = 'true',
      includeSector = 'false',
      includeSubCategories = 'false',
      search = '',
      sortBy = 'order',
      sortOrder = 'asc',
      page = '1',
      limit = '20'
    } = req.query;
    
    const query = {};
    
    // Filter by sector
    if (sectorId) {
      query.sector = sectorId;
    } else if (sectorSlug) {
      const sector = await Sector.findOne({ slug: sectorSlug });
      if (!sector) {
        return res.status(404).json({ error: 'Sector not found' });
      }
      query.sector = sector._id;
    }
    
    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { question: { $regex: search, $options: 'i' } },
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
    const total = await Category.countDocuments(query);
    
    let categoriesQuery = Category.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    // Include sector information if requested
    if (includeSector === 'true') {
      categoriesQuery = categoriesQuery.populate('sector', 'name slug icon');
    }
    
    const categories = await categoriesQuery.lean();
    
    // Include subcategories if requested
    if (includeSubCategories === 'true') {
      const categoriesWithSubCategories = await Promise.all(
        categories.map(async (category) => {
          const subCategories = await SubCategory.find({
            category: category._id,
            isActive: activeOnly === 'true' ? true : { $exists: true }
          })
            .sort({ order: 1, name: 1 })
            .lean();
          return { ...category, subCategories };
        })
      );
      return res.json({ 
        categories: categoriesWithSubCategories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }
    
    return res.json({ 
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get categories error', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeSector = 'true', includeSubCategories = 'false', activeOnly = 'true' } = req.query;
    
    // Build query
    const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: identifier }
      : { slug: identifier };
    
    // Only return active categories for frontend (unless explicitly requested)
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    let categoryQuery = Category.findOne(query);
    
    if (includeSector === 'true') {
      categoryQuery = categoryQuery.populate('sector', 'name slug icon bannerImage');
    }
    
    const category = await categoryQuery;
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const categoryData = category.toObject();
    
    // Include subcategories if requested
    if (includeSubCategories === 'true') {
      const subCategories = await SubCategory.find({
        category: category._id,
        isActive: activeOnly === 'true' ? true : { $exists: true }
      })
        .sort({ order: 1, name: 1 })
        .lean();
      categoryData.subCategories = subCategories;
    }
    
    return res.json({ category: categoryData });
  } catch (error) {
    console.error('Get category error', error);
    return res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      sector,
      name,
      slug,
      question,
      order,
      description,
      icon,
      bannerImage,
      isActive,
    } = req.body;
    
    if (!sector) {
      return res.status(400).json({ error: 'Sector is required' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Find sector by ID or slug
    let sectorDoc;
    if (sector.match(/^[0-9a-fA-F]{24}$/)) {
      sectorDoc = await Sector.findById(sector);
    } else {
      sectorDoc = await Sector.findOne({ slug: sector });
    }
    
    if (!sectorDoc) {
      return res.status(404).json({ error: 'Sector not found' });
    }
    
    // Check if category with same name already exists in this sector
    const existingCategory = await Category.findOne({ 
      sector: sectorDoc._id, 
      name: name.trim() 
    });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category with this name already exists in this sector' });
    }
    
    // Find next available order - always use max + 1, minimum is 1
    let finalOrder = order;
    if (order === undefined || order === null || order < 1) {
      // If no order provided or invalid, find max order + 1 within this sector
      const maxCategory = await Category.findOne({ sector: sectorDoc._id }).sort({ order: -1 }).select('order').lean();
      if (maxCategory && maxCategory.order) {
        finalOrder = Math.max(maxCategory.order, 0) + 1;
      } else {
        finalOrder = 1; // Minimum order is 1
      }
    } else {
      // If order is provided, check if it's taken
      const existingOrder = await Category.findOne({ 
        sector: sectorDoc._id, 
        order 
      });
      if (existingOrder) {
        // Order is taken, find max + 1
        const maxCategory = await Category.findOne({ sector: sectorDoc._id }).sort({ order: -1 }).select('order').lean();
        if (maxCategory && maxCategory.order) {
          finalOrder = Math.max(maxCategory.order, 0) + 1;
        } else {
          finalOrder = 1; // Minimum order is 1
        }
      }
      // Ensure order is at least 1
      if (finalOrder < 1) {
        finalOrder = 1;
      }
    }
    
    const category = await Category.create({
      sector: sectorDoc._id,
      name: name.trim(),
      order: finalOrder,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    // Populate sector for response
    await category.populate('sector', 'name slug icon');
    
    return res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.['sector,order']) {
        return res.status(409).json({ error: `Category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
      return res.status(409).json({ error: 'Category with this name already exists in this sector' });
    }
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sector,
      name,
      slug,
      question,
      order,
      description,
      icon,
      isActive,
    } = req.body;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Update sector if provided
    if (sector) {
      let sectorDoc;
      if (sector.match(/^[0-9a-fA-F]{24}$/)) {
        sectorDoc = await Sector.findById(sector);
      } else {
        sectorDoc = await Sector.findOne({ slug: sector });
      }
      
      if (!sectorDoc) {
        return res.status(404).json({ error: 'Sector not found' });
      }
      
      category.sector = sectorDoc._id;
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        sector: category.sector, 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingCategory) {
        return res.status(409).json({ error: 'Category with this name already exists in this sector' });
      }
    }
    
    // Check if order is being changed and if it conflicts
    if (order !== undefined && order !== category.order) {
      const existingOrder = await Category.findOne({ 
        sector: category.sector, 
        order,
        _id: { $ne: id }
      });
      if (existingOrder) {
        return res.status(409).json({ error: `Category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
    }
    
    // Update fields
    if (name !== undefined) category.name = name.trim();
    if (slug !== undefined) category.slug = slug;
    if (question !== undefined) category.question = question;
    if (order !== undefined) category.order = order;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (bannerImage !== undefined) category.bannerImage = bannerImage;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    // Populate sector for response
    await category.populate('sector', 'name slug icon');
    
    return res.json({ category });
  } catch (error) {
    console.error('Update category error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.['sector,order']) {
        return res.status(409).json({ error: `Category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
      return res.status(409).json({ error: 'Category with this name already exists in this sector' });
    }
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (hardDelete === 'true') {
      await Category.findByIdAndDelete(id);
      return res.json({ message: 'Category deleted' });
    } else {
      // Soft delete
      category.isActive = false;
      await category.save();
      return res.json({ message: 'Category deactivated', category });
    }
  } catch (error) {
    console.error('Delete category error', error);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Bulk update category order
router.put('/bulk/order', async (req, res) => {
  try {
    console.log('=== Bulk Update Category Order Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { categories } = req.body; // Array of { id, order }
    
    if (!Array.isArray(categories)) {
      console.error('Error: categories is not an array. Received:', typeof categories, categories);
      return res.status(400).json({ error: 'Categories must be an array' });
    }
    
    console.log(`Processing ${categories.length} category order updates`);
    
    // Validate each category update and fetch category info to get sector
    const validatedUpdates = [];
    const categoryInfoMap = new Map();
    
    for (let i = 0; i < categories.length; i++) {
      const { id, order } = categories[i];
      
      if (!id) {
        console.error(`Error at index ${i}: Missing id`, categories[i]);
        return res.status(400).json({ error: `Category at index ${i} is missing id` });
      }
      
      if (typeof order !== 'number' || isNaN(order)) {
        console.error(`Error at index ${i}: Invalid order`, categories[i]);
        return res.status(400).json({ error: `Category at index ${i} has invalid order value` });
      }
      
      // Fetch category to get its sector
      const category = await Category.findById(id).select('sector order').lean();
      if (!category) {
        console.error(`Error at index ${i}: Category not found`, id);
        return res.status(404).json({ error: `Category with id ${id} not found` });
      }
      
      validatedUpdates.push({ id, order, sector: category.sector });
      categoryInfoMap.set(id, { sector: category.sector, oldOrder: category.order });
      console.log(`  - Category ${id} (sector: ${category.sector}): order = ${order}`);
    }
    
    // Group updates by sector to find max order per sector
    const sectorMaxOrders = new Map();
    for (const { sector } of validatedUpdates) {
      if (!sectorMaxOrders.has(sector.toString())) {
        const maxOrderResult = await Category.findOne({ sector }).sort({ order: -1 }).select('order').lean();
        const maxOrder = maxOrderResult?.order || 0;
        sectorMaxOrders.set(sector.toString(), maxOrder);
        console.log(`Max order for sector ${sector}: ${maxOrder}`);
      }
    }
    
    // Find global max order to use as base for temporary values
    const globalMaxOrderResult = await Category.findOne({}).sort({ order: -1 }).select('order').lean();
    const globalMaxOrder = globalMaxOrderResult?.order || 0;
    const tempOffset = Math.max(globalMaxOrder + 1000, 10000); // Use values well above current max
    
    console.log(`Global max order: ${globalMaxOrder}, using temp offset: ${tempOffset}`);
    
    // First pass: Set all orders to temporary values (above max) to free up order slots
    console.log('Step 1: Setting temporary orders...');
    for (const { id, order, sector } of validatedUpdates) {
      try {
        // Use a unique temporary order value for each category
        // Add a multiplier based on order to ensure uniqueness
        const tempOrder = tempOffset + (order * 1000) + parseInt(id.slice(-4), 16) % 1000;
        await Category.findByIdAndUpdate(id, { order: tempOrder }, { runValidators: false });
        console.log(`  ✓ Set temporary order for category ${id}: ${tempOrder}`);
      } catch (err) {
        console.error(`Error setting temporary order for category ${id}:`, err);
        throw err;
      }
    }
    
    // Second pass: Set final order values
    console.log('Step 2: Setting final orders...');
    const results = [];
    for (const { id, order } of validatedUpdates) {
      try {
        const updated = await Category.findByIdAndUpdate(
          id, 
          { order }, 
          { new: true, runValidators: true }
        );
        
        if (!updated) {
          console.error(`Warning: Category with id ${id} not found`);
          throw new Error(`Category with id ${id} not found`);
        }
        
        console.log(`  ✓ Updated category ${id} to order ${order}`);
        results.push(updated);
      } catch (err) {
        console.error(`Error updating category ${id} to order ${order}:`, err);
        throw err;
      }
    }
    
    console.log(`Successfully updated ${results.length} categories`);
    console.log('=== Bulk Update Complete ===');
    
    return res.json({ 
      message: 'Category orders updated',
      updatedCount: results.length
    });
  } catch (error) {
    console.error('=== Bulk update category order error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      error: 'Failed to update category orders',
      details: error.message 
    });
  }
});

export default router;


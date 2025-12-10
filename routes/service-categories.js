import express from 'express';
import ServiceCategory from '../models/ServiceCategory.js';
import Sector from '../models/Sector.js';
import ServiceSubCategory from '../models/ServiceSubCategory.js';

const router = express.Router();

// Get all service categories (with optional filtering)
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
    const total = await ServiceCategory.countDocuments(query);
    
    let serviceCategoriesQuery = ServiceCategory.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    // Include sector information if requested
    if (includeSector === 'true') {
      serviceCategoriesQuery = serviceCategoriesQuery.populate('sector', 'name slug icon');
    }
    
    const serviceCategories = await serviceCategoriesQuery.lean();
    
    // Include subcategories if requested
    if (includeSubCategories === 'true') {
      const serviceCategoriesWithSubCategories = await Promise.all(
        serviceCategories.map(async (serviceCategory) => {
          const subCategories = await ServiceSubCategory.find({
            serviceCategory: serviceCategory._id,
            isActive: activeOnly === 'true' ? true : { $exists: true }
          })
            .sort({ order: 1, name: 1 })
            .lean();
          return { ...serviceCategory, subCategories };
        })
      );
      return res.json({ 
        serviceCategories: serviceCategoriesWithSubCategories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }
    
    return res.json({ 
      serviceCategories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get service categories error', error);
    return res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

// Get single service category by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeSector = 'true', includeSubCategories = 'false', activeOnly = 'true' } = req.query;
    
    // Build query
    const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: identifier }
      : { slug: identifier };
    
    // Only return active service categories for frontend (unless explicitly requested)
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    let serviceCategoryQuery = ServiceCategory.findOne(query);
    
    if (includeSector === 'true') {
      serviceCategoryQuery = serviceCategoryQuery.populate('sector', 'name slug icon bannerImage');
    }
    
    const serviceCategory = await serviceCategoryQuery;
    
    if (!serviceCategory) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    const serviceCategoryData = serviceCategory.toObject();
    
    // Include subcategories if requested
    if (includeSubCategories === 'true') {
      const subCategories = await ServiceSubCategory.find({
        serviceCategory: serviceCategory._id,
        isActive: true
      })
        .sort({ order: 1, name: 1 })
        .lean();
      serviceCategoryData.subCategories = subCategories;
    }
    
    return res.json({ serviceCategory: serviceCategoryData });
  } catch (error) {
    console.error('Get service category error', error);
    return res.status(500).json({ error: 'Failed to fetch service category' });
  }
});

// Create new service category (Admin only)
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
      return res.status(400).json({ error: 'Service category name is required' });
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
    
    // Generate slug if not provided
    const serviceCategorySlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if service category with same name already exists in this sector
    const existingServiceCategory = await ServiceCategory.findOne({ 
      sector: sectorDoc._id, 
      name: name.trim() 
    });
    if (existingServiceCategory) {
      return res.status(409).json({ error: 'Service category with this name already exists in this sector' });
    }
    
    // Find next available order if provided order is taken or not provided
    let finalOrder = order !== undefined ? order : 0;
    if (order !== undefined) {
      const existingOrder = await ServiceCategory.findOne({ 
        sector: sectorDoc._id, 
        order 
      });
      if (existingOrder) {
        // Find next available order within this sector
        const allServiceCategories = await ServiceCategory.find({ sector: sectorDoc._id }).sort({ order: 1 }).select('order').lean();
        const existingOrders = allServiceCategories.map(c => c.order).sort((a, b) => a - b);
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
      const allServiceCategories = await ServiceCategory.find({ sector: sectorDoc._id }).sort({ order: 1 }).select('order').lean();
      const existingOrders = allServiceCategories.map(c => c.order).sort((a, b) => a - b);
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
    
    const serviceCategory = await ServiceCategory.create({
      sector: sectorDoc._id,
      name: name.trim(),
      slug: serviceCategorySlug,
      question,
      order: finalOrder,
      description,
      icon,
      bannerImage,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    // Populate sector for response
    await serviceCategory.populate('sector', 'name slug icon');
    
    return res.status(201).json({ serviceCategory });
  } catch (error) {
    console.error('Create service category error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.['sector,order']) {
        return res.status(409).json({ error: `Service category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
      return res.status(409).json({ error: 'Service category with this name already exists in this sector' });
    }
    return res.status(500).json({ error: 'Failed to create service category' });
  }
});

// Update service category (Admin only)
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
      bannerImage,
      isActive,
    } = req.body;
    
    const serviceCategory = await ServiceCategory.findById(id);
    if (!serviceCategory) {
      return res.status(404).json({ error: 'Service category not found' });
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
      
      serviceCategory.sector = sectorDoc._id;
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== serviceCategory.name) {
      const existingServiceCategory = await ServiceCategory.findOne({ 
        sector: serviceCategory.sector, 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingServiceCategory) {
        return res.status(409).json({ error: 'Service category with this name already exists in this sector' });
      }
    }
    
    // Check if order is being changed and if it conflicts
    if (order !== undefined && order !== serviceCategory.order) {
      const existingOrder = await ServiceCategory.findOne({ 
        sector: serviceCategory.sector, 
        order,
        _id: { $ne: id }
      });
      if (existingOrder) {
        return res.status(409).json({ error: `Service category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
    }
    
    // Update fields
    if (name !== undefined) serviceCategory.name = name.trim();
    if (slug !== undefined) serviceCategory.slug = slug;
    if (question !== undefined) serviceCategory.question = question;
    if (order !== undefined) serviceCategory.order = order;
    if (description !== undefined) serviceCategory.description = description;
    if (icon !== undefined) serviceCategory.icon = icon;
    if (bannerImage !== undefined) serviceCategory.bannerImage = bannerImage;
    if (isActive !== undefined) serviceCategory.isActive = isActive;
    
    await serviceCategory.save();
    
    // Populate sector for response
    await serviceCategory.populate('sector', 'name slug icon');
    
    return res.json({ serviceCategory });
  } catch (error) {
    console.error('Update service category error', error);
    if (error.code === 11000) {
      if (error.keyPattern?.['sector,order']) {
        return res.status(409).json({ error: `Service category with order ${order} already exists in this sector. Order must be unique within a sector.` });
      }
      return res.status(409).json({ error: 'Service category with this name already exists in this sector' });
    }
    return res.status(500).json({ error: 'Failed to update service category' });
  }
});

// Delete service category (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;
    
    const serviceCategory = await ServiceCategory.findById(id);
    if (!serviceCategory) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    if (hardDelete === 'true') {
      await ServiceCategory.findByIdAndDelete(id);
      return res.json({ message: 'Service category deleted' });
    } else {
      // Soft delete
      serviceCategory.isActive = false;
      await serviceCategory.save();
      return res.json({ message: 'Service category deactivated', serviceCategory });
    }
  } catch (error) {
    console.error('Delete service category error', error);
    return res.status(500).json({ error: 'Failed to delete service category' });
  }
});

// Bulk update service category order
router.put('/bulk/order', async (req, res) => {
  try {
    console.log('=== Bulk Update Service Category Order Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { serviceCategories } = req.body; // Array of { id, order }
    
    if (!Array.isArray(serviceCategories)) {
      console.error('Error: serviceCategories is not an array. Received:', typeof serviceCategories, serviceCategories);
      return res.status(400).json({ error: 'Service categories must be an array' });
    }
    
    console.log(`Processing ${serviceCategories.length} service category order updates`);
    
    // Validate each service category update and fetch category info to get sector
    const validatedUpdates = [];
    const categoryInfoMap = new Map();
    
    for (let i = 0; i < serviceCategories.length; i++) {
      const { id, order } = serviceCategories[i];
      
      if (!id) {
        console.error(`Error at index ${i}: Missing id`, serviceCategories[i]);
        return res.status(400).json({ error: `Service category at index ${i} is missing id` });
      }
      
      if (typeof order !== 'number' || isNaN(order)) {
        console.error(`Error at index ${i}: Invalid order`, serviceCategories[i]);
        return res.status(400).json({ error: `Service category at index ${i} has invalid order value` });
      }
      
      // Fetch service category to get its sector
      const serviceCategory = await ServiceCategory.findById(id).select('sector order').lean();
      if (!serviceCategory) {
        console.error(`Error at index ${i}: Service category not found`, id);
        return res.status(404).json({ error: `Service category with id ${id} not found` });
      }
      
      validatedUpdates.push({ id, order, sector: serviceCategory.sector });
      categoryInfoMap.set(id, { sector: serviceCategory.sector, oldOrder: serviceCategory.order });
      console.log(`  - Service category ${id} (sector: ${serviceCategory.sector}): order = ${order}`);
    }
    
    // Group updates by sector to find max order per sector
    const sectorMaxOrders = new Map();
    for (const { sector } of validatedUpdates) {
      if (!sectorMaxOrders.has(sector.toString())) {
        const maxOrderResult = await ServiceCategory.findOne({ sector }).sort({ order: -1 }).select('order').lean();
        const maxOrder = maxOrderResult?.order || 0;
        sectorMaxOrders.set(sector.toString(), maxOrder);
        console.log(`Max order for sector ${sector}: ${maxOrder}`);
      }
    }
    
    // Find global max order to use as base for temporary values
    const globalMaxOrderResult = await ServiceCategory.findOne({}).sort({ order: -1 }).select('order').lean();
    const globalMaxOrder = globalMaxOrderResult?.order || 0;
    const tempOffset = Math.max(globalMaxOrder + 1000, 10000); // Use values well above current max
    
    console.log(`Global max order: ${globalMaxOrder}, using temp offset: ${tempOffset}`);
    
    // First pass: Set all orders to temporary values (above max) to free up order slots
    console.log('Step 1: Setting temporary orders...');
    for (const { id, order, sector } of validatedUpdates) {
      try {
        // Use a unique temporary order value for each service category
        // Add a multiplier based on order to ensure uniqueness
        const tempOrder = tempOffset + (order * 1000) + parseInt(id.slice(-4), 16) % 1000;
        await ServiceCategory.findByIdAndUpdate(id, { order: tempOrder }, { runValidators: false });
        console.log(`  ✓ Set temporary order for service category ${id}: ${tempOrder}`);
      } catch (err) {
        console.error(`Error setting temporary order for service category ${id}:`, err);
        throw err;
      }
    }
    
    // Second pass: Set final order values
    console.log('Step 2: Setting final orders...');
    const results = [];
    for (const { id, order } of validatedUpdates) {
      try {
        const updated = await ServiceCategory.findByIdAndUpdate(
          id, 
          { order }, 
          { new: true, runValidators: true }
        );
        
        if (!updated) {
          console.error(`Warning: Service category with id ${id} not found`);
          throw new Error(`Service category with id ${id} not found`);
        }
        
        console.log(`  ✓ Updated service category ${id} to order ${order}`);
        results.push(updated);
      } catch (err) {
        console.error(`Error updating service category ${id} to order ${order}:`, err);
        throw err;
      }
    }
    
    console.log(`Successfully updated ${results.length} service categories`);
    console.log('=== Bulk Update Complete ===');
    
    return res.json({ 
      message: 'Service category orders updated',
      updatedCount: results.length
    });
  } catch (error) {
    console.error('=== Bulk update service category order error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      error: 'Failed to update service category orders',
      details: error.message 
    });
  }
});

export default router;


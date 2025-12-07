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
            .sort({ order: 1, name: 1 })
            .lean();
          
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
    const { includeCategories = 'false', includeSubCategories = 'false' } = req.query;
    
    // Try to find by ID first, then by slug
    let sector;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      sector = await Sector.findById(identifier);
    } else {
      sector = await Sector.findOne({ slug: identifier });
    }
    
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
    
    // Check if order already exists
    if (order !== undefined) {
      const existingOrder = await Sector.findOne({ order });
      if (existingOrder) {
        return res.status(409).json({ error: `Sector with order ${order} already exists. Order must be unique.` });
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
      displayName,
      subtitle,
      order: order !== undefined ? order : 0,
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
      displayName,
      subtitle,
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
    if (displayName !== undefined) sector.displayName = displayName;
    if (subtitle !== undefined) sector.subtitle = subtitle;
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


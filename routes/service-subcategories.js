import express from 'express';
import ServiceSubCategory from '../models/ServiceSubCategory.js';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Get all service subcategories (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      serviceCategoryId, 
      serviceCategorySlug,
      parentSubCategoryId,
      attributeType,
      activeOnly = 'true',
      includeServiceCategory = 'false',
      page,
      limit,
      sortBy = 'order',
      sortOrder = 'asc',
      search
    } = req.query;
    
    const query = {};
    
    // Filter by parent subcategory (for nested subcategories)
    if (parentSubCategoryId) {
      query.parentSubCategory = parentSubCategoryId;
      query.serviceCategory = null; // When parentSubCategory is set, serviceCategory should be null
    } else {
      // Filter by service category (for top-level subcategories)
      if (serviceCategoryId) {
        query.serviceCategory = serviceCategoryId;
        query.parentSubCategory = null; // Top-level subcategories have no parent
        // Filter by attributeType for level 1 subcategories
        if (attributeType) {
          query.attributeType = attributeType;
          query.level = 1; // Only level 1 subcategories have attributeType
        }
      } else if (serviceCategorySlug) {
        const serviceCategory = await ServiceCategory.findOne({ slug: serviceCategorySlug });
        if (!serviceCategory) {
          return res.status(404).json({ error: 'Service category not found' });
        }
        query.serviceCategory = serviceCategory._id;
        query.parentSubCategory = null;
        // Filter by attributeType for level 1 subcategories
        if (attributeType) {
          query.attributeType = attributeType;
          query.level = 1; // Only level 1 subcategories have attributeType
        }
      }
    }
    
    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Sorting
    const sortOptions = {};
    if (sortBy === 'order') {
      sortOptions.order = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    // Always add order as secondary sort
    if (sortBy !== 'order') {
      sortOptions.order = 1;
    }
    
    let serviceSubCategoriesQuery = ServiceSubCategory.find(query);
    
    // Include service category information if requested
    if (includeServiceCategory === 'true') {
      serviceSubCategoriesQuery = serviceSubCategoriesQuery.populate('serviceCategory', 'name slug');
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const total = await ServiceSubCategory.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    const serviceSubCategories = await serviceSubCategoriesQuery
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    return res.json({ 
      serviceSubCategories,
      total,
      totalPages,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Get service subcategories error', error);
    return res.status(500).json({ error: 'Failed to fetch service subcategories' });
  }
});

// Get single service subcategory by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeServiceCategory = 'true', activeOnly = 'true' } = req.query;
    
    // Build query
    const query = identifier.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: identifier }
      : { slug: identifier };
    
    // Only return active service subcategories for frontend (unless explicitly requested)
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    let serviceSubCategoryQuery = ServiceSubCategory.findOne(query);
    
    if (includeServiceCategory === 'true') {
      serviceSubCategoryQuery = serviceSubCategoryQuery.populate('serviceCategory', 'name slug');
    }
    
    const serviceSubCategory = await serviceSubCategoryQuery;
    
    if (!serviceSubCategory) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }
    
    return res.json({ serviceSubCategory });
  } catch (error) {
    console.error('Get service subcategory error', error);
    return res.status(500).json({ error: 'Failed to fetch service subcategory' });
  }
});

// Create new service subcategory (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      serviceCategory,
      name,
      slug,
      order,
      description,
      metaTitle,
      metaDescription,
      bannerImage,
      icon,
      isActive,
    } = req.body;
    
    if (!serviceCategory) {
      return res.status(400).json({ error: 'Service category is required' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Service subcategory name is required' });
    }
    
    // Find service category by ID or slug
    let serviceCategoryDoc;
    if (serviceCategory.match(/^[0-9a-fA-F]{24}$/)) {
      serviceCategoryDoc = await ServiceCategory.findById(serviceCategory);
    } else {
      serviceCategoryDoc = await ServiceCategory.findOne({ slug: serviceCategory });
    }
    
    if (!serviceCategoryDoc) {
      return res.status(404).json({ error: 'Service category not found' });
    }
    
    // Find parent subcategory if provided
    let parentSubCategoryDoc = null;
    let calculatedLevel = 1;
    if (parentSubCategory) {
      if (parentSubCategory.match(/^[0-9a-fA-F]{24}$/)) {
        parentSubCategoryDoc = await ServiceSubCategory.findById(parentSubCategory);
      } else {
        parentSubCategoryDoc = await ServiceSubCategory.findOne({ slug: parentSubCategory });
      }
      if (!parentSubCategoryDoc) {
        return res.status(404).json({ error: 'Parent subcategory not found' });
      }
      calculatedLevel = (parentSubCategoryDoc.level || 1) + 1;
      if (calculatedLevel > 7) {
        return res.status(400).json({ error: 'Maximum nesting level (7) reached' });
      }
    } else {
      // For level 1 subcategories, use provided level or default to 1
      calculatedLevel = level !== undefined ? level : 1;
    }
    
    // Generate slug if not provided
    const serviceSubCategorySlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if service subcategory with same name already exists
    const nameQuery = parentSubCategoryDoc 
      ? { parentSubCategory: parentSubCategoryDoc._id, name: name.trim() }
      : { serviceCategory: serviceCategoryDoc._id, parentSubCategory: null, name: name.trim() };
    
    const existingServiceSubCategory = await ServiceSubCategory.findOne(nameQuery);
    if (existingServiceSubCategory) {
      return res.status(409).json({ error: 'Service subcategory with this name already exists' });
    }
    
    const serviceSubCategory = await ServiceSubCategory.create({
      serviceCategory: serviceCategoryDoc._id,
      parentSubCategory: parentSubCategoryDoc ? parentSubCategoryDoc._id : null,
      name: name.trim(),
      slug: serviceSubCategorySlug,
      order: order !== undefined ? order : 0,
      description,
      metaTitle,
      metaDescription,
      bannerImage,
      icon,
      isActive: isActive !== undefined ? isActive : true,
      level: calculatedLevel,
      attributeType: calculatedLevel === 1 && attributeType ? attributeType : null,
    });
    
    // Populate service category for response
    await serviceSubCategory.populate('serviceCategory', 'name slug');
    
    return res.status(201).json({ serviceSubCategory });
  } catch (error) {
    console.error('Create service subcategory error', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Service subcategory with this name already exists in this service category' });
    }
    return res.status(500).json({ error: 'Failed to create service subcategory' });
  }
});

// Update service subcategory (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      serviceCategory,
      name,
      slug,
      order,
      description,
      metaTitle,
      metaDescription,
      bannerImage,
      icon,
      isActive,
    } = req.body;
    
    const serviceSubCategory = await ServiceSubCategory.findById(id);
    if (!serviceSubCategory) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }
    
    // Update service category if provided
    if (serviceCategory) {
      let serviceCategoryDoc;
      if (serviceCategory.match(/^[0-9a-fA-F]{24}$/)) {
        serviceCategoryDoc = await ServiceCategory.findById(serviceCategory);
      } else {
        serviceCategoryDoc = await ServiceCategory.findOne({ slug: serviceCategory });
      }
      
      if (!serviceCategoryDoc) {
        return res.status(404).json({ error: 'Service category not found' });
      }
      
      serviceSubCategory.serviceCategory = serviceCategoryDoc._id;
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== serviceSubCategory.name) {
      const existingServiceSubCategory = await ServiceSubCategory.findOne({ 
        serviceCategory: serviceSubCategory.serviceCategory, 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingServiceSubCategory) {
        return res.status(409).json({ error: 'Service subcategory with this name already exists in this service category' });
      }
    }
    
    // Update fields
    if (name !== undefined) serviceSubCategory.name = name.trim();
    if (slug !== undefined) serviceSubCategory.slug = slug;
    if (order !== undefined) serviceSubCategory.order = order;
    if (description !== undefined) serviceSubCategory.description = description;
    if (metaTitle !== undefined) serviceSubCategory.metaTitle = metaTitle;
    if (metaDescription !== undefined) serviceSubCategory.metaDescription = metaDescription;
    if (bannerImage !== undefined) serviceSubCategory.bannerImage = bannerImage;
    if (icon !== undefined) serviceSubCategory.icon = icon;
    if (isActive !== undefined) serviceSubCategory.isActive = isActive;
    
    await serviceSubCategory.save();
    
    // Populate service category for response
    await serviceSubCategory.populate('serviceCategory', 'name slug');
    
    return res.json({ serviceSubCategory });
  } catch (error) {
    console.error('Update service subcategory error', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Service subcategory with this name already exists in this service category' });
    }
    return res.status(500).json({ error: 'Failed to update service subcategory' });
  }
});

// Delete service subcategory (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;
    
    const serviceSubCategory = await ServiceSubCategory.findById(id);
    if (!serviceSubCategory) {
      return res.status(404).json({ error: 'Service subcategory not found' });
    }
    
    if (hardDelete === 'true') {
      await ServiceSubCategory.findByIdAndDelete(id);
      return res.json({ message: 'Service subcategory deleted' });
    } else {
      // Soft delete
      serviceSubCategory.isActive = false;
      await serviceSubCategory.save();
      return res.json({ message: 'Service subcategory deactivated', serviceSubCategory });
    }
  } catch (error) {
    console.error('Delete service subcategory error', error);
    return res.status(500).json({ error: 'Failed to delete service subcategory' });
  }
});

// Bulk update service subcategory order
router.put('/bulk/order', async (req, res) => {
  try {
    const { serviceSubCategories } = req.body; // Array of { id, order }
    
    if (!Array.isArray(serviceSubCategories)) {
      return res.status(400).json({ error: 'Service subcategories must be an array' });
    }
    
    const updatePromises = serviceSubCategories.map(({ id, order }) =>
      ServiceSubCategory.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    return res.json({ message: 'Service subcategory orders updated' });
  } catch (error) {
    console.error('Bulk update service subcategory order error', error);
    return res.status(500).json({ error: 'Failed to update service subcategory orders' });
  }
});

export default router;


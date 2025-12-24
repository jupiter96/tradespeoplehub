import express from 'express';
import mongoose from 'mongoose';
import ServiceSubCategory from '../models/ServiceSubCategory.js';
import ServiceCategory from '../models/ServiceCategory.js';

const router = express.Router();

// Small in-memory cache to reduce repeat DB work for hot public endpoints.
// Keyed by req.originalUrl. Safe only for GET + activeOnly=true + no search.
const _cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const getCached = (key) => {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return hit.value;
};
const setCached = (key, value) => {
  _cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

// Get all service subcategories (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      serviceCategoryId, 
      serviceCategorySlug,
      parentSubCategoryId,
      attributeType,
      level,
      activeOnly = 'true',
      includeServiceCategory = 'false',
      page,
      limit,
      sortBy = 'order',
      sortOrder = 'asc',
      search
    } = req.query;

    const shouldCache =
      req.method === 'GET' &&
      activeOnly === 'true' &&
      !search;
    const cacheKey = shouldCache ? req.originalUrl : null;
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=300');
        return res.json(cached);
      }
    }
    
    const query = {};
    
    // New hierarchical structure: Filter by level and categoryLevel for tab-specific filtering
    // Level 2: parentSubCategory=null, serviceCategory=serviceCategoryId
    // Level 3+: parentSubCategory exists, but we filter by level/categoryLevel/attributeType
    
    // If parentSubCategoryId is explicitly provided, filter by it (for nested navigation)
    if (parentSubCategoryId) {
      query.parentSubCategory = parentSubCategoryId;
      query.serviceCategory = null; // When parentSubCategory is set, serviceCategory should be null
      
      // If level is provided, filter by it (for correct level display)
      if (level) {
        query.level = parseInt(level);
      }
      // If categoryLevel is provided, filter by it
      if (req.query.categoryLevel) {
        query.categoryLevel = parseInt(req.query.categoryLevel);
      }
      // If attributeType is provided, filter by it
      if (attributeType !== undefined) {
        if (attributeType === '' || attributeType === null) {
          query.attributeType = null;
        } else {
          query.attributeType = attributeType;
        }
      }
    } else if (serviceCategoryId) {
      // Filter primarily by attributeType for tab-specific filtering
      // attributeType is the primary filter, level/categoryLevel are secondary
      
      // If attributeType is provided (including empty string for Level 2), use it as primary filter
      if (attributeType !== undefined) {
        if (attributeType === '' || attributeType === null) {
          // Level 2 tab (Sub Category): attributeType is null
          query.serviceCategory = serviceCategoryId;
          query.parentSubCategory = null;
          query.attributeType = null;
          query.level = 2;
          if (req.query.categoryLevel) {
            query.categoryLevel = parseInt(req.query.categoryLevel);
          }
        } else {
          // Level 3+ tabs: filter by attributeType as primary
          query.attributeType = attributeType;
          // Don't set serviceCategory = null here yet, we'll handle it in parentSubCategory filtering
          // This allows us to include subcategories with parentSubCategory=null if needed
          
          // Add level and categoryLevel as secondary filters if provided
          if (level) {
            query.level = parseInt(level);
          }
          if (req.query.categoryLevel) {
            query.categoryLevel = parseInt(req.query.categoryLevel);
          }
        }
      } else if (level && req.query.categoryLevel) {
        // Fallback: if attributeType is not provided, use level/categoryLevel (backward compatibility)
        const targetLevel = parseInt(level);
        const targetCategoryLevel = parseInt(req.query.categoryLevel);
        
        query.level = targetLevel;
        query.categoryLevel = targetCategoryLevel;
        
        // Level 2: parentSubCategory must be null
        if (targetLevel === 2) {
          query.parentSubCategory = null;
          query.serviceCategory = serviceCategoryId;
          query.attributeType = null;
        } else {
          // Level 3+: parentSubCategory exists, serviceCategory is null in the model
          query.serviceCategory = null;
          if (attributeType) {
            query.attributeType = attributeType;
          }
        }
    } else {
        // Fallback: filter by service category only (for backward compatibility)
        query.serviceCategory = serviceCategoryId;
        query.parentSubCategory = null;
        // Filter by level if specified
        if (level) {
          query.level = parseInt(level);
          if (parseInt(level) === 2) {
            query.attributeType = null;
          }
        }
        // Filter by categoryLevel if specified
        if (req.query.categoryLevel) {
          query.categoryLevel = parseInt(req.query.categoryLevel);
        }
        // Filter by attributeType for level 3+ subcategories
        if (attributeType) {
          query.attributeType = attributeType;
        }
        }
      } else if (serviceCategorySlug) {
        const serviceCategory = await ServiceCategory.findOne({ slug: serviceCategorySlug });
        if (!serviceCategory) {
          return res.status(404).json({ error: 'Service category not found' });
        }
        query.serviceCategory = serviceCategory._id;
        query.parentSubCategory = null;
        // Filter by level if specified (e.g., level 2 for Sub Category tab)
        if (level) {
          query.level = parseInt(level);
          // Level 2 subcategories don't have attributeType
          if (parseInt(level) === 2) {
            query.attributeType = null;
          }
        }
        // Filter by categoryLevel if specified (for tab-specific filtering)
        if (req.query.categoryLevel) {
          query.categoryLevel = parseInt(req.query.categoryLevel);
        }
        // Filter by attributeType for level 3+ subcategories (Service Type, Size, etc. tabs)
        if (attributeType) {
          query.attributeType = attributeType;
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
    
    // For Level 3+ subcategories, filter by parentSubCategory's serviceCategory
    // Since Level 3+ subcategories have parentSubCategory and serviceCategory=null
    // Filter primarily by attributeType, but maintain parent-child relationship
    // Also include subcategories with parentSubCategory=null (if not selected during creation)
    if (attributeType && attributeType !== '' && attributeType !== null && serviceCategoryId && !parentSubCategoryId) {
      // Get the serviceCategory to access categoryLevelMapping
      const serviceCategoryDoc = await ServiceCategory.findById(serviceCategoryId).select('categoryLevelMapping').lean();
      
      // Find the current level from categoryLevelMapping based on attributeType
      let currentLevel = null;
      if (serviceCategoryDoc?.categoryLevelMapping) {
        const currentMapping = serviceCategoryDoc.categoryLevelMapping.find(m => m.attributeType === attributeType);
        if (currentMapping) {
          currentLevel = currentMapping.level;
        }
      }
      
      // If we couldn't find the level from mapping, try to infer from level parameter
      if (!currentLevel && level) {
        currentLevel = parseInt(level);
      }
      
      // Only filter by parentSubCategory if we're dealing with Level 3+ (attributeType is not null)
      if (currentLevel && currentLevel > 2) {
        const parentLevel = currentLevel - 1;
        
        // Start with Level 2 subcategories (direct children of serviceCategory)
        const level2SubCategories = await ServiceSubCategory.find({
          serviceCategory: serviceCategoryId,
          level: 2,
          parentSubCategory: null,
          attributeType: null
        }).select('_id').lean();
        
        if (level2SubCategories.length === 0) {
          // No Level 2 subcategories, but we still want to show Level 3+ subcategories
          // that might have parentSubCategory=null (if not selected during creation)
          // These would have serviceCategory set instead
          query.$or = [
            { parentSubCategory: null, serviceCategory: serviceCategoryId },
            { parentSubCategory: { $in: [] } } // This will never match, but keeps query structure
          ];
        } else {
          // Recursively get subcategories at parentLevel
          // Start from Level 2 and traverse up to parentLevel
          let currentParentIds = level2SubCategories.map(sc => sc._id);
          
          // If parentLevel is 2, we already have the IDs
          // Otherwise, traverse from level 3 to parentLevel
          // For each level, filter by the correct attributeType from categoryLevelMapping
          for (let l = 3; l <= parentLevel; l++) {
            // Find the attributeType for this level from categoryLevelMapping
            let levelAttributeType = null;
            if (serviceCategoryDoc?.categoryLevelMapping) {
              const levelMapping = serviceCategoryDoc.categoryLevelMapping.find(m => m.level === l);
              if (levelMapping) {
                levelAttributeType = levelMapping.attributeType;
              }
            }
            
            const levelQuery = {
              parentSubCategory: { $in: currentParentIds },
              level: l
            };
            
            // Add attributeType filter if we know it
            if (levelAttributeType) {
              levelQuery.attributeType = levelAttributeType;
            }
            
            const nextLevelSubCategories = await ServiceSubCategory.find(levelQuery).select('_id').lean();
            
            if (nextLevelSubCategories.length === 0) {
              // No subcategories at this level, but we still want to show subcategories
              // that might have parentSubCategory=null
              currentParentIds = [];
              break;
            }
            
            currentParentIds = nextLevelSubCategories.map(sc => sc._id);
          }
          
          // Include subcategories that:
          // 1. Have parentSubCategory in currentParentIds (normal case with parent selected)
          // 2. Have parentSubCategory=null and serviceCategory=serviceCategoryId (if parent not selected during creation)
          if (currentParentIds.length > 0) {
            query.$or = [
              { parentSubCategory: { $in: currentParentIds } },
              { parentSubCategory: null, serviceCategory: serviceCategoryId }
            ];
            // Remove serviceCategory from main query since we're using it in $or
            delete query.serviceCategory;
          } else {
            // If no valid parents found, allow null parentSubCategory with serviceCategory match
            query.parentSubCategory = null;
            query.serviceCategory = serviceCategoryId;
          }
        }
      }
    } else if (level && req.query.categoryLevel && parseInt(level) > 2 && serviceCategoryId && !parentSubCategoryId) {
      // Fallback: if attributeType is not provided, use level-based filtering (backward compatibility)
      const currentLevel = parseInt(level);
      const parentLevel = currentLevel - 1;
      
      // Get the serviceCategory to access categoryLevelMapping
      const serviceCategoryDoc = await ServiceCategory.findById(serviceCategoryId).select('categoryLevelMapping').lean();
      
      // Start with Level 2 subcategories (direct children of serviceCategory)
      const level2SubCategories = await ServiceSubCategory.find({
        serviceCategory: serviceCategoryId,
        level: 2,
        parentSubCategory: null
      }).select('_id').lean();
      
      if (level2SubCategories.length === 0) {
        // No Level 2 subcategories, so no higher levels can exist
        query.parentSubCategory = { $in: [] };
      } else {
        // Recursively get subcategories at parentLevel
        let currentParentIds = level2SubCategories.map(sc => sc._id);
        
        for (let l = 3; l <= parentLevel; l++) {
          // Find the attributeType for this level from categoryLevelMapping
          let levelAttributeType = null;
          if (serviceCategoryDoc?.categoryLevelMapping) {
            const levelMapping = serviceCategoryDoc.categoryLevelMapping.find(m => m.level === l);
            if (levelMapping) {
              levelAttributeType = levelMapping.attributeType;
            }
          }
          
          const levelQuery = {
            parentSubCategory: { $in: currentParentIds },
            level: l
          };
          
          // Add attributeType filter if we know it
          if (levelAttributeType) {
            levelQuery.attributeType = levelAttributeType;
          }
          
          const nextLevelSubCategories = await ServiceSubCategory.find(levelQuery).select('_id').lean();
          
          if (nextLevelSubCategories.length === 0) {
            query.parentSubCategory = { $in: [] };
            currentParentIds = [];
            break;
          }
          
          currentParentIds = nextLevelSubCategories.map(sc => sc._id);
        }
        
        if (currentParentIds.length > 0) {
          query.parentSubCategory = { $in: currentParentIds };
        } else {
          query.parentSubCategory = { $in: [] };
        }
      }
    }
    
    // Sorting
    const sortOptions = {};
    if (sortBy === 'order') {
      sortOptions.order = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'categoryLevel') {
      sortOptions.categoryLevel = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    // Always add categoryLevel as secondary sort (if not primary), then order
    if (sortBy !== 'categoryLevel') {
      sortOptions.categoryLevel = 1;
    }
    if (sortBy !== 'order') {
      sortOptions.order = 1;
    }
    
    let serviceSubCategoriesQuery = ServiceSubCategory.find(query);
    
    // Always populate parentSubCategory to show parent information in the table
    serviceSubCategoriesQuery = serviceSubCategoriesQuery.populate('parentSubCategory', 'name slug');
    
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
    
    const payload = { 
      serviceSubCategories,
      total,
      totalPages,
      page: pageNum,
      limit: limitNum
    };

    if (cacheKey) {
      setCached(cacheKey, payload);
      res.set('Cache-Control', 'public, max-age=300');
    }
    return res.json(payload);
  } catch (error) {
    // console.error('Get service subcategories error', error);
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
    // console.error('Get service subcategory error', error);
    return res.status(500).json({ error: 'Failed to fetch service subcategory' });
  }
});

// Create new service subcategory (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      serviceCategory,
      parentSubCategory,
      name,
      slug,
      order,
      description,
      metaTitle,
      metaDescription,
      bannerImage,
      icon,
      isActive,
      level,
      attributeType,
      categoryLevel,
      serviceTitleSuggestions,
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
      // In new hierarchy: level should be parent level + 1
      // But we use the provided level from request to match categoryLevelMapping
      const expectedLevel = (parentSubCategoryDoc.level || 1) + 1;
      calculatedLevel = level !== undefined ? parseInt(level) : expectedLevel;
      
      // Validate that provided level matches expected level
      if (calculatedLevel !== expectedLevel) {
        return res.status(400).json({ error: `Level mismatch: expected ${expectedLevel} based on parent, but got ${calculatedLevel}` });
      }
      
      if (calculatedLevel > 7) {
        return res.status(400).json({ error: 'Maximum nesting level (7) reached' });
      }
    } else {
      // For top-level subcategories (Level 2 - Sub Category tab), use provided level
      calculatedLevel = level !== undefined ? parseInt(level) : 2; // Default to 2 for Sub Category tab
      if (calculatedLevel < 2 || calculatedLevel > 7) {
        return res.status(400).json({ error: 'Level must be between 2 and 7' });
      }
      
      // Level 3-7 must have a parentSubCategory
      if (calculatedLevel >= 3 && calculatedLevel <= 7) {
        return res.status(400).json({ error: `Level ${calculatedLevel} subcategories must have a parentSubCategory` });
      }
    }
    
    // Additional validation: Level 3-7 must have parentSubCategory
    if (calculatedLevel >= 3 && calculatedLevel <= 7 && !parentSubCategoryDoc) {
      return res.status(400).json({ error: `Level ${calculatedLevel} subcategories require a parentSubCategory` });
    }
    
    // Generate slug automatically from name (ignore provided slug)
    let serviceSubCategorySlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if service subcategory with same name already exists
    // For Level 2: check within serviceCategory
    // For Level 3+: check within parentSubCategory AND same categoryLevel/attributeType
    let nameQuery;
    if (parentSubCategoryDoc) {
      // Level 3+: same parentSubCategory, same categoryLevel, same attributeType
      nameQuery = {
        parentSubCategory: parentSubCategoryDoc._id,
        name: name.trim(),
        level: calculatedLevel
      };
      // Add categoryLevel if provided
      if (categoryLevel !== undefined) {
        nameQuery.categoryLevel = parseInt(categoryLevel);
      }
      // Add attributeType if provided (for Level 3+)
      if (attributeType) {
        nameQuery.attributeType = attributeType;
      }
    } else {
      // Level 2: same serviceCategory, parentSubCategory=null, level=2
      nameQuery = {
        serviceCategory: serviceCategoryDoc._id,
        parentSubCategory: null,
        name: name.trim(),
        level: calculatedLevel
      };
      // Level 2 subcategories don't have attributeType
      nameQuery.attributeType = null;
      // Add categoryLevel if provided
      if (categoryLevel !== undefined) {
        nameQuery.categoryLevel = parseInt(categoryLevel);
      }
    }
    
    const existingServiceSubCategory = await ServiceSubCategory.findOne(nameQuery);
    if (existingServiceSubCategory) {
      return res.status(409).json({ 
        error: 'Service subcategory with this name already exists in this context. Please use a different name.' 
      });
    }
    
    // Check if slug already exists globally, if so, append number
    let finalSlug = serviceSubCategorySlug;
    let counter = 1;
    while (await ServiceSubCategory.findOne({ slug: finalSlug })) {
      finalSlug = `${serviceSubCategorySlug}-${counter}`;
      counter++;
    }
    serviceSubCategorySlug = finalSlug;
    
    // Determine attributeType and categoryLevel based on calculated level
    let finalAttributeType = null;
    let finalCategoryLevel = calculatedLevel;
    
    if (calculatedLevel === 2) {
      // Level 2: no attributeType
      finalAttributeType = null;
    } else if (calculatedLevel > 2) {
      // Level 3+: use provided attributeType or find from categoryLevelMapping
      if (attributeType) {
        finalAttributeType = attributeType;
      } else {
        // Try to find attributeType from categoryLevelMapping
        const mapping = serviceCategoryDoc.categoryLevelMapping?.find(
          m => m.level === calculatedLevel
        );
        if (mapping) {
          finalAttributeType = mapping.attributeType;
        }
      }
    }
    
    // Use provided categoryLevel or default to calculatedLevel
    if (categoryLevel !== undefined) {
      finalCategoryLevel = parseInt(categoryLevel);
    }
    
    const serviceSubCategory = await ServiceSubCategory.create({
      serviceCategory: parentSubCategoryDoc ? null : serviceCategoryDoc._id, // null if has parent
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
      attributeType: finalAttributeType,
      categoryLevel: finalCategoryLevel,
      serviceTitleSuggestions: serviceTitleSuggestions || [],
    });
    
    // Populate service category for response
    await serviceSubCategory.populate('serviceCategory', 'name slug');
    
    return res.status(201).json({ serviceSubCategory });
  } catch (error) {
    // console.error('Create service subcategory error', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Service subcategory with this name already exists in this service category' });
    }
    return res.status(500).json({ error: 'Failed to create service subcategory' });
  }
});

// Bulk update service subcategory order (Admin only) - MUST be before /:id route
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
    // console.error('Bulk update service subcategory order error', error);
    return res.status(500).json({ error: 'Failed to update service subcategory orders' });
  }
});

// Bulk update service attributes (Admin only) - MUST be before /:id route
router.put('/bulk-update-attributes', async (req, res) => {
  console.log('=== BULK UPDATE ATTRIBUTES REQUEST ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      console.error('Invalid updates format - updates is not an array:', typeof updates, updates);
      return res.status(400).json({ error: 'Invalid updates format' });
    }

    console.log(`Processing ${updates.length} update(s)`);

    // Validate all subCategoryIds before processing
    const invalidIds = updates.filter(({ subCategoryId }) => 
      !subCategoryId || !mongoose.Types.ObjectId.isValid(subCategoryId)
    );
    
    if (invalidIds.length > 0) {
      console.error('Invalid subCategoryIds found:', invalidIds.map(u => u.subCategoryId));
      return res.status(400).json({ 
        error: 'Invalid subCategoryId(s) provided',
        invalidIds: invalidIds.map(u => u.subCategoryId)
      });
    }

    console.log('All subCategoryIds are valid. Starting updates...');

    const updatePromises = updates.map(async ({ subCategoryId, serviceAttributes }) => {
      try {
        console.log(`Updating subcategory ${subCategoryId} with ${serviceAttributes?.length || 0} attributes`);
        console.log(`Attributes to save:`, serviceAttributes);
        
        const result = await ServiceSubCategory.findByIdAndUpdate(
          subCategoryId,
          { serviceAttributes },
          { new: true, runValidators: true }
        );
        if (!result) {
          throw new Error(`Service subcategory with id ${subCategoryId} not found`);
        }
        console.log(`Successfully updated subcategory ${subCategoryId}`);
        console.log(`Updated attributes:`, result.serviceAttributes);
        return result;
      } catch (error) {
        console.error(`Error updating subcategory ${subCategoryId}:`, error);
        console.error(`Error details for ${subCategoryId}:`, {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name,
          errors: error.errors
        });
        
        // Log validation errors in detail
        if (error.name === 'ValidationError' && error.errors) {
          console.error(`Validation errors for ${subCategoryId}:`);
          Object.keys(error.errors).forEach(key => {
            console.error(`  - ${key}: ${error.errors[key].message}`);
          });
        }
        
        throw error;
      }
    });

    const results = await Promise.all(updatePromises);
    console.log(`Successfully completed ${results.length} update(s)`);
    console.log('=== BULK UPDATE ATTRIBUTES SUCCESS ===');

    return res.json({
      message: 'Service attributes updated successfully',
      updatedCount: results.length
    });
  } catch (error) {
    console.error('=== BULK UPDATE ATTRIBUTES ERROR ===');
    console.error('Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      errors: error.errors
    });
    
    // Log validation errors in detail
    if (error.name === 'ValidationError' && error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    console.error('=== END ERROR ===');
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to update service attributes',
      details: error.message,
      errorCode: error.code,
      errorName: error.name
    });
  }
});

// Update service subcategory (Admin only)
// NOTE: This route MUST come after all specific routes like /bulk-update-attributes
router.put('/:id', async (req, res) => {
  console.log('=== UPDATE SERVICE SUBCATEGORY REQUEST ===');
  console.log('Request received at:', new Date().toISOString());
  console.log('Route ID:', req.params.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { id } = req.params;
    
    // Explicitly reject known route names that should not match this pattern
    const reservedRoutes = ['bulk-update-attributes', 'bulk', 'bulk/order'];
    if (reservedRoutes.includes(id)) {
      console.error(`ERROR: Route /${id} was incorrectly matched to /:id handler. This should not happen!`);
      return res.status(404).json({ 
        error: 'Route not found',
        message: `The route /${id} should be handled by a specific route handler, not /:id`
      });
    }
    
    // Validate that id is a valid ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid service subcategory ID:', id);
      return res.status(400).json({ 
        error: 'Invalid service subcategory ID',
        receivedId: id
      });
    }
    
    console.log(`Valid ObjectId: ${id}`);
    
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
      categoryLevel,
      titles,
      serviceTitleSuggestions,
    } = req.body;
    
    console.log('Fields to update:', {
      hasServiceCategory: !!serviceCategory,
      hasName: name !== undefined,
      hasServiceTitleSuggestions: serviceTitleSuggestions !== undefined,
      hasTitles: titles !== undefined,
      serviceTitleSuggestionsCount: Array.isArray(serviceTitleSuggestions) ? serviceTitleSuggestions.length : 0,
      titlesCount: Array.isArray(titles) ? titles.length : 0
    });
    
    const serviceSubCategory = await ServiceSubCategory.findById(id);
    if (!serviceSubCategory) {
      console.error(`Service subcategory not found for ID: ${id}`);
      return res.status(404).json({ error: 'Service subcategory not found' });
    }
    
    console.log(`Found service subcategory: ${serviceSubCategory.name || serviceSubCategory._id}`);
    
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
    
    // Auto-generate slug from name if name is changed (ignore provided slug)
    if (name !== undefined && name.trim() !== serviceSubCategory.name) {
      let newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if slug already exists globally, if so, append number
      let finalSlug = newSlug;
      let counter = 1;
      while (await ServiceSubCategory.findOne({ slug: finalSlug, _id: { $ne: id } })) {
        finalSlug = `${newSlug}-${counter}`;
        counter++;
      }
      serviceSubCategory.slug = finalSlug;
    }
    
    // Update fields
    if (name !== undefined) serviceSubCategory.name = name.trim();
    if (order !== undefined) serviceSubCategory.order = order;
    if (description !== undefined) serviceSubCategory.description = description;
    if (metaTitle !== undefined) serviceSubCategory.metaTitle = metaTitle;
    if (metaDescription !== undefined) serviceSubCategory.metaDescription = metaDescription;
    if (bannerImage !== undefined) serviceSubCategory.bannerImage = bannerImage;
    if (icon !== undefined) serviceSubCategory.icon = icon;
    if (isActive !== undefined) serviceSubCategory.isActive = isActive;
    if (categoryLevel !== undefined) serviceSubCategory.categoryLevel = parseInt(categoryLevel);
    if (serviceTitleSuggestions !== undefined) {
      console.log('Updating serviceTitleSuggestions...');
      // Ensure serviceTitleSuggestions is an array of strings
      if (Array.isArray(serviceTitleSuggestions)) {
        const filteredTitles = serviceTitleSuggestions
          .map(title => typeof title === 'string' ? title.trim() : String(title))
          .filter(title => title.length > 0);
        console.log(`Filtered ${serviceTitleSuggestions.length} titles to ${filteredTitles.length} valid titles`);
        serviceSubCategory.serviceTitleSuggestions = filteredTitles;
      } else {
        console.log('serviceTitleSuggestions is not an array, setting to empty array');
        serviceSubCategory.serviceTitleSuggestions = [];
      }
    }
    if (titles !== undefined) {
      console.log('Updating titles...');
      // Update titles - merge with existing titles, replacing those with the same level
      const existingTitles = serviceSubCategory.titles || [];
      const newTitles = titles || [];
      console.log(`Existing titles: ${existingTitles.length}, New titles: ${newTitles.length}`);

      // Remove existing titles with levels that match new titles
      const newTitleLevels = new Set(newTitles.map(t => t.level));
      const filteredExisting = existingTitles.filter(t => !newTitleLevels.has(t.level));
      console.log(`Filtered existing titles: ${filteredExisting.length}`);

      // Combine filtered existing titles with new titles
      serviceSubCategory.titles = [...filteredExisting, ...newTitles];
      console.log(`Final titles count: ${serviceSubCategory.titles.length}`);
    }
    
    console.log('Saving service subcategory...');
    console.log('Current state before save:', {
      name: serviceSubCategory.name,
      serviceTitleSuggestions: serviceSubCategory.serviceTitleSuggestions,
      titles: serviceSubCategory.titles,
      serviceAttributes: serviceSubCategory.serviceAttributes,
      categoryLevel: serviceSubCategory.categoryLevel
    });
    
    // Validate before save
    const validationError = serviceSubCategory.validateSync();
    if (validationError) {
      console.error('Validation error before save:', validationError);
      const validationErrors = {};
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach(key => {
          validationErrors[key] = validationError.errors[key].message;
        });
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: validationError.message
      });
    }
    
    await serviceSubCategory.save();
    console.log('Service subcategory saved successfully');
    console.log('Saved state:', {
      serviceTitleSuggestions: serviceSubCategory.serviceTitleSuggestions,
      titles: serviceSubCategory.titles
    });
    
    // Populate service category for response
    await serviceSubCategory.populate('serviceCategory', 'name slug');
    
    console.log('=== UPDATE SERVICE SUBCATEGORY SUCCESS ===');
    return res.json({ serviceSubCategory });
  } catch (error) {
    console.error('=== UPDATE SERVICE SUBCATEGORY ERROR ===');
    console.error('Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      errors: error.errors,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    // Log validation errors in detail
    if (error.name === 'ValidationError' && error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    
    console.error('Request params:', req.params);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    console.error('=== END ERROR ===');
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Service subcategory with this name already exists in this service category',
        duplicateField: error.keyPattern ? Object.keys(error.keyPattern)[0] : undefined,
        duplicateValue: error.keyValue
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        message: error.message
      });
    }
    
    // Always include error details in response for debugging
    return res.status(500).json({ 
      error: 'Failed to update service subcategory',
      details: error.message,
      errorCode: error.code,
      errorName: error.name,
      ...(error.errors && { validationErrors: Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {}) })
    });
  }
});

// Delete service subcategory (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service subcategory ID' });
    }
    
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
    // console.error('Delete service subcategory error', error);
    return res.status(500).json({ error: 'Failed to delete service subcategory' });
  }
});

export default router;


import express from 'express';
import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';

const router = express.Router();

// Get all subcategories (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      categorySlug,
      activeOnly = 'true',
      includeCategory = 'false' 
    } = req.query;
    
    const query = {};
    
    // Filter by category
    if (categoryId) {
      query.category = categoryId;
    } else if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      query.category = category._id;
    }
    
    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    let subCategoriesQuery = SubCategory.find(query).sort({ order: 1, name: 1 });
    
    // Include category information if requested
    if (includeCategory === 'true') {
      subCategoriesQuery = subCategoriesQuery.populate('category', 'name slug');
    }
    
    const subCategories = await subCategoriesQuery.lean();
    
    return res.json({ subCategories });
  } catch (error) {
    console.error('Get subcategories error', error);
    return res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Get single subcategory by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { includeCategory = 'true' } = req.query;
    
    // Try to find by ID first, then by slug
    let subCategoryQuery = SubCategory.findOne(
      identifier.match(/^[0-9a-fA-F]{24}$/) 
        ? { _id: identifier }
        : { slug: identifier }
    );
    
    if (includeCategory === 'true') {
      subCategoryQuery = subCategoryQuery.populate('category', 'name slug');
    }
    
    const subCategory = await subCategoryQuery;
    
    if (!subCategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    return res.json({ subCategory });
  } catch (error) {
    console.error('Get subcategory error', error);
    return res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
});

// Create new subcategory (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      category,
      name,
      slug,
      order,
      description,
      icon,
      isActive,
    } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }
    
    // Find category by ID or slug
    let categoryDoc;
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ slug: category });
    }
    
    if (!categoryDoc) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Generate slug if not provided
    const subCategorySlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if subcategory with same name already exists in this category
    const existingSubCategory = await SubCategory.findOne({ 
      category: categoryDoc._id, 
      name: name.trim() 
    });
    if (existingSubCategory) {
      return res.status(409).json({ error: 'Subcategory with this name already exists in this category' });
    }
    
    const subCategory = await SubCategory.create({
      category: categoryDoc._id,
      name: name.trim(),
      slug: subCategorySlug,
      order: order !== undefined ? order : 0,
      description,
      icon,
      isActive: isActive !== undefined ? isActive : true,
    });
    
    // Populate category for response
    await subCategory.populate('category', 'name slug');
    
    return res.status(201).json({ subCategory });
  } catch (error) {
    console.error('Create subcategory error', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Subcategory with this name already exists in this category' });
    }
    return res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

// Update subcategory (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category,
      name,
      slug,
      order,
      description,
      icon,
      isActive,
    } = req.body;
    
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    // Update category if provided
    if (category) {
      let categoryDoc;
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryDoc = await Category.findById(category);
      } else {
        categoryDoc = await Category.findOne({ slug: category });
      }
      
      if (!categoryDoc) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      subCategory.category = categoryDoc._id;
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name.trim() !== subCategory.name) {
      const existingSubCategory = await SubCategory.findOne({ 
        category: subCategory.category, 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (existingSubCategory) {
        return res.status(409).json({ error: 'Subcategory with this name already exists in this category' });
      }
    }
    
    // Update fields
    if (name !== undefined) subCategory.name = name.trim();
    if (slug !== undefined) subCategory.slug = slug;
    if (order !== undefined) subCategory.order = order;
    if (description !== undefined) subCategory.description = description;
    if (icon !== undefined) subCategory.icon = icon;
    if (isActive !== undefined) subCategory.isActive = isActive;
    
    await subCategory.save();
    
    // Populate category for response
    await subCategory.populate('category', 'name slug');
    
    return res.json({ subCategory });
  } catch (error) {
    console.error('Update subcategory error', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Subcategory with this name already exists in this category' });
    }
    return res.status(500).json({ error: 'Failed to update subcategory' });
  }
});

// Delete subcategory (Admin only - soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = 'false' } = req.query;
    
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    if (hardDelete === 'true') {
      await SubCategory.findByIdAndDelete(id);
      return res.json({ message: 'Subcategory deleted' });
    } else {
      // Soft delete
      subCategory.isActive = false;
      await subCategory.save();
      return res.json({ message: 'Subcategory deactivated', subCategory });
    }
  } catch (error) {
    console.error('Delete subcategory error', error);
    return res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

// Bulk update subcategory order
router.put('/bulk/order', async (req, res) => {
  try {
    const { subCategories } = req.body; // Array of { id, order }
    
    if (!Array.isArray(subCategories)) {
      return res.status(400).json({ error: 'Subcategories must be an array' });
    }
    
    const updatePromises = subCategories.map(({ id, order }) =>
      SubCategory.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    return res.json({ message: 'Subcategory orders updated' });
  } catch (error) {
    console.error('Bulk update subcategory order error', error);
    return res.status(500).json({ error: 'Failed to update subcategory orders' });
  }
});

export default router;


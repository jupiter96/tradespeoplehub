import express from 'express';
import Service from '../models/Service.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ServiceSubCategory from '../models/ServiceSubCategory.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: get id string from either ObjectId or populated document
const getRefId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref._id) return ref._id.toString();
  return ref.toString();
};

// Helper: slugify + random suffix for uniqueness
const slugify = (text) =>
  (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const randomSuffix = (len = 6) => {
  // base36: 0-9a-z
  let s = '';
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.slice(0, len);
};

const buildUniqueServiceSlug = async ({ title, excludeId } = {}) => {
  const base = slugify(title);
  if (!base) return null;

  // Always add a random suffix to avoid collisions and keep slugs stable/unique
  for (let attempts = 0; attempts < 20; attempts++) {
    const candidate = `${base}-${randomSuffix(6)}`;
    const query = excludeId ? { slug: candidate, _id: { $ne: excludeId } } : { slug: candidate };
    // eslint-disable-next-line no-await-in-loop
    const exists = await Service.findOne(query).select('_id').lean();
    if (!exists) return candidate;
  }

  // Fallback (extremely unlikely): time-based suffix
  const fallback = `${base}-${Date.now().toString(36)}`;
  const query = excludeId ? { slug: fallback, _id: { $ne: excludeId } } : { slug: fallback };
  const exists = await Service.findOne(query).select('_id').lean();
  return exists ? `${fallback}-${randomSuffix(4)}` : fallback;
};

// Get all services (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const {
      professionalId,
      serviceCategoryId,
      serviceSubCategoryId,
      status,
      approvalStatus,
      activeOnly = 'true',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const query = {};
    // Backward compatibility mapping:
    // - legacy `status=active` => `approved`
    // - legacy `approvalStatus=rejected` => `denied`
    const mapLegacyApprovalToStatus = (s) => {
      if (!s) return undefined;
      if (s === 'approved') return 'approved';
      if (s === 'pending') return 'pending';
      if (s === 'required_modification') return 'required_modification';
      if (s === 'rejected') return 'denied';
      return undefined;
    };
    const mapLegacyStatus = (s) => {
      if (!s) return undefined;
      if (s === 'active') return 'approved';
      if (s === 'paused') return 'paused';
      if (s === 'inactive') return 'inactive';
      return s;
    };

    // Filter by professional
    if (professionalId) {
      query.professional = professionalId;
    }

    // Filter by service category
    if (serviceCategoryId) {
      query.serviceCategory = serviceCategoryId;
    }

    // Filter by service subcategory
    if (serviceSubCategoryId) {
      query.serviceSubCategory = serviceSubCategoryId;
    }

    // Unified status (new). Prefer explicit `status`, otherwise accept legacy `approvalStatus`.
    const effectiveStatus = mapLegacyStatus(status) || mapLegacyApprovalToStatus(approvalStatus);
    
    // Always exclude draft services from admin pages (when activeOnly is false and no professionalId)
    // Draft services should only be visible to the professional who created them
    if (activeOnly === 'false' && !professionalId) {
      // If a specific status filter is requested, apply it but exclude draft
    if (effectiveStatus) {
        if (effectiveStatus === 'draft') {
          // If draft is explicitly requested, return empty (admin shouldn't see drafts)
          query.status = { $exists: false }; // This will match nothing
        } else {
          query.status = effectiveStatus;
        }
      } else {
        // No specific status filter, exclude draft
        query.status = { $ne: 'draft' };
      }
    } else if (effectiveStatus) {
      // For other cases (public listings, professional's own services), apply status filter normally
      query.status = effectiveStatus;
    }

    // Filter by active status
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    // Exclude user-disabled services from public listings (unless fetching own services)
    if (!professionalId) {
      query.isUserDisabled = { $ne: true };
      // Public listings: only show approved services by default
      // BUT: if activeOnly is explicitly false, don't filter by status (for admin pages)
      if (!effectiveStatus && activeOnly === 'true') {
        query.status = 'approved';
      }
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Parse pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    sortObj[sortField] = sortDirection;

    // Get total count for pagination
    const total = await Service.countDocuments(query);

    const services = await Service.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.json({
      services,
      totalCount: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    // console.error('Get services error', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch services' });
  }
});

// Get single service by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by slug first (if it's not a MongoDB ObjectId)
    let service;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ObjectId, find by ID
      const doc = await Service.findById(id);
      if (doc && !doc.slug) {
        const newSlug = await buildUniqueServiceSlug({ title: doc.title, excludeId: doc._id });
        if (newSlug) {
          doc.slug = newSlug;
          await doc.save();
        }
      }
      service = doc ? doc.toObject() : null;
    } else {
      // It's likely a slug, find by slug
      service = await Service.findOne({ slug: id }).lean();
      
      // If not found by slug, try by ID as fallback (for backward compatibility)
      if (!service) {
        const doc = await Service.findById(id);
        if (doc && !doc.slug) {
          const newSlug = await buildUniqueServiceSlug({ title: doc.title, excludeId: doc._id });
          if (newSlug) {
            doc.slug = newSlug;
            await doc.save();
          }
        }
        service = doc ? doc.toObject() : null;
      }
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({ service });
  } catch (error) {
    // console.error('Get service error', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch service' });
  }
});

// Create/Update draft service (Professional only)
router.post('/draft', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const {
      serviceCategoryId,
      serviceSubCategoryId,
      serviceSubCategoryPath,
      title,
      description,
      aboutMe,
      price,
      originalPrice,
      originalPriceValidUntil,
      priceUnit,
      images,
      portfolioImages,
      packages,
      addons,
      highlights,
      idealFor,
      faqs,
      deliveryType,
      responseTime,
      experienceYears,
      availability,
      skills,
      county,
      badges,
      metaTitle,
      metaDescription,
    } = req.body;

    // Get professional info
    const professional = await User.findById(req.user.id);
    if (!professional || professional.role !== 'professional') {
      return res.status(403).json({ error: 'Only professionals can create services' });
    }

    // Check if user is blocked
    if (professional.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. You cannot create services.' });
    }

    // Build draft service data (only include fields with values)
    const draftServiceData = {
      professional: req.user.id,
      title: title?.trim() || 'Untitled Draft',
      status: 'draft',
      isActive: false,
    };

    // Add optional fields only if they have values
    if (serviceCategoryId) draftServiceData.serviceCategory = serviceCategoryId;
    if (serviceSubCategoryId) draftServiceData.serviceSubCategory = serviceSubCategoryId;
    if (serviceSubCategoryPath && serviceSubCategoryPath.length > 0) draftServiceData.serviceSubCategoryPath = serviceSubCategoryPath;
    if (description?.trim()) draftServiceData.description = description.trim();
    if (aboutMe?.trim()) draftServiceData.aboutMe = aboutMe.trim();
    if (price !== undefined && price !== null) draftServiceData.price = parseFloat(price);
    if (originalPrice) draftServiceData.originalPrice = parseFloat(originalPrice);
    if (originalPriceValidUntil) {
      draftServiceData.originalPriceValidUntil = new Date(originalPriceValidUntil);
    }
    if (priceUnit) draftServiceData.priceUnit = priceUnit;
    if (images && images.length > 0) draftServiceData.images = images;
    if (portfolioImages && portfolioImages.length > 0) draftServiceData.portfolioImages = portfolioImages;
    if (packages && packages.length > 0) draftServiceData.packages = packages;
    if (addons && addons.length > 0) draftServiceData.addons = addons;
    if (highlights && highlights.length > 0) draftServiceData.highlights = highlights;
    if (idealFor && idealFor.length > 0) draftServiceData.idealFor = idealFor;
    if (faqs && Array.isArray(faqs) && faqs.length > 0) draftServiceData.faqs = faqs;
    if (deliveryType) draftServiceData.deliveryType = deliveryType;
    if (responseTime) draftServiceData.responseTime = responseTime;
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== "") {
      draftServiceData.experienceYears = Number(experienceYears);
    }
    if (availability && typeof availability === 'object') {
      draftServiceData.availability = availability;
    }
    if (skills && skills.length > 0) draftServiceData.skills = skills;
    if (county || professional.county) draftServiceData.county = county || professional.county;
    if (badges && badges.length > 0) draftServiceData.badges = badges;
    if (metaTitle) draftServiceData.metaTitle = metaTitle;
    if (metaDescription) draftServiceData.metaDescription = metaDescription;

    // Create draft service (minimal validation)
    const service = await Service.create(draftServiceData);

    // Populate references
    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
    ]);

    return res.status(201).json({ service });
  } catch (error) {
    // console.error('Create draft error', error);
    return res.status(500).json({ error: error.message || 'Failed to create draft' });
  }
});

// Create new service (Professional only)
router.post('/', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const {
      serviceCategoryId,
      serviceSubCategoryId,
      serviceSubCategoryPath,
      title,
      description,
      aboutMe,
      price,
      originalPrice,
      originalPriceValidUntil,
      priceUnit,
      images,
      portfolioImages,
      packages,
      addons,
      highlights,
      idealFor,
      deliveryType,
      responseTime,
      experienceYears,
      skills,
      county,
      badges,
      metaTitle,
      metaDescription,
      status,
    } = req.body;

    // Validate required fields
    if (!serviceCategoryId) {
      return res.status(400).json({ error: 'Service category is required' });
    }

    if (!title || !description || price === undefined) {
      return res.status(400).json({ error: 'Title, description, and price are required' });
    }

    // Verify service category exists
    const serviceCategory = await ServiceCategory.findById(serviceCategoryId);
    if (!serviceCategory) {
      return res.status(404).json({ error: 'Service category not found' });
    }

    // Verify service subcategory exists if provided
    if (serviceSubCategoryId) {
      const serviceSubCategory = await ServiceSubCategory.findById(serviceSubCategoryId);
      if (!serviceSubCategory) {
        return res.status(404).json({ error: 'Service subcategory not found' });
      }
      // Verify subcategory belongs to the category
      // Handle both direct serviceCategory reference and nested parentSubCategory structure
      const subCategoryServiceCategory = serviceSubCategory.serviceCategory 
        ? (typeof serviceSubCategory.serviceCategory === 'object' 
            ? serviceSubCategory.serviceCategory._id?.toString() 
            : serviceSubCategory.serviceCategory.toString())
        : null;
      
      // For nested subcategories, we need to find the root category
      if (!subCategoryServiceCategory && serviceSubCategory.parentSubCategory) {
        // This is a nested subcategory, find the root category by traversing up
        let currentSubCat = serviceSubCategory;
        let rootCategoryId = null;
        while (currentSubCat) {
          if (currentSubCat.serviceCategory) {
            rootCategoryId = typeof currentSubCat.serviceCategory === 'object' 
              ? currentSubCat.serviceCategory._id?.toString() 
              : currentSubCat.serviceCategory.toString();
            break;
          }
          if (currentSubCat.parentSubCategory) {
            const parentId = typeof currentSubCat.parentSubCategory === 'object' 
              ? currentSubCat.parentSubCategory._id 
              : currentSubCat.parentSubCategory;
            if (!parentId) break;
            currentSubCat = await ServiceSubCategory.findById(parentId);
            if (!currentSubCat) break;
          } else {
            break;
          }
        }
        if (rootCategoryId && rootCategoryId !== serviceCategoryId) {
          return res.status(400).json({ error: 'Service subcategory does not belong to the selected category' });
        }
        // If we couldn't find a root category, skip validation for nested subcategories
      } else if (subCategoryServiceCategory && subCategoryServiceCategory !== serviceCategoryId) {
        return res.status(400).json({ error: 'Service subcategory does not belong to the selected category' });
      }
    }

    // Get professional info
    const professional = await User.findById(req.user.id);
    if (!professional || professional.role !== 'professional') {
      return res.status(403).json({ error: 'Only professionals can create services' });
    }

    // Check if user is blocked
    if (professional.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. You cannot create services.' });
    }

    // Generate slug from title + random suffix (unique globally)
    const finalSlug = await buildUniqueServiceSlug({ title });

    // Create service
    const service = await Service.create({
      professional: req.user.id,
      serviceCategory: serviceCategoryId,
      serviceSubCategory: serviceSubCategoryId || null,
      serviceSubCategoryPath: Array.isArray(serviceSubCategoryPath) ? serviceSubCategoryPath : [],
      title: title.trim(),
      slug: finalSlug,
      description: description.trim(),
      aboutMe: aboutMe?.trim() || undefined,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      originalPriceValidUntil: originalPriceValidUntil ? new Date(originalPriceValidUntil) : undefined,
      priceUnit: priceUnit || 'fixed',
      images: images || [],
      portfolioImages: portfolioImages || [],
      packages: packages || [],
      addons: addons || [],
      highlights: highlights || [],
      idealFor: idealFor || [],
      faqs: faqs || [],
      deliveryType: deliveryType || 'standard',
      responseTime: responseTime || undefined,
      experienceYears: experienceYears !== undefined && experienceYears !== null && experienceYears !== ""
        ? Number(experienceYears)
        : undefined,
      availability: availability && typeof availability === 'object' ? availability : undefined,
      skills: skills || [],
      county: professional.county || county || undefined,
      badges: badges || [],
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      // New services always start pending (awaiting admin review)
      status: 'pending',
      isActive: true,
    });

    // Populate references
    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
    ]);

    return res.status(201).json({ service });
  } catch (error) {
    // console.error('Create service error', error);
    return res.status(500).json({ error: error.message || 'Failed to create service' });
  }
});

// Update service (Professional only - own services)
router.put('/:id', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify ownership
    if (getRefId(service.professional) !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Get professional info
    const professional = await User.findById(req.user.id);
    if (professional?.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. You cannot update services.' });
    }

    // For draft updates, skip strict validation
    const isDraftUpdate = service.status === 'draft' || updateData.status === 'draft';

    // Validate service category if provided
    if (updateData.serviceCategoryId) {
      const serviceCategory = await ServiceCategory.findById(updateData.serviceCategoryId);
      if (!serviceCategory && !isDraftUpdate) {
        return res.status(404).json({ error: 'Service category not found' });
      }
      if (serviceCategory) {
        updateData.serviceCategory = updateData.serviceCategoryId;
      }
      delete updateData.serviceCategoryId;
    }

    // Validate service subcategory if provided
    if (updateData.serviceSubCategoryId) {
      const serviceSubCategory = await ServiceSubCategory.findById(updateData.serviceSubCategoryId);
      if (!serviceSubCategory && !isDraftUpdate) {
        return res.status(404).json({ error: 'Service subcategory not found' });
      }
      if (serviceSubCategory) {
        // Only validate category match if both exist and not a draft
        if (updateData.serviceCategory && serviceSubCategory.serviceCategory && !isDraftUpdate) {
          if (serviceSubCategory.serviceCategory.toString() !== updateData.serviceCategory.toString()) {
            return res.status(400).json({ error: 'Service subcategory does not belong to the selected category' });
          }
        }
        updateData.serviceSubCategory = updateData.serviceSubCategoryId;
      }
      delete updateData.serviceSubCategoryId;
    }

    // Clean up update data
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.aboutMe !== undefined) updateData.aboutMe = updateData.aboutMe?.trim() || undefined;
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice = updateData.originalPrice ? parseFloat(updateData.originalPrice) : undefined;
    }
    if (updateData.originalPriceValidUntil !== undefined) {
      updateData.originalPriceValidUntil = updateData.originalPriceValidUntil
        ? new Date(updateData.originalPriceValidUntil)
        : undefined;
    }
    if (updateData.faqs !== undefined && !Array.isArray(updateData.faqs)) {
      // Normalize to array or clear if invalid
      delete updateData.faqs;
    }

    // Normalize experienceYears to number if provided
    if (updateData.experienceYears !== undefined && updateData.experienceYears !== null && updateData.experienceYears !== "") {
      updateData.experienceYears = Number(updateData.experienceYears);
    }

    // Ensure serviceSubCategoryPath is always an array when provided
    if (updateData.serviceSubCategoryPath !== undefined && !Array.isArray(updateData.serviceSubCategoryPath)) {
      delete updateData.serviceSubCategoryPath;
    }

    // Ensure availability is an object when provided
    if (updateData.availability !== undefined && typeof updateData.availability !== 'object') {
      delete updateData.availability;
    }

    // Generate new slug if title is changed (skip for drafts)
    if (updateData.title && updateData.title !== service.title && !isDraftUpdate) {
      // Keep existing random suffix if present; otherwise create a new one
      const existing = typeof service.slug === 'string' ? service.slug : '';
      const existingSuffixMatch = existing.match(/-([a-z0-9]{4,})$/);
      const suffix = existingSuffixMatch ? existingSuffixMatch[1] : randomSuffix(6);
      let candidate = `${slugify(updateData.title)}-${suffix}`;

      // If collision, fall back to generating a new random suffix
      while (await Service.findOne({ slug: candidate, _id: { $ne: id } }).select('_id').lean()) {
        candidate = `${slugify(updateData.title)}-${randomSuffix(6)}`;
      }

      updateData.slug = candidate;
    }

    // Don't allow updating isUserDisabled through PUT endpoint (use toggle endpoint instead)
    if (updateData.isUserDisabled !== undefined) {
      delete updateData.isUserDisabled;
    }

    // Allow status update only for draft -> pending transition or draft -> draft
    if (updateData.status !== undefined) {
      if (service.status === 'draft' && (updateData.status === 'pending' || updateData.status === 'draft')) {
        // Allow draft to pending transition (publishing) or keeping draft status
        // Keep the status update
      } else {
        // Don't allow other status changes via PUT
        delete updateData.status;
      }
    }

    // Update service
    Object.assign(service, updateData);

    // If admin requested modification and pro updates the service, send back to pending review
    if (service.status === 'required_modification') {
      service.status = 'pending';
      service.modificationReason = null;
      service.reviewedBy = null;
      service.reviewedAt = null;
    }
    await service.save();

    // Populate references
    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
    ]);

    return res.json({ service });
  } catch (error) {
    // console.error('Update service error', error);
    return res.status(500).json({ error: error.message || 'Failed to update service' });
  }
});

// Update service status (Admin/Subadmin: any status, Professional: only paused/inactive on own services)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    const validStatuses = ['pending', 'required_modification', 'denied', 'paused', 'approved', 'inactive'];
    if (!nextStatus || !validStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if user is admin (from Admin model) or regular user
    let isAdmin = false;
    if (req.user.isAdmin) {
      // User is admin/subadmin from Admin model
      isAdmin = req.user.role === 'admin' || req.user.role === 'subadmin';
      // For subadmin, also check if they have 'service' permission
      if (req.user.role === 'subadmin' && req.user.permissions) {
        isAdmin = req.user.permissions.includes('service');
      }
    } else {
      // Regular user from User model
      const user = await User.findById(req.user.id);
      isAdmin = user?.role === 'admin' || user?.role === 'subadmin';
    }
    const isOwner = getRefId(service.professional) === req.user.id;

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({ error: 'You can only update your own services' });
      }
      if (!['paused', 'inactive'].includes(nextStatus)) {
        return res.status(403).json({ error: 'You do not have permission to set this status' });
      }
    }

    service.status = nextStatus;
    await service.save();

    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
      { path: 'reviewedBy', select: 'firstName lastName email' },
    ]);

    return res.json({ service });
  } catch (error) {
    // console.error('Update service status error', error);
    return res.status(500).json({ error: error.message || 'Failed to update service status' });
  }
});

// Toggle service user disable status (Professional only - own services)
router.patch('/:id/toggle-disable', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isUserDisabled } = req.body;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify ownership
    if (getRefId(service.professional) !== req.user.id) {
      return res.status(403).json({ error: 'You can only toggle your own services' });
    }

    // Update isUserDisabled status
    service.isUserDisabled = isUserDisabled !== undefined ? isUserDisabled : !service.isUserDisabled;
    await service.save();

    // Populate references
    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
    ]);

    return res.json({ service });
  } catch (error) {
    // console.error('Toggle service disable error', error);
    return res.status(500).json({ error: error.message || 'Failed to toggle service disable status' });
  }
});

// Update service approval status (Admin only)
router.patch('/:id/approval', authenticateToken, requireRole(['admin', 'subadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, status: desiredStatus, modificationReason } = req.body;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Accept new unified status OR legacy approvalStatus
    const validUnified = ['pending', 'approved', 'required_modification', 'denied', 'paused', 'inactive'];
    const legacyMap = (s) => (s === 'rejected' ? 'denied' : s);
    const desired = desiredStatus || legacyMap(approvalStatus);
    if (desired && !validUnified.includes(desired)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (desired) {
      service.status = desired;
    }

    // Update modification reason if provided
    if (modificationReason !== undefined) {
      service.modificationReason = modificationReason || null;
    }

    // Set review information
    service.reviewedBy = req.user.id;
    service.reviewedAt = new Date();

    // Keep modification reason only for required_modification
    if (service.status !== 'required_modification') {
      service.modificationReason = null;
    }

    await service.save();

    // Populate references
    await service.populate([
      { path: 'professional', select: 'firstName lastName tradingName avatar email phone postcode' },
      { path: 'serviceCategory', select: 'name slug icon bannerImage sector' },
      { path: 'serviceSubCategory', select: 'name slug icon' },
      { path: 'reviewedBy', select: 'firstName lastName email' },
    ]);

    return res.json({ service });
  } catch (error) {
    // console.error('Update service approval error', error);
    return res.status(500).json({ error: error.message || 'Failed to update service approval' });
  }
});

// Delete service (Professional only - own services, or Admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check permissions
    let isAdmin = false;
    let user = null;
    if (req.user.isAdmin) {
      // User is admin/subadmin from Admin model
      isAdmin = req.user.role === 'admin' || req.user.role === 'subadmin';
      // For subadmin, also check if they have 'service' permission
      if (req.user.role === 'subadmin' && req.user.permissions) {
        isAdmin = req.user.permissions.includes('service');
      }
    } else {
      // Regular user from User model
      user = await User.findById(req.user.id);
      isAdmin = user?.role === 'admin' || user?.role === 'subadmin';
    }
    const isOwner = getRefId(service.professional) === req.user.id;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to delete this service' });
    }

    // Check if professional is blocked (only for owners)
    if (isOwner && user?.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. You cannot delete services.' });
    }

    // Delete service
    await Service.findByIdAndDelete(id);

    return res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    // console.error('Delete service error', error);
    return res.status(500).json({ error: error.message || 'Failed to delete service' });
  }
});

export default router;


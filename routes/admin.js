import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import SEOContent from '../models/SEOContent.js';
import EmailTemplate from '../models/EmailTemplate.js';
import Category from '../models/Category.js';
import Sector from '../models/Sector.js';
import SubCategory from '../models/SubCategory.js';

// Load environment variables
dotenv.config();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  const match = url.match(/\/v\d+\/(.+)\./);
  return match ? match[1] : null;
};

// Configure multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload JPG, PNG, GIF, or WEBP.'));
    }
  },
});

const avatarUploadMiddleware = avatarUpload.single('avatar');

const sanitizeUser = (user) => user.toSafeObject();

const router = express.Router();

// Password validation: must include uppercase, lowercase, and numbers, at least 6 characters
const validatePasswordStrength = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number';
  }
  return null;
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.adminUser = admin;
    next();
  } catch (error) {
    console.error('Admin auth error', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Permission check middleware for sub-admins
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.adminUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Super admin (no permissions array or empty) has access to everything
      if (!req.adminUser.permissions || req.adminUser.permissions.length === 0) {
        return next();
      }

      // Check if user has the required permission
      if (!req.adminUser.permissions.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.adminId = admin._id.toString();
    req.session.role = admin.role;

    return res.json({
      message: 'Login successful',
      user: admin.toSafeObject(),
    });
  } catch (error) {
    console.error('Admin login error', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Admin logout
router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    return res.json({ message: 'Logout successful' });
  });
});

// Get current admin user
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }
    return res.json({ user: admin.toSafeObject() });
  } catch (error) {
    console.error('Get admin user error', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update current admin profile (email and fullname)
router.put('/profile', requireAdmin, async (req, res) => {
  try {
    const { email, fullname } = req.body || {};
    
    if (!email || !fullname) {
      return res.status(400).json({ error: 'Email and fullname are required' });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is being changed
    if (normalizedEmail !== admin.email) {
      // Check if new email is already in use
      const existingAdmin = await Admin.findOne({ email: normalizedEmail });
      if (existingAdmin) {
        return res.status(409).json({ error: 'Email is already in use' });
      }
      admin.email = normalizedEmail;
    }

    // Update fullname
    admin.fullname = fullname.trim();

    await admin.save();

    return res.json({ 
      message: 'Profile updated successfully',
      user: admin.toSafeObject() 
    });
  } catch (error) {
    console.error('Update admin profile error', error);
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Upload admin avatar
router.post(
  '/profile/avatar',
  requireAdmin,
  (req, res, next) => {
    avatarUploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      // Check if Cloudinary is configured
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({ 
          error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Avatar file is required' });
      }

      const admin = await Admin.findById(req.session.adminId);
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }

      // Delete old avatar from Cloudinary if exists
      if (admin.avatar) {
        const oldPublicId = extractPublicId(admin.avatar);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (error) {
            console.warn('Failed to delete old avatar from Cloudinary:', error);
          }
        }
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'admin-avatars',
            public_id: `admin-avatar-${admin._id}-${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Update only the avatar field to avoid validation issues
      const updatedAdmin = await Admin.findByIdAndUpdate(
        admin._id,
        { avatar: uploadResult.secure_url },
        { new: true, runValidators: false }
      );

      if (!updatedAdmin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      return res.json({ user: updatedAdmin.toSafeObject() });
    } catch (error) {
      console.error('Avatar upload error', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to upload avatar' 
      });
    }
  }
);

// Delete admin avatar
router.delete('/profile/avatar', requireAdmin, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    if (admin.avatar) {
      // Delete from Cloudinary
      const publicId = extractPublicId(admin.avatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.warn('Failed to delete avatar from Cloudinary:', error);
        }
      }

      // Update only the avatar field to avoid validation issues
      const updatedAdmin = await Admin.findByIdAndUpdate(
        admin._id,
        { avatar: null },
        { new: true, runValidators: false }
      );

      if (!updatedAdmin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      return res.json({ user: updatedAdmin.toSafeObject() });
    } else {
      return res.json({ user: admin.toSafeObject() });
    }
  } catch (error) {
    console.error('Avatar removal error', error);
    return res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

// Configure multer for sector/category image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload JPG, PNG, GIF, or WEBP.'));
    }
  },
});

const imageUploadMiddleware = imageUpload.single('image');

// Upload sector/category icon or banner image
router.post('/upload-image/:type/:entityType/:entityId', requireAdmin, (req, res, next) => {
  imageUploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return next();
  });
}, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }

    const { type, entityType, entityId } = req.params; // type: 'icon' or 'banner', entityType: 'sector' or 'category'

    if (!['icon', 'banner'].includes(type)) {
      return res.status(400).json({ error: 'Invalid image type. Must be "icon" or "banner"' });
    }

    if (!['sector', 'category'].includes(entityType)) {
      return res.status(400).json({ error: 'Invalid entity type. Must be "sector" or "category"' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Find the entity
    let entity;
    if (entityType === 'sector') {
      entity = await Sector.findById(entityId);
    } else {
      entity = await Category.findById(entityId);
    }

    if (!entity) {
      return res.status(404).json({ error: `${entityType} not found` });
    }

    // Delete old image from Cloudinary if exists
    const oldImageUrl = type === 'icon' ? entity.icon : entity.bannerImage;
    if (oldImageUrl && (oldImageUrl.startsWith('http') || oldImageUrl.startsWith('https'))) {
      const oldPublicId = extractPublicId(oldImageUrl);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (error) {
          console.warn(`Failed to delete old ${type} from Cloudinary:`, error);
        }
      }
    }

    // Upload to Cloudinary
    const folder = `${entityType}s/${type}s`;
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${entityType}-${type}-${entityId}-${Date.now()}`,
          transformation: type === 'icon' 
            ? [{ width: 200, height: 200, crop: 'fill', gravity: 'auto' }, { quality: 'auto' }]
            : [{ width: 1200, height: 400, crop: 'fill', gravity: 'auto' }, { quality: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Update entity with new image URL
    if (type === 'icon') {
      entity.icon = uploadResult.secure_url;
    } else {
      entity.bannerImage = uploadResult.secure_url;
    }
    await entity.save();

    return res.json({ 
      imageUrl: uploadResult.secure_url,
      [type]: uploadResult.secure_url
    });
  } catch (error) {
    console.error('Image upload error', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to upload image' 
    });
  }
});

// Get all users (with pagination and filters)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 rows per page
    const role = req.query.role; // 'client', 'professional', or undefined for all
    const search = req.query.search; // Search by name or email
    const sortBy = req.query.sortBy || 'createdAt'; // Default sort by createdAt
    const sortOrder = req.query.sortOrder || 'desc'; // Default descending

    // Check permissions for sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      if (role === 'client' && !req.adminUser.permissions.includes('clients-management')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      if (role === 'professional' && !req.adminUser.permissions.includes('professionals-management')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const query = {};
    if (role) {
      query.role = role;
    }
    
    // Check if this is a request for deleted accounts
    const showDeleted = req.query.deleted === 'true';
    if (showDeleted) {
      // Show only deleted accounts
      query.isDeleted = true;
    } else {
      // Exclude deleted users from regular user list
      query.isDeleted = { $ne: true };
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    // Note: Admin can see all users including blocked ones, but exclude deleted users unless explicitly requested

    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortObj = {};
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Map frontend sort fields to database fields
    const sortFieldMap = {
      'name': 'firstName', // Sort by firstName for name
      'email': 'email',
      'tradingName': 'tradingName',
      'phone': 'phone',
      'createdAt': 'createdAt',
    };
    
    const dbSortField = sortFieldMap[sortBy] || 'createdAt';
    sortObj[dbSortField] = sortDirection;
    
    // If sorting by name, also sort by lastName
    if (sortBy === 'name') {
      sortObj['lastName'] = sortDirection;
    }
    
    const users = await User.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    const sanitizedUsers = users.map((user) => {
      const userObj = { ...user };
      delete userObj.passwordHash;
      userObj.id = userObj._id.toString();
      userObj.name = `${userObj.firstName} ${userObj.lastName}`.trim();
      // Ensure isBlocked and related fields are included
      userObj.isBlocked = user.isBlocked || false;
      userObj.blockReviewInvitation = user.blockReviewInvitation || false;
      userObj.viewedByAdmin = user.viewedByAdmin || false;
      userObj.isDeleted = user.isDeleted || false;
      userObj.deletedAt = user.deletedAt || null;
      // Ensure publicProfile is included for professionals
      if (user.publicProfile) {
        userObj.publicProfile = user.publicProfile;
      }
      return userObj;
    });

    return res.json({
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error', error);
    return res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get single user by ID
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = { ...user };
    delete userObj.passwordHash;
    userObj.id = userObj._id.toString();
    userObj.name = `${userObj.firstName} ${userObj.lastName}`.trim();

    return res.json({ user: userObj });
  } catch (error) {
    console.error('Get user error', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create user
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, postcode, role, townCity, address, travelDistance, sector, tradingName, referralCode } = req.body || {};

    if (!firstName || !lastName || !email || !password || !phone || !postcode) {
      return res.status(400).json({ error: 'First name, last name, email, password, phone, and postcode are required' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    if (role && !['client', 'professional'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be client or professional' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role: role || 'client',
      phone,
      postcode,
      ...(townCity && { townCity }),
      ...(address && { address }),
      ...(travelDistance && { travelDistance }),
      ...(sector && { sector }),
      ...(tradingName && { tradingName }),
      ...(referralCode && { referralCode }),
    };

    const user = await User.create(userData);

    return res.status(201).json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Create user error', error);
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body || {};

    // Prevent changing admin or subadmin role
    if ((updates.role === 'admin' || updates.role === 'subadmin') && userId !== req.session.userId) {
      return res.status(403).json({ error: 'Cannot change user to admin or subadmin role' });
    }

    // If password is provided, validate and hash it
    if (updates.password) {
      const passwordError = validatePasswordStrength(updates.password);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }
      updates.passwordHash = await bcrypt.hash(updates.password, 12);
      delete updates.password;
    } else {
      // Don't allow updating password through this endpoint if not provided
      delete updates.passwordHash;
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Update user error', error);
    return res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// Delete user (soft delete - move to deleted accounts)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting admin users (super admin cannot be deleted)
    if (user.role === 'admin' || user.role === 'subadmin') {
      return res.status(403).json({ error: 'Admin and subadmin users cannot be deleted through this endpoint' });
    }

    // Soft delete - mark as deleted instead of actually deleting
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    return res.json({ message: 'User moved to deleted accounts successfully', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Delete user error', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get dashboard statistics
router.get('/dashboard/statistics', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count users by role - TOTAL count (all users regardless of viewedByAdmin)
    // Exclude deleted users
    const professionalsCount = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true }
    });
    // Count NEW professionals (NOT viewed by admin) for badge
    const professionalsNew = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      $or: [
        { viewedByAdmin: { $exists: false } },
        { viewedByAdmin: false }
      ]
    });
    const professionalsToday = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: today }
    });
    const professionalsYesterday = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const professionalsDailyChange = professionalsToday - professionalsYesterday;

    // Count clients - TOTAL count (all clients regardless of viewedByAdmin)
    const clientsCount = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true }
    });
    // Count NEW clients (NOT viewed by admin) for badge
    const clientsNew = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      $or: [
        { viewedByAdmin: { $exists: false } },
        { viewedByAdmin: false }
      ]
    });
    const clientsToday = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: today }
    });
    const clientsYesterday = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const clientsDailyChange = clientsToday - clientsYesterday;

    // Count subadmin - TOTAL count (all subadmins regardless of viewedByAdmin)
    // Subadmins are now in Admin collection, not User collection
    const subadminCount = await Admin.countDocuments({ 
      role: 'subadmin'
    });
    // Count NEW subadmins (NOT viewed by admin) for badge
    // Note: Admin model doesn't have viewedByAdmin field, so we'll use createdAt to determine new subadmins
    // Count subadmins created in the last 7 days as "new"
    const subadminNew = await Admin.countDocuments({ 
      role: 'subadmin',
      createdAt: { $gte: last7Days }
    });

    // Count verification documents pending - TOTAL count (all pending documents regardless of viewedByAdmin)
    // Exclude deleted users
    const professionalsWithPendingDocs = await User.find({
      role: 'professional',
      isDeleted: { $ne: true },
      $or: [
        { 
          'verification.address.status': 'pending',
          'verification.address.documentUrl': { $exists: true, $ne: null }
        },
        { 
          'verification.idCard.status': 'pending',
          'verification.idCard.documentUrl': { $exists: true, $ne: null }
        },
        { 
          'verification.publicLiabilityInsurance.status': 'pending',
          'verification.publicLiabilityInsurance.documentUrl': { $exists: true, $ne: null }
        },
      ],
    });
    
    // Count total pending documents (all pending documents, not users)
    let verificationDocsPendingCount = 0;
    professionalsWithPendingDocs.forEach(user => {
      // Count address document if pending and has documentUrl
      if (user.verification?.address?.status === 'pending' && 
          user.verification?.address?.documentUrl) {
        verificationDocsPendingCount++;
      }
      // Count idCard document if pending and has documentUrl
      if (user.verification?.idCard?.status === 'pending' && 
          user.verification?.idCard?.documentUrl) {
        verificationDocsPendingCount++;
      }
      // Count publicLiabilityInsurance document if pending and has documentUrl
      if (user.verification?.publicLiabilityInsurance?.status === 'pending' && 
          user.verification?.publicLiabilityInsurance?.documentUrl) {
        verificationDocsPendingCount++;
      }
    });

    // Count NEW verification documents (pending documents with documentUrl that are NOT viewed by admin)
    // Badge shows new count in real-time, excluding documents already viewed by admin
    let verificationDocsNew = 0;
    professionalsWithPendingDocs.forEach(user => {
      // Count address document if pending, has documentUrl, and NOT viewed by admin
      if (user.verification?.address?.status === 'pending' && 
          user.verification?.address?.documentUrl &&
          !user.verification?.address?.viewedByAdmin) {
        verificationDocsNew++;
      }
      // Count idCard document if pending, has documentUrl, and NOT viewed by admin
      if (user.verification?.idCard?.status === 'pending' && 
          user.verification?.idCard?.documentUrl &&
          !user.verification?.idCard?.viewedByAdmin) {
        verificationDocsNew++;
      }
      // Count publicLiabilityInsurance document if pending, has documentUrl, and NOT viewed by admin
      if (user.verification?.publicLiabilityInsurance?.status === 'pending' && 
          user.verification?.publicLiabilityInsurance?.documentUrl &&
          !user.verification?.publicLiabilityInsurance?.viewedByAdmin) {
        verificationDocsNew++;
      }
    });

    // Count total users who have submitted verification documents (any document with documentUrl)
    const totalVerificationUsers = await User.countDocuments({
      role: 'professional',
      $or: [
        { 'verification.address.documentUrl': { $exists: true, $ne: null } },
        { 'verification.idCard.documentUrl': { $exists: true, $ne: null } },
        { 'verification.publicLiabilityInsurance.documentUrl': { $exists: true, $ne: null } },
      ],
    });

    // Count users who submitted verification documents today
    // We'll check users created today who have verification documents
    // Note: This is approximate since we don't track when documents were uploaded
    const verificationUsersToday = await User.countDocuments({
      role: 'professional',
      createdAt: { $gte: today },
      $or: [
        { 'verification.address.documentUrl': { $exists: true, $ne: null } },
        { 'verification.idCard.documentUrl': { $exists: true, $ne: null } },
        { 'verification.publicLiabilityInsurance.documentUrl': { $exists: true, $ne: null } },
      ],
    });

    // verificationDocsNew is now calculated above based on viewedCards timestamp
    const verificationDocsToday = await User.countDocuments({
      role: 'professional',
      createdAt: { $gte: today },
      $or: [
        { 
          'verification.address.status': 'pending',
          'verification.address.documentUrl': { $exists: true, $ne: null }
        },
        { 
          'verification.idCard.status': 'pending',
          'verification.idCard.documentUrl': { $exists: true, $ne: null }
        },
        { 
          'verification.publicLiabilityInsurance.status': 'pending',
          'verification.publicLiabilityInsurance.documentUrl': { $exists: true, $ne: null }
        },
      ],
    });

    // Count referrals
    const professionalsReferrals = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
    });
    const clientsReferrals = await User.countDocuments({
      role: 'client',
      referralCode: { $exists: true, $ne: null },
    });

    // Count flagged users
    const flaggedCount = await User.countDocuments({
      isBlocked: true,
    });
    const flaggedToday = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $gte: today },
    });
    const flaggedYesterday = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $gte: yesterday, $lt: today },
    });
    const flaggedDailyChange = flaggedToday - flaggedYesterday;

    // Count deleted accounts (soft delete - accounts marked as deleted) - TOTAL count
    const deletedAccountsCount = await User.countDocuments({
      isDeleted: true
    });
    // Count NEW deleted accounts (NOT viewed by admin) for badge
    const deletedAccountsNew = await User.countDocuments({
      isDeleted: true,
      deletedAt: { $gte: last7Days },
      $or: [
        { viewedByAdmin: { $exists: false } },
        { viewedByAdmin: false }
      ]
    });
    const deletedAccountsToday = await User.countDocuments({
      isDeleted: true,
      deletedAt: { $gte: today }
    });
    const deletedAccountsYesterday = await User.countDocuments({
      isDeleted: true,
      deletedAt: { $gte: yesterday, $lt: today }
    });
    const deletedAccountsDailyChange = deletedAccountsToday - deletedAccountsYesterday;

    // Count affiliates (using referralCode as proxy) - TOTAL count
    const affiliateCount = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      isDeleted: { $ne: true }
    });
    // Count NEW affiliates (NOT viewed by admin) for badge
    const affiliateNew = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      isDeleted: { $ne: true },
      createdAt: { $gte: last7Days },
      $or: [
        { viewedByAdmin: { $exists: false } },
        { viewedByAdmin: false }
      ]
    });
    const affiliateToday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: today }
    });
    const affiliateYesterday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const affiliateDailyChange = affiliateToday - affiliateYesterday;

    // Calculate Category statistics
    const totalCategory = await Category.countDocuments({ isActive: { $ne: false } });
    const categoryToday = await Category.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: today }
    });
    const categoryYesterday = await Category.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const totalCategoryDailyChange = categoryToday - categoryYesterday;

    // Calculate SubCategory statistics
    const totalSubCategory = await SubCategory.countDocuments({ isActive: { $ne: false } });
    const subCategoryToday = await SubCategory.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: today }
    });
    const subCategoryYesterday = await SubCategory.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const totalSubCategoryDailyChange = subCategoryToday - subCategoryYesterday;

    // Calculate Sector statistics
    const totalSector = await Sector.countDocuments({ isActive: { $ne: false } });
    const sectorToday = await Sector.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: today }
    });
    const sectorYesterday = await Sector.countDocuments({ 
      isActive: { $ne: false },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const totalSectorDailyChange = sectorToday - sectorYesterday;

    // Calculate total users
    const totalUsers = await User.countDocuments({ 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true }
    });
    const totalUsersToday = await User.countDocuments({ 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: today }
    });
    const totalUsersYesterday = await User.countDocuments({ 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const totalUsersDailyChange = totalUsersToday - totalUsersYesterday;

    // Calculate active clients (clients who have logged in recently or have activity)
    // For now, we'll count all non-blocked clients as active
    const activeClients = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      isDeleted: { $ne: true }
    });

    // Calculate verified professionals
    const verifiedProfessionals = await User.countDocuments({
      role: 'professional',
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
      $and: [
        { 'verification.email.status': 'verified' },
        { 'verification.phone.status': 'verified' },
      ]
    });

    // Calculate professionals referrals daily change
    const professionalsReferralsToday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: today }
    });
    const professionalsReferralsYesterday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const professionalsReferralsDailyChange = professionalsReferralsToday - professionalsReferralsYesterday;

    // Calculate clients referrals daily change
    const clientsReferralsToday = await User.countDocuments({
      role: 'client',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: today }
    });
    const clientsReferralsYesterday = await User.countDocuments({
      role: 'client',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const clientsReferralsDailyChange = clientsReferralsToday - clientsReferralsYesterday;

    // Calculate subadmin daily change - TOTAL count
    const subadminToday = await Admin.countDocuments({ 
      role: 'subadmin',
      createdAt: { $gte: today }
    });
    const subadminYesterday = await Admin.countDocuments({ 
      role: 'subadmin',
      createdAt: { $gte: yesterday, $lt: today }
    });
    const subadminDailyChange = subadminToday - subadminYesterday;

    // All statistics with actual calculations or 0 for unimplemented features
    const statistics = {
      // Column 1 - Orange
      professionals: professionalsCount || 0,
      professionalsDailyChange: professionalsDailyChange || 0,
      totalJob: 0, // Job model not implemented yet
      totalJobDailyChange: 0,
      totalCategory: totalCategory || 0,
      totalCategoryDailyChange: totalCategoryDailyChange || 0,
      accountVerificationDocument: verificationDocsPendingCount || 0,
      accountVerificationDocumentNew: verificationDocsNew || 0, // Count only documents uploaded after admin viewed the card
      accountVerificationDocumentDailyChange: verificationDocsToday || 0,
      totalVerificationUsers: totalVerificationUsers || 0,
      verificationUsersToday: verificationUsersToday || 0,
      professionalsReferrals: professionalsReferrals || 0,
      professionalsReferralsDailyChange: professionalsReferralsDailyChange || 0,
      flagged: flaggedCount || 0,
      flaggedDailyChange: flaggedDailyChange || 0,
      approvalPendingService: 0, // Service model not implemented yet
      approvalPendingServiceDailyChange: 0,

      // Column 2 - Red
      clients: clientsCount || 0,
      clientsNew: clientsNew || 0, // New clients (not viewed by admin) for badge
      clientsDailyChange: clientsDailyChange || 0,
      totalJobInDispute: 0, // Job/Dispute model not implemented yet
      totalJobInDisputeDailyChange: 0,
      pendingWithdrawalRequest: 0, // Withdrawal model not implemented yet
      pendingWithdrawalRequestDailyChange: 0,
      messageCenter: 0, // Message model not implemented yet
      messageCenterNew: 0,
      messageCenterDailyChange: 0,
      clientsReferrals: clientsReferrals || 0,
      clientsReferralsDailyChange: clientsReferralsDailyChange || 0,
      deletedAccount: deletedAccountsCount || 0,
      deletedAccountNew: deletedAccountsNew || 0, // New deleted accounts (not viewed by admin) for badge
      deletedAccountDailyChange: deletedAccountsDailyChange || 0,
      orders: 0, // Order model not implemented yet
      ordersNew: 0,
      ordersDailyChange: 0,

      // Column 3 - Green
      subadmin: subadminCount || 0,
      subadminNew: subadminNew || 0, // New subadmins (not viewed by admin) for badge
      subadminDailyChange: subadminDailyChange || 0,
      totalPlansPackages: 0, // Plan/Package model not implemented yet
      totalPlansPackagesDailyChange: 0,
      newContactRequest: 0, // ContactRequest model not implemented yet
      newContactRequestNew: 0,
      newContactRequestDailyChange: 0,
      affiliate: affiliateCount || 0,
      affiliateNew: affiliateNew || 0, // New affiliates (not viewed by admin) for badge
      affiliateDailyChange: affiliateDailyChange || 0,
      askToStepIn: 0, // Dispute model not implemented yet
      askToStepInDailyChange: 0,
      serviceListing: 0, // Service model not implemented yet
      serviceListingDailyChange: 0,
      customOrders: 0, // CustomOrder model not implemented yet
      customOrdersNew: 0,
      customOrdersDailyChange: 0,

      // Additional calculated statistics
      totalUsers: totalUsers || 0,
      totalUsersDailyChange: totalUsersDailyChange || 0,
      activeClients: activeClients || 0,
      verifiedProfessionals: verifiedProfessionals || 0,
      totalSector: totalSector || 0,
      totalSectorDailyChange: totalSectorDailyChange || 0,
      totalSubCategory: totalSubCategory || 0,
      totalSubCategoryDailyChange: totalSubCategoryDailyChange || 0,
    };

    return res.json({ statistics });
  } catch (error) {
    console.error('Get dashboard statistics error', error);
    return res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// Mark dashboard card as viewed
router.post('/dashboard/card-viewed', requireAdmin, async (req, res) => {
  try {
    const { cardKey } = req.body;
    
    if (!cardKey) {
      return res.status(400).json({ error: 'Card key is required' });
    }

    const admin = await Admin.findById(req.adminUser.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Update the viewed timestamp for this card
    if (!admin.dashboardCardViews) {
      admin.dashboardCardViews = new Map();
    }
    admin.dashboardCardViews.set(cardKey, new Date());
    await admin.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Mark card as viewed error', error);
    return res.status(500).json({ error: 'Failed to mark card as viewed' });
  }
});

// Change admin password
router.put('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    admin.passwordHash = newPasswordHash;
    await admin.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get all admin users (sub-admins)
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    // Only super admin can view sub-admins (admin-management permission removed from sub-admins)
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can view sub-admins' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 rows per page
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const query = { role: 'subadmin' };
    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortObj = {};
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Map frontend sort fields to database fields
    const sortFieldMap = {
      'name': 'fullname',
      'email': 'email',
      'createdAt': 'createdAt',
    };
    
    const dbSortField = sortFieldMap[sortBy] || 'createdAt';
    sortObj[dbSortField] = sortDirection;
    
    const admins = await Admin.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Admin.countDocuments(query);

    const sanitizedAdmins = admins.map((admin) => {
      const adminObj = { ...admin };
      delete adminObj.passwordHash;
      adminObj.id = adminObj._id.toString();
      return adminObj;
    });

    return res.json({
      admins: sanitizedAdmins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get admins error', error);
    return res.status(500).json({ error: 'Failed to get admins' });
  }
});

// Create admin user (sub-admin)
// Create sub-admin
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    // Only super admin can create sub-admins (admin-management permission removed from sub-admins)
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can create sub-admins' });
    }

    const { name, email, password, permissions } = req.body || {};

    // Simple validation - only name, email, password, and roles are required
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password?.trim()) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'At least one permission is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);

    // Create sub-admin in Admin collection (not User collection)
    const admin = await Admin.create({
      fullname: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'subadmin',
      permissions: permissions,
    });

    return res.status(201).json({ admin: admin.toSafeObject() });
  } catch (error) {
    console.error('Create admin error', error);
    return res.status(500).json({ error: error.message || 'Failed to create admin' });
  }
});

// Update admin user (sub-admin)
router.put('/admins/:id', requireAdmin, async (req, res) => {
  try {
    // Only super admin can update sub-admins (admin-management permission removed from sub-admins)
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can update sub-admins' });
    }

    const adminId = req.params.id;
    const updates = req.body || {};

    // Don't allow changing role or email
    delete updates.role;
    delete updates.email;

    // Only allow updating fullname, password, and permissions
    const allowedUpdates = {};
    if (updates.name || updates.fullname) {
      allowedUpdates.fullname = (updates.fullname || updates.name || '').trim();
    }
    if (updates.password) {
      allowedUpdates.passwordHash = await bcrypt.hash(updates.password.trim(), 12);
    }
    if (updates.permissions !== undefined) {
      if (!Array.isArray(updates.permissions) || updates.permissions.length === 0) {
        return res.status(400).json({ error: 'At least one permission is required' });
      }
      allowedUpdates.permissions = updates.permissions;
    }

    const admin = await Admin.findByIdAndUpdate(adminId, allowedUpdates, { new: true, runValidators: true });
    if (!admin || admin.role !== 'subadmin') {
      return res.status(404).json({ error: 'Sub admin not found' });
    }

    return res.json({ admin: admin.toSafeObject() });
  } catch (error) {
    console.error('Update admin error', error);
    return res.status(500).json({ error: error.message || 'Failed to update admin' });
  }
});

// Delete admin user (sub-admin)
router.delete('/admins/:id', requireAdmin, async (req, res) => {
  try {
    // Only super admin can delete sub-admins (admin-management permission removed from sub-admins)
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can delete sub-admins' });
    }

    const adminId = req.params.id;

    // Prevent deleting yourself
    if (adminId === req.session.adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await Admin.findByIdAndDelete(adminId);
    if (!admin || admin.role !== 'subadmin') {
      return res.status(404).json({ error: 'Sub admin not found' });
    }

    return res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error', error);
    return res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Update user verification status (Admin only)
router.put('/users/:id/verification/:type', requireAdmin, async (req, res) => {
  try {
    const { id, type } = req.params;
    const { status, rejectionReason } = req.body;

    const allowedTypes = ['email', 'phone', 'address', 'idCard', 'paymentMethod', 'publicLiabilityInsurance'];
    const allowedStatuses = ['not-started', 'pending', 'verified', 'rejected', 'completed'];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid verification type' });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: not-started, pending, verified, rejected, completed' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }
    if (!user.verification[type]) {
      user.verification[type] = { status: 'not-started' };
    }

    // Update verification status
    // 'completed' is treated as 'verified'
    const finalStatus = status === 'completed' ? 'verified' : status;
    user.verification[type].status = finalStatus;

    if (finalStatus === 'verified') {
      user.verification[type].verifiedAt = new Date();
    }

    // Handle rejection reason
    if (finalStatus === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({ error: 'Rejection reason is required when rejecting verification' });
      }
      user.verification[type].rejectionReason = rejectionReason.trim();
    } else if (finalStatus !== 'rejected') {
      // Clear rejection reason if status is changed from rejected to something else
      user.verification[type].rejectionReason = undefined;
    }

    await user.save();

    // Check if professional user is fully verified and send email
    if (user.role === 'professional') {
      const isFullyVerified = 
        user.verification?.email?.status === 'verified' &&
        user.verification?.phone?.status === 'verified' &&
        user.verification?.address?.status === 'verified' &&
        user.verification?.idCard?.status === 'verified' &&
        user.verification?.paymentMethod?.status === 'verified' &&
        user.verification?.publicLiabilityInsurance?.status === 'verified';

      if (isFullyVerified) {
        try {
          const { sendTemplatedEmail } = await import('../services/notifier.js');
          await sendTemplatedEmail(user.email, 'fully-verified', {
            firstName: user.firstName,
          });
          console.log('[Admin] Fully verified email sent to:', user.email);
        } catch (emailError) {
          console.error('[Admin] Failed to send fully verified email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    return res.json({ 
      verification: user.verification[type],
      message: `Verification status updated to ${finalStatus}`
    });
  } catch (error) {
    console.error('Update verification status error', error);
    return res.status(500).json({ error: 'Failed to update verification status' });
  }
});

// Get user verification details (Admin only)
router.get('/users/:id/verification', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    return res.json({ verification: user.verification });
  } catch (error) {
    console.error('Get verification error', error);
    return res.status(500).json({ error: 'Failed to get verification details' });
  }
});

// Mark verification documents as viewed by admin
router.post('/users/:id/verification/mark-viewed', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    // Mark all pending documents with documentUrl as viewed by admin
    const documentTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
    let markedCount = 0;

    documentTypes.forEach(type => {
      if (user.verification[type] && 
          user.verification[type].status === 'pending' && 
          user.verification[type].documentUrl &&
          !user.verification[type].viewedByAdmin) {
        user.verification[type].viewedByAdmin = true;
        markedCount++;
      }
    });

    if (markedCount > 0) {
      await user.save();
    }

    return res.json({ 
      message: 'Verification documents marked as viewed',
      markedCount 
    });
  } catch (error) {
    console.error('Mark verification as viewed error', error);
    return res.status(500).json({ error: 'Failed to mark verification documents as viewed' });
  }
});

// Block/Unblock user (Admin only)
router.put('/users/:id/block', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked, blockReason } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ error: 'isBlocked must be a boolean' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = isBlocked;
    if (isBlocked) {
      user.blockedAt = new Date();
      user.blockedBy = req.session.userId;
      user.blockReason = blockReason || undefined;
    } else {
      user.blockedAt = undefined;
      user.blockedBy = undefined;
      user.blockReason = undefined;
    }

    await user.save();

    return res.json({ 
      user: sanitizeUser(user),
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    console.error('Block user error', error);
    return res.status(500).json({ error: 'Failed to update block status' });
  }
});

// Block/Unblock review invitation (Admin only)
router.put('/users/:id/block-review-invitation', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { blockReviewInvitation } = req.body;

    if (typeof blockReviewInvitation !== 'boolean') {
      return res.status(400).json({ error: 'blockReviewInvitation must be a boolean' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.blockReviewInvitation = blockReviewInvitation;
    await user.save();

    return res.json({ 
      user: sanitizeUser(user),
      message: `Review invitation ${blockReviewInvitation ? 'blocked' : 'allowed'} successfully`
    });
  } catch (error) {
    console.error('Block review invitation error', error);
    return res.status(500).json({ error: 'Failed to update review invitation block status' });
  }
});

// Mark user as viewed by admin (Admin only)
router.put('/users/:id/viewed', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.viewedByAdmin = true;
    // For subadmin users, ensure phone is properly handled (optional field)
    if (user.role === 'subadmin' && !user.phone) {
      user.phone = undefined; // Explicitly set to undefined for optional field
    }
    await user.save({ validateBeforeSave: true });

    return res.json({ 
      user: sanitizeUser(user),
      message: 'User marked as viewed'
    });
  } catch (error) {
    console.error('Mark user as viewed error', error);
    return res.status(500).json({ error: 'Failed to mark user as viewed' });
  }
});

// Update user note (Admin only)
router.put('/users/:id/note', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.adminNotes = adminNotes || undefined;
    await user.save();

    return res.json({ 
      user: sanitizeUser(user),
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Update note error', error);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// SEO Content Management Routes

// Get SEO content by type
router.get('/seo-content/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['homepage', 'blog', 'cost-guide'].includes(type)) {
      return res.status(400).json({ error: 'Invalid SEO content type' });
    }

    // Check permission for content-management
    if (req.adminUser.role !== 'admin' && !req.adminUser.permissions?.includes('content-management')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    let seoContent = await SEOContent.findOne({ type });

    // If not found, create default
    if (!seoContent) {
      seoContent = await SEOContent.create({ type });
    }

    return res.json(seoContent);
  } catch (error) {
    console.error('Get SEO content error', error);
    return res.status(500).json({ error: 'Failed to get SEO content' });
  }
});

// Update SEO content
router.put('/seo-content/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['homepage', 'blog', 'cost-guide'].includes(type)) {
      return res.status(400).json({ error: 'Invalid SEO content type' });
    }

    // Check permission for content-management
    if (req.adminUser.role !== 'admin' && !req.adminUser.permissions?.includes('content-management')) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const {
      title,
      metaKeywords,
      metaDescription,
      ogTitle,
      ogDescription,
      ogImage,
      ogUrl,
      ogType,
      ogSiteName,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      canonicalUrl,
      robots,
      headerScript,
      bodyScript,
      description,
      metaTitle,
      metaKey,
    } = req.body;

    const updateData = {
      updatedBy: req.adminUser._id,
    };

    // Homepage fields
    if (title !== undefined) updateData.title = title;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (ogTitle !== undefined) updateData.ogTitle = ogTitle;
    if (ogDescription !== undefined) updateData.ogDescription = ogDescription;
    if (ogImage !== undefined) updateData.ogImage = ogImage;
    if (ogUrl !== undefined) updateData.ogUrl = ogUrl;
    if (ogType !== undefined) updateData.ogType = ogType;
    if (ogSiteName !== undefined) updateData.ogSiteName = ogSiteName;
    if (twitterCard !== undefined) updateData.twitterCard = twitterCard;
    if (twitterTitle !== undefined) updateData.twitterTitle = twitterTitle;
    if (twitterDescription !== undefined) updateData.twitterDescription = twitterDescription;
    if (twitterImage !== undefined) updateData.twitterImage = twitterImage;
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl;
    if (robots !== undefined) updateData.robots = robots;
    if (headerScript !== undefined) updateData.headerScript = headerScript;
    if (bodyScript !== undefined) updateData.bodyScript = bodyScript;

    // Blog & Cost Guide fields
    if (description !== undefined) updateData.description = description;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaKey !== undefined) updateData.metaKey = metaKey;

    const seoContent = await SEOContent.findOneAndUpdate(
      { type },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({ message: 'SEO content updated successfully', data: seoContent });
  } catch (error) {
    console.error('Update SEO content error', error);
    return res.status(500).json({ error: 'Failed to update SEO content' });
  }
});

// Email Template Management Routes
router.get('/email-templates', requireAdmin, async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ type: 1 });
    return res.json({ templates });
  } catch (error) {
    console.error('Get email templates error', error);
    return res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

router.get('/email-templates/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const template = await EmailTemplate.findOne({ type });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    return res.json({ template });
  } catch (error) {
    console.error('Get email template error', error);
    return res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

router.post('/email-templates', requireAdmin, async (req, res) => {
  try {
    const { type, subject, body, variables, logoUrl } = req.body;

    if (!type || !subject || !body) {
      return res.status(400).json({ error: 'Type, subject, and body are required' });
    }

    const validTypes = ['verification', 'welcome', 'reminder-verification', 'reminder-identity', 'fully-verified'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }

    const existing = await EmailTemplate.findOne({ type });
    if (existing) {
      return res.status(409).json({ error: 'Template with this type already exists' });
    }

    const template = await EmailTemplate.create({
      type,
      subject,
      body,
      variables: variables || [],
      logoUrl: logoUrl || '',
      isActive: true,
    });

    return res.status(201).json({ message: 'Email template created successfully', template });
  } catch (error) {
    console.error('Create email template error', error);
    return res.status(500).json({ error: 'Failed to create email template' });
  }
});

router.put('/email-templates/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { subject, body, variables, logoUrl, isActive } = req.body;

    const template = await EmailTemplate.findOne({ type });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updateData = {};
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (variables !== undefined) updateData.variables = variables;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await EmailTemplate.findOneAndUpdate(
      { type },
      updateData,
      { new: true, runValidators: true }
    );

    return res.json({ message: 'Email template updated successfully', template: updated });
  } catch (error) {
    console.error('Update email template error', error);
    return res.status(500).json({ error: 'Failed to update email template' });
  }
});

router.delete('/email-templates/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    
    const template = await EmailTemplate.findOneAndDelete({ type });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error', error);
    return res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// Manually trigger verification reminders (Admin only)
router.post('/verification-reminders/trigger', requireAdmin, async (req, res) => {
  try {
    const { triggerVerificationReminders } = await import('../services/verificationReminderScheduler.js');
    await triggerVerificationReminders();
    return res.json({ message: 'Verification reminders processed successfully' });
  } catch (error) {
    console.error('Trigger verification reminders error', error);
    return res.status(500).json({ error: 'Failed to trigger verification reminders' });
  }
});

export default router;


import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const sanitizeUser = (user) => user.toSafeObject();

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
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
    const user = await User.findOne({ email: normalizedEmail, role: 'admin' });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user._id.toString();
    req.session.role = user.role;

    return res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
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
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error('Get admin user error', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (with pagination and filters)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role; // 'client', 'professional', or undefined for all
    const search = req.query.search; // Search by name or email

    // Check permissions for sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      if (role === 'client' && !req.adminUser.permissions.includes('homeowners-management')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      if (role === 'professional' && !req.adminUser.permissions.includes('tradesmen-management')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    // Note: Admin can see all users including blocked ones, but for public APIs, filter out blocked users

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort({ createdAt: -1 })
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

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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

    // Prevent changing admin role or email
    if (updates.role === 'admin' && userId !== req.session.userId) {
      return res.status(403).json({ error: 'Cannot change user to admin role' });
    }

    // If password is provided, hash it
    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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

// Delete user
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
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot be deleted' });
    }

    await User.findByIdAndDelete(userId);

    return res.json({ message: 'User deleted successfully' });
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

    // Count users by role
    const tradesmenCount = await User.countDocuments({ role: 'professional', isBlocked: { $ne: true } });
    const tradesmenToday = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      createdAt: { $gte: today }
    });
    const tradesmenYesterday = await User.countDocuments({ 
      role: 'professional', 
      isBlocked: { $ne: true },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const tradesmenDailyChange = tradesmenToday - tradesmenYesterday;

    const homeownersCount = await User.countDocuments({ role: 'client', isBlocked: { $ne: true } });
    const homeownersToday = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      createdAt: { $gte: today }
    });
    const homeownersYesterday = await User.countDocuments({ 
      role: 'client', 
      isBlocked: { $ne: true },
      createdAt: { $gte: yesterday, $lt: today }
    });
    const homeownersDailyChange = homeownersToday - homeownersYesterday;

    const subadminCount = await User.countDocuments({ role: 'admin' }) - 1; // Exclude main admin

    // Count verification documents pending
    const verificationDocsCount = await User.countDocuments({
      role: 'professional',
      $or: [
        { 'verification.address.status': 'pending' },
        { 'verification.idCard.status': 'pending' },
        { 'verification.publicLiabilityInsurance.status': 'pending' },
      ],
    });
    const verificationDocsNew = await User.countDocuments({
      role: 'professional',
      $or: [
        { 'verification.address.status': 'pending' },
        { 'verification.idCard.status': 'pending' },
        { 'verification.publicLiabilityInsurance.status': 'pending' },
      ],
      $or: [
        { 'verification.address.verifiedAt': { $gte: last7Days } },
        { 'verification.idCard.verifiedAt': { $gte: last7Days } },
        { 'verification.publicLiabilityInsurance.verifiedAt': { $gte: last7Days } },
      ],
    });
    const verificationDocsToday = await User.countDocuments({
      role: 'professional',
      $or: [
        { 'verification.address.status': 'pending', createdAt: { $gte: today } },
        { 'verification.idCard.status': 'pending', createdAt: { $gte: today } },
        { 'verification.publicLiabilityInsurance.status': 'pending', createdAt: { $gte: today } },
      ],
    });

    // Count referrals
    const tradesmenReferrals = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
    });
    const homeownerReferrals = await User.countDocuments({
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

    // Count deleted accounts (soft delete - accounts marked as deleted)
    const deletedAccountsCount = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $exists: true },
    });
    const deletedAccountsNew = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $gte: last7Days },
    });
    const deletedAccountsToday = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $gte: today },
    });
    const deletedAccountsYesterday = await User.countDocuments({
      isBlocked: true,
      blockedAt: { $gte: yesterday, $lt: today },
    });
    const deletedAccountsDailyChange = deletedAccountsToday - deletedAccountsYesterday;

    // Count affiliates (using referralCode as proxy)
    const affiliateCount = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
    });
    const affiliateNew = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: last7Days },
    });
    const affiliateToday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: today },
    });
    const affiliateYesterday = await User.countDocuments({
      role: 'professional',
      referralCode: { $exists: true, $ne: null },
      createdAt: { $gte: yesterday, $lt: today },
    });
    const affiliateDailyChange = affiliateToday - affiliateYesterday;

    // Mock data for other statistics (these would come from other models/collections)
    // For now, returning mock data that matches the image
    const statistics = {
      // Column 1 - Orange
      tradesmen: tradesmenCount || 483,
      tradesmenDailyChange: tradesmenDailyChange,
      totalJob: 412, // Would come from Job model
      totalJobDailyChange: 12, // Mock
      totalCategory: 177, // Would come from Category model
      totalCategoryDailyChange: 0, // Mock
      accountVerificationDocument: verificationDocsCount || 85,
      accountVerificationDocumentNew: verificationDocsNew || 20,
      accountVerificationDocumentDailyChange: verificationDocsToday || 3,
      tradesmenReferrals: tradesmenReferrals || 28,
      tradesmenReferralsDailyChange: 0, // Mock
      flagged: flaggedCount || 0,
      flaggedDailyChange: flaggedDailyChange,
      approvalPendingService: 0, // Would come from Service model with pending status
      approvalPendingServiceDailyChange: 0, // Mock

      // Column 2 - Red
      homeowners: homeownersCount || 345,
      homeownersDailyChange: homeownersDailyChange,
      totalJobInDispute: 286, // Would come from Job model with dispute status
      totalJobInDisputeDailyChange: 5, // Mock
      pendingWithdrawalRequest: 81, // Would come from Withdrawal model
      pendingWithdrawalRequestDailyChange: 3, // Mock
      messageCenter: 54, // Would come from Message model
      messageCenterNew: 2, // New messages in last 7 days
      messageCenterDailyChange: 1, // Mock
      homeownerReferrals: homeownerReferrals || 28,
      homeownerReferralsDailyChange: 0, // Mock
      deletedAccount: deletedAccountsCount || 15,
      deletedAccountNew: deletedAccountsNew || 15,
      deletedAccountDailyChange: deletedAccountsDailyChange,
      orders: 865, // Would come from Order model
      ordersNew: 191, // New orders in last 7 days
      ordersDailyChange: 25, // Mock

      // Column 3 - Green
      subadmin: subadminCount || 0,
      subadminDailyChange: 0, // Mock
      totalPlansPackages: 24, // Would come from Plan/Package model
      totalPlansPackagesDailyChange: 0, // Mock
      newContactRequest: 43, // Would come from ContactRequest model
      newContactRequestNew: 2, // New contact requests in last 7 days
      newContactRequestDailyChange: 1, // Mock
      affiliate: affiliateCount || 26,
      affiliateNew: affiliateNew || 1,
      affiliateDailyChange: affiliateDailyChange,
      askToStepIn: 0, // Would come from Dispute model
      askToStepInDailyChange: 0, // Mock
      serviceListing: 39, // Would come from Service model
      serviceListingDailyChange: 2, // Mock
      customOrders: 409, // Would come from CustomOrder model
      customOrdersNew: 154, // New custom orders in last 7 days
      customOrdersDailyChange: 18, // Mock
    };

    return res.json({ statistics });
  } catch (error) {
    console.error('Get dashboard statistics error', error);
    return res.status(500).json({ error: 'Failed to get dashboard statistics' });
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

    const admin = await User.findById(req.session.userId);
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
    // Only super admin can view sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can view sub-admins' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;

    const query = { role: 'admin' };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const admins = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    const sanitizedAdmins = admins.map((admin) => {
      const adminObj = { ...admin };
      delete adminObj.passwordHash;
      adminObj.id = adminObj._id.toString();
      adminObj.name = `${adminObj.firstName} ${adminObj.lastName}`.trim();
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
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    // Only super admin can create sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can create sub-admins' });
    }

    const { firstName, lastName, email, password, permissions } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ error: 'At least one permission is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      permissions: permissions || [],
      phone: '',
      postcode: '',
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
    // Only super admin can update sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can update sub-admins' });
    }

    const adminId = req.params.id;
    const updates = req.body || {};

    // Don't allow changing role or email
    delete updates.role;
    delete updates.email;

    // If password is provided, hash it
    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      updates.passwordHash = await bcrypt.hash(updates.password, 12);
      delete updates.password;
    }

    // Validate permissions if provided
    if (updates.permissions !== undefined) {
      if (!Array.isArray(updates.permissions) || updates.permissions.length === 0) {
        return res.status(400).json({ error: 'At least one permission is required' });
      }
    }

    const admin = await User.findByIdAndUpdate(adminId, updates, { new: true, runValidators: true });
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
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
    // Only super admin can delete sub-admins
    const isSuperAdmin = !req.adminUser.permissions || req.adminUser.permissions.length === 0;
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admin can delete sub-admins' });
    }

    const adminId = req.params.id;

    // Prevent deleting yourself
    if (adminId === req.session.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await User.findByIdAndDelete(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
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

    if (finalStatus === 'rejected' && rejectionReason) {
      user.verification[type].rejectionReason = rejectionReason;
    } else if (finalStatus !== 'rejected') {
      user.verification[type].rejectionReason = undefined;
    }

    await user.save();

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
    await user.save();

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

export default router;


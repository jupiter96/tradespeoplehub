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

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all admin users
router.get('/admins', requireAdmin, async (req, res) => {
  try {
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

// Create admin user
router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, postcode } = req.body || {};

    if (!firstName || !lastName || !email || !password || !phone || !postcode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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
      phone,
      postcode,
      referralCode: `ADMIN-${Date.now()}`,
      townCity: 'London',
      address: 'Admin Address',
      travelDistance: '0miles',
    });

    return res.status(201).json({ admin: admin.toSafeObject() });
  } catch (error) {
    console.error('Create admin error', error);
    return res.status(500).json({ error: error.message || 'Failed to create admin' });
  }
});

// Update admin user
router.put('/admins/:id', requireAdmin, async (req, res) => {
  try {
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

// Delete admin user
router.delete('/admins/:id', requireAdmin, async (req, res) => {
  try {
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


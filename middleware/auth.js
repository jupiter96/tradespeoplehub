import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Middleware to authenticate user via session (supports both regular users and admins)
export const authenticateToken = async (req, res, next) => {
  try {
    // Check for admin session first
    if (req.session?.adminId) {
      const admin = await Admin.findById(req.session.adminId);
      if (!admin) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'Admin not found' });
      }

      // Attach admin to request as user
      req.user = {
        id: admin._id.toString(),
        role: admin.role,
        isAdmin: true,
        permissions: admin.permissions || [],
      };
      return next();
    }

    // Check for regular user session
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is deleted or blocked
    if (user.isDeleted) {
      req.session.destroy(() => {});
      return res.status(403).json({ error: 'This account has been deleted' });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      isAdmin: false,
      email: user.email, // Add email for debugging
    };

    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to require specific roles
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Super admin (no permissions array or empty) has access to everything
      if (req.user.isAdmin && (!req.user.permissions || req.user.permissions.length === 0)) {
        return next();
      }

      // Check if user has the required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // For subadmins, check if they have the required permission
      if (req.user.role === 'subadmin' && req.user.permissions) {
        // For service management, check 'service' permission
        if (allowedRoles.includes('subadmin')) {
          const hasServicePermission = req.user.permissions.includes('service');
          if (!hasServicePermission) {
            return res.status(403).json({ error: 'Insufficient permissions' });
          }
        }
      }

      next();
    } catch (error) {
      // console.error('Role check error', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};


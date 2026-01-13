import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import Review from '../models/Review.js';
import PendingRegistration from '../models/PendingRegistration.js';
import SEOContent from '../models/SEOContent.js';
import SocialAuthError from '../models/SocialAuthError.js';
import passport from '../services/passport.js';
import {
  sendEmailVerificationCode,
  sendSmsVerificationCode,
  sendPasswordResetEmail,
  sendTemplatedEmail,
} from '../services/notifier.js';

// Load environment variables
dotenv.config();

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

const sanitizeUser = (user) => user.toSafeObject();

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// Normalize phone number: remove country code and spaces
const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  let cleaned = phone.trim();
  
  // Remove common country code patterns
  // UK: +44, 44, 0044
  cleaned = cleaned.replace(/^(\+44|44|0044)\s*/i, '');
  
  // US/Canada: +1, 1, 001
  cleaned = cleaned.replace(/^(\+1|1|001)\s*/i, '');
  
  // Other common patterns: +XX, XX, 00XX (1-3 digits)
  cleaned = cleaned.replace(/^(\+\d{1,3}|\d{1,3}|00\d{1,3})\s*/i, (match) => {
    const digits = match.replace(/[^\d]/g, '');
    if (digits.length >= 1 && digits.length <= 3) {
      return '';
    }
    return match;
  });
  
  // Remove all spaces and non-digit characters
  cleaned = cleaned.replace(/\D/g, '');
  
  return cleaned || null;
};

// Convert phone number to E.164 format for Twilio (e.g., +447481709218)
// Input from frontend: already includes country code (e.g., 447481709218, 11234567890)
// Automatically detects country code from the phone number itself
// UK numbers: Remove leading 0 if present after country code
const formatPhoneForTwilio = (phone, defaultCountryCode = '+44') => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  // Remove all spaces, hyphens, parentheses, and other non-digit characters except +
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  
  // If already in E.164 format, validate and return
  if (cleaned.startsWith('+')) {
    // Remove + temporarily to process
    let digitsOnly = cleaned.substring(1).replace(/\D/g, '');
    if (!digitsOnly) {
      return null;
    }
    // Return with + prefix, ensuring no spaces or special characters
    return '+' + digitsOnly;
  }
  
  // Remove all non-digit characters
  let digitsOnly = cleaned.replace(/\D/g, '');
  
  if (!digitsOnly) {
    return null;
  }
  
  // Auto-detect country code from the phone number
  // Common country codes: 1 (US/Canada), 44 (UK), 2-digit codes (20-99), 3-digit codes (100-999)
  
  // Case 1: UK (44) - most common for this application
  if (digitsOnly.startsWith('44')) {
    let after44 = digitsOnly.substring(2);
    // Remove leading 0 if present (UK national format: 07481709218 -> 7481709218)
    if (after44.startsWith('0')) {
      after44 = after44.substring(1);
    }
    // Validate: UK numbers are 9-10 digits after country code
    if (after44.length >= 9 && after44.length <= 10) {
      return '+44' + after44;
    }
    // If length is 11-12, might already be correct (44 + 9-10 digits)
    if (digitsOnly.length >= 11 && digitsOnly.length <= 12) {
      // Double check: after removing 44, should have 9-10 digits
      let checkAfter44 = digitsOnly.substring(2);
      if (checkAfter44.startsWith('0')) {
        checkAfter44 = checkAfter44.substring(1);
      }
      if (checkAfter44.length >= 9 && checkAfter44.length <= 10) {
        return '+44' + checkAfter44;
      }
      // If no leading 0 and length is correct, return as is
      if (checkAfter44.length >= 9 && checkAfter44.length <= 10) {
        return '+' + digitsOnly;
      }
    }
    // If too short, reject
    return null;
  }
  
  // Case 2: US/Canada (1) - but not if it's part of the number (11, 12, etc.)
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11 && 
      !digitsOnly.match(/^1[1-9]/)) {
    // US/Canada numbers are exactly 11 digits (1 + 10 digits)
    return '+' + digitsOnly;
  }
  
  // Case 3: Other 2-digit country codes (20-99)
  // Check if first 2 digits could be a country code
  if (digitsOnly.length >= 11) {
    const firstTwo = digitsOnly.substring(0, 2);
    const countryCode = parseInt(firstTwo);
    if (countryCode >= 20 && countryCode <= 99) {
      const afterCode = digitsOnly.substring(2);
      // Most countries have 7-15 digits after country code
      if (afterCode.length >= 7 && afterCode.length <= 15) {
        // Check if there's a leading 0 after country code (common in some countries)
        let finalNumber = afterCode;
        if (afterCode.startsWith('0') && afterCode.length >= 8) {
          finalNumber = afterCode.substring(1);
        }
        // Validate final number length
        if (finalNumber.length >= 7 && finalNumber.length <= 15) {
          return '+' + firstTwo + finalNumber;
        }
        return '+' + digitsOnly;
      }
    }
  }
  
  // Case 4: Other 3-digit country codes (100-999)
  if (digitsOnly.length >= 12) {
    const firstThree = digitsOnly.substring(0, 3);
    const countryCode = parseInt(firstThree);
    if (countryCode >= 100 && countryCode <= 999) {
      const afterCode = digitsOnly.substring(3);
      // Most countries have 7-15 digits after country code
      if (afterCode.length >= 7 && afterCode.length <= 15) {
        // Check if there's a leading 0 after country code
        let finalNumber = afterCode;
        if (afterCode.startsWith('0') && afterCode.length >= 8) {
          finalNumber = afterCode.substring(1);
        }
        // Validate final number length
        if (finalNumber.length >= 7 && finalNumber.length <= 15) {
          return '+' + firstThree + finalNumber;
        }
        return '+' + digitsOnly;
      }
    }
  }
  
  // Case 5: Starts with 0 (likely UK national format without country code)
  if (digitsOnly.startsWith('0')) {
    let withoutLeadingZero = digitsOnly.substring(1);
    // UK numbers are 9-10 digits after removing leading 0
    if (withoutLeadingZero.length >= 9 && withoutLeadingZero.length <= 10) {
      return '+44' + withoutLeadingZero;
    }
  }
  
  // Case 6: No country code detected, use default (fallback)
  // If length is 9-10 digits, assume UK number (default for this application)
  if (digitsOnly.length >= 9 && digitsOnly.length <= 10) {
    const defaultCodeDigits = defaultCountryCode.replace(/\D/g, '');
    return '+' + defaultCodeDigits + digitsOnly;
  }
  
  // If we can't determine the format, validate minimum length before returning
  // E.164 format requires: country code (1-3 digits) + subscriber number (minimum 4-7 digits depending on country)
  // Minimum total length should be at least 8-10 digits for most countries
  if (digitsOnly.length < 8) {
    return null;
  }
  
  // If we can't determine the format but length is acceptable, return as is with + prefix
  // This will likely fail Twilio validation, but at least we tried
  return '+' + digitsOnly;
};

const cookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

const CODE_LENGTH = 4;
const CODE_EXPIRATION_MINUTES = 10;
const registrationSessionKey = 'pendingRegistrationId';

// Generate unique 6-digit reference ID
const generateReferenceId = async () => {
  let referenceId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-digit number (100000 to 999999)
    referenceId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if it's unique
    const existingUser = await User.findOne({ referenceId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique reference ID after multiple attempts');
  }

  return referenceId;
};
const socialSessionKey = 'pendingSocialProfile';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5000';
const SOCIAL_SUCCESS_REDIRECT =
  process.env.SOCIAL_SUCCESS_REDIRECT || `${CLIENT_ORIGIN}/account`;
const SOCIAL_FAILURE_REDIRECT =
  process.env.SOCIAL_FAILURE_REDIRECT || `${CLIENT_ORIGIN}/login?social=failed`;

// Helper function to add query parameters to URL
const addQueryParam = (url, key, value) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
};
const SOCIAL_ONBOARDING_REDIRECT =
  process.env.SOCIAL_ONBOARDING_REDIRECT || `${CLIENT_ORIGIN}/social-onboarding`;
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || `${CLIENT_ORIGIN}/reset-password`;
const googleAuthEnabled =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL;
const facebookAuthEnabled =
  process.env.FACEBOOK_CLIENT_ID &&
  process.env.FACEBOOK_CLIENT_SECRET &&
  process.env.FACEBOOK_CALLBACK_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // console.warn('⚠️ Cloudinary credentials not found in environment variables.');
  // console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (Cloudinary requires buffer)
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

// Configure multer for verification documents
const verificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, JPG, or PNG.'));
    }
  },
});

const verificationUploadMiddleware = verificationUpload.single('document');

const generateCode = () => {
  const code = Math.floor(10 ** (CODE_LENGTH - 1) + Math.random() * 9 * 10 ** (CODE_LENGTH - 1)).toString();
  // console.log('[Code Generation] Generated verification code:', {
  //   code: code,
  //   codeLength: code.length,
  //   expectedLength: CODE_LENGTH,
  //   timestamp: new Date().toISOString()
  // });
  return code;
};
const codeExpiryDate = () => new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);
const isValidCode = (code) =>
  typeof code === 'string' && code.length === CODE_LENGTH && /^\d+$/.test(code);

const requireAuth = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Reject admin users - they should only access admin dashboard
  try {
    const user = await User.findById(req.session.userId);
    if (user && (user.role === 'admin' || user.role === 'subadmin')) {
      return res.status(403).json({ error: 'Admin users cannot access regular user features' });
    }
  } catch (error) {
    // console.error('Error checking user role in requireAuth', error);
  }
  
  return next();
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
};

const setPendingRegistrationSession = (req, registrationId) => {
  req.session[registrationSessionKey] = registrationId;
};

const saveSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        // console.error('[Session] Failed to save session:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const clearPendingRegistrationSession = (req) => {
  delete req.session[registrationSessionKey];
};

const loadPendingRegistration = async (req, email = null) => {
  // console.log('[loadPendingRegistration] Starting load:', {
  //   hasSession: !!req.session,
  //   sessionId: req.session?.id,
  //   registrationId: req.session?.[registrationSessionKey],
  //   providedEmail: email,
  // });

  // First try to load from session
  const registrationId = req.session?.[registrationSessionKey];
  if (registrationId) {
    try {
      // console.log('[loadPendingRegistration] Trying to load by session ID:', registrationId);
    const pending = await PendingRegistration.findById(registrationId);
      if (pending) {
        // console.log('[loadPendingRegistration] Found by session ID:', pending._id);
        return pending;
      }
      // If not found, clear session
      // console.log('[loadPendingRegistration] Not found by session ID, clearing session');
      clearPendingRegistrationSession(req);
    } catch (error) {
      // console.error('[loadPendingRegistration] Failed to load pending registration by ID', error);
    }
  }

  // Fallback: try to load by email if provided
  if (email) {
    try {
      const normalizedEmail = normalizeEmail(email);
      // console.log('[loadPendingRegistration] Trying to load by email:', normalizedEmail);
      const pending = await PendingRegistration.findOne({ email: normalizedEmail });
      if (pending) {
        // console.log('[loadPendingRegistration] Found by email, updating session:', pending._id);
        // Update session with found registration
        setPendingRegistrationSession(req, pending.id);
        await saveSession(req);
    return pending;
      } else {
        // console.log('[loadPendingRegistration] Not found by email:', normalizedEmail);
      }
  } catch (error) {
      // console.error('[loadPendingRegistration] Failed to load pending registration by email', error);
  }
  }

  // console.log('[loadPendingRegistration] No pending registration found');
  return null;
};

const setPendingSocialProfile = (req, profile) => {
  req.session[socialSessionKey] = profile;
};

const getPendingSocialProfile = (req) => req.session?.[socialSessionKey] || null;

const clearPendingSocialProfile = (req) => {
  delete req.session[socialSessionKey];
};

// Helper function to save social auth errors to database
const saveSocialAuthError = async (provider, errorType, errorMessage, req, additionalData = {}) => {
  try {
    const errorData = {
      provider,
      errorType,
      errorMessage: errorMessage || 'Unknown error',
      errorStack: additionalData.error?.stack || null,
      errorDetails: additionalData.error ? {
        name: additionalData.error.name,
        message: additionalData.error.message,
        code: additionalData.error.code,
        status: additionalData.error.status,
        ...(additionalData.errorDetails || {}),
      } : (additionalData.errorDetails || {}),
      providerId: additionalData.providerId || null,
      email: additionalData.email || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.get('user-agent') || null,
      requestUrl: req.originalUrl || req.url || null,
      queryParams: req.query || {},
      sessionId: req.sessionID || null,
      context: {
        profile: additionalData.profile ? {
          id: additionalData.profile.id,
          displayName: additionalData.profile.displayName,
          hasEmail: !!additionalData.profile.emails?.[0]?.value,
          hasName: !!additionalData.profile.name,
        } : null,
        result: additionalData.result ? {
          needsProfile: additionalData.result.needsProfile,
          isDeleted: additionalData.result.isDeleted,
          isBlocked: additionalData.result.isBlocked,
          role: additionalData.result.role,
        } : null,
        ...(additionalData.context || {}),
      },
    };

    await SocialAuthError.create(errorData);
    // console.log(`✅ Social auth error saved to database: ${provider} - ${errorType}`);
  } catch (saveError) {
    // Don't throw error if saving fails - just log it
    // console.error('Failed to save social auth error to database:', saveError);
  }
};

const handleSocialCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, async (err, result, info) => {
    if (err) {
      // console.error(`${provider} auth error:`, err);
      // console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      // Save error to database
      await saveSocialAuthError(
        provider,
        'auth_error',
        err.message || err.toString() || 'Authentication error',
        req,
        {
          error: err,
          errorDetails: {
            ...(err.response ? { response: err.response } : {}),
            ...(err.data ? { data: err.data } : {}),
          },
        }
      );
      
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', 'auth_error'));
    }

    // Handle case where user is rejected (e.g., deleted account, blocked, etc.)
    if (info && info.message) {
      // console.error(`${provider} auth info:`, info.message);
      
      // Determine error type based on message
      let errorType = 'user_rejected';
      if (info.message.includes('deleted')) {
        errorType = 'account_deleted';
      } else if (info.message.includes('suspended') || info.message.includes('blocked')) {
        errorType = 'account_blocked';
      }
      
      // Save error to database
      await saveSocialAuthError(
        provider,
        errorType,
        info.message,
        req,
        {
          info,
          providerId: result?.providerId || null,
          email: result?.email || null,
        }
      );
      
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', info.message));
    }

    if (!result) {
      // console.error(`${provider} auth failed: No result returned`);
      
      // Save error to database
      await saveSocialAuthError(
        provider,
        'no_result',
        'No result returned from authentication',
        req,
        {
          info,
        }
      );
      
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', 'no_result'));
    }

    if (result.needsProfile) {
      setPendingSocialProfile(req, {
        provider,
        providerId: result.providerId,
        email: result.email || '',
        firstName: result.firstName || '',
        lastName: result.lastName || '',
      });
      return res.redirect(SOCIAL_ONBOARDING_REDIRECT);
    }

    // Check if user is deleted
    if (result.isDeleted) {
      await saveSocialAuthError(
        provider,
        'account_deleted',
        'User account has been deleted',
        req,
        {
          result: {
            providerId: result.providerId || result._id?.toString(),
            email: result.email,
          },
        }
      );
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', 'account_deleted'));
    }

    // Check if user is blocked
    if (result.isBlocked) {
      await saveSocialAuthError(
        provider,
        'account_blocked',
        'User account has been blocked',
        req,
        {
          result: {
            providerId: result.providerId || result._id?.toString(),
            email: result.email,
          },
        }
      );
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', 'account_blocked'));
    }

    // Reject admin users - they must use admin login
    if (result.role === 'admin' || result.role === 'subadmin') {
      await saveSocialAuthError(
        provider,
        'admin_not_allowed',
        'Admin users cannot login via social auth',
        req,
        {
          result: {
            providerId: result.providerId || result._id?.toString(),
            email: result.email,
            role: result.role,
          },
        }
      );
      clearPendingSocialProfile(req);
      return res.redirect(addQueryParam(SOCIAL_FAILURE_REDIRECT, 'error', 'admin_not_allowed'));
    }

    req.logIn(result, async (loginErr) => {
      if (loginErr) {
        // console.error(`${provider} login error`, loginErr);
        
        // Save error to database
        await saveSocialAuthError(
          provider,
          'login_error',
          loginErr.message || loginErr.toString() || 'Login error',
          req,
          {
            error: loginErr,
            result: {
              providerId: result.providerId || result._id?.toString(),
              email: result.email,
            },
          }
        );
        
        return res.redirect(SOCIAL_FAILURE_REDIRECT);
      }
      
      // Set session role and userId
      req.session.role = result.role;
      req.session.userId = result._id ? result._id.toString() : result.id;
      
      // Set cookie maxAge to 24 hours
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 24 hours
      
      // Save session before redirecting to ensure session is persisted
      req.session.save(async (saveErr) => {
        if (saveErr) {
          // console.error(`${provider} session save error`, saveErr);
          
          // Save error to database
          await saveSocialAuthError(
            provider,
            'session_error',
            saveErr.message || saveErr.toString() || 'Session save error',
            req,
            {
              error: saveErr,
              result: {
                providerId: result.providerId || result._id?.toString(),
                email: result.email,
              },
            }
          );
          
          return res.redirect(SOCIAL_FAILURE_REDIRECT);
        }
        
        // console.log(`${provider} login successful for user:`, result.email || result._id || result.id);
      return res.redirect(SOCIAL_SUCCESS_REDIRECT);
      });
    });
  })(req, res, next);
};

if (googleAuthEnabled) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
    })
  );
  router.get('/google/callback', handleSocialCallback('google'));
} else {
  router.get('/google', (req, res) =>
    res.status(503).json({ error: 'Google authentication is not configured' })
  );
}

if (facebookAuthEnabled) {
  router.get(
    '/facebook',
    passport.authenticate('facebook', {
      scope: ['email'],
      authType: 'reauthenticate',
    })
  );
  router.get('/facebook/callback', handleSocialCallback('facebook'));
} else {
  router.get('/facebook', (req, res) =>
    res.status(503).json({ error: 'Facebook authentication is not configured' })
  );
}

const validateUserType = (userType) => ['client', 'professional'].includes(userType);

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

const validateRegistrationPayload = (payload, { requirePassword } = { requirePassword: true }) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    postcode,
    userType,
    tradingName,
    townCity,
    address,
    travelDistance,
  } = payload;

  if (
    !firstName ||
    !lastName ||
    !email ||
    (requirePassword && !password) ||
    !phone ||
    !postcode ||
    !userType
  ) {
    return 'Missing required fields';
  }

  if (!validateUserType(userType)) {
    return 'Invalid user type';
  }

  // Address is required for both client and professional
  if (!address || !address.trim()) {
    return 'Address is required';
  }

  // For professionals: tradingName and travelDistance are required
  if (userType === 'professional') {
    if (!tradingName || !tradingName.trim()) {
      return 'Trading name is required for professionals';
    }
    if (!travelDistance || !travelDistance.trim()) {
      return 'Travel distance is required for professionals';
    }
  }

  return null;
};

router.post('/register/initiate', async (req, res) => {
  try {
    const validationError = validateRegistrationPayload(req.body || {});

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      postcode,
      referralCode,
      userType,
      tradingName,
      townCity,
      county,
      address,
      travelDistance,
    } = req.body;


    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check for deleted users first - they cannot re-register
    const deletedUser = await User.findOne({ email: normalizedEmail, isDeleted: true });
    if (deletedUser) {
      return res.status(403).json({ error: 'This account has been deleted and cannot be re-registered' });
    }

    // Check if user already exists (active users only)
    const existingUser = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Check if phone number is already in use by another active user
    const existingPhoneUser = await User.findOne({ 
      phone: normalizedPhone, 
      isDeleted: { $ne: true },
      _id: { $ne: existingUser?._id } // Exclude current user if checking during update
    });
    if (existingPhoneUser) {
      // console.log('[Registration] Phone number already in use:', {
      //   phone: normalizedPhone,
      //   existingUserId: existingPhoneUser._id,
      //   existingUserEmail: existingPhoneUser.email
      // });
      return res.status(409).json({ error: 'This phone number is already registered to another account' });
    }

    // Check if there's an existing pending registration
    let existingPending = await PendingRegistration.findOne({ email: normalizedEmail });
    
    // If there's an existing pending registration that's not expired, reuse it
    if (existingPending) {
      const now = new Date();
      const isExpired = existingPending.expiresAt && existingPending.expiresAt < now;
      const emailCodeExpired = existingPending.emailCodeExpiresAt && existingPending.emailCodeExpiresAt < now;
      
      // If expired, delete it and create a new one
      if (isExpired || (emailCodeExpired && !existingPending.emailVerified)) {
        // console.log('[Registration] Existing pending registration expired, creating new one');
        await existingPending.deleteOne();
        existingPending = null;
      } else {
        // If not expired and not fully verified, update it with new data
        // console.log('[Registration] Found existing pending registration, updating with new data');
        existingPending.firstName = firstName;
        existingPending.lastName = lastName;
        existingPending.phone = phone;
        existingPending.postcode = postcode;
        existingPending.referralCode = referralCode;
        existingPending.role = userType;
        
        // Update professional fields if applicable
        if (userType === 'professional') {
          if (tradingName !== undefined && tradingName !== null) {
            const trimmedTradingName = String(tradingName).trim();
            if (trimmedTradingName) {
              existingPending.tradingName = trimmedTradingName;
            }
          }
          if (travelDistance !== undefined && travelDistance !== null) {
            const trimmedTravelDistance = String(travelDistance).trim();
            if (trimmedTravelDistance) {
              existingPending.travelDistance = trimmedTravelDistance;
            }
          }
        }
        
        // Update address fields
        if (address !== undefined && address !== null) {
          const trimmedAddress = String(address).trim();
          if (trimmedAddress) {
            existingPending.address = trimmedAddress;
          }
        }
        if (townCity !== undefined && townCity !== null) {
          const trimmedTownCity = String(townCity).trim();
          if (trimmedTownCity) {
            existingPending.townCity = trimmedTownCity;
          }
        }
        if (county !== undefined && county !== null) {
          const trimmedCounty = String(county).trim();
          if (trimmedCounty) {
            existingPending.county = trimmedCounty;
          }
        }
        
        // Generate new email code if not already verified
        if (!existingPending.emailVerified) {
          // console.log('[Registration] Generating new email code for existing pending registration:', {
          //   email: normalizedEmail,
          //   pendingId: existingPending._id
          // });
          
    const emailCode = generateCode();
          // console.log('[Registration] Email code generated:', {
          //   code: emailCode,
          //   codeLength: emailCode.length,
          //   timestamp: new Date().toISOString()
          // });
          
    const emailCodeHash = await bcrypt.hash(emailCode, 10);
          // console.log('[Registration] Email code hash created:', {
          //   hasHash: !!emailCodeHash,
          //   hashLength: emailCodeHash?.length || 0
          // });
          
          existingPending.emailCodeHash = emailCodeHash;
          existingPending.emailCodeExpiresAt = codeExpiryDate();
          existingPending.emailVerified = false;
          
          // Update password hash
          const passwordHash = await bcrypt.hash(password, 12);
          existingPending.passwordHash = passwordHash;
          
          // Reset expiration
          existingPending.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          
          // console.log('[Registration] Saving updated pending registration:', {
          //   email: normalizedEmail,
          //   hasEmailCodeHash: !!existingPending.emailCodeHash,
          //   emailCodeExpiresAt: existingPending.emailCodeExpiresAt,
          //   expiresAt: existingPending.expiresAt
          // });
          
          await existingPending.save();
          // console.log('[Registration] Pending registration saved successfully');
          
          // console.log('[Registration] Calling sendEmailVerificationCode:', {
          //   email: normalizedEmail,
          //   code: emailCode,
          //   timestamp: new Date().toISOString()
          // });
          
          try {
            const emailResult = await sendEmailVerificationCode(normalizedEmail, emailCode, existingPending.firstName || 'User');
            // console.log('[Registration] Email verification code sent successfully:', {
            //   email: normalizedEmail,
            //   result: emailResult ? {
            //     messageId: emailResult.messageId,
            //     response: emailResult.response
            //   } : 'no result',
            //   timestamp: new Date().toISOString()
            // });
          } catch (notificationError) {
            // console.error('[Registration] Failed to send verification email:', {
            //   error: notificationError.message,
            //   code: notificationError.code,
            //   command: notificationError.command,
            //   response: notificationError.response,
            //   responseCode: notificationError.responseCode,
            //   stack: notificationError.stack,
            //   email: normalizedEmail,
            //   timestamp: new Date().toISOString()
            // });
            if (isProduction) {
              // console.warn('[Registration] Continuing registration flow despite email send failure (production mode)');
            } else {
              return res.status(502).json({ error: 'Failed to send verification email' });
            }
          }
          
          setPendingRegistrationSession(req, existingPending.id);
          await saveSession(req);
          
          return res.status(200).json({ 
            message: 'Email verification code sent',
            emailCode: emailCode
          });
        } else {
          // Email already verified, just send phone code if needed
          if (!existingPending.phoneCodeHash || 
              (existingPending.phoneCodeExpiresAt && existingPending.phoneCodeExpiresAt < new Date())) {
            const smsCode = generateCode();
            const smsCodeHash = await bcrypt.hash(smsCode, 10);
            existingPending.phoneCodeHash = smsCodeHash;
            existingPending.phoneCodeExpiresAt = codeExpiryDate();
            
            await existingPending.save();
            
            try {
              // console.log('[Phone Code] Backend - Existing Registration - Step 1: Preparing to send SMS');
              // console.log('[Phone Code] Backend - Existing Registration - Step 1.1: Phone number:', existingPending.phone);
              // console.log('[Phone Code] Backend - Existing Registration - Step 1.2: SMS code generated:', smsCode);
              // Format phone number to E.164 for Twilio
              const twilioPhone = formatPhoneForTwilio(existingPending.phone);
              if (!twilioPhone) {
                throw new Error('Invalid phone number format. Phone number is too short or invalid.');
              }
              await sendSmsVerificationCode(twilioPhone, smsCode);
              // console.log('[Phone Code] Backend - Existing Registration - Step 3: SMS sent successfully');
            } catch (notificationError) {
              // console.error('[Phone Code] Backend - Existing Registration - ERROR: Failed to send SMS code');
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.1: Error object:', notificationError);
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.2: Error message:', notificationError.message);
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.3: Twilio error code:', notificationError.code);
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.4: Twilio error status:', notificationError.status);
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.5: Twilio error moreInfo:', notificationError.moreInfo);
              // console.error('[Phone Code] Backend - Existing Registration - ERROR.6: Full error details:', {
              //   message: notificationError.message,
              //   code: notificationError.code,
              //   status: notificationError.status,
              //   moreInfo: notificationError.moreInfo,
              //   twilioErrorCode: notificationError.twilioErrorCode,
              //   twilioErrorMessage: notificationError.twilioErrorMessage,
              //   twilioErrorMoreInfo: notificationError.twilioErrorMoreInfo,
              //   userMessage: notificationError.userMessage,
              //   stack: notificationError.stack
              // });
              
              if (isProduction) {
                // console.warn('[Phone Code] Backend - Existing Registration - Continuing registration flow despite SMS send failure (production mode)');
              } else {
                // Return detailed error message to user
                const errorMessage = notificationError.userMessage || 
                  `Failed to send SMS code. ${notificationError.message || 'Unknown error'}. ` +
                  (notificationError.code ? `Twilio Error Code: ${notificationError.code}. ` : '') +
                  (notificationError.moreInfo ? `Details: ${notificationError.moreInfo}` : '');
                return res.status(502).json({ 
                  error: errorMessage,
                  twilioErrorCode: notificationError.code,
                  twilioErrorMessage: notificationError.message,
                  twilioErrorMoreInfo: notificationError.moreInfo
                });
              }
            }
            
            setPendingRegistrationSession(req, existingPending.id);
            await saveSession(req);
            
            return res.status(200).json({ 
              message: 'Phone verification code sent',
              phoneCode: smsCode
            });
          }
          
          setPendingRegistrationSession(req, existingPending.id);
          await saveSession(req);
          return res.status(200).json({ 
            message: 'Registration in progress. Please verify your phone number.',
            phoneCode: null
          });
        }
      }
    }

    // Create new pending registration
    // console.log('[Registration] Creating new pending registration:', {
    //   email: normalizedEmail,
    //   userType: userType,
    //   timestamp: new Date().toISOString()
    // });
    
    const passwordHash = await bcrypt.hash(password, 12);
    // console.log('[Registration] Password hash created:', {
    //   hasHash: !!passwordHash,
    //   hashLength: passwordHash?.length || 0
    // });
    
    const emailCode = generateCode();
    // console.log('[Registration] Email code generated:', {
    //   code: emailCode,
    //   codeLength: emailCode.length,
    //   timestamp: new Date().toISOString()
    // });
    
    const emailCodeHash = await bcrypt.hash(emailCode, 10);
    // console.log('[Registration] Email code hash created:', {
    //   hasHash: !!emailCodeHash,
    //   hashLength: emailCodeHash?.length || 0
    // });

    const pendingRegistrationData = {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone,
      postcode,
      referralCode,
      role: userType,
      emailCodeHash,
      emailCodeExpiresAt: codeExpiryDate(),
    };

    // Professional-specific fields
    if (userType === 'professional') {
      // Always set tradingName if it exists (even if empty string, it will be trimmed)
      if (tradingName !== undefined && tradingName !== null) {
        const trimmedTradingName = String(tradingName).trim();
        if (trimmedTradingName) {
          pendingRegistrationData.tradingName = trimmedTradingName;
        }
      }
      if (travelDistance !== undefined && travelDistance !== null) {
        const trimmedTravelDistance = String(travelDistance).trim();
        if (trimmedTravelDistance) {
          pendingRegistrationData.travelDistance = trimmedTravelDistance;
        }
      }
    }

    // Address fields - available for both client and professional
    // Always set address if it exists (even if empty string, it will be trimmed)
    if (address !== undefined && address !== null) {
      const trimmedAddress = String(address).trim();
      if (trimmedAddress) {
        pendingRegistrationData.address = trimmedAddress;
      }
    }
    if (townCity !== undefined && townCity !== null) {
      const trimmedTownCity = String(townCity).trim();
      if (trimmedTownCity) {
        pendingRegistrationData.townCity = trimmedTownCity;
      }
    }
    if (county !== undefined && county !== null) {
      const trimmedCounty = String(county).trim();
      if (trimmedCounty) {
        pendingRegistrationData.county = trimmedCounty;
      }
    }

    // console.log('[Registration] Creating pending registration with data:', {
    //   email: normalizedEmail,
    //   role: userType,
    //   tradingName: pendingRegistrationData.tradingName,
    //   address: pendingRegistrationData.address,
    //   townCity: pendingRegistrationData.townCity,
    //   county: pendingRegistrationData.county,
    //   travelDistance: pendingRegistrationData.travelDistance,
    //   hasPasswordHash: !!pendingRegistrationData.passwordHash,
    //   hasEmailCodeHash: !!pendingRegistrationData.emailCodeHash,
    // });

    // Verify MongoDB connection before creating
    if (mongoose.connection.readyState !== 1) {
      // console.error('[Registration] MongoDB not connected. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection error. Please try again.' });
    }

    let pendingRegistration;
    try {
      pendingRegistration = await PendingRegistration.create(pendingRegistrationData);
      // console.log('[Registration] Pending registration created successfully:', {
      //   id: pendingRegistration._id,
      //   email: pendingRegistration.email,
      //   tradingName: pendingRegistration.tradingName,
      //   address: pendingRegistration.address,
      //   townCity: pendingRegistration.townCity,
      // });
    } catch (createError) {
      // console.error('[Registration] Failed to create pending registration:', {
      //   error: createError.message,
      //   stack: createError.stack,
      //   code: createError.code,
      //   name: createError.name,
      //   pendingRegistrationData: {
      //     email: pendingRegistrationData.email,
      //     role: pendingRegistrationData.role,
      //     hasPasswordHash: !!pendingRegistrationData.passwordHash,
      //   }
      // });
      throw createError;
    }

    // console.log('[Registration] Calling sendEmailVerificationCode for new registration:', {
    //   email: normalizedEmail,
    //   code: emailCode,
    //   pendingRegistrationId: pendingRegistration._id,
    //   timestamp: new Date().toISOString()
    // });
    
    try {
      const emailResult = await sendEmailVerificationCode(normalizedEmail, emailCode, firstName || 'User');
      // console.log('[Registration] Email verification code sent successfully:', {
      //   email: normalizedEmail,
      //   result: emailResult ? {
      //     messageId: emailResult.messageId,
      //     response: emailResult.response,
      //     accepted: emailResult.accepted,
      //     rejected: emailResult.rejected
      //   } : 'no result',
      //   timestamp: new Date().toISOString()
      // });
    } catch (notificationError) {
      // console.error('[Registration] Failed to send verification email:', {
      //   error: notificationError.message,
      //   code: notificationError.code,
      //   command: notificationError.command,
      //   response: notificationError.response,
      //   responseCode: notificationError.responseCode,
      //   stack: notificationError.stack,
      //   email: normalizedEmail,
      //   timestamp: new Date().toISOString()
      // });
      // In production, continue even if email sending fails (SMTP may not be configured yet)
      if (isProduction) {
        // console.warn('[Registration] Continuing registration flow despite email send failure (production mode)');
      } else {
        // console.error('[Registration] Deleting pending registration due to email send failure');
      await pendingRegistration.deleteOne();
      return res.status(502).json({ error: 'Failed to send verification email' });
      }
    }

    setPendingRegistrationSession(req, pendingRegistration.id);
    await saveSession(req);
    // console.log('[Registration] Session saved successfully:', {
    //   sessionId: req.session.id,
    //   registrationId: req.session[registrationSessionKey],
    // });

    // Include code in response for testing
    return res.status(200).json({ 
      message: 'Email verification code sent',
      emailCode: emailCode
    });
  } catch (error) {
    // console.error('[Registration] Register initiate error:', {
    //   message: error.message,
    //   stack: error.stack,
    //   code: error.code,
    //   name: error.name,
    //   errors: error.errors,
    // });
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((e) => e.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${validationErrors}` });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    
    if (error.message && error.message.includes('Mongo')) {
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to start registration' });
  }
});

// Resend email OTP during registration
router.post('/register/resend-email', async (req, res) => {
  try {
    const { email } = req.body || {};
    
    
    const pendingRegistration = await loadPendingRegistration(req, email);
    
    if (!pendingRegistration) {
      return res.status(400).json({ error: 'No pending registration found. Please start registration again.' });
    }

    if (pendingRegistration.emailVerified) {
      return res.status(409).json({ error: 'Email already verified' });
    }

    // Check if too soon to resend (prevent spam - 30 seconds minimum)
    const lastCodeTime = pendingRegistration.emailCodeExpiresAt 
      ? new Date(pendingRegistration.emailCodeExpiresAt).getTime() - (10 * 60 * 1000) // Subtract expiry duration
      : 0;
    const now = Date.now();
    const timeSinceLastCode = now - lastCodeTime;
    
    if (timeSinceLastCode < 30000 && lastCodeTime > 0) { // 30 seconds
      const waitTime = Math.ceil((30000 - timeSinceLastCode) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${waitTime} seconds before requesting a new code` 
      });
    }

    // Generate new code
    const emailCode = generateCode();
    const emailCodeHash = await bcrypt.hash(emailCode, 10);


    // Send new verification email
    let emailSent = false;
    try {
      await sendEmailVerificationCode(pendingRegistration.email, emailCode, pendingRegistration.firstName || 'User');
      emailSent = true;
    } catch (notificationError) {
      // In production, still save the code but warn user
      if (isProduction) {
        emailSent = true; // Allow continuation in production
      } else {
        return res.status(502).json({ 
          error: 'Failed to send verification email. Please check your email address or try again later.',
          details: notificationError.message
        });
      }
    }

    // Update pending registration with new code
    pendingRegistration.emailCodeHash = emailCodeHash;
    pendingRegistration.emailCodeExpiresAt = codeExpiryDate();
    await pendingRegistration.save();


    return res.status(200).json({ 
      message: 'Verification code has been resent to your email',
      emailCode: emailCode, // Include for testing/development
      expiresIn: '10 minutes'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
});

router.post('/register/verify-email', async (req, res) => {
  try {
    const { code, email } = req.body || {};
    // console.log('[Email Verification] Received request:', {
    //   hasCode: !!code,
    //   email: email,
    //   normalizedEmail: email ? normalizeEmail(email) : null,
    //   sessionId: req.session?.id,
    //   sessionRegistrationId: req.session?.[registrationSessionKey],
    // });
    
    if (!isValidCode(code)) {
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    // Ensure email is provided for fallback lookup
    if (!email) {
      // console.error('[Email Verification] No email provided in request');
    }

    const pendingRegistration = await loadPendingRegistration(req, email);
    // console.log('[Email Verification] Loaded pending registration:', {
    //   found: !!pendingRegistration,
    //   email: pendingRegistration?.email,
    //   id: pendingRegistration?._id,
    //   emailVerified: pendingRegistration?.emailVerified,
    // });
    
    if (!pendingRegistration) {
      // Try to find any pending registrations for debugging
      if (email) {
        const normalizedEmail = normalizeEmail(email);
        const allPending = await PendingRegistration.find({ email: normalizedEmail }).limit(5);
        // console.error('[Email Verification] No pending registration found. Debug info:', {
        //   sessionId: req.session?.id,
        //   sessionRegistrationId: req.session?.[registrationSessionKey],
        //   providedEmail: email,
        //   normalizedEmail: normalizedEmail,
        //   foundPendingCount: allPending.length,
        //   pendingRegistrations: allPending.map(p => ({
        //     id: p._id,
        //     email: p.email,
        //     expiresAt: p.expiresAt,
        //     emailVerified: p.emailVerified,
        //   })),
        // });
      } else {
        // console.error('[Email Verification] No pending registration found. No email provided:', {
        //   sessionId: req.session?.id,
        //   sessionRegistrationId: req.session?.[registrationSessionKey],
        // });
      }
      return res.status(400).json({ error: 'No pending registration found. Please start registration again.' });
    }

    if (pendingRegistration.emailVerified) {
      return res.status(409).json({ error: 'Email already verified' });
    }

    if (
      pendingRegistration.emailCodeExpiresAt &&
      pendingRegistration.emailCodeExpiresAt < new Date()
    ) {
      await pendingRegistration.deleteOne();
      clearPendingRegistrationSession(req);
      return res.status(410).json({ error: 'Verification code expired. Please register again.' });
    }

    const match = await bcrypt.compare(code, pendingRegistration.emailCodeHash || '');
    if (!match) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const smsCode = generateCode();
    // console.log('[Phone Code] Backend - Regular Registration - Generated SMS code:', smsCode);
    const smsCodeHash = await bcrypt.hash(smsCode, 10);
    // console.log('[Phone Code] Backend - Regular Registration - Code hash created');

    try {
      // console.log('[Phone Code] Backend - Regular Registration - Step 1: Preparing to send SMS');
      // console.log('[Phone Code] Backend - Regular Registration - Step 1.1: Phone number:', pendingRegistration.phone);
      // console.log('[Phone Code] Backend - Regular Registration - Step 1.2: SMS code generated:', smsCode);
      // Format phone number to E.164 for Twilio
      const twilioPhone = formatPhoneForTwilio(pendingRegistration.phone);
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Phone number is too short or invalid.');
      }
      const smsResult = await sendSmsVerificationCode(twilioPhone, smsCode);
      // console.log('[Phone Code] Backend - Regular Registration - Step 3: SMS function returned');
      if (smsResult?.success) {
        // console.log('[Phone Code] Backend - Regular Registration - Step 3.1: SMS sent successfully:', {
        //   messageSid: smsResult.messageSid,
        //   phone: pendingRegistration.phone
        // });
      } else {
        // console.warn('[Phone Code] Backend - Regular Registration - Step 3.2: SMS function returned but success is false');
      }
    } catch (notificationError) {
      // console.error('[Phone Code] Backend - Regular Registration - ERROR: Failed to send SMS code');
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.1: Error object:', notificationError);
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.2: Error message:', notificationError.message);
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.3: Twilio error code:', notificationError.code);
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.4: Twilio error status:', notificationError.status);
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.5: Twilio error moreInfo:', notificationError.moreInfo);
      // console.error('[Phone Code] Backend - Regular Registration - ERROR.6: Full error details:', {
      //   message: notificationError.message,
      //   code: notificationError.code,
      //   status: notificationError.status,
      //   moreInfo: notificationError.moreInfo,
      //   twilioErrorCode: notificationError.twilioErrorCode,
      //   twilioErrorMessage: notificationError.twilioErrorMessage,
      //   twilioErrorMoreInfo: notificationError.twilioErrorMoreInfo,
      //   userMessage: notificationError.userMessage,
      //   stack: notificationError.stack
      // });
      
      // In production, continue even if SMS sending fails (Twilio may not be configured yet)
      if (isProduction) {
        // console.warn('[Phone Code] Backend - Regular Registration - Continuing despite SMS send failure (production mode)');
      } else {
        // Return detailed error message to user
        const errorMessage = notificationError.userMessage || 
          `Failed to send SMS code. ${notificationError.message || 'Unknown error'}. ` +
          (notificationError.code ? `Twilio Error Code: ${notificationError.code}. ` : '') +
          (notificationError.moreInfo ? `Details: ${notificationError.moreInfo}` : '');
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          twilioErrorMessage: notificationError.message,
          twilioErrorMoreInfo: notificationError.moreInfo
        });
      }
    }

    pendingRegistration.emailVerified = true;
    pendingRegistration.emailCodeHash = undefined;
    pendingRegistration.emailCodeExpiresAt = undefined;
    pendingRegistration.phoneCodeHash = smsCodeHash;
    pendingRegistration.phoneCodeExpiresAt = codeExpiryDate();
    await pendingRegistration.save();
    // console.log('[Phone Code] Backend - Regular Registration - Code hash saved to database');

    // Include code in response for testing
    // console.log('[Phone Code] Backend - Regular Registration - Returning success response with code:', smsCode);
    return res.json({ 
      message: 'Email verified. SMS code sent',
      phoneCode: smsCode
    });
  } catch (err) {
    // console.error('Email verification error', err);
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend phone OTP during registration
router.post('/register/resend-phone', async (req, res) => {
  try {
    const { email } = req.body || {};
    
    
    const pendingRegistration = await loadPendingRegistration(req, email);
    
    if (!pendingRegistration) {
      return res.status(400).json({ error: 'No pending registration found. Please start registration again.' });
    }

    if (!pendingRegistration.emailVerified) {
      return res.status(400).json({ error: 'Please verify your email first before requesting phone verification' });
    }

    // Check if too soon to resend (prevent spam - 30 seconds minimum)
    const lastCodeTime = pendingRegistration.phoneCodeExpiresAt 
      ? new Date(pendingRegistration.phoneCodeExpiresAt).getTime() - (10 * 60 * 1000) // Subtract expiry duration
      : 0;
    const now = Date.now();
    const timeSinceLastCode = now - lastCodeTime;
    
    if (timeSinceLastCode < 30000 && lastCodeTime > 0) { // 30 seconds
      const waitTime = Math.ceil((30000 - timeSinceLastCode) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${waitTime} seconds before requesting a new code` 
      });
    }

    // Generate new SMS code
    const smsCode = generateCode();
    const smsCodeHash = await bcrypt.hash(smsCode, 10);


    // Send new SMS verification
    let smsSent = false;
    try {
      const twilioPhone = formatPhoneForTwilio(pendingRegistration.phone);
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Please check your phone number.');
      }
      
      await sendSmsVerificationCode(twilioPhone, smsCode);
      smsSent = true;
    } catch (notificationError) {
      // In production, still save the code but warn user
      if (isProduction) {
        smsSent = true; // Allow continuation in production
      } else {
        const errorMessage = notificationError.userMessage || 
          notificationError.message || 
          'Failed to send SMS code. Please check your phone number or try again later.';
        
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          details: notificationError.moreInfo
        });
      }
    }

    // Update pending registration with new code
    pendingRegistration.phoneCodeHash = smsCodeHash;
    pendingRegistration.phoneCodeExpiresAt = codeExpiryDate();
    await pendingRegistration.save();


    return res.status(200).json({ 
      message: 'SMS verification code has been resent to your phone',
      phoneCode: smsCode, // Include for testing/development
      expiresIn: '10 minutes'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
});

router.post('/register/verify-phone', async (req, res) => {
  try {
    const { code, email } = req.body || {};
    // console.log('[Phone Code] Backend - Regular Registration - Received phone code verification request:', {
    //   code: code ? '****' : 'missing',
    //   email: email
    // });
    
    if (!isValidCode(code)) {
      // console.log('[Phone Code] Backend - Regular Registration - Invalid code format');
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    const pendingRegistration = await loadPendingRegistration(req, email);
    if (!pendingRegistration) {
      // console.log('[Phone Code] Backend - Regular Registration - No pending registration found');
      return res.status(400).json({ error: 'No pending registration found. Please start registration again.' });
    }

    // console.log('[Phone Code] Backend - Regular Registration - Pending registration found for:', pendingRegistration.email);
    // console.log('[Phone Verification] Registration - Pending registration data:', {
    //   tradingName: pendingRegistration.tradingName,
    //   address: pendingRegistration.address,
    //   townCity: pendingRegistration.townCity,
    //   travelDistance: pendingRegistration.travelDistance,
    //   role: pendingRegistration.role,
    // });

    if (!pendingRegistration.emailVerified) {
      // console.log('[Phone Code] Backend - Regular Registration - Email not verified yet');
      return res.status(400).json({ error: 'Email must be verified first' });
    }

    if (
      pendingRegistration.phoneCodeExpiresAt &&
      pendingRegistration.phoneCodeExpiresAt < new Date()
    ) {
      // console.log('[Phone Code] Backend - Regular Registration - Code expired');
      await pendingRegistration.deleteOne();
      clearPendingRegistrationSession(req);
      return res.status(410).json({ error: 'SMS code expired. Please restart registration.' });
    }

    // console.log('[Phone Code] Backend - Regular Registration - Comparing code with hash');
    const phoneMatch = await bcrypt.compare(code, pendingRegistration.phoneCodeHash || '');
    // console.log('[Phone Code] Backend - Regular Registration - Code match result:', phoneMatch);
    if (!phoneMatch) {
      // console.log('[Phone Code] Backend - Regular Registration - Invalid verification code');
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    // console.log('[Phone Code] Backend - Regular Registration - Phone code verified successfully');

    const existingUser = await User.findOne({ email: pendingRegistration.email });
    if (existingUser) {
      clearPendingRegistrationSession(req);
      await pendingRegistration.deleteOne();
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Normalize phone number from pending registration
    const normalizedPhone = normalizePhone(pendingRegistration.phone);
    if (normalizedPhone) {
      // Check if phone number is already in use by another active user
      const existingPhoneUser = await User.findOne({ 
        phone: normalizedPhone, 
        isDeleted: { $ne: true }
      });
      if (existingPhoneUser) {
        // console.log('[Phone Code] Backend - Regular Registration - Phone number already in use:', {
        //   phone: normalizedPhone,
        //   existingUserId: existingPhoneUser._id,
        //   existingUserEmail: existingPhoneUser.email
        // });
        clearPendingRegistrationSession(req);
        await pendingRegistration.deleteOne();
        return res.status(409).json({ error: 'This phone number is already registered to another account' });
      }
    }

    // Debug: Log pendingRegistration data before creating user
    // console.log('[Phone Verification] Registration - PendingRegistration data:', {
    //   id: pendingRegistration._id,
    //   email: pendingRegistration.email,
    //   address: pendingRegistration.address,
    //   townCity: pendingRegistration.townCity,
    //   county: pendingRegistration.county,
    //   townCityType: typeof pendingRegistration.townCity,
    //   countyType: typeof pendingRegistration.county,
    //   townCityExists: pendingRegistration.townCity !== undefined && pendingRegistration.townCity !== null,
    //   countyExists: pendingRegistration.county !== undefined && pendingRegistration.county !== null,
    // });

    // Initialize verification object with email and phone as verified
    const verification = {
      email: {
        status: 'verified',
        verifiedAt: new Date(),
      },
      phone: {
        status: 'verified',
        verifiedAt: new Date(),
      },
      address: {
        status: 'not-started',
      },
      idCard: {
        status: 'not-started',
      },
      paymentMethod: {
        status: 'not-started',
      },
      publicLiabilityInsurance: {
        status: 'not-started',
      },
    };

    const userData = {
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      email: pendingRegistration.email,
      passwordHash: pendingRegistration.passwordHash,
      phone: normalizedPhone || pendingRegistration.phone, // Use normalized phone
      postcode: pendingRegistration.postcode,
      referralCode: pendingRegistration.referralCode,
      role: pendingRegistration.role,
      verification: verification,
    };

    // Professional-specific fields
    if (pendingRegistration.role === 'professional') {
      // Always set tradingName if it exists (even if empty string, it will be trimmed)
      if (pendingRegistration.tradingName !== undefined && pendingRegistration.tradingName !== null) {
        const trimmedTradingName = String(pendingRegistration.tradingName).trim();
        if (trimmedTradingName) {
          userData.tradingName = trimmedTradingName;
        }
      }
      if (pendingRegistration.travelDistance !== undefined && pendingRegistration.travelDistance !== null) {
        const trimmedTravelDistance = String(pendingRegistration.travelDistance).trim();
        if (trimmedTravelDistance) {
          userData.travelDistance = trimmedTravelDistance;
        }
      }
    }

    // Address fields - available for both client and professional
    // Convert pendingRegistration to plain object to ensure all fields are accessible
    const pendingData = pendingRegistration.toObject ? pendingRegistration.toObject() : pendingRegistration;
    
    // console.log('[Phone Verification] Registration - PendingRegistration raw data:', {
    //   hasToObject: typeof pendingRegistration.toObject === 'function',
    //   townCity: pendingData.townCity,
    //   county: pendingData.county,
    //   townCityType: typeof pendingData.townCity,
    //   countyType: typeof pendingData.county,
    // });
    
    // Always set address if it exists (even if empty string, it will be trimmed)
    if (pendingData.address !== undefined && pendingData.address !== null) {
      const trimmedAddress = String(pendingData.address).trim();
      if (trimmedAddress) {
        userData.address = trimmedAddress;
      }
    }
    
    // Set townCity - check if it exists and is not empty
    if (pendingData.townCity !== undefined && pendingData.townCity !== null) {
      const trimmedTownCity = String(pendingData.townCity).trim();
      // console.log('[Phone Verification] Registration - Processing townCity:', {
      //   original: pendingData.townCity,
      //   trimmed: trimmedTownCity,
      //   isEmpty: !trimmedTownCity,
      // });
      if (trimmedTownCity) {
        userData.townCity = trimmedTownCity;
        // console.log('[Phone Verification] Registration - townCity added to userData:', userData.townCity);
      } else {
        // console.log('[Phone Verification] Registration - townCity is empty after trim, skipping');
      }
    } else {
      // console.log('[Phone Verification] Registration - townCity is undefined or null in pendingRegistration');
    }
    
    // Set county - check if it exists and is not empty
    if (pendingData.county !== undefined && pendingData.county !== null) {
      const trimmedCounty = String(pendingData.county).trim();
      // console.log('[Phone Verification] Registration - Processing county:', {
      //   original: pendingData.county,
      //   trimmed: trimmedCounty,
      //   isEmpty: !trimmedCounty,
      // });
      if (trimmedCounty) {
        userData.county = trimmedCounty;
        // console.log('[Phone Verification] Registration - county added to userData:', userData.county);
      } else {
        // console.log('[Phone Verification] Registration - county is empty after trim, skipping');
      }
    } else {
      // console.log('[Phone Verification] Registration - county is undefined or null in pendingRegistration');
    }

    // console.log('[Phone Verification] Registration - Creating user with data:', {
    //   role: userData.role,
    //   tradingName: userData.tradingName,
    //   address: userData.address,
    //   townCity: userData.townCity,
    //   county: userData.county,
    //   travelDistance: userData.travelDistance,
    // });

    // Generate and assign reference ID
    if (!userData.referenceId) {
      userData.referenceId = await generateReferenceId();
    }

    // Create user instance and explicitly save to ensure all fields are persisted
    const user = new User(userData);
    await user.save();

    // console.log('[Phone Verification] Registration - User created and saved:', {
    //   id: user._id,
    //   tradingName: user.tradingName,
    //   address: user.address,
    //   townCity: user.townCity,
    //   county: user.county,
    //   travelDistance: user.travelDistance,
    // });

    // Send welcome email using no-reply category (SMTP_USER_NO_REPLY)
    try {
      // console.log('[Welcome Email] Sending welcome email to:', user.email);
      await sendTemplatedEmail(user.email, 'welcome', {
        firstName: user.firstName,
      }, 'no-reply'); // Category: no-reply -> Uses SMTP_USER_NO_REPLY
      // console.log('[Welcome Email] Welcome email sent successfully (category: no-reply)');
    } catch (welcomeEmailError) {
      // console.error('[Welcome Email] Failed to send welcome email:', welcomeEmailError);
      // Don't fail registration if welcome email fails
    }

    // Verify the saved data by fetching from database
    const savedUser = await User.findById(user._id);
    // console.log('[Phone Verification] Registration - Verified saved user data:', {
    //   id: savedUser._id,
    //   tradingName: savedUser.tradingName,
    //   address: savedUser.address,
    //   townCity: savedUser.townCity,
    //   county: savedUser.county,
    //   travelDistance: savedUser.travelDistance,
    //   townCityExists: savedUser.townCity !== undefined && savedUser.townCity !== null,
    //   countyExists: savedUser.county !== undefined && savedUser.county !== null,
    // });

    // console.log('[Phone Verification] Registration - User created successfully:', {
    //   userId: user.id,
    //   email: user.email,
    //   phone: user.phone,
    //   role: user.role,
    //   phoneVerificationStatus: user.verification.phone.status
    // });

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    
    // Save session before responding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    
    await pendingRegistration.deleteOne();
    clearPendingRegistrationSession(req);

    // console.log('[Phone Verification] Registration - Verification completed successfully');
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    // console.error('[Phone Verification] Registration - Error:', err);
    return res.status(500).json({ error: 'Failed to verify phone' });
  }
});

router.get('/social/pending', (req, res) => {
  const pending = getPendingSocialProfile(req);
  if (!pending) {
    return res.json({ pending: null });
  }

  return res.json({
    pending: {
      provider: pending.provider,
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
    },
  });
});

// Send phone verification code for social registration
router.post('/social/send-phone-code', async (req, res) => {
  try {
    const pending = getPendingSocialProfile(req);
    if (!pending) {
      return res.status(400).json({ error: 'No pending social registration' });
    }

    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const smsCode = generateCode();
    const smsCodeHash = await bcrypt.hash(smsCode, 10);
    const expiresAt = codeExpiryDate();

    // Store phone code in session
    if (!req.session[socialSessionKey]) {
      req.session[socialSessionKey] = {};
    }
    req.session[socialSessionKey].phoneCodeHash = smsCodeHash;
    req.session[socialSessionKey].phoneCodeExpiresAt = expiresAt;
    req.session[socialSessionKey].phone = phone.trim();
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    // console.log('[Phone Code] Backend - Social Registration - Code stored in session');

    try {
      // Format phone number to E.164 for Twilio
      const twilioPhone = formatPhoneForTwilio(phone.trim());
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Phone number is too short or invalid.');
      }
      await sendSmsVerificationCode(twilioPhone, smsCode);
    } catch (notificationError) {
      // console.error('[Phone Code] Backend - Social Registration - ERROR: Failed to send SMS code');
      // console.error('[Phone Code] Backend - Social Registration - ERROR.1: Error object:', notificationError);
      // console.error('[Phone Code] Backend - Social Registration - ERROR.2: Error message:', notificationError.message);
      // console.error('[Phone Code] Backend - Social Registration - ERROR.3: Twilio error code:', notificationError.code);
      // console.error('[Phone Code] Backend - Social Registration - ERROR.4: Twilio error status:', notificationError.status);
      // console.error('[Phone Code] Backend - Social Registration - ERROR.5: Twilio error moreInfo:', notificationError.moreInfo);
      // console.error('[Phone Code] Backend - Social Registration - ERROR.6: Full error details:', {
      //   message: notificationError.message,
      //   code: notificationError.code,
      //   status: notificationError.status,
      //   moreInfo: notificationError.moreInfo,
      //   twilioErrorCode: notificationError.twilioErrorCode,
      //   twilioErrorMessage: notificationError.twilioErrorMessage,
      //   twilioErrorMoreInfo: notificationError.twilioErrorMoreInfo,
      //   userMessage: notificationError.userMessage,
      //   stack: notificationError.stack
      // });
      
      if (isProduction) {
        // console.warn('[Phone Code] Backend - Social Registration - Continuing despite SMS send failure (production mode)');
      } else {
        // Return detailed error message to user
        const errorMessage = notificationError.userMessage || 
          `Failed to send SMS code. ${notificationError.message || 'Unknown error'}. ` +
          (notificationError.code ? `Twilio Error Code: ${notificationError.code}. ` : '') +
          (notificationError.moreInfo ? `Details: ${notificationError.moreInfo}` : '');
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          twilioErrorMessage: notificationError.message,
          twilioErrorMoreInfo: notificationError.moreInfo
        });
      }
    }

    // console.log('[Phone Code] Backend - Social Registration - Returning success response with code:', smsCode);
    return res.json({
      message: 'Phone verification code sent',
      phoneCode: smsCode, // Include in response for development/testing
    });
  } catch (error) {
    // console.error('[Phone Code] Backend - Social Registration - Error:', error);
    return res.status(500).json({ error: 'Failed to send phone verification code' });
  }
});

// Resend phone OTP for social registration
router.post('/social/resend-phone-code', async (req, res) => {
  try {
    const pending = getPendingSocialProfile(req);
    if (!pending) {
      return res.status(400).json({ error: 'No pending social registration' });
    }

    const sessionData = req.session[socialSessionKey];
    if (!sessionData || !sessionData.phone) {
      return res.status(400).json({ error: 'No phone number found. Please enter your phone number first.' });
    }

    // Check if too soon to resend (prevent spam - 30 seconds minimum)
    const lastCodeTime = sessionData.phoneCodeExpiresAt 
      ? new Date(sessionData.phoneCodeExpiresAt).getTime() - (10 * 60 * 1000) // Subtract expiry duration
      : 0;
    const now = Date.now();
    const timeSinceLastCode = now - lastCodeTime;
    
    if (timeSinceLastCode < 30000 && lastCodeTime > 0) { // 30 seconds
      const waitTime = Math.ceil((30000 - timeSinceLastCode) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${waitTime} seconds before requesting a new code` 
      });
    }

    // Generate new SMS code
    const smsCode = generateCode();
    const smsCodeHash = await bcrypt.hash(smsCode, 10);
    const expiresAt = codeExpiryDate();

    // Update session with new code
    sessionData.phoneCodeHash = smsCodeHash;
    sessionData.phoneCodeExpiresAt = expiresAt;
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    // Send new SMS verification
    try {
      const twilioPhone = formatPhoneForTwilio(sessionData.phone);
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Please check your phone number.');
      }
      
      await sendSmsVerificationCode(twilioPhone, smsCode);
    } catch (notificationError) {
      if (isProduction) {
      } else {
        const errorMessage = notificationError.userMessage || 
          notificationError.message || 
          'Failed to send SMS code. Please check your phone number or try again later.';
        
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          details: notificationError.moreInfo
        });
      }
    }

    return res.status(200).json({ 
      message: 'SMS verification code has been resent to your phone',
      phoneCode: smsCode, // Include for testing/development
      expiresIn: '10 minutes'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
});

// Verify phone code and complete social registration
router.post('/social/verify-phone', async (req, res) => {
  try {
    // console.log('[Phone Code] Backend - Social Registration - Received phone code verification request');
    const pending = getPendingSocialProfile(req);
    if (!pending) {
      // console.log('[Phone Code] Backend - Social Registration - No pending social profile found');
      return res.status(400).json({ error: 'No pending social registration' });
    }
    // console.log('[Phone Code] Backend - Social Registration - Pending profile found:', {
    //   provider: pending.provider,
    //   email: pending.email
    // });

    const { code, ...registrationData } = req.body;
    // console.log('[Phone Code] Backend - Social Registration - Code received:', code ? '****' : 'missing');

    if (!code || !isValidCode(code)) {
      // console.log('[Phone Code] Backend - Social Registration - Invalid code format');
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    // Check phone code from session
    const sessionData = req.session[socialSessionKey];
    if (!sessionData || !sessionData.phoneCodeHash) {
      // console.log('[Phone Code] Backend - Social Registration - No phone code hash in session');
      return res.status(400).json({ error: 'No phone verification code found. Please request a new code.' });
    }

    if (sessionData.phoneCodeExpiresAt && new Date(sessionData.phoneCodeExpiresAt) < new Date()) {
      // console.log('[Phone Code] Backend - Social Registration - Code expired');
      delete req.session[socialSessionKey];
      return res.status(410).json({ error: 'Phone verification code expired. Please request a new code.' });
    }

    // console.log('[Phone Code] Backend - Social Registration - Comparing code with hash');
    const phoneMatch = await bcrypt.compare(code, sessionData.phoneCodeHash);
    // console.log('[Phone Code] Backend - Social Registration - Code match result:', phoneMatch);
    if (!phoneMatch) {
      // console.log('[Phone Code] Backend - Social Registration - Invalid verification code');
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    // console.log('[Phone Code] Backend - Social Registration - Phone code verified successfully');

    // Phone verified, now complete registration
    const mergedPayload = {
      ...registrationData,
      firstName: registrationData.firstName || pending.firstName,
      lastName: registrationData.lastName || pending.lastName,
      email: registrationData.email || pending.email,
      phone: sessionData.phone || registrationData.phone,
    };

    if (!registrationData.agreeTerms) {
      return res.status(400).json({ error: 'Terms must be accepted' });
    }

    const validationError = validateRegistrationPayload(mergedPayload, {
      requirePassword: false,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone: verifiedPhone,
      postcode,
      referralCode,
      userType,
      tradingName,
      townCity,
      address,
      travelDistance,
    } = mergedPayload;

    const normalizedEmail = normalizeEmail(email);
    
    // Check for deleted users first - they cannot re-register
    const deletedUser =
      (await User.findOne({ email: normalizedEmail, isDeleted: true })) ||
      (await User.findOne({
        [pending.provider === 'google' ? 'googleId' : 'facebookId']: pending.providerId,
        isDeleted: true,
      }));

    if (deletedUser) {
      return res.status(403).json({ error: 'This account has been deleted and cannot be re-registered' });
    }
    
    // Check for existing active users
    const existingUser =
      (await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } })) ||
      (await User.findOne({
        [pending.provider === 'google' ? 'googleId' : 'facebookId']: pending.providerId,
        isDeleted: { $ne: true },
      }));

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists for this account' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    // Initialize verification object with email and phone as verified (from Google)
    const verification = {
      email: {
        status: 'verified',
        verifiedAt: new Date(),
      },
      phone: {
        status: 'verified',
        verifiedAt: new Date(),
      },
      address: {
        status: 'not-started',
      },
      idCard: {
        status: 'not-started',
      },
      paymentMethod: {
        status: 'not-started',
      },
      publicLiabilityInsurance: {
        status: 'not-started',
      },
    };

    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone: normalizedPhone, // Use normalized phone number
      postcode,
      referralCode,
      role: userType,
      googleId: pending.provider === 'google' ? pending.providerId : undefined,
      facebookId: pending.provider === 'facebook' ? pending.providerId : undefined,
      verification,
    };

    // Professional-specific fields
    if (userType === 'professional') {
      if (tradingName && tradingName.trim()) {
        userData.tradingName = tradingName.trim();
      }
      if (travelDistance && travelDistance.trim()) {
        userData.travelDistance = travelDistance.trim();
      }
    }

    // Address fields - available for both client and professional
    if (address && address.trim()) {
      userData.address = address.trim();
    }
    if (townCity && townCity.trim()) {
      userData.townCity = townCity.trim();
    }

    // Generate and assign reference ID
    if (!userData.referenceId) {
      userData.referenceId = await generateReferenceId();
    }

    const user = await User.create(userData);

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    
    // Save session before responding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    
    clearPendingSocialProfile(req);

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify phone and complete registration' });
  }
});

router.post('/social/complete', async (req, res) => {
  try {
    const pending = getPendingSocialProfile(req);
    if (!pending) {
      return res.status(400).json({ error: 'No pending social registration' });
    }

    const mergedPayload = {
      ...req.body,
      firstName: req.body.firstName || pending.firstName,
      lastName: req.body.lastName || pending.lastName,
      email: req.body.email || pending.email,
    };

    if (!req.body.agreeTerms) {
      return res.status(400).json({ error: 'Terms must be accepted' });
    }

    const validationError = validateRegistrationPayload(mergedPayload, {
      requirePassword: false,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      postcode,
      referralCode,
      userType,
      tradingName,
      townCity,
      address,
      travelDistance,
    } = mergedPayload;

    const normalizedEmail = normalizeEmail(email);
    
    // Check for deleted users first - they cannot re-register
    const deletedUser =
      (await User.findOne({ email: normalizedEmail, isDeleted: true })) ||
      (await User.findOne({
        [pending.provider === 'google' ? 'googleId' : 'facebookId']: pending.providerId,
        isDeleted: true,
      }));

    if (deletedUser) {
      return res.status(403).json({ error: 'This account has been deleted and cannot be re-registered' });
    }
    
    // Check for existing active users
    const existingUser =
      (await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } })) ||
      (await User.findOne({
        [pending.provider === 'google' ? 'googleId' : 'facebookId']: pending.providerId,
        isDeleted: { $ne: true },
      }));

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists for this account' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    const userData = {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone: normalizedPhone, // Use normalized phone number
      postcode,
      referralCode,
      role: userType,
      googleId: pending.provider === 'google' ? pending.providerId : undefined,
      facebookId: pending.provider === 'facebook' ? pending.providerId : undefined,
    };

    // Professional-specific fields
    if (userType === 'professional') {
      if (tradingName && tradingName.trim()) {
        userData.tradingName = tradingName.trim();
      }
      if (travelDistance && travelDistance.trim()) {
        userData.travelDistance = travelDistance.trim();
      }
    }

    // Address fields - available for both client and professional
    if (address && address.trim()) {
      userData.address = address.trim();
    }
    if (townCity && townCity.trim()) {
      userData.townCity = townCity.trim();
    }

    // Generate and assign reference ID
    if (!userData.referenceId) {
      userData.referenceId = await generateReferenceId();
    }

    const user = await User.create(userData);

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    
    // Save session before responding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
    
    clearPendingSocialProfile(req);

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to complete social registration' });
  }
});

router.post('/password/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return userNotFound flag to show appropriate message
      return res.json({ 
        message: 'Email not found',
        userNotFound: true,
        resetLink: null
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();

    const resetLink = `${PASSWORD_RESET_URL}${
      PASSWORD_RESET_URL.includes('?') ? '&' : '?'
    }token=${token}`;
    // console.log(`[PASSWORD-RESET] Reset link for ${user.email}: ${resetLink}`);
    
    try {
    await sendPasswordResetEmail(user.email, resetLink);
    } catch (notificationError) {
      // console.error('Failed to send password reset email', notificationError);
      // In production, continue even if email sending fails (SMTP may not be configured yet)
      if (isProduction) {
        // console.warn('Continuing despite email send failure (production mode)');
      }
    }

    // Include reset link in response for testing (always, not just in development)
    return res.json({ 
      message: 'If the email exists, a reset link has been sent.',
      resetLink: resetLink
    });
  } catch (error) {
    // console.error('Forgot password error', error);
    return res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    if (req.session) {
      req.session.userId = undefined;
      req.session.role = undefined;
    }

    return res.json({ message: 'Password updated successfully. Please login again.' });
  } catch (error) {
    // console.error('Reset password error', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Store OTP verification tokens in session
const emailChangeOTPKey = 'emailChangeOTP';
const phoneChangeOTPKey = 'phoneChangeOTP';

// Resend email OTP for profile change
router.post('/profile/resend-email-change', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const emailChangeData = req.session[emailChangeOTPKey];
    if (!emailChangeData || !emailChangeData.email) {
      return res.status(400).json({ error: 'No pending email change request found. Please request a new email change first.' });
    }

    // Check if previous code expired
    if (emailChangeData.expiresAt && new Date(emailChangeData.expiresAt) < new Date()) {
      delete req.session[emailChangeOTPKey];
      return res.status(410).json({ error: 'Verification session expired. Please request a new email change.' });
    }

    // Check if too soon to resend (prevent spam - 30 seconds minimum)
    if (emailChangeData.lastSentAt) {
      const timeSinceLastSend = Date.now() - new Date(emailChangeData.lastSentAt).getTime();
      if (timeSinceLastSend < 30000) { // 30 seconds
        const waitTime = Math.ceil((30000 - timeSinceLastSend) / 1000);
        return res.status(429).json({ 
          error: `Please wait ${waitTime} seconds before requesting a new code` 
        });
      }
    }

    // Generate new code
    const otpCode = generateCode();
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Send new verification email
    let emailSent = false;
    try {
      await sendEmailVerificationCode(emailChangeData.email, otpCode, user.firstName || 'User');
      emailSent = true;
    } catch (notificationError) {
      if (isProduction) {
        emailSent = true;
      } else {
        return res.status(502).json({ 
          error: 'Failed to send verification email. Please try again later.',
          details: notificationError.message
        });
      }
    }

    // Update session with new code
    req.session[emailChangeOTPKey] = {
      email: emailChangeData.email,
      otpHash,
      expiresAt: codeExpiryDate(),
      lastSentAt: new Date(),
    };

    return res.json({ 
      message: 'Verification code has been resent to your new email',
      emailCode: otpCode,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
});

// Resend phone OTP for profile change
router.post('/profile/resend-phone-change', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const phoneChangeData = req.session[phoneChangeOTPKey];
    if (!phoneChangeData || !phoneChangeData.phone) {
      return res.status(400).json({ error: 'No pending phone change request found. Please request a new phone change first.' });
    }

    // Check if previous code expired
    if (phoneChangeData.expiresAt && new Date(phoneChangeData.expiresAt) < new Date()) {
      delete req.session[phoneChangeOTPKey];
      return res.status(410).json({ error: 'Verification session expired. Please request a new phone change.' });
    }

    // Check if too soon to resend (prevent spam - 30 seconds minimum)
    if (phoneChangeData.lastSentAt) {
      const timeSinceLastSend = Date.now() - new Date(phoneChangeData.lastSentAt).getTime();
      if (timeSinceLastSend < 30000) { // 30 seconds
        const waitTime = Math.ceil((30000 - timeSinceLastSend) / 1000);
        return res.status(429).json({ 
          error: `Please wait ${waitTime} seconds before requesting a new code` 
        });
      }
    }

    // Generate new code
    const otpCode = generateCode();
    const otpHash = await bcrypt.hash(otpCode, 10);

    // Send new SMS verification
    let smsSent = false;
    try {
      const twilioPhone = formatPhoneForTwilio(phoneChangeData.phone);
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Please check your phone number.');
      }
      
      await sendSmsVerificationCode(twilioPhone, otpCode);
      smsSent = true;
    } catch (notificationError) {
      if (isProduction) {
        smsSent = true;
      } else {
        const errorMessage = notificationError.userMessage || 
          notificationError.message || 
          'Failed to send SMS code. Please check your phone number or try again later.';
        
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          details: notificationError.moreInfo
        });
      }
    }

    // Update session with new code
    req.session[phoneChangeOTPKey] = {
      phone: phoneChangeData.phone,
      otpHash,
      expiresAt: codeExpiryDate(),
      lastSentAt: new Date(),
    };

    return res.json({ 
      message: 'SMS verification code has been resent to your new phone',
      phoneCode: otpCode,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resend verification code. Please try again.' });
  }
});

router.post('/profile/verify-email-change', requireAuth, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail === user.email) {
      return res.status(400).json({ error: 'New email must be different from current email' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email is already in use' });
    }

    // console.log('[Email Change] Generating OTP code for email change:', {
    //   currentEmail: user.email,
    //   newEmail: normalizedEmail,
    //   timestamp: new Date().toISOString()
    // });
    
    const otpCode = generateCode();
    // console.log('[Email Change] OTP code generated:', {
    //   code: otpCode,
    //   codeLength: otpCode.length,
    //   timestamp: new Date().toISOString()
    // });
    
    const otpHash = await bcrypt.hash(otpCode, 10);
    // console.log('[Email Change] OTP hash created:', {
    //   hasHash: !!otpHash,
    //   hashLength: otpHash?.length || 0
    // });
    
    req.session[emailChangeOTPKey] = {
      email: normalizedEmail,
      otpHash,
      expiresAt: codeExpiryDate(),
    };
    
    // console.log('[Email Change] Session updated with OTP:', {
    //   email: normalizedEmail,
    //   expiresAt: req.session[emailChangeOTPKey].expiresAt
    // });

    // console.log('[Email Change] Calling sendEmailVerificationCode:', {
    //   email: normalizedEmail,
    //   code: otpCode,
    //   timestamp: new Date().toISOString()
    // });
    
    try {
      const emailResult = await sendEmailVerificationCode(normalizedEmail, otpCode, user.firstName || 'User');
      // console.log('[Email Change] Email verification code sent successfully:', {
      //   email: normalizedEmail,
      //   result: emailResult ? {
      //     messageId: emailResult.messageId,
      //     response: emailResult.response,
      //     accepted: emailResult.accepted,
      //     rejected: emailResult.rejected
      //   } : 'no result',
      //   timestamp: new Date().toISOString()
      // });
    } catch (notificationError) {
      // console.error('[Email Change] Failed to send email OTP:', {
      //   error: notificationError.message,
      //   code: notificationError.code,
      //   command: notificationError.command,
      //   response: notificationError.response,
      //   responseCode: notificationError.responseCode,
      //   stack: notificationError.stack,
      //   email: normalizedEmail,
      //   timestamp: new Date().toISOString()
      // });
      if (isProduction) {
        // console.warn('[Email Change] Continuing despite email send failure (production mode)');
      } else {
        delete req.session[emailChangeOTPKey];
        return res.status(502).json({ error: 'Failed to send verification email' });
      }
    }

    return res.json({ 
      message: 'Verification code sent to new email',
      emailCode: otpCode
    });
  } catch (error) {
    // console.error('Email change OTP error', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/profile/verify-phone-change', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body || {};
    // console.log('[Phone Verification] Profile Change - Request received for phone:', phone);
    
    if (!phone) {
      // console.log('[Phone Verification] Profile Change - Phone missing');
      return res.status(400).json({ error: 'Phone is required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      // console.log('[Phone Verification] Profile Change - User not found in session');
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // console.log('[Phone Verification] Profile Change - Current phone:', user.phone, 'New phone:', normalizedPhone);
    
    if (normalizedPhone === user.phone) {
      // console.log('[Phone Verification] Profile Change - New phone same as current phone');
      return res.status(400).json({ error: 'New phone must be different from current phone' });
    }

    const otpCode = generateCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    // Check if phone number is already in use by another active user
    const existingPhoneUser = await User.findOne({ 
      phone: normalizedPhone, 
      isDeleted: { $ne: true },
      _id: { $ne: user._id } // Exclude current user
    });
    if (existingPhoneUser) {
      // console.log('[Phone Verification] Profile Change - Phone number already in use:', {
      //   phone: normalizedPhone,
      //   existingUserId: existingPhoneUser._id,
      //   existingUserEmail: existingPhoneUser.email
      // });
      return res.status(409).json({ error: 'This phone number is already registered to another account' });
    }

    req.session[phoneChangeOTPKey] = {
      phone: normalizedPhone,
      otpHash,
      expiresAt: codeExpiryDate(),
    };

    // console.log('[Phone Verification] Profile Change - OTP generated and stored in session');

    try {
      // Format phone number to E.164 for Twilio
      const twilioPhone = formatPhoneForTwilio(normalizedPhone);
      if (!twilioPhone) {
        throw new Error('Invalid phone number format. Phone number is too short or invalid.');
      }
      await sendSmsVerificationCode(twilioPhone, otpCode);
    } catch (notificationError) {
      // console.error('[Phone Verification] Profile Change - ERROR: Failed to send SMS OTP');
      // console.error('[Phone Verification] Profile Change - ERROR.1: Error object:', notificationError);
      // console.error('[Phone Verification] Profile Change - ERROR.2: Error message:', notificationError.message);
      // console.error('[Phone Verification] Profile Change - ERROR.3: Twilio error code:', notificationError.code);
      // console.error('[Phone Verification] Profile Change - ERROR.4: Twilio error status:', notificationError.status);
      // console.error('[Phone Verification] Profile Change - ERROR.5: Twilio error moreInfo:', notificationError.moreInfo);
      // console.error('[Phone Verification] Profile Change - ERROR.6: Full error details:', {
      //   message: notificationError.message,
      //   code: notificationError.code,
      //   status: notificationError.status,
      //   moreInfo: notificationError.moreInfo,
      //   twilioErrorCode: notificationError.twilioErrorCode,
      //   twilioErrorMessage: notificationError.twilioErrorMessage,
      //   twilioErrorMoreInfo: notificationError.twilioErrorMoreInfo,
      //   userMessage: notificationError.userMessage,
      //   stack: notificationError.stack
      // });
      
      if (isProduction) {
        // console.warn('[Phone Verification] Profile Change - Continuing despite SMS send failure (production mode)');
      } else {
        delete req.session[phoneChangeOTPKey];
        // Return detailed error message to user
        const errorMessage = notificationError.userMessage || 
          `Failed to send verification SMS. ${notificationError.message || 'Unknown error'}. ` +
          (notificationError.code ? `Twilio Error Code: ${notificationError.code}. ` : '') +
          (notificationError.moreInfo ? `Details: ${notificationError.moreInfo}` : '');
        return res.status(502).json({ 
          error: errorMessage,
          twilioErrorCode: notificationError.code,
          twilioErrorMessage: notificationError.message,
          twilioErrorMoreInfo: notificationError.moreInfo
        });
      }
    }

    // console.log('[Phone Verification] Profile Change - OTP request completed successfully');
    return res.json({ 
      message: 'Verification code sent to new phone',
      phoneCode: otpCode
    });
  } catch (error) {
    // console.error('[Phone Verification] Profile Change - Error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/profile/verify-otp', requireAuth, async (req, res) => {
  try {
    const { code, type } = req.body || {}; // type: 'email' or 'phone'
    // console.log('[Phone Verification] Profile OTP Verify - Received:', { type, code: code ? '****' : 'missing' });
    
    if (!code || !type) {
      // console.log('[Phone Verification] Profile OTP Verify - Missing code or type');
      return res.status(400).json({ error: 'Code and type are required' });
    }

    if (!isValidCode(code)) {
      // console.log('[Phone Verification] Profile OTP Verify - Invalid code format');
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    const sessionKey = type === 'email' ? emailChangeOTPKey : phoneChangeOTPKey;
    const otpData = req.session[sessionKey];

    if (!otpData) {
      // console.log('[Phone Verification] Profile OTP Verify - No pending verification found for type:', type);
      return res.status(400).json({ error: 'No pending verification found' });
    }

    // console.log('[Phone Verification] Profile OTP Verify - OTP data found, phone:', otpData.phone);

    if (otpData.expiresAt && otpData.expiresAt < new Date()) {
      // console.log('[Phone Verification] Profile OTP Verify - Code expired');
      delete req.session[sessionKey];
      return res.status(410).json({ error: 'Verification code expired' });
    }

    const match = await bcrypt.compare(code, otpData.otpHash);
    // console.log('[Phone Verification] Profile OTP Verify - Code match result:', match);
    
    if (!match) {
      // console.log('[Phone Verification] Profile OTP Verify - Invalid verification code');
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark OTP as verified
    otpData.verified = true;
    req.session[sessionKey] = otpData;

    // console.log('[Phone Verification] Profile OTP Verify - Verification successful for phone:', otpData.phone);
    return res.json({ message: 'Verification successful' });
  } catch (error) {
    // console.error('[Phone Verification] Profile OTP Verify - Error:', error);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    console.log('=== [Backend] PUT /profile - Start ===');
    console.log('[Backend] Session userId:', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('[Backend] User not found for session userId:', req.session.userId);
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    console.log('[Backend] Current user:', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

    const body = req.body || {};
    console.log('[Backend] Request body:', body);
    console.log('[Backend] Request body.publicProfile:', body.publicProfile);
    console.log('[Backend] Request body.publicProfile.portfolio:', body.publicProfile?.portfolio);
    
    const {
      firstName,
      lastName,
      email,
      phone,
      postcode,
      address,
      townCity,
      county,
      tradingName,
      travelDistance,
    } = body;
    const {
      sector,
      services,
      aboutService,
      hasTradeQualification,
      hasPublicLiability,
    } = body;

    // PATCH semantics:
    // - Allow partial updates (registration step saves may only send a subset).
    // - Validate required fields ONLY if the client is trying to set them.
    const hasField = (key) => Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined && body[key] !== null;

    console.log('[Backend] Checking firstName field:', {
      hasFirstName: hasField('firstName'),
      firstName: firstName,
      currentFirstName: user.firstName,
      isChanged: hasField('firstName') && String(firstName).trim() !== user.firstName
    });
    
    console.log('[Backend] Checking lastName field:', {
      hasLastName: hasField('lastName'),
      lastName: lastName,
      currentLastName: user.lastName,
      isChanged: hasField('lastName') && String(lastName).trim() !== user.lastName
    });

    // First name and last name cannot be changed after registration
    if (hasField('firstName') && String(firstName).trim() !== user.firstName) {
      console.log('[Backend] ❌ First name change detected - returning 403');
      return res.status(403).json({ error: 'First name cannot be changed after registration' });
    }
    if (hasField('lastName') && String(lastName).trim() !== user.lastName) {
      console.log('[Backend] ❌ Last name change detected - returning 403');
      return res.status(403).json({ error: 'Last name cannot be changed after registration' });
    }
    
    console.log('[Backend] ✅ First name and last name validation passed');
    if (hasField('postcode') && !String(postcode).trim()) {
      return res.status(400).json({ error: 'Postcode is required' });
    }
    if (hasField('email')) {
      const normalizedEmailAttempt = normalizeEmail(email);
      if (!normalizedEmailAttempt) {
        return res.status(400).json({ error: 'Email is required' });
      }
    }
    if (hasField('phone')) {
      const normalizedPhoneAttempt = normalizePhone(phone);
      if (!normalizedPhoneAttempt) {
      return res.status(400).json({ error: 'Phone number is required' });
      }
    }

    const normalizedEmail = hasField('email') ? normalizeEmail(email) : user.email;
    const normalizedPhone = hasField('phone') ? normalizePhone(phone) : user.phone;

    // Check if email is being changed
    if (hasField('email') && normalizedEmail !== user.email) {
      const emailOTP = req.session[emailChangeOTPKey];
      if (!emailOTP || !emailOTP.verified || emailOTP.email !== normalizedEmail) {
        return res.status(403).json({ error: 'Email change requires OTP verification' });
      }
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'Email is already in use' });
      }
      user.email = normalizedEmail;
      delete req.session[emailChangeOTPKey];
    }

    // Check if phone is being changed
    if (hasField('phone') && normalizedPhone !== user.phone) {
      // Check if phone number is already in use by another active user
      const existingPhoneUser = await User.findOne({ 
        phone: normalizedPhone, 
        isDeleted: { $ne: true },
        _id: { $ne: user._id } // Exclude current user
      });
      if (existingPhoneUser) {
        // console.log('[Profile Update] Phone number already in use:', {
        //   phone: normalizedPhone,
        //   existingUserId: existingPhoneUser._id,
        //   existingUserEmail: existingPhoneUser.email
        // });
        return res.status(409).json({ error: 'This phone number is already registered to another account' });
      }
      const phoneOTP = req.session[phoneChangeOTPKey];
      if (!phoneOTP || !phoneOTP.verified || phoneOTP.phone !== normalizedPhone) {
        return res.status(403).json({ error: 'Phone change requires OTP verification' });
      }
      user.phone = normalizedPhone;
      delete req.session[phoneChangeOTPKey];
    }

    // First name and last name are not allowed to be updated after registration
    // if (hasField('firstName')) user.firstName = String(firstName).trim();
    // if (hasField('lastName')) user.lastName = String(lastName).trim();
    if (hasField('postcode')) user.postcode = String(postcode).trim();
    
    // Address is required for client and professional, preserve existing value if not provided
    if (address !== undefined && address !== null) {
      const trimmedAddress = String(address).trim();
      if (trimmedAddress) {
        user.address = trimmedAddress;
      } else if ((user.role === 'client' || user.role === 'professional') && !user.address) {
        return res.status(400).json({ error: 'Address is required' });
      }
    } else if ((user.role === 'client' || user.role === 'professional') && !user.address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    // Update townCity only if provided, preserve existing value if not
    if (townCity !== undefined && townCity !== null) {
      const trimmedTownCity = String(townCity).trim();
      user.townCity = trimmedTownCity || undefined;
    }
    
    // Update county only if provided, preserve existing value if not
    if (county !== undefined && county !== null) {
      const trimmedCounty = String(county).trim();
      user.county = trimmedCounty || undefined;
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {
        email: { status: 'not-started' },
        phone: { status: 'not-started' },
        address: { status: 'not-started' },
        idCard: { status: 'not-started' },
        paymentMethod: { status: 'not-started' },
        publicLiabilityInsurance: { status: 'not-started' },
      };
    }

    // Update email verification status if email was changed and verified
    if (normalizedEmail !== user.email) {
      // Email was changed and verified via OTP
      if (!user.verification.email) {
        user.verification.email = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.email.status = 'verified';
        user.verification.email.verifiedAt = new Date();
      }
    } else if (user.email && (!user.verification.email || user.verification.email.status === 'not-started')) {
      // Email exists but not verified in verification object, mark as verified
      if (!user.verification.email) {
        user.verification.email = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.email.status = 'verified';
        if (!user.verification.email.verifiedAt) {
          user.verification.email.verifiedAt = new Date();
        }
      }
    }

    // Update phone verification status if phone was changed and verified
    if (normalizedPhone !== user.phone) {
      // console.log('[Phone Verification] Profile Update - Phone changed, updating verification status');
      // Phone was changed and verified via OTP
      if (!user.verification.phone) {
        user.verification.phone = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.phone.status = 'verified';
        user.verification.phone.verifiedAt = new Date();
      }
      // console.log('[Phone Verification] Profile Update - Phone verification status updated:', user.verification.phone);
    } else if (user.phone && (!user.verification.phone || user.verification.phone.status === 'not-started')) {
      // console.log('[Phone Verification] Profile Update - Phone exists but not verified, marking as verified');
      // Phone exists but not verified in verification object, mark as verified
      if (!user.verification.phone) {
        user.verification.phone = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.phone.status = 'verified';
        if (!user.verification.phone.verifiedAt) {
          user.verification.phone.verifiedAt = new Date();
        }
      }
      // console.log('[Phone Verification] Profile Update - Phone verification status initialized:', user.verification.phone);
    }

    if (user.role === 'professional') {
      // Trading name is required for professionals, preserve existing value if not provided
      if (tradingName !== undefined && tradingName !== null) {
        const trimmedTradingName = String(tradingName).trim();
        if (trimmedTradingName) {
          user.tradingName = trimmedTradingName;
        } else if (!user.tradingName) {
          return res.status(400).json({ error: 'Trading name is required for professionals' });
        }
      } else if (!user.tradingName) {
        return res.status(400).json({ error: 'Trading name is required for professionals' });
      }
      
      // Travel distance: only update when a non-empty value is provided.
      // This prevents accidentally clearing the field when the frontend sends "" during multi-step profile setup.
      if (travelDistance !== undefined && travelDistance !== null) {
        const trimmedTravelDistance = String(travelDistance).trim();
        if (trimmedTravelDistance) {
          user.travelDistance = trimmedTravelDistance;
        } else if (!user.travelDistance) {
          return res.status(400).json({ error: 'Travel distance is required for professionals' });
        }
      } else if (!user.travelDistance) {
        return res.status(400).json({ error: 'Travel distance is required for professionals' });
      }
      
      // Sector can only be set once during registration, cannot be changed afterwards
      if (sector !== undefined && sector !== null) {
        if (user.sector && user.sector !== sector.trim()) {
          return res.status(400).json({ 
            error: 'Sector cannot be changed after registration. You can only select one sector during registration.' 
          });
        }
        // Only set sector if it doesn't exist yet
        if (!user.sector) {
          user.sector = sector.trim() || undefined;
        }
      }
      if (Array.isArray(services)) {
        user.services = services.map((service) => service?.toString().trim()).filter(Boolean);
      }
      
      // Sector cannot be changed after registration
      // If sectors array is provided, ignore it - sector is read-only after registration
      // Only allow setting sector if it doesn't exist yet (during registration)
      if (req.body.sectors !== undefined && Array.isArray(req.body.sectors) && req.body.sectors.length > 0) {
        // If user already has a sector, prevent changing it
        if (user.sector && user.sector !== req.body.sectors[0]?.toString().trim()) {
          return res.status(400).json({ 
            error: 'Sector cannot be changed after registration. You can only select one sector during registration.' 
          });
        }
        // Only set sector if it doesn't exist yet
        if (!user.sector) {
          user.sector = req.body.sectors[0]?.toString().trim() || undefined;
        }
      }
      
      user.aboutService = aboutService?.trim() || undefined;
      if (['yes', 'no'].includes(hasTradeQualification)) {
        user.hasTradeQualification = hasTradeQualification;
      }
      if (['yes', 'no'].includes(hasPublicLiability)) {
        user.hasPublicLiability = hasPublicLiability;
      }
      
      // Professional indemnity insurance details
      if (req.body.professionalIndemnityAmount !== undefined) {
        const amount = parseFloat(req.body.professionalIndemnityAmount);
        // Default to 0 when empty/invalid, and never allow negative values.
        user.professionalIndemnityAmount = isNaN(amount) ? 0 : Math.max(0, amount);
      }
      if (req.body.insuranceExpiryDate !== undefined) {
        if (req.body.insuranceExpiryDate) {
          user.insuranceExpiryDate = new Date(req.body.insuranceExpiryDate);
        } else {
          user.insuranceExpiryDate = null;
        }
      }

      // Update public profile if provided
      if (req.body.publicProfile) {
        console.log('[Backend] Updating public profile...');
        console.log('[Backend] Received publicProfile data:', req.body.publicProfile);
        
        if (!user.publicProfile) {
          console.log('[Backend] Creating new publicProfile object');
          user.publicProfile = {};
        }
        
        if (req.body.publicProfile.bio !== undefined) {
          user.publicProfile.bio = req.body.publicProfile.bio?.trim() || undefined;
          console.log('[Backend] Updated bio:', user.publicProfile.bio?.substring(0, 50) + '...');
        }
        if (req.body.publicProfile.coverImage !== undefined) {
          user.publicProfile.coverImage = req.body.publicProfile.coverImage?.trim() || undefined;
          console.log('[Backend] Updated coverImage:', user.publicProfile.coverImage);
        }
        if (req.body.publicProfile.portfolio !== undefined) {
          console.log('[Backend] Updating portfolio...');
          console.log('[Backend] Received portfolio items:', req.body.publicProfile.portfolio.length);
          console.log('[Backend] Portfolio items:', req.body.publicProfile.portfolio);
          user.publicProfile.portfolio = req.body.publicProfile.portfolio || [];
          console.log('[Backend] Portfolio updated. New count:', user.publicProfile.portfolio.length);
        }
        // publicProfileUrl is no longer used - profiles are accessed by user ID only
        // Keeping this for backward compatibility but it won't be used
        if (req.body.publicProfile.publicProfileUrl !== undefined) {
          // Ignore publicProfileUrl updates - profiles use user ID only
        }
        if (req.body.publicProfile.isPublic !== undefined) {
          user.publicProfile.isPublic = req.body.publicProfile.isPublic;
          console.log('[Backend] Updated isPublic:', user.publicProfile.isPublic);
        }
        if (req.body.publicProfile.qualifications !== undefined) {
          user.publicProfile.qualifications = req.body.publicProfile.qualifications?.trim() || undefined;
          console.log('[Backend] Updated qualifications');
        }
        if (req.body.publicProfile.certifications !== undefined) {
          user.publicProfile.certifications = req.body.publicProfile.certifications?.trim() || undefined;
          console.log('[Backend] Updated certifications');
        }
        if (req.body.publicProfile.companyDetails !== undefined) {
          user.publicProfile.companyDetails = req.body.publicProfile.companyDetails?.trim() || undefined;
          console.log('[Backend] Updated companyDetails');
        }
      }
    } else {
      user.tradingName = undefined;
      user.travelDistance = undefined;
      // Prevent clearing sector once it's been set
      // Sector is permanent after registration
      if (user.sector) {
        return res.status(400).json({ 
          error: 'Sector cannot be removed or changed after registration.' 
        });
      }
      user.services = [];
      user.aboutService = undefined;
      user.hasTradeQualification = 'no';
      user.hasPublicLiability = 'no';
    }

    console.log('[Backend] Saving user to database...');
    console.log('[Backend] User.publicProfile.portfolio before save:', user.publicProfile?.portfolio?.length || 0);
    
    await user.save();
    
    console.log('[Backend] User saved successfully');
    console.log('[Backend] User.publicProfile.portfolio after save:', user.publicProfile?.portfolio?.length || 0);
    
    const sanitizedUser = sanitizeUser(user);
    console.log('[Backend] Sanitized user.publicProfile.portfolio:', sanitizedUser.publicProfile?.portfolio?.length || 0);
    console.log('[Backend] Returning response with user data');
    
    return res.json({ user: sanitizedUser });
  } catch (error) {
    console.error('[Backend] ❌ Profile update error:', error);
    console.error('[Backend] Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post(
  '/profile/avatar',
  requireAuth,
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

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired. Please login again.' });
      }

      // Delete old avatar from Cloudinary if exists
      if (user.avatar) {
        const oldPublicId = extractPublicId(user.avatar);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (error) {
            // console.warn('Failed to delete old avatar from Cloudinary:', error);
      }
        }
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `avatar-${user._id}-${Date.now()}`,
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

      // Save Cloudinary URL to user
      user.avatar = uploadResult.secure_url;
      await user.save();

      return res.json({ user: sanitizeUser(user) });
    } catch (error) {
      // console.error('Avatar upload error', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to upload avatar' 
      });
    }
  }
);

router.put('/profile/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    // console.error('Change password error', error);
    return res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

router.delete('/profile', async (req, res) => {
  try {
    // Check authentication
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { confirmText } = req.body || {};

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ error: 'Please type "DELETE" to confirm account deletion' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // Only allow client and professional users to delete their own account
    // Admin and subadmin users should use admin panel for account management
    if (user.role === 'admin' || user.role === 'subadmin') {
      return res.status(403).json({ error: 'Admin users cannot delete their account through this endpoint. Please contact system administrator.' });
    }

    // Delete user's avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const publicId = user.avatar.match(/\/v\d+\/(.+)\./)?.[1];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        // console.warn('Failed to delete avatar from Cloudinary:', cloudinaryError);
      }
    }

    // Delete user account
    await User.findByIdAndDelete(user._id);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        // console.error('Session destroy error:', err);
    }
    });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    // console.error('Delete account error', error);
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
});

// Portfolio image/video upload - Local storage
const portfolioDir = path.join(__dirname, '..', 'uploads', 'portfolio');
// Create portfolio directory if it doesn't exist
fs.mkdir(portfolioDir, { recursive: true }).catch(() => {});

const portfolioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, portfolioDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const portfolioUpload = multer({
  storage: portfolioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (PNG, JPG, GIF, WEBP) and videos (MP4, MPEG, MOV, AVI, WEBM) are allowed.'));
    }
  }
});

// Upload portfolio image
router.post('/profile/portfolio/upload', requireAuth, portfolioUpload.single('portfolioImage'), async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
      }
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file type. Only PNG, JPG, GIF, and WEBP are allowed.' });
    }

    // Validate file size (5MB for images)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    return res.json({ imageUrl });
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
    return res.status(500).json({ error: 'Failed to upload portfolio image' });
  }
});

// Upload portfolio video
router.post('/profile/portfolio/upload-video', requireAuth, portfolioUpload.single('portfolioVideo'), async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
      }
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file type. Only MP4, MPEG, MOV, AVI, and WEBM are allowed.' });
    }

    // Validate file size (50MB for videos)
    if (req.file.size > 50 * 1024 * 1024) {
      fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'File size must be less than 50MB' });
    }

    const videoUrl = `/uploads/portfolio/${req.file.filename}`;
    const thumbnail = videoUrl; // Use video itself as thumbnail for now
    const duration = 0; // Would need video processing library to extract
    const size = req.file.size;

    return res.json({ 
      videoUrl, 
      thumbnail,
      duration,
      size
    });
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
    return res.status(500).json({ error: 'Failed to upload portfolio video' });
  }
});

// Service video upload - Local storage (for service gallery)
const videosDir = path.join(__dirname, '..', 'uploads', 'videos');
// Create videos directory if it doesn't exist
fs.mkdir(videosDir, { recursive: true }).catch(() => {
  // Ignore errors - directory might already exist
});

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    cb(null, `${sanitized}-${uniqueSuffix}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MPEG, MOV, AVI, and WEBM are allowed.'));
    }
  }
});

// Service video upload endpoint (for service gallery, not portfolio)
router.post('/profile/service/upload-video', requireAuth, videoUpload.single('portfolioVideo'), async (req, res) => {
  console.log('=== Video Upload Request Started ===');
  console.log('User ID:', req.session?.userId);
  console.log('File received:', req.file ? 'Yes' : 'No');
  
  try {
    // Check user session
    console.log('Fetching user from session...');
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.error('User not found in session:', req.session.userId);
      // Delete uploaded file if user not found
      if (req.file && req.file.path) {
        fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
      }
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    console.log('User found:', user.email);

    // Check file
    if (!req.file) {
      console.error('No video file provided in request');
      return res.status(400).json({ error: 'No video file provided' });
    }
    console.log('File details:', {
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path
    });

    // Get video URL (relative path for serving)
    const videoUrl = `/api/auth/videos/${req.file.filename}`;
    console.log('Video URL:', videoUrl);

    // Generate thumbnail URL (we'll use a placeholder for now, or implement ffmpeg later)
    const thumbnailUrl = `/api/auth/videos/thumbnail/${req.file.filename}`;
    console.log('Thumbnail URL:', thumbnailUrl);

    const responseData = { 
      videoUrl: videoUrl,
      thumbnail: thumbnailUrl,
      duration: 0, // Can be calculated with ffmpeg if needed
      size: req.file.size,
    };
    
    console.log('Sending success response:', responseData);
    return res.json(responseData);
  } catch (error) {
    console.error('=== Video Upload Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
    }
    
    return res.status(500).json({ error: 'Failed to upload portfolio video' });
  }
});

// Serve video files
router.get('/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(videosDir, filename);
  
  console.log('Serving video:', filename);
  
  if (!existsSync(filePath)) {
    console.error('Video file not found:', filePath);
    return res.status(404).json({ error: 'Video not found' });
  }
  
  res.sendFile(filePath);
});

// Serve video thumbnail (placeholder for now)
router.get('/videos/thumbnail/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(videosDir, filename);
  
  console.log('Serving video thumbnail for:', filename);
  
  if (!existsSync(videoPath)) {
    console.error('Video file not found:', videoPath);
    return res.status(404).json({ error: 'Video not found' });
  }
  
  // For now, just serve the video file itself as thumbnail
  // In production, you could use ffmpeg to generate actual thumbnails
  res.sendFile(videoPath);
});

router.delete('/profile/avatar', requireAuth, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (user.avatar) {
      // Delete from Cloudinary
      const publicId = extractPublicId(user.avatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          // console.warn('Failed to delete avatar from Cloudinary:', error);
        }
      }

      user.avatar = null;
      await user.save();
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    // console.error('Avatar removal error', error);
    return res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email), isDeleted: { $ne: true } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(403).json({ error: 'This account has been deleted' });
    }

    // Reject admin and subadmin users - they must use admin panel login
    if (user.role === 'admin' || user.role === 'subadmin') {
      return res.status(403).json({ error: 'Admin users must login through admin panel' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Password login is not enabled for this account' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Set session data - use _id.toString() for consistency
    req.session.userId = user._id.toString();
    req.session.role = user.role;

    // Set cookie maxAge to 24 hours (regardless of rememberMe)
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24; // 24 hours

    // Save session explicitly before responding
    return await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          return reject(new Error('Failed to save session'));
        }
        resolve(res.json({ user: sanitizeUser(user) }));
      });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(204).end();
  }

  req.session.destroy((err) => {
    if (err) {
      // console.error('Logout error', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    res.clearCookie('connect.sid', cookieOptions);
    return res.status(204).end();
  });
});

// Get verification status
router.get('/verification', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    // Check email verification status (if email is verified via OTP)
    if (!user.verification.email) {
      user.verification.email = { status: 'not-started' };
    }
    // Email is considered verified if user has email (from registration)
    if (user.email && user.verification.email.status === 'not-started') {
      user.verification.email.status = 'verified';
      if (!user.verification.email.verifiedAt) {
        user.verification.email.verifiedAt = user.createdAt || new Date();
      }
    }

    // Check phone verification status
    if (!user.verification.phone) {
      user.verification.phone = { status: 'not-started' };
    }
    // Phone is considered verified if user has phone (from registration)
    if (user.phone && user.verification.phone.status === 'not-started') {
      user.verification.phone.status = 'verified';
      if (!user.verification.phone.verifiedAt) {
        user.verification.phone.verifiedAt = user.createdAt || new Date();
      }
    }

    // Initialize other verification fields if they don't exist
    const verificationFields = ['address', 'idCard', 'paymentMethod', 'publicLiabilityInsurance'];
    verificationFields.forEach(field => {
      if (!user.verification[field]) {
        user.verification[field] = { status: 'not-started' };
      }
    });

    // Note: Insurance verification status should only be set to 'pending' when a document is uploaded
    // Do not automatically set to 'pending' just because hasPublicLiability === 'yes'
    // The status will be set to 'pending' when the user uploads the insurance document

    await user.save();

    return res.json({ verification: user.verification });
  } catch (error) {
    // console.error('Verification status error', error);
    return res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Upload verification document
router.post(
  '/verification/:type/upload',
  requireAuth,
  (req, res, next) => {
    verificationUploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    });
  },
  async (req, res) => {
    try {
      const { type } = req.params;
      const allowedTypes = ['address', 'idCard', 'publicLiabilityInsurance', 'paymentMethod'];
      
      if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid verification type' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Document file is required' });
      }

      // Check if Cloudinary is configured
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({ 
          error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
        });
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired. Please login again.' });
      }

      // Initialize verification object if it doesn't exist
      if (!user.verification) {
        user.verification = {};
      }
      if (!user.verification[type]) {
        user.verification[type] = { status: 'not-started' };
      }

      // Delete old document from Cloudinary if exists
      if (user.verification[type].documentUrl) {
        const oldPublicId = extractPublicId(user.verification[type].documentUrl);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (error) {
            // console.warn('Failed to delete old document from Cloudinary:', error);
          }
        }
      }

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `verification/${type}`,
            public_id: `verification-${user._id}-${type}-${Date.now()}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // For paymentMethod, also save account details from form data
      if (type === 'paymentMethod') {
        const { firstName, lastName, address, sortCode, accountNumber, bankStatementDate } = req.body;
        
        if (!firstName || !lastName || !address || !sortCode || !accountNumber || !bankStatementDate) {
          return res.status(400).json({ error: 'All payment method fields are required' });
        }

        // Validate bank statement date (must be within 3 months)
        const statementDate = new Date(bankStatementDate);
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        if (statementDate > today) {
          return res.status(400).json({ error: 'Bank statement date cannot be in the future' });
        }
        if (statementDate < threeMonthsAgo) {
          return res.status(400).json({ error: 'Bank statement must be issued within the last 3 months' });
        }

        // Store account details in verification object
        if (!user.verification[type]) {
          user.verification[type] = { status: 'not-started' };
        }
        user.verification[type].firstName = firstName.trim();
        user.verification[type].lastName = lastName.trim();
        user.verification[type].address = address.trim();
        user.verification[type].sortCode = sortCode.replace(/\D/g, ''); // Store as digits only
        user.verification[type].accountNumber = accountNumber.replace(/\D/g, ''); // Store as digits only
        user.verification[type].bankStatementDate = new Date(bankStatementDate);
      }

      // Update only the specific verification type being uploaded
      // When re-submitting a rejected document, change status from 'rejected' to 'pending'
      // Do NOT modify any other verification types (e.g., if ID is verified, keep it verified)
      const currentStatus = user.verification[type].status;
      
      // Only update status if it's not already verified
      // If it's rejected or pending, set to pending (new document submitted)
      // If it's verified, keep it verified (don't reset verified statuses)
      if (currentStatus !== 'verified') {
        user.verification[type].status = 'pending';
      }
      
      // Update document information for this type only
      user.verification[type].documentUrl = uploadResult.secure_url;
      user.verification[type].documentName = req.file.originalname;
      // Set uploadedAt timestamp when document is uploaded
      user.verification[type].uploadedAt = new Date();
      // Reset viewedByAdmin to false when new document is uploaded
      user.verification[type].viewedByAdmin = false;
      
      // Clear rejection reason only for this type (since new document is being submitted)
      if (currentStatus === 'rejected') {
        user.verification[type].rejectionReason = undefined;
      }
      
      // Preserve verifiedAt timestamp if status was already verified
      // (Don't overwrite it when re-submitting a different document type)
      // Note: We use markModified to ensure Mongoose properly saves nested object changes
      user.markModified(`verification.${type}`);

      await user.save();

      return res.json({ 
        verification: user.verification[type],
        message: 'Document uploaded successfully. Under review...'
      });
    } catch (error) {
      // console.error('Verification upload error', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to upload document' 
      });
    }
  }
);

// Update verification status (for email/phone verification)
router.put('/verification/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['email', 'phone'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid verification type' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }
    if (!user.verification[type]) {
      user.verification[type] = { status: 'not-started' };
    }

    // Update status to verified
    user.verification[type].status = 'verified';
    user.verification[type].verifiedAt = new Date();

    await user.save();

    return res.json({ 
      verification: user.verification[type],
      message: 'Verification updated successfully'
    });
  } catch (error) {
    // console.error('Verification update error', error);
    return res.status(500).json({ error: 'Failed to update verification' });
  }
});

// Delete verification document
router.delete('/verification/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['address', 'idCard', 'publicLiabilityInsurance', 'paymentMethod'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid verification type' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (!user.verification || !user.verification[type]) {
      return res.status(404).json({ error: 'Verification document not found' });
    }

    // Delete document from Cloudinary if exists
    if (user.verification[type].documentUrl) {
      const publicId = extractPublicId(user.verification[type].documentUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          // console.warn('Failed to delete document from Cloudinary:', error);
        }
      }
    }

    // Reset verification status
    user.verification[type] = {
      status: 'not-started',
    };

    await user.save();

    return res.json({ message: 'Verification document deleted successfully' });
  } catch (error) {
    // console.error('Verification delete error', error);
    return res.status(500).json({ error: 'Failed to delete verification document' });
  }
});

router.get('/me', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.json({ user: null });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null });
    }

    // Return null for admin users - they should use /api/admin/me
    if (user.role === 'admin' || user.role === 'subadmin') {
      return res.json({ user: null });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

// Debug endpoint to check session status (can be removed after debugging)
router.get('/session-debug', async (req, res) => {
  try {
    const sessionData = {
      sessionID: req.sessionID,
      userId: req.session?.userId || null,
      role: req.session?.role || null,
      cookie: {
        maxAge: req.session?.cookie?.maxAge,
        expires: req.session?.cookie?.expires,
        httpOnly: req.session?.cookie?.httpOnly,
        secure: req.session?.cookie?.secure,
        sameSite: req.session?.cookie?.sameSite,
      }
    };
    
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId);
      sessionData.userExists = !!user;
      if (user) {
        sessionData.userEmail = user.email;
        sessionData.userRole = user.role;
        sessionData.userIsDeleted = user.isDeleted;
        sessionData.userIsBlocked = user.isBlocked;
      }
    }
    
    return res.json(sessionData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch session debug info' });
  }
});

// Get public profile by user ID only
router.get('/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    // console.log('[Profile API] Requested identifier:', identifier);
    
    // Find user by ID only (identifier must be user ID)
    if (!mongoose.Types.ObjectId.isValid(identifier)) {
      // console.log('[Profile API] Invalid user ID format:', identifier);
      return res.status(404).json({ error: 'Profile not found' });
    }

    const user = await User.findOne({
      $and: [
        { _id: new mongoose.Types.ObjectId(identifier) },
        { role: 'professional' },
        { isBlocked: { $ne: true } },
        {
          $or: [
            { 'publicProfile.isPublic': { $ne: false } },
            { 'publicProfile.isPublic': { $exists: false } }
          ]
        }
      ]
    });

    // console.log('[Profile API] Found user:', user ? user._id.toString() : 'none');

    if (!user) {
      // console.log('[Profile API] User not found for ID:', identifier);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Verify we got the correct user
    const userId = user._id.toString();
    
    if (userId !== identifier) {
      // console.error('[Profile API] ID mismatch! Requested:', identifier, 'Got:', userId);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if profile is explicitly set to private
    if (user.publicProfile?.isPublic === false) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // console.log('[Profile API] Returning profile for user:', userId);

    // Return sanitized public profile data
    const reviews = await Review.find({
      professional: user._id,
      isHidden: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('reviewerName rating comment createdAt')
      .lean();

    const ratingCount = reviews.length;
    const ratingAverage =
      ratingCount === 0
        ? 0
        : reviews.reduce((sum, r) => sum + (typeof r.rating === 'number' ? r.rating : 0), 0) / ratingCount;

    const profileData = {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
      tradingName: user.tradingName,
      avatar: user.avatar,
      sector: user.sector,
      services: user.services || [],
      aboutService: user.aboutService,
      hasTradeQualification: user.hasTradeQualification,
      hasPublicLiability: user.hasPublicLiability,
      professionalIndemnityAmount: user.professionalIndemnityAmount,
      insuranceExpiryDate: user.insuranceExpiryDate,
      completedJobs: typeof user.completedJobs === 'number' ? user.completedJobs : 0,
      townCity: user.townCity,
      county: user.county,
      postcode: user.postcode,
      address: user.address,
      travelDistance: user.travelDistance,
      publicProfile: user.publicProfile || {},
      verification: user.verification || {},
      ratingAverage,
      ratingCount,
      reviews: reviews.map((r) => ({
        id: r._id?.toString?.() || String(r._id),
        name: (r.reviewerName || '').trim() || 'Anonymous',
        stars: typeof r.rating === 'number' ? r.rating : 0,
        text: (r.comment || '').trim(),
        createdAt: r.createdAt,
      })),
      createdAt: user.createdAt,
    };

    return res.json({ profile: profileData });
  } catch (error) {
    // console.error('Get public profile error', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Public SEO Content Endpoint (no authentication required)
router.get('/seo-content/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['homepage', 'blog', 'cost-guide'].includes(type)) {
      return res.status(400).json({ error: 'Invalid SEO content type' });
    }

    const seoContent = await SEOContent.findOne({ type });

    if (!seoContent) {
      return res.json({
        type,
        title: '',
        metaKeywords: '',
        metaDescription: '',
        metaTitle: '',
        metaKey: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogUrl: '',
        ogType: 'website',
        ogSiteName: '',
        twitterCard: 'summary_large_image',
        twitterTitle: '',
        twitterDescription: '',
        twitterImage: '',
        canonicalUrl: '',
        robots: 'index, follow',
        headerScript: '',
        bodyScript: '',
        description: '',
      });
    }

    return res.json(seoContent);
  } catch (error) {
    // console.error('Get public SEO content error', error);
    return res.status(500).json({ error: 'Failed to get SEO content' });
  }
});

export default router;


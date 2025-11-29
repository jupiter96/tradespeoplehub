import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import passport from '../services/passport.js';
import {
  sendEmailVerificationCode,
  sendSmsVerificationCode,
  sendPasswordResetEmail,
} from '../services/notifier.js';

// Load environment variables
dotenv.config();

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

const sanitizeUser = (user) => user.toSafeObject();

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const cookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

const CODE_LENGTH = 4;
const CODE_EXPIRATION_MINUTES = 10;
const registrationSessionKey = 'pendingRegistrationId';
const socialSessionKey = 'pendingSocialProfile';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5000';
const SOCIAL_SUCCESS_REDIRECT =
  process.env.SOCIAL_SUCCESS_REDIRECT || `${CLIENT_ORIGIN}/account`;
const SOCIAL_FAILURE_REDIRECT =
  process.env.SOCIAL_FAILURE_REDIRECT || `${CLIENT_ORIGIN}/login?social=failed`;
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
  console.warn('⚠️ Cloudinary credentials not found in environment variables.');
  console.warn('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
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

const generateCode = () =>
  Math.floor(10 ** (CODE_LENGTH - 1) + Math.random() * 9 * 10 ** (CODE_LENGTH - 1)).toString();
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
    if (user && user.role === 'admin') {
      return res.status(403).json({ error: 'Admin users cannot access regular user features' });
    }
  } catch (error) {
    console.error('Error checking user role in requireAuth', error);
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

const clearPendingRegistrationSession = (req) => {
  delete req.session[registrationSessionKey];
};

const loadPendingRegistration = async (req) => {
  const registrationId = req.session?.[registrationSessionKey];
  if (!registrationId) {
    return null;
  }

  try {
    const pending = await PendingRegistration.findById(registrationId);
    if (!pending) {
      clearPendingRegistrationSession(req);
    }
    return pending;
  } catch (error) {
    console.error('Failed to load pending registration', error);
    return null;
  }
};

const setPendingSocialProfile = (req, profile) => {
  req.session[socialSessionKey] = profile;
};

const getPendingSocialProfile = (req) => req.session?.[socialSessionKey] || null;

const clearPendingSocialProfile = (req) => {
  delete req.session[socialSessionKey];
};

const handleSocialCallback = (provider) => (req, res, next) => {
  passport.authenticate(provider, (err, result) => {
    if (err) {
      console.error(`${provider} auth error`, err);
      clearPendingSocialProfile(req);
      return res.redirect(SOCIAL_FAILURE_REDIRECT);
    }

    if (!result) {
      clearPendingSocialProfile(req);
      return res.redirect(SOCIAL_FAILURE_REDIRECT);
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

    // Reject admin users - they must use admin login
    if (result.role === 'admin') {
      clearPendingSocialProfile(req);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '?error=admin_not_allowed');
    }

    req.logIn(result, (loginErr) => {
      if (loginErr) {
        console.error(`${provider} login error`, loginErr);
        return res.redirect(SOCIAL_FAILURE_REDIRECT);
      }
      req.session.role = result.role;
      return res.redirect(SOCIAL_SUCCESS_REDIRECT);
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

  if (userType === 'professional' && (!tradingName || !townCity || !address || !travelDistance)) {
    return 'Professional registration requires business details';
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
      address,
      travelDistance,
    } = req.body;

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }
    clearPendingRegistrationSession(req);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailCode = generateCode();
    const emailCodeHash = await bcrypt.hash(emailCode, 10);

    await PendingRegistration.deleteOne({ email: normalizedEmail }).catch(() => {});

    const pendingRegistration = await PendingRegistration.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone,
      postcode,
      referralCode,
      role: userType,
      tradingName: userType === 'professional' ? tradingName : undefined,
      townCity: userType === 'professional' ? townCity : undefined,
      address: userType === 'professional' ? address : undefined,
      travelDistance: userType === 'professional' ? travelDistance : undefined,
      emailCodeHash,
      emailCodeExpiresAt: codeExpiryDate(),
    });

    try {
      await sendEmailVerificationCode(normalizedEmail, emailCode);
    } catch (notificationError) {
      console.error('Failed to send verification email', notificationError);
      // In production, continue even if email sending fails (SMTP may not be configured yet)
      if (isProduction) {
        console.warn('Continuing registration flow despite email send failure (production mode)');
      } else {
      await pendingRegistration.deleteOne();
      return res.status(502).json({ error: 'Failed to send verification email' });
      }
    }

    setPendingRegistrationSession(req, pendingRegistration.id);

    // Include code in response for testing
    return res.status(200).json({ 
      message: 'Email verification code sent',
      emailCode: emailCode
    });
  } catch (error) {
    console.error('Register initiate error', error);
    return res.status(500).json({ error: 'Failed to start registration' });
  }
});

router.post('/register/verify-email', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!isValidCode(code)) {
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    const pendingRegistration = await loadPendingRegistration(req);
    if (!pendingRegistration) {
      return res.status(400).json({ error: 'No pending registration found' });
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
    const smsCodeHash = await bcrypt.hash(smsCode, 10);

    try {
      await sendSmsVerificationCode(pendingRegistration.phone, smsCode);
    } catch (notificationError) {
      console.error('Failed to send SMS code', notificationError);
      // In production, continue even if SMS sending fails (Twilio may not be configured yet)
      if (isProduction) {
        console.warn('Continuing registration flow despite SMS send failure (production mode)');
      } else {
      return res.status(502).json({ error: 'Failed to send SMS code' });
      }
    }

    pendingRegistration.emailVerified = true;
    pendingRegistration.emailCodeHash = undefined;
    pendingRegistration.emailCodeExpiresAt = undefined;
    pendingRegistration.phoneCodeHash = smsCodeHash;
    pendingRegistration.phoneCodeExpiresAt = codeExpiryDate();
    await pendingRegistration.save();

    // Include code in response for testing
    return res.json({ 
      message: 'Email verified. SMS code sent',
      phoneCode: smsCode
    });
  } catch (err) {
    console.error('Email verification error', err);
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

router.post('/register/verify-phone', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!isValidCode(code)) {
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    const pendingRegistration = await loadPendingRegistration(req);
    if (!pendingRegistration) {
      return res.status(400).json({ error: 'No pending registration found' });
    }

    if (!pendingRegistration.emailVerified) {
      return res.status(400).json({ error: 'Email must be verified first' });
    }

    if (
      pendingRegistration.phoneCodeExpiresAt &&
      pendingRegistration.phoneCodeExpiresAt < new Date()
    ) {
      await pendingRegistration.deleteOne();
      clearPendingRegistrationSession(req);
      return res.status(410).json({ error: 'SMS code expired. Please restart registration.' });
    }

    const phoneMatch = await bcrypt.compare(code, pendingRegistration.phoneCodeHash || '');
    if (!phoneMatch) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const existingUser = await User.findOne({ email: pendingRegistration.email });
    if (existingUser) {
      clearPendingRegistrationSession(req);
      await pendingRegistration.deleteOne();
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

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

    const user = await User.create({
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      email: pendingRegistration.email,
      passwordHash: pendingRegistration.passwordHash,
      phone: pendingRegistration.phone,
      postcode: pendingRegistration.postcode,
      referralCode: pendingRegistration.referralCode,
      role: pendingRegistration.role,
      tradingName: pendingRegistration.role === 'professional' ? pendingRegistration.tradingName : undefined,
      townCity: pendingRegistration.role === 'professional' ? pendingRegistration.townCity : undefined,
      address: pendingRegistration.role === 'professional' ? pendingRegistration.address : undefined,
      travelDistance:
        pendingRegistration.role === 'professional' ? pendingRegistration.travelDistance : undefined,
      verification: verification,
    });

    req.session.userId = user.id;
    req.session.role = user.role;
    await pendingRegistration.deleteOne();
    clearPendingRegistrationSession(req);

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Phone verification error', err);
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
    const existingUser =
      (await User.findOne({ email: normalizedEmail })) ||
      (await User.findOne({
        [pending.provider === 'google' ? 'googleId' : 'facebookId']: pending.providerId,
      }));

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists for this account' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone,
      postcode,
      referralCode,
      role: userType,
      tradingName: userType === 'professional' ? tradingName : undefined,
      townCity: userType === 'professional' ? townCity : undefined,
      address: userType === 'professional' ? address : undefined,
      travelDistance: userType === 'professional' ? travelDistance : undefined,
      googleId: pending.provider === 'google' ? pending.providerId : undefined,
      facebookId: pending.provider === 'facebook' ? pending.providerId : undefined,
    });

    req.session.userId = user.id;
    req.session.role = user.role;
    clearPendingSocialProfile(req);

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Social completion error', error);
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
    console.log(`[PASSWORD-RESET] Reset link for ${user.email}: ${resetLink}`);
    
    try {
    await sendPasswordResetEmail(user.email, resetLink);
    } catch (notificationError) {
      console.error('Failed to send password reset email', notificationError);
      // In production, continue even if email sending fails (SMTP may not be configured yet)
      if (isProduction) {
        console.warn('Continuing despite email send failure (production mode)');
      }
    }

    // Include reset link in response for testing (always, not just in development)
    return res.json({ 
      message: 'If the email exists, a reset link has been sent.',
      resetLink: resetLink
    });
  } catch (error) {
    console.error('Forgot password error', error);
    return res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

router.post('/password/reset', async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long' });
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
    console.error('Reset password error', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Store OTP verification tokens in session
const emailChangeOTPKey = 'emailChangeOTP';
const phoneChangeOTPKey = 'phoneChangeOTP';

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

    const otpCode = generateCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    req.session[emailChangeOTPKey] = {
      email: normalizedEmail,
      otpHash,
      expiresAt: codeExpiryDate(),
    };

    try {
      await sendEmailVerificationCode(normalizedEmail, otpCode);
    } catch (notificationError) {
      console.error('Failed to send email OTP', notificationError);
      if (isProduction) {
        console.warn('Continuing despite email send failure (production mode)');
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
    console.error('Email change OTP error', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/profile/verify-phone-change', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone === user.phone) {
      return res.status(400).json({ error: 'New phone must be different from current phone' });
    }

    const otpCode = generateCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    req.session[phoneChangeOTPKey] = {
      phone: trimmedPhone,
      otpHash,
      expiresAt: codeExpiryDate(),
    };

    try {
      await sendSmsVerificationCode(trimmedPhone, otpCode);
    } catch (notificationError) {
      console.error('Failed to send SMS OTP', notificationError);
      if (isProduction) {
        console.warn('Continuing despite SMS send failure (production mode)');
      } else {
        delete req.session[phoneChangeOTPKey];
        return res.status(502).json({ error: 'Failed to send verification SMS' });
      }
    }

    return res.json({ 
      message: 'Verification code sent to new phone',
      phoneCode: otpCode
    });
  } catch (error) {
    console.error('Phone change OTP error', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/profile/verify-otp', requireAuth, async (req, res) => {
  try {
    const { code, type } = req.body || {}; // type: 'email' or 'phone'
    if (!code || !type) {
      return res.status(400).json({ error: 'Code and type are required' });
    }

    if (!isValidCode(code)) {
      return res.status(400).json({ error: 'A valid 4-digit code is required' });
    }

    const sessionKey = type === 'email' ? emailChangeOTPKey : phoneChangeOTPKey;
    const otpData = req.session[sessionKey];

    if (!otpData) {
      return res.status(400).json({ error: 'No pending verification found' });
    }

    if (otpData.expiresAt && otpData.expiresAt < new Date()) {
      delete req.session[sessionKey];
      return res.status(410).json({ error: 'Verification code expired' });
    }

    const match = await bcrypt.compare(code, otpData.otpHash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark OTP as verified
    otpData.verified = true;
    req.session[sessionKey] = otpData;

    return res.json({ message: 'Verification successful' });
  } catch (error) {
    console.error('OTP verification error', error);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      postcode,
      address,
      townCity,
      tradingName,
      travelDistance,
    } = req.body || {};
    const {
      sector,
      services,
      aboutService,
      hasTradeQualification,
      hasPublicLiability,
    } = req.body || {};

    if (!firstName || !lastName || !email || !phone || !postcode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = normalizeEmail(email);
    const trimmedPhone = phone.trim();

    // Check if email is being changed
    if (normalizedEmail !== user.email) {
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
    if (trimmedPhone !== user.phone) {
      const phoneOTP = req.session[phoneChangeOTPKey];
      if (!phoneOTP || !phoneOTP.verified || phoneOTP.phone !== trimmedPhone) {
        return res.status(403).json({ error: 'Phone change requires OTP verification' });
      }
      user.phone = trimmedPhone;
      delete req.session[phoneChangeOTPKey];
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.postcode = postcode.trim();
    user.address = address?.trim() || undefined;
    user.townCity = townCity?.trim() || undefined;

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
    if (trimmedPhone !== user.phone) {
      // Phone was changed and verified via OTP
      if (!user.verification.phone) {
        user.verification.phone = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.phone.status = 'verified';
        user.verification.phone.verifiedAt = new Date();
      }
    } else if (user.phone && (!user.verification.phone || user.verification.phone.status === 'not-started')) {
      // Phone exists but not verified in verification object, mark as verified
      if (!user.verification.phone) {
        user.verification.phone = { status: 'verified', verifiedAt: new Date() };
      } else {
        user.verification.phone.status = 'verified';
        if (!user.verification.phone.verifiedAt) {
          user.verification.phone.verifiedAt = new Date();
        }
      }
    }

    if (user.role === 'professional') {
      user.tradingName = tradingName?.trim() || undefined;
      user.travelDistance = travelDistance || undefined;
      user.sector = sector?.trim() || undefined;
      if (Array.isArray(services)) {
        user.services = services.map((service) => service?.toString().trim()).filter(Boolean);
      }
      user.aboutService = aboutService?.trim() || undefined;
      if (['yes', 'no'].includes(hasTradeQualification)) {
        user.hasTradeQualification = hasTradeQualification;
      }
      if (['yes', 'no'].includes(hasPublicLiability)) {
        user.hasPublicLiability = hasPublicLiability;
      }

      // Update public profile if provided
      if (req.body.publicProfile) {
        if (!user.publicProfile) {
          user.publicProfile = {};
        }
        if (req.body.publicProfile.bio !== undefined) {
          user.publicProfile.bio = req.body.publicProfile.bio?.trim() || undefined;
        }
        if (req.body.publicProfile.portfolio !== undefined) {
          user.publicProfile.portfolio = req.body.publicProfile.portfolio || [];
        }
        if (req.body.publicProfile.publicProfileUrl !== undefined) {
          user.publicProfile.publicProfileUrl = req.body.publicProfile.publicProfileUrl?.trim() || undefined;
        }
        if (req.body.publicProfile.isPublic !== undefined) {
          user.publicProfile.isPublic = req.body.publicProfile.isPublic;
        }
      }
    } else {
      user.tradingName = undefined;
      user.travelDistance = undefined;
      user.sector = undefined;
      user.services = [];
      user.aboutService = undefined;
      user.hasTradeQualification = 'no';
      user.hasPublicLiability = 'no';
    }

    await user.save();
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile update error', error);
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
            console.warn('Failed to delete old avatar from Cloudinary:', error);
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
      console.error('Avatar upload error', error);
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

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
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
    console.error('Change password error', error);
    return res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

router.delete('/profile', requireAuth, async (req, res) => {
  try {
    const { confirmText } = req.body || {};

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ error: 'Please type "DELETE" to confirm account deletion' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    // Delete user's avatar from Cloudinary if exists
    if (user.avatar) {
      try {
        const publicId = user.avatar.match(/\/v\d+\/(.+)\./)?.[1];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        console.warn('Failed to delete avatar from Cloudinary:', cloudinaryError);
      }
    }

    // Delete user account
    await User.findByIdAndDelete(user._id);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
    }
    });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error', error);
    return res.status(500).json({ error: error.message || 'Failed to delete account' });
  }
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
          console.warn('Failed to delete avatar from Cloudinary:', error);
        }
      }

      user.avatar = null;
      await user.save();
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Avatar removal error', error);
    return res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reject admin users - they must use admin login
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admin users must login through admin portal' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Password login is not enabled for this account' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    req.session.cookie.maxAge = rememberMe
      ? 1000 * 60 * 60 * 24 * 30 // 30 days
      : 1000 * 60 * 60 * 4; // 4 hours

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(204).end();
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error', err);
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

    // Check public liability insurance status
    if (user.hasPublicLiability === 'yes' && user.verification.publicLiabilityInsurance.status === 'not-started') {
      user.verification.publicLiabilityInsurance.status = 'pending';
    }

    await user.save();

    return res.json({ verification: user.verification });
  } catch (error) {
    console.error('Verification status error', error);
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
      const allowedTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
      
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
            console.warn('Failed to delete old document from Cloudinary:', error);
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

      // Update user verification status
      user.verification[type].status = 'pending';
      user.verification[type].documentUrl = uploadResult.secure_url;
      user.verification[type].documentName = req.file.originalname;
      user.verification[type].rejectionReason = undefined;

      await user.save();

      return res.json({ 
        verification: user.verification[type],
        message: 'Document uploaded successfully. Under review...'
      });
    } catch (error) {
      console.error('Verification upload error', error);
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
    const allowedTypes = ['email', 'phone', 'paymentMethod'];
    
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

    // For payment method, save masked card
    if (type === 'paymentMethod') {
      const { maskedCard } = req.body;
      if (!maskedCard) {
        return res.status(400).json({ error: 'Masked card is required' });
      }
      user.verification[type].maskedCard = maskedCard;
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
    console.error('Verification update error', error);
    return res.status(500).json({ error: 'Failed to update verification' });
  }
});

// Delete verification document
router.delete('/verification/:type', requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const allowedTypes = ['address', 'idCard', 'publicLiabilityInsurance'];
    
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
          console.warn('Failed to delete document from Cloudinary:', error);
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
    console.error('Verification delete error', error);
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
    if (user.role === 'admin') {
      return res.json({ user: null });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Session lookup error', error);
    return res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

// Get public profile by ID or publicProfileUrl
router.get('/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by publicProfileUrl first, then by _id
    let user = await User.findOne({
      $or: [
        { 'publicProfile.publicProfileUrl': identifier },
        { _id: identifier }
      ],
      role: 'professional',
      isBlocked: { $ne: true },
      $or: [
        { 'publicProfile.isPublic': { $ne: false } },
        { 'publicProfile.isPublic': { $exists: false } }
      ]
    });

    // If not found by publicProfileUrl or _id, try MongoDB ObjectId
    if (!user) {
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          user = await User.findOne({
            _id: identifier,
            role: 'professional',
            isBlocked: { $ne: true },
            $or: [
              { 'publicProfile.isPublic': { $ne: false } },
              { 'publicProfile.isPublic': { $exists: false } }
            ]
          });
        }
      } catch (err) {
        // Invalid ObjectId, continue
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if profile is explicitly set to private
    if (user.publicProfile?.isPublic === false) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Return sanitized public profile data
    const profileData = {
      id: user._id.toString(),
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
      townCity: user.townCity,
      postcode: user.postcode,
      address: user.address,
      travelDistance: user.travelDistance,
      publicProfile: user.publicProfile || {},
      verification: user.verification || {},
      createdAt: user.createdAt,
    };

    return res.json({ profile: profileData });
  } catch (error) {
    console.error('Get public profile error', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;


import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import PendingRegistration from '../models/PendingRegistration.js';
import passport from '../services/passport.js';
import {
  sendEmailVerificationCode,
  sendSmsVerificationCode,
  sendPasswordResetEmail,
} from '../services/notifier.js';

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
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
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
const uploadsRoot = path.resolve(__dirname, '../uploads');
const avatarsDir = path.join(uploadsRoot, 'avatars');
fs.mkdirSync(avatarsDir, { recursive: true });

const generateCode = () =>
  Math.floor(10 ** (CODE_LENGTH - 1) + Math.random() * 9 * 10 ** (CODE_LENGTH - 1)).toString();
const codeExpiryDate = () => new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);
const isValidCode = (code) =>
  typeof code === 'string' && code.length === CODE_LENGTH && /^\d+$/.test(code);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${req.session?.userId || 'avatar'}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

const avatarUploadMiddleware = avatarUpload.single('avatar');

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
};

const buildAvatarPath = (filename) => `/uploads/avatars/${filename}`;

const deleteAvatarFile = (storedPath) => {
  if (!storedPath?.startsWith('/uploads/')) {
    return;
  }
  const relative = storedPath.replace(/^\/uploads\//, '');
  const absolutePath = path.join(uploadsRoot, relative);
  fs.promises.unlink(absolutePath).catch(() => {});
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
      await pendingRegistration.deleteOne();
      return res.status(502).json({ error: 'Failed to send verification email' });
    }

    setPendingRegistrationSession(req, pendingRegistration.id);

    return res.status(200).json({ message: 'Email verification code sent' });
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
      return res.status(502).json({ error: 'Failed to send SMS code' });
    }

    pendingRegistration.emailVerified = true;
    pendingRegistration.emailCodeHash = undefined;
    pendingRegistration.emailCodeExpiresAt = undefined;
    pendingRegistration.phoneCodeHash = smsCodeHash;
    pendingRegistration.phoneCodeExpiresAt = codeExpiryDate();
    await pendingRegistration.save();

    return res.json({ message: 'Email verified. SMS code sent' });
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
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
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
    await sendPasswordResetEmail(user.email, resetLink);

    return res.json({ message: 'If the email exists, a reset link has been sent.' });
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
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: 'Email is already in use' });
      }
      user.email = normalizedEmail;
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.phone = phone.trim();
    user.postcode = postcode.trim();
    user.address = address?.trim() || undefined;
    user.townCity = townCity?.trim() || undefined;

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
      if (!req.file) {
        return res.status(400).json({ error: 'Avatar file is required' });
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'Session expired. Please login again.' });
      }

      if (user.avatar) {
        deleteAvatarFile(user.avatar);
      }

      user.avatar = buildAvatarPath(req.file.filename);
      await user.save();
      return res.json({ user: sanitizeUser(user) });
    } catch (error) {
      console.error('Avatar upload error', error);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

router.delete('/profile/avatar', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (user.avatar) {
      deleteAvatarFile(user.avatar);
      user.avatar = undefined;
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

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Session lookup error', error);
    return res.status(500).json({ error: 'Failed to fetch user session' });
  }
});

export default router;


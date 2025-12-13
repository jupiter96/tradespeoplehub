import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import User from '../models/User.js';
import SocialAuthError from '../models/SocialAuthError.js';

// Load environment variables
dotenv.config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FACEBOOK_CALLBACK_URL,
} = process.env;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (error) {
    done(error, null);
  }
});

const handleSocialVerify = (provider) => async (accessToken, refreshToken, profile, done) => {
  try {
    console.log(`${provider} profile received:`, {
      id: profile.id,
      hasEmail: !!profile.emails?.[0]?.value,
      hasName: !!profile.name,
      displayName: profile.displayName,
    });

    const providerId = profile.id;
    if (!providerId) {
      console.error(`${provider} profile missing ID`);
      return done(new Error('Provider profile missing ID'), null);
    }

    const email = profile.emails?.[0]?.value?.toLowerCase();
    // Handle both Google and Facebook profile structures
    // Facebook uses profile.name.firstName/lastName, Google uses givenName/familyName
    const firstName = profile.name?.givenName || profile.name?.firstName || profile.displayName?.split(' ')?.[0] || '';
    const lastName = profile.name?.familyName || profile.name?.lastName || '';

    const providerField = provider === 'google' ? 'googleId' : 'facebookId';
    
    // First, check for deleted users (including deleted ones)
    const deletedUser = 
      (await User.findOne({ [providerField]: providerId, isDeleted: true })) ||
      (email ? await User.findOne({ email, isDeleted: true }) : null);
    
    if (deletedUser) {
      console.log(`${provider} login attempt with deleted account:`, providerId);
      return done(null, false, { message: 'This account has been deleted and cannot be re-registered' });
    }
    
    // Then check for active users
    let user =
      (await User.findOne({ [providerField]: providerId, isDeleted: { $ne: true } })) ||
      (email ? await User.findOne({ email, isDeleted: { $ne: true } }) : null);

    if (user) {
      // Check if user is blocked
      if (user.isBlocked) {
        console.log(`${provider} login attempt with blocked account:`, providerId);
        return done(null, false, { message: 'Your account has been suspended. Please contact support@sortars.com' });
      }
      
      if (!user[providerField]) {
        user[providerField] = providerId;
        await user.save();
      }
      console.log(`${provider} login successful for existing user:`, user.email || user._id);
      return done(null, user);
    }

    // New user - needs profile completion
    console.log(`${provider} new user needs profile:`, { providerId, email, firstName, lastName });
    return done(null, {
      needsProfile: true,
      provider,
      providerId,
      email: email || '',
      firstName,
      lastName,
    });
  } catch (error) {
    console.error(`${provider} verification error:`, error);
    
    // Save verification error to database (async, don't wait)
    SocialAuthError.create({
      provider,
      errorType: 'verification_error',
      errorMessage: error.message || error.toString() || 'Verification error',
      errorStack: error.stack || null,
      errorDetails: {
        name: error.name,
        message: error.message,
        ...(error.response ? { response: error.response } : {}),
      },
      context: {
        providerId: profile?.id || null,
        hasEmail: !!profile?.emails?.[0]?.value,
        hasName: !!profile?.name,
      },
    }).catch((saveError) => {
      console.error('Failed to save verification error to database:', saveError);
    });
    
    return done(error, null);
  }
};

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      handleSocialVerify('google')
    )
  );
  console.log('✅ Google OAuth strategy registered');
} else {
  console.warn('⚠️ Google OAuth not configured. Missing environment variables:');
  if (!GOOGLE_CLIENT_ID) console.warn('   - GOOGLE_CLIENT_ID');
  if (!GOOGLE_CLIENT_SECRET) console.warn('   - GOOGLE_CLIENT_SECRET');
  if (!GOOGLE_CALLBACK_URL) console.warn('   - GOOGLE_CALLBACK_URL');
}

if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET && FACEBOOK_CALLBACK_URL) {
  passport.use(
    'facebook',
    new FacebookStrategy(
      {
        clientID: FACEBOOK_CLIENT_ID,
        clientSecret: FACEBOOK_CLIENT_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL,
        // Use 'name' field which includes first_name and last_name, avoid duplication
        // 'name' provides: { givenName, familyName } structure
        profileFields: ['id', 'emails', 'name', 'displayName'],
        enableProof: true, // Enable app secret proof for better security
      },
      handleSocialVerify('facebook')
    )
  );
  console.log('✅ Facebook OAuth strategy registered');
} else {
  console.warn('⚠️ Facebook OAuth not configured. Missing environment variables:');
  if (!FACEBOOK_CLIENT_ID) console.warn('   - FACEBOOK_CLIENT_ID');
  if (!FACEBOOK_CLIENT_SECRET) console.warn('   - FACEBOOK_CLIENT_SECRET');
  if (!FACEBOOK_CALLBACK_URL) console.warn('   - FACEBOOK_CALLBACK_URL');
}

export default passport;




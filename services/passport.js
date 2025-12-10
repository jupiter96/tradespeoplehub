import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import User from '../models/User.js';

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
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    // Handle both Google and Facebook profile structures
    const firstName = profile.name?.givenName || profile.name?.firstName || profile.displayName?.split(' ')?.[0] || '';
    const lastName = profile.name?.familyName || profile.name?.lastName || '';

    const providerField = provider === 'google' ? 'googleId' : 'facebookId';
    
    // First, check for deleted users (including deleted ones)
    const deletedUser = 
      (await User.findOne({ [providerField]: providerId, isDeleted: true })) ||
      (email ? await User.findOne({ email, isDeleted: true }) : null);
    
    if (deletedUser) {
      return done(null, false, { message: 'This account has been deleted and cannot be re-registered' });
    }
    
    // Then check for active users
    let user =
      (await User.findOne({ [providerField]: providerId, isDeleted: { $ne: true } })) ||
      (email ? await User.findOne({ email, isDeleted: { $ne: true } }) : null);

    if (user) {
      // Check if user is blocked
      if (user.isBlocked) {
        return done(null, false, { message: 'Your account has been suspended. Please contact support@sortars.com' });
      }
      
      if (!user[providerField]) {
        user[providerField] = providerId;
        await user.save();
      }
      return done(null, user);
    }

    return done(null, {
      needsProfile: true,
      provider,
      providerId,
      email: email || '',
      firstName,
      lastName,
    });
  } catch (error) {
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
        profileFields: ['id', 'emails', 'name', 'displayName'],
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




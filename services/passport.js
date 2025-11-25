import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

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
    const firstName = profile.name?.givenName || profile.displayName?.split(' ')?.[0] || '';
    const lastName = profile.name?.familyName || '';

    const providerField = provider === 'google' ? 'googleId' : 'facebookId';
    let user =
      (await User.findOne({ [providerField]: providerId })) ||
      (email ? await User.findOne({ email }) : null);

    if (user) {
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
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      handleSocialVerify('google')
    )
  );
}

if (FACEBOOK_CLIENT_ID && FACEBOOK_CLIENT_SECRET && FACEBOOK_CALLBACK_URL) {
  passport.use(
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
}

export default passport;




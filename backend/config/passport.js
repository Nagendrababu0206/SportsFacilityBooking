const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const githubConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

if (googleConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const user = {
        name: profile.displayName,
        email: email,
        id: profile.id
      };
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.warn('Google OAuth is disabled. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend .env file.');
}

if (githubConfigured) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : profile.username + '@github.com';
      const user = {
        name: profile.displayName || profile.username,
        email: email,
        id: profile.id
      };
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.warn('GitHub OAuth is disabled. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to the backend .env file.');
}

passport.isOAuthConfigured = {
  google: googleConfigured,
  github: githubConfigured
};

module.exports = passport;
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const getClientBaseUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';

const normalizeUrl = (value = '') => String(value).trim().replace(/\/+$/, '');
const forceHttpsForHostedUrl = (value = '') => {
  const normalized = normalizeUrl(value);
  if (!normalized) return '';
  return normalized.replace(/^http:\/\/(.+\.(?:onrender\.com|vercel\.app))/i, 'https://$1');
};

const getServerBaseUrl = (req) => {
  const explicit = forceHttpsForHostedUrl(process.env.SERVER_URL || '');
  if (explicit) return explicit;
  const host = req.get('host');
  const forwardedProto = (req.headers['x-forwarded-proto'] || '')
    .toString()
    .split(',')[0]
    .trim()
    .toLowerCase();
  const proto = forwardedProto || ((host || '').includes('onrender.com') ? 'https' : (req.protocol || 'http'));
  return `${proto}://${host}`;
};

const getGoogleRedirectUri = (req) => {
  const fromEnv = forceHttpsForHostedUrl(process.env.GOOGLE_REDIRECT_URI || '');
  if (fromEnv) return fromEnv;
  return `${getServerBaseUrl(req)}/api/auth/google/callback`;
};

const generateUniqueUsername = async (baseValue) => {
  const sanitizedBase = (baseValue || 'devconnect_user')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20) || 'devconnect_user';

  let username = sanitizedBase;
  let attempts = 0;

  while (await User.findOne({ username })) {
    attempts += 1;
    const suffix = attempts < 10
      ? String(attempts)
      : crypto.randomInt(100, 9999).toString();
    username = `${sanitizedBase}_${suffix}`.slice(0, 30);
  }

  return username;
};

const buildAuthResponse = (user) => ({
  _id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  profilePic: user.profilePic,
  token: generateToken(user._id),
});

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const sendResetPasswordEmail = async (toEmail, resetUrl) => {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (error) {
    throw new Error('Email service is not installed on server');
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'DevConnect Password Reset',
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2>Reset your DevConnect password</h2>
        <p>Click the button below to set a new password. This link expires in 15 minutes.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0073b1;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a></p>
        <p>If the button doesn't work, open this link:</p>
        <p>${resetUrl}</p>
      </div>
    `,
  });
};

const isDevMode = () => process.env.NODE_ENV !== 'production';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json(buildAuthResponse(user));
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json(buildAuthResponse(user));
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Start Google OAuth flow
// @route   GET /api/auth/google
// @access  Public
exports.googleAuthStart = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getGoogleRedirectUri(req);
  const mode = req.query.mode === 'register' ? 'register' : 'login';

  if (!clientId) {
    return res.status(500).json({ message: 'Missing GOOGLE_CLIENT_ID' });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: mode,
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const mode = req.query.state === 'register' ? 'register' : 'login';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getGoogleRedirectUri(req);

    if (!code) {
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=missing_code`);
    }

    if (!clientId || !clientSecret) {
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=google_config_missing`);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenErrorBody = await tokenResponse.text();
      console.error('Google token exchange failed', {
        status: tokenResponse.status,
        redirectUri,
        body: tokenErrorBody,
      });
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=token_exchange_failed&oauthStatus=${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=missing_access_token`);
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      const profileErrorBody = await profileResponse.text();
      console.error('Google profile fetch failed', {
        status: profileResponse.status,
        body: profileErrorBody,
      });
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=profile_fetch_failed&oauthStatus=${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    const email = (profile.email || '').toLowerCase().trim();

    if (!email) {
      return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=email_missing`);
    }

    let user = await User.findOne({ email });

    if (!user) {
      const fallbackName = profile.name || profile.given_name || email.split('@')[0];
      const username = await generateUniqueUsername(profile.given_name || fallbackName || email.split('@')[0]);
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: fallbackName,
        username,
        email,
        password: hashedPassword,
        profilePic: profile.picture || '/avatars/avatar_1.png',
      });
    } else if (!user.profilePic && profile.picture) {
      user.profilePic = profile.picture;
      await user.save();
    }

    const auth = buildAuthResponse(user);
    const redirectParams = new URLSearchParams({
      token: auth.token,
      _id: auth._id.toString(),
      name: auth.name,
      username: auth.username,
      email: auth.email,
      profilePic: auth.profilePic || '',
    });

    return res.redirect(`${getClientBaseUrl()}/auth/callback?${redirectParams.toString()}`);
  } catch (error) {
    const mode = req.query.state === 'register' ? 'register' : 'login';
    console.error('Google OAuth callback error', error);
    return res.redirect(`${getClientBaseUrl()}/${mode}?oauthError=server_error`);
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    // Return generic success response even if user does not exist.
    if (!user) {
      return res.status(200).json({ message: 'If this email exists, reset instructions were sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashResetToken(rawToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${getClientBaseUrl()}/reset-password/${rawToken}`;

    try {
      await sendResetPasswordEmail(user.email, resetUrl);
      return res.status(200).json({ message: 'If this email exists, reset instructions were sent.' });
    } catch (mailError) {
      if (isDevMode()) {
        console.warn('[forgot-password] SMTP unavailable, dev reset link:', resetUrl);
        return res.status(200).json({
          message: 'Email service is not configured. Use the dev reset link from response.',
          resetUrl,
        });
      }

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({ message: 'Failed to send reset email' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashedToken = hashResetToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

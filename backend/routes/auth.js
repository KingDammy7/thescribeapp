const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const authMiddleware = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scribe_secret_key_change_in_prod';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function makeRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = db.users.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = makeRawToken();
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const user = db.users.create({
      name: name || 'Author',
      email,
      password_hash,
      verified: false,
      verification_token,
      verification_token_expires,
    });

    sendVerificationEmail(user.email, user.name, `${FRONTEND_URL}/verify-email?token=${verification_token}`)
      .catch(e => console.error('[auth] verification email failed:', e.message));

    const { password_hash: _, verification_token: __, ...safeUser } = user;
    res.json({ token: makeToken(user), user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash: _, verification_token: __, ...safeUser } = user;
    res.json({ token: makeToken(user), user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const { password_hash: _, verification_token: __, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updated = db.users.update(req.user.id, { name, email });
    const { password_hash: _, verification_token: __, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── EMAIL VERIFICATION ─────────────────────────────────────────────────

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const user = db.users.findOne({ verification_token: token });
    if (!user) return res.status(400).json({ error: 'This verification link is invalid or has already been used.' });
    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This verification link has expired. Please request a new one.' });
    }

    const updated = db.users.update(user.id, { verified: true, verification_token: null, verification_token_expires: null });
    const { password_hash: _, verification_token: __, ...safeUser } = updated;
    res.json({ user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    if (req.user.verified) return res.json({ message: 'Your email is already verified.' });

    const verification_token = makeRawToken();
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.users.update(req.user.id, { verification_token, verification_token_expires });

    await sendVerificationEmail(req.user.email, req.user.name, `${FRONTEND_URL}/verify-email?token=${verification_token}`);
    res.json({ message: 'Verification email sent.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PASSWORD RESET ──────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = db.users.findOne({ email });
    // Always respond with success, whether or not the email exists —
    // avoids leaking which addresses are registered.
    if (user) {
      const reset_token = makeRawToken();
      const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.users.update(user.id, { reset_token, reset_token_expires });

      sendPasswordResetEmail(user.email, user.name, `${FRONTEND_URL}/reset-password?token=${reset_token}`)
        .catch(e => console.error('[auth] reset email failed:', e.message));
    }

    res.json({ message: "If that email is registered, we've sent a password reset link." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = db.users.findOne({ reset_token: token });
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
    if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    db.users.update(user.id, { password_hash, reset_token: null, reset_token_expires: null });

    res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

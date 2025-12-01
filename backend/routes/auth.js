const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { validatePassword } = require('../utils/passwordValidator');

const router = express.Router();

// Login route - supports both username and email
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    // Check if login is email or username
    const isEmail = login.includes('@');
    const query = isEmail
      ? 'SELECT * FROM users WHERE email = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const result = await pool.query(query, [login]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token (expires in 30 days)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info(`User logged in: ${user.username}`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      forcePasswordChange: user.force_password_change || false,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      emailVerified: req.user.email_verified,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join('. ') });
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Clear force_password_change flag when password is changed
    await pool.query('UPDATE users SET password_hash = $1, force_password_change = false WHERE id = $2', [hashedPassword, req.user.id]);

    logger.info(`Password changed for user: ${req.user.username}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Check if username exists
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

    res.json({ available: result.rows.length === 0 });
  } catch (error) {
    logger.error('Check username error:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email } = req.body;

    if (!firstName || !lastName || !username || !email) {
      return res.status(400).json({ error: 'First name, last name, username, and email are required' });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Validate username format (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
    }

    // Check if registration is enabled
    const regEnabledResult = await pool.query('SELECT value FROM settings WHERE key = $1', ['registration_enabled']);
    if (regEnabledResult.rows.length === 0 || regEnabledResult.rows[0].value !== 'true') {
      return res.status(403).json({ error: 'Registration is currently disabled' });
    }

    // Check allowed email domains
    const domainsResult = await pool.query('SELECT value FROM settings WHERE key = $1', ['allowed_email_domains']);
    if (domainsResult.rows.length > 0 && domainsResult.rows[0].value) {
      const allowedDomains = domainsResult.rows[0].value.split(',').map(d => d.trim()).filter(d => d);
      if (allowedDomains.length > 0) {
        const emailDomain = email.split('@')[1];
        if (!allowedDomains.includes(emailDomain)) {
          return res.status(403).json({ error: 'Email domain not allowed for registration' });
        }
      }
    }

    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Generate random password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate email verification token
    const verificationToken = crypto.randomInt(100000, 999999).toString();

    // Create user with customer role and force password change for temp password
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, email_verified, force_password_change)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, email, first_name, last_name, role`,
      [username, email, hashedPassword, firstName, lastName, 'customer', true, false, true]
    );

    const newUser = result.rows[0];

    // Store verification token in database (we'll need to add a verification_tokens table or use settings)
    await pool.query(
      `INSERT INTO settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [`email_verification_${newUser.id}`, verificationToken, `Email verification token for user ${newUser.email}, expires at ${new Date(Date.now() + 24*60*60*1000).toISOString()}`, newUser.id]
    );

    // Send verification email with temporary password
    await emailService.sendEmailVerification(email, verificationToken, tempPassword);

    logger.info(`New user registered: ${username} (${email})`);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code and temporary password.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      },
      tempPassword: tempPassword, // Send temp password in response (user should verify email and change password)
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Get user by email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get verification token
    const tokenResult = await pool.query('SELECT value FROM settings WHERE key = $1', [`email_verification_${userId}`]);
    if (tokenResult.rows.length === 0 || tokenResult.rows[0].value !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark email as verified
    await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);

    // Delete verification token
    await pool.query('DELETE FROM settings WHERE key = $1', [`email_verification_${userId}`]);

    logger.info(`Email verified for user: ${email}`);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { loginValue } = req.body;

    if (!loginValue) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    // Check if login is email or username
    const isEmail = loginValue.includes('@');
    const query = isEmail
      ? 'SELECT id, email, username FROM users WHERE email = $1'
      : 'SELECT id, email, username FROM users WHERE username = $1';

    const result = await pool.query(query, [loginValue]);

    // Always return the same message for security (don't reveal if user exists)
    const successMessage = 'If the username or email address is registered, you will receive an email to reset your password';

    if (result.rows.length === 0) {
      return res.json({ message: successMessage });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomInt(100000, 999999).toString();

    // Store reset token (expires in 1 hour)
    await pool.query(
      `INSERT INTO settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [`password_reset_${user.id}`, resetToken, `Password reset token for user ${user.email}, expires at ${new Date(Date.now() + 60*60*1000).toISOString()}`, user.id]
    );

    // Send password reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset requested for user: ${user.username}`);

    res.json({ message: successMessage });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required' });
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join('. ') });
    }

    // Get user by email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid reset code or email' });
    }

    const userId = userResult.rows[0].id;

    // Get reset token
    const tokenResult = await pool.query('SELECT value, description FROM settings WHERE key = $1', [`password_reset_${userId}`]);
    if (tokenResult.rows.length === 0 || tokenResult.rows[0].value !== resetCode) {
      return res.status(400).json({ error: 'Invalid reset code or email' });
    }

    // Check if token is expired (extract expiry from description)
    const expiryMatch = tokenResult.rows[0].description.match(/expires at (.+)$/);
    if (expiryMatch) {
      const expiryDate = new Date(expiryMatch[1]);
      if (new Date() > expiryDate) {
        await pool.query('DELETE FROM settings WHERE key = $1', [`password_reset_${userId}`]);
        return res.status(400).json({ error: 'Reset code has expired' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear force_password_change flag
    await pool.query('UPDATE users SET password_hash = $1, force_password_change = false WHERE id = $2', [hashedPassword, userId]);

    // Delete reset token
    await pool.query('DELETE FROM settings WHERE key = $1', [`password_reset_${userId}`]);

    logger.info(`Password reset successful for user: ${email}`);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;

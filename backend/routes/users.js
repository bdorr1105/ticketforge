const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const { validatePassword } = require('../utils/passwordValidator');

const router = express.Router();

// Get all users (admin only, or agents can get agent list)
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;

    // Only admins can see all users
    if (req.user.role !== 'admin' && !role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    let query = 'SELECT id, username, email, first_name, last_name, role, is_active, email_verified, created_at, last_login FROM users WHERE 1=1';
    const params = [];

    // Filter by role if provided (for agent assignment dropdown)
    if (role) {
      const roles = role.split(',');
      query += ` AND role = ANY($1)`;
      params.push(roles);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin and self)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join('. ') });
    }

    const validRoles = ['admin', 'agent', 'customer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // When admin manually creates a user with a password, don't force password change
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, email_verified, force_password_change)
       VALUES ($1, $2, $3, $4, $5, $6, true, false, false)
       RETURNING id, username, email, first_name, last_name, role, is_active, created_at`,
      [username, email, hashedPassword, firstName, lastName, role || 'customer']
    );

    logger.info(`User created: ${username} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin can update anyone, users can update themselves)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, isActive } = req.body;

    // Users can only update their own profile (except admins)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }

    // Only admins can change role and active status
    if (role !== undefined && req.user.role === 'admin') {
      const validRoles = ['admin', 'agent', 'customer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (isActive !== undefined && req.user.role === 'admin') {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, first_name, last_name, role, is_active`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User updated: ${id} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change password (users can change their own password)
router.put('/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password (except admins)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Get current password hash
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, force_password_change = false WHERE id = $2',
      [hashedPassword, id]
    );

    logger.info(`Password changed for user ${id} by ${req.user.username}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User deleted: ${result.rows[0].username} by ${req.user.username}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle email verification status (admin only)
router.patch('/:id/verify-email', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email_verified } = req.body;

    if (email_verified === undefined) {
      return res.status(400).json({ error: 'email_verified field is required' });
    }

    const result = await pool.query(
      'UPDATE users SET email_verified = $1 WHERE id = $2 RETURNING id, username, email_verified',
      [email_verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Email verification ${email_verified ? 'enabled' : 'disabled'} for user ${result.rows[0].username} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update email verification error:', error);
    res.status(500).json({ error: 'Failed to update email verification status' });
  }
});

// Reset user password (admin only)
router.patch('/:id/reset-password', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Password reset for user ${result.rows[0].username} by ${req.user.username}`);

    res.json({ message: 'Password reset successfully', username: result.rows[0].username });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;

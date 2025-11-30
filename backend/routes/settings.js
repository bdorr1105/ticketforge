const express = require('express');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all settings (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    });

    res.json(settings);
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Get specific setting
router.get('/:key', auth, authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;

    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// Update setting (admin only)
router.put('/:key', auth, authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (value !== undefined) {
      updates.push(`value = $${paramCount++}`);
      values.push(value);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    updates.push(`updated_by = $${paramCount++}`);
    values.push(req.user.id);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(key);
    const query = `UPDATE settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE key = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Setting doesn't exist, create it
      const insertResult = await pool.query(
        'INSERT INTO settings (key, value, description, updated_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [key, value, description, req.user.id]
      );

      logger.info(`Setting created: ${key} by ${req.user.username}`);
      return res.status(201).json(insertResult.rows[0]);
    }

    logger.info(`Setting updated: ${key} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Delete setting (admin only)
router.delete('/:key', auth, authorize('admin'), async (req, res) => {
  try {
    const { key } = req.params;

    const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING key', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    logger.info(`Setting deleted: ${key} by ${req.user.username}`);

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error('Delete setting error:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Reset database (admin only) - deletes all tickets and resets settings to defaults, preserves users
router.post('/reset-database', auth, authorize('admin'), async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete all tickets and related data
      await client.query('DELETE FROM attachments');
      await client.query('DELETE FROM comments');
      await client.query('DELETE FROM tickets');

      // Reset the ticket_number sequence to start from 1
      await client.query('ALTER SEQUENCE tickets_ticket_number_seq RESTART WITH 1');

      // Delete custom settings (but keep essential ones)
      await client.query(`DELETE FROM settings WHERE key NOT IN (
        'registration_enabled',
        'allowed_email_domains'
      )`);

      // Re-insert default settings
      const defaultSettings = [
        ['site_name', 'TicketForge Help Desk', 'Name of the help desk system'],
        ['tickets_per_page', '25', 'Number of tickets to display per page'],
        ['max_attachment_size', '26214400', 'Maximum attachment size in bytes (25MB)'],
        ['theme_mode', 'light', 'Theme mode (light or dark)'],
        ['primary_color', '#1976d2', 'Primary color for the theme'],
        ['company_name', 'TicketForge', 'Company name displayed in the application']
      ];

      for (const [key, value, description] of defaultSettings) {
        await client.query(
          `INSERT INTO settings (key, value, description, updated_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (key) DO UPDATE
           SET value = $2, description = $3, updated_at = CURRENT_TIMESTAMP`,
          [key, value, description, req.user.id]
        );
      }

      await client.query('COMMIT');
      client.release();

      logger.info(`Database reset by ${req.user.username}`);

      res.json({ message: 'Database reset successfully. All tickets deleted and settings restored to defaults.' });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error('Reset database error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;

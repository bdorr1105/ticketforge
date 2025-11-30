const express = require('express');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all groups
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups ORDER BY name'
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID with members
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];

    // Get group members
    const membersResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role
       FROM users u
       INNER JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY u.username`,
      [id]
    );

    group.members = membersResult.rows;

    res.json(group);
  } catch (error) {
    logger.error('Get group error:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create group (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = await pool.query(
      'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    logger.info(`Group created: ${name} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    logger.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `UPDATE groups SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    logger.info(`Group updated: ${id} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    logger.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING name', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    logger.info(`Group deleted: ${result.rows[0].name} by ${req.user.username}`);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Add user to group (admin only)
router.post('/:id/members', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await pool.query(
      'INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, id]
    );

    logger.info(`User ${userId} added to group ${id} by ${req.user.username}`);

    res.json({ message: 'User added to group successfully' });
  } catch (error) {
    logger.error('Add user to group error:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

// Remove user from group (admin only)
router.delete('/:id/members/:userId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, userId } = req.params;

    await pool.query(
      'DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2',
      [userId, id]
    );

    logger.info(`User ${userId} removed from group ${id} by ${req.user.username}`);

    res.json({ message: 'User removed from group successfully' });
  } catch (error) {
    logger.error('Remove user from group error:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
});

module.exports = router;

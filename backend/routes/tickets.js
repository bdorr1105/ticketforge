const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/tickets'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Get all tickets (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, assignedTo, customerId, groupId } = req.query;

    let query = `
      SELECT t.*,
        u1.username as customer_username, u1.email as customer_email,
        u2.username as assigned_username, u2.email as assigned_email,
        g.name as group_name,
        COUNT(c.id) as comment_count
      FROM tickets t
      LEFT JOIN users u1 ON t.customer_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN comments c ON t.id = c.ticket_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Customers can only see their own tickets
    if (req.user.role === 'customer') {
      query += ` AND t.customer_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    if (priority) {
      query += ` AND t.priority = $${paramCount++}`;
      params.push(priority);
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramCount++}`;
      params.push(assignedTo);
    }

    if (customerId) {
      query += ` AND t.customer_id = $${paramCount++}`;
      params.push(customerId);
    }

    if (groupId) {
      query += ` AND t.group_id = $${paramCount++}`;
      params.push(groupId);
    }

    query += ' GROUP BY t.id, u1.username, u1.email, u2.username, u2.email, g.name ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    logger.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*,
        u1.username as customer_username, u1.email as customer_email,
        u2.username as assigned_username, u2.email as assigned_email,
        g.name as group_name
      FROM tickets t
      LEFT JOIN users u1 ON t.customer_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN groups g ON t.group_id = g.id
      WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = result.rows[0];

    // Customers can only view their own tickets
    if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get attachments
    const attachments = await pool.query(
      'SELECT id, filename, original_filename, mime_type, file_size, created_at FROM attachments WHERE ticket_id = $1',
      [id]
    );

    ticket.attachments = attachments.rows;

    res.json(ticket);
  } catch (error) {
    logger.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create new ticket
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { subject, description, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    // Check for auto-assign setting
    const autoAssignResult = await client.query(
      `SELECT value FROM settings WHERE key = 'auto_assign_agent'`
    );
    const autoAssignAgentId = autoAssignResult.rows[0]?.value || null;

    const result = await client.query(
      `INSERT INTO tickets (subject, description, priority, customer_id, status, assigned_to)
       VALUES ($1, $2, $3, $4, 'open', $5)
       RETURNING *`,
      [subject, description, priority || 'low', req.user.id, autoAssignAgentId || null]
    );

    const ticket = result.rows[0];

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(
          `INSERT INTO attachments (ticket_id, user_id, filename, original_filename, mime_type, file_size, file_path)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ticket.id, req.user.id, file.filename, file.originalname, file.mimetype, file.size, file.path]
        );
      }
    }

    await client.query('COMMIT');

    logger.info(`Ticket created: ${ticket.ticket_number} by ${req.user.username}`);

    // Send notification email to admins/agents
    emailService.notifyNewTicket(ticket).catch(err => logger.error('Email notification error:', err));

    res.status(201).json(ticket);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  } finally {
    client.release();
  }
});

// Update ticket
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, description, status, priority, assignedTo, groupId } = req.body;

    // Check permissions and get current ticket state
    const ticketCheck = await pool.query('SELECT customer_id, status, assigned_to FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const oldTicket = ticketCheck.rows[0];
    const oldStatus = oldTicket.status;
    const oldAssignedTo = oldTicket.assigned_to;

    // Customers can only update their own tickets and only limited fields
    if (req.user.role === 'customer') {
      if (oldTicket.customer_id !== req.user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      // Customers can only update subject and description
      if (status || priority || assignedTo || groupId) {
        return res.status(403).json({ error: 'Insufficient permissions to update these fields' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (subject !== undefined) {
      updates.push(`subject = $${paramCount++}`);
      values.push(subject);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined && req.user.role !== 'customer') {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      if (status === 'resolved') {
        updates.push(`resolved_at = CURRENT_TIMESTAMP`);
      } else if (status === 'closed') {
        updates.push(`closed_at = CURRENT_TIMESTAMP`);
      }
    }
    if (priority !== undefined && req.user.role !== 'customer') {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (assignedTo !== undefined && req.user.role !== 'customer') {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assignedTo);
    }
    if (groupId !== undefined && req.user.role !== 'customer') {
      updates.push(`group_id = $${paramCount++}`);
      values.push(groupId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);
    const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    logger.info(`Ticket updated: ${result.rows[0].ticket_number} by ${req.user.username}`);

    // Send email notifications for status change
    if (status !== undefined && status !== oldStatus) {
      emailService.notifyStatusChange(id, oldStatus, status).catch(err => logger.error('Email notification error:', err));
    }

    // Send email notification for assignment
    if (assignedTo !== undefined && assignedTo !== oldAssignedTo && assignedTo) {
      emailService.notifyAssignment(id, assignedTo).catch(err => logger.error('Email notification error:', err));
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING ticket_number', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    logger.info(`Ticket deleted: ${result.rows[0].ticket_number} by ${req.user.username}`);

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    logger.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;

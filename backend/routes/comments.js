const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');
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
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Get comments for a ticket
router.get('/ticket/:ticketId', auth, async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Check if user has access to this ticket
    const ticketResult = await pool.query(
      'SELECT customer_id FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Customers can only view comments on their own tickets
    if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Customers cannot see internal comments
    let query = `
      SELECT c.*,
        u.username, u.email, u.first_name, u.last_name, u.role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
    `;

    if (req.user.role === 'customer') {
      query += ' AND c.is_internal = false';
    }

    query += ' ORDER BY c.created_at ASC';

    const result = await pool.query(query, [ticketId]);

    // Get attachments for each comment
    for (const comment of result.rows) {
      const attachments = await pool.query(
        'SELECT id, filename, original_filename, mime_type, file_size, created_at FROM attachments WHERE comment_id = $1',
        [comment.id]
      );
      comment.attachments = attachments.rows;
    }

    res.json(result.rows);
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { ticketId, content, isInternal } = req.body;

    if (!ticketId || !content) {
      return res.status(400).json({ error: 'Ticket ID and content are required' });
    }

    // Check if user has access to this ticket
    const ticketResult = await client.query(
      'SELECT customer_id FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Customers can only comment on their own tickets
    if (req.user.role === 'customer' && ticket.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Only agents and admins can create internal comments
    const internal = (req.user.role === 'agent' || req.user.role === 'admin') && isInternal === 'true';

    const result = await client.query(
      `INSERT INTO comments (ticket_id, user_id, content, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ticketId, req.user.id, content, internal]
    );

    const comment = result.rows[0];

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(
          `INSERT INTO attachments (ticket_id, comment_id, user_id, filename, original_filename, mime_type, file_size, file_path)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [ticketId, comment.id, req.user.id, file.filename, file.originalname, file.mimetype, file.size, file.path]
        );
      }
    }

    // Update ticket's updated_at timestamp
    await client.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [ticketId]);

    await client.query('COMMIT');

    logger.info(`Comment added to ticket ${ticketId} by ${req.user.username}${internal ? ' (internal)' : ''}`);

    // Send notification email
    if (internal) {
      // For internal comments, notify only agents/admins
      emailService.notifyInternalComment(ticketId, comment).catch(err => logger.error('Email notification error:', err));
    } else {
      // For regular comments, notify customer and assigned agent
      emailService.notifyNewComment(ticketId, comment).catch(err => logger.error('Email notification error:', err));
    }

    res.status(201).json(comment);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  } finally {
    client.release();
  }
});

// Update comment
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Only the comment owner can edit their comment
    const commentResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the comment author can edit this comment' });
    }

    const result = await pool.query(
      'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
      [content, id]
    );

    logger.info(`Comment ${id} updated by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this comment or is admin
    const commentResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (req.user.role !== 'admin' && commentResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);

    logger.info(`Comment ${id} deleted by ${req.user.username}`);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;

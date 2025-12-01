const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/branding');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const type = req.params.type;
    const ext = path.extname(file.originalname);
    cb(null, `${type}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
    favicon: ['image/x-icon', 'image/png'],
  };

  const type = req.params.type;
  if (allowedTypes[type] && allowedTypes[type].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${type}. Allowed: ${allowedTypes[type]?.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get theme settings (public - no auth required for display)
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM settings
       WHERE key IN ('theme_mode', 'primary_color', 'logo_url', 'favicon_url', 'company_name')
       ORDER BY key`
    );

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Set defaults if not found
    settings.theme_mode = settings.theme_mode || 'light';
    settings.primary_color = settings.primary_color || '#1976d2';
    settings.company_name = settings.company_name || 'TicketForge';

    res.json(settings);
  } catch (error) {
    logger.error('Get theme settings error:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
});

// Update theme settings (admin only)
router.put('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    const { theme_mode, primary_color, company_name } = req.body;
    const updates = [];

    if (theme_mode) {
      updates.push({ key: 'theme_mode', value: theme_mode });
    }
    if (primary_color) {
      updates.push({ key: 'primary_color', value: primary_color });
    }
    if (company_name) {
      updates.push({ key: 'company_name', value: company_name });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const { key, value } of updates) {
        await client.query(
          `INSERT INTO settings (key, value, description, updated_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (key)
           DO UPDATE SET value = $2, updated_by = $4, updated_at = CURRENT_TIMESTAMP`,
          [key, value, `Theme setting: ${key}`, req.user.id]
        );
      }

      await client.query('COMMIT');
      logger.info(`Theme settings updated by ${req.user.username}`);

      res.json({ message: 'Theme settings updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update theme settings error:', error);
    res.status(500).json({ error: 'Failed to update theme settings' });
  }
});

// Upload logo or favicon (admin only)
router.post('/upload/:type', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { type } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!['logo', 'favicon'].includes(type)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    const uploadPath = req.file.path;
    const processedFilename = `${type}-${Date.now()}.png`;
    const processedPath = path.join(path.dirname(uploadPath), processedFilename);

    // Process and resize image based on type
    try {
      if (type === 'favicon') {
        // Resize favicon to 32x32 (standard favicon size)
        await sharp(uploadPath)
          .resize(32, 32, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(processedPath);
      } else {
        // Resize logo to max 200px height, maintain aspect ratio
        await sharp(uploadPath)
          .resize(null, 200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .png()
          .toFile(processedPath);
      }

      // Delete original uploaded file
      await fs.unlink(uploadPath);
    } catch (imageError) {
      // If image processing fails, use original file
      logger.warn(`Image processing failed for ${type}, using original:`, imageError.message);
      await fs.rename(uploadPath, processedPath);
    }

    const fileUrl = `/uploads/branding/${processedFilename}`;
    const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url';

    // Get old file to delete
    const oldFile = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      [settingKey]
    );

    // Update database
    await pool.query(
      `INSERT INTO settings (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key)
       DO UPDATE SET value = $2, updated_by = $4, updated_at = CURRENT_TIMESTAMP`,
      [settingKey, fileUrl, `${type} file URL`, req.user.id]
    );

    // Delete old file if exists
    if (oldFile.rows.length > 0 && oldFile.rows[0].value) {
      const oldFilePath = path.join(__dirname, '..', oldFile.rows[0].value);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        logger.warn(`Could not delete old ${type} file:`, err.message);
      }
    }

    logger.info(`${type} uploaded and processed by ${req.user.username}: ${fileUrl}`);

    res.json({
      message: `${type} uploaded successfully`,
      url: fileUrl,
    });
  } catch (error) {
    logger.error(`Upload ${req.params.type} error:`, error);
    res.status(500).json({ error: error.message || `Failed to upload ${req.params.type}` });
  }
});

module.exports = router;

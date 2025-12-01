const { pool } = require('../config/database');
const logger = require('../utils/logger');

const up = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert default theme settings
    await client.query(`
      INSERT INTO settings (key, value, description)
      VALUES
        ('theme_mode', 'light', 'Application theme mode (light or dark)'),
        ('primary_color', '#1976d2', 'Primary brand color (hex code)'),
        ('company_name', 'TicketForge', 'Company/Organization name displayed in header'),
        ('logo_url', NULL, 'URL path to company logo image'),
        ('favicon_url', NULL, 'URL path to favicon image')
      ON CONFLICT (key) DO NOTHING
    `);

    await client.query('COMMIT');
    logger.info('Migration 003_theme_settings completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 003_theme_settings failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const down = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove theme settings
    await client.query(`
      DELETE FROM settings
      WHERE key IN ('theme_mode', 'primary_color', 'company_name', 'logo_url', 'favicon_url')
    `);

    await client.query('COMMIT');
    logger.info('Migration 003_theme_settings rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 003_theme_settings rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { up, down };

const { pool } = require('../config/database');
const logger = require('../utils/logger');

const up = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert default settings
    await client.query(`
      INSERT INTO settings (key, value, description) VALUES
      ('site_name', 'TicketForge', 'Application name'),
      ('tickets_per_page', '25', 'Number of tickets to display per page'),
      ('allow_customer_registration', 'false', 'Allow customers to self-register'),
      ('require_email_verification', 'true', 'Require email verification for new accounts'),
      ('max_attachment_size', '26214400', 'Maximum file upload size in bytes (25MB)'),
      ('allowed_attachment_types', 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Allowed file MIME types')
      ON CONFLICT (key) DO NOTHING
    `);

    // Insert default help desk group
    await client.query(`
      INSERT INTO groups (name, description)
      VALUES ('Technical Support', 'Main technical support team')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query('COMMIT');
    logger.info('Migration 002_seed_data completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 002_seed_data failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const down = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove seeded data
    await client.query(`DELETE FROM groups WHERE name = 'Technical Support'`);
    await client.query(`DELETE FROM settings WHERE key IN ('site_name', 'tickets_per_page', 'allow_customer_registration', 'require_email_verification', 'max_attachment_size', 'allowed_attachment_types')`);

    await client.query('COMMIT');
    logger.info('Migration 002_seed_data rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 002_seed_data rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { up, down };

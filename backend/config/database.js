const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

const initDatabase = async () => {
  try {
    const client = await pool.connect();

    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['admin']
    );

    // If no admin exists, create default admin
    if (adminCheck.rows.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await client.query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, email_verified, force_password_change)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (username) DO NOTHING`,
        [
          process.env.ADMIN_USERNAME || 'admin',
          process.env.ADMIN_EMAIL || 'admin@ticketforge.local',
          hashedPassword,
          'System',
          'Administrator',
          'admin',
          true,
          true,  // Built-in admin is pre-verified (no legitimate email)
          true   // Force password change on first login
        ]
      );

      logger.info('Default admin user created (password must be changed on first login, email verification skipped)');
    }

    client.release();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool, initDatabase };

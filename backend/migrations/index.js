const { pool } = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Create migrations tracking table
const createMigrationsTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Migrations table ready');
  } catch (error) {
    logger.error('Failed to create migrations table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get list of executed migrations
const getExecutedMigrations = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
  } catch (error) {
    logger.error('Failed to get executed migrations:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Mark migration as executed
const markMigrationExecuted = async (name) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
    logger.info(`Migration ${name} marked as executed`);
  } catch (error) {
    logger.error(`Failed to mark migration ${name} as executed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

// Run all pending migrations
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');

    // Ensure migrations table exists
    await createMigrationsTable();

    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();
    logger.info(`Found ${executedMigrations.length} previously executed migrations`);

    // Get all migration files
    const migrationsDir = __dirname;
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.match(/^\d{3}_.*\.js$/) && f !== 'index.js')
      .sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Run pending migrations
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');

      if (executedMigrations.includes(migrationName)) {
        logger.info(`Skipping already executed migration: ${migrationName}`);
        continue;
      }

      logger.info(`Running migration: ${migrationName}`);
      const migration = require(path.join(migrationsDir, file));

      try {
        await migration.up();
        await markMigrationExecuted(migrationName);
        logger.info(`Successfully executed migration: ${migrationName}`);
      } catch (error) {
        logger.error(`Migration ${migrationName} failed:`, error);
        throw new Error(`Migration ${migrationName} failed: ${error.message}`);
      }
    }

    logger.info('All database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
};

module.exports = { runMigrations };

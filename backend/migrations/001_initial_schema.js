const { pool } = require('../config/database');
const logger = require('../utils/logger');

const up = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Enable UUID extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // User roles enum
    await client.query(`CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer')`);

    // Ticket status enum
    await client.query(`CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed')`);

    // Ticket priority enum
    await client.query(`CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent')`);

    // Users table
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role user_role NOT NULL DEFAULT 'customer',
        avatar_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        force_password_change BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    // Groups table
    await client.query(`
      CREATE TABLE groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User-Group relationship (many-to-many)
    await client.query(`
      CREATE TABLE user_groups (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, group_id)
      )
    `);

    // Tickets table
    await client.query(`
      CREATE TABLE tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_number SERIAL UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status ticket_status DEFAULT 'open',
        priority ticket_priority DEFAULT 'low',
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        closed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Comments table (supports both public and internal comments)
    await client.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attachments table
    await client.query(`
      CREATE TABLE attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table (key-value store for application settings)
    await client.query(`
      CREATE TABLE settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Audit log table
    await client.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address INET,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX idx_tickets_customer ON tickets(customer_id)`);
    await client.query(`CREATE INDEX idx_tickets_assigned ON tickets(assigned_to)`);
    await client.query(`CREATE INDEX idx_tickets_status ON tickets(status)`);
    await client.query(`CREATE INDEX idx_tickets_created ON tickets(created_at DESC)`);
    await client.query(`CREATE INDEX idx_comments_ticket ON comments(ticket_id)`);
    await client.query(`CREATE INDEX idx_attachments_ticket ON attachments(ticket_id)`);
    await client.query(`CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)`);
    await client.query(`CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC)`);

    // Trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await client.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query(`
      CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query('COMMIT');
    logger.info('Migration 001_initial_schema completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 001_initial_schema failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const down = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop tables in reverse order
    await client.query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS settings CASCADE');
    await client.query('DROP TABLE IF EXISTS attachments CASCADE');
    await client.query('DROP TABLE IF EXISTS comments CASCADE');
    await client.query('DROP TABLE IF EXISTS tickets CASCADE');
    await client.query('DROP TABLE IF EXISTS user_groups CASCADE');
    await client.query('DROP TABLE IF EXISTS groups CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');

    // Drop types
    await client.query('DROP TYPE IF EXISTS ticket_priority CASCADE');
    await client.query('DROP TYPE IF EXISTS ticket_status CASCADE');
    await client.query('DROP TYPE IF EXISTS user_role CASCADE');

    // Drop extension
    await client.query('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE');

    await client.query('COMMIT');
    logger.info('Migration 001_initial_schema rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration 001_initial_schema rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { up, down };

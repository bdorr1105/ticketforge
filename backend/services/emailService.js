const nodemailer = require('nodemailer');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.warn('SMTP not configured - email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        logger.error('SMTP connection error:', error);
      } else {
        logger.info('SMTP configured successfully');
      }
    });
  }

  async sendEmail(to, subject, html) {
    if (!this.transporter) {
      logger.warn('Email not sent - SMTP not configured');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
      });

      logger.info(`Email sent successfully - To: ${to}, Subject: "${subject}", MessageID: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email - To: ${to}, Subject: "${subject}", Error:`, error);
      throw error;
    }
  }

  async notifyNewTicket(ticket) {
    try {
      // Get all admins and agents
      const result = await pool.query(
        `SELECT email FROM users WHERE role IN ('admin', 'agent') AND is_active = true AND email_verified = true`
      );

      const recipients = result.rows.map(row => row.email);

      if (recipients.length === 0) {
        return;
      }

      const subject = `New Ticket #${ticket.ticket_number}: ${ticket.subject}`;
      const html = `
        <h2>New Support Ticket</h2>
        <p><strong>Ticket #${ticket.ticket_number}</strong></p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <br>
        <p><strong>Description:</strong></p>
        <p>${ticket.description.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Please log in to the help desk system to view and respond to this ticket.</p>
      `;

      for (const email of recipients) {
        await this.sendEmail(email, subject, html);
      }
    } catch (error) {
      logger.error('Notify new ticket error:', error);
    }
  }

  async notifyNewComment(ticketId, comment) {
    try {
      // Get ticket details
      const ticketResult = await pool.query(
        `SELECT t.*, u.email as customer_email, u.email_verified as customer_verified
         FROM tickets t
         LEFT JOIN users u ON t.customer_id = u.id
         WHERE t.id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        return;
      }

      const ticket = ticketResult.rows[0];

      // Get comment author
      const authorResult = await pool.query(
        'SELECT username, email FROM users WHERE id = $1',
        [comment.user_id]
      );

      const author = authorResult.rows[0];

      const subject = `New Comment on Ticket #${ticket.ticket_number}: ${ticket.subject}`;
      const html = `
        <h2>New Comment</h2>
        <p><strong>Ticket #${ticket.ticket_number}:</strong> ${ticket.subject}</p>
        <p><strong>From:</strong> ${author.username}</p>
        <br>
        <p>${comment.content.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Please log in to the help desk system to view and respond.</p>
      `;

      // Notify customer if comment is from agent/admin and customer has verified email
      if (author.email !== ticket.customer_email && ticket.customer_email && ticket.customer_verified) {
        await this.sendEmail(ticket.customer_email, subject, html);
      }

      // Notify assigned agent if different from comment author and different from customer
      if (ticket.assigned_to && ticket.assigned_to !== comment.user_id && ticket.assigned_to !== ticket.customer_id) {
        const assignedResult = await pool.query(
          'SELECT email, email_verified FROM users WHERE id = $1',
          [ticket.assigned_to]
        );
        if (assignedResult.rows.length > 0 && assignedResult.rows[0].email_verified) {
          await this.sendEmail(assignedResult.rows[0].email, subject, html);
        }
      }
    } catch (error) {
      logger.error('Notify new comment error:', error);
    }
  }

  async sendPasswordReset(email, resetToken) {
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your TicketForge account.</p>
      <p>Your reset token is: <strong>${resetToken}</strong></p>
      <p>This token will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendEmailVerification(email, verificationToken, tempPassword = null) {
    const subject = 'Verify Your Email Address';
    const html = `
      <h2>Welcome to TicketForge!</h2>
      <p>Thank you for registering! Please verify your email address to complete your registration.</p>

      <h3>Email Verification Code:</h3>
      <p style="font-size: 24px; font-weight: bold; font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
        ${verificationToken}
      </p>
      <p>This code will expire in 24 hours.</p>

      ${tempPassword ? `
        <hr style="margin: 20px 0;">
        <h3>Temporary Password:</h3>
        <p style="font-size: 16px; font-weight: bold; font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
          ${tempPassword}
        </p>
        <p><strong>Important:</strong> Please change this password after your first login by going to your account settings.</p>
      ` : ''}

      <hr style="margin: 20px 0;">
      <p>If you did not create this account, please ignore this email.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password.</p>
      <p>Your password reset code is: <strong>${resetToken}</strong></p>
      <p>This code will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
    `;

    await this.sendEmail(email, subject, html);
  }

  async notifyInternalComment(ticketId, comment) {
    try {
      // Get ticket details
      const ticketResult = await pool.query(
        `SELECT t.* FROM tickets t WHERE t.id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        return;
      }

      const ticket = ticketResult.rows[0];

      // Get comment author
      const authorResult = await pool.query(
        'SELECT username, email, role FROM users WHERE id = $1',
        [comment.user_id]
      );

      const author = authorResult.rows[0];

      const subject = `Internal Note on Ticket #${ticket.ticket_number}: ${ticket.subject}`;
      const html = `
        <h2>Internal Note (Staff Only)</h2>
        <p><strong>Ticket #${ticket.ticket_number}:</strong> ${ticket.subject}</p>
        <p><strong>From:</strong> ${author.username} (${author.role})</p>
        <br>
        <p>${comment.content.replace(/\n/g, '<br>')}</p>
        <br>
        <p><em>This is an internal note - not visible to customers.</em></p>
        <p>Please log in to the help desk system to view and respond.</p>
      `;

      // Get all admins and agents except the comment author
      const recipientsResult = await pool.query(
        `SELECT email FROM users
         WHERE role IN ('admin', 'agent')
         AND is_active = true
         AND email_verified = true
         AND id != $1`,
        [comment.user_id]
      );

      const recipients = recipientsResult.rows.map(row => row.email);

      // Send to all agents/admins except the author
      for (const email of recipients) {
        await this.sendEmail(email, subject, html);
      }
    } catch (error) {
      logger.error('Notify internal comment error:', error);
    }
  }

  async notifyStatusChange(ticketId, oldStatus, newStatus) {
    try {
      // Get ticket details
      const ticketResult = await pool.query(
        `SELECT t.*, u.email as customer_email, u.email_verified as customer_verified
         FROM tickets t
         LEFT JOIN users u ON t.customer_id = u.id
         WHERE t.id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        return;
      }

      const ticket = ticketResult.rows[0];

      const subject = `Ticket #${ticket.ticket_number} Status Updated: ${newStatus.replace('_', ' ')}`;
      const html = `
        <h2>Ticket Status Update</h2>
        <p><strong>Ticket #${ticket.ticket_number}:</strong> ${ticket.subject}</p>
        <p><strong>Status changed from:</strong> ${oldStatus.replace('_', ' ')} → ${newStatus.replace('_', ' ')}</p>
        <br>
        <p>Please log in to the help desk system to view details.</p>
      `;

      // Notify customer if they have verified email
      if (ticket.customer_email && ticket.customer_verified) {
        await this.sendEmail(ticket.customer_email, subject, html);
      }

      // Notify assigned agent if exists and different from customer
      if (ticket.assigned_to && ticket.assigned_to !== ticket.customer_id) {
        const assignedResult = await pool.query(
          'SELECT email, email_verified FROM users WHERE id = $1',
          [ticket.assigned_to]
        );
        if (assignedResult.rows.length > 0 && assignedResult.rows[0].email_verified) {
          await this.sendEmail(assignedResult.rows[0].email, subject, html);
        }
      }
    } catch (error) {
      logger.error('Notify status change error:', error);
    }
  }

  async notifyAssignment(ticketId, assignedToId) {
    try {
      // Get ticket details
      const ticketResult = await pool.query(
        `SELECT t.*, u.email as customer_email
         FROM tickets t
         LEFT JOIN users u ON t.customer_id = u.id
         WHERE t.id = $1`,
        [ticketId]
      );

      if (ticketResult.rows.length === 0) {
        return;
      }

      const ticket = ticketResult.rows[0];

      // Get assigned agent details
      const agentResult = await pool.query(
        'SELECT username, email, email_verified FROM users WHERE id = $1',
        [assignedToId]
      );

      if (agentResult.rows.length === 0 || !agentResult.rows[0].email_verified) {
        return;
      }

      const agent = agentResult.rows[0];

      const subject = `You've been assigned to Ticket #${ticket.ticket_number}: ${ticket.subject}`;
      const html = `
        <h2>New Ticket Assignment</h2>
        <p>You have been assigned to the following ticket:</p>
        <p><strong>Ticket #${ticket.ticket_number}:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <br>
        <p><strong>Description:</strong></p>
        <p>${ticket.description.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Please log in to the help desk system to view and respond to this ticket.</p>
      `;

      await this.sendEmail(agent.email, subject, html);
    } catch (error) {
      logger.error('Notify assignment error:', error);
    }
  }
}

module.exports = new EmailService();

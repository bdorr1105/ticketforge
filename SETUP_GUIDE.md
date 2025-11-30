# TicketForge Setup Guide

## Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB of free disk space
- Ports 3000 and 5000 available (or modify in .env file)

## Quick Start

### 1. Initial Setup

```bash
# Navigate to the project directory
cd /home/brian/docker/TicketForge

# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

### 2. Configure Environment Variables

Edit the `.env` file and update the following important settings:

**Required Changes:**
- `DB_PASSWORD`: Change from default to a secure password
- `JWT_SECRET`: Generate a random secure string (at least 32 characters)
- `ADMIN_PASSWORD`: Set a secure admin password (change from default)

**SMTP Configuration (for email notifications):**
- `SMTP_HOST`: Your SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP port (usually 587 for TLS)
- `SMTP_USER`: Your email address
- `SMTP_PASSWORD`: Your email password or app password
- `SMTP_FROM_EMAIL`: Email address to send from

**Gmail Users:**
For Gmail, you must use an "App Password" instead of your regular password:
1. Go to Google Account Settings
2. Navigate to Security
3. Enable 2-Factor Authentication
4. Generate an App Password for "Mail"
5. Use that password in `SMTP_PASSWORD`

### 3. Build and Start the Application

```bash
# Build and start all containers
docker-compose up -d

# Check the logs to ensure everything started correctly
docker-compose logs -f
```

The application will:
1. Start PostgreSQL database
2. Initialize the database schema
3. Create the default admin user
4. Start the backend API on port 5000
5. Start the frontend on port 3000

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 5. First Login

Use the default admin credentials:
- **Username**: `admin` (or the value you set in `ADMIN_USERNAME`)
- **Password**: `admin123` (or the value you set in `ADMIN_PASSWORD`)

**IMPORTANT**: Immediately change the admin password after first login!

## User Roles

TicketForge has three user roles:

### Administrator
- Full system access
- Create and manage users
- Create and manage groups
- Assign tickets to agents
- Configure system settings
- View all tickets
- Make internal comments

### Help Desk Agent
- View and manage tickets
- Add comments to tickets
- Make internal comments (not visible to customers)
- Attach files to tickets
- Update ticket status and priority
- Assign tickets

### Customer
- Create new tickets
- View their own tickets
- Add comments to their tickets
- Attach files
- Cannot see internal comments

## Features

### Ticket Management
- Create, view, update, and close tickets
- Set priority levels (low, medium, high, urgent)
- Track status (open, in_progress, pending, resolved, closed)
- Assign tickets to agents or groups
- Attach multiple files (images, PDFs, Word docs)

### Comments System
- Public comments visible to everyone
- Internal comments visible only to agents/admins
- File attachments on comments
- Real-time comment threading

### Email Notifications
- New ticket notifications to agents
- Comment notifications to customers and assigned agents
- Configurable SMTP settings

### User Management
- Create users with different roles
- Activate/deactivate accounts
- Password management
- User profiles

### Group Management
- Organize agents into groups
- Assign tickets to groups
- Group-based ticket routing

## Configuration

### Changing Ports

Edit `docker-compose.yml` and `.env`:

```yaml
# In docker-compose.yml, change the port mapping:
ports:
  - "8080:5000"  # Backend
  - "8000:80"    # Frontend

# Update .env accordingly:
BACKEND_PORT=8080
FRONTEND_PORT=8000
```

### File Upload Limits

Edit `.env`:
```
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Database Backup

```bash
# Backup the database
docker-compose exec postgres pg_dump -U ticketforge_user ticketforge > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U ticketforge_user ticketforge < backup.sql
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart the database
docker-compose restart postgres
```

### Backend Not Starting

```bash
# View backend logs
docker-compose logs ticketforge-backend

# Common issues:
# 1. Database not ready - wait 30 seconds and check again
# 2. Port already in use - change BACKEND_PORT in .env
# 3. Missing environment variables - check .env file
```

### Frontend Not Loading

```bash
# View frontend logs
docker-compose logs ticketforge-webapp

# Rebuild the frontend
docker-compose up -d --build ticketforge-webapp
```

### Email Not Sending

1. Check SMTP credentials in `.env`
2. For Gmail, ensure you're using an App Password
3. Check backend logs: `docker-compose logs ticketforge-backend | grep -i email`
4. Test SMTP settings from the Settings page in the admin panel

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ticketforge-backend
docker-compose logs -f ticketforge-webapp
docker-compose logs -f postgres
```

### Stop the Application

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

### Update the Application

```bash
# Pull latest changes (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Reset Admin Password

```bash
# Connect to the database
docker-compose exec postgres psql -U ticketforge_user ticketforge

# Generate a new password hash (use bcrypt online or Node.js)
# Then update:
UPDATE users SET password_hash = 'new_bcrypt_hash' WHERE username = 'admin';
```

## Security Best Practices

1. **Change default credentials** immediately after first login
2. **Use strong passwords** for database and admin accounts
3. **Keep JWT_SECRET secure** and random (at least 32 characters)
4. **Use HTTPS** in production (configure reverse proxy)
5. **Regular backups** of the database
6. **Update regularly** to get security patches
7. **Restrict network access** to necessary ports only
8. **Use firewall rules** to protect the Docker host

## Production Deployment

For production use:

1. Use a reverse proxy (nginx, Traefik) with SSL/TLS
2. Configure proper firewall rules
3. Set up automated database backups
4. Use external PostgreSQL for better performance
5. Configure log rotation
6. Set up monitoring (e.g., Prometheus, Grafana)
7. Use Docker secrets for sensitive data

## Support

For issues, feature requests, or contributions:
- GitHub: https://github.com/yourusername/ticketforge
- Documentation: See README.md

## License

MIT License - See LICENSE file for details

# TicketForge - Quick Reference Card

## Getting Started

### First Time Setup
```bash
cp .env.example .env
nano .env  # Edit configuration
./start.sh
```

### Start Application
```bash
docker-compose up -d
```

### Stop Application
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f ticketforge-backend
docker-compose logs -f ticketforge-webapp
```

## Access

- **Frontend**: http://localhost:3080
- **Backend API**: http://localhost:5080
- **Default Admin**: username: `admin`, password: `admin123`

## Common Commands

### Database Operations

```bash
# Backup database
docker-compose exec postgres pg_dump -U ticketforge_user ticketforge > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U ticketforge_user ticketforge < backup.sql

# Access database shell
docker-compose exec postgres psql -U ticketforge_user ticketforge

# View database logs
docker-compose logs postgres
```

### Container Management

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart ticketforge-backend

# Rebuild and restart
docker-compose up -d --build

# View container status
docker-compose ps

# Remove all containers and volumes (⚠️ DELETES DATA)
docker-compose down -v
```

### Application Maintenance

```bash
# View backend logs
docker-compose exec ticketforge-backend tail -f /app/logs/combined.log

# View error logs only
docker-compose exec ticketforge-backend tail -f /app/logs/error.log

# Check backend health
curl http://localhost:5080/health

# Access backend shell
docker-compose exec ticketforge-backend sh

# Access frontend shell
docker-compose exec ticketforge-webapp sh
```

### File Management

```bash
# View uploaded files
ls -lah uploads/tickets/

# Check disk usage
du -sh uploads/

# Clean up old log files
docker-compose exec ticketforge-backend sh -c "cd logs && rm *.log.old"
```

## User Roles & Permissions

| Feature | Admin | Agent | Customer |
|---------|-------|-------|----------|
| Create Users | ✅ | ❌ | ❌ |
| Manage Groups | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| View All Tickets | ✅ | ✅ | Own Only |
| Assign Tickets | ✅ | ✅ | ❌ |
| Internal Comments | ✅ | ✅ | ❌ |
| Create Tickets | ✅ | ✅ | ✅ |
| Add Comments | ✅ | ✅ | ✅ |
| Upload Files | ✅ | ✅ | ✅ |

## Ticket Workflow

1. **Customer creates ticket**
   - Status: Open
   - Priority: Set by customer

2. **Agent picks up ticket**
   - Assign to self
   - Change status to In Progress

3. **Agent works on ticket**
   - Add comments (public or internal)
   - Attach files if needed
   - Request more info: Status → Pending

4. **Agent resolves ticket**
   - Add resolution comment
   - Change status to Resolved

5. **Admin closes ticket**
   - Review resolution
   - Change status to Closed

## Environment Variables

### Required
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret (32+ chars)
- `ADMIN_PASSWORD` - Initial admin password

### SMTP (Email)
- `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (587 for TLS)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password (app password for Gmail)
- `SMTP_FROM_EMAIL` - From email address
- `SMTP_FROM_NAME` - From display name

### Optional
- `BACKEND_PORT` - Backend port (default: 5000)
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `MAX_FILE_SIZE` - Max upload size in bytes (default: 10MB)

## Troubleshooting

### Database Connection Failed
```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Check postgres logs
docker-compose logs postgres
```

### Backend Won't Start
```bash
# Check backend logs
docker-compose logs ticketforge-backend

# Verify .env file
cat .env | grep -v PASSWORD

# Rebuild backend
docker-compose up -d --build ticketforge-backend
```

### Frontend Shows Errors
```bash
# Check frontend logs
docker-compose logs ticketforge-webapp

# Rebuild frontend
docker-compose up -d --build ticketforge-webapp

# Clear browser cache
# Ctrl+Shift+R (Chrome/Firefox)
```

### Email Not Sending
```bash
# Check SMTP settings in .env
cat .env | grep SMTP

# Test SMTP from backend logs
docker-compose logs ticketforge-backend | grep -i smtp

# For Gmail: ensure App Password is used
# Go to: Google Account → Security → 2FA → App Passwords
```

### Port Already in Use
```bash
# Change ports in .env
BACKEND_PORT=5001
FRONTEND_PORT=3001

# Restart
docker-compose down
docker-compose up -d
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Remove old Docker images
docker system prune -a

# Check upload folder size
du -sh uploads/

# Clean old logs
docker-compose exec ticketforge-backend sh -c "rm -f logs/*.log.old"
```

## API Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# Get current user
curl http://localhost:5080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Tickets
```bash
# List tickets
curl http://localhost:5080/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get ticket
curl http://localhost:5080/api/tickets/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create ticket
curl -X POST http://localhost:5080/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "subject=Test Ticket" \
  -F "description=This is a test" \
  -F "priority=medium"
```

### Comments
```bash
# Get comments
curl http://localhost:5080/api/comments/ticket/TICKET_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add comment
curl -X POST http://localhost:5080/api/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "ticketId=TICKET_ID" \
  -F "content=My comment" \
  -F "isInternal=false"
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `DB_PASSWORD` in .env
- [ ] Set random `JWT_SECRET` (32+ characters)
- [ ] Configured firewall rules
- [ ] Enabled HTTPS (production)
- [ ] Regular database backups
- [ ] Updated all user passwords
- [ ] Reviewed user permissions
- [ ] Configured SMTP securely
- [ ] Updated Docker images regularly

## Backup Strategy

### Daily Backup Script
```bash
#!/bin/bash
# Save as backup.sh and run daily via cron

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker-compose exec -T postgres pg_dump -U ticketforge_user ticketforge > \
  $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Cron Setup
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/ticketforge/backup.sh
```

## Performance Tips

1. **Regular Maintenance**
   - Clean up old logs
   - Archive old tickets
   - Optimize database (VACUUM)

2. **Monitoring**
   - Watch disk usage
   - Monitor database size
   - Check error logs

3. **Scaling**
   - Use external PostgreSQL for large deployments
   - Add reverse proxy with caching
   - Configure CDN for static files

## Support Resources

- **Setup Guide**: See SETUP_GUIDE.md
- **API Docs**: See API_DOCUMENTATION.md
- **Project Summary**: See PROJECT_SUMMARY.md
- **GitHub Issues**: Report bugs and feature requests

---

**Quick Help**: `docker-compose logs -f` to view all logs

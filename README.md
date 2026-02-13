<div align="center">
  <img src="https://raw.githubusercontent.com/bdorr1105/ticketforge/main/frontend/public/logo.png" alt="TicketForge Logo" width="200"/>

  # TicketForge - Open Source Help Desk Solution

  A modern, Docker-based help desk ticketing system with role-based permissions, email integration, and a clean web interface.

  [![Docker Pulls](https://img.shields.io/docker/pulls/ldscyber/ticketforge-backend)](https://hub.docker.com/r/ldscyber/ticketforge-backend)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## Features

### Ticket Management
- **Create & Track Tickets**: Submit tickets with subject, description, priority, and attachments
- **Search & Filter**: Search tickets by number, subject, or customer name; filter by status and priority
- **Ticket Assignment**: Assign tickets to agents/admins
- **Status Tracking**: Track tickets through open, in progress, pending, resolved, and closed states
- **Priority Levels**: Low, medium, high, and urgent priority settings
- **File Attachments**: Support for screenshots, PDFs, Word documents, and more
- **Comment System**: Public comments visible to customers and internal notes for staff only

### User Management
- **Role-Based Permissions**:
  - **Administrator**: Full system access - manage settings, users, groups, tickets
  - **Agent (Help Desk User)**: View and manage tickets, add internal notes, assign tickets
  - **Customer**: Submit tickets, view own tickets, add comments
- **User Authentication**: Login with username or email
- **Profile Management**: Users can update their profile and change password
- **Email Verification**: Verify user email addresses
- **Password Reset**: Secure password reset flow

### Communication
- **Email Notifications**: SMTP integration for notifications on:
  - New tickets
  - New comments
  - Ticket status changes
  - Ticket assignments
  - Internal notes (agents/admins only)
- **Internal Notes**: Private staff-only comments with email notifications to other agents
- **Threaded Discussions**: Reply to comments to create threaded conversations

### Interface
- **Modern UI**: Clean, responsive Material-UI design
- **Dark Mode**: Toggle between light and dark themes
- **Customizable Branding**: Upload custom logo and set company name
- **Real-time Search**: Instant ticket search as you type
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## Screenshots

<div align="center">

### Light Theme
<img src="https://raw.githubusercontent.com/bdorr1105/ticketforge/main/screenshots/ticketforge-light-theme.png" alt="TicketForge Light Theme" width="800"/>

### Dark Theme
<img src="https://raw.githubusercontent.com/bdorr1105/ticketforge/main/screenshots/ticketforge-dark-theme.png" alt="TicketForge Dark Theme" width="800"/>

### Navigation Menu
<img src="https://raw.githubusercontent.com/bdorr1105/ticketforge/main/screenshots/ticketforge-sidemenu.png" alt="TicketForge Side Menu" width="800"/>

### Custom Branding
<img src="https://raw.githubusercontent.com/bdorr1105/ticketforge/main/screenshots/ticketforge-branding.png" alt="TicketForge Branding Settings" width="800"/>

</div>

## Project Structure

```
TicketForge/
├── backend/           # Node.js/Express API
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Auth, validation, etc.
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── frontend/          # React web interface
│   ├── public/        # Static assets
│   └── src/           # React components
├── database/          # Database initialization
│   └── init/          # SQL schema files
├── uploads/           # File storage
│   ├── tickets/       # Ticket attachments
│   └── avatars/       # User avatars
├── logs/              # Application logs
└── docker-compose.yml # Docker orchestration
```

## Quick Start

### Using Docker Compose (Recommended)

The easiest way to get started is using Docker Compose with pre-built images from Docker Hub. **No cloning required!**

**1. Create project directory and files:**

```bash
mkdir ticketforge
cd ticketforge
```

**2. Create docker-compose.yml:**

Download or create the compose file:

```bash
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/docker-compose.yml
```

Or create it manually (see Docker Compose Reference section below for full content).

**3. Configure environment variables:**

Download the example .env file:

```bash
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/.env.example
mv .env.example .env
```

Or create .env manually with these required settings:

```env
# Database
DB_PASSWORD=change_this_password

# JWT Authentication (paste the generated secret from above)
JWT_SECRET=your_generated_jwt_secret_here

# Admin Account
ADMIN_EMAIL=admin@ticketforge.local
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin

# Ports (optional)
BACKEND_PORT=5080
FRONTEND_PORT=3080
```

**4. Generate a secure JWT secret:**

```bash
openssl rand -base64 32
```

Copy the output and paste it into your `.env` file as the `JWT_SECRET` value.

**5. Start TicketForge:**

```bash
docker compose up -d
```

That's it! TicketForge will be available at http://localhost:3080

### What Happens on First Startup

- Database schema is automatically created by backend migrations
- A `data/` directory is created with subdirectories:
  - `data/postgres/` - PostgreSQL database files
  - `data/uploads/` - Uploaded files (tickets, avatars, logos)
  - `data/logs/` - Application logs
- Default admin user is created using credentials from `.env`
- All data is stored in the local `data/` directory for easy backup and portability

### Data Portability

Your TicketForge data is **100% portable**:
- Simply copy the entire directory (including `data/`) to another server
- Run `docker compose up -d` on the new server
- Everything works immediately - database, uploads, settings all preserved!

### Docker Compose Reference

The included `docker-compose.yml` uses pre-built images from Docker Hub:

```yaml
---
services:
  postgres:
    image: postgres:15-alpine
    container_name: ticketforge_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ticketforge
      POSTGRES_USER: ticketforge_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - ticketforge_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ticketforge_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  ticketforge-backend:
    image: ldscyber/ticketforge-backend:latest  # or use :v1.3.0 for specific version
    container_name: ticketforge_backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT:-5080}:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=ticketforge
      - DB_USER=ticketforge_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_SECURE=${SMTP_SECURE}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - SMTP_FROM_NAME=${SMTP_FROM_NAME}
      - SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
    volumes:
      - ./data/uploads:/app/uploads
      - ./data/logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ticketforge_network

  ticketforge-webapp:
    image: ldscyber/ticketforge-webapp:latest  # or use :v1.3.0 for specific version
    container_name: ticketforge_webapp
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-3080}:80"
    depends_on:
      - ticketforge-backend
    networks:
      - ticketforge_network

networks:
  ticketforge_network:
    driver: bridge
```

**Key Points:**
- Uses pre-built images from Docker Hub (no building required)
- Database schema automatically created by backend migrations on first startup
- All data stored in local `./data/` directory using bind mounts (easily portable!)
- All sensitive values use environment variables from `.env`
- Health checks ensure proper startup order
- No need to clone the repository - just download compose file and .env!

### Build from Source (Development)

If you want to develop or customize TicketForge:

```bash
git clone https://github.com/bdorr1105/ticketforge.git
cd ticketforge
cp .env.example .env
nano .env  # Edit configuration

# Use the development compose file to build from source
docker compose -f docker-compose.dev.yml up -d --build
```

## Configuration

### Required Settings

Edit `.env` file and configure these required settings:

```env
# Database (CHANGE THESE!)
DB_PASSWORD=your_secure_database_password

# JWT Authentication (CHANGE THIS!)
JWT_SECRET=your_random_secret_key_at_least_32_characters_long

# Admin Account (CHANGE THIS!)
ADMIN_PASSWORD=your_admin_password

# Application URLs
APP_URL=http://localhost:3080
```

### Optional SMTP Settings

For email notifications, configure SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME="Your Company Support"
SMTP_FROM_EMAIL=your-email@gmail.com
```

> **Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Port Configuration

Default ports can be changed in `.env`:

```env
BACKEND_PORT=5080   # Backend API port
FRONTEND_PORT=3080  # Frontend web UI port
```

## Access

After starting the services:

- **Web Interface**: http://localhost:3080 (or your `FRONTEND_PORT`)
- **API Endpoint**: http://localhost:5080 (or your `BACKEND_PORT`)

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123` (or your `ADMIN_PASSWORD` from .env)

**⚠️ CHANGE THE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Tech Stack

- **Backend**: Node.js 18, Express, PostgreSQL 15
- **Frontend**: React 18, Material-UI 5
- **Authentication**: JWT
- **Email**: Nodemailer
- **Containerization**: Docker, Docker Compose

## Docker Images

TicketForge uses unified versioning - both frontend and backend images share the same version tag.

- **Backend**: [ldscyber/ticketforge-backend](https://hub.docker.com/r/ldscyber/ticketforge-backend)
- **Frontend**: [ldscyber/ticketforge-webapp](https://hub.docker.com/r/ldscyber/ticketforge-webapp)

Available tags:
  - `latest` - Latest stable release (currently v1.3.0)
  - `v1.3.0` - Profile role/group management, assignment dropdown cleanup, password change fixes
  - `v1.2.0` - Unified versioning across frontend and backend

## Recent Changes

### v1.3.0 (Current)
- **Profile Role & Group Management**: User profile page now displays role and group assignments, editable by admins
- **Cleaner Assignment Dropdown**: Ticket assignment dropdown no longer shows user roles, just usernames
- **Fixed Password Change**: Corrected database column reference (`password_hash`) in profile password change
- **Fixed Force Password Change Flow**: Wrong current password no longer incorrectly logs the user out

### v1.2.0
- **Unified Versioning**: Frontend and backend now share a single project version
- All Docker images for a release use the same version tag

### v1.1.x (Legacy - separate frontend/backend versions)
- Fixed remote deployment login issue (relative API URLs)
- Comment deletion with role-based permissions
- Fixed upload directory creation and bind mount support
- Fixed registration settings save button
- Automatic database migrations, favicon support, image resizing
- Easy data portability with local `./data/` directory

### Available Environment Variables

See [.env.example](.env.example) for all available configuration options.

## Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [Quick Reference](QUICK_REFERENCE.md) - Common commands and troubleshooting
- [Project Summary](PROJECT_SUMMARY.md) - Architecture and technical details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions:
- Create an issue on GitHub
- Check the [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common problems

## License

MIT License - See [LICENSE](LICENSE) file for details

## Acknowledgments

Built with you in mind ❤️ using modern open-source technologies.

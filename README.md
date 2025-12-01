<div align="center">
  <img src="frontend/public/logo.png" alt="TicketForge Logo" width="200"/>

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

The easiest way to get started is using Docker Compose with pre-built images from Docker Hub.

**1. Clone the repository:**

```bash
git clone https://github.com/bdorr1105/ticketforge.git
cd ticketforge
```

> **Why clone?** The repository includes database initialization scripts required for setup.

**2. Configure environment variables:**

```bash
# Copy the example .env file
cp .env.example .env

# Generate a secure JWT secret
openssl rand -base64 32

# Edit .env and configure your settings
nano .env
```

**Required settings in `.env`:**

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

**3. Start TicketForge:**

```bash
docker compose up -d
```

That's it! TicketForge will be available at http://localhost:3080

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

TicketForge is available on Docker Hub with version tags:

- **Backend**: [ldscyber/ticketforge-backend](https://hub.docker.com/r/ldscyber/ticketforge-backend)
  - `latest` - Latest stable release
  - `v1.0.0` - Specific version

- **Frontend**: [ldscyber/ticketforge-webapp](https://hub.docker.com/r/ldscyber/ticketforge-webapp)
  - `latest` - Latest stable release
  - `v1.0.0` - Specific version

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

Built with ❤️ using modern open-source technologies.

# TicketForge - Open Source Help Desk Solution

A modern, Docker-based help desk ticketing system with role-based permissions, email integration, and a clean web interface.

[![Docker Pulls](https://img.shields.io/docker/pulls/ldscyber/ticketforge-backend)](https://hub.docker.com/r/ldscyber/ticketforge-backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

### Option 1: Using Docker Hub (Recommended for Production)

Pull and run pre-built images from Docker Hub:

```bash
# Download docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/docker-compose.hub.yml

# Create .env file
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/.env.example
cp .env.example .env
nano .env  # Edit your configuration

# Start the services
docker-compose -f docker-compose.hub.yml up -d
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/bdorr1105/ticketforge.git
cd ticketforge

# Copy and configure environment
cp .env.example .env
nano .env  # Edit configuration

# Start with Docker Compose
docker-compose up -d
```

### Option 3: Using the Startup Script

```bash
./start.sh
```

The script will:
- Check for Docker and Docker Compose
- Create .env file if needed
- Build and start all services
- Display access information

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

## Development

### Running Locally

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (requires PostgreSQL)
cd backend && npm run dev

# Start frontend
cd frontend && npm start
```

### Building Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build ticketforge-backend
docker-compose build ticketforge-webapp
```

## Deployment

### Deploying to Docker Hub

1. **Build and tag images**:
   ```bash
   # Build backend
   docker build -t ldscyber/ticketforge-backend:latest ./backend
   docker build -t ldscyber/ticketforge-backend:v1.0.0 ./backend

   # Build frontend
   docker build -t ldscyber/ticketforge-webapp:latest ./frontend
   docker build -t ldscyber/ticketforge-webapp:v1.0.0 ./frontend
   ```

2. **Push to Docker Hub**:
   ```bash
   docker login
   docker push ldscyber/ticketforge-backend:latest
   docker push ldscyber/ticketforge-backend:v1.0.0
   docker push ldscyber/ticketforge-webapp:latest
   docker push ldscyber/ticketforge-webapp:v1.0.0
   ```

3. **Users can then deploy using**:
   ```bash
   docker-compose -f docker-compose.hub.yml up -d
   ```

### Environment Variables

See `.env.example` for all available configuration options.

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

# Quick Start: Publishing TicketForge

Your usernames are already configured:
- **GitHub**: bdorr1105
- **Docker Hub**: ldscyber

## Step 1: Publish to GitHub

```bash
cd /home/brian/docker/TicketForge

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - TicketForge v1.0.0

Features:
- Complete ticket management system
- Role-based access control (Admin, Agent, Customer)
- Email notifications with SMTP integration
- Internal notes for staff
- File attachments
- Search and filtering
- Profile management
- Dark mode support
- Customizable branding"

# Add GitHub remote
git remote add origin https://github.com/bdorr1105/ticketforge.git

# Push to GitHub
git branch -M main
git push -u origin main

# Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: **ticketforge**
3. Description: **Open Source Help Desk Solution - Modern Docker-based ticketing system**
4. Choose **Public**
5. **Do NOT** initialize with README (we already have one)
6. Click **Create repository**

Then run the commands from Step 1 above.

## Step 3: Publish to Docker Hub

### Option A: Using the Script (Recommended)

```bash
./publish-docker.sh ldscyber v1.0.0
```

### Option B: Manual Commands

```bash
# Login to Docker Hub
docker login
# Enter username: ldscyber
# Enter password: (your Docker Hub password)

# Build and tag backend
docker build -t ldscyber/ticketforge-backend:latest -t ldscyber/ticketforge-backend:v1.0.0 ./backend

# Build and tag frontend
docker build -t ldscyber/ticketforge-webapp:latest -t ldscyber/ticketforge-webapp:v1.0.0 ./frontend

# Push backend
docker push ldscyber/ticketforge-backend:latest
docker push ldscyber/ticketforge-backend:v1.0.0

# Push frontend
docker push ldscyber/ticketforge-webapp:latest
docker push ldscyber/ticketforge-webapp:v1.0.0
```

## Step 4: Test Docker Hub Deployment

```bash
# Create test directory
mkdir /tmp/ticketforge-test
cd /tmp/ticketforge-test

# Download files from GitHub
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/.env.example

# Configure
cp .env.example .env
nano .env  # Edit DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD

# Start from Docker Hub images
docker-compose -f docker-compose.hub.yml up -d

# Check status
docker-compose -f docker-compose.hub.yml ps
docker-compose -f docker-compose.hub.yml logs -f

# Test in browser
# Open http://localhost:3080

# Clean up when done
docker-compose -f docker-compose.hub.yml down -v
cd -
rm -rf /tmp/ticketforge-test
```

## Step 5: Create GitHub Release

1. Go to https://github.com/bdorr1105/ticketforge
2. Click **Releases** → **Draft a new release**
3. Choose tag: **v1.0.0**
4. Release title: **TicketForge v1.0.0 - Initial Release**
5. Description:

```markdown
## TicketForge v1.0.0

Initial release of TicketForge - Open Source Help Desk Solution

### Features

**Ticket Management**
- Create, assign, and track support tickets
- Priority levels: low, medium, high, urgent
- Status tracking: open, in progress, pending, resolved, closed
- Search tickets by number, subject, or customer name
- Filter by status and priority
- File attachments support

**User Roles**
- Administrator: Full system access
- Agent: Manage tickets, internal notes
- Customer: Submit and track tickets

**Communication**
- Public comments visible to customers
- Internal notes for staff only
- Email notifications (SMTP)
- Threaded comment replies

**Interface**
- Modern Material-UI design
- Dark mode support
- Customizable branding (logo, company name)
- Mobile responsive

### Installation

**Quick Start with Docker Hub:**

\`\`\`bash
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/bdorr1105/ticketforge/main/.env.example
cp .env.example .env
# Edit .env with your settings
docker-compose -f docker-compose.hub.yml up -d
\`\`\`

### Docker Images

- `ldscyber/ticketforge-backend:v1.0.0`
- `ldscyber/ticketforge-webapp:v1.0.0`

### Documentation

See [README.md](https://github.com/bdorr1105/ticketforge#readme) for full documentation.
```

6. Click **Publish release**

## Step 6: Update Docker Hub Repository Info

### Backend Repository
1. Go to https://hub.docker.com/repository/docker/ldscyber/ticketforge-backend
2. Click **Edit**
3. Short Description: **Backend API for TicketForge - Open Source Help Desk Solution**
4. Full Description:
```
# TicketForge Backend

Backend API server for TicketForge - Open Source Help Desk Solution

Built with Node.js 18, Express, and PostgreSQL 15.

## Quick Start

See the main repository for complete setup instructions:
https://github.com/bdorr1105/ticketforge

## Pull Image

docker pull ldscyber/ticketforge-backend:latest
```

### Frontend Repository
1. Go to https://hub.docker.com/repository/docker/ldscyber/ticketforge-webapp
2. Click **Edit**
3. Short Description: **Web UI for TicketForge - Open Source Help Desk Solution**
4. Full Description:
```
# TicketForge Web App

Frontend web interface for TicketForge - Open Source Help Desk Solution

Built with React 18 and Material-UI 5.

## Quick Start

See the main repository for complete setup instructions:
https://github.com/bdorr1105/ticketforge

## Pull Image

docker pull ldscyber/ticketforge-webapp:latest
```

## Step 7: Add GitHub Topics

On your GitHub repository:
1. Click ⚙️ **Settings**
2. Scroll to **Topics**
3. Add these topics:
   - helpdesk
   - ticketing-system
   - docker
   - nodejs
   - react
   - postgresql
   - support-ticket
   - ticket-management
   - material-ui
   - express

## Complete! 🎉

Your TicketForge project is now published and available:

- **GitHub**: https://github.com/bdorr1105/ticketforge
- **Docker Hub Backend**: https://hub.docker.com/r/ldscyber/ticketforge-backend
- **Docker Hub Frontend**: https://hub.docker.com/r/ldscyber/ticketforge-webapp

## Future Updates

When you make changes and want to release a new version:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Create new version
git tag -a v1.1.0 -m "Release v1.1.0 - Bug fixes and improvements"
git push origin v1.1.0

# Build and push new Docker images
./publish-docker.sh ldscyber v1.1.0

# Create new GitHub release
```

## Promoting Your Project

Share on:
- Reddit: r/selfhosted, r/homelab, r/opensource
- Twitter/X with hashtags: #opensource #helpdesk #docker
- Dev.to or Hashnode blog post
- Hacker News (Show HN: TicketForge)
- Product Hunt

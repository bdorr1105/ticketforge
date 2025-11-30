# Publishing Guide for TicketForge

This guide covers how to publish TicketForge to GitHub and Docker Hub.

## Prerequisites

- Git installed
- Docker and Docker Compose installed
- GitHub account
- Docker Hub account

## Part 1: Publishing to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `ticketforge`
3. Description: "Open Source Help Desk Solution - Modern Docker-based ticketing system"
4. Choose Public or Private
5. **Do NOT** initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Initialize and Push

```bash
cd /home/brian/docker/TicketForge

# Initialize git repository (if not already done)
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

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ticketforge.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Add Topics and Description

On GitHub, go to your repository and:
1. Click "⚙️ Settings" tab
2. Under "General" → Add topics:
   - `helpdesk`
   - `ticketing-system`
   - `docker`
   - `nodejs`
   - `react`
   - `postgresql`
   - `support-ticket`
   - `ticket-management`
3. Edit the description

### Step 4: Create a Release

```bash
# Create a tag
git tag -a v1.0.0 -m "Release v1.0.0

Initial release of TicketForge

Features:
- Ticket management with priorities and statuses
- User roles (Admin, Agent, Customer)
- Email notifications
- Internal notes
- File attachments
- Search functionality
- Profile management
- Customizable branding
"

# Push the tag
git push origin v1.0.0
```

Then on GitHub:
1. Go to "Releases" → "Draft a new release"
2. Choose tag `v1.0.0`
3. Title: "TicketForge v1.0.0 - Initial Release"
4. Description: Add release notes
5. Click "Publish release"

## Part 2: Publishing to Docker Hub

### Step 1: Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

### Step 2: Build Images

```bash
# Navigate to project root
cd /home/brian/docker/TicketForge

# Build backend image
docker build -t YOUR_DOCKERHUB_USERNAME/ticketforge-backend:latest -t YOUR_DOCKERHUB_USERNAME/ticketforge-backend:v1.0.0 ./backend

# Build frontend image
docker build -t YOUR_DOCKERHUB_USERNAME/ticketforge-webapp:latest -t YOUR_DOCKERHUB_USERNAME/ticketforge-webapp:v1.0.0 ./frontend
```

### Step 3: Test Images Locally

```bash
# Update docker-compose.hub.yml with your username
sed -i 's/yourusername/YOUR_DOCKERHUB_USERNAME/g' docker-compose.hub.yml

# Test with the built images
docker-compose -f docker-compose.hub.yml up -d

# Check logs
docker-compose -f docker-compose.hub.yml logs -f

# Test the application
# Open http://localhost:3080 in browser

# Stop test
docker-compose -f docker-compose.hub.yml down
```

### Step 4: Push to Docker Hub

```bash
# Push backend images
docker push YOUR_DOCKERHUB_USERNAME/ticketforge-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/ticketforge-backend:v1.0.0

# Push frontend images
docker push YOUR_DOCKERHUB_USERNAME/ticketforge-webapp:latest
docker push YOUR_DOCKERHUB_USERNAME/ticketforge-webapp:v1.0.0
```

### Step 5: Update Docker Hub Repository Info

For each repository on Docker Hub:

1. Go to https://hub.docker.com/repository/docker/YOUR_USERNAME/ticketforge-backend
2. Click "Edit"
3. Add description
4. Link to GitHub repo
5. Add README content

**Backend README**:
```markdown
# TicketForge Backend

Backend API server for TicketForge - Open Source Help Desk Solution

## Quick Start

```bash
docker pull YOUR_USERNAME/ticketforge-backend:latest
```

See the [main repository](https://github.com/YOUR_USERNAME/ticketforge) for complete setup instructions.

## Environment Variables

Required environment variables:
- `DB_HOST` - PostgreSQL host
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key

See `.env.example` in the main repository for all options.
```

**Frontend README**:
```markdown
# TicketForge Web App

Frontend web interface for TicketForge - Open Source Help Desk Solution

## Quick Start

```bash
docker pull YOUR_USERNAME/ticketforge-webapp:latest
```

See the [main repository](https://github.com/YOUR_USERNAME/ticketforge) for complete setup instructions.
```

## Part 3: Update Repository URLs

After publishing, update these files in your repository:

### 1. README.md

Replace all instances of:
- `yourusername` → Your actual username
- Update Docker Hub badge URLs

```bash
# In README.md, update line 5:
[![Docker Pulls](https://img.shields.io/docker/pulls/YOUR_USERNAME/ticketforge-backend)](https://hub.docker.com/r/YOUR_USERNAME/ticketforge-backend)

# Update download URLs (lines 77-78):
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/.env.example

# Update git clone URL (line 93):
git clone https://github.com/YOUR_USERNAME/ticketforge.git
```

### 2. docker-compose.hub.yml

Already updated in Step 3 above.

### 3. Commit and Push Updates

```bash
git add README.md docker-compose.hub.yml
git commit -m "Update repository URLs and badges"
git push origin main
```

## Part 4: Ongoing Releases

For future releases:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Create new version
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# Build and push new Docker images
docker build -t YOUR_USERNAME/ticketforge-backend:latest -t YOUR_USERNAME/ticketforge-backend:v1.1.0 ./backend
docker build -t YOUR_USERNAME/ticketforge-webapp:latest -t YOUR_USERNAME/ticketforge-webapp:v1.1.0 ./frontend

docker push YOUR_USERNAME/ticketforge-backend:latest
docker push YOUR_USERNAME/ticketforge-backend:v1.1.0
docker push YOUR_USERNAME/ticketforge-webapp:latest
docker push YOUR_USERNAME/ticketforge-webapp:v1.1.0

# Create GitHub release from the tag
```

## Automated Publishing (Optional)

### GitHub Actions for Docker Hub

Create `.github/workflows/docker-publish.yml`:

```yaml
name: Publish Docker Images

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ticketforge-backend:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/ticketforge-backend:${{ steps.version.outputs.VERSION }}

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/ticketforge-webapp:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/ticketforge-webapp:${{ steps.version.outputs.VERSION }}
```

Add secrets to GitHub repository:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token

## Verification Checklist

- [ ] GitHub repository created and code pushed
- [ ] GitHub topics and description added
- [ ] Git tag created and pushed
- [ ] GitHub release created
- [ ] Docker images built successfully
- [ ] Docker images tested locally
- [ ] Docker images pushed to Docker Hub
- [ ] Docker Hub repository descriptions updated
- [ ] README.md URLs updated
- [ ] All documentation references correct username
- [ ] Test deployment from Docker Hub works

## Support

After publishing:
- Monitor GitHub Issues for bug reports
- Update documentation as needed
- Respond to community questions
- Release updates regularly

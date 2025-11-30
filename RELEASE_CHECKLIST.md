# TicketForge Release Checklist

## Pre-Publishing Checklist

### Code & Documentation
- [x] Container name updated to `ticketforge_webapp`
- [x] README.md updated with complete documentation
- [x] LICENSE file exists (MIT)
- [x] SETUP_GUIDE.md exists
- [x] QUICK_REFERENCE.md exists
- [x] PROJECT_SUMMARY.md exists
- [x] PUBLISHING.md created with step-by-step instructions
- [x] .gitignore configured properly
- [x] docker-compose.yml configured for local builds
- [x] docker-compose.hub.yml created for Docker Hub images

### Testing
- [ ] All services start successfully with `docker-compose up -d`
- [ ] Admin login works
- [ ] Customer registration works
- [ ] Email verification works
- [ ] Ticket creation works
- [ ] Comments work (public and internal)
- [ ] File attachments work
- [ ] Email notifications work (if SMTP configured)
- [ ] Search functionality works
- [ ] Profile editing works
- [ ] Password change works
- [ ] Dark mode toggle works

### Environment Configuration
- [ ] .env.example exists with all required variables
- [ ] Database passwords changed from defaults
- [ ] JWT_SECRET is a secure random string
- [ ] Admin password is changed from default
- [ ] SMTP settings configured (optional but recommended)

### Docker Hub Preparation
- [ ] Docker Hub account created
- [ ] Repository names decided:
  - `ticketforge-backend`
  - `ticketforge-webapp`

### GitHub Preparation
- [ ] GitHub account ready
- [ ] Repository name decided: `ticketforge`
- [ ] Git initialized in project directory

## Publishing Steps

### Step 1: Final Testing

```bash
# Clean start
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs -f

# Test application at http://localhost:3080
```

### Step 2: Prepare for GitHub

```bash
# Review what will be committed
git status

# Check .gitignore is working
# Sensitive files should NOT appear:
# - .env (should be ignored)
# - node_modules/ (should be ignored)
# - logs/ (should be ignored)
# - uploads/ (should be ignored except .gitkeep)

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit - TicketForge v1.0.0"
```

### Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create repository named `ticketforge`
3. Do NOT initialize with README (we have one)
4. Copy the remote URL

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ticketforge.git

# Push to GitHub
git branch -M main
git push -u origin main

# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Step 4: Update Repository URLs

After creating GitHub repo, update these files:

**README.md** - Replace `yourusername` with your actual username:
- Line 5: Docker badge URL
- Lines 77-78: Download URLs
- Line 93: Git clone URL

**docker-compose.hub.yml** - Replace `yourusername` with your Docker Hub username:
- Line 27: Backend image name
- Line 64: Frontend image name

```bash
# Quick replace (be sure to verify before running)
sed -i 's/yourusername/YOUR_USERNAME/g' README.md docker-compose.hub.yml

# Commit updates
git add README.md docker-compose.hub.yml
git commit -m "Update repository URLs"
git push
```

### Step 5: Publish to Docker Hub

Option A: Using the script

```bash
./publish-docker.sh YOUR_DOCKERHUB_USERNAME v1.0.0
```

Option B: Manually

```bash
# Login to Docker Hub
docker login

# Build and push
docker build -t YOUR_USERNAME/ticketforge-backend:latest -t YOUR_USERNAME/ticketforge-backend:v1.0.0 ./backend
docker build -t YOUR_USERNAME/ticketforge-webapp:latest -t YOUR_USERNAME/ticketforge-webapp:v1.0.0 ./frontend

docker push YOUR_USERNAME/ticketforge-backend:latest
docker push YOUR_USERNAME/ticketforge-backend:v1.0.0
docker push YOUR_USERNAME/ticketforge-webapp:latest
docker push YOUR_USERNAME/ticketforge-webapp:v1.0.0
```

### Step 6: Test Docker Hub Deployment

```bash
# Create a test directory
mkdir /tmp/ticketforge-test
cd /tmp/ticketforge-test

# Download docker-compose.hub.yml and .env.example
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/.env.example

# Configure
cp .env.example .env
nano .env  # Edit configuration

# Test deployment
docker-compose -f docker-compose.hub.yml up -d

# Check it works
curl http://localhost:3080

# Clean up
docker-compose -f docker-compose.hub.yml down -v
cd -
rm -rf /tmp/ticketforge-test
```

### Step 7: Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Draft a new release"
3. Choose tag: `v1.0.0`
4. Release title: "TicketForge v1.0.0 - Initial Release"
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

See [README.md](https://github.com/YOUR_USERNAME/ticketforge#readme) for installation instructions.

**Quick Start with Docker Hub:**

\`\`\`bash
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/docker-compose.hub.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/ticketforge/main/.env.example
cp .env.example .env
# Edit .env with your settings
docker-compose -f docker-compose.hub.yml up -d
\`\`\`

### Docker Images

- `YOUR_USERNAME/ticketforge-backend:v1.0.0`
- `YOUR_USERNAME/ticketforge-webapp:v1.0.0`

### Tech Stack

- Node.js 18, Express, PostgreSQL 15
- React 18, Material-UI 5
- Docker & Docker Compose
```

6. Click "Publish release"

### Step 8: Update Docker Hub Repositories

For each repository on Docker Hub:

**Backend** (https://hub.docker.com/repository/docker/YOUR_USERNAME/ticketforge-backend):
- Overview: Add description and README
- Link to GitHub repository

**Frontend** (https://hub.docker.com/repository/docker/YOUR_USERNAME/ticketforge-webapp):
- Overview: Add description and README
- Link to GitHub repository

### Step 9: Promote Your Project

- [ ] Add GitHub topics: `helpdesk`, `ticketing-system`, `docker`, `nodejs`, `react`, `postgresql`
- [ ] Share on Reddit: r/selfhosted, r/homelab
- [ ] Share on social media
- [ ] Add to awesome lists
- [ ] Create demo video/screenshots

## Post-Publishing

### Monitor
- GitHub Issues for bug reports
- Docker Hub for download stats
- Community questions

### Maintain
- Fix bugs promptly
- Review pull requests
- Update documentation
- Release updates regularly

## Quick Commands Reference

```bash
# Check current status
git status
docker ps

# View logs
docker-compose logs -f ticketforge-backend
docker-compose logs -f ticketforge-webapp

# Rebuild after changes
docker-compose build
docker-compose up -d

# Create new release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
./publish-docker.sh YOUR_USERNAME v1.1.0

# Clean up
docker-compose down -v
docker system prune -a
```

## Notes

- Always test thoroughly before publishing
- Keep .env file secure (never commit it)
- Update version numbers consistently
- Document breaking changes
- Maintain changelog

## Support

See [PUBLISHING.md](PUBLISHING.md) for detailed publishing instructions.

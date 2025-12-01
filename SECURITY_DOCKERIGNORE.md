# Docker Security - .dockerignore Files

## Overview

`.dockerignore` files have been added to prevent sensitive files from being included in Docker images. This ensures that your credentials, environment variables, and local configuration never end up in the published Docker images.

## Files Created

### 1. `/backend/.dockerignore`
Prevents sensitive backend files from being copied into the backend Docker image.

**Key exclusions:**
- `.env`, `.env.*`, `*.env` - All environment files
- `node_modules` - Installed during build
- `logs` - Runtime logs
- `uploads` - User-uploaded files

### 2. `/frontend/.dockerignore`
Prevents sensitive frontend files from being copied into the frontend Docker image.

**Key exclusions:**
- `.env`, `.env.*`, `*.env` - All environment files
- `node_modules` - Installed during build
- `build`, `dist` - Generated during Docker build
- Test files

### 3. `/.dockerignore` (root)
General exclusions for any Docker builds from the root directory.

**Key exclusions:**
- All environment files
- Docker compose files
- Documentation
- Git files
- Database data

## How .dockerignore Works

When you run `docker build`, Docker reads the `.dockerignore` file and excludes matching files from the build context.

### Example:

```bash
# Without .dockerignore
docker build -t myimage ./backend
# Copies: server.js, package.json, .env, logs/, uploads/, etc.
# ❌ .env is INCLUDED in image

# With .dockerignore
docker build -t myimage ./backend
# Copies: server.js, package.json
# ✅ .env is EXCLUDED from image
```

## Security Benefits

### 1. **Credentials Protection**
- `.env` files containing JWT_SECRET, DB_PASSWORD, SMTP credentials are never copied
- Even if someone inspects your Docker image, they won't find credentials

### 2. **Image Size Reduction**
- Excludes unnecessary files (node_modules, logs, uploads)
- Smaller images = faster pulls = better performance

### 3. **Build Efficiency**
- Fewer files to copy = faster builds
- Docker layer caching works better

### 4. **Best Practice Compliance**
- Follows Docker security best practices
- Prevents accidental credential leaks

## Verification

To verify what files are excluded, you can test:

```bash
# Check what would be sent to Docker daemon
cd backend
docker build --no-cache -t test-backend .

# Inspect the image (should NOT contain .env)
docker run --rm test-backend ls -la /app
# You should see: server.js, package.json, routes/, etc.
# You should NOT see: .env, node_modules (local), logs/
```

## Environment Variables at Runtime

Remember: `.dockerignore` only affects BUILD TIME (what's in the image).

**Build time (docker build):**
- `.dockerignore` prevents .env from being copied
- No credentials in image ✅

**Run time (docker-compose up):**
- `docker-compose.yml` loads .env file
- Environment variables passed to container at runtime
- Each user provides their own .env ✅

## File Patterns Explained

| Pattern | Matches | Example |
|---------|---------|---------|
| `.env` | Exact filename | `.env` only |
| `.env.*` | .env with extension | `.env.local`, `.env.production` |
| `*.env` | Any file ending in .env | `prod.env`, `test.env` |
| `**/logs` | logs directory anywhere | `./logs`, `./backend/logs` |
| `*.log` | All log files | `error.log`, `debug.log` |

## What IS Included in Images

**Backend Image Contains:**
- Application code (server.js, routes/, controllers/, etc.)
- package.json and package-lock.json
- Installed dependencies (from npm install in Dockerfile)
- **NO .env files**
- **NO credentials**

**Frontend Image Contains:**
- Built static files (HTML, CSS, JS from npm run build)
- Nginx configuration
- **NO .env files**
- **NO source code (only compiled build)**

## Future Updates

When building new images:

```bash
# The .dockerignore files will automatically exclude sensitive files
docker build -t ldscyber/ticketforge-backend:v1.1.0 ./backend
docker build -t ldscyber/ticketforge-webapp:v1.1.0 ./frontend

# Your credentials are safe ✅
```

## Additional Security Recommendations

1. **Never commit .env files to git** - Already handled by .gitignore
2. **Use .dockerignore for Docker builds** - ✅ Now implemented
3. **Rotate credentials regularly** - Recommended practice
4. **Use Docker secrets for production** - Consider for production deployments
5. **Scan images for vulnerabilities** - Use `docker scan` or Trivy

## Conclusion

Your Docker images are now properly secured with `.dockerignore` files. Even if someone downloads your images from Docker Hub, they will:

- ✅ Get working application code
- ✅ Be able to run TicketForge with their own .env
- ❌ NOT get your JWT_SECRET
- ❌ NOT get your database password
- ❌ NOT get your SMTP credentials

Your credentials are safe! 🔒

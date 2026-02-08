#!/bin/bash

# TicketForge Docker Hub Publishing Script
# Usage: ./publish-docker.sh YOUR_DOCKERHUB_USERNAME VERSION

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Missing Docker Hub username${NC}"
    echo "Usage: ./publish-docker.sh YOUR_DOCKERHUB_USERNAME [VERSION]"
    echo "Example: ./publish-docker.sh john v1.2.0"
    echo "If VERSION is omitted, it reads from package.json"
    exit 1
fi

DOCKERHUB_USERNAME=$1

# Use provided version or read from root package.json
if [ -n "$2" ]; then
    VERSION=$2
else
    VERSION="v$(node -p "require('./package.json').version")"
    echo -e "${YELLOW}No version specified, using $VERSION from package.json${NC}"
fi

echo -e "${GREEN}=== TicketForge Docker Publishing ===${NC}"
echo "Docker Hub Username: $DOCKERHUB_USERNAME"
echo "Version: $VERSION"
echo ""

# Confirm
read -p "Continue with publishing? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Check if logged in to Docker
echo -e "${YELLOW}Checking Docker login...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running or you're not logged in${NC}"
    echo "Please run: docker login"
    exit 1
fi

# Build backend
echo -e "${GREEN}Building backend image...${NC}"
docker build -t $DOCKERHUB_USERNAME/ticketforge-backend:latest \
             -t $DOCKERHUB_USERNAME/ticketforge-backend:$VERSION \
             ./backend

# Build frontend
echo -e "${GREEN}Building frontend image...${NC}"
docker build -t $DOCKERHUB_USERNAME/ticketforge-webapp:latest \
             -t $DOCKERHUB_USERNAME/ticketforge-webapp:$VERSION \
             ./frontend

# Push backend
echo -e "${GREEN}Pushing backend to Docker Hub...${NC}"
docker push $DOCKERHUB_USERNAME/ticketforge-backend:latest
docker push $DOCKERHUB_USERNAME/ticketforge-backend:$VERSION

# Push frontend
echo -e "${GREEN}Pushing frontend to Docker Hub...${NC}"
docker push $DOCKERHUB_USERNAME/ticketforge-webapp:latest
docker push $DOCKERHUB_USERNAME/ticketforge-webapp:$VERSION

echo -e "${GREEN}=== Publishing Complete! ===${NC}"
echo ""
echo "Images published:"
echo "  - $DOCKERHUB_USERNAME/ticketforge-backend:latest"
echo "  - $DOCKERHUB_USERNAME/ticketforge-backend:$VERSION"
echo "  - $DOCKERHUB_USERNAME/ticketforge-webapp:latest"
echo "  - $DOCKERHUB_USERNAME/ticketforge-webapp:$VERSION"
echo ""
echo "Next steps:"
echo "1. Update docker-compose.hub.yml with your username"
echo "2. Update README.md badges and URLs"
echo "3. Test deployment: docker-compose -f docker-compose.hub.yml up -d"
echo "4. Commit and push changes to GitHub"

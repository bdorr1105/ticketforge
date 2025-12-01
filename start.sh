#!/bin/bash

# TicketForge Startup Script

set -e

echo "======================================"
echo "  TicketForge - Help Desk System"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed (try both old and new syntax)
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine which command to use
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit the .env file and configure your settings!"
    echo "Especially change:"
    echo "  - DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - ADMIN_PASSWORD"
    echo "  - SMTP settings (if you want email notifications)"
    echo ""
    read -p "Press Enter after you've edited the .env file..."
fi

echo "Starting TicketForge..."
echo ""

# Build and start containers
$COMPOSE_CMD up -d --build

echo ""
echo "======================================"
echo "Waiting for services to be ready..."
echo "======================================"
echo ""

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
sleep 5

# Check if containers are running
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo ""
    echo "======================================"
    echo "  TicketForge is ready!"
    echo "======================================"
    echo ""
    echo "Frontend: http://localhost:${FRONTEND_PORT:-3080}"
    echo "Backend API: http://localhost:${BACKEND_PORT:-5080}"
    echo ""
    echo "Default admin credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "IMPORTANT: Change the admin password immediately after login!"
    echo ""
    echo "To view logs: $COMPOSE_CMD logs -f"
    echo "To stop: $COMPOSE_CMD down"
    echo ""
else
    echo ""
    echo "Error: Some containers failed to start"
    echo "Check the logs with: $COMPOSE_CMD logs"
    exit 1
fi

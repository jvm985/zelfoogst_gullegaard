#!/bin/bash

# Exit on any error
set -e

REPO_DIR="/home/joachim/zelfoogst_gullegaard" # Update this to your prod path
BRANCH="main"

echo "🚀 Starting deployment of De Gullegaard..."

# Check if .env exists, if not, warn the user
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found. Ensure you have your production secrets (DB_PASSWORD, JWT_SECRET, etc.) configured."
    # Optional: exit 1 if you want to force it
fi
if [ -d ".git" ]; then
    echo "📂 Pulling latest changes from GitHub ($BRANCH branch)..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "❌ This script must be run inside the git repository."
    exit 1
fi

# 2. Re-build and start the containers
echo "🐳 Rebuilding and starting Docker containers..."
docker compose up --build -d

# 3. Database Migrations
echo "💾 Running Prisma migrations..."
# We gebruiken 'run' in plaats van 'exec' zodat het ook werkt als de hoofd-container nog opstart
docker compose run --rm backend ./node_modules/.bin/prisma migrate deploy --schema apps/backend/prisma/schema.prisma || {
    echo "❌ Migration failed! Printing backend logs..."
    docker compose logs backend --tail 50
    exit 1
}

# 4. Success message
echo "✨ Deployment successful! The app is now live."
echo "🔗 Frontend: http://your-server-ip"
echo "🔗 Backend API: http://your-server-ip/api"

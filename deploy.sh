#!/bin/bash

# Exit on any error
set -e

# Default branch is main, but can be overridden
BRANCH=${BRANCH:-main}
REPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$REPO_DIR"

echo "🚀 Starting production deployment in $REPO_DIR..."

if [ -d ".git" ]; then
    echo "📂 Pulling latest changes from GitHub ($BRANCH branch)..."
    git fetch origin
    git reset --hard origin/$BRANCH
fi

# 1. Re-build and start the containers
echo "🐳 Rebuilding and starting Docker containers..."
docker compose down
docker compose up --build -d

# 2. Database Wait & Sync
echo "⏳ Waiting for database to be ready..."
RETRIES=15
until docker compose exec -T db pg_isready -U joachim > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "Database is not ready yet... waiting ($RETRIES retries left)"
  sleep 3
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Database connection failed."
    exit 1
fi

echo "💾 Syncing database schema..."
docker compose exec -T backend npx prisma db push --accept-data-loss

echo "🌱 Seeding base data (Admin, Crops, Recipes)..."
docker compose exec -T backend npx prisma db seed

echo "🚜 Generating Master Cultivation Plan 2026..."
docker compose exec -T backend npx ts-node fix_teeltplan.ts

echo "✨ Deployment successful! The app is now live and identical to local."
echo "🔗 App: http://your-domain-or-ip"

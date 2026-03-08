#!/bin/bash

# Exit on any error
set -e

# Repository URL
REPO_URL="git@github.com:jvm985/gullegaard.git"

echo "🚀 Starting git initialization and push to GitHub..."

# 1. Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing local git repository..."
    git init -b main
else
    echo "✅ Git repository already initialized."
fi

# 2. Add remote origin if it doesn't exist
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote origin..."
    git remote add origin $REPO_URL
else
    echo "🔄 Updating remote origin..."
    git remote set-url origin $REPO_URL
fi

# 3. Add all files to the staging area (respecting .gitignore)
echo "📂 Staging all files..."
git add .

# 4. Commit the changes
echo "💾 Committing changes..."
COMMIT_MESSAGE=${1:-"Update: Functional changes for Mijn CSA"}
git commit -m "$COMMIT_MESSAGE" || echo "⚠️ Nothing to commit"

# 5. Push to GitHub
echo "📤 Pushing to GitHub (main branch)..."
git push -u origin main

echo "✨ Done! Your app is now on GitHub at: $REPO_URL"

#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting Render build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Build completed successfully!"

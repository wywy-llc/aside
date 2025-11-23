#!/usr/bin/env bash

set -e

# E2E Test Initialization Script
# Creates a test project using wyside CLI

echo "🚀 Starting E2E Test Initialization..."

# Step 0: Clean up existing test projects
echo ""
echo "🧹 Step 0: Cleaning up existing test projects..."
if [ -d "test-projects" ]; then
  rm -rf test-projects
  echo "✅ Removed existing test-projects directory"
else
  echo "✅ No existing test-projects directory found"
fi

# Step 1: Build wyside CLI
echo ""
echo "📦 Step 1: Building wyside CLI..."
npm run build

# Step 2: Initialize Test Project
echo ""
echo "📁 Step 2: Creating test project..."
TEST_DIR="test-projects/todo-app"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "🔧 Initializing project with wyside..."
WYSIDE_DEBUG=1 npx ../../dist/src/index.js init --setup-gcp --yes

# Step 3: Install dependencies in test project
echo ""
echo "📥 Step 3: Installing dependencies..."
npm install

echo ""
echo "✅ Test project initialized successfully!"
echo ""
echo "Next steps:"
echo "  1. Configure secrets/service-account.json"
echo "  2. Create .env file with required variables:"
echo "     - GCP_PROJECT_ID"
echo "     - SPREADSHEET_ID"
echo "     - GOOGLE_APPLICATION_CREDENTIALS"
echo "  3. Run tests: cd $TEST_DIR && npm test"
echo "  4. Deploy: cd $TEST_DIR && npm run deploy"

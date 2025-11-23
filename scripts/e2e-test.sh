#!/usr/bin/env bash


set -e

# E2E Test Execution Script
# Runs integration tests in the test project

echo "🧪 Starting E2E Test Execution..."

# Check if test project exists
TEST_DIR="test-projects/todo-app"
if [ ! -d "$TEST_DIR" ]; then
  echo "❌ Test project not found!"
  echo "Please run 'npm run test:e2e:init' first to initialize the test project."
  exit 1
fi

# Navigate to test project
cd "$TEST_DIR"

# Check if secrets are configured
echo ""
echo "🔐 Checking configuration..."

if [ ! -f "secrets/service-account.json" ]; then
  echo "⚠️  Warning: secrets/service-account.json not found"
  echo "   Please configure your service account credentials"
fi

if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found"
  echo "   Please create .env with the following variables:"
  echo "   - GCP_PROJECT_ID"
  echo "   - SPREADSHEET_ID"
  echo "   - GOOGLE_APPLICATION_CREDENTIALS"
fi

# Run tests
echo ""
echo "🧪 Running integration tests..."
npm test

# Check test results
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Tests failed!"
  exit 1
fi

echo ""
echo "✅ All tests passed!"

# Deploy to GAS
echo ""
echo "📤 Deploying to Google Apps Script..."
npm run deploy

# Check deploy results
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo ""
  echo "📋 Next steps (Manual Verification):"
  echo "  1. Open the Spreadsheet (check the init output for the link)"
  echo "  2. Reload the page"
  echo "  3. Check for 'Wyside Todo' menu"
  echo "  4. Click 'Show Todos' to open the sidebar"
  echo "  5. Verify you can add, list, and delete todos via the UI"
else
  echo ""
  echo "❌ Deployment failed!"
  exit 1
fi

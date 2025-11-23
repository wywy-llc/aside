#!/usr/bin/env bash
# Copyright 2025 wywy LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# you may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Copyright 2025 wywyjp inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All tests passed!"
  echo ""
  echo "Next step: Deploy to GAS"
  echo "  cd $TEST_DIR && npm run deploy"
else
  echo ""
  echo "❌ Tests failed!"
  exit 1
fi

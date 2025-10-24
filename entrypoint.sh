#!/bin/bash
set -e

echo "🛡️ XeOps Guardian - AI Ethical Hacking Starting..."
echo "⚔️ Mode: CI/CD Security Analysis"

# Validate inputs
if [ -z "$XEOPS_API_KEY" ]; then
  echo "❌ Error: API key is required. Get yours at https://www.xeops.ai/dashboard/settings"
  exit 1
fi

# Get changed files in PR
if [ -n "$GITHUB_EVENT_PATH" ]; then
  echo "📁 Analyzing changed files in PR..."
  CHANGED_FILES=$(jq -r '.pull_request.changed_files // 0' "$GITHUB_EVENT_PATH")
  echo "Found $CHANGED_FILES changed files"
fi

# Run the scan
echo "🔍 Running $SCAN_TYPE security scan..."
node /app/src/index.js

# Check exit code
SCAN_EXIT_CODE=$?

if [ $SCAN_EXIT_CODE -eq 0 ]; then
  echo "✅ Security scan completed successfully"
else
  echo "❌ Security scan failed with code $SCAN_EXIT_CODE"
  exit $SCAN_EXIT_CODE
fi
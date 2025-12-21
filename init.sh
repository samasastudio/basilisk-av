#!/bin/bash
set -e

# Verify directory
if [ ! -f "package.json" ]; then
  echo "ERROR: Not in project root"
  exit 1
fi

# Show progress
head -40 claude-progress.txt

# Show feature status
passing=$(grep -c '"passes": true' features.json || echo 0)
total=$(grep -c '"passes":' features.json || echo 0)
echo "Features: $passing / $total passing"

# Start dev server
npm run dev &
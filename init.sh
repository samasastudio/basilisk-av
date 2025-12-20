#!/bin/bash
# Basilisk AV - Development Session Initialization

set -e

echo "=== Basilisk AV Dev Session ==="
echo "Working directory: $(pwd)"
echo ""

# Verify correct directory
if [ ! -f "package.json" ]; then
  echo "ERROR: Not in basilisk-av root directory"
  exit 1
fi

# Detect current phase files (supports both naming conventions)
FEATURES_FILE=""
PROGRESS_FILE=""

if [ -f "features.json" ]; then
  FEATURES_FILE="features.json"
elif ls features-phase*.json 1>/dev/null 2>&1; then
  FEATURES_FILE=$(ls -t features-phase*.json | head -1)
fi

if [ -f "claude-progress.txt" ]; then
  PROGRESS_FILE="claude-progress.txt"
elif ls claude-progress-phase*.txt 1>/dev/null 2>&1; then
  PROGRESS_FILE=$(ls -t claude-progress-phase*.txt | head -1)
fi

echo "Features file: ${FEATURES_FILE:-none}"
echo "Progress file: ${PROGRESS_FILE:-none}"
echo ""

# Show recent progress
echo "=== Recent Progress ==="
if [ -n "$PROGRESS_FILE" ]; then
  head -40 "$PROGRESS_FILE"
else
  echo "(no progress file found)"
fi
echo ""

# Show git activity
echo "=== Recent Git Activity ==="
git log --oneline -5 2>/dev/null || echo "(not a git repo)"
echo ""

# Show feature status
echo "=== Feature Status ==="
if [ -n "$FEATURES_FILE" ]; then
  phase=$(grep -o '"currentPhase": [0-9]*' "$FEATURES_FILE" 2>/dev/null | grep -o '[0-9]*' || \
          grep -o '"phase": [0-9]*' "$FEATURES_FILE" | head -1 | grep -o '[0-9]*')
  passing=$(grep -c '"passes": true' "$FEATURES_FILE" 2>/dev/null || echo 0)
  total=$(grep -c '"passes":' "$FEATURES_FILE" 2>/dev/null || echo 0)
  echo "Phase: ${phase:-unknown}"
  echo "Features passing: $passing / $total"
  
  # Show next incomplete feature
  echo ""
  echo "Next incomplete:"
  grep -B5 '"passes": false' "$FEATURES_FILE" | grep '"id"' | head -1 | sed 's/.*"\(p[0-9]*-[^"]*\)".*/  → \1/'
else
  echo "(no features.json found)"
fi
echo ""

# Check for Playwright MCP
echo "=== MCP Status ==="
if [ -f ".claude/settings.json" ]; then
  if grep -q "playwright" .claude/settings.json 2>/dev/null; then
    echo "Playwright MCP: configured ✓"
  else
    echo "Playwright MCP: not configured"
  fi
else
  echo "Claude settings: not found (run 'claude mcp add playwright')"
fi
echo ""

# Parse arguments
START_SERVER=true
RUN_VERIFY=false

for arg in "$@"; do
  case $arg in
    --no-server) START_SERVER=false ;;
    --verify) RUN_VERIFY=true ;;
  esac
done

# Start dev server
if [ "$START_SERVER" = true ]; then
  echo "=== Starting Dev Server ==="
  npm run dev &
  DEV_PID=$!
  sleep 3
  echo "Server running at http://localhost:5174"
  echo "Dev server PID: $DEV_PID"
  echo "Kill server with: kill $DEV_PID"
else
  echo "(server start skipped)"
fi
echo ""

# Run verification if requested
if [ "$RUN_VERIFY" = true ]; then
  echo "=== Running Verification ==="
  echo "Use Claude Code: /project:verify-all"
fi

echo ""
echo "Ready for development."
echo ""
echo "Commands:"
echo "  /project:verify <id>  - Verify single feature"
echo "  /project:verify-all   - Verify all incomplete features"

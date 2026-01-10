# Playwright MCP Integration for Basilisk AV

Automated feature verification using Claude Code CLI and Microsoft's Playwright MCP server.

## Quick Setup

```bash
# 1. Install Playwright (one-time)
npm install -D @playwright/test
npx playwright install chromium

# 2. Add Playwright MCP to Claude Code (per-project)
cd basilisk-av
claude mcp add playwright -- npx @playwright/mcp@latest --headless

# 3. Verify setup
claude
> /mcp  # Should show playwright in list
```

## Usage

### Verify Single Feature
```bash
claude
> /project:verify p6-sound-list
```

### Verify All Incomplete Features
```bash
claude
> /project:verify-all
```

### Debug Mode (Headed Browser)
```bash
# Remove and re-add without --headless
claude mcp remove playwright
claude mcp add playwright -- npx @playwright/mcp@latest
```

## How It Works

1. **features.json** defines verification steps in plain English
2. **Claude Code** interprets verification steps and maps to Playwright actions
3. **Playwright MCP** executes browser automation via accessibility tree
4. **Results** update features.json `passes` field and claude-progress.txt

### Verification Step Patterns

| Step Pattern | Playwright Action |
|--------------|-------------------|
| "Click X button" | `browser_click` element with name/role X |
| "Panel opens" | `browser_snapshot` → check element visible |
| "X visible" | Assert element in accessibility tree |
| "Typing filters" | `browser_type` → verify filtered results |
| "Persists via localStorage" | `browser_evaluate` to check storage |
| "Shortcut X" | `browser_press_key` |

## File Structure

```
basilisk-av/
├── .claude/
│   ├── settings.json      # MCP server config
│   └── commands/
│       ├── verify.md      # Single feature verification
│       └── verify-all.md  # Batch verification
├── features.json          # Feature definitions + verification steps
├── claude-progress.txt    # Session handoff file
└── init.sh               # Dev session startup
```

## CI Integration (Future)

```yaml
# .github/workflows/verify.yml
name: Feature Verification
on: [push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run dev &
      - run: npx @playwright/mcp@latest --headless &
      # Claude Code would need API access for CI
```

## Troubleshooting

### MCP not connecting
```bash
# Check MCP status
claude mcp list

# Re-add if missing
claude mcp add playwright -- npx @playwright/mcp@latest
```

### Browser not launching
```bash
# Ensure Playwright browsers installed
npx playwright install chromium

# Check for display issues (WSL/SSH)
export DISPLAY=:0  # or use --headless
```

### Verification step failing unexpectedly
1. Run in headed mode to watch browser
2. Check `browser_snapshot` output for element names
3. Verify dev server is running on localhost:5173

## References

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Claude Code MCP Docs](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Playwright Accessibility](https://playwright.dev/docs/accessibility-testing)

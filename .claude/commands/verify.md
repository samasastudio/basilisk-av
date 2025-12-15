# Verify Single Feature

Verify a single feature from features.json using Playwright MCP.

## Usage
```
/project:verify <feature-id>
```

## Instructions

1. Read the feature from `features.json` by its ID: `$ARGUMENTS`
2. Check if dependencies are met (all dependency features must have `passes: true`)
3. If dependencies not met, report which are missing and skip
4. Ensure dev server is running on localhost:5173
5. Use Playwright MCP tools to execute each verification step:
   - `browser_navigate` to go to the app
   - `browser_click` for click actions
   - `browser_type` for typing
   - `browser_press_key` for keyboard shortcuts
   - `browser_snapshot` to check element visibility
   - `browser_evaluate` for localStorage checks
6. Report pass/fail for each step
7. If ALL steps pass, update `passes: true` in features.json
8. Update claude-progress.txt with the result

## Output Format
```
=== Verifying: <feature-id> ===
✓ Step description (passed)
✗ Step description (failed: reason)

Result: X/Y passed - PASS/FAIL
```

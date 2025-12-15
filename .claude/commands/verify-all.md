# Verify All Incomplete Features

Verify all incomplete features in the current phase using Playwright MCP.

## Usage
```
/project:verify-all
```

## Instructions

1. Read `features.json` and get `currentPhase` from meta
2. Filter features where `phase === currentPhase` AND `passes === false`
3. Sort by dependency order (features with no dependencies first)
4. For each feature:
   - Check dependencies are met
   - Skip if dependencies not met
   - Run verification steps using Playwright MCP
   - Update `passes` field if all steps pass
5. Generate summary report
6. Update claude-progress.txt with results

## Output Format
```
=== Phase N Verification Summary ===

Passing: X/Y
├── feature-id ✓
└── feature-id ✓

Failed: X/Y
└── feature-id ✗ (step N)

Skipped: X/Y (dependencies not met)
├── feature-id (needs: dependency-id)
└── feature-id (needs: dependency-id)

Next priority: <feature-id>
```

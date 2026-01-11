# Windows Setup for Ralph Development

## Prerequisites

```powershell
# Install jq (REQUIRED - undocumented dependency)
winget install jqlang.jq

# Verify
jq --version

# Install Claude Code
npm install -g @anthropic-ai/claude-code
```

## .claude/settings.json

Create in project root:

```json
{
  "permissions": {
    "allow": [
      "Bash(C:\\Program Files\\Git\\usr\\bin\\bash.exe:*)",
      "Bash(C:\\Windows\\System32\\cmd.exe:*)",
      "Read(*)",
      "Write(*)"
    ],
    "deny": []
  },
  "hooks": {
    "shell": "C:\\Program Files\\Git\\usr\\bin\\bash.exe"
  }
}
```

## Git Bash PATH

Add to `~/.bashrc`:

```bash
export PATH="/c/Program Files/Git/usr/bin:$PATH"
export PATH="/c/Program Files/nodejs:$PATH"
```

## CVE-2025-54795 Workaround

For Claude Code v1.0.20+, multi-line bash fails. Use Write tool approach:

```json
{
  "hooks": {
    "stopHook": {
      "useWriteTool": true,
      "stateFile": ".ralph/state.json"
    }
  }
}
```

## Directory Structure

```
project/
├── .claude/
│   └── settings.json
├── .ralph/
│   ├── state.json
│   ├── specs/
│   └── blockers.md (created when blocked)
├── CLAUDE.md
└── src/
```

## Environment Variable

```powershell
# Session
$env:ANTHROPIC_API_KEY = "your-key"

# Permanent (run as admin)
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "your-key", "User")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `jq: command not found` | Install jq, restart terminal |
| `bash: command not found` | Use full path in settings.json |
| Hooks not triggering | Check shell path matches Git Bash location |
| Permission denied | Run `claude --dangerously-skip-permissions` |

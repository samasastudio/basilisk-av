# Ralph Windows Setup Script
# Run in PowerShell as Administrator

Write-Host "=== Ralph Development Framework Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Running without admin rights. Some installations may fail." -ForegroundColor Yellow
    Write-Host ""
}

# 1. Install jq (REQUIRED - undocumented Ralph dependency)
Write-Host "[1/5] Installing jq..." -ForegroundColor Green
$jqInstalled = Get-Command jq -ErrorAction SilentlyContinue
if ($jqInstalled) {
    Write-Host "  jq already installed: $(jq --version)" -ForegroundColor Gray
} else {
    try {
        winget install jqlang.jq --silent --accept-package-agreements --accept-source-agreements
        Write-Host "  jq installed successfully" -ForegroundColor Gray
    } catch {
        Write-Host "  ERROR: Failed to install jq. Install manually: winget install jqlang.jq" -ForegroundColor Red
    }
}

# 2. Verify Node.js
Write-Host "[2/5] Checking Node.js..." -ForegroundColor Green
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "  Node.js installed: $nodeVersion" -ForegroundColor Gray
    
    # Check if version is 18+
    $versionNum = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNum -lt 18) {
        Write-Host "  WARNING: Node.js 18+ recommended. Current: $nodeVersion" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Node.js not found. Installing..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
}

# 3. Verify Git Bash
Write-Host "[3/5] Checking Git Bash..." -ForegroundColor Green
$gitBashPath = "C:\Program Files\Git\usr\bin\bash.exe"
if (Test-Path $gitBashPath) {
    Write-Host "  Git Bash found at: $gitBashPath" -ForegroundColor Gray
} else {
    Write-Host "  Git Bash not found at expected path." -ForegroundColor Yellow
    Write-Host "  Install Git for Windows: winget install Git.Git" -ForegroundColor Yellow
}

# 4. Install Claude Code
Write-Host "[4/5] Installing Claude Code..." -ForegroundColor Green
$claudeInstalled = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeInstalled) {
    Write-Host "  Claude Code already installed" -ForegroundColor Gray
} else {
    npm install -g @anthropic-ai/claude-code
    Write-Host "  Claude Code installed" -ForegroundColor Gray
}

# 5. Create directory structure
Write-Host "[5/5] Creating project structure..." -ForegroundColor Green

$directories = @(
    ".claude",
    ".claude/commands",
    ".ralph",
    ".ralph/specs",
    ".ralph/prompts"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor Gray
    }
}

# Create .claude/settings.json
$settingsPath = ".claude/settings.json"
if (-not (Test-Path $settingsPath)) {
    $settings = @{
        permissions = @{
            allow = @(
                "Bash(C:\\Program Files\\Git\\usr\\bin\\bash.exe:*)",
                "Bash(C:\\Windows\\System32\\cmd.exe:*)",
                "Read(*)",
                "Write(*)"
            )
            deny = @()
        }
        hooks = @{
            shell = "C:\\Program Files\\Git\\usr\\bin\\bash.exe"
        }
    }
    $settings | ConvertTo-Json -Depth 4 | Set-Content $settingsPath
    Write-Host "  Created: $settingsPath" -ForegroundColor Gray
}

# Create initial state file
$statePath = ".ralph/state.json"
if (-not (Test-Path $statePath)) {
    $state = @{
        initialized = (Get-Date -Format "o")
        iteration = 0
        status = "ready"
    }
    $state | ConvertTo-Json | Set-Content $statePath
    Write-Host "  Created: $statePath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Copy CLAUDE.md template to project root and customize" -ForegroundColor Gray
Write-Host "  2. Copy RALPH_CONFIG.md template to project root" -ForegroundColor Gray
Write-Host "  3. Set ANTHROPIC_API_KEY environment variable" -ForegroundColor Gray
Write-Host "  4. Run: claude --dangerously-skip-permissions" -ForegroundColor Gray
Write-Host ""

# Verify API key
if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host "WARNING: ANTHROPIC_API_KEY not set. Set it with:" -ForegroundColor Yellow
    Write-Host '  $env:ANTHROPIC_API_KEY = "your-key-here"' -ForegroundColor Gray
    Write-Host "  Or add to system environment variables for persistence." -ForegroundColor Gray
}

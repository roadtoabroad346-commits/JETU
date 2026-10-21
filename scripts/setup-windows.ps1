param(
  [string]$ProjectPath = "C:\workspace\JETU",
  [string]$Repository = "https://github.com/roadtoabroad346-commits/JETU.git"
)

$ErrorActionPreference = "Stop"
Write-Host "JETU Windows setup" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Git is not installed. Install Git for Windows, then run this script again." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is not installed. Install Node.js 24.19.x, then run this script again." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is not installed or is not on PATH." }

$projectParent = Split-Path -Parent $ProjectPath
New-Item -ItemType Directory -Force -Path $projectParent | Out-Null

if (Test-Path (Join-Path $ProjectPath ".git")) {
  Write-Host "Existing Git checkout found: $ProjectPath" -ForegroundColor Yellow
  git -C $ProjectPath fetch origin
  git -C $ProjectPath pull --ff-only origin main
} elseif (Test-Path $ProjectPath) {
  throw "$ProjectPath exists but is not a Git checkout. Move it aside or choose another -ProjectPath."
} else {
  git clone --branch main $Repository $ProjectPath
}

Push-Location $ProjectPath
try {
  npm ci
  if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Created .env.local from .env.example. Add Supabase values before testing cloud features." -ForegroundColor Yellow
  }
  Write-Host "Running verification..." -ForegroundColor Cyan
  npm run check
  Write-Host "JETU is ready at $ProjectPath" -ForegroundColor Green
  Write-Host "Start development with: npm run dev" -ForegroundColor Green
} finally {
  Pop-Location
}

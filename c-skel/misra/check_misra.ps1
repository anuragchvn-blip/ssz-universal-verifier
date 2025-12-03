# PowerShell script for MISRA C compliance checking on Windows
# SSZ Universal Verifier

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CSkelDir = Split-Path -Parent $ScriptDir
$SrcDir = Join-Path $CSkelDir "src"
$IncludeDir = Join-Path $CSkelDir "include"
$ReportDir = Join-Path $CSkelDir "build\misra"

Write-Host "=== SSZ Universal Verifier - MISRA C:2012 Compliance Analysis ===" -ForegroundColor Cyan
Write-Host ""

# Check if cppcheck is installed
$cppcheck = Get-Command cppcheck -ErrorAction SilentlyContinue
if (-not $cppcheck) {
    Write-Host "ERROR: cppcheck is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download from: https://github.com/danmar/cppcheck/releases"
    Write-Host "Or install via chocolatey: choco install cppcheck"
    exit 1
}

# Create report directory
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

Write-Host "Running MISRA C:2012 compliance checks..." -ForegroundColor Yellow
Write-Host ""

# Get all C source files
$SourceFiles = Get-ChildItem -Path $SrcDir -Filter "*.c" | ForEach-Object { $_.FullName }

# Run cppcheck with MISRA addon
& cppcheck `
    --addon=misra `
    --enable=all `
    --suppress=missingIncludeSystem `
    --inline-suppr `
    --std=c11 `
    --platform=win64 `
    "-I$IncludeDir" `
    $SourceFiles `
    2> "$ReportDir\misra_report.txt"

Write-Host ""
Write-Host "MISRA C compliance check complete" -ForegroundColor Green
Write-Host ""
Write-Host "Report generated: $ReportDir\misra_report.txt"
Write-Host ""

# Parse results
$ReportContent = Get-Content "$ReportDir\misra_report.txt" -ErrorAction SilentlyContinue
if ($ReportContent) {
    $TotalViolations = ($ReportContent | Select-String -Pattern "misra-c").Count
    $MandatoryViolations = ($ReportContent | Select-String -Pattern "misra-c.*Mandatory").Count
    $RequiredViolations = ($ReportContent | Select-String -Pattern "misra-c.*Required").Count
    $AdvisoryViolations = ($ReportContent | Select-String -Pattern "misra-c.*Advisory").Count
} else {
    $TotalViolations = 0
    $MandatoryViolations = 0
    $RequiredViolations = 0
    $AdvisoryViolations = 0
}

Write-Host "=== MISRA C Compliance Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total violations:     $TotalViolations"
Write-Host "  Mandatory:          $MandatoryViolations"
Write-Host "  Required:           $RequiredViolations"
Write-Host "  Advisory:           $AdvisoryViolations"
Write-Host ""

# Show violations if any
if ($TotalViolations -gt 0) {
    Write-Host "Violations:" -ForegroundColor Yellow
    $ReportContent | Select-String -Pattern "misra-c" | Select-Object -First 20
    Write-Host ""
}

# Determine compliance status
if ($MandatoryViolations -eq 0 -and $RequiredViolations -eq 0) {
    Write-Host "✓✓✓ MISRA C COMPLIANCE ACHIEVED ✓✓✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "Zero mandatory/required violations!"
    exit 0
} elseif ($MandatoryViolations -eq 0) {
    Write-Host "⚠ Partial Compliance" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Fix required violations for full compliance."
    exit 1
} else {
    Write-Host "✗ Non-Compliant" -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical: Fix mandatory violations immediately!"
    exit 1
}

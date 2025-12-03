# RISC-V Docker Testing Script for Windows
# Runs SSZ Universal Verifier tests in RISC-V Ubuntu environment

param(
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RISC-V SSZ Universal Verifier Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Check if Docker is available
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

Write-Host "✓ Docker found" -ForegroundColor Green
Write-Host ""

# Pull RISC-V Ubuntu image
Write-Host "Pulling RISC-V Ubuntu 22.04 image..."
docker pull riscv64/ubuntu:22.04
Write-Host ""

# Run tests
Write-Host "Running RISC-V tests in Docker..." -ForegroundColor Yellow
Write-Host "========================================"

$dockerCommand = @"
set -e

# Install build tools
echo 'Installing build tools...'
apt-get update -qq
apt-get install -y -qq build-essential > /dev/null 2>&1

# Show environment
echo ''
echo '=== RISC-V Environment ==='
uname -m
gcc --version | head -n1
echo ''

# Build and run tests
echo '=== Building SSZ Verifier ==='
make clean
make test-riscv

echo ''
echo '✓ All RISC-V tests passed!'
"@

$exitCode = 0
try {
    docker run --rm `
        -v "${ProjectRoot}:/work" `
        -w /work/c-skel `
        riscv64/ubuntu:22.04 `
        bash -c $dockerCommand
    
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
if ($exitCode -eq 0) {
    Write-Host "✓ RISC-V tests PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your SSZ verifier is RISC-V compatible! 🎉"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  - Test with QEMU (Linux/WSL): ./scripts/test-riscv-qemu.sh"
    Write-Host "  - Benchmark on real hardware: VisionFive 2, etc."
    Write-Host "  - Integrate with RISC Zero zkVM"
} else {
    Write-Host "✗ RISC-V tests FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the output above for errors."
}
Write-Host "========================================"

exit $exitCode

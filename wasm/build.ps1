# WASM Build Script for SSZ Universal Verifier (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Building SSZ Verifier WASM..." -ForegroundColor Cyan

# Check if wasm-pack is installed
if (!(Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
    Write-Host "❌ wasm-pack not found. Please install it:" -ForegroundColor Red
    Write-Host "   cargo install wasm-pack" -ForegroundColor Yellow
    exit 1
}

function Build-Target {
    param (
        [string]$Target
    )
    
    Write-Host "📦 Building for target: $Target" -ForegroundColor Green
    wasm-pack build --target $Target --out-dir "pkg-$Target" --release
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed for $Target" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    
    # Optimize with wasm-opt if available
    if (Get-Command wasm-opt -ErrorAction SilentlyContinue) {
        Write-Host "⚡ Optimizing with wasm-opt..." -ForegroundColor Yellow
        $wasmFile = "pkg-$Target/ssz_verifier_wasm_bg.wasm"
        wasm-opt -Oz $wasmFile -o $wasmFile
    }
    
    Write-Host "✅ Built $Target successfully" -ForegroundColor Green
}

# Parse arguments
$target = if ($args.Count -gt 0) { $args[0] } else { "web" }

# Build specified target
Build-Target -Target $target

# Show size
Write-Host ""
Write-Host "📊 Build size:" -ForegroundColor Cyan
Get-ChildItem -Path "pkg-*\ssz_verifier_wasm_bg.wasm" | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "   $($_.FullName): $size KB" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ WASM build complete!" -ForegroundColor Green
Write-Host "📂 Output: wasm/pkg-*/" -ForegroundColor Cyan
